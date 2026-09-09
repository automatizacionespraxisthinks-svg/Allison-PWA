/**
 * El cifrado de la conexión a Postgres (db/conexion.mjs).
 *
 * Existe por un error que apareció dos veces en producción: la app
 * exigía TLS contra un Postgres que no lo tiene, y el fallo era un
 * "socket disconnected before secure TLS connection was established"
 * que no explicaba nada. La respuesta fácil era sslmode=disable; la
 * correcta es distinguir DÓNDE está la base: dentro del servidor (red
 * interna de Docker) el texto plano no sale de la máquina; hacia
 * internet, jamás.
 *
 *   node scripts/probar-conexion.mjs
 *
 * Con PROBAR_CONEXION_URL apuntando a un servidor real, además
 * comprueba contra él que "prefer" conecta y muestra qué hace "require":
 *
 *   PROBAR_CONEXION_URL=postgresql://... node scripts/probar-conexion.mjs
 */
import postgres from "postgres";
import { esHostInterno, modoSsl } from "../db/conexion.mjs";

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};
const url = (host, extra = "") => `postgresql://usuario:clave@${host}/allison${extra}`;

console.log("Cifrado de la conexión a Postgres:");

// --- qué es interno y qué no --------------------------------------------
const internos = [
  "allison-postgres-a1b2c3:5432", // nombre de servicio de Docker
  "localhost:5432",
  "127.0.0.1:5432",
  "10.0.0.5:5432",
  "172.18.0.3:5432", // la red por defecto de Docker
  "192.168.1.10:5432",
  "postgres.internal:5432",
  "[::1]:5432",
];
for (const h of internos) {
  probar(`${h.padEnd(30)} es interno  → prefer`, modoSsl(url(h), "production") === "prefer");
}

const publicos = [
  "ep-x.us-east-2.aws.neon.tech", // Neon
  "46.225.66.78:5421", // la IP pública del VPS
  "172.32.0.1:5432", // 172.32 NO es privada: la privada llega a 172.31
  "8.8.8.8",
];
for (const h of publicos) {
  probar(`${h.padEnd(30)} es público  → require`, modoSsl(url(h), "production") === "require");
}

// --- sslmode=disable ---------------------------------------------------
probar(
  "sslmode=disable hacia un host interno → sin cifrar (no sale del servidor)",
  modoSsl(url("allison-postgres-x:5432", "?sslmode=disable"), "production") === false
);

let error = null;
try {
  modoSsl(url("46.225.66.78:5421", "?sslmode=disable"), "production");
} catch (e) {
  error = e;
}
probar(
  "en PRODUCCIÓN, sslmode=disable hacia una IP pública se RECHAZA",
  error !== null && /en claro/.test(error.message),
  error ? error.message.slice(0, 60) : "no lanzó"
);
probar(
  "y el mensaje dice qué hacer (usar el nombre interno)",
  /nombre interno/.test(error?.message ?? "")
);

const avisos = [];
const warnOriginal = console.warn;
console.warn = (m) => avisos.push(String(m));
const enDesarrollo = modoSsl(url("46.225.66.78:5421", "?sslmode=disable"), "development");
console.warn = warnOriginal;
probar(
  "en desarrollo lo permite, pero AVISA",
  enDesarrollo === false && avisos.length === 1 && /en claro/.test(avisos[0])
);

// --- no se puede rebajar el cifrado hacia afuera ------------------------
probar(
  "sslmode=prefer hacia un host público NO rebaja a texto plano → require",
  modoSsl(url("46.225.66.78:5421", "?sslmode=prefer"), "production") === "require"
);
probar(
  "sslmode=require hacia un host interno se respeta",
  modoSsl(url("allison-postgres-x:5432", "?sslmode=require"), "production") === "require"
);

// --- ante la duda, público -----------------------------------------------
probar(
  "una URL ilegible se trata como pública → require",
  modoSsl("esto no es una url", "production") === "require"
);
// Una clave con # sin codificar rompe la URL: ni el host ni el sslmode se
// pueden leer. Lo único que importa es que eso NUNCA termine en texto
// plano: o exige TLS o se rechaza, cualquiera de las dos vale.
let conUrlRota;
try {
  conUrlRota = modoSsl(
    "postgresql://postgres:cla#ve@allison-postgres-x:5432/allison?sslmode=disable",
    "production"
  );
} catch {
  conUrlRota = "rechazada";
}
probar(
  "una clave que rompe la URL no cuela texto plano",
  conUrlRota !== false,
  String(conUrlRota)
);
probar("esHostInterno('') es falso", esHostInterno("") === false);

// --- contra un servidor real, si se pide ----------------------------------
const real = process.env.PROBAR_CONEXION_URL;
if (real) {
  console.log("\nContra el servidor real:");
  const abrir = (ssl) =>
    postgres(real, { ssl, max: 1, connect_timeout: 10, onnotice: () => {} });

  const conPrefer = abrir("prefer");
  try {
    await conPrefer`select 1`;
    probar("con 'prefer' conecta, tenga o no TLS el servidor", true);
  } catch (e) {
    probar("con 'prefer' conecta", false, e.message.slice(0, 70));
  } finally {
    await conPrefer.end({ timeout: 2 }).catch(() => {});
  }

  const conRequire = abrir("require");
  try {
    await conRequire`select 1`;
    console.log("  info  este servidor SÍ tiene TLS: 'require' también conecta");
  } catch (e) {
    console.log(
      `  info  este servidor NO tiene TLS: 'require' falla con "${e.message.slice(0, 55)}…"\n` +
        "        — el síntoma exacto que 'prefer' resuelve en la red interna"
    );
  } finally {
    await conRequire.end({ timeout: 2 }).catch(() => {});
  }
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nCifrado de la conexión correcto.");
