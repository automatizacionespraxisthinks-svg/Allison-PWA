/**
 * Auditoría de integridad de los datos.
 *
 * Las pruebas comprueban que el código haga lo correcto. Esto comprueba
 * que los datos QUE YA EXISTEN sean coherentes: un fallo pasado deja
 * rastro aquí aunque el código ya esté arreglado.
 */
import postgres from "postgres";
import { modoSslOSalir } from "../db/conexion.mjs";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: modoSslOSalir(process.env.DATABASE_URL ?? ""),
  max: 1,
  onnotice: () => {},
});
let problemas = 0;

const revisar = async (descripcion, consulta, detalle) => {
  const filas = await consulta;
  const ok = filas.length === 0;
  console.log(`  ${ok ? "OK   " : "PROBLEMA"}  ${descripcion}${ok ? "" : ` (${filas.length})`}`);
  if (!ok) {
    problemas++;
    filas.slice(0, 5).forEach((f) => console.log(`            ${detalle(f)}`));
  }
};

console.log("\nCUENTAS Y SALDOS");

await revisar(
  "todo usuario tiene fila de saldo",
  sql`select u.id, u.nombre from users u left join saldos s on s.user_id = u.id where s.user_id is null`,
  (f) => `${f.nombre} sin saldo`
);

await revisar(
  "ningún saldo es negativo",
  sql`select user_id, mensajes_plan, mensajes_recarga from saldos where mensajes_plan < 0 or mensajes_recarga < 0`,
  (f) => `plan=${f.mensajes_plan} recarga=${f.mensajes_recarga}`
);

// La comprobación más importante: el saldo debe ser la suma del libro
await revisar(
  "el saldo cuadra con el libro de movimientos",
  sql`
    select u.nombre,
           coalesce(s.mensajes_plan,0) + coalesce(s.mensajes_recarga,0) as saldo,
           coalesce(sum(m.cantidad), 0)::int as libro
      from users u
      left join saldos s on s.user_id = u.id
      left join movimientos_credito m on m.user_id = u.id
     group by u.id, u.nombre, s.mensajes_plan, s.mensajes_recarga
    having coalesce(s.mensajes_plan,0) + coalesce(s.mensajes_recarga,0)
           <> coalesce(sum(m.cantidad), 0)::int
  `,
  (f) => `${f.nombre}: saldo ${f.saldo} vs libro ${f.libro}`
);

console.log("\nIDENTIDAD");

await revisar(
  "todo usuario público tiene correo",
  sql`select id, nombre from users where tipo_acceso = 'email' and email is null`,
  (f) => `${f.nombre}`
);

await revisar(
  "todo alumno de colegio tiene usuario y PIN",
  sql`select id, nombre from users where tipo_acceso = 'institucional' and (username is null or pin_hash is null or institucion_id is null)`,
  (f) => `${f.nombre}`
);

await revisar(
  "no hay correos repetidos",
  sql`select email from users where email is not null group by email having count(*) > 1`,
  (f) => `${f.email}`
);

await revisar(
  "no hay usuarios repetidos dentro de un colegio",
  sql`select institucion_id, username from users where username is not null group by institucion_id, username having count(*) > 1`,
  (f) => `${f.username}`
);

console.log("\nPAGOS");

await revisar(
  "no hay referencias de pago repetidas",
  sql`select pasarela, referencia_externa from transacciones group by pasarela, referencia_externa having count(*) > 1`,
  (f) => `${f.referencia_externa}`
);

await revisar(
  "toda transacción aprobada tiene su movimiento en el libro",
  sql`
    select t.id, t.monto_cop from transacciones t
     where t.estado = 'aprobada' and t.mensajes_otorgados > 0
       and not exists (select 1 from movimientos_credito m where m.transaccion_id = t.id)
  `,
  (f) => `transacción de $${f.monto_cop} acreditada sin registrar`
);

await revisar(
  "ninguna transacción pendiente lleva más de un día",
  sql`select id, monto_cop, creado_en from transacciones where estado = 'pendiente' and creado_en < now() - interval '1 day'`,
  (f) => `$${f.monto_cop} pendiente desde ${f.creado_en.toISOString().slice(0,10)}`
);

console.log("\nCONVERSACIONES Y PROGRESO");

await revisar(
  "no hay mensajes huérfanos",
  sql`select m.id from mensajes m left join conversaciones c on c.id = m.conversacion_id where c.id is null`,
  (f) => `${f.id}`
);

await revisar(
  "las correcciones se guardan como arreglo",
  sql`select id from mensajes where jsonb_typeof(correcciones) <> 'array'`,
  (f) => `${f.id}`
);

await revisar(
  "todo error frecuente tiene tema",
  sql`select id, texto_error from errores_frecuentes where tema is null`,
  (f) => `${f.texto_error}`
);

await revisar(
  "toda conversación tiene fecha de borrado",
  sql`select id from conversaciones where borrar_despues_de is null`,
  (f) => `${f.id}`
);

/**
 * Esta comprobación necesita el currículo, que vive en TypeScript.
 *
 * Dentro del contenedor de producción no hay código fuente — solo la
 * aplicación compilada —, así que ahí el import falla. En vez de
 * reventar a media auditoría y dejar las comprobaciones siguientes sin
 * correr, se salta ESTA y lo dice en voz alta: una comprobación
 * omitida en silencio es peor que no tenerla, porque el informe
 * parecería completo.
 */
const claves = await import("../src/lib/curriculo.ts")
  .then((m) => m.UNIDADES.map((u) => u.clave))
  .catch(() => null);

if (claves === null) {
  console.log(
    "  OMITIDA  toda lección en progreso existe en el currículo\n" +
      "           (no hay código fuente aquí; córrela desde el proyecto)"
  );
} else {
  await revisar(
    "toda lección en progreso existe en el currículo",
    sql`
      select distinct leccion from (
        select leccion from progreso_lecciones
        union all
        select leccion from conversaciones where leccion is not null
      ) t where leccion <> all(${claves})
    `,
    (f) => `clave desconocida: ${f.leccion}`
  );
}

await revisar(
  "una lección completada tiene al menos un logro",
  sql`select user_id, leccion from progreso_lecciones
       where completada_en is not null and logros < 1`,
  (f) => `${f.leccion} de ${f.user_id}`
);

await revisar(
  "toda conversación de modo lección tiene su clave (y al revés)",
  sql`select id from conversaciones
       where (modo = 'leccion') <> (leccion is not null)`,
  (f) => `${f.id}`
);

console.log(
  problemas === 0
    ? "\nSin problemas de integridad.\n"
    : `\n${problemas} comprobación(es) con problemas.\n`
);
process.exitCode = problemas === 0 ? 0 : 1;
await sql.end();
