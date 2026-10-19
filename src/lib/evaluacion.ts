import { GoogleGenAI, Type } from "@google/genai";
import type { Nivel } from "./tipos.ts";
import { palabrasDeFrase } from "./ruta/rayas.ts";

/**
 * La "evaluación corta" del plan de mejoras (sección 6): comprobar UNA
 * respuesta breve del alumno dentro de una actividad de la ruta. No es
 * una conversación: no hay personaje, ni casos, ni correcciones. Cada
 * comprobación es una intervención, porque pasa por un prompt.
 *
 * La regla que la hace confiable: el modelo transcribe A CIEGAS. No
 * sabe qué respuesta se esperaba, porque cuando lo sabía la "oía"
 * aunque no estuviera: en la prueba con grabaciones (16-oct-2026) un
 * audio en silencio salió como "Good morning! How are you?", "Nice to
 * meet" como "Nice to meet you" y "Pleased to meet you" como "Nice to
 * meet you". Con la transcripción a ciegas, el código compara:
 *
 *   · ¿Qué es esto? y Dilo en inglés: ¿dijo alguna forma aceptada?
 *   · Describe la imagen: ¿nombró tres cosas del dibujo?
 *   · Repite: cada palabra de la frase está "bien" si quien transcribió,
 *     sin saber cuál era la frase, la entendió. Es la definición del
 *     plan: "la misma frase, entendible; no tiene que sonar perfecta".
 *   · Responde rápido: aquí vale cualquier respuesta con sentido, así
 *     que decide el modelo -- con la pregunta, que no es la respuesta.
 *
 * El comentario de Allison (el globo, la tarjeta de la palabra por
 * mejorar) NO lo escribe el modelo: lo arma la pantalla con frases
 * aprobadas a partir de este resultado. Así no hay frases inventadas ni
 * idiomas mezclados, y la respuesta del modelo es corta y barata.
 */

export type TipoActividad = "que-es-esto" | "repite" | "dilo" | "describe" | "responde";

export interface PedidoEvaluacion {
  tipo: TipoActividad;
  /**
   * Lo que se espera. ¿Qué es esto?: la palabra ("Good morning").
   * Repite y Dilo en inglés: la frase. Describe la imagen y Responde
   * rápido: la pregunta ("What do you see?", "How old are you?").
   */
  esperado: string;
  /**
   * Otras formas que valen. En Describe la imagen: las cosas que hay en
   * el dibujo ("woman", "dog", "tree").
   */
  aceptadas?: string[];
  nivel: Nivel;
  audioBase64?: string;
  mimeType?: string;
  /** Para pruebas o si el micrófono no da: la respuesta escrita. */
  texto?: string;
}

export type EstadoPalabra = "bien" | "mejorar";

export interface ResultadoEvaluacion {
  /** Lo que el alumno dijo, tal cual. Vacío si no se oyó voz. */
  transcripcion: string;
  correcto: boolean;
  /** Solo en Repite: cada palabra de la frase esperada, en orden. */
  palabras: { palabra: string; estado: EstadoPalabra }[];
  /** Solo en Repite: la primera palabra por mejorar, para la tarjeta. */
  palabraAMejorar?: string;
  tokensEntrada: number;
  tokensSalida: number;
}

/** El prompt de la transcripción a ciegas: no menciona la respuesta. */
const TRANSCRIBIR = `Transcribe this short recording of a Spanish-speaking student who
is learning English.
- Write exactly the words you hear, in the language they used. Keep
  their mistakes. Do not correct grammar, do not finish a sentence they
  left unfinished, and never add a word they did not say.
- A word you cannot recognize: write it as it sounds.
- "hayVoz": false if you hear only silence, noise or breathing. Then
  "transcripcion" is "" -- never invent words.`;

/** Responde rápido: también se juzga si la respuesta tiene sentido. */
const juzgarRespuesta = (pregunta: string, nivel: Nivel) => `
- "correcto": the student (CEFR ${nivel}) was asked "${pregunta}". true if
  what they said is a short, sensible answer to that question, in
  English, even with small mistakes. false if it does not answer the
  question, is in Spanish, or is empty.`;

function esquemaDe(tipo: TipoActividad) {
  // "hayVoz" va primero: decidir antes si hay alguien hablando evita que
  // el modelo invente una frase sobre un audio en silencio (lo hizo).
  const properties: Record<string, unknown> = {
    hayVoz: { type: Type.BOOLEAN, description: "Is there a human voice saying words in the recording?" },
    transcripcion: { type: Type.STRING, description: "Exactly what was heard, never corrected or completed. Empty if hayVoz is false." },
  };
  const required = ["hayVoz", "transcripcion"];
  if (tipo === "responde") {
    properties.correcto = { type: Type.BOOLEAN };
    required.push("correcto");
  }
  return { type: Type.OBJECT, properties, required, propertyOrdering: Object.keys(properties) };
}

const NUMEROS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", thirteen: "13",
  fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18",
  nineteen: "19", twenty: "20",
};

/** Minúsculas, sin puntuación, con contracciones abiertas y números en cifras. */
export function normalizar(texto: string): string {
  return ` ${texto
    .toLowerCase()
    // Sin tildes: "café" y "cafe" son la misma palabra (antes la tilde
    // se borraba con la letra y "café" quedaba "caf").
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    // "ten o'clock" nombra el reloj del dibujo: cuenta como "clock".
    .replace(/\bo'clock\b/g, "o clock")
    .replace(/\b(i)'m\b/g, "$1 am")
    .replace(/\b(it|what|that|he|she|there)'s\b/g, "$1 is")
    .replace(/\b(you|they|we)'re\b/g, "$1 are")
    .replace(/\b(do|does|did|is|are|was|were)n't\b/g, "$1 not")
    .replace(/\bcan't\b/g, "cannot")
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .map((p) => NUMEROS[p] ?? p)
    // "oh" es cero solo entre números ("three one oh five"); suelto es
    // una exclamación ("Oh, nice!").
    .map((p, i, todas) => (p === "oh" && (/^\d+$/.test(todas[i - 1] ?? "") || /^\d+$/.test(todas[i + 1] ?? "")) ? "0" : p))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

/** Cuántas letras hay que cambiar, poner o quitar para pasar de a a b. */
function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

/**
 * ¿Es la misma palabra, oída con acento? En palabras de 6 letras o más
 * se tolera UNA letra de diferencia: "mornin" por "morning", "please"
 * por "pleased" (al oído casi no se distinguen). En las cortas no: "God"
 * no es "Good", "might" no es "night" ni "mouse" es "house".
 */
export function mismaPalabra(oida: string, esperada: string): boolean {
  if (oida === esperada) return true;
  return Math.min(oida.length, esperada.length) >= 6 && distancia(oida, esperada) <= 1;
}

const palabrasDe = (texto: string) => normalizar(texto).trim().split(" ").filter(Boolean);

/** ¿Lo dicho contiene alguna de las formas que valen, como frase completa? */
export function contieneAlguna(dicho: string, formas: string[]): boolean {
  const d = palabrasDe(dicho);
  return formas.some((f) => {
    const n = palabrasDe(f);
    if (n.length === 0) return false;
    for (let i = 0; i + n.length <= d.length; i++) {
      if (n.every((w, k) => mismaPalabra(d[i + k], w))) return true;
    }
    return false;
  });
}

/**
 * Describe la imagen: qué cosas del dibujo nombró. Vale con el artículo
 * o sin él, en singular o en plural.
 */
export function cosasNombradas(dicho: string, cosas: string[]): string[] {
  const d = normalizar(dicho);
  return cosas.filter((c) => {
    const n = normalizar(c).trim();
    return d.includes(` ${n} `) || d.includes(` ${n}s `) || d.includes(` ${n}es `);
  });
}

/**
 * Repite: cada palabra de la frase, "bien" si aparece en lo que se
 * transcribió a ciegas. Una palabra repetida en la frase tiene que
 * aparecer las mismas veces.
 */
export function palabrasDeRepite(frase: string, transcripcion: string): { palabra: string; estado: EstadoPalabra }[] {
  const disponibles = palabrasDe(transcripcion);
  return palabrasDeFrase(frase).map((palabra) => {
    // Una contracción ("I'm") son dos palabras normalizadas: valen las dos.
    const partes = palabrasDe(palabra);
    const posiciones = partes.map((p) => disponibles.findIndex((d) => mismaPalabra(d, p)));
    const todas = posiciones.every((i) => i >= 0);
    if (todas) {
      for (const i of [...posiciones].sort((a, b) => b - a)) disponibles.splice(i, 1);
    }
    return { palabra, estado: todas ? ("bien" as const) : ("mejorar" as const) };
  });
}

/**
 * Solo la transcripción a ciegas, sin calificar: la usa la Entrevista a
 * Allison, que después decide con el texto qué preguntó el alumno.
 */
export async function transcribirACiegas(
  audioBase64: string,
  mimeType: string,
  /** Un relato de 30 segundos (Cuéntame) necesita más que una pregunta corta. */
  largo = false
): Promise<{ transcripcion: string; tokensEntrada: number; tokensSalida: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const r = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: audioBase64 } }] }],
    config: {
      systemInstruction: TRANSCRIBIR,
      responseMimeType: "application/json",
      responseSchema: esquemaDe("que-es-esto"),
      temperature: 0,
      maxOutputTokens: largo ? 600 : 200,
      abortSignal: AbortSignal.timeout(largo ? 20_000 : 12_000),
    },
  });
  let datos: { hayVoz?: boolean; transcripcion?: string } = {};
  try {
    datos = JSON.parse(r.text ?? "{}");
  } catch {
    datos = {};
  }
  return {
    transcripcion: datos.hayVoz === false ? "" : (datos.transcripcion ?? "").trim(),
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

export async function evaluarRespuestaCorta(p: PedidoEvaluacion): Promise<ResultadoEvaluacion> {
  if (!p.texto && !p.audioBase64) throw new Error("Hace falta el audio o el texto del alumno");

  let datos: { hayVoz?: boolean; transcripcion?: string; correcto?: boolean } = {};
  let uso: { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;

  // Un texto escrito no se transcribe: solo Responde rápido necesita al
  // modelo en ese caso, para juzgar si la respuesta tiene sentido.
  if (p.audioBase64 || p.tipo === "responde") {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const r = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: p.audioBase64
            ? [{ inlineData: { mimeType: p.mimeType ?? "audio/webm", data: p.audioBase64 } }]
            : [{ text: `The student typed: ${p.texto}` }],
        },
      ],
      config: {
        systemInstruction:
          (p.audioBase64 ? TRANSCRIBIR : 'Copy the student\'s typed answer into "transcripcion".') +
          (p.tipo === "responde" ? juzgarRespuesta(p.esperado, p.nivel) : ""),
        responseMimeType: "application/json",
        responseSchema: esquemaDe(p.tipo),
        temperature: 0,
        maxOutputTokens: 200,
        // Una evaluación tarda 1-3 s; en la prueba hubo una de 24 s por
        // la red. Mejor cortar y que la ruta devuelva la intervención que
        // dejar al alumno mirando la pantalla.
        abortSignal: AbortSignal.timeout(12_000),
      },
    });
    uso = r.usageMetadata;
    try {
      datos = JSON.parse(r.text ?? "{}");
    } catch {
      datos = {};
    }
  }

  const transcripcion = (p.texto?.trim() || (datos.hayVoz === false ? "" : datos.transcripcion) || "").trim();
  const resultado: ResultadoEvaluacion = {
    transcripcion,
    correcto: false,
    palabras: [],
    tokensEntrada: uso?.promptTokenCount ?? 0,
    tokensSalida: uso?.candidatesTokenCount ?? 0,
  };

  switch (p.tipo) {
    case "que-es-esto":
    case "dilo":
      resultado.correcto = contieneAlguna(transcripcion, [p.esperado, ...(p.aceptadas ?? [])]);
      // ¿Qué es esto?: las palabras de la respuesta que ya dijo van llenando las rayas.
      if (p.tipo === "que-es-esto") resultado.palabras = palabrasDeRepite(p.esperado, transcripcion);
      break;
    case "describe":
      // "Tell me 3 things you see": tres cosas distintas del dibujo.
      resultado.correcto = cosasNombradas(transcripcion, p.aceptadas ?? []).length >= 3;
      break;
    case "responde":
      resultado.correcto = transcripcion.length > 0 && datos.correcto === true;
      break;
    case "repite":
      resultado.palabras = palabrasDeRepite(p.esperado, transcripcion);
      resultado.palabraAMejorar = resultado.palabras.find((w) => w.estado === "mejorar")?.palabra;
      resultado.correcto = !resultado.palabraAMejorar;
      break;
  }
  return resultado;
}

// ---------------------------------------------------------------------
//  Cuéntame (A2 y B1) y Narra la secuencia (B1)
//
//  El relato se transcribe primero a ciegas (transcribirACiegas, largo):
//  quien transcribe no sabe de qué tema se habló. Después, con el texto
//  ya fijo, el modelo cuenta las frases que se entienden y elige una cosa
//  bien hecha y una sola por mejorar. El código verifica que las frases
//  que cita estén de verdad en lo que dijo el alumno.
//
//  Desde B1 Allison explica en inglés sencillo: el "porqué" sale en
//  inglés y su traducción va aparte, para «En español» (Contenido B1).
// ---------------------------------------------------------------------

export interface ComentarioRelato {
  /** Frases en inglés que se entienden. */
  frases: number;
  /** La mayor parte fue en español: no cuenta. */
  espanol: boolean;
  /** Una frase que dijo bien, tal cual, y por qué (en español; desde B1, en inglés con porqueEs). */
  bien: { frase: string; porque: string; porqueEs?: string } | null;
  /** Lo que más vale corregir: lo que dijo, cómo se dice y la regla. */
  mejora: { dijo: string; mejor: string; porque: string; porqueEs?: string } | null;
  tokensEntrada: number;
  tokensSalida: number;
}

const enIngles = (nivel: Nivel) => nivel !== "A1" && nivel !== "A2";

/** Los campos del comentario: los "porqué" en español, o desde B1 en inglés y en español. */
function camposComentario(nivel: Nivel): Record<string, { type: Type }> {
  const b1 = enIngles(nivel);
  return {
    frases: { type: Type.INTEGER },
    espanol: { type: Type.BOOLEAN },
    bienFrase: { type: Type.STRING },
    bienPorque: { type: Type.STRING },
    ...(b1 ? { bienPorqueEs: { type: Type.STRING } } : {}),
    mejorDijo: { type: Type.STRING },
    mejorFrase: { type: Type.STRING },
    mejorPorque: { type: Type.STRING },
    ...(b1 ? { mejorPorqueEs: { type: Type.STRING } } : {}),
  };
}

/** Cómo se pide el comentario (bien y mejora), en el idioma del nivel. */
function pedidoComentario(nivel: Nivel): string {
  if (!enIngles(nivel)) {
    return `- "bienFrase": one sentence they said well, copied exactly from the
  message. "" if there is none.
- "bienPorque": in Spanish, at most 8 words: what they did well in it
  ("Usaste bien el presente simple.").
- "mejorDijo": their exact words, copied from the message, with the most
  important grammar or word mistake. "" if there are no mistakes.
- "mejorFrase": that same sentence said correctly, in simple US English
  (soccer, apartment, vacation, math).
- "mejorPorque": in Spanish, at most 10 words: the rule ("Para un lugar
  se dice at school.").`;
  }
  return `- "bienFrase": one sentence they said well, copied exactly from the
  message. "" if there is none.
- "bienPorque": in very simple English, at most 8 words: what they did
  well in it ("You used the past perfect well.").
- "bienPorqueEs": the same, in Spanish ("Usaste bien el pasado perfecto.").
- "mejorDijo": their exact words, copied from the message, with the most
  important grammar or word mistake. "" if there are no mistakes.
- "mejorFrase": that same sentence said correctly, in simple US English
  (soccer, apartment, vacation, math).
- "mejorPorque": in very simple English, at most 10 words: the rule
  ("After if, no will: if it rains.").
- "mejorPorqueEs": the same rule, in Spanish ("Después de if no va will:
  if it rains.").`;
}

type DatosComentario = {
  frases?: number;
  espanol?: boolean;
  bienFrase?: string;
  bienPorque?: string;
  bienPorqueEs?: string;
  mejorDijo?: string;
  mejorFrase?: string;
  mejorPorque?: string;
  mejorPorqueEs?: string;
};

/** Arma el comentario verificado: solo lo que de verdad dijo. */
function comentarioVerificado(d: DatosComentario, transcripcion: string, nivel: Nivel) {
  const corto = (t: string | undefined, max: number) => (t ?? "").trim().split(/\s+/).slice(0, max).join(" ");
  const b1 = enIngles(nivel);
  const bienFrase = (d.bienFrase ?? "").trim();
  const dijo = (d.mejorDijo ?? "").trim();
  const mejor = (d.mejorFrase ?? "").trim();
  const misma = normalizar(dijo) === normalizar(mejor);
  const conEs = (es: string | undefined, max: number) => (b1 && es?.trim() ? { porqueEs: corto(es, max) } : {});
  return {
    frases: Math.max(0, Math.min(30, Math.round(Number(d.frases) || 0))),
    espanol: d.espanol === true,
    // Solo lo que de verdad dijo: una frase inventada no se muestra.
    bien:
      bienFrase && estaEnLoDicho(bienFrase, transcripcion)
        ? { frase: bienFrase, porque: corto(d.bienPorque, 12), ...conEs(d.bienPorqueEs, 14) }
        : null,
    mejora:
      dijo && mejor && !misma && estaEnLoDicho(dijo, transcripcion)
        ? { dijo, mejor, porque: corto(d.mejorPorque, 14), ...conEs(d.mejorPorqueEs, 16) }
        : null,
  };
}

/** ¿Lo citado está en lo que dijo? Las mismas palabras, en orden (sin puntuación ni mayúsculas). */
export function estaEnLoDicho(cita: string, dicho: string): boolean {
  const c = normalizar(cita).trim();
  return !!c && normalizar(dicho).includes(` ${c} `);
}

export async function comentarRelato(p: {
  tema: string;
  transcripcion: string;
  nivel: Nivel;
  /** El reloj de la actividad: 30 (A2) o 60 (B1). */
  segundos?: number;
}): Promise<ComentarioRelato> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const props = camposComentario(p.nivel);
  const instruccion = `A Spanish-speaking teenager from Colombia (English level ${p.nivel}) talked
for up to ${p.segundos ?? 30} seconds about this topic: "${p.tema}". The message is
exactly what they said (or wrote), with their mistakes.

Return:
- "frases": how many understandable sentences in English they said. A
  sentence counts if an English speaker understands it, even with
  mistakes. Spanish sentences, lone words and broken pieces do not count.
- "espanol": true if most of it is in Spanish.
${pedidoComentario(p.nivel)}
Never invent sentences they did not say. A wrong fact is not a mistake.`;

  const r = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: `Message: ${p.transcripcion}` }] }],
    config: {
      systemInstruction: instruccion,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: props,
        required: Object.keys(props),
        propertyOrdering: Object.keys(props),
      },
      temperature: 0,
      maxOutputTokens: 400,
      abortSignal: AbortSignal.timeout(15_000),
    },
  });
  let d: DatosComentario = {};
  try {
    d = JSON.parse(r.text ?? "{}");
  } catch {
    d = {};
  }
  return {
    ...comentarioVerificado(d, p.transcripcion, p.nivel),
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

export interface ComentarioNarracion extends ComentarioRelato {
  /** Los dibujos que contó (desde 1), en el orden en que los contó. */
  dibujos: number[];
  /** Cuántos contó en el orden de la historia (la cuenta para el acierto). */
  enOrden: number;
  /** El primer dibujo que no contó (desde 1), o null. */
  faltante: number | null;
}

/**
 * Cuántos dibujos contó en orden: la secuencia más larga de los dibujos
 * que nombró que va creciendo (1, 2, 4 cuenta tres; 2, 1 cuenta uno).
 */
function dibujosEnOrden(contados: number[]): number {
  const largo: number[] = [];
  contados.forEach((n, i) => {
    largo[i] = 1;
    for (let j = 0; j < i; j++) if (contados[j] < n) largo[i] = Math.max(largo[i], largo[j] + 1);
  });
  return largo.length ? Math.max(...largo) : 0;
}

/**
 * Narra la secuencia (B1): con el texto ya transcrito a ciegas, el modelo
 * dice qué dibujos contó (le damos qué muestra cada uno) y elige una cosa
 * bien hecha y una por mejorar. La cuenta del orden la hace el código.
 */
export async function comentarNarracion(p: {
  /** Lo que pidió Allison ("Tell me Zoe's story."). */
  pregunta: string;
  /** Qué muestra cada dibujo, en orden (en español). */
  dibujos: string[];
  /** La gramática que se pide, en inglés. */
  gramatica: string;
  transcripcion: string;
  nivel: Nivel;
}): Promise<ComentarioNarracion> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const props = { contados: { type: Type.ARRAY, items: { type: Type.INTEGER } }, ...camposComentario(p.nivel) };
  const lista = p.dibujos.map((x, i) => `  ${i + 1}. ${x}`).join("\n");
  const instruccion = `A Spanish-speaking teenager from Colombia (English level ${p.nivel}) is
telling a story from four pictures, in English. Their teacher asked:
"${p.pregunta}" The grammar to practice: ${p.gramatica}.
The four pictures, in order (described in Spanish):
${lista}
The message is exactly what they said (or wrote), with their mistakes.

Return:
- "contados": the numbers of the pictures they told about, in the order
  they told them (for example [1, 2, 4]). A picture counts if an English
  speaker would understand that part of the story, even with mistakes or
  other words. Do not count a picture they did not talk about.
- "frases": how many understandable sentences in English they said.
- "espanol": true if most of it is in Spanish.
${pedidoComentario(p.nivel)}
Never invent sentences they did not say.`;

  const r = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: `Message: ${p.transcripcion}` }] }],
    config: {
      systemInstruction: instruccion,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: props,
        required: Object.keys(props),
        propertyOrdering: Object.keys(props),
      },
      temperature: 0,
      maxOutputTokens: 450,
      abortSignal: AbortSignal.timeout(15_000),
    },
  });
  let d: DatosComentario & { contados?: number[] } = {};
  try {
    d = JSON.parse(r.text ?? "{}");
  } catch {
    d = {};
  }
  const total = p.dibujos.length;
  const dibujos = [...new Set((d.contados ?? []).filter((n) => Number.isInteger(n) && n >= 1 && n <= total))];
  const faltante = Array.from({ length: total }, (_, i) => i + 1).find((n) => !dibujos.includes(n)) ?? null;
  return {
    ...comentarioVerificado(d, p.transcripcion, p.nivel),
    dibujos,
    enOrden: dibujosEnOrden(dibujos),
    faltante,
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
