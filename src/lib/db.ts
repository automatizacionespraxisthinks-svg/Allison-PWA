import postgres from "postgres";

/**
 * Conexión a PostgreSQL.
 *
 * En desarrollo Next.js recarga los módulos en cada cambio, así que
 * guardamos la conexión en el objeto global para no abrir una nueva cada
 * vez y agotar el límite de Neon.
 */
const crear = () =>
  postgres(process.env.DATABASE_URL!, {
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    onnotice: () => {},
  });

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof crear> | undefined;
}

export const sql = globalThis.__sql ?? crear();

if (process.env.NODE_ENV !== "production") globalThis.__sql = sql;
