import { GoogleGenAI, Type } from "@google/genai";
import type { Correccion, Mensaje, Nivel } from "./tipos.ts";
import type { Unidad } from "./curriculo.ts";
import {
  normalizarMarcadores,
  quitarMarcadores,
  type SenalesEspanol,
} from "./habla.ts";
import { CLAVES_TEMA } from "./temas.ts";

/**
 * El cerebro de Allison.
 *
 * Recibe el audio del alumno TAL CUAL y se lo entrega a Gemini. No pasa
 * por un transcriptor intermedio a propósito: Whisper y compañía
 * "arreglan" los errores del alumno al transcribir, y entonces Allison
 * nunca vería qué corregir ni oiría cómo pronuncia.
 *
 * Desde septiembre de 2026 su voz habla inglés Y español (la API de voz
 * cambia de idioma con marcadores dentro del texto), así que la
 * respuesta puede llevar frases en español cuando la pedagogía lo pide.
 * El bloque SPANISH IN YOUR VOICE del prompt es el que decide cuándo, y
 * los marcadores nunca llegan a la pantalla: ver src/lib/habla.ts.
 */

/** Comportamiento por nivel. Sale de docs/CURRICULO.md, sección 2. */
const COMPORTAMIENTO: Record<Nivel, string> = {
  A1: `Speak VERY slowly. Keep your replies to 5-8 words in normal
conversation (answering the student's explicit questions is exempt).
Correct ONLY what makes you unable to understand. Let articles,
prepositions and plurals go.`,

  A2: `Speak slowly. Keep your replies to 8-12 words.
Correct basic verb tenses and word order. Let nuance and collocations go.`,

  B1: `Speak at a natural but unhurried pace. Replies of 12-20 words.
Correct verb tenses, common prepositions, and problem sounds.`,

  B2: `Speak naturally. Replies of 20-30 words.
Correct naturalness, collocations and phrasal verbs.`,

  C1: `Speak at full natural pace. Replies of 30-45 words.
Correct register, nuance and idiomatic usage.`,

  C2: `Speak like a native to a native. No length limit.
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

/**
 * Cuánto español lleva la clase, por nivel. Va aparte del comportamiento
 * porque es la parte del prompt que más se va a afinar con el uso.
 *
 * La idea pedagógica: el español es andamio, no idioma de la clase. En
 * A1 sostiene (la instrucción y la pregunta llegan también en español
 * para que el alumno pueda ACTUAR); en A2 solo aparece donde el alumno
 * tropieza; de B1 en adelante, solo si lo pide. Y siempre después del
 * inglés: lo primero que entra al oído es inglés.
 */
const ESPANOL_POR_NIVEL: Record<Nivel, string> = {
  A1: `- Your level rule (A1): Spanish is part of the class. After an English
  sentence the student must ACT on -- your question, an instruction, a
  new word or structure -- add its meaning in Spanish. Not every
  sentence: at most one Spanish sentence for every two in English. If
  they answered your last question correctly in English, skip the
  Spanish this turn: they are understanding.`,
  A2: `- Your level rule (A2): Spanish only for an instruction, a new
  structure, or when they stumble (a wrong answer, "what?", a very short
  or empty reply). At most one Spanish sentence per turn.`,
  B1: `- Your level rule (B1): Spanish only when they ask for it or are
  clearly lost. One sentence, then back to English.`,
  B2: `- Your level rule (B2): no Spanish unless they explicitly ask. Then
  give it once, briefly, and continue in English.`,
  C1: `- Your level rule (C1): no Spanish unless they explicitly ask. Then
  give it once, briefly, and continue in English.`,
  C2: `- Your level rule (C2): no Spanish unless they explicitly ask. Then
  give it once, briefly, and continue in English.`,
};

export interface Alumno {
  nombre: string;
  nivel: Nivel;
  /** Temas que todavía falla, para que Allison los persiga. */
  temasAbiertos?: string[];
  /** Temas ya dominados, para poder felicitarlo. */
  temasDominados?: string[];
}

const SIN_SENALES: SenalesEspanol = { turnos: 0, pidioEspanol: 0, usoEspanol: 0 };

export function construirInstruccion(
  alumno: Alumno,
  tema?: string,
  leccion?: Unidad,
  senales: SenalesEspanol = SIN_SENALES
): string {
  const { nombre, nivel } = alumno;
  const primerNombre = nombre.split(" ")[0];

  /**
   * El bloque de la lección: convierte la charla libre en una clase
   * con objetivo. La regla de oro está al final del bloque: se enseña
   * PREGUNTANDO cosas cuya respuesta natural obliga a usar la
   * estructura, nunca dictando gramática que nadie pidió.
   */
  const bloqueLeccion = leccion
    ? `

TODAY'S LESSON — "${leccion.titulo}"
Communicative goal: the student can ${leccion.metaEn}.
Target structure: ${leccion.estructuraEn}.
Useful vocabulary to work in naturally: ${leccion.vocabulario.join(", ")}.

How to run the lesson:
- Steer with your QUESTIONS: ask things whose natural answer needs the
  target structure. Never lecture about the structure unprompted --
  make them USE it.
- If the conversation is just starting, open with: "${leccion.apertura}"
  (greet them by name first, naturally).
- If they drift to another topic, follow them for a turn -- it is a
  conversation, not a script -- then bring it back with your next
  question.
- Corrections that touch the target structure matter most: recast those
  first in your spoken reply.
- "objetivoUsado": set it to true ONLY if in THIS turn the student
  produced the target structure correctly in a sentence of their own --
  not a word-for-word repetition of yours. In every other case,
  including doubt, set false.`
    : "";

  /**
   * Las cifras del hábito las calcula el servidor (src/lib/habla.ts,
   * senalesDeEspanol) y el prompt las usa como hechos: el modelo no
   * tiene que contar, solo aplicar la regla. Sin ellas, la regla del
   * hábito no se activa.
   */
  const bloqueHabito = `In the last ${senales.turnos} student turns, the
student spoke Spanish or asked for Spanish ${senales.pidioEspanol} times,
and you used Spanish in ${senales.usoEspanol} of your replies.`;

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
- Your answer is in ENGLISH, simple and level-appropriate, with Spanish
  sentences ONLY as the next section allows. The app also shows a
  Spanish translation of everything you say with one tap.

SPANISH IN YOUR VOICE
Your voice speaks English AND Spanish. Spanish is a tool for
understanding, never the language of the class: the goal is always
more English in the student's ear, and every turn ends in English so
that they answer in English.

How to write it — a format rule the app depends on:
- Put [es] before a Spanish sentence and [en-US] where English resumes:
  "You WENT to the park. [es] Fuiste al parque. [en-US] Who did you go
  with?"
- The app deletes the markers from the screen and uses them only to
  switch the language of your voice. The student never sees them, so
  never mention them and never write "in Spanish:" or a translation in
  parentheses. Just the marker and the sentence.
- Markers wrap WHOLE sentences. Never in the middle of a sentence,
  never inside a quoted English example, never around a single word.
- Only [es] and [en-US]. No other codes.
- No Spanish without its marker: unmarked Spanish is read with English
  sounds and comes out mangled.
- Natural Colombian Spanish, "tú" form, warm. A Spanish sentence gives
  the MEANING of what you just said in English; it is not a word-for-
  word translation and it never adds new content.
- English first, Spanish after it, and the last sentence of your turn
  is in English. One exception: when the student wrote to you in
  Spanish because they are lost or upset, you may open with ONE short
  Spanish sentence, then continue in English.
- Corrections stay as they are: the recast in your reply is in English;
  the Spanish explanation of a rule goes in "explicacionEs", not in
  your voice.

When to use it:
${ESPANOL_POR_NIVEL[nivel]}
- When they ask or show frustration -- "no entiendo", "en español",
  "más despacio", "repite", a reply written in Spanish, "this is too
  hard", "what?" twice in a row -- give the Spanish help THIS turn,
  after the English, short. Never sound bothered by the request: that
  is the moment they need you most.

When it becomes a habit. ${bloqueHabito}
These rules override the level rule:
- If that count is 3 or more, they are leaning on Spanish instead of
  training their ear. Keep your Spanish to ONE short sentence at most,
  and -- once, not every turn; skip it if you already said it in the
  messages above -- recommend, kindly and as a teacher, that they train
  the ear instead: listen to your message again with the play button,
  use the slow speed, read the Translation on screen when they need it,
  and answer in English even with mistakes. Say it in English and then
  in Spanish with its marker, so it lands. Then continue as their level
  rule says.
- If it is 5 or more, stop translating your questions: ask in English
  only, with simpler words, and encourage them to try.
${tema ? `\nToday's topic: ${tema}` : ""}${bloqueLeccion}

WHAT YOU RETURN
- "transcripcion": what the student ACTUALLY said IN THIS TURN'S
  AUDIO, word for word, errors included. Never fix it here. It comes
  ONLY from the attached audio: NEVER copy, repeat or reconstruct it
  from earlier messages — guessing from history invents a turn the
  student never said. If you cannot hear real speech, return an empty
  string and nothing else. Never put language markers here.
- "respuesta": what you say back: English, with Spanish sentences ONLY
  as SPANISH IN YOUR VOICE allows, each one inside its markers.
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

Shape of a good answer — in English, simple enough for the student's
level, with Spanish only as SPANISH IN YOUR VOICE allows:
  1. The rule, in one or two short plain sentences.
  2. TWO example sentences, so the rule is visible in use.
  3. An invitation: "Try saying: ...".

Model answer for a B1 or higher student who asks (in Spanish) the
difference between was and were:
"Good question! 'Was' and 'were' are both the past of 'to be'. 'Was'
goes with I, he, she and it: 'I was happy'. 'Were' goes with you, we
and they: 'They were at home'. Try saying: I was at school yesterday."

The same answer for an A1 or A2 student, with the Spanish support their
level allows:
"Good question! 'Was' and 'were' are both the past of 'to be'. [es] Las
dos son el pasado de 'to be'. [en-US] 'Was' goes with I, he, she and it:
'I was happy'. 'Were' goes with you, we and they: 'They were at home'.
[es] 'Was' va con yo, él y ella; 'were' con tú, nosotros y ellos. [en-US]
Try saying: I was at school yesterday."

Model answer — student asks how to say "quiero ir al baño":
"You say: 'I want to go to the bathroom'. More polite: 'Can I go to
the bathroom, please?'. Try saying: Can I go to the bathroom, please?"`;
}

const ESQUEMA_RESPUESTA = {
  type: Type.OBJECT,
  properties: {
    transcripcion: {
      type: Type.STRING,
      description: "Literal transcript, errors preserved exactly as spoken",
    },
    respuesta: {
      type: Type.STRING,
      description:
        "Allison's reply. English; Spanish sentences only where the rules allow, each wrapped as [es] ... [en-US]",
    },
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
    objetivoUsado: {
      type: Type.BOOLEAN,
      description:
        "Lesson mode only: true ONLY if the student produced today's target structure correctly in their own sentence this turn. Otherwise false.",
    },
  },
  required: ["transcripcion", "respuesta", "correcciones"],
};

export interface RespuestaAllison {
  transcripcion: string;
  /** Lo que se MUESTRA: sin marcadores de idioma. */
  respuesta: string;
  /** Lo que se DICE: con los marcadores [es] / [en-US] para la voz.
   *  Idéntico a `respuesta` cuando no hubo español. */
  respuestaVoz: string;
  correcciones: Correccion[];
  /** Solo en modo lección: el alumno usó bien la estructura objetivo. */
  objetivoUsado: boolean;
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
  audioBase64?: string;
  mimeType?: string;
  texto?: string;
  alumno: Alumno;
  historial?: Mensaje[];
  tema?: string;
  leccion?: Unidad;
  senales?: SenalesEspanol;
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
  /** La unidad del currículo, cuando la conversación es una lección. */
  leccion?: Unidad;
  /** Cuánto español lleva la conversación (src/lib/habla.ts). */
  senales?: SenalesEspanol;
  /** 0 para evaluaciones reproducibles; 0.8 en conversación real. */
  temperatura?: number;
}): AsyncGenerator<
  | { tipo: "transcripcion"; texto: string }
  | { tipo: "respuesta"; texto: string; voz: string }
  | { tipo: "fin"; resultado: RespuestaAllison }
> {
  const {
    audioBase64,
    mimeType,
    texto,
    alumno,
    historial = [],
    tema,
    leccion,
    senales,
    temperatura = 0.8,
  } = opciones;

  if (!texto && !audioBase64) {
    throw new Error("Hace falta el audio o el texto del alumno");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Sus propias respuestas van al modelo CON marcadores: es el formato
  // que debe seguir produciendo, y viéndolo en su historial lo mantiene.
  const contexto = historial.slice(-12).map((m) => ({
    role: m.rol === "alumno" ? "user" : "model",
    parts: [{ text: m.rol === "allison" ? (m.textoVoz ?? m.texto) : m.texto }],
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
                // El ancla existe por un fallo real: sin ella, el modelo
                // a veces "transcribe" copiando el mensaje anterior del
                // historial en vez de escuchar el audio nuevo.
                text: "[AUDIO OF THE CURRENT TURN. Transcribe exactly and only what you hear in this attachment. The chat history above is context for your reply, NEVER a source for the transcription.]",
              },
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
        construirInstruccion(alumno, tema, leccion, senales) +
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
      // Sin tope, un bucle del modelo llegó a 200KB en una prueba real.
      // Un turno legítimo — transcripción + respuesta + correcciones —
      // cabe de sobra en mil tokens.
      maxOutputTokens: 1024,
    },
  });

  /**
   * El modelo a veces intercala marcas de tiempo ("00:01") sacadas del
   * audio — al inicio o en la mitad de la frase. No es nada que el
   * alumno haya dicho, así que se filtran como palabras sueltas.
   * Costo asumido: si un alumno dictara una hora tipo "3:30", también
   * caería; hablado casi siempre se transcribe en palabras.
   */
  const sinArtefactos = (t: string): string => {
    const limpio = t
      .split(" ")
      .filter((p) => !/^[0-9]{1,2}:[0-9]{2}$/.test(p))
      .join(" ")
      .replace(/ {2,}/g, " ")
      .trim();

    // Eco duplicado: cuando el modelo alucina, a veces pega la misma
    // frase dos veces seguidas ("X X"). Ninguna frase real de más de
    // doce letras es idéntica a su propia segunda mitad.
    const mitad = Math.floor(limpio.length / 2);
    const a = limpio.slice(0, mitad).trim().toLowerCase();
    const b = limpio.slice(limpio.length - mitad).trim().toLowerCase();
    if (a.length > 12 && a === b) return limpio.slice(0, mitad).trim();

    return limpio;
  };

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
        yield { tipo: "transcripcion", texto: quitarMarcadores(sinArtefactos(t)) };
      }
    }

    if (entregada.transcripcion && !entregada.respuesta) {
      const r = campoCompleto(acumulado, "respuesta");
      if (r !== null) {
        entregada.respuesta = true;
        // La misma respuesta, dos veces: limpia para leerla y con los
        // marcadores para decirla.
        const voz = normalizarMarcadores(r);
        yield { tipo: "respuesta", texto: quitarMarcadores(voz), voz };
      }
    }
  }

  let datos: {
    transcripcion?: string;
    respuesta?: string;
    correcciones?: Correccion[];
    objetivoUsado?: boolean;
  };
  try {
    datos = JSON.parse(acumulado || "{}");
  } catch {
    // El JSON llegó cortado (tope de tokens o desborde del modelo). Se
    // rescatan los campos que alcanzaron a cerrar; si falta alguno de
    // los dos esenciales, el turno se anula entero — la transcripción
    // vacía hace que la ruta devuelva el crédito al alumno.
    const t = campoCompleto(acumulado, "transcripcion") ?? "";
    const r = campoCompleto(acumulado, "respuesta") ?? "";
    datos =
      t && r
        ? { transcripcion: t, respuesta: r, correcciones: [] }
        : { transcripcion: "", respuesta: "", correcciones: [] };
  }

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
    t.trim().toLowerCase().replace(/[.,;:!?¡¿"'‘’]/g, "").replace(/\s+/g, " ");

  const transcripcionLimpia = quitarMarcadores(sinArtefactos(datos.transcripcion ?? ""));
  const dicho = normalizar(transcripcionLimpia);

  const correcciones = ((datos.correcciones ?? []) as Correccion[]).filter((c) => {
    if (!c?.original?.trim() || !c?.correccion?.trim()) return false;
    const o = normalizar(c.original);
    const co = normalizar(c.correccion);
    if (o === co) return false;

    // Corrección fantasma: el "original" no aparece en lo que el alumno
    // dijo. Caso real de la batería: el alumno dijo bien "Yesterday I
    // went..." y el modelo, empujado por el objetivo de la lección,
    // inventó "I go -> I went". Si no lo dijo, no se le corrige. La
    // pronunciación queda exenta: su "original" describe lo que se OYÓ
    // ("espain"), que no siempre coincide con lo transcrito.
    if (c.tipo !== "pronunciacion" && dicho.length > 0 && !dicho.includes(o)) {
      return false;
    }

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

    // La misma hipercorreccion, en su forma desnuda: original "me",
    // correccion "I". Cambiar el caso de un pronombre suelto nunca es
    // una correccion real de habla.
    const objeto = new Set(["me", "us", "him", "her", "them"]);
    const sujeto = new Set(["i", "we", "he", "she", "they", "i am", "we are", "they are"]);
    if (objeto.has(o) && sujeto.has(co)) return false;

    return true;
  });

  const enEspanol = esTurnoEnEspanol(transcripcionLimpia);

  /**
   * El logro de la lección lo declara el modelo, pero el motor lo
   * VETA en los casos donde no puede ser verdad: sin lección no hay
   * objetivo, un turno en español no contiene la estructura, y un
   * turno vacío no contiene nada. La misma filosofía que las
   * correcciones: el prompt propone, el código dispone.
   */
  const objetivoUsado =
    Boolean(leccion) &&
    datos.objetivoUsado === true &&
    !enEspanol &&
    transcripcionLimpia.length > 0;

  // La respuesta, dos veces: con marcadores para la voz y limpia para
  // la pantalla. Si el modelo no usó español, son la misma cadena.
  const respuestaVoz = normalizarMarcadores(datos.respuesta ?? "");

  yield {
    tipo: "fin",
    resultado: {
      transcripcion: transcripcionLimpia,
      respuesta: quitarMarcadores(respuestaVoz),
      respuestaVoz,
      correcciones: enEspanol ? [] : correcciones,
      objetivoUsado,
      tokensEntrada: uso?.promptTokenCount ?? 0,
      tokensSalida: uso?.candidatesTokenCount ?? 0,
    },
  };
}
