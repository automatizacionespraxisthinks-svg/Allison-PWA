/**
 * Crea un colegio de prueba con alumnos, para probar el ingreso sin correo.
 * Es el germen de la carga masiva real: mismos pasos, pero leyendo un CSV.
 *
 *   node --env-file=.env scripts/sembrar-colegio.mjs
 */
import bcrypt from "bcryptjs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 1,
  onnotice: () => {},
});

const CODIGO = "COLEGIO2026";
const GRATIS = Number(process.env.MENSAJES_PRUEBA_GRATIS ?? 20);

const ALUMNOS = [
  { username: "ana.garcia",   nombre: "Ana García",       nivel: "A1", pin: "1234" },
  { username: "luis.torres",  nombre: "Luis Torres",      nivel: "A2", pin: "5678" },
  { username: "coordinador",  nombre: "Marta Coordinadora", nivel: "B2", pin: "9999", rol: "coordinador" },
];

const [colegio] = await sql`
  insert into instituciones (nombre, nit, codigo_acceso, contacto_email, cupo_alumnos)
  values ('Colegio de Prueba', '900123456-7', ${CODIGO}, 'rector@colegio.edu.co', 500)
  on conflict (codigo_acceso) do update set nombre = excluded.nombre
  returning id
`;

for (const a of ALUMNOS) {
  const pinHash = await bcrypt.hash(a.pin, 12);
  const [u] = await sql`
    insert into users (tipo_acceso, institucion_id, username, pin_hash, nombre, nivel, rol)
    values ('institucional', ${colegio.id}, ${a.username}, ${pinHash},
            ${a.nombre}, ${a.nivel}, ${a.rol ?? "estudiante"})
    on conflict (institucion_id, username)
      do update set pin_hash = excluded.pin_hash, nombre = excluded.nombre
    returning id
  `;
  // El saldo y el libro se escriben SIEMPRE juntos. Un saldo sin
  // movimiento que lo respalde descuadra la contabilidad, y el descuadre
  // solo aparece meses después cuando alguien reclama.
  const [saldo] = await sql`
    insert into saldos (user_id, mensajes_recarga) values (${u.id}, ${GRATIS})
    on conflict (user_id) do update set mensajes_recarga = ${GRATIS}
    returning mensajes_plan, mensajes_recarga
  `;
  const [previo] = await sql`
    select coalesce(sum(cantidad), 0)::int as total
      from movimientos_credito where user_id = ${u.id}
  `;
  const diferencia = saldo.mensajes_plan + saldo.mensajes_recarga - previo.total;
  if (diferencia !== 0) {
    await sql`
      insert into movimientos_credito
        (user_id, tipo, bolsa, cantidad, saldo_plan_despues,
         saldo_recarga_despues, nota)
      values
        (${u.id}, 'bono', 'recarga', ${diferencia},
         ${saldo.mensajes_plan}, ${saldo.mensajes_recarga},
         'Prueba al cargar el alumno desde el colegio')
    `;
  }
}

console.log(`Colegio listo. Código de acceso: ${CODIGO}`);
for (const a of ALUMNOS) {
  console.log(`  ${a.username.padEnd(14)} PIN ${a.pin}   ${a.nombre} (${a.rol ?? "estudiante"})`);
}
await sql.end();
