import postgres from "postgres";

/**
 * Conexión a PostgreSQL.
 *
 * En desarrollo Next.js recarga los módulos en cada cambio, así que
 * guardamos la conexión en el objeto global para no abrir una nueva cada
 * vez y agotar el límite de Neon.
 */
/**
 * En Vercel (funciones sin servidor) la URL debe ser la del POOLER de
 * Neon — el host con "-pooler" —: cada instancia de función abre sus
 * propias conexiones, y contra el Postgres directo un pico de tráfico
 * agota el límite en segundos. El pooler corre en modo transacción,
 * donde las sentencias preparadas de esta librería no funcionan: se
 * apagan solas al detectar el host.
 */
const crear = () => {
  const url = process.env.DATABASE_URL!;
  const esPooler = url.includes("-pooler");

  return postgres(url, {
    // El SSL se exige salvo que la URL diga lo contrario. El Postgres
    // propio del VPS no tiene TLS todavía: ahí la URL lleva
    // sslmode=disable A CONCIENCIA — está documentado en DESPLIEGUE.md
    // como deuda a cerrar, no como decisión de diseño.
    ssl: url.includes("sslmode=disable") ? false : "require",
    max: esPooler ? 5 : 10,
    idle_timeout: 20,
    prepare: !esPooler,
    onnotice: () => {},
  });
};

declare global {
  var __sql: ReturnType<typeof crear> | undefined;
}

export const sql = globalThis.__sql ?? crear();

if (process.env.NODE_ENV !== "production") globalThis.__sql = sql;
