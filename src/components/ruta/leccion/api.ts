import { SESION_CERRADA, sesionCerrada } from "@/lib/pedir";
import type { Nivel } from "@/lib/tipos";
import type { Entrada } from "./comun";

/** Lo que cada actividad sabe de la lección en la que está. */
export interface Contexto {
  parada: string;
  leccion: number;
  nivel: Nivel;
  nombre: string;
  /** Repaso sorpresa: la pregunta n de ese repaso (el servidor sabe qué se espera). */
  repaso?: { id: string; n: number };
  /** "Practicarla": la frase mejor del resumen de esa escena. */
  escena?: string;
}

/** Lo que entrega una actividad al terminar. */
export interface FinActividad {
  /** Respuestas calificadas y cuántas salieron bien al primer intento. */
  calificadas: number;
  aciertos: number;
  /** Lo que no logró ni con las pistas (vuelve al final y en el repaso sorpresa). */
  fallos: string[];
}

export interface ResultadoEvaluacion {
  transcripcion: string;
  correcto: boolean;
  palabras: { palabra: string; estado: "bien" | "mejorar" }[];
  palabraAMejorar: string | null;
  espanol: boolean;
  nombradas: string[];
  /** Describe desde A2: la frase nombró algo con un error; `mejor` es como se dice, para repetirla. */
  mejora?: { dijo: string; mejor: string } | null;
  restantes?: number;
  /** Cuéntame: cuántas frases se entendieron, cuánto habló y el comentario de Allison. */
  relato?: {
    frases: number;
    /** Segundos hablados; null si lo escribió (no lleva nota de fluidez). */
    segundos: number | null;
    /** Desde B1 `porque` va en inglés y `porqueEs` es su traducción. */
    bien: { frase: string; porque: string; porqueEs?: string } | null;
    mejora: { dijo: string; mejor: string; porque: string; porqueEs?: string } | null;
    /** Narra la secuencia: los dibujos que contó (desde 1, en el orden en que los contó) y el primero que faltó. */
    dibujos?: number[];
    /** Narra: cuántos de los que contó van en el orden de la historia. */
    enOrden?: number;
    faltante?: number | null;
    /** Narra: la parte que pide además y no dijo ("dos ideas con could o might"), con la pregunta de Allison. */
    falta?: { pregunta: string; que: string };
  };
  /** No se oyó voz: no cuenta como intento ni se cobra. */
  sinVoz?: boolean;
  /** Se quedó sin intervenciones. */
  sinSaldo?: boolean;
  /** Algo falló (red o IA): no se cobró. */
  error?: string;
}

/**
 * La evaluación corta de una respuesta (/api/ruta/evaluar). El servidor
 * busca lo que se espera en el contenido; aquí solo se dice qué
 * actividad es.
 */
export async function evaluar(
  ctx: Contexto,
  paso: number,
  entrada: Entrada,
  indice = 0,
  /** Narra: la historia ya contada, cuando contesta la pregunta de Allison por lo que faltó. */
  previo?: string
): Promise<ResultadoEvaluacion> {
  const f = new FormData();
  f.set("parada", ctx.parada);
  f.set("leccion", String(ctx.leccion));
  f.set("paso", String(paso));
  f.set("indice", String(indice));
  if (previo) f.set("previo", previo);
  if (ctx.escena) f.set("escena", ctx.escena);
  if (ctx.repaso) {
    f.set("repaso", ctx.repaso.id);
    f.set("n", String(ctx.repaso.n));
  }
  if ("texto" in entrada) f.set("texto", entrada.texto);
  else {
    f.set("audio", entrada.audio, "respuesta.webm");
    f.set("duracion", String(entrada.duracion));
  }
  const vacio = { transcripcion: "", correcto: false, palabras: [], palabraAMejorar: null, espanol: false, nombradas: [] };
  try {
    // 58 s, justo por debajo del maxDuration de la ruta (60 s). Con 45 s,
    // Cuéntame y Narra hablados (hasta unos 47 s en el servidor) se cortaban
    // aquí mientras el servidor terminaba y cobraba: el alumno veía "Sin
    // conexión" y volvía a pagar al reintentar. Se usa el mismo tope para
    // todas: las cortas responden en segundos y solo esperan más si la red
    // de verdad se cayó (auditoría, 30 de octubre de 2026).
    const r = await fetch("/api/ruta/evaluar", { method: "POST", body: f, signal: AbortSignal.timeout(58_000) });
    const datos = await r.json().catch(() => ({}));
    if (sesionCerrada(r)) return { ...vacio, error: SESION_CERRADA };
    if (r.status === 402) return { ...vacio, sinSaldo: true };
    if (!r.ok) return { ...vacio, error: datos.mensaje ?? "No pudimos comprobar tu respuesta. Intenta otra vez." };
    return { ...vacio, ...datos };
  } catch {
    return { ...vacio, error: "Sin conexión. Revisa tu internet e intenta otra vez." };
  }
}

export interface ActividadGuardada {
  leccionCompleta: boolean;
  estrellas: number;
  nuevas: number;
  racha: number;
  minutosHoy: number;
}

/**
 * Lo que respondió /api/ruta/actividad. Antes cualquier fallo era null y
 * la pantalla decía "Revisa tu conexión" con un Reintentar que no podía
 * funcionar (un 404 porque la lección ya no es de su nivel se repetía
 * para siempre). `status` 0 es que no hubo respuesta: sin red o se venció
 * el tiempo (auditoría, 30 de octubre de 2026).
 */
export type ResultadoTerminar = ({ ok: true } & ActividadGuardada) | { ok: false; status: number; error?: string };

/**
 * ¿La lección (o el repaso) dejó de existir para este alumno? 404: ya no
 * es de su nivel (bajó o subió en otra pestaña, o el admin se lo cambió).
 * 409: está bloqueada en su mapa. Reintentar no lo arregla.
 */
export function yaNoDisponible(status: number): boolean {
  return status === 404 || status === 409;
}

/** Asienta una actividad terminada (/api/ruta/actividad). Gratis. */
export async function terminar(
  ctx: Contexto,
  paso: number,
  fin: FinActividad & { segundos: number; primera?: boolean }
): Promise<ResultadoTerminar> {
  // El servidor acepta hasta 20 calificadas: Adivina puede pasar de 20
  // preguntas (24 intervenciones) y entonces no se guardaba nunca. Se
  // escala a 20 con la misma proporción de aciertos (auditoría, 28 de
  // octubre de 2026).
  const escala = fin.calificadas > 20 ? 20 / fin.calificadas : 1;
  const calificadas = Math.round(fin.calificadas * escala);
  const aciertos = Math.min(calificadas, Math.round(fin.aciertos * escala));
  try {
    const r = await fetch("/api/ruta/actividad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parada: ctx.parada, leccion: ctx.leccion, paso, ...fin, calificadas, aciertos }),
      signal: AbortSignal.timeout(20_000),
    });
    sesionCerrada(r);
    const datos = await r.json().catch(() => null);
    if (!r.ok || !datos) return { ok: false, status: r.ok ? 0 : r.status, error: datos?.error };
    return { ...datos, ok: true };
  } catch {
    return { ok: false, status: 0 };
  }
}
