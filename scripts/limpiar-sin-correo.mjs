/** Borra cuentas de prueba públicas que no tengan correo. Solo desarrollo. */
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1, onnotice: () => {} });

const ids = await sql`
  select id, nombre from users
   where tipo_acceso = 'email' and email is null and institucion_id is null
`;
for (const u of ids) {
  await sql`delete from movimientos_credito where user_id = ${u.id}`;
  await sql`delete from transacciones where user_id = ${u.id}`;
  await sql`delete from users where id = ${u.id}`;
  console.log(`  eliminado: ${u.nombre}`);
}
console.log(`${ids.length} cuenta(s) sin correo eliminadas.`);
await sql.end();
