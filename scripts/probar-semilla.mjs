/**
 * La semilla de produccion (db/semilla-produccion.sql).
 *
 * Crea el administrador con el que se entra por primera vez a una base
 * nueva, asi que un fallo aqui deja la plataforma sin dueno. Se prueba
 * contra una base DE VERDAD porque lo que hay que comprobar es que
 * Postgres acepte el SQL y que la aplicacion pueda verificar la
 * contrasena que Postgres genero: eso no se puede simular.
 *
 * Los usuarios que crea se borran al terminar.
 *
 *   DATABASE_URL=... node scripts/probar-semilla.mjs
 */
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Ejemplo:");
  console.error("  DATABASE_URL= npm run probar:semilla");
  process.exit(1);
}
const sql = postgres(url, {
  ssl: url.includes("sslmode=disable") ? false : "require",
  max: 1,
  onnotice: () => {},
});

const original = readFileSync("db/semilla-produccion.sql", "utf8");
let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

const correo = "semilla.prueba@allison.local";
const clave1 = "ClaveDeSemilla2026!";
const clave2 = "OtraClaveDistinta2026!";

const conDatos = (email, nombre, clave) =>
  original
    .replace("'praxisthinks@gmail.com'::text", `'${email}'::text`)
    .replace("'Praxis Admin'::text", `'${nombre}'::text`)
    .replace("'CAMBIA-ESTA-CLAVE'::text", `'${clave}'::text`);

console.log("Semilla de producción:");

// 1. El candado: tal cual viene, debe negarse a correr
try {
  await sql.unsafe(original);
  probar("se niega a correr con la clave de ejemplo", false, "la aceptó");
} catch (e) {
  probar(
    "se niega a correr con la clave de ejemplo",
    /Cambia la contraseña/.test(e.message),
    e.message.slice(0, 60)
  );
}

// 2. Y con una clave corta
try {
  await sql.unsafe(conDatos(correo, "Corta", "corta"));
  probar("rechaza una contraseña corta", false, "la aceptó");
} catch (e) {
  probar("rechaza una contraseña corta", /demasiado corta/.test(e.message));
}

// 3. Con datos buenos, crea el administrador
await sql.unsafe(conDatos(correo, "Admin Semilla", clave1));
const [creado] = await sql`
  select u.rol, u.nivel, u.password_hash, u.version_legal,
         u.email_verificado_en is not null as verificado,
         u.acepto_terminos_en is not null as acepto,
         s.user_id is not null as tiene_saldo,
         (s.mensajes_plan + s.mensajes_recarga) as saldo
    from users u left join saldos s on s.user_id = u.id
   where u.email = ${correo}`;

probar("crea el usuario con rol admin", creado?.rol === "admin");
probar("le crea su fila de saldo", creado?.tiene_saldo === true);
probar("el saldo queda en cero (no ensucia el libro)", Number(creado?.saldo) === 0);
probar("marca el correo como verificado", creado?.verificado === true);
probar("registra el consentimiento y su versión", creado?.acepto === true && creado?.version_legal === "2026-08-29");

// 4. LO QUE IMPORTA: que pueda entrar con esa contraseña
probar(
  "el administrador puede entrar con esa contraseña",
  await bcrypt.compare(clave1, creado.password_hash)
);
probar(
  "y no con otra",
  !(await bcrypt.compare("cualquier-otra", creado.password_hash))
);

// 5. Idempotente: correrlo otra vez con OTRA clave no debe pisar la
//    contraseña existente (si no, un segundo pase devolvería el acceso
//    a quien tuviera el archivo viejo).
await sql.unsafe(conDatos(correo, "Admin Semilla", clave2));
const [segunda] = await sql`select password_hash from users where email = ${correo}`;
probar(
  "correrla dos veces NO pisa la contraseña ya puesta",
  await bcrypt.compare(clave1, segunda.password_hash)
);
const [cuantos] = await sql`select count(*)::int as n from users where email = ${correo}`;
probar("no duplica el usuario", cuantos.n === 1);

// 6. Y asciende a admin a un usuario que ya existiera como estudiante
const otro = "semilla.estudiante@allison.local";
await sql`
  insert into users (tipo_acceso, email, nombre, rol, password_hash)
  values ('email', ${otro}, 'Ya Existia', 'estudiante', 'hash-viejo')
  on conflict (email) do nothing`;
await sql.unsafe(conDatos(otro, "Ya Existia", clave1));
const [ascendido] = await sql`select rol, password_hash from users where email = ${otro}`;
probar("asciende a admin a un usuario que ya existía", ascendido?.rol === "admin");
probar(
  "y tampoco le cambia la contraseña",
  ascendido?.password_hash === "hash-viejo"
);

// Limpieza: la base de producción queda como estaba
await sql`delete from users where email in (${correo}, ${otro})`;
const [quedan] = await sql`select count(*)::int as n from users`;
console.log(`\n  (limpieza: la base queda con ${quedan.n} usuarios)`);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("Semilla correcta.");
await sql.end();
