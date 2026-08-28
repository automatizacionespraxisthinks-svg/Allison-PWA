/** Borra los usuarios de prueba que dejen las corridas interrumpidas. */
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1, onnotice: () => {} });
const like = "prueba-%";
await sql`delete from movimientos_credito where user_id in (select id from users where email like ${like})`;
await sql`delete from transacciones where user_id in (select id from users where email like ${like})`;
const borrados = await sql`delete from users where email like ${like} returning id`;
console.log(`Usuarios de prueba eliminados: ${borrados.length}`);
await sql.end();
