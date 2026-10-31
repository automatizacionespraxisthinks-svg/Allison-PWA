/**
 * Borra los usuarios de prueba que dejen las corridas interrumpidas.
 *
 * Solo los de los scripts de prueba: correo en el dominio @ejemplo.co
 * (el que usan todos, y el que el panel ya excluye como cuentas de
 * prueba) y con el prefijo de alguno de ellos. Antes borraba a cualquiera
 * cuyo correo empezara por "prueba-": un cliente real registrado como
 * prueba-…@gmail.com perdía su cuenta y su libro (auditoría, 30 de
 * octubre de 2026).
 *
 *   node --env-file=.env scripts/limpiar-pruebas.mjs
 */
import postgres from "postgres";
import { modoSslOSalir } from "../db/conexion.mjs";

// Candado contra producción (auditoría, 30 de octubre de 2026): este
// script BORRA en la base de DATABASE_URL, también del libro de
// movimientos, y DATABASE_URL se apunta a producción por un túnel para
// migrar. Se niega si DATABASE_URL es la de DATABASE_URL_PRODUCCION o si
// NODE_ENV es production. Para correrlo ahí a propósito: SI_ES_PRODUCCION=1.
{
  const destino = (u) => {
    try {
      const x = new URL(u);
      return `${decodeURIComponent(x.username)}@${x.hostname}:${x.port || "5432"}${x.pathname}`;
    } catch {
      return u.trim();
    }
  };
  const url = process.env.DATABASE_URL ?? "";
  const produccion = process.env.DATABASE_URL_PRODUCCION ?? "";
  const esProduccion =
    process.env.NODE_ENV === "production" || (produccion.trim() !== "" && destino(url) === destino(produccion));
  if (esProduccion && process.env.SI_ES_PRODUCCION !== "1") {
    console.error(
      "Este script borra en la base y DATABASE_URL apunta a producción (o NODE_ENV=production): no se corre.\n" +
        "Si de verdad es lo que quieres, vuelve a correrlo con SI_ES_PRODUCCION=1."
    );
    process.exit(1);
  }
}

/**
 * Los correos que crean los scripts: prueba- (probar-creditos), cobro-
 * (probar-cobro), renovacion- (probar-renovacion), conc-
 * (probar-concurrencia), reportes- (probar-reportes) y retencion-
 * (probar-retencion), todos @ejemplo.co. Si un script nuevo crea
 * usuarios, su prefijo va aquí.
 */
const DE_PRUEBA = "^(prueba|cobro|renovacion|conc|reportes|retencion)-[^@]*@ejemplo\\.co$";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: modoSslOSalir(process.env.DATABASE_URL ?? ""),
  max: 1,
  onnotice: () => {},
});

try {
  const borrados = await sql.begin(async (tx) => {
    const ids = (await tx`select id from users where email::text ~* ${DE_PRUEBA}`).map((u) => u.id);
    if (!ids.length) return 0;
    await tx`delete from movimientos_credito where user_id = any(${ids}::uuid[])`;
    await tx`delete from transacciones where user_id = any(${ids}::uuid[])`;
    const filas = await tx`delete from users where id = any(${ids}::uuid[]) returning id`;
    return filas.length;
  });
  console.log(`Usuarios de prueba eliminados: ${borrados}`);
} catch (e) {
  console.error("\nError:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
