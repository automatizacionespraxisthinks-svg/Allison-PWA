/**
 * Aplica los archivos .sql de db/ en orden alfabético.
 *
 * Se usa igual en desarrollo y en producción: solo cambia DATABASE_URL.
 *   node scripts/migrar.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Revisa el archivo .env");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1, onnotice: () => {} });

const carpeta = join(process.cwd(), "db");
const archivos = readdirSync(carpeta)
  .filter((f) => f.endsWith(".sql"))
  .sort();

try {
  for (const archivo of archivos) {
    const contenido = readFileSync(join(carpeta, archivo), "utf8");
    process.stdout.write(`Aplicando ${archivo}... `);
    await sql.unsafe(contenido);
    console.log("ok");
  }

  const tablas = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `;
  console.log(`\n${tablas.length} tablas creadas:`);
  for (const t of tablas) console.log("  -", t.table_name);
} catch (e) {
  console.error("\nError:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
