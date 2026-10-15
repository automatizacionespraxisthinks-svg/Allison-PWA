import {
  idiomaDe,
  nuevoIdPeticion,
  prepararParaVoz,
  TEXTO_VOZ_MAX,
  tieneMarcadores,
  tiempoDeEsperaMs,
  type IdiomaVoz,
} from "./habla.ts";

/**
 * La voz de Allison: la API de texto a voz de Praxis (tts-api.praxisia.org).
 *
 * Solo corre en el servidor: la clave da acceso completo a la API y la
 * guía es tajante en que no viaje al navegador. El navegador pide la
 * voz a /api/voz, y es este módulo el que habla con la API.
 *
 * Lo que la guía exige y aquí se cumple:
 *   · POST /v1/tts con stream: true — el primer byte llega en unos
 *     cuatro segundos sea cual sea el largo, y el audio sigue llegando
 *     mientras se genera. Sin streaming, una respuesta de veinte
 *     segundos tardaría veinte segundos en empezar a sonar.
 *   · mp3: el único formato que el navegador reproduce a medida que
 *     descarga.
 *   · Reintentos SOLO en 429, 503 y 500, respetando Retry-After, con
 *     variación aleatoria y pocos intentos. Los demás errores no mejoran
 *     repitiendo.
 *   · Tiempo de espera dimensionado al audio esperado, no un tope fijo.
 *   · Un X-Request-ID propio en cada petición, que queda en el log
 *     nuestro y en el del servicio: es lo que permite cruzar un fallo.
 *   · Concurrencia acotada: el servicio solo sintetiza DOS audios a la
 *     vez para todos sus clientes. Aquí no se le lanza más que eso; lo
 *     que sobra espera un poco y, si no hay turno, falla rápido para
 *     que la app caiga a la voz del navegador en vez de dejar al alumno
 *     mirando la pantalla.
 *
 * La velocidad se pide siempre en 1.0: la preferencia del alumno y la
 * base por nivel se aplican en el reproductor (playbackRate), así que
 * repetir una frase más despacio no obliga a sintetizarla otra vez —y
 * la caché del servicio, que guarda cada resultado, sirve para todas
 * las velocidades.
 */

export interface ConfigTts {
  url: string;
  clave: string;
  vozIngles: string;
  vozEspanol: string;
}

export class ErrorTts extends Error {
  /** El error.code de la API, o uno propio (no_configurado, ocupado…). */
  codigo: string;
  /** El código HTTP con el que conviene responderle al navegador. */
  estado: number;
  /** true si valdría la pena volver a intentarlo más tarde. */
  reintentable: boolean;

  // Sin propiedades en el constructor: los scripts corren este archivo
  // con Node a secas, que quita los tipos pero no reescribe esa sintaxis.
  constructor(codigo: string, estado: number, reintentable: boolean, mensaje?: string) {
    super(mensaje ?? codigo);
    this.name = "ErrorTts";
    this.codigo = codigo;
    this.estado = estado;
    this.reintentable = reintentable;
  }
}

export interface AudioTts {
  cuerpo: ReadableStream<Uint8Array>;
  tipo: string;
  /** HIT si el servicio ya lo tenía, MISS si lo generó. */
  cache: string | null;
  idPeticion: string;
}

/** Sin clave no hay voz propia: la app cae a la del navegador. */
export function ttsConfigurado(): boolean {
  return Boolean(process.env.TTS_API_KEY?.trim());
}

export function configTts(): ConfigTts {
  const clave = process.env.TTS_API_KEY?.trim();
  if (!clave) {
    throw new ErrorTts("no_configurado", 503, false, "Falta TTS_API_KEY.");
  }
  return {
    url: (process.env.TTS_URL?.trim() || "https://tts-api.praxisia.org").replace(/\/+$/, ""),
    clave,
    vozIngles: process.env.TTS_VOZ?.trim() || "af_heart",
    vozEspanol: process.env.TTS_VOZ_ES?.trim() || "ef_dora",
  };
}

/** Lo que la API acepta por petición. */
const LIMITE_API = 5000;
const REINTENTABLES = new Set([429, 500, 503]);
const INTENTOS = 3;
/** Alguien está esperando el audio: ningún reintento espera más que esto. */
const ESPERA_REINTENTO_MAX_MS = 6_000;

// ---------------------------------------------------------------------
//  Turnos: cuántas síntesis se le piden a la API a la vez.
// ---------------------------------------------------------------------
const turnosMax = () => Math.max(1, Number(process.env.TTS_SIMULTANEAS ?? 2));
const esperaTurnoMs = () => Math.max(0, Number(process.env.TTS_ESPERA_TURNO_MS ?? 15_000));

let turnosOcupados = 0;
const fila: Array<() => void> = [];

/** Cuántas síntesis hay en curso ahora mismo (para el diagnóstico y las pruebas). */
export function turnosEnCurso(): number {
  return turnosOcupados;
}

function ocuparTurno(): Promise<() => void> {
  const liberar = (() => {
    let liberado = false;
    return () => {
      if (liberado) return;
      liberado = true;
      turnosOcupados--;
      fila.shift()?.();
    };
  })();

  if (turnosOcupados < turnosMax()) {
    turnosOcupados++;
    return Promise.resolve(liberar);
  }

  return new Promise((resolver, rechazar) => {
    const tope = setTimeout(() => {
      const i = fila.indexOf(entrar);
      if (i >= 0) fila.splice(i, 1);
      rechazar(
        new ErrorTts("ocupado", 503, true, "Demasiadas voces a la vez; no hubo turno a tiempo.")
      );
    }, esperaTurnoMs());
    const entrar = () => {
      clearTimeout(tope);
      turnosOcupados++;
      resolver(liberar);
    };
    fila.push(entrar);
  });
}

/** El flujo, con el turno liberado cuando termina, falla o se cancela. */
function conLiberacion(
  cuerpo: ReadableStream<Uint8Array>,
  liberar: () => void
): ReadableStream<Uint8Array> {
  const lector = cuerpo.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(control) {
      try {
        const { done, value } = await lector.read();
        if (done) {
          liberar();
          control.close();
        } else {
          control.enqueue(value);
        }
      } catch (e) {
        liberar();
        control.error(e);
      }
    },
    cancel(razon) {
      liberar();
      return lector.cancel(razon);
    },
  });
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function leerError(respuesta: Response): Promise<{ code: string; message: string }> {
  const datos = (await respuesta.json().catch(() => null)) as {
    error?: { code?: string; message?: string };
  } | null;
  return {
    code: datos?.error?.code ?? `http_${respuesta.status}`,
    message: datos?.error?.message ?? `La API de voz respondió ${respuesta.status}`,
  };
}

/**
 * Pide el audio de un texto. Devuelve el flujo de mp3 tal como llega
 * de la API, para que la ruta lo pase al navegador sin esperar a que
 * termine.
 */
export async function sintetizar(opciones: {
  texto: string;
  /** Sin idioma, se deduce del texto (ver idiomaDe). */
  idioma?: IdiomaVoz | "auto";
  idPeticion?: string;
}): Promise<AudioTts> {
  const cfg = configTts();

  const texto = prepararParaVoz(opciones.texto);
  if (!texto) throw new ErrorTts("empty_text", 400, false, "No hay nada que decir.");
  if (texto.length > LIMITE_API) {
    throw new ErrorTts("text_too_long", 413, false, `Más de ${LIMITE_API} caracteres.`);
  }

  // Un texto con marcadores ([es] … [en-US]) es una respuesta de
  // Allison que mezcla idiomas: va con SU voz de inglés y la API cambia
  // de idioma donde diga el marcador, sin cambiar de voz. Los demás
  // textos son de un solo idioma y llevan la voz de ese idioma.
  const hibrido = tieneMarcadores(texto);
  const idioma = hibrido
    ? "en"
    : !opciones.idioma || opciones.idioma === "auto"
      ? idiomaDe(texto)
      : opciones.idioma;
  const idPeticion = opciones.idPeticion ?? nuevoIdPeticion();
  const cuerpo = JSON.stringify({
    text: texto,
    voice: idioma === "es" ? cfg.vozEspanol : cfg.vozIngles,
    lang: idioma === "es" ? "es" : "en-US",
    speed: 1,
    format: "mp3",
    stream: true,
  });

  const liberar = await ocuparTurno();
  try {
    let espera = 1_000;
    for (let intento = 1; ; intento++) {
      let respuesta: Response;
      try {
        respuesta = await fetch(`${cfg.url}/v1/tts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.clave}`,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
            "X-Request-ID": idPeticion,
          },
          body: cuerpo,
          signal: AbortSignal.timeout(tiempoDeEsperaMs(texto)),
        });
      } catch (e) {
        const agotado = (e as { name?: string })?.name === "TimeoutError";
        throw new ErrorTts(
          agotado ? "tiempo_agotado" : "sin_conexion",
          agotado ? 504 : 502,
          true,
          agotado ? "La API de voz no respondió a tiempo." : "No se pudo conectar con la API de voz."
        );
      }

      if (respuesta.ok && respuesta.body) {
        return {
          cuerpo: conLiberacion(respuesta.body, liberar),
          tipo: respuesta.headers.get("content-type") ?? "audio/mpeg",
          cache: respuesta.headers.get("x-cache"),
          idPeticion: respuesta.headers.get("x-request-id") ?? idPeticion,
        };
      }

      const error = await leerError(respuesta);
      const reintentable = REINTENTABLES.has(respuesta.status);
      if (!reintentable || intento >= INTENTOS) {
        throw new ErrorTts(error.code, respuesta.status, reintentable, error.message);
      }

      // Retry-After llega en segundos y ya cuenta la cola real del
      // servidor; sin ella, retroceso exponencial. Siempre con un poco
      // de azar, para que varios reintentos no lleguen a la vez.
      const retryAfter = Number(respuesta.headers.get("retry-after"));
      const base = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : espera;
      await dormir(Math.min(ESPERA_REINTENTO_MAX_MS, base + Math.random() * 300));
      espera = Math.min(espera * 2, ESPERA_REINTENTO_MAX_MS);
    }
  } catch (e) {
    // Solo si no se llegó a entregar el flujo: entregado, lo libera él.
    liberar();
    throw e;
  }
}

// ---------------------------------------------------------------------
//  Lo pedido y todavía no reproducido.
//
//  El navegador no puede mandar un POST desde un <audio>, y meter el
//  texto en la URL lo dejaría en los logs del proxy. Así que primero
//  registra el texto (POST /api/voz) y recibe una dirección corta, y
//  luego el <audio> la abre (GET /api/voz/<id>). Vive en memoria: hay
//  un solo servidor, y una entrada dura lo que tarda en abrirse.
// ---------------------------------------------------------------------
export interface VozPedida {
  userId: string;
  texto: string;
  idioma: IdiomaVoz | "auto";
  expira: number;
}

const VIGENCIA_PEDIDO_MS = 10 * 60 * 1000;
const PEDIDOS_MAX = 5_000;
const pedidos = new Map<string, VozPedida>();

export function registrarVoz(
  datos: { userId: string; texto: string; idioma?: IdiomaVoz | "auto" },
  ahora = Date.now()
): string {
  if (pedidos.size >= PEDIDOS_MAX) {
    for (const [id, p] of pedidos) if (p.expira <= ahora) pedidos.delete(id);
    if (pedidos.size >= PEDIDOS_MAX) pedidos.delete(pedidos.keys().next().value as string);
  }
  const id = crypto.randomUUID();
  pedidos.set(id, {
    userId: datos.userId,
    texto: datos.texto,
    idioma: datos.idioma ?? "auto",
    expira: ahora + VIGENCIA_PEDIDO_MS,
  });
  return id;
}

/**
 * Lo pedido, si es de quien pregunta y no venció. No se borra al leerlo:
 * el navegador puede abrir la misma dirección dos veces (lo hace al
 * sondear el audio), y la segunda la resuelve la caché del servicio.
 */
export function vozPedida(id: string, userId: string, ahora = Date.now()): VozPedida | null {
  const p = pedidos.get(id);
  if (!p) return null;
  if (p.expira <= ahora) {
    pedidos.delete(id);
    return null;
  }
  return p.userId === userId ? p : null;
}

/** Qué se puede decir de una vez desde la app. */
export function validarTextoVoz(texto: string): string | null {
  if (!texto) return "No hay nada que decir";
  if (texto.length > TEXTO_VOZ_MAX) return `Máximo ${TEXTO_VOZ_MAX} caracteres`;
  return null;
}

// ---------------------------------------------------------------------
//  Diagnóstico: ¿la API está lista y las voces configuradas existen?
// ---------------------------------------------------------------------
export interface EstadoTts {
  configurado: boolean;
  url: string;
  /** /ready responde 200: el modelo está cargado. null si no se pudo preguntar. */
  listo: boolean | null;
  vozIngles: string;
  vozEspanol: string;
  /** Las dos voces existen en /v1/voices. null si no se pudo consultar. */
  vocesValidas: boolean | null;
  enCurso: number;
  error?: string;
}

export async function estadoTts(): Promise<EstadoTts> {
  const url = (process.env.TTS_URL?.trim() || "https://tts-api.praxisia.org").replace(/\/+$/, "");
  const estado: EstadoTts = {
    configurado: ttsConfigurado(),
    url,
    listo: null,
    vozIngles: process.env.TTS_VOZ?.trim() || "af_heart",
    vozEspanol: process.env.TTS_VOZ_ES?.trim() || "ef_dora",
    vocesValidas: null,
    enCurso: turnosOcupados,
  };

  try {
    const r = await fetch(`${url}/ready`, { signal: AbortSignal.timeout(8_000) });
    estado.listo = r.ok;
  } catch (e) {
    estado.error = `No se pudo consultar /ready: ${e instanceof Error ? e.message : e}`;
    return estado;
  }

  if (!estado.configurado) return estado;
  try {
    const cfg = configTts();
    const r = await fetch(`${url}/v1/voices`, {
      headers: { Authorization: `Bearer ${cfg.clave}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) {
      estado.error = `/v1/voices respondió ${r.status}${r.status === 401 ? ": la clave no vale" : ""}`;
      return estado;
    }
    const datos = (await r.json()) as { voices?: Array<{ id?: string }> };
    const ids = new Set((datos.voices ?? []).map((v) => v.id));
    estado.vocesValidas = ids.has(estado.vozIngles) && ids.has(estado.vozEspanol);
  } catch (e) {
    estado.error = `No se pudo consultar /v1/voices: ${e instanceof Error ? e.message : e}`;
  }
  return estado;
}
