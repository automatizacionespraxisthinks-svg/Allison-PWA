/**
 * Cómo se cifra la conexión a Postgres.
 *
 * UN solo criterio para la aplicación (src/lib/db.ts) y para los
 * scripts de operación (migrar, crear-admin, auditar): antes cada uno
 * tenía su propia línea y se desincronizaban — crear-admin exigía TLS
 * cuando los demás ya no. Vive en db/ y no en src/ porque los scripts
 * corren dentro del contenedor, donde src/ no existe pero db/ sí.
 *
 * La regla, en dos frases:
 *
 *   · Un host INTERNO (nombre de servicio de Docker, localhost, IP
 *     privada) está dentro del servidor: la red de Docker es el límite
 *     de confianza, y el tráfico no sale de la máquina. Ahí se usa TLS
 *     si el Postgres lo tiene y texto plano si no ("prefer").
 *
 *   · Un host PÚBLICO está al otro lado de internet: TLS obligatorio.
 *     Y en producción, pedir texto plano hacia una dirección pública se
 *     RECHAZA: eso mandaría la clave de la base y los datos de los
 *     alumnos — muchos menores — en claro por la red.
 *
 * Por qué "prefer" y no "require" en la red interna: con "require", si
 * el servidor contesta que no tiene TLS, la librería igual intenta el
 * saludo TLS sobre el socket plano; el servidor lo cierra y el error
 * que llega es "socket disconnected before secure TLS connection was
 * established", que no explica nada. Con "prefer" cae a texto plano de
 * forma limpia (node_modules/postgres/src/connection.js, secure()).
 */

const RANGOS_PRIVADOS = [
  /^127\./, // loopback
  /^10\./, // 10/8
  /^192\.168\./, // 192.168/16
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16/12 — la red por defecto de Docker
  /^::1$/, // loopback IPv6
  /^f[cd][0-9a-f]{2}:/i, // fc00::/7 — IPv6 de uso local
];

/**
 * ¿Este host está dentro del servidor?
 *
 * Un nombre sin puntos es un servicio de Docker (o una máquina de la
 * red local): no resuelve en internet. Las IP privadas no se enrutan
 * hacia afuera por definición.
 *
 * @param {string} host
 * @returns {boolean}
 */
export function esHostInterno(host) {
  const h = host.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return false;
  if (h === "localhost" || h.endsWith(".internal") || h === "host.docker.internal") return true;
  if (RANGOS_PRIVADOS.some((r) => r.test(h))) return true;
  return !h.includes(".") && !h.includes(":");
}

/**
 * El host de una URL de Postgres, o null si no se puede leer.
 *
 * Se cambia el esquema a http para que el analizador trate la URL como
 * "especial" y normalice el host igual que lo hará la librería.
 *
 * @param {string} url
 * @returns {string | null}
 */
export function hostDe(url) {
  try {
    const u = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    return u.hostname || null;
  } catch {
    return null;
  }
}

/**
 * La opción `ssl` para postgres.js, a partir de la URL.
 *
 * @param {string} url
 * @param {string | undefined} [entorno] NODE_ENV; se pasa para probarlo
 * @returns {false | "prefer" | "require"}
 */
export function modoSsl(url, entorno = process.env.NODE_ENV) {
  const host = hostDe(url);
  // Un host que no se puede leer se trata como PÚBLICO: ante la duda,
  // la opción segura.
  const interno = host !== null && esHostInterno(host);

  let pedido = null;
  try {
    pedido = new URL(url.replace(/^postgres(ql)?:/i, "http:")).searchParams.get("sslmode");
  } catch {
    // sin parámetros legibles: se decide solo por el host
  }
  pedido = pedido?.toLowerCase() ?? null;

  if (pedido === "disable") {
    if (interno) return false;

    const aviso =
      `DATABASE_URL pide sslmode=disable hacia "${host ?? "un host ilegible"}", que no es ` +
      "una dirección interna del servidor. Eso manda la clave de la base y los datos " +
      "de los alumnos en claro por internet. Usa el nombre interno del servicio de " +
      "Postgres (Dokploy → tu servicio → Internal host) o un Postgres con TLS.";

    if (entorno === "production") throw new Error(aviso);
    console.warn("AVISO: " + aviso);
    return false;
  }

  if (!interno) return "require";

  // Interno: se respeta un TLS pedido a propósito; si no, lo que haya.
  if (pedido === "require" || pedido?.startsWith("verify")) return "require";
  return "prefer";
}

/**
 * Para los scripts de terminal: lo mismo, pero un rechazo se muestra
 * como un mensaje y no como una traza de Node de veinte líneas con el
 * aviso escondido en la primera.
 *
 * @param {string} url
 * @returns {false | "prefer" | "require"}
 */
export function modoSslOSalir(url) {
  try {
    return modoSsl(url);
  } catch (e) {
    console.error(`\n${e instanceof Error ? e.message : e}\n`);
    process.exit(1);
  }
}
