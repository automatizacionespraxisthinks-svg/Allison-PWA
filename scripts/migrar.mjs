/**
 * Aplica los archivos .sql de db/ en orden, una sola vez cada uno.
 *
 * Lleva registro en la tabla `migraciones`: volver a correrlo no repite
 * lo ya aplicado. Se usa igual en desarrollo y en producción; lo único
 * que cambia es DATABASE_URL.
 *
 *   node --env-file=.env scripts/migrar.mjs
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

try {
  await sql`
    create table if not exists migraciones (
      archivo    text primary key,
      aplicada_en timestamptz not null default now()
    )
  `;

  const aplicadas = new Set(
    (await sql`select archivo from migraciones`).map((f) => f.archivo)
  );

  const carpeta = join(process.cwd(), "db");
  const archivos = readdirSync(carpeta).filter((f) => f.endsWith(".sql")).sort();

  let nuevas = 0;
  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) {
      console.log(`  ya aplicada   ${archivo}`);
      continue;
    }
    process.stdout.write(`  aplicando     ${archivo} ... `);
    await sql.unsafe(readFileSync(join(carpeta, archivo), "utf8"));
    await sql`insert into migraciones (archivo) values (${archivo})`;
    console.log("ok");
    nuevas++;
  }

  console.log(
    nuevas === 0 ? "\nLa base ya estaba al día." : `\n${nuevas} migración(es) aplicada(s).`
  );
} catch (e) {
  console.error("\nError:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
