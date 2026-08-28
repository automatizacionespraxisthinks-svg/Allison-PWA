/**
 * Crea (o reinicia) el alumno de demostración con sus 20 mensajes de prueba.
 * Sirve para probar la conversación mientras no existe la autenticación.
 *
 *   node --env-file=.env scripts/sembrar-demo.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 1,
  onnotice: () => {},
});

const EMAIL = "demo@allison.co";
const MENSAJES = Number(process.env.MENSAJES_PRUEBA_GRATIS ?? 20);

const [alumno] = await sql`
  insert into users (tipo_acceso, email, nombre, nivel)
  values ('email', ${EMAIL}, 'Alumno demo', 'A2')
  on conflict (email) do update set nombre = excluded.nombre
  returning id
`;

await sql`
  insert into saldos (user_id, mensajes_plan, mensajes_recarga)
  values (${alumno.id}, 0, ${MENSAJES})
  on conflict (user_id) do update set mensajes_recarga = ${MENSAJES},
                                      mensajes_plan = 0,
                                      actualizado_en = now()
`;

console.log(`Alumno demo listo (${EMAIL}) con ${MENSAJES} mensajes.`);
await sql.end();
