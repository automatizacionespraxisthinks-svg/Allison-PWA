/**
 * Límite de peticiones por ventana de tiempo.
 *
 * Sin esto, cualquiera puede registrar cuentas en bucle y llevarse los
 * 20 mensajes de prueba cada vez — gastando tu cuota de Gemini — o
 * martillar la conversación desde un script.
 *
 * ATENCIÓN: el contador vive en la memoria del proceso. Sirve mientras
 * haya UN solo servidor. Cuando se agregue el segundo (o el worker de
 * voz en otra máquina), hay que moverlo a Redis, que ya está previsto
 * en la arquitectura. Un contador por proceso con tres procesos
 * significa el triple del límite.
 */

interface Ventana {
  cuenta: number;
  reinicia: number;
}

const contadores = new Map<string, Ventana>();

/** Evita que el mapa crezca sin fin en un proceso de larga vida. */
function limpiar(ahora: number) {
  if (contadores.size < 5000) return;
  for (const [clave, v] of contadores) {
    if (v.reinicia <= ahora) contadores.delete(clave);
  }
}

export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  /** Segundos que faltan para poder reintentar. */
  esperaSeg: number;
}

export function limitar(
  clave: string,
  maximo: number,
  ventanaSeg: number
): ResultadoLimite {
  const ahora = Date.now();
  limpiar(ahora);

  const actual = contadores.get(clave);

  if (!actual || actual.reinicia <= ahora) {
    contadores.set(clave, { cuenta: 1, reinicia: ahora + ventanaSeg * 1000 });
    return { permitido: true, restantes: maximo - 1, esperaSeg: 0 };
  }

  actual.cuenta++;
  const esperaSeg = Math.ceil((actual.reinicia - ahora) / 1000);

  return {
    permitido: actual.cuenta <= maximo,
    restantes: Math.max(0, maximo - actual.cuenta),
    esperaSeg,
  };
}

/**
 * De dónde viene la petición.
 *
 * Detrás de Cloudflare la IP real llega en cf-connecting-ip; el resto
 * de cabeceras las puede falsificar el cliente, así que solo se
 * confían en ese orden.
 */
export function origenDe(peticion: Request): string {
  const cf = peticion.headers.get("cf-connecting-ip");
  if (cf) return cf;

  const reenviada = peticion.headers.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0].trim();

  return peticion.headers.get("x-real-ip") ?? "desconocido";
}
