/**
 * Prueba del borrado a los 20 días.
 *
 * Lo que importa no es que borre, sino que borre SOLO lo que debe: el
 * progreso del alumno tiene que sobrevivir intacto. Un borrado que se
 * lleve por delante la racha o los temas dominados sería peor que no
 * borrar nada.
 *
 *   node --env-file=.env scripts/probar-retencion.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1, onnotice: () => {} });
let fallos = 0;
const verificar = (d, ok) => {
  console.log(`  ${ok ? "OK   " : "FALLA"}  ${d}`);
  if (!ok) fallos++;
};

try {
  const [u] = await sql`
    insert into users (tipo_acceso, email, nombre, nivel)
    values ('email', ${`retencion-${Date.now()}@ejemplo.co`}, 'Alumno retención', 'A2')
    returning id`;

  await sql`insert into saldos (user_id, mensajes_recarga) values (${u.id}, 10)`;

  // Una conversación vieja (vencida) y una reciente
  const [vieja] = await sql`
    insert into conversaciones (user_id, nivel_al_iniciar, iniciada_en, borrar_despues_de)
    values (${u.id}, 'A2', now() - interval '25 days', current_date - 5)
    returning id`;
  const [nueva] = await sql`
    insert into conversaciones (user_id, nivel_al_iniciar)
    values (${u.id}, 'A2') returning id`;

  for (const c of [vieja.id, nueva.id]) {
    await sql`
      insert into mensajes (conversacion_id, user_id, rol, texto)
      values (${c}, ${u.id}, 'alumno', 'hola')`;
  }

  // Progreso que NO debe desaparecer
  await sql`select registrar_practica(${u.id}, 30, 1)`;
  await sql`select registrar_error(${u.id}, 'gramatica', 'I go', 'I went', 'pasado')`;
  for (let i = 0; i < 6; i++) await sql`select registrar_practica(${u.id}, 20, 0)`;

  const antes = await sql`
    select (select count(*)::int from conversaciones where user_id = ${u.id}) as conv,
           (select count(*)::int from mensajes where user_id = ${u.id})       as msj,
           (select racha_dias from users where id = ${u.id})                  as racha,
           (select turnos_limpios from errores_frecuentes where user_id = ${u.id}) as limpios,
           (select count(*)::int from progreso_diario where user_id = ${u.id}) as dias`;

  console.log("\nAntes del borrado:");
  console.log(`  ${antes[0].conv} conversaciones · ${antes[0].msj} mensajes · racha ${antes[0].racha} · ${antes[0].limpios} turnos limpios`);

  const [{ borrar_conversaciones_vencidas: borradas }] =
    await sql`select borrar_conversaciones_vencidas()`;

  const d = (await sql`
    select (select count(*)::int from conversaciones where user_id = ${u.id}) as conv,
           (select count(*)::int from mensajes where user_id = ${u.id})       as msj,
           (select racha_dias from users where id = ${u.id})                  as racha,
           (select turnos_limpios from errores_frecuentes where user_id = ${u.id}) as limpios,
           (select count(*)::int from progreso_diario where user_id = ${u.id}) as dias,
           (select count(*)::int from saldos where user_id = ${u.id})         as saldo`)[0];

  console.log(`\nDespués del borrado (${borradas} conversaciones eliminadas):`);
  verificar("la conversación vencida se borró", d.conv === 1);
  verificar("la conversación reciente se conservó", d.conv === 1 && d.msj === 1);
  verificar("la racha sobrevive", d.racha === antes[0].racha);
  verificar("los turnos limpios sobreviven", d.limpios === antes[0].limpios);
  verificar("el progreso diario sobrevive", d.dias === antes[0].dias);
  verificar("el saldo sobrevive", d.saldo === 1);

  await sql`delete from errores_frecuentes where user_id = ${u.id}`;
  await sql`delete from progreso_diario where user_id = ${u.id}`;
  await sql`delete from conversaciones where user_id = ${u.id}`;
  await sql`delete from saldos where user_id = ${u.id}`;
  await sql`delete from users where id = ${u.id}`;

  console.log(fallos === 0 ? "\nTodas las pruebas pasaron.\n" : `\n${fallos} fallaron.\n`);
  process.exitCode = fallos === 0 ? 0 : 1;
} catch (e) {
  console.error("\nError:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
