import { GoogleGenAI, Type } from "@google/genai";
import { esEspanolClaro, esInglesClaro, separarIdiomas } from "../allison.ts";
import { estaEnLoDicho } from "../evaluacion.ts";
import { conPunto, MARCADOR_EN, MARCADOR_ES, quitarMarcadores } from "../habla.ts";
import { limpiarTranscripcion } from "../transcripcion.ts";
import type { Nivel } from "../tipos.ts";
import { preguntaDeAdivinar, type LecturaAdivina } from "./adivina.ts";
import type { Adivina, Ensenale, Entrevista, Escenario } from "./tipos.ts";

/**
 * Las dos actividades de la ruta en las que Allison CONVERSA:
 *
 *   · El escenario de cierre (plan, sección 8): Allison hace un papel
 *     ("el agente de migración"), lleva al alumno por sus tareas, no
 *     corrige durante la escena y anota en silencio un error para el
 *     resumen.
 *   · La Entrevista a Allison (sección 6): el alumno pregunta y Allison
 *     contesta con su ficha aprobada y le devuelve la pregunta.
 *
 * Las dos respetan las reglas del prompt principal: el español y el
 * inglés van en campos separados y el código arma la respuesta, y lo
 * que el alumno debía decir NO se le muestra al modelo que transcribe
 * (memoria "evaluación a ciegas": si lo sabe, lo "oye" aunque no esté).
 */

/** Palabras como máximo por respuesta, igual que en la conversación (allison.ts). */
const PALABRAS: Record<Nivel, number> = { A1: 8, A2: 12, B1: 20, B2: 30, C1: 45, C2: 45 };

/** La frase con la que Allison sale un momento del papel cuando el alumno habla en español. */
export const EN_INGLES = "En inglés se dice así:";

/** Desde B1: cuando el alumno habla en español, Allison lo pide en inglés, sin salir del inglés. */
const EN_INGLES_B1 = "Sorry, in English, please!";

/** Cuando no se oye nada: no cuenta como intento (plan, sección 5). */
export const REPETIR = "Sorry, can you repeat that?";

function cliente() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const modelo = () => process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

// ---------------------------------------------------------------------
//  El escenario
// ---------------------------------------------------------------------

export interface TurnoEscenario {
  escenario: Escenario;
  nivel: Nivel;
  nombre: string;
  /** Lo dicho antes, en orden. De Allison solo va su parte en inglés. */
  historial: { rol: "alumno" | "allison"; texto: string }[];
  /** Las tareas ya cumplidas (números desde 1). */
  cumplidas: number[];
  /** Es el último turno permitido: Allison cierra la escena. */
  ultimo: boolean;
  /** El número de este turno del alumno (desde 1). */
  turno: number;
  /** La escena dura como mínimo esta cantidad de turnos del alumno. */
  minimo: number;
  /** Reglas propias de la actividad (un viaje: los datos que puede usar, qué evitar). */
  extra?: string;
  texto?: string;
  audioBase64?: string;
  mimeType?: string;
}

export interface ResultadoEscenario {
  transcripcion: string;
  /** Tareas que cumplió ESTE mensaje. */
  tareas: number[];
  /** Lo que se muestra. */
  respuesta: string;
  /** Lo que se dice: con los marcadores [es]/[en-US] si lleva español. */
  respuestaVoz: string;
  /** El error más importante, para el resumen. Allison no lo dice en la escena. */
  error: { dijo: string; mejor: string } | null;
  /**
   * La idea de qué responderle a ESTA línea de Allison (el botón de la
   * idea): la escribe el mismo modelo que hace la línea, así siempre
   * corresponde a lo que ella acaba de decir. `tarea` es la tarea que
   * cumple, o 0 si responde una pregunta de más. Null si no hay.
   */
  idea?: { en: string; es: string; tarea: number } | null;
  /**
   * El modelo no dio una línea que sirva (JSON roto, respuesta vacía o
   * solo en español). Es falla de la IA: la ruta devuelve la intervención.
   */
  sinRespuesta?: boolean;
  tokensEntrada: number;
  tokensSalida: number;
}

/**
 * Los números de las tareas que ya se ven (desde 1). La del imprevisto
 * (B1) no se ve hasta cumplir la tarea después de la cual pasa.
 */
export function tareasVisibles(e: Escenario, cumplidas: number[]): number[] {
  const todas = e.tareas.map((_, i) => i + 1);
  const imp = e.imprevisto;
  if (!imp || cumplidas.includes(imp.despuesDeTarea)) return todas;
  return todas.filter((n) => n !== imp.tarea);
}

/**
 * Junto a cada tarea, lo que dice el alumno para cumplirla en el diálogo
 * de ejemplo. Así el modelo no da una tarea por cumplida a medias: en B1
 * contaba "pide lo que necesitas" cuando el alumno apenas explicaba el
 * problema, y en el catálogo "Di de dónde vienes y por qué viajas" con
 * solo "I am from Colombia" (pruebas en producción, octubre de 2026).
 */
function conEjemplo(e: Escenario, tarea: number): string {
  const dice = e.dialogo.filter((l) => l.quien === "alumno" && l.tarea === tarea).map((l) => l.dice);
  return dice.length ? ` (example: "${dice.join(" / ")}")` : "";
}

/** El imprevisto ya pasó: se cumplió la tarea después de la cual llega. */
function imprevistoPaso(e: Escenario, cumplidas: number[]): boolean {
  return !!e.imprevisto && cumplidas.includes(e.imprevisto.despuesDeTarea);
}

/** Las líneas del personaje en el diálogo de ejemplo: cómo habla, no un guion. */
function lineasDelPersonaje(e: Escenario): string {
  return e.dialogo
    // Las acotaciones ("(pasa caminando)") no se dicen.
    .filter((l) => l.quien === "personaje" && !/^\(.*\)$/.test(l.dice.trim()))
    .map((l) => `  "${l.dice}"`)
    .join("\n");
}

function instruccionEscenario(t: Omit<TurnoEscenario, "texto" | "audioBase64" | "mimeType">): string {
  const e = t.escenario;
  const visibles = tareasVisibles(e, t.cumplidas);
  const pendientes = visibles.filter((n) => !t.cumplidas.includes(n));
  const otraVez = e.siSeAtasca.find((s) => /no cumple la tarea/i.test(s.situacion));
  const imp = e.imprevisto;
  const sorpresa = !imp
    ? ""
    : imprevistoPaso(e, t.cumplidas)
      ? `\n- THE SURPRISE already happened (in Spanish): ${imp.texto} Task ${imp.tarea} is to solve it. Play along with it.`
      : `\n- A SURPRISE comes right after task ${imp.despuesDeTarea}. Do not mention it before. If the student's message does task ${imp.despuesDeTarea}, in "respuesta" only react in a few words, with NO question: the app adds the surprise line.`;
  return `You are Allison, an AI English teacher. Right now you are PLAYING A ROLE
in a short scene with ${t.nombre}, a Spanish-speaking teenager from
Colombia (English level ${t.nivel}).

THE SCENE
- The situation (in Spanish): ${e.contexto}
- Your role (in Spanish): ${e.personaje}
- How your character talks (examples, not a script):
${lineasDelPersonaje(e)}
- The student's tasks, in order (in Spanish):
${visibles.map((n) => `  ${n}. ${e.tareas[n - 1]}${conEjemplo(e, n)}`).join("\n")}
- Pending tasks: ${pendientes.length ? pendientes.join(", ") : "none, all done"}.${sorpresa}

HOW YOU PLAY
1. Stay in your role all the time. Talk like that person, in very simple,
   natural and always correct US English: one or two short sentences, at
   most ${PALABRAS[t.nivel]} words in total.
   You are ONLY your role; the student is the other person. When they
   answer in English, never say their answer as if it were yours: they
   say "I from Colombia" -> never "I'm from Colombia." React to it as
   yourself, about THEM: "Oh, you're from Colombia! Nice!" Never answer
   your own question. (When they speak Spanish, rule 5 applies.)
2. Lead the student to the next pending task with one simple question,
   like the examples. Never do a pending task for them: if a task is to
   ask for something (the price, the time, the way), do not say it until
   they ask.
   The scene lasts at least ${t.minimo} student turns. Between tasks you
   may ask ONE extra simple question that fits the situation and your
   role, so the scene does not end too soon: first the questions of the
   examples that you have not asked yet, and never harder words than the
   examples${
     t.nivel === "A1" || t.nivel === "A2" ? ` ("purpose", "declare" are too hard for ${t.nivel})` : ""
   }. After it, always come back to the next pending task: the
   scene must not lose its goal. Do not say
   goodbye before turn ${t.minimo}: if the student says goodbye earlier,
   answer kindly and ask one more question.
3. NEVER correct the student and never explain grammar in the scene. If
   you understand them, the scene goes on.
4. If their message does not do the task you asked about, stay in your
   role and ask again, simpler.${otraVez ? ` Example: ${otraVez.ejemplo}` : ""}
5. If the student speaks Spanish, even mixed with a few English words
   ("espanol": true): no task counts. In "traduccion" write only what
   they just said, all of it translated to simple correct English -- not
   your answer to it, without fillers or repeated words. "Soy de
   Colombia" -> "I'm from Colombia." "Me llamo Diego" -> "My name is
   Diego." "Okay okay, somos 14 personas" -> "We are fourteen people."${t.nivel !== "A1" && t.nivel !== "A2" ? ` (Level ${t.nivel}: never write Spanish; the app adds "Sorry, in English, please!".)` : ""}
6. You are an AI teacher: never say you are a person.
${t.extra ? `\n${t.extra.trim()}\n` : ""}
THE JSON
- "transcripcion": exactly what the student said, in the language they
  used, with their mistakes. Never complete it or correct it. "" if you
  hear no voice.
- "espanol": true if the student's last message is in Spanish, or
  mixes Spanish words into English ("Okay, somos catorce" -> true).
- "tareas": the numbers of the PENDING tasks that the student's last
  message does: in English, understandable, even with mistakes. [] if
  none. Count only what the student said, never what you said.
  A task counts only if the message really does ALL of it, like its
  example (other words are fine). Talking about something near the task
  is not doing it, and a task with two parts ("greet AND say your
  name") needs both.
- "respuesta": your line in the scene. English only.
- "traduccion": only if they spoke Spanish, their words in simple
  correct English (rule 5). "" otherwise.
- "idea": what the STUDENT could say back to YOUR line right now: one
  short, simple English sentence for a ${t.nivel} student (at most
  ${PALABRAS[t.nivel] + 4} words). It is the student's line, never
  yours: never what your character says. If your line asks something,
  the idea answers it; if it asks nothing, the idea does the next
  pending task. "" if you said goodbye.
- "ideaEs": the idea in natural Colombian Spanish.
- "ideaTarea": the number of the pending task that the idea does, or 0.
- "errorDijo" and "errorMejor": the most important grammar or word
  mistake in the student's last English message: their exact words and
  the same sentence said correctly, at most 12 words each (only the part
  with the mistake). A wrong ANSWER is not a mistake. "" and "" if
  there is no mistake or they spoke Spanish.`;
}

function recordatorioEscenario(t: {
  ultimo: boolean;
  cumplidas: number[];
  escenario: Escenario;
  turno: number;
  minimo: number;
}): string {
  if (t.ultimo) {
    return "[LAST turn: close the scene kindly in your role and say goodbye. Do NOT ask any question.]";
  }
  const cuenta = `Student turn ${t.turno} of at least ${t.minimo}.`;
  const sinDespedirse = t.turno < t.minimo ? " Do not say goodbye yet: end with a simple question." : "";
  const imp = t.escenario.imprevisto;
  const antesDeSorpresa =
    imp && !t.cumplidas.includes(imp.despuesDeTarea)
      ? ` If this message does task ${imp.despuesDeTarea}, only react in a few words with no question.`
      : "";
  if (t.cumplidas.length >= t.escenario.tareas.length) {
    return `[${cuenta} All tasks are done: keep chatting in your role, short and friendly.${
      sinDespedirse || " If they say goodbye, say goodbye."
    }]`;
  }
  const quedan = tareasVisibles(t.escenario, t.cumplidas).filter((n) => !t.cumplidas.includes(n));
  const pendientes = quedan.map((n) => `${n}. ${t.escenario.tareas[n - 1]}`).join(" ");
  // La tarea que sigue, con la pregunta del ejemplo que lleva a ella: con
  // varias intervenciones encima, el modelo se quedaba conversando y la
  // escena perdía su objetivo (prueba en producción, octubre de 2026). Si
  // quedan tantas tareas como turnos para el mínimo, nada de preguntas de más.
  const pregunta = preguntaDeLaTarea(t.escenario, quedan[0]);
  const sinHolgura = quedan.length >= t.minimo - t.turno;
  // Si la tarea es que el alumno pregunte, "llevar a ella" no es hacerla:
  // en los viajes (sin diálogo de ejemplo) Allison preguntaba ella misma
  // "Who built Chichén Itzá?" (pruebas, octubre de 2026).
  const lePregunta = quedan.some((n) => /^pregunta/i.test(t.escenario.tareas[n - 1]));
  const meta =
    ` Your line ends with ONE simple question that leads to the first pending task this message does not do` +
    `${pregunta ? ` (for task ${quedan[0]}, like "${pregunta}")` : ""}.` +
    `${lePregunta ? ` When that task is for the student to ASK something, never ask it or answer it yourself: invite them to ask ("Do you have a question about it?").` : ""}` +
    `${sinHolgura ? " No extra questions now." : ""}`;
  return `[${cuenta} Pending tasks: ${pendientes}${meta} Stay in your role, English only in respuesta, never correct, short.${
    sinDespedirse ? " Do not say goodbye yet." : ""
  }${antesDeSorpresa}]`;
}

const ESQUEMA_ESCENARIO = {
  type: Type.OBJECT,
  properties: {
    transcripcion: { type: Type.STRING },
    espanol: { type: Type.BOOLEAN },
    tareas: { type: Type.ARRAY, items: { type: Type.INTEGER } },
    respuesta: { type: Type.STRING },
    traduccion: { type: Type.STRING },
    errorDijo: { type: Type.STRING },
    errorMejor: { type: Type.STRING },
    idea: { type: Type.STRING },
    ideaEs: { type: Type.STRING },
    ideaTarea: { type: Type.INTEGER },
  },
  required: ["transcripcion", "espanol", "tareas", "respuesta", "traduccion", "errorDijo", "errorMejor", "idea", "ideaEs", "ideaTarea"],
  propertyOrdering: [
    "transcripcion",
    "espanol",
    "tareas",
    "respuesta",
    "traduccion",
    "errorDijo",
    "errorMejor",
    "idea",
    "ideaEs",
    "ideaTarea",
  ],
};

/** Solo las oraciones en inglés: lo que el modelo deje en español se cae. */
export function soloIngles(texto: string): string {
  return separarIdiomas(quitarMarcadores(texto)).ingles.trim();
}

/** ¿El alumno habló en español? Al menos una oración claramente en español y ninguna en inglés. */
export function hablaEspanol(transcripcion: string): boolean {
  const { espanol, ingles } = separarIdiomas(transcripcion);
  return !!espanol.trim() && !ingles.trim() && esEspanolClaro(transcripcion);
}

/**
 * Palabras que en la boca del alumno solo pueden ser español. Sin las
 * que van en los nombres ("de", "la", "del", "y", "San": "Cartagena de
 * Indias", "Diego de la Torre") ni las que también son inglés ("me",
 * "no", "son", "con", "sin", "come").
 */
const ESPANOL_DEL_ALUMNO = new Set([
  "soy", "eres", "es", "somos", "estoy", "estás", "estas", "está", "esta", "estamos", "están",
  "tengo", "tienes", "tiene", "tenemos", "tienen", "quiero", "quieres", "quiere", "queremos", "quisiera",
  "necesito", "puedo", "puedes", "puede", "podemos", "llamo", "llama", "vamos", "voy", "hay", "hace",
  "años", "persona", "personas", "mesa", "cuenta", "gracias", "hola", "por", "favor", "para",
  "una", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
  "doce", "trece", "catorce", "quince", "veinte", "que", "qué", "cómo", "como", "dónde", "donde",
  "cuánto", "cuanto", "cuánta", "cuesta", "sí", "si", "pero", "porque", "también", "tambien", "muy",
  "bien", "bueno", "buena", "buenos", "buenas", "días", "dias", "tardes", "noches", "señor", "señora",
  "agua", "comida", "bebida", "postre", "hamburguesa", "papas", "pollo", "carne", "jugo", "helado",
  "yo", "usted", "ustedes", "nosotros", "aquí", "aqui", "eso", "esto", "ese", "esa", "en", "mi", "mis",
  "mucho", "mucha", "muchos", "gusto", "nombre", "entonces", "pues", "ahora", "todo", "algo",
  "listo", "perdón", "perdon", "disculpe", "ayuda", "baño", "quisiéramos", "traiga", "tráigame",
]);

/**
 * ¿Mezcló español? Dos palabras que solo pueden ser español, o una con
 * "¿" o "¡". "Okay okay, somos 14 personas" es español con una muletilla
 * en inglés: el modelo lo tomó por inglés, contó la tarea y siguió en su
 * papel (prueba en producción, octubre de 2026). "I want a hamburguesa"
 * (una sola palabra) sigue siendo inglés con una palabra que no sabía.
 */
export function mezclaEspanol(transcripcion: string): boolean {
  const deEspanol = (transcripcion.toLowerCase().match(/[a-záéíóúñü]+/g) ?? []).filter((p) => ESPANOL_DEL_ALUMNO.has(p)).length;
  return deEspanol >= 2 || (deEspanol >= 1 && /[¿¡]/.test(transcripcion));
}

/** Lo que se dice igual en inglés y no dice nada del idioma de la frase. */
const MULETILLAS_EN = /\b(okay|ok|yes|yeah|yep|no|hello|hi|hey|um+|uh+|ah+|oh+|so|well|wow|sorry|please|thanks|thank you)\b/gi;

/**
 * ¿Es inglés claro lo que dijo el alumno? Sin las muletillas: "Okay" no
 * vuelve inglés a "Okay okay, somos 14 personas". Solo muletillas
 * ("Okay.", "Yes, please!") sí es inglés.
 */
function inglesClaroDelAlumno(transcripcion: string): boolean {
  const resto = transcripcion.replace(MULETILLAS_EN, " ").replace(/[\s,.!?;:]+/g, " ").trim();
  return !resto || esInglesClaro(resto);
}

/**
 * Las tareas que el código reconoce solo, como respaldo del modelo: en
 * las pruebas, flash-lite dejó pasar un "Thank you. Goodbye!" una de cada
 * tres veces, y con las 7 tareas de la Parada 1, un "My name is Diego."
 * de cada cien turnos (octubre de 2026). Solo cuando la tarea es
 * únicamente eso ("Saluda.", "Di cómo te llamas.") y la frase lo dice
 * sin duda ("my name is…", "I'm from…"). Solo agrega: una respuesta
 * corta que el modelo sí entendió ("Diego.") sigue contando.
 */
const SALUDO = /\b(hi|hello|hey|good (morning|afternoon|evening))\b/i;
/**
 * "See you" solo como despedida ("See you later!", "See you!" al final):
 * "Nice to see you!" e "I can see you!" son saludos (auditoría, octubre
 * de 2026: marcaban la despedida en el primer turno).
 */
const DESPEDIDA = /\b(bye|goodbye|good night|have a (nice|good) (day|night|evening))\b|\bsee you (later|soon|tomorrow|next|on|at|then|there)\b|\bsee you[.!\s]*$/i;
const NO_ES_DESPEDIDA = /\b(good|nice|great|happy) to see you\b|\bcan see you\b/i;
/** Lo que va después de "I'm" y no es un nombre ("I'm Colombian", "I'm Fine"). */
/** Pagar: entregar el dinero o decir cómo. */
const PAGA =
  /\b(here you (are|go)|here it is|here's (the|my|your) (money|card|cash)|i('ll| will) pay|i('d like to| want to| can) pay|(by|with) (card|cash|credit card))\b/i;
const GRACIAS = /\b(thanks?|thank you)\b/i;
/**
 * Solo un saludo ("Hello, good morning.", "Hi! How are you?"): no hace
 * "Saluda y di para cuántas personas es la mesa". El modelo lo llegó a
 * contar así (pruebas, octubre de 2026).
 */
function soloSaluda(dicho: string): boolean {
  const resto = conApostrofoRecto(dicho)
    .replace(/\b(hi|hello|hey|good (morning|afternoon|evening)|there|allison|how are you|nice to meet you|okay|ok)\b/gi, " ")
    .replace(/[^a-z0-9]/gi, "");
  return SALUDO.test(dicho) && !resto;
}
const NO_ES_NOMBRE =
  /\b(?:I'm|I am) (?:Fine|Good|Great|Ok|Okay|Here|From|Colombian|American|Mexican|Canadian|Spanish|English|British|Brazilian|Peruvian|Venezuelan|Argentinian|Argentine|Chilean|Ecuadorian|French|Italian|German|Chinese|Japanese|Korean)\b/;
const diceSuNombre = (d: string) => /\bmy name(?:'s| is) [a-z]+/i.test(d) || (/\b(?:I'm|I am) [A-Z][a-z]+\b/.test(d) && !NO_ES_NOMBRE.test(d));

const RECONOCIBLES: [RegExp, (dicho: string) => boolean][] = [
  [/^saluda\.?$/, (d) => SALUDO.test(d)],
  [/^(da las gracias y )?despídete\.?$/, (d) => DESPEDIDA.test(d) && !NO_ES_DESPEDIDA.test(d)],
  // "I'm Diego" con mayúscula: "I'm happy" no es un nombre.
  [/^(di cómo te llamas|di tu nombre)\.?$/, diceSuNombre],
  [/^saluda y di tu nombre\.?$/, (d) => SALUDO.test(d) && diceSuNombre(d)],
  // "Here you are. Thank you!" es el ejemplo mismo y el modelo no lo contó
  // tres veces seguidas: la escena no terminaba (pruebas, octubre de 2026).
  [/^paga y da las gracias\.?$/, (d) => PAGA.test(d) && GRACIAS.test(d)],
  [/^paga y despídete\.?$/, (d) => PAGA.test(d) && DESPEDIDA.test(d) && !NO_ES_DESPEDIDA.test(d)],
  [/^paga( el pasaje| la cuenta)?\.?$/, (d) => PAGA.test(d)],
  [/^di de dónde (vienes|eres)\.?$/, (d) => /\b(?:i'?m|i am|i come) from [a-z]+/i.test(d)],
  // La edad es la suya: "My brother is ten years old" no cuenta.
  [/^di cuántos años tienes\.?$/, (d) => /\b(?:i'?m|i am) (?:\d{1,2}|ten|eleven|twelve|[a-z]+teen)\b/i.test(d)],
  [
    /^responde cómo estás\.?$/,
    // "I'm good" y "Good, thanks" sí; "Good morning!", "I'm good at soccer"
    // y "Great! My name is Diego." no son cómo está.
    (d) =>
      /\b(?:i'?m|i am) (?:fine|good|great|ok|okay|well|very well)\b(?! (?:at|in|with|for|to|on)\b)/i.test(d) ||
      /\bfine,? thanks?\b/i.test(d) ||
      /^\s*(?:fine|good|great|ok|okay)[,.!]?\s*(?:thanks?|thank you)\b/i.test(d),
  ],
];

/** Los apóstrofos curvos (el teclado del iPhone, "I’m") como los rectos. */
const conApostrofoRecto = (t: string) => t.replace(/[‘’]/g, "'");

export function tareasObvias(e: Escenario, dicho: string): number[] {
  const d = conApostrofoRecto(dicho);
  return e.tareas
    .map((x, i) => ({ n: i + 1, x: x.trim().toLowerCase() }))
    .filter(({ x }) => RECONOCIBLES.some(([tarea, dice]) => tarea.test(x) && dice(d)))
    .map(({ n }) => n);
}

/**
 * La pregunta con la que el personaje lleva a una tarea en el diálogo de
 * ejemplo: la última pregunta de su línea anterior a la del alumno.
 */
export function preguntaDeLaTarea(e: Escenario, tarea: number): string | null {
  const i = e.dialogo.findIndex((l) => l.quien === "alumno" && l.tarea === tarea);
  for (let k = i - 1; k >= 0; k--) {
    if (e.dialogo[k].quien !== "personaje") continue;
    const preguntas = (e.dialogo[k].dice.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((o) => o.trim()).filter((o) => o.endsWith("?"));
    return preguntas.at(-1) ?? null;
  }
  return null;
}

/** Las oraciones de una línea. */
const oracionesDe = (linea: string) => (linea.match(/[^.!?]+[.!?]+["')]?|[^.!?]+$/g) ?? []).map((o) => o.trim()).filter(Boolean);
const esPregunta = (o: string) => /\?["')]?$/.test(o);

/**
 * ¿La línea le pregunta algo al alumno? Termina en pregunta, o trae una
 * de tres palabras o más. Un eco corto en medio ("Fourteen people? Wow!
 * This way, please.") no le dice qué contestar.
 */
export function llevaPregunta(linea: string): boolean {
  const oraciones = oracionesDe(linea);
  return esPregunta(oraciones.at(-1) ?? "") || oraciones.some((o) => esPregunta(o) && o.split(/\s+/).length >= 3);
}

/** Una pregunta para comparar: sin mayúsculas, signos ni el "And" o "So" del comienzo. */
const comoPregunta = (o: string) => palabras(o).join(" ").replace(/^(?:and|so|okay|ok|great|sure) /, "");

/** Con lo que Allison invita a preguntar cuando la tarea que sigue es que el alumno pregunte y no hay ejemplo. */
export const INVITA_A_PREGUNTAR = "Do you have any questions?";

/**
 * Sin las preguntas de información de Allison ("Who built Chichén
 * Itzá?"): cuando lo que sigue es que el ALUMNO pregunte, si ella lo
 * pregunta, le quita la tarea. En los viajes pasaba siempre en México, aun
 * con la instrucción (pruebas, octubre de 2026). Las que lo invitan a
 * preguntar ("What else do you want to know?") se quedan.
 */
export function sinPreguntasDeInformacion(linea: string): string {
  return oracionesDe(linea)
    .filter((o) => !(esPregunta(o) && /^(?:who|what|where|when|why|how|which|whose)\b/i.test(o) && !/\b(question|ask|know|else|curious)\b/i.test(o)))
    .join(" ");
}

/**
 * Allison no repite entera su línea anterior: después de un "yes" dijo
 * otra vez "Oh, you are from the United States? Is this your first time
 * here?" (prueba en producción, 25 de octubre de 2026). Si el modelo la
 * repite, va la pregunta de la tarea que sigue; si no hay otra, solo
 * vuelve a hacer su pregunta, sin lo demás.
 */
export function sinRepetirLaAnterior(linea: string, anterior: string, siguiente: string | null): string {
  const a = palabras(anterior).join(" ");
  const l = palabras(linea).join(" ");
  const repite = !!a && !!l && (l === a || (a.split(" ").length >= 4 && l.includes(a)));
  if (!repite) return linea;
  if (siguiente && !a.includes(palabras(siguiente).join(" "))) return `Okay! ${siguiente}`;
  return oracionesDe(anterior).filter(esPregunta).at(-1) ?? linea;
}

/** Lo que dice el alumno en primera persona ("I'm here on vacation."): en boca de Allison es el papel al revés. */
const enPrimeraPersona = (o: string) => /^(?:I|I'm|I am|I'd|I'll|I want|My|We|We're)\b/i.test(o);

/**
 * Quita de la línea de Allison lo que no le toca decir (pruebas con el
 * modelo, octubre de 2026):
 *   · la frase del alumno para una tarea pendiente, sea pregunta ("Okay.
 *     Can I have the check, please?", la mesera pidiendo la cuenta) o en
 *     primera persona ("I'm here on vacation. Why are you here?", el
 *     agente contestando su propia pregunta);
 *   · la pregunta que lleva a una tarea que el alumno acaba de cumplir:
 *     "A lemonade, please." → "And what would you like to drink?".
 * Después, si no quedó pregunta, el código pone la de la tarea que sigue.
 */
export function sinFrasesFueraDeLugar(linea: string, e: Escenario, pendientes: Set<number>, hechas: number[]): string {
  const delAlumno = e.dialogo
    .filter((l) => l.quien === "alumno" && !!l.tarea && pendientes.has(l.tarea) && !hechas.includes(l.tarea))
    .flatMap((l) => oracionesDe(l.dice))
    .filter((o) => esPregunta(o) || enPrimeraPersona(o));
  const yaHechas = hechas.map((n) => preguntaDeLaTarea(e, n) ?? "").filter(Boolean);
  const fuera = new Set([...delAlumno, ...yaHechas].map(comoPregunta));
  return oracionesDe(linea)
    .filter((o) => !((esPregunta(o) || enPrimeraPersona(o)) && fuera.has(comoPregunta(o))))
    .join(" ");
}

/**
 * Lo que el alumno dijo, en inglés, listo para que lo repita: sin las
 * palabras repetidas ("Okay Okay we are…") y con su punto final (sin él,
 * "…fourteen people Try it!" se lee como una sola frase).
 */
function fraseLimpia(s: string): string {
  const sin = s
    .replace(/\b([\w']+)(?:[\s,]+\1\b)+/gi, "$1")
    // La muletilla del comienzo no se enseña: "Okay we are…" → "We are…".
    .replace(/^(?:okay|ok|um+|uh+|eh+|so)[\s,]+(?=[a-z])/i, "")
    .trim();
  const frase = sin.charAt(0).toUpperCase() + sin.slice(1);
  return frase && !/[.!?]["')]?$/.test(frase) ? `${frase}.` : frase;
}

/** Las oraciones que no son preguntas. */
function sinPreguntas(texto: string): string {
  return (texto.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [])
    .map((o) => o.trim())
    .filter((o) => o && !o.endsWith("?"))
    .join(" ");
}

/** La despedida del personaje: la parte en inglés del ejemplo de cierre del contenido. */
function despedidaDe(e: Escenario): string {
  const cierre = e.siSeAtasca.find((s) => /intervenciones/i.test(s.situacion));
  const en = cierre ? sinPreguntas(separarIdiomas(cierre.ejemplo).ingles) : "";
  return en || "Thank you! Goodbye!";
}

const palabras = (t: string) =>
  conApostrofoRecto(t)
    .toLowerCase()
    .replace(/[^a-z' ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Lo que se le agrega a una frase al corregirla sin cambiar lo que dice. */
const DE_CORRECCION = new Set(["i", "i'm", "am", "is", "are", "a", "an", "the", "my"]);

/**
 * La frase del alumno dicha por Allison como si fuera suya: el alumno dice
 * "I from Colombia" y ella "I'm from Colombia. Why are you here?" (prueba
 * en producción, octubre de 2026). Si su primera oración está en primera
 * persona y es la del alumno corregida (sus palabras, sin nada nuevo
 * salvo "am", "the"...), se quita. "I like pizza too!" agrega algo suyo
 * ("too"): esa sí es una reacción y se queda.
 */
export function sinEcoDelAlumno(linea: string, dicho: string): string {
  // Si el alumno le preguntó ("I'm fine, thank you. And you?"), su
  // "I'm fine, thank you!" es la respuesta de ella, no un eco.
  if (/\?|\band you\b/i.test(dicho)) return linea;
  const oraciones = (linea.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((o) => o.trim()).filter(Boolean);
  const primera = oraciones[0] ?? "";
  if (!/^(I|I'm|I am|I've|I'd|I'll|I was|My)\b/i.test(primera)) return linea;
  const delAlumno = new Set(palabras(dicho));
  const suyas = palabras(primera);
  const comunes = suyas.filter((w) => delAlumno.has(w) && !DE_CORRECCION.has(w)).length;
  const nuevas = suyas.filter((w) => !delAlumno.has(w) && !DE_CORRECCION.has(w)).length;
  return comunes >= 1 && nuevas === 0 ? oraciones.slice(1).join(" ") : linea;
}

/**
 * ¿"mejor" es la misma frase de "dijo", corregida? Comparten al menos la
 * mitad de las palabras y no son iguales. Así no pasa por error una
 * respuesta que no cumplía la tarea ("I am fine." → "My name is...").
 */
export function esCorreccionDe(dijo: string, mejor: string): boolean {
  const a = palabras(dijo);
  const b = new Set(palabras(mejor));
  if (!a.length || a.join(" ") === [...palabras(mejor)].join(" ")) return false;
  const comunes = a.filter((w) => b.has(w)).length;
  return comunes * 2 >= a.length && !/\.\.\.|…/.test(mejor);
}

/**
 * Lo que el alumno dijo en español (o mezclado), dicho en inglés: la frase
 * que Allison le da para que la intente. Solo cuando el modelo de la
 * escena no la escribió. Si falla, "" (el turno se devuelve).
 */
async function alIngles(dicho: string): Promise<{ en: string; tokensEntrada: number; tokensSalida: number }> {
  try {
    const r = await cliente().models.generateContent({
      model: modelo(),
      contents: [{ role: "user", parts: [{ text: dicho }] }],
      config: {
        systemInstruction: `A Spanish-speaking teenager who is learning English said this, maybe
mixing Spanish and English. Write ALL of it in simple, correct US English,
as the student would say it. Only their words in English: never an answer
to them.`,
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { ingles: { type: Type.STRING } }, required: ["ingles"] },
        temperature: 0,
        maxOutputTokens: 200,
        abortSignal: AbortSignal.timeout(10_000),
      },
    });
    const d = JSON.parse(r.text ?? "") as { ingles?: string };
    return {
      en: String(r.candidates?.[0]?.finishReason ?? "STOP") === "STOP" ? soloIngles(d.ingles ?? "") : "",
      tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
      tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
    };
  } catch {
    return { en: "", tokensEntrada: 0, tokensSalida: 0 };
  }
}

export async function turnoDeEscenario(t: TurnoEscenario): Promise<ResultadoEscenario> {
  const historial = t.historial.slice(-16).map((m) => ({
    role: m.rol === "alumno" ? "user" : "model",
    parts: [{ text: m.texto }],
  }));
  const ultimo = t.audioBase64
    ? [{ inlineData: { mimeType: t.mimeType ?? "audio/webm", data: t.audioBase64 } }, { text: recordatorioEscenario(t) }]
    : [{ text: `${t.texto}\n\n${recordatorioEscenario(t)}` }];

  const r = await cliente().models.generateContent({
    model: modelo(),
    contents: [...historial, { role: "user", parts: ultimo }],
    config: {
      systemInstruction: instruccionEscenario(t),
      responseMimeType: "application/json",
      responseSchema: ESQUEMA_ESCENARIO,
      temperature: 0.4,
      // Nueve campos (con la idea y la traducción): con 400, un turno largo
      // en español se cortaba a la mitad del JSON (auditoría, octubre de 2026).
      maxOutputTokens: 900,
      abortSignal: AbortSignal.timeout(20_000),
    },
  });

  let d: {
    transcripcion?: string;
    espanol?: boolean;
    tareas?: number[];
    respuesta?: string;
    traduccion?: string;
    errorDijo?: string;
    errorMejor?: string;
    idea?: string;
    ideaEs?: string;
    ideaTarea?: number;
  } = {};
  let roto = false;
  try {
    d = JSON.parse(r.text ?? "");
  } catch {
    roto = true;
  }
  const falla = {
    tareas: [] as number[],
    respuesta: "",
    respuestaVoz: "",
    error: null,
    sinRespuesta: true,
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
  // Un JSON cortado o vacío (límite de salida, bloqueo) es falla de la IA:
  // se devuelve la intervención. Sin esto, un turno hablado quedaba sin
  // transcripción y se cobraba como "No te oí".
  const finDelModelo = String(r.candidates?.[0]?.finishReason ?? "STOP");
  if (roto || finDelModelo !== "STOP") return { ...falla, transcripcion: t.texto?.trim() ?? "" };

  // Escrito, lo que el alumno escribió ES la transcripción. Hablado, sin
  // las marcas de tiempo que el modelo devuelve con un audio en silencio
  // ("00:00 00:01 00:02"): si no queda nada, no se oyó voz.
  const transcripcion = (t.texto?.trim() || limpiarTranscripcion(d.transcripcion ?? "")).trim();
  const pendientes = new Set(tareasVisibles(t.escenario, t.cumplidas).filter((n) => !t.cumplidas.includes(n)));
  // Español: lo dice el código, o el modelo salvo que la frase sea inglés
  // claro (llegó a marcar "I am Diego." como español). El código solo no
  // basta: "Me llamo Diego" o "Mucho gusto" le quedan en duda. Mezclado
  // ("Okay okay, somos 14 personas") también es español: no cuenta la
  // tarea y Allison le da la frase en inglés.
  const espanol = transcripcion
    ? hablaEspanol(transcripcion) || mezclaEspanol(transcripcion) || (d.espanol === true && !inglesClaroDelAlumno(transcripcion))
    : false;
  const b1 = t.nivel !== "A1" && t.nivel !== "A2";

  let en = soloIngles(d.respuesta ?? "")
    // Deletreo con guiones ("M-I-A"): la voz lo lee como una palabra. Con
    // comas dice letra por letra, como en la conversación (allison.ts).
    .replace(/\b[A-Za-z](?:-[A-Za-z]){2,}\b/g, (m) => m.toUpperCase().split("-").join(", "));
  // Si habló en español, lo que dice Allison es su frase en inglés, de su
  // propio campo (en "respuesta" el modelo llegó a contestarle en el papel:
  // "En inglés se dice así: Hello Diego! What is your name?"). Las
  // preguntas se quitan, salvo que el alumno haya preguntado ("¿Cuánto
  // cuesta?" → "How much is it?"). Si el código vio el español y el modelo
  // no ("Okay okay, somos 14 personas"), la frase se pide aparte.
  let tokensEntrada = falla.tokensEntrada;
  let tokensSalida = falla.tokensSalida;
  const pregunto = /[¿?]/.test(transcripcion) || /^(qué|que|cómo|como|dónde|donde|cuánto|cuanto|cuál|cual|cuándo|cuando|puedo|me puede)\b/i.test(transcripcion);
  const comoLaDijo = (s: string) => (pregunto ? s : sinPreguntas(s));
  let traduccion = espanol ? comoLaDijo(fraseLimpia(soloIngles(d.traduccion ?? ""))) : "";
  if (espanol && !traduccion && !t.ultimo) {
    const a = await alIngles(transcripcion);
    traduccion = comoLaDijo(fraseLimpia(a.en));
    tokensEntrada += a.tokensEntrada;
    tokensSalida += a.tokensSalida;
  }
  if (espanol && !t.ultimo) en = traduccion ? `${traduccion} Try it!` : "";
  const delModelo = !!en;
  // Allison no dice como suya la frase del alumno ("I'm from Colombia.").
  if (!espanol && transcripcion) en = sinEcoDelAlumno(en, transcripcion) || (delModelo ? "Great!" : "");
  // El último turno cierra sin preguntar: si el modelo preguntó igual, se
  // quita la pregunta; si no queda nada, o habló en español (la frase en
  // inglés sería de él, no de ella), la despedida del contenido.
  if (t.ultimo) en = (!espanol && sinPreguntas(en)) || despedidaDe(t.escenario);
  // El alumno habló y el modelo no dio una línea en inglés que sirva: es
  // falla de la IA (se devuelve), no un "repite" que se le cobra.
  if (!delModelo && transcripcion && !t.ultimo) return { ...falla, transcripcion, tokensEntrada, tokensSalida };
  if (!en && transcripcion) en = REPETIR;

  // En español no se cumple ninguna tarea: Allison da la frase en inglés.
  // Un saludo solo no hace "Saluda y di…".
  const saludoSolo = soloSaluda(transcripcion);
  const tareas = espanol
    ? []
    : [...new Set([...(d.tareas ?? []), ...tareasObvias(t.escenario, transcripcion)])]
        .filter((n) => pendientes.has(n) && !(saludoSolo && /^saluda y /i.test(t.escenario.tareas[n - 1].trim())))
        .sort((a, b) => a - b);
  // Sin la frase del alumno ni la pregunta de una tarea que acaba de cumplir.
  if (!espanol && !t.ultimo && transcripcion) en = sinFrasesFueraDeLugar(en, t.escenario, pendientes, tareas) || "Sure!";

  // El imprevisto (B1): al cumplir la tarea después de la cual pasa,
  // Allison lo trae con la línea aprobada del diálogo de ejemplo. Lo que
  // dijo el modelo queda como reacción corta, sin preguntas.
  const imp = t.escenario.imprevisto;
  const llegaSorpresa = !!imp && !t.ultimo && !espanol && tareas.includes(imp.despuesDeTarea);
  if (llegaSorpresa && imp) {
    const reaccion = sinPreguntas(en);
    en = reaccion && !imp.linea.toLowerCase().includes(reaccion.toLowerCase()) ? `${reaccion} ${imp.linea}` : imp.linea;
  }

  // Antes del mínimo, o mientras falten tareas, la línea de Allison
  // termina con una pregunta: sin ella el alumno no sabe qué decir y la
  // escena se cae ("Sure, this way. Here's the menu."). Si el modelo no la
  // hizo, va la del ejemplo aprobado para la tarea que sigue. Un eco
  // ("Fourteen people? Wow! This way, please.") no cuenta como pregunta:
  // con él la escena perdía el hilo (prueba en producción, octubre de 2026).
  const sigue = [...pendientes].find((n) => !tareas.includes(n));
  const ejemplo = sigue ? preguntaDeLaTarea(t.escenario, sigue) : null;
  // Sin ejemplo (los viajes, los escenarios propios), si lo que sigue es
  // que el alumno pregunte, Allison no lo pregunta ella: lo invita.
  const invita = !!sigue && !ejemplo && /^pregunta/i.test(t.escenario.tareas[sigue - 1].trim());
  let lineaCambiada = false;
  if (invita && !llegaSorpresa && !t.ultimo && !espanol && transcripcion) {
    const sinSuPregunta = sinPreguntasDeInformacion(en);
    if (sinSuPregunta !== en) {
      en = sinSuPregunta || "Great!";
      lineaCambiada = true;
    }
  }
  // Nunca su línea anterior entera otra vez. Si va otra pregunta, la idea
  // ya no sirve; si solo vuelve a hacer la misma ("How long is your
  // trip?" cuando el alumno contestó otra cosa), la idea sigue sirviendo.
  if (!llegaSorpresa && !t.ultimo && !espanol && transcripcion) {
    const anterior = soloIngles([...t.historial].reverse().find((m) => m.rol === "allison")?.texto ?? "");
    const sinRepetir = sinRepetirLaAnterior(en, anterior, ejemplo ?? (invita ? INVITA_A_PREGUNTAR : null));
    if (sinRepetir !== en) {
      if (!oracionesDe(en).includes(sinRepetir)) lineaCambiada = true;
      en = sinRepetir;
    }
  }
  if (!llegaSorpresa && !t.ultimo && !espanol && (t.turno < t.minimo || sigue) && transcripcion && !llevaPregunta(en)) {
    const pregunta = ejemplo ?? (invita ? INVITA_A_PREGUNTAR : null);
    if (pregunta && !en.toLowerCase().includes(pregunta.toLowerCase())) {
      en = `${conPunto(en)} ${pregunta}`.trim();
      lineaCambiada = true;
    }
  }

  // La idea responde a la línea que escribió el modelo: si el código la
  // cambió (la sorpresa, una pregunta agregada o quitada) o la escena se cierra, no
  // sirve, y la ayuda vuelve a la frase de la tarea que sigue.
  const quedan = new Set([...pendientes].filter((n) => !tareas.includes(n)));
  const ideaTarea = quedan.has(Number(d.ideaTarea)) ? Number(d.ideaTarea) : 0;
  // Una idea que es línea del personaje ("Welcome to Miami. Have a nice
  // day!") o que no responde nada ni hace una tarea ("It's thirty-two
  // dollars." → "Do you like New Orleans?") no sirve: vuelve la frase de
  // la tarea que sigue (pruebas con el modelo, octubre de 2026).
  const comparable = (s: string) => palabras(s).join(" ");
  const delPersonaje = (s: string) =>
    !!comparable(s) &&
    [en, ...t.escenario.dialogo.filter((l) => l.quien === "personaje").map((l) => l.dice)].some((l) =>
      comparable(l).includes(comparable(s))
    );
  const ideaCandidata = soloIngles(d.idea ?? "");
  const ideaEn = ideaCandidata && !delPersonaje(ideaCandidata) && (en.includes("?") || ideaTarea) ? ideaCandidata : "";
  // Si habló en español, Allison le dio su frase en inglés ("My name is
  // Diego. Try it!"): la idea es esa frase, y lo que dijo es su traducción.
  // La traducción de la idea se queda salvo que sea inglés claro ("Dos
  // boletas." es español aunque sea corta).
  const ideaEs = (d.ideaEs ?? "").trim();
  const idea = t.ultimo
    ? null
    : espanol && traduccion
      ? { en: traduccion, es: transcripcion, tarea: 0 }
      : ideaEn && !llegaSorpresa && !lineaCambiada
        ? { en: ideaEn, es: ideaEs && !esInglesClaro(ideaEs) ? ideaEs : "", tarea: ideaTarea }
        : null;
  // "En inglés se dice así:" solo antecede a la versión en inglés de lo
  // que el alumno dijo, dada por el modelo; nunca a la despedida de cierre.
  const conFrase = espanol && delModelo && !t.ultimo;
  // Desde B1 Allison no sale al español: lo pide en inglés (Contenido B1).
  const respuesta = conFrase ? (b1 ? `${EN_INGLES_B1} ${en}` : `${EN_INGLES} ${en}`) : en;
  const respuestaVoz = conFrase ? (b1 ? respuesta : `${MARCADOR_ES} ${EN_INGLES} ${MARCADOR_EN} ${en}`) : en;

  // El error para el resumen tiene que estar en lo que dijo: uno inventado
  // terminaría en el resumen y en el repaso sorpresa.
  const dijo = (d.errorDijo ?? "").trim();
  const mejor = soloIngles(d.errorMejor ?? "");
  const error =
    !espanol && dijo && mejor && esCorreccionDe(dijo, mejor) && estaEnLoDicho(dijo, transcripcion) ? { dijo, mejor } : null;

  return {
    transcripcion,
    tareas,
    respuesta,
    respuestaVoz,
    error,
    idea,
    tokensEntrada,
    tokensSalida,
  };
}

// ---------------------------------------------------------------------
//  La Entrevista a Allison
//
//  El modelo solo CLASIFICA lo que dijo el alumno (¿qué preguntó?); lo
//  que Allison contesta sale de su ficha aprobada, armado en el código.
//  Así sus datos nunca cambian de una vez a otra y no hay idiomas
//  mezclados.
// ---------------------------------------------------------------------

export interface Clasificacion {
  /** "pregunta": preguntó un dato; "respuesta": contestó el "And you?"; "otro": no se entiende. */
  tipo: "pregunta" | "respuesta" | "otro";
  /** El dato que preguntó (desde 1), o 0. */
  dato: number;
  /** Lo dijo en español. */
  espanol: boolean;
  tokensEntrada: number;
  tokensSalida: number;
}

const ESQUEMA_CLASIFICAR = {
  type: Type.OBJECT,
  properties: {
    tipo: { type: Type.STRING, enum: ["pregunta", "respuesta", "otro"] },
    dato: { type: Type.INTEGER },
    espanol: { type: Type.BOOLEAN },
  },
  required: ["tipo", "dato", "espanol"],
  propertyOrdering: ["tipo", "dato", "espanol"],
};

export async function clasificarEntrevista(o: {
  entrevista: Entrevista;
  transcripcion: string;
  /** La pregunta que Allison acaba de devolver ("And you?"), si la hizo. */
  devuelta?: string;
}): Promise<Clasificacion> {
  const lista = o.entrevista.datos.map((d, i) => `  ${i + 1}. ${d.pregunta} (${d.dato})`).join("\n");
  const instruccion = `A Spanish-speaking student (beginner) is interviewing their English
teacher, Allison, to find out these things about her:
${lista}
${o.devuelta ? `Allison just asked the student back: "${o.devuelta}"` : "Allison is waiting for a question."}

Classify the student's message:
- "tipo": "pregunta" if it asks one of the things in the list (any
  understandable question counts, even with mistakes or very short,
  like "Your age?"); "respuesta" if it answers Allison's question back;
  "otro" if it is neither or cannot be understood.
- "dato": the number of the thing asked (1-${o.entrevista.datos.length}), or 0.
- "espanol": true if the message is in Spanish.`;

  const r = await cliente().models.generateContent({
    model: modelo(),
    contents: [{ role: "user", parts: [{ text: `Student: ${o.transcripcion}` }] }],
    config: {
      systemInstruction: instruccion,
      responseMimeType: "application/json",
      responseSchema: ESQUEMA_CLASIFICAR,
      temperature: 0,
      maxOutputTokens: 60,
      abortSignal: AbortSignal.timeout(10_000),
    },
  });
  let d: { tipo?: string; dato?: number; espanol?: boolean } = {};
  try {
    d = JSON.parse(r.text ?? "{}");
  } catch {
    d = {};
  }
  const tipo = d.tipo === "pregunta" || d.tipo === "respuesta" ? d.tipo : "otro";
  const dato = Number.isInteger(d.dato) && d.dato! >= 1 && d.dato! <= o.entrevista.datos.length ? d.dato! : 0;
  return {
    tipo: tipo === "pregunta" && !dato ? "otro" : tipo,
    dato: tipo === "pregunta" ? dato : 0,
    espanol: !!d.espanol,
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

/** Reacciones cortas de Allison a lo que el alumno le cuenta. */
const REACCIONES = ["Cool!", "Nice!", "Great!", "Oh, nice!", "Wow!"];

/**
 * La respuesta de Allison en la entrevista, armada con su ficha. Devuelve
 * el texto para mostrar, el texto para la voz y lo que queda pendiente.
 */
export function respuestaDeEntrevista(o: {
  entrevista: Entrevista;
  clasificacion: Pick<Clasificacion, "tipo" | "dato" | "espanol">;
  descubiertos: number[];
  turno: number;
  /** Desde B1 Allison no habla en español: da la pista del dato en inglés. */
  nivel?: Nivel;
}): { respuesta: string; respuestaVoz: string; descubierto: number | null; devuelta: string | null } {
  const { entrevista: e, clasificacion: c } = o;
  const faltan = e.datos.map((_, i) => i + 1).filter((n) => !o.descubiertos.includes(n));
  const siguiente = e.datos[(faltan[0] ?? 1) - 1];
  const enIngles = !!o.nivel && o.nivel !== "A1" && o.nivel !== "A2";
  /** La pista en inglés de un dato (desde 1): la aprobada, o la pregunta misma. */
  const pista = (n: number) => e.pistas?.[n - 1] ?? `Ask me: ${e.datos[n - 1].pregunta}`;

  if (enIngles && c.tipo !== "respuesta" && !(c.tipo === "pregunta" && c.dato && !c.espanol)) {
    const n = c.tipo === "pregunta" && c.dato ? c.dato : (faltan[0] ?? 1);
    const respuesta = c.espanol ? `In English, please! ${pista(n)}` : pista(n);
    return { respuesta, respuestaVoz: respuesta, descubierto: null, devuelta: null };
  }

  // En español: lo entiende, pero pide la pregunta en inglés (cuenta como
  // pista). Si en español contestaba su "And you?", es solo una respuesta.
  if (c.espanol && c.tipo !== "respuesta") {
    const en = c.tipo === "pregunta" && c.dato ? e.datos[c.dato - 1].pregunta : siguiente.pregunta;
    const es = c.tipo === "pregunta" && c.dato ? "¡Eso es! Pregúntalo en inglés:" : "¿Qué quieres saber? Pregúntame así:";
    return { respuesta: `${es} ${en}`, respuestaVoz: `${MARCADOR_ES} ${es} ${MARCADOR_EN} ${en}`, descubierto: null, devuelta: null };
  }

  if (c.tipo === "pregunta" && c.dato) {
    const d = e.datos[c.dato - 1];
    // Le devuelve la pregunta: así la entrevista va y viene.
    const termina = /\?\s*$/.test(d.respuesta);
    const respuesta = termina ? d.respuesta : `${d.respuesta} And you?`;
    return { respuesta, respuestaVoz: respuesta, descubierto: c.dato, devuelta: termina ? d.respuesta : d.pregunta };
  }

  if (c.tipo === "respuesta") {
    const reaccion = REACCIONES[o.turno % REACCIONES.length];
    const respuesta = faltan.length ? `${reaccion} Ask me another question!` : `${reaccion} Thank you for your questions!`;
    return { respuesta, respuestaVoz: respuesta, descubierto: null, devuelta: null };
  }

  // No se entendió: pregunta en español qué quiere saber y le da la pregunta.
  const es = "¿Qué quieres saber? Pregúntame así:";
  return {
    respuesta: `${es} ${siguiente.pregunta}`,
    respuestaVoz: `${MARCADOR_ES} ${es} ${MARCADOR_EN} ${siguiente.pregunta}`,
    descubierto: null,
    devuelta: null,
  };
}

// ---------------------------------------------------------------------
//  Adivina (A2)
//
//  Igual que la Entrevista: el modelo solo reconoce qué preguntó el
//  alumno; la respuesta sale de la tabla aprobada (respuestaDeAdivina, en
//  adivina.ts). No sabe en qué piensa Allison, así que no puede soplarlo.
// ---------------------------------------------------------------------

const ESQUEMA_ADIVINA = {
  type: Type.OBJECT,
  properties: {
    tipo: { type: Type.STRING, enum: ["pregunta", "adivina", "otra", "abierta", "otro"] },
    fila: { type: Type.INTEGER },
    opcion: { type: Type.INTEGER },
    espanol: { type: Type.BOOLEAN },
  },
  required: ["tipo", "fila", "opcion", "espanol"],
  propertyOrdering: ["tipo", "fila", "opcion", "espanol"],
};

export async function clasificarAdivina(o: {
  adivina: Adivina;
  transcripcion: string;
}): Promise<LecturaAdivina & { tokensEntrada: number; tokensSalida: number }> {
  const a = o.adivina;
  const opciones = a.opciones.map((x, i) => `  ${i + 1}. ${x.nombre}`).join("\n");
  const preguntas = a.preguntas.map((p, i) => `  ${i + 1}. ${p.pregunta}`).join("\n");
  const instruccion = `A Spanish-speaking student (English level A2) is playing a guessing game
with their English teacher, Allison. Allison is thinking of one of these:
${opciones}
The student asks yes or no questions to find out which one. These are
the questions Allison can answer:
${preguntas}
To guess, the student names one of them, like: "${preguntaDeAdivinar(a, a.opciones[0].nombre)}"

Classify the student's message:
- "tipo":
  "adivina" if it names one of the options as a guess (any form: a full
  question, "${a.opciones[1]?.nombre ?? a.opciones[0].nombre}?", or with mistakes).
  "pregunta" if it asks the same thing as one of the questions in the
  list, even with other words, mistakes, very short ("Uniform?") or with
  other verb forms ("Will you…?", "Do you want to…?", "How about…?").
  "otra" if it is a yes or no question that is not in the list.
  "abierta" if it is a question that cannot be answered with yes or no
  ("What do you do?", "Where…?").
  "otro" if it is not a question or cannot be understood.
- "fila": the number of the question in the list (only with "pregunta"), or 0.
- "opcion": the number of the option guessed (only with "adivina"), or 0.
- "espanol": true if the message is in Spanish. Even in Spanish, still
  say which question or option it means.`;

  const r = await cliente().models.generateContent({
    model: modelo(),
    contents: [{ role: "user", parts: [{ text: `Student: ${o.transcripcion}` }] }],
    config: {
      systemInstruction: instruccion,
      responseMimeType: "application/json",
      responseSchema: ESQUEMA_ADIVINA,
      temperature: 0,
      maxOutputTokens: 60,
      abortSignal: AbortSignal.timeout(10_000),
    },
  });
  let d: { tipo?: string; fila?: number; opcion?: number; espanol?: boolean } = {};
  try {
    d = JSON.parse(r.text ?? "{}");
  } catch {
    d = {};
  }
  const tipos = ["pregunta", "adivina", "otra", "abierta"] as const;
  let tipo: LecturaAdivina["tipo"] = tipos.find((t) => t === d.tipo) ?? "otro";
  const fila = tipo === "pregunta" && Number.isInteger(d.fila) && d.fila! >= 1 && d.fila! <= a.preguntas.length ? d.fila! : 0;
  const opcion = tipo === "adivina" && Number.isInteger(d.opcion) && d.opcion! >= 1 && d.opcion! <= a.opciones.length ? d.opcion! : 0;
  // Sin la fila o la opción no se sabe qué contestar: es como si no se entendiera.
  if ((tipo === "pregunta" && !fila) || (tipo === "adivina" && !opcion)) tipo = "otro";
  return {
    tipo,
    fila,
    opcion,
    espanol: !!d.espanol || hablaEspanol(o.transcripcion),
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

// ---------------------------------------------------------------------
//  Enséñale a Allison (B1)
//
//  Como la Entrevista, al revés: pregunta Allison, con su lista fija de
//  cuatro preguntas. El modelo solo reconoce qué hizo el alumno (¿le
//  respondió?, ¿muy corto?, ¿le preguntó algo?); lo que dice Allison sale
//  de la actividad aprobada. Así nunca afirma datos del tema.
// ---------------------------------------------------------------------

export interface LecturaEnsenale {
  /**
   * "respuesta": responde la pregunta con una frase que se entiende;
   * "corta": responde con una o dos palabras; "pregunta": le pregunta algo
   * a Allison; "otro": no responde o no se entiende.
   */
  tipo: "respuesta" | "corta" | "pregunta" | "otro";
  /** Si preguntó algo de la lista de Allison: cuál (desde 1), o 0. */
  pregunta: number;
  espanol: boolean;
  tokensEntrada: number;
  tokensSalida: number;
}

const ESQUEMA_ENSENALE = {
  type: Type.OBJECT,
  properties: {
    tipo: { type: Type.STRING, enum: ["respuesta", "corta", "pregunta", "otro"] },
    pregunta: { type: Type.INTEGER },
    espanol: { type: Type.BOOLEAN },
  },
  required: ["tipo", "pregunta", "espanol"],
  propertyOrdering: ["tipo", "pregunta", "espanol"],
};

export async function clasificarEnsenale(o: {
  ensenale: Ensenale;
  /** La pregunta que Allison acaba de hacer. */
  pregunta: string;
  transcripcion: string;
}): Promise<LecturaEnsenale> {
  const suyas = o.ensenale.respuestasDeAllison ?? [];
  const lista = suyas.map((x, i) => `  ${i + 1}. ${x.siPregunta}`).join("\n");
  const instruccion = `A Spanish-speaking teenager from Colombia (English level B1) is teaching
their English teacher, Allison, about ${o.ensenale.tema} (a Colombian topic).
Allison just asked: "${o.pregunta}"

Classify the student's message:
- "tipo":
  "respuesta" if it answers Allison's question with at least one
  understandable sentence in English (mistakes are OK; a wrong or
  surprising fact is OK too: Allison is learning from them).
  "corta" if it answers with only one or two words ("In August.",
  "Flowers.").
  "pregunta" if, instead of answering, the student asks Allison a question.
  "otro" if it does not answer, or it cannot be understood.
- "pregunta": if "tipo" is "pregunta" and it asks one of these things,
  its number; otherwise 0.
${lista || "  (none)"}
- "espanol": true if the message is in Spanish. Even in Spanish, still say
  what it does.`;

  const r = await cliente().models.generateContent({
    model: modelo(),
    contents: [{ role: "user", parts: [{ text: `Student: ${o.transcripcion}` }] }],
    config: {
      systemInstruction: instruccion,
      responseMimeType: "application/json",
      responseSchema: ESQUEMA_ENSENALE,
      temperature: 0,
      maxOutputTokens: 60,
      abortSignal: AbortSignal.timeout(10_000),
    },
  });
  let d: { tipo?: string; pregunta?: number; espanol?: boolean } = {};
  try {
    d = JSON.parse(r.text ?? "{}");
  } catch {
    d = {};
  }
  const tipos = ["respuesta", "corta", "pregunta"] as const;
  const tipo: LecturaEnsenale["tipo"] = tipos.find((t) => t === d.tipo) ?? "otro";
  const n = Number.isInteger(d.pregunta) && d.pregunta! >= 1 && d.pregunta! <= suyas.length ? d.pregunta! : 0;
  return {
    tipo,
    pregunta: tipo === "pregunta" ? n : 0,
    espanol: !!d.espanol || hablaEspanol(o.transcripcion),
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

/** Lo que dice Allison si le hacen otra pregunta y la actividad no trae la suya. */
const OTRA_PREGUNTA = "Good question! But today you're the teacher. Tell me more!";

/** Intentos sin respuesta en una misma pregunta: al tercero, Allison pasa a la siguiente. */
const INTENTOS_POR_PREGUNTA = 3;

/**
 * La línea de Allison en Enséñale, armada con la actividad aprobada.
 * Devuelve qué pregunta sigue y si la de ahora quedó respondida.
 */
export function respuestaDeEnsenale(o: {
  ensenale: Ensenale;
  lectura: Pick<LecturaEnsenale, "tipo" | "pregunta" | "espanol">;
  /** La pregunta en curso (desde 0) y los intentos que no sirvieron en ella. */
  actual: number;
  intentos: number;
}): { respuesta: string; respondida: boolean; actual: number; intentos: number; terminada: boolean } {
  const e = o.ensenale;
  const p = e.preguntas[o.actual];
  const siguiente = (respondida: boolean, antes: string) => {
    const n = o.actual + 1;
    const fin = n >= e.preguntas.length;
    const sigue = fin ? e.cierre : e.preguntas[n].pregunta;
    return { respuesta: `${antes} ${sigue}`.trim(), respondida, actual: n, intentos: 0, terminada: fin };
  };
  const quedarse = (texto: string, cuenta: boolean) => {
    const intentos = cuenta ? o.intentos + 1 : o.intentos;
    // Tres intentos sin respuesta: pasa a la siguiente sin contarla.
    if (intentos >= INTENTOS_POR_PREGUNTA) return siguiente(false, "Thank you! Let's try another one.");
    return { respuesta: texto, respondida: false, actual: o.actual, intentos, terminada: false };
  };

  const l = o.lectura;
  // En español: lo entiende, pero lo pide en inglés, con la pregunta más simple.
  if (l.espanol) return quedarse(`In English, please! ${p.simple}`, true);
  if (l.tipo === "respuesta") {
    const reaccion = e.reacciones[o.actual % Math.max(1, e.reacciones.length)] ?? "Wow!";
    return siguiente(true, reaccion);
  }
  if (l.tipo === "corta") return quedarse(`Tell me more! ${p.simple}`, true);
  if (l.tipo === "pregunta") {
    // Le preguntó algo a ella: contesta con su ficha (o "hoy enseñas tú") y vuelve a su pregunta. No cuenta como intento.
    const suya = l.pregunta ? e.respuestasDeAllison?.[l.pregunta - 1]?.respuesta : undefined;
    return quedarse(suya ? `${suya} ${p.pregunta}` : (e.otraPregunta ?? OTRA_PREGUNTA), false);
  }
  return quedarse(p.simple, true);
}
