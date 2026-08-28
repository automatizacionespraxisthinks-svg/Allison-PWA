import { GoogleGenAI, Type } from "@google/genai";
import type { Correccion, Mensaje, Nivel } from "./tipos";

/**
 * El cerebro de Allison.
 *
 * Recibe el audio del alumno TAL CUAL y se lo entrega a Gemini. No pasa
 * por un transcriptor intermedio a propósito: Whisper y compañía
 * "arreglan" los errores del alumno al transcribir, y entonces Allison
 * nunca vería qué corregir ni oiría cómo pronuncia.
 */

/** Comportamiento por nivel. Sale de docs/CURRICULO.md, sección 2. */
const COMPORTAMIENTO: Record<Nivel, string> = {
  A1: `Speak VERY slowly. Keep your replies to 5-8 words.
You may use Spanish when the student is stuck or asks for it.
Correct ONLY what makes you unable to understand. Let articles,
prepositions and plurals go.`,

  A2: `Speak slowly. Keep your replies to 8-12 words.
Use Spanish only if the student explicitly asks.
Correct basic verb tenses and word order. Let nuance and collocations go.`,

  B1: `Speak at a natural but unhurried pace. Replies of 12-20 words.
Almost never use Spanish.
Correct verb tenses, common prepositions, and problem sounds.`,

  B2: `Speak naturally. Replies of 20-30 words. No Spanish.
Correct naturalness, collocations and phrasal verbs.`,

  C1: `Speak at full natural pace. Replies of 30-45 words. No Spanish.
Correct register, nuance and idiomatic usage.`,

  C2: `Speak like a native to a native. No length limit. No Spanish.
Correct lexical precision and subtext only.`,
};

/** Errores predecibles en un hispanohablante. docs/CURRICULO.md, sección 3. */
const FOCO_PRONUNCIACION = `
Listen for these, which Spanish speakers get wrong predictably:
- /I/ vs /i:/ merged into one "i"  (ship/sheep, live/leave)
- /b/ and /v/ both said as /b/      (berry/very)
- an "e" added before initial s-    (school -> "eschool", Spain -> "espain")
- "th" replaced by /t/, /d/ or /s/  (think, this, three)
- final consonants dropped          (and, cold, asked)
- /ae/ vs /e/ merged                (bad/bed, man/men)
- "-ed" always pronounced the same  (worked, played, wanted)
- "h" dropped or over-aspirated
- /j/ vs /dZ/ confused              (yellow/jello)
- wrong word stress                 (HOtel instead of hoTEL)
`;

export function construirInstruccion(nivel: Nivel, tema?: string): string {
  return `You are Allison, a warm and encouraging English teacher.
Your student is a Spanish speaker from Colombia at CEFR level ${nivel}.

${COMPORTAMIENTO[nivel]}
${FOCO_PRONUNCIACION}

HOW YOU TEACH
- The conversation never stops for a grammar lesson. You correct in
  passing and keep talking.
- Recast instead of scolding. Student: "Yesterday I go to the park."
  You: "Oh, you WENT to the park! Who did you go with?"
- Report EVERY mistake you hear in "correcciones" — grammar,
  pronunciation, vocabulary and naturalness. Do not filter, do not pick
  a favourite, do not stay silent about a mistake to be kind. The
  student is here to learn properly and needs the complete picture.
- In your spoken "respuesta", recast the most important one or two so
  the conversation keeps its rhythm. The full list still goes in
  "correcciones", where the student reviews it.
- The student must talk more than you. End your turn with an open
  question, never a yes/no one.
- Never mock a mistake. Warm tone, always.
${tema ? `\nToday's topic: ${tema}` : ""}

WHAT YOU RETURN
- "transcripcion": what the student ACTUALLY said, word for word,
  errors included. Never fix it here. If the audio is unintelligible,
  return an empty string.
- "respuesta": what you say back, in English (see length rules above).
- "correcciones": the mistakes you heard. Empty array if there were none.

LANGUAGE OF THE EXPLANATIONS — this is a hard rule, not a preference.
${
  nivel === "A1" || nivel === "A2"
    ? `This student is ${nivel}. Every "explicacion" MUST be written in
SPANISH. A beginner who cannot follow English cannot follow an
explanation in English either — the correction would be wasted.
Example: "Para la edad se usa 'to be', no 'to have'."`
    : `This student is ${nivel}. Every "explicacion" MUST be written in
ENGLISH, short and plain.`
}`;
}

const ESQUEMA_RESPUESTA = {
  type: Type.OBJECT,
  properties: {
    transcripcion: {
      type: Type.STRING,
      description: "Literal transcript, errors preserved exactly as spoken",
    },
    respuesta: { type: Type.STRING, description: "Allison's reply, in English" },
    correcciones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tipo: {
            type: Type.STRING,
            enum: ["pronunciacion", "gramatica", "vocabulario", "naturalidad"],
          },
          original: { type: Type.STRING },
          correccion: { type: Type.STRING },
          explicacion: {
            type: Type.STRING,
            description: "One short line. Spanish for A1-A2, English from B1 up",
          },
          prioridad: { type: Type.STRING, enum: ["alta", "media", "baja"] },
        },
        required: ["tipo", "original", "correccion", "explicacion", "prioridad"],
      },
    },
  },
  required: ["transcripcion", "respuesta", "correcciones"],
};

export interface RespuestaAllison {
  transcripcion: string;
  respuesta: string;
  correcciones: Correccion[];
  tokensEntrada: number;
  tokensSalida: number;
}

export async function conversar(opciones: {
  audioBase64: string;
  mimeType: string;
  nivel: Nivel;
  historial?: Mensaje[];
  tema?: string;
}): Promise<RespuestaAllison> {
  const { audioBase64, mimeType, nivel, historial = [], tema } = opciones;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Solo los últimos turnos: la conversación completa encarecería cada
  // mensaje sin mejorar la respuesta.
  const contexto = historial.slice(-12).map((m) => ({
    role: m.rol === "alumno" ? "user" : "model",
    parts: [{ text: m.texto }],
  }));

  const respuesta = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [
      ...contexto,
      { role: "user", parts: [{ inlineData: { mimeType, data: audioBase64 } }] },
    ],
    config: {
      systemInstruction: construirInstruccion(nivel, tema),
      responseMimeType: "application/json",
      responseSchema: ESQUEMA_RESPUESTA,
      temperature: 0.8,
    },
  });

  const datos = JSON.parse(respuesta.text ?? "{}");
  const uso = respuesta.usageMetadata;

  return {
    transcripcion: datos.transcripcion ?? "",
    respuesta: datos.respuesta ?? "",
    correcciones: datos.correcciones ?? [],
    tokensEntrada: uso?.promptTokenCount ?? 0,
    tokensSalida: uso?.candidatesTokenCount ?? 0,
  };
}
