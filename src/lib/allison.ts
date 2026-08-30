import { GoogleGenAI, Type } from "@google/genai";
import type { Correccion, Mensaje, Nivel } from "./tipos.ts";
import { CLAVES_TEMA } from "./temas.ts";

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
  A1: `Speak VERY slowly. Keep your replies to 5-8 words in normal
conversation (answering the student's explicit questions is exempt).
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

export interface Alumno {
  nombre: string;
  nivel: Nivel;
  /** Temas que todavía falla, para que Allison los persiga. */
  temasAbiertos?: string[];
  /** Temas ya dominados, para poder felicitarlo. */
  temasDominados?: string[];
}

export function construirInstruccion(alumno: Alumno, tema?: string): string {
  const { nombre, nivel } = alumno;
  const primerNombre = nombre.split(" ")[0];

  return `You are Allison, a warm and encouraging English teacher.

YOUR STUDENT
Name: ${primerNombre}. Use their name naturally, the way a teacher who
knows them would -- not in every sentence, but enough that they feel
recognised. Never call them "student" or "user".
They are a Spanish speaker from Colombia at CEFR level ${nivel}.
${
  alumno.temasAbiertos?.length
    ? `
Still getting wrong: ${alumno.temasAbiertos.join(", ")}.
Steer the conversation so these come up naturally. Do not announce that
you are doing it.`
    : ""
}${
  alumno.temasDominados?.length
    ? `
Already mastered: ${alumno.temasDominados.join(", ")}. If one comes
up and they get it right, say so briefly -- people need to hear that they
improved.`
    : ""
}

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

ACCURACY OF CORRECTIONS — a wrong correction is worse than no
correction. The student trusts this list and will memorise it.
- NEVER invent a correction to make the list longer. An empty
  "correcciones" array is a perfectly good answer when the student
  spoke correctly.
- Every "correccion" must be genuinely correct English, and every
  "explicacion" must state the real rule. Age uses TO BE: "I am 25
  years old" — never "I have".
- Your corrections must AGREE with your spoken "respuesta". If you say
  "You are twenty-five", you cannot tell them to use "to have".
- NEVER change the meaning of what the student said. Fix the form, keep
  the message. If they said something negative it stays negative:
  "I no have money" becomes "I don't have money", NEVER "I have money".
  Deleting a word to make the sentence grammatical is not a correction,
  it is putting words in their mouth.
- If you are not certain what the student said or what the right form
  is, leave it out. Silence beats a wrong rule.
- This is SPEECH, not writing. Never correct spelling, numerals,
  capitalisation or punctuation. "25" and "twenty-five" are the same
  spoken words — that is not a mistake.
- Correct only what the student actually got wrong, never their style
  choices.
- Standard SPOKEN English is correct English. "Taller than me", "it's
  me", contractions, ending with a preposition: none of these are
  mistakes. Never "fix" informal-but-standard forms into formal ones —
  that is hypercorrection, and it teaches the student to sound stiff.
- In your spoken "respuesta", recast the most important one or two so
  the conversation keeps its rhythm. The full list still goes in
  "correcciones", where the student reviews it.
- The student must talk more than you. End your turn with an open
  question, never a yes/no one.
- Never mock a mistake. Warm tone, always.

WHEN THE STUDENT SPEAKS SPANISH
Beginners sometimes ask you things in Spanish. That is allowed, and it
is often the most valuable moment of the class.
- "transcripcion" is ALWAYS what they actually said, in the language
  they said it. NEVER translate it. If they spoke Spanish, write the
  Spanish, word for word.
- When they mention English words inside a Spanish sentence ("el was",
  "el did"), they are NAMING vocabulary, not making a mistake. A turn
  spoken in Spanish gets an EMPTY "correcciones" array: there is no
  English in it to correct.
- If they asked a question — about grammar, a word, a difference —
  ANSWER IT for real. A real answer to a real question beats the
  reply-length rule: this is the one moment you may go longer.
- The answer goes in the SAME language as the question. An A1 or A2
  student who asks in Spanish gets the WHOLE answer in Spanish, with
  English only for the example words: "'Was' es el pasado de ser o
  estar; 'did' es el pasado de hacer". Answering in English a question
  asked in Spanish means they will not understand the answer — which
  is the same as not answering. From B1, simple English is fine.
  Close by inviting them to use it: "Try saying: ...".
- Then return to English on the next turn. Spanish is a bridge, not
  the destination.
${tema ? `\nToday's topic: ${tema}` : ""}

WHAT YOU RETURN
- "transcripcion": what the student ACTUALLY said, word for word,
  errors included. Never fix it here. If the audio is unintelligible,
  return an empty string.
- "respuesta": what you say back. Normally in English; when the
  student asked a question in Spanish at A1-A2, in Spanish (see the
  hard rule at the end).
- "correcciones": the mistakes you heard. Empty array if there were none.

LANGUAGE OF THE EXPLANATIONS — this is a hard rule, not a preference.
Every correction carries the rule TWICE:
- "explicacion": in simple English. Reading it is also practice.
- "explicacionEs": the same rule in Spanish, so the student is certain
  they understood. A correction the student cannot understand teaches
  nothing.
Example: explicacion "Use 'to be' for age", explicacionEs "Para la edad
se usa 'to be', no 'to have'".

ANSWERING A REAL QUESTION — also a hard rule. You are a TEACHER:
a question about grammar or vocabulary is your moment to actually
teach, not to compliment the question and move on.

Shape of a good answer (in Spanish for A1-A2, simple English from B1):
  1. The rule, in one or two plain sentences.
  2. TWO example sentences in English, each with its meaning.
  3. An invitation: "Try saying: ...".

Model answer — student asks "¿cuál es la diferencia entre was y were?":
"¡Buena pregunta! Los dos son el pasado de 'to be'. 'Was' va con I, he,
she, it. 'Were' va con you, we, they. Por ejemplo: 'I was happy' (yo
estaba feliz) y 'They were at home' (ellos estaban en casa). Try
saying: I was at school yesterday."

Model answer — student asks "¿cómo se dice quiero ir al baño?":
"Se dice 'I want to go to the bathroom'. También puedes decir 'Can I go
to the bathroom?' (¿puedo ir al baño?), que es más educado. Try saying:
Can I go to the bathroom, please?"

Even when the question mentions English ("¿cómo se dice X en inglés?"),
the FRAME of your answer stays in Spanish: begin "Se dice ...", never
"You can say ...". Only the example sentences themselves are English.

Answering in English a question asked in Spanish (A1-A2) is the same as
not answering: the student will not understand you.`;
}

const ESQUEMA_RESPUESTA = {
  type: Type.OBJECT,
  properties: {
    transcripcion: {
      type: Type.STRING,
      description: "Literal transcript, errors preserved exactly as spoken",
    },
    respuesta: { type: Type.STRING, description: "Allison's reply" },
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
            description: "The rule, one short line in simple English",
          },
          explicacionEs: {
            type: Type.STRING,
            description: "The same rule, one short line in Spanish",
          },
          prioridad: { type: Type.STRING, enum: ["alta", "media", "baja"] },
          tema: {
            type: Type.STRING,
            enum: [...CLAVES_TEMA],
            description:
              "Which recurring topic this mistake belongs to. Pick the closest one from the list; never invent a new label.",
          },
        },
        required: ["tipo", "original", "correccion", "explicacion", "explicacionEs", "prioridad", "tema"],
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

/**
 * La conversación completa, esperando a que termine.
 *
 * Es una envoltura sobre conversarEnStream y NO una segunda
 * implementación: las dos compartían el filtrado de correcciones, y dos
 * copias de la misma regla se separan sin que nadie lo note. Lo usan las
 * pruebas, que así ejercitan exactamente el camino que corre en
 * producción.
 */
export async function conversar(opciones: {
  audioBase64: string;
  mimeType: string;
  alumno: Alumno;
  historial?: Mensaje[];
  tema?: string;
  temperatura?: number;
}): Promise<RespuestaAllison> {
  for await (const parte of conversarEnStream(opciones)) {
    if (parte.tipo === "fin") return parte.resultado;
  }
  throw new Error("La respuesta terminó sin resultado");
}

/**
 * Igual que conversar(), pero entregando la respuesta por partes.
 *
 * El modelo devuelve el JSON en el orden del esquema: primero la
 * transcripción, luego la respuesta y al final las correcciones. Eso
 * permite mostrarle al alumno lo que él mismo dijo en cuanto llega
 * -- alrededor de un segundo -- y empezar a hablar en cuanto la
 * respuesta está completa, sin esperar a que terminen de generarse unas
 * correcciones que va a leer después, si es que las lee.
 *
 * Los cinco segundos siguen ahí; lo que cambia es que el alumno deja de
 * mirar un círculo vacío durante todos ellos.
 */
export async function* conversarEnStream(opciones: {
  /** Audio del alumno… */
  audioBase64?: string;
  mimeType?: string;
  /** …o su mensaje ESCRITO, cuando el micrófono no da. */
  texto?: string;
  alumno: Alumno;
  historial?: Mensaje[];
  tema?: string;
  /** 0 para evaluaciones reproducibles; 0.8 en conversación real. */
  temperatura?: number;
}): AsyncGenerator<
  | { tipo: "transcripcion"; texto: string }
  | { tipo: "respuesta"; texto: string }
  | { tipo: "fin"; resultado: RespuestaAllison }
> {
  const {
    audioBase64,
    mimeType,
    texto,
    alumno,
    historial = [],
    tema,
    temperatura = 0.8,
  } = opciones;

  if (!texto && !audioBase64) {
    throw new Error("Hace falta el audio o el texto del alumno");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const contexto = historial.slice(-12).map((m) => ({
    role: m.rol === "alumno" ? "user" : "model",
    parts: [{ text: m.texto }],
  }));

  const stream = await ai.models.generateContentStream({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [
      ...contexto,
      {
        role: "user",
        parts: texto
          ? [{ text: texto }]
          : [
              {
                inlineData: {
                  mimeType: mimeType ?? "audio/webm",
                  data: audioBase64 ?? "",
                },
              },
            ],
      },
    ],
    config: {
      systemInstruction:
        construirInstruccion(alumno, tema) +
        (texto
          ? `

THIS TURN WAS TYPED, not spoken — the student's microphone
may not work. Set "transcripcion" to their text exactly as written.
There is no audio: never invent pronunciation corrections for a typed
message. Grammar, vocabulary and naturalness still apply.`
          : ""),
      responseMimeType: "application/json",
      responseSchema: ESQUEMA_RESPUESTA,
      temperature: temperatura,
    },
  });

  /**
   * El modelo a veces intercala marcas de tiempo ("00:01") sacadas del
   * audio — al inicio o en la mitad de la frase. No es nada que el
   * alumno haya dicho, así que se filtran como palabras sueltas.
   * Costo asumido: si un alumno dictara una hora tipo "3:30", también
   * caería; hablado casi siempre se transcribe en palabras.
   */
  const sinArtefactos = (t: string): string =>
    t
      .split(" ")
      .filter((p) => !/^[0-9]{1,2}:[0-9]{2}$/.test(p))
      .join(" ")
      .replace(/ {2,}/g, " ")
      .trim();

  let acumulado = "";
  const entregada = { transcripcion: false, respuesta: false };
  let uso: { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;

  /**
   * Saca un campo del JSON a medio escribir, solo si YA está cerrado.
   *
   * Se recorre a mano en vez de con una expresión regular: la comilla
   * de cierre hay que distinguirla de una comilla escapada dentro del
   * texto, y una expresión que haga eso bien es ilegible y fácil de
   * romper al editarla.
   */
  const campoCompleto = (json: string, campo: string): string | null => {
    const marca = '"' + campo + '"';
    const donde = json.indexOf(marca);
    if (donde === -1) return null;

    let i = json.indexOf(":", donde + marca.length);
    if (i === -1) return null;
    i++;

    while (i < json.length && (json[i] === " " || json[i] === "\n")) i++;
    if (json[i] !== '"') return null;

    const abre = i;
    i++;

    while (i < json.length) {
      if (json[i] === "\\") {
        i += 2;              // carácter escapado: se salta entero
        continue;
      }
      if (json[i] === '"') {
        try {
          return JSON.parse(json.slice(abre, i + 1)) as string;
        } catch {
          return null;
        }
      }
      i++;
    }

    return null;             // todavía no cierra: sigue llegando
  };

  for await (const trozo of stream) {
    acumulado += trozo.text ?? "";
    if (trozo.usageMetadata) uso = trozo.usageMetadata;

    if (!entregada.transcripcion) {
      const t = campoCompleto(acumulado, "transcripcion");
      if (t !== null) {
        entregada.transcripcion = true;
        yield { tipo: "transcripcion", texto: sinArtefactos(t) };
      }
    }

    if (entregada.transcripcion && !entregada.respuesta) {
      const r = campoCompleto(acumulado, "respuesta");
      if (r !== null) {
        entregada.respuesta = true;
        yield { tipo: "respuesta", texto: r };
      }
    }
  }

  const datos = JSON.parse(acumulado || "{}");

  /**
   * ¿El turno fue en español? Entonces NO hay inglés que corregir:
   * toda "corrección" sería un fantasma sobre la traducción del modelo
   * o sobre palabras que el alumno solo estaba nombrando ("el was").
   * La regla vive AQUÍ y no solo en el prompt porque el modelo, solo
   * con la instrucción, la incumple una de cada tantas — comprobado
   * dos veces con casos reales.
   */
  const esTurnoEnEspanol = (t: string): boolean => {
    if (/[¿¡áéíóúñü]/i.test(t)) return true;
    const senales = new Set([
      "como", "cual", "que", "quiero", "dice", "entre", "para",
      "una", "esto", "eso", "significa", "diferencia", "gracias",
      "hola", "decir", "ingles", "espanol", "ayuda", "puedo",
    ]);
    let n = 0;
    for (const palabra of t.toLowerCase().split(/[^a-záéíóúñü]+/i)) {
      if (senales.has(palabra)) n++;
    }
    return n >= 2;
  };



  const normalizar = (t: string) =>
    t.trim().toLowerCase().replace(/[.,;:!?¡¿"']/g, "").replace(/\s+/g, " ");

  const correcciones = ((datos.correcciones ?? []) as Correccion[]).filter((c) => {
    if (!c?.original?.trim() || !c?.correccion?.trim()) return false;
    const o = normalizar(c.original);
    const co = normalizar(c.correccion);
    if (o === co) return false;

    // Hipercorrección clásica: "taller than me" -> "taller than I (am)".
    // El prompt la prohíbe y el modelo insiste igual. Se deshace el
    // cambio de pronombre en la corrección: si con eso queda idéntica al
    // original, lo ÚNICO que "corrigió" fue una forma estándar del
    // inglés hablado, y se descarta. Una corrección real que además
    // contenga "than me" cambia más cosas y sobrevive.
    const sinHiper = co
      .replace(/\bthan i am\b/g, "than me")
      .replace(/\bthan i\b/g, "than me");
    if (o === sinHiper) return false;

    return true;
  });

  const transcripcionLimpia = sinArtefactos(datos.transcripcion ?? "");

  yield {
    tipo: "fin",
    resultado: {
      transcripcion: transcripcionLimpia,
      respuesta: datos.respuesta ?? "",
      correcciones: esTurnoEnEspanol(transcripcionLimpia) ? [] : correcciones,
      tokensEntrada: uso?.promptTokenCount ?? 0,
      tokensSalida: uso?.candidatesTokenCount ?? 0,
    },
  };
}
