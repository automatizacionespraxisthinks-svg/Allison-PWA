/**
 * Prueba del sistema de créditos — la pieza más delicada del negocio.
 *
 * Verifica que:
 *   1. Se gasta PRIMERO la bolsa del plan y solo después la de recarga
 *   2. Al quedarse sin saldo devuelve false en vez de dejarlo en negativo
 *   3. Cada consumo queda registrado en el libro de movimientos
 *
 *   node --env-file=.env scripts/probar-creditos.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 1,
  onnotice: () => {},
});

let fallos = 0;
const verificar = (descripcion, condicion) => {
  console.log(`  ${condicion ? "OK  " : "FALLA"}  ${descripcion}`);
  if (!condicion) fallos++;
};

try {
  const [alumno] = await sql`
    insert into users (tipo_acceso, email, nombre, nivel)
    values ('email', ${`prueba-${Date.now()}@ejemplo.co`}, 'Alumno de prueba', 'A2')
    returning id
  `;

  // 2 mensajes de plan (caducan) + 1 de recarga (no caduca)
  await sql`
    insert into saldos (user_id, mensajes_plan, mensajes_recarga)
    values (${alumno.id}, 2, 1)
  `;

  console.log("\nOrden de consumo (primero el plan, después la recarga):");
  for (const esperado of ["plan", "plan", "recarga"]) {
    const [{ consumir_mensaje: ok }] =
      await sql`select consumir_mensaje(${alumno.id}, null)`;
    const [ultimo] = await sql`
      select bolsa from movimientos_credito
      where user_id = ${alumno.id} order by id desc limit 1
    `;
    verificar(`gasta de la bolsa "${esperado}"`, ok && ultimo.bolsa === esperado);
  }

  console.log("\nSin saldo:");
  const [{ consumir_mensaje: sinSaldo }] =
    await sql`select consumir_mensaje(${alumno.id}, null)`;
  verificar("devuelve false en vez de dejar el saldo negativo", sinSaldo === false);

  const [saldo] = await sql`
    select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}
  `;
  verificar(
    "el saldo queda en cero, nunca negativo",
    saldo.mensajes_plan === 0 && saldo.mensajes_recarga === 0
  );

  console.log("\nLibro de movimientos:");
  const [{ count }] = await sql`
    select count(*)::int from movimientos_credito where user_id = ${alumno.id}
  `;
  verificar("quedaron registrados los 3 consumos", count === 3);

  console.log("\nIdempotencia de pagos:");
  const referencia = `REF-PRUEBA-${Date.now()}`;
  await sql`
    insert into transacciones (user_id, tipo, monto_cop, pasarela, referencia_externa, estado)
    values (${alumno.id}, 'recarga', 20000, 'wompi', ${referencia}, 'aprobada')
  `;
  let rechazado = false;
  try {
    await sql`
      insert into transacciones (user_id, tipo, monto_cop, pasarela, referencia_externa, estado)
      values (${alumno.id}, 'recarga', 20000, 'wompi', ${referencia}, 'aprobada')
    `;
  } catch {
    rechazado = true;
  }
  verificar("el webhook repetido se rechaza (no acredita dos veces)", rechazado);

  // Los movimientos y las transacciones son RESTRICT a propósito: un usuario
  // con historial financiero no se puede borrar de un plumazo. En producción
  // los usuarios se desactivan (activo = false), nunca se eliminan.
  await sql`delete from movimientos_credito where user_id = ${alumno.id}`;
  await sql`delete from transacciones where user_id = ${alumno.id}`;
  await sql`delete from users where id = ${alumno.id}`;

  console.log(
    fallos === 0
      ? "\nTodas las pruebas pasaron.\n"
      : `\n${fallos} prueba(s) fallaron.\n`
  );
  process.exitCode = fallos === 0 ? 0 : 1;
} catch (e) {
  console.error("\nError:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
