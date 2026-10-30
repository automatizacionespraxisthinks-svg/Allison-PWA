"use client";

import { idiomaBase, prepararParaVoz, tramosDeVoz, type IdiomaVoz, type SegmentoVoz } from "./habla";
import { pedir } from "./pedir";
import type { Nivel } from "./tipos";
import {
  desbloquearVozNavegador,
  detenerVozNavegador,
  hablarSegmentosConNavegador,
} from "./voz-navegador";

/**
 * La voz de Allison, en el navegador.
 *
 * Desde septiembre de 2026 la voz la genera la API de texto a voz de
 * Praxis, a través del servidor (src/lib/tts.ts): el navegador registra
 * el texto en /api/voz y reproduce la dirección que recibe en un
 * <audio>. El mp3 llega por partes mientras se genera, así que empieza
 * a sonar a los pocos segundos aunque la frase sea larga.
 *
 * Tres decisiones que no se ven pero se oyen:
 *
 *   · UN solo <audio> para toda la página, "bendecido" durante un gesto
 *     real del alumno (tocar grabar, enviar texto) reproduciendo un
 *     silencio. iOS y algunos Android solo dejan reproducir sin gesto a
 *     un elemento que ya sonó con gesto; la respuesta de Allison llega
 *     segundos después del toque, y sin esto saldría muda.
 *   · La velocidad la pone la API al generar el audio (el nivel, la
 *     preferencia del alumno y "lento"): comparada de oído en octubre de
 *     2026, sonó más natural que estirar el audio aquí con playbackRate.
 *     La voz del navegador, de respaldo, usa su propio rate.
 *   · Si la API no está (sin clave, caída, ocupada), se cae a la voz
 *     del navegador y se dice en la consola. Oír a Allison peor es
 *     mejor que no oírla.
 */

/** La base por nivel: un A1 oye más lento que un C1. */
function velocidadBase(nivel: Nivel): number {
  return nivel === "A1" ? 0.8 : nivel === "A2" ? 0.9 : 1;
}

/**
 * El botón "Lento": A1 a 0,6 y desde A2 a 0,7. Elegido de oído el 25 de
 * octubre de 2026 con muestras de la API; antes era el 70 % de la base
 * (A1 0,56, que sonaba demasiado arrastrado, y A2 0,63).
 */
function velocidadLenta(nivel: Nivel): number {
  return nivel === "A1" ? 0.6 : 0.7;
}

export interface OpcionesHabla {
  /** Se llama cuando el audio de verdad empieza a sonar. */
  alEmpezar?: () => void;
}

let elemento: HTMLAudioElement | null = null;
let desbloqueada = false;
/** Número de la última petición: una nueva invalida a la anterior. */
let turno = 0;
/** Cómo terminar la reproducción en curso desde fuera (detenerVoz). */
let cortarEnCurso: (() => void) | null = null;

function reproductor(): HTMLAudioElement {
  if (!elemento) {
    elemento = new Audio();
    elemento.preload = "auto";
    // Sin esto, iOS abre el reproductor a pantalla completa.
    elemento.setAttribute("playsinline", "");
  }
  return elemento;
}

/** Un WAV de un décimo de segundo en silencio, para bendecir el <audio>. */
function silencio(): string {
  const muestras = 800; // 0,1 s a 8 kHz, 8 bits, mono
  const bytes = new Uint8Array(44 + muestras);
  const vista = new DataView(bytes.buffer);
  const texto = (pos: number, s: string) => {
    for (let i = 0; i < s.length; i++) bytes[pos + i] = s.charCodeAt(i);
  };
  texto(0, "RIFF");
  vista.setUint32(4, 36 + muestras, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  vista.setUint32(16, 16, true);
  vista.setUint16(20, 1, true);
  vista.setUint16(22, 1, true);
  vista.setUint32(24, 8000, true);
  vista.setUint32(28, 8000, true);
  vista.setUint16(32, 1, true);
  vista.setUint16(34, 8, true);
  texto(36, "data");
  vista.setUint32(40, muestras, true);
  bytes.fill(128, 44); // 128 = silencio en PCM de 8 bits
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}

/**
 * Llamar en un gesto REAL del usuario. Una vez por página basta.
 * Desbloquea también la voz del navegador, por si hay que caer a ella.
 */
export function desbloquearVoz(): void {
  if (typeof window === "undefined" || desbloqueada) return;
  desbloqueada = true;
  desbloquearVozNavegador();
  try {
    const a = reproductor();
    // Si Allison ya está sonando (la computadora deja sonar sin gesto), el
    // <audio> ya sirve: cambiarle el src cortaría su frase.
    if (!a.paused) return;
    a.muted = true;
    const mudo = silencio();
    a.src = mudo;
    const promesa = a.play();
    if (promesa) {
      promesa
        .then(() => {
          // Si mientras tanto empezó una frase de verdad, no se pausa.
          if (a.src === mudo) a.pause();
          a.muted = false;
        })
        .catch(() => {
          a.muted = false;
          desbloqueada = false;
        });
    }
  } catch {
    desbloqueada = false;
  }
}

/** "Oír mi voz": la grabación del propio alumno, que también se corta. */
let grabacionPropia: HTMLAudioElement | null = null;

/** Reproduce una grabación del alumno; detenerVoz la corta como a Allison. */
export function reproducirGrabacion(url: string): void {
  detenerVoz();
  grabacionPropia = new Audio(url);
  void grabacionPropia.play().catch(() => {});
}

/**
 * Corta lo que esté sonando, venga de la API o del navegador, y lo que
 * todavía se estaba pidiendo: subir el turno invalida la frase que
 * esperaba respuesta de /api/voz (antes sonaba igual cuando llegaba,
 * encima de la grabación o en la pantalla siguiente; auditoría, 28 de
 * octubre de 2026).
 */
export function detenerVoz(): void {
  turno++;
  grabacionPropia?.pause();
  grabacionPropia = null;
  detenerVozNavegador();
  const cortar = cortarEnCurso;
  cortarEnCurso = null;
  if (elemento) {
    try {
      elemento.pause();
      elemento.removeAttribute("src");
      elemento.load();
    } catch {
      // Un reproductor que no se deja limpiar no es motivo para fallar.
    }
  }
  cortar?.();
}

/**
 * Dice un texto en inglés con la voz de Allison. Resuelve cuando
 * termina de sonar; false si no sonó (el alumno siempre tiene el botón
 * ▶ en el mensaje para oírlo con su propio gesto).
 */
export function hablarIngles(
  texto: string,
  nivel: Nivel,
  velocidad = 1,
  opciones?: OpcionesHabla
): Promise<boolean> {
  return hablar(texto, "auto", velocidadBase(nivel) * velocidad, opciones);
}

/** Lo mismo, más despacio: lo que suena al tocar "Lento" o "Más despacio". */
export function hablarInglesLento(texto: string, nivel: Nivel, opciones?: OpcionesHabla): Promise<boolean> {
  return hablar(texto, "auto", velocidadLenta(nivel), opciones);
}

/** Lo mismo en español: la bienvenida. */
export function hablarEspanol(texto: string, opciones?: OpcionesHabla): Promise<boolean> {
  return hablar(texto, "es", 1, opciones);
}

/** Los segmentos que mandó el servidor, si tienen la forma esperada. */
function segmentosValidos(x: unknown): SegmentoVoz[] | null {
  if (!Array.isArray(x) || !x.length) return null;
  const ok = x.every(
    (s) => s && typeof s.texto === "string" && s.texto.trim() && (s.idioma === "es" || s.idioma === "en")
  );
  return ok ? (x as SegmentoVoz[]) : null;
}

/**
 * Un deletreo con guiones ("A-M-Y") la voz lo lee de corrido, como una
 * palabra: con comas suena letra por letra ("A, M, Y"). Las escenas ya lo
 * hacían en el servidor (escena.ts); aquí vale para todo lo que suena, como
 * "My name is Amy. A-M-Y." en Escucha y elige (30 de octubre de 2026).
 * "T-shirt" no cambia: cada parte tiene que ser una sola letra.
 */
export const deletreoParaVoz = (t: string) =>
  t.replace(/\b[A-Za-z](?:-[A-Za-z]){2,}\b/g, (m) => m.toUpperCase().split("-").join(", "));

async function hablar(
  texto: string,
  idioma: IdiomaVoz | "auto",
  ritmo: number,
  opciones?: OpcionesHabla
): Promise<boolean> {
  if (typeof window === "undefined" || !texto.trim()) return false;
  texto = deletreoParaVoz(texto);

  detenerVoz();
  const mio = ++turno;

  const respuesta = await pedir("/api/voz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, idioma, velocidad: ritmo }),
    signal: AbortSignal.timeout(15_000),
  });
  if (mio !== turno) return false; // se pidió otra cosa mientras tanto
  const datos = (respuesta ? await respuesta.json().catch(() => ({})) : {}) as {
    url?: string;
    error?: string;
    segmentos?: unknown;
  };
  if (mio !== turno) return false;

  // La voz del dispositivo, cada parte con su idioma: los segmentos que
  // armó el servidor (con el inglés dentro del español) o, sin red, los
  // de los marcadores.
  const respaldo = () =>
    hablarSegmentosConNavegador(
      segmentosValidos(datos.segmentos) ?? tramosDeVoz(prepararParaVoz(texto), idiomaBase(texto, idioma)),
      ritmo,
      opciones?.alEmpezar,
      () => mio === turno
    );

  if (!respuesta?.ok) {
    console.warn(
      `La voz de Allison no está disponible (${respuesta?.status ?? "sin red"}` +
        `${datos.error ? `: ${datos.error}` : ""}). Se usa la voz del navegador.`
    );
    return respaldo();
  }

  const { url } = datos;
  if (!url) return false;

  const a = reproductor();
  return new Promise<boolean>((resolver) => {
    let empezo = false;
    let cerrado = false;
    const cerrar = (resultado: boolean | Promise<boolean>) => {
      if (cerrado) return;
      cerrado = true;
      a.onplaying = a.onended = a.onerror = null;
      if (cortarEnCurso === cortar) cortarEnCurso = null;
      resolver(resultado);
    };
    const cortar = () => cerrar(false);
    cortarEnCurso = cortar;

    a.onplaying = () => {
      if (!empezo) {
        empezo = true;
        opciones?.alEmpezar?.();
      }
    };
    a.onended = () => cerrar(true);
    a.onerror = () => {
      // La API falló (la ruta respondió un error) o el flujo se cortó.
      // Si todavía no había sonado nada, el navegador lo dice en su
      // voz; si se cortó a la mitad, mejor callar que repetir.
      if (mio !== turno || empezo) {
        cerrar(false);
        return;
      }
      console.warn("El audio de la API de voz no se pudo reproducir; se usa la voz del navegador.");
      cerrar(respaldo());
    };

    // El audio ya viene a su velocidad: sin estirarlo.
    a.playbackRate = 1;
    // Por si el silencio del desbloqueo todavía no había terminado.
    a.muted = false;
    a.src = url;
    const promesa = a.play();
    if (promesa) {
      // NotAllowedError: el navegador exige un gesto y no lo hubo. La
      // voz del navegador tampoco sonaría, así que no se insiste.
      promesa.catch(() => cerrar(false));
    }
  });
}
