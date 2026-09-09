import postgres from "postgres";
import { modoSsl } from "../../db/conexion.mjs";

/**
 * Conexión a PostgreSQL.
 *
 * La conexión se abre PEREZOSAMENTE, en la primera consulta, no al
 * importar el módulo. Es lo que permite construir la imagen de Docker
 * sin secretos: `next build` importa este archivo para analizar las
 * rutas, y si aquí se leyera DATABASE_URL de entrada, el build fallaría
 * en cualquier máquina que no tenga la base a mano — cosa comprobada,
 * no teórica ("Failed to collect page data for /api/admin/colegios").
 *
 * Hornear una URL falsa en el build sería la otra salida, pero deja una
 * imagen que "construye bien" con una base que no existe, y el día que
 * alguien consulte de verdad durante el build el fallo aparece
 * disfrazado. Mejor que el build simplemente no necesite la base.
 */
const crear = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. Defínela en el entorno del servidor " +
        "(en Dokploy: tu aplicación → Environment)."
    );
  }

  /**
   * El pooler es cosa de Neon: con funciones sin servidor cada
   * instancia abría sus propias conexiones y el Postgres directo se
   * agotaba. Corriendo en un contenedor propio y persistente contra un
   * Postgres del mismo servidor, esto no aplica — pero se queda
   * detectado por si la base vuelve a un servicio administrado.
   */
  const esPooler = url.includes("-pooler");

  return postgres(url, {
    /**
     * Cómo se cifra lo decide db/conexion.mjs a partir del HOST, con un
     * solo criterio para la app y los scripts: red interna de Docker =
     * dentro del límite de confianza del servidor; dirección pública =
     * TLS obligatorio, y en producción se niega a mandar nada en claro.
     */
    ssl: modoSsl(url),
    max: esPooler ? 5 : 10,
    idle_timeout: 20,
    prepare: !esPooler,
    onnotice: () => {},
  });
};

declare global {
  var __sql: ReturnType<typeof crear> | undefined;
}

/**
 * La conexión real, creada la primera vez que alguien la usa.
 *
 * En desarrollo se guarda en el objeto global: Next recarga los módulos
 * en cada cambio y sin esto se abriría una conexión nueva cada vez
 * hasta agotar el límite del servidor.
 */
let conexion: ReturnType<typeof crear> | undefined;

function conectar(): ReturnType<typeof crear> {
  if (conexion) return conexion;

  conexion = globalThis.__sql ?? crear();
  if (process.env.NODE_ENV !== "production") globalThis.__sql = conexion;

  return conexion;
}

/**
 * Se exporta un intermediario y no la conexión directa para poder
 * retrasar su creación sin cambiar los cincuenta sitios que la usan
 * como plantilla etiquetada: `sql\`select ...\`` sigue escribiéndose
 * igual, y sus propiedades (sql.json, sql.unsafe, sql.end…) también
 * funcionan.
 */
export const sql = new Proxy(function () {} as unknown as ReturnType<typeof crear>, {
  apply(_destino, _this, argumentos) {
    return (conectar() as unknown as (...a: unknown[]) => unknown)(...argumentos);
  },
  get(_destino, propiedad) {
    const real = conectar() as unknown as Record<string | symbol, unknown>;
    const valor = real[propiedad];
    return typeof valor === "function" ? valor.bind(real) : valor;
  },
}) as ReturnType<typeof crear>;
