/**
 * db/manual/base-completa.sql contra una base VACÍA de verdad.
 *
 * Es el archivo con el que nace una base de producción, así que un
 * fallo aquí es una plataforma que no arranca. No se puede simular: hay
 * que crear una base vacía, correrlo, y comprobar que lo que queda es
 * exactamente lo que dejarían las migraciones una por una — y que el
 * administrador puede ENTRAR con su contraseña.
 *
 * Crea una base temporal en el mismo servidor y la borra al terminar.
 * Necesita un usuario con permiso para crear bases (el 'postgres' del
 * VPS lo tiene). No corre dentro de npm run revisar por eso mismo.
 *
 *   DATABASE_URL=postgresql://postgres:...@host:puerto/allison?sslmode=disable node scripts/probar-base-completa.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL (la de un servidor donde puedas crear bases).");
  process.exit(1);
}

const BASE_PRUEBA = "allison_prueba_base";
const opciones = {
  ssl: url.includes("sslmode=disable") ? false : "require",
  max: 1,
  onnotice: () => {},
};
const conBase = (nombre) => url.replace(/\/[^/?]+(\?|$)/, `/${nombre}$1`);

const original = readFileSync("db/manual/base-completa.sql", "utf8");
const semilla = readFileSync("db/manual/semilla-admin.sql", "utf8");
const numeradas = readdirSync("db").filter((f) => /^\d{3}_.+\.sql$/.test(f));

const clave = "ClaveDeLaBase2026!";
const conDatos = (texto, email, clave) =>
  texto
    .replace("'praxisthinks@gmail.com'::text", `'${email}'::text`)
    .replace("'CAMBIA-ESTA-CLAVE'::text", `'${clave}'::text`);

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};
const falloEsperado = async (fn, patron) => {
  try {
    await fn();
    return "no falló";
  } catch (e) {
    return patron.test(e.message) ? null : e.message.slice(0, 80);
  }
};
const correr = (script, urlBase) =>
  spawnSync(process.execPath, [script], {
    env: { ...process.env, DATABASE_URL: urlBase },
    encoding: "utf8",
  });

// --- una base vacía ---------------------------------------------------
const admin = postgres(conBase("postgres"), opciones);
await admin.unsafe(`drop database if exists ${BASE_PRUEBA}`);
await admin.unsafe(`create database ${BASE_PRUEBA}`);
const sql = postgres(conBase(BASE_PRUEBA), opciones);
const tablas = async () =>
  (await sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`)[0].n;

console.log(`Base completa (en ${BASE_PRUEBA}, temporal):`);

try {
  // 1. Tal cual viene, con la clave de ejemplo: no debe tocar la base.
  probar(
    "se niega a correr con la clave de ejemplo",
    (await falloEsperado(() => sql.unsafe(original), /Cambia la contraseña/)) === null
  );
  probar("y deja la base vacía, sin crear ni una tabla", (await tablas()) === 0);

  // 2. Con datos reales: crea todo.
  await sql.unsafe(conDatos(original, "admin@allison.local", clave));
  const n = await tablas();
  probar(`crea el esquema completo (${n} tablas)`, n >= 19, `solo ${n}`);
  probar(
    "existen las tablas que la app da por hechas",
    (await sql`select to_regclass('users') u, to_regclass('saldos') s, to_regclass('planes') p, to_regclass('uso_diario') d`)[0].d !== null
  );

  const registradas = (await sql`select archivo from migraciones order by 1`).map((f) => f.archivo);
  probar(
    `registra las ${numeradas.length} migraciones como aplicadas`,
    registradas.length === numeradas.length && numeradas.every((m) => registradas.includes(m)),
    `registradas ${registradas.length}`
  );

  const [planes] = await sql`select count(*)::int as n from planes`;
  probar("siembra los planes", planes.n === 3, `hay ${planes.n}`);

  const [a] = await sql`
    select u.rol, u.password_hash, s.user_id is not null as tiene_saldo
      from users u left join saldos s on s.user_id = u.id
     where u.email = 'admin@allison.local'`;
  probar("crea el administrador", a?.rol === "admin");
  probar("con su fila de saldo", a?.tiene_saldo === true);
  probar("y puede ENTRAR con su contraseña", await bcrypt.compare(clave, a.password_hash));

  // 3. Correrlo otra vez sobre la base ya creada: se niega, sin daños.
  probar(
    "sobre una base que ya tiene esquema, se niega con un mensaje claro",
    (await falloEsperado(
      () => sql.unsafe(conDatos(original, "otro@allison.local", clave)),
      /ya tiene el esquema/
    )) === null
  );
  const [u] = await sql`select count(*)::int as n from users`;
  probar("y no crea nada", u.n === 1);

  // 4. Lo que de verdad importa: la base es INDISTINGUIBLE de una
  //    migrada paso a paso. migrar.mjs debe no tener nada que hacer, y
  //    la auditoría de integridad debe pasar.
  const m = correr("scripts/migrar.mjs", conBase(BASE_PRUEBA));
  probar(
    "scripts/migrar.mjs no encuentra nada pendiente",
    m.status === 0 && /ya estaba al día/.test(m.stdout),
    (m.stdout + m.stderr).trim().split("\n").pop()
  );
  const au = correr("scripts/auditar.mjs", conBase(BASE_PRUEBA));
  probar(
    "scripts/auditar.mjs no encuentra problemas de integridad",
    au.status === 0 && /Sin problemas/.test(au.stdout),
    (au.stdout + au.stderr).trim().split("\n").pop()
  );

  // 5. La semilla del administrador funciona sobre esta base.
  await sql.unsafe(conDatos(semilla, "segundo@allison.local", clave));
  const [dos] = await sql`select count(*)::int as n from users where rol = 'admin'`;
  probar("semilla-admin.sql agrega otro administrador sobre la base creada", dos.n === 2);
} finally {
  await sql.end();
  await admin.unsafe(`drop database if exists ${BASE_PRUEBA}`);
  await admin.end();
  console.log(`\n  (limpieza: ${BASE_PRUEBA} borrada)`);
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("Base completa correcta.");
