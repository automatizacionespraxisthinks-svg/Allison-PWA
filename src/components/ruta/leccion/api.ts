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
    faltante?: number | null;
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
  indice = 0
): Promise<ResultadoEvaluacion> {
  const f = new FormData();
  f.set("parada", ctx.parada);
  f.set("leccion", String(ctx.leccion));
  f.set("paso", String(paso));
  f.set("indice", String(indice));
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
    const r = await fetch("/api/ruta/evaluar", { method: "POST", body: f, signal: AbortSignal.timeout(45_000) });
    const datos = await r.json().catch(() => ({}));
    if (r.status === 402) return { ...vacio, sinSaldo: true };
    if (!r.ok) return { ...vacio, error: datos.mensaje ?? "No pudimos comprobar tu respuesta. Intenta otra vez." };
    return { ...vacio, ...datos };
  } catch {
    return { ...vacio, error: "Sin conexión. Revisa tu internet e intenta otra vez." };
  }
}

/** Asienta una actividad terminada (/api/ruta/actividad). Gratis. */
export async function terminar(
  ctx: Contexto,
  paso: number,
  fin: FinActividad & { segundos: number; primera?: boolean }
): Promise<{ leccionCompleta: boolean; estrellas: number; nuevas: number; racha: number; minutosHoy: number } | null> {
  try {
    const r = await fetch("/api/ruta/actividad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parada: ctx.parada, leccion: ctx.leccion, paso, ...fin }),
      signal: AbortSignal.timeout(20_000),
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
