import { GoogleGenAI, Type } from "@google/genai";
import { esEspanolClaro, esInglesClaro, separarIdiomas } from "../allison.ts";
import { estaEnLoDicho } from "../evaluacion.ts";
import { conPunto, MARCADOR_EN, MARCADOR_ES, quitarMarcadores } from "../habla.ts";
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
  /** Las tareas pendientes que el alumno ya hizo en parte, con lo que les falta. */
  aMedias?: TareaAMedias[];
  /**
   * Lo que dijo el alumno, siempre en texto: lo hablado llega ya
   * transcrito a ciegas (turnoDeEscena, conversacion.ts). La rama de audio
   * se quitó porque nadie la usaba y mandaba el audio con todo el
   * historial, justo lo que hacía copiar turnos anteriores (auditoría, 30
   * de octubre de 2026).
   */
  texto: string;
}

/**
 * Una tarea de dos partes hecha a medias ("Cuenta qué te duele y desde
 * cuándo" con solo "I have a headache"): no cuenta hasta que el alumno
 * diga lo que falta, en ese turno o en otro.
 */
export interface TareaAMedias {
  tarea: number;
  /** Lo que falta, en pocas palabras ("since when", "say goodbye"). */
  falta: string;
}

export interface ResultadoEscenario {
  transcripcion: string;
  /** Tareas que cumplió ESTE mensaje. */
  tareas: number[];
  /** Las tareas que quedan a medias después de este mensaje (se guardan en el estado). */
  aMedias: TareaAMedias[];
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

function instruccionEscenario(t: Omit<TurnoEscenario, "texto">): string {
  const e = t.escenario;
  const visibles = tareasVisibles(e, t.cumplidas);
  const pendientes = visibles.filter((n) => !t.cumplidas.includes(n));
  const medias = mediasPendientes(t.aMedias, new Set(pendientes));
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
${visibles
  .map((n) => `  ${n}. ${e.tareas[n - 1]}${conEjemplo(e, n)}${medias.has(n) ? ` [HALF DONE: still missing ${medias.get(n)}]` : ""}`)
  .join("\n")}
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
2. If the student asks you something, first answer it in a few words, in
   your role ("For two nights. Is there wifi?" -> "Yes, the wifi is
   free!"), and then go on. Lead the student to the next pending task
   with one simple question, like the examples. Never do a pending task
   for them, and never say first what a pending task asks them to find
   out (your name or how to spell it, where you live, the price, the
   time, the way): wait until they ask. Never talk as if they had
   already done a pending task.
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
   they just said, all of it in simple correct English, the way a person
   from the US says it, never word by word -- not your answer to it,
   without fillers or repeated words. "Soy de Colombia" -> "I'm from
   Colombia." "Me llamo Diego" -> "My name is Diego." "Okay okay, somos
   14 personas" -> "There are fourteen of us." (never "We are fourteen.")${t.nivel !== "A1" && t.nivel !== "A2" ? ` (Level ${t.nivel}: never write Spanish; the app adds "Sorry, in English, please!".)` : ""}
6. You are an AI teacher: never say you are a person.
${t.extra ? `\n${t.extra.trim()}\n` : ""}
THE JSON
- "transcripcion": exactly what the student said, in the language they
  used, with their mistakes. Never complete it or correct it. "" if you
  hear no voice.
- "espanol": true if the student's last message is in Spanish, or
  mixes Spanish words into English ("Okay, somos catorce" -> true).
- "aMedias": the PENDING tasks with two parts where the student has said
  one part but not the other, each with what is still missing, in a few
  English words. Task "Cuenta qué te duele y desde cuándo" and the
  message "I have a headache" -> [{"tarea": 2, "falta": "since when"}].
  [] if none.
- "tareas": the numbers of the PENDING tasks that the student's last
  message does COMPLETELY, in any order (a later task counts even if an
  earlier one is still pending): in English, understandable, even with
  mistakes. [] if none. Never a task that is already done. Count only
  what the student said, never what you said. A task counts only if ALL
  of it is done, like its example (other words are fine): a task with
  two parts ("greet AND say your name", "what hurts AND since when", "the
  address AND say goodbye") needs both parts; with only one, it goes in
  "aMedias", not here. A task marked HALF DONE counts when this message
  says what is missing.
  A task to ASK something ("Pregunta...", "Pregúntale...") counts with
  any understandable question about it ("Who built it?"). A task to
  ORDER something ("Pide...") needs a real order ("I'd like ice cream,
  please.", "Can I have a cookie?"): asking what there is ("What is the
  dessert?", "Do you have cookies?") is not ordering. Talking about
  something near the task is not doing it.
- "respuesta": your line in the scene. English only.
- "traduccion": only if they spoke Spanish, their words in simple
  correct English (rule 5). "" otherwise.
- "idea": what the STUDENT could say back to YOUR line right now: one
  short, simple English sentence for a ${t.nivel} student (at most
  ${PALABRAS[t.nivel] + 4} words). It is the student's line, never
  yours: never what your character says or asks. If your line asks
  something, the idea answers it; if it asks nothing, the idea does ALL
  of the next pending task, both parts if it has two (only what is
  missing if it is HALF DONE).
  "" if you said goodbye.
- "ideaEs": the idea in natural Colombian Spanish.
- "ideaTarea": the number of the pending task that the idea does
  completely (all of it), or 0.
- "errorDijo" and "errorMejor": the most important grammar or word
  mistake in the student's last English message: their exact words and
  the same sentence said correctly, with the same meaning (a statement
  stays a statement), at most 12 words each (only the part with the
  mistake). A wrong ANSWER is not a mistake. "" and "" if there is no
  mistake or they spoke Spanish.`;
}

function recordatorioEscenario(t: {
  ultimo: boolean;
  cumplidas: number[];
  escenario: Escenario;
  turno: number;
  minimo: number;
  nivel: Nivel;
  aMedias?: TareaAMedias[];
  texto?: string;
}): string {
  // El largo, también aquí: con solo la regla del comienzo, en A1 salían
  // líneas de 16 palabras (auditoría, 28 de octubre de 2026).
  const corta = ` At most ${PALABRAS[t.nivel]} words.`;
  if (t.ultimo) {
    return `[LAST turn: close the scene kindly in your role and say goodbye. Do NOT ask any question.${corta}]`;
  }
  const cuenta = `Student turn ${t.turno} of at least ${t.minimo}.`;
  const sinDespedirse = t.turno < t.minimo ? " Do not say goodbye yet: end with a simple question." : "";
  const imp = t.escenario.imprevisto;
  const antesDeSorpresa =
    imp && !t.cumplidas.includes(imp.despuesDeTarea)
      ? ` If this message does task ${imp.despuesDeTarea}, only react in a few words with no question.`
      : "";
  // Si el alumno contesta y pregunta en el mismo turno ("I'm from Colombia.
  // And you, where are you from?"), la regla general no bastaba: Allison
  // seguía con su pregunta sin contestar (auditoría, 28 de octubre de
  // 2026). Con la pregunta a la vista, la contesta. Es lo que el alumno ya
  // dijo (no lo esperado): no rompe la evaluación a ciegas.
  const suPregunta = preguntasDelAlumno(t.texto ?? "");
  // Preguntar puede ser su tarea: sin decirlo, el modelo contestaba y no la
  // contaba ("And you? Where are you from?", pruebas del 28 de octubre).
  const preguntaPrimero = suPregunta
    ? ` The student asked you: "${suPregunta}" If a pending task is to ask about that, its number goes in "tareas", whatever its place in the list. Answer it FIRST, in your role and in a few words; then go on.`
    : " If they asked you something, answer it first, in a few words.";
  if (t.cumplidas.length >= t.escenario.tareas.length) {
    return `[${cuenta} All tasks are done: keep chatting in your role, short and friendly.${preguntaPrimero}${
      sinDespedirse || " If they say goodbye, say goodbye."
    }${corta}]`;
  }
  const quedan = tareasVisibles(t.escenario, t.cumplidas).filter((n) => !t.cumplidas.includes(n));
  const medias = mediasPendientes(t.aMedias, new Set(quedan));
  const pendientes = quedan
    .map((n) => `${n}. ${t.escenario.tareas[n - 1]}${medias.has(n) ? ` (HALF DONE: still missing ${medias.get(n)})` : ""}`)
    .join(" ");
  // La tarea que sigue, con la pregunta del ejemplo que lleva a ella: con
  // varias intervenciones encima, el modelo se quedaba conversando y la
  // escena perdía su objetivo (prueba en producción, octubre de 2026). Si
  // quedan tantas tareas como turnos para el mínimo, nada de preguntas de más.
  // A medias, la pregunta que lleva a la otra parte ("When did it start?").
  // Sin diálogo de ejemplo (los viajes), una sencilla por lo que pide la
  // tarea. Sin números de tarea: "for task 3" le daba a entender al modelo
  // que el mensaje no hacía la 3, y "or task 2 if this message already does
  // task 1" lo llevaba a contar la 1 (pruebas, 28 de octubre de 2026). Va
  // también la pregunta de la siguiente, por si este mensaje hace la primera.
  const libre = sinEjemplo(t.escenario);
  const preguntaPara = (n: number | undefined) =>
    !n
      ? null
      : medias.has(n)
        ? preguntaDeLaTarea(t.escenario, n, 1)
        : (preguntaDeLaTarea(t.escenario, n) ??
          (libre && !esTareaDePreguntar(t.escenario.tareas[n - 1] ?? "") ? preguntaParaLaTarea(t.escenario.tareas[n - 1] ?? "") : null));
  const p1 = preguntaPara(quedan[0]);
  const p2 = preguntaPara(quedan[1]);
  const como = p1 ? ` (like "${p1}"${p2 && p2 !== p1 ? `, or "${p2}" if that task is done now` : ""})` : "";
  const sinHolgura = quedan.length >= t.minimo - t.turno;
  // Si la tarea es que el alumno pregunte, "llevar a ella" no es hacerla:
  // en los viajes (sin diálogo de ejemplo) Allison preguntaba ella misma
  // "Who built Chichén Itzá?" (pruebas, octubre de 2026). Con diálogo, el
  // personaje no invita a preguntar: deja que el alumno pregunte, como en
  // el ejemplo ("Great! Do you have any questions?" a un enfermo en
  // Brighton, auditoría del 28 de octubre de 2026). "Pregúntale…" también
  // es preguntar: con la tilde, /^pregunta/ no lo veía.
  const lePregunta = quedan.some((n) => esTareaDePreguntar(t.escenario.tareas[n - 1]));
  const meta =
    ` Your line ends with ONE simple question that leads to the next pending task the student still has to do${como}.` +
    `${
      !lePregunta
        ? ""
        : libre
          ? ` When that task is for the student to ASK something, never ask it or answer it yourself: invite them to ask ("Do you have a question about it?").`
          : ` When that task is for the student to ASK something, never ask it, answer it or give that information yourself: let them ask it.`
    }` +
    `${sinHolgura ? " No extra questions now." : ""}`;
  return `[${cuenta} Pending tasks: ${pendientes}${meta}${preguntaPrimero} Stay in your role, English only in respuesta, never correct, short.${
    sinDespedirse ? " Do not say goodbye yet." : ""
  }${antesDeSorpresa}${corta}]`;
}

const ESQUEMA_ESCENARIO = {
  type: Type.OBJECT,
  properties: {
    transcripcion: { type: Type.STRING },
    espanol: { type: Type.BOOLEAN },
    aMedias: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { tarea: { type: Type.INTEGER }, falta: { type: Type.STRING } },
        required: ["tarea", "falta"],
        propertyOrdering: ["tarea", "falta"],
      },
    },
    tareas: { type: Type.ARRAY, items: { type: Type.INTEGER } },
    respuesta: { type: Type.STRING },
    traduccion: { type: Type.STRING },
    errorDijo: { type: Type.STRING },
    errorMejor: { type: Type.STRING },
    idea: { type: Type.STRING },
    ideaEs: { type: Type.STRING },
    ideaTarea: { type: Type.INTEGER },
  },
  required: [
    "transcripcion",
    "espanol",
    "aMedias",
    "tareas",
    "respuesta",
    "traduccion",
    "errorDijo",
    "errorMejor",
    "idea",
    "ideaEs",
    "ideaTarea",
  ],
  propertyOrdering: [
    "transcripcion",
    "espanol",
    // Primero lo que queda a medias: así el modelo mira cada parte antes de
    // dar una tarea por cumplida (auditoría, 28 de octubre de 2026).
    "aMedias",
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

/** Las líneas del alumno para una tarea en el diálogo de ejemplo, con su lugar en el diálogo. */
function lineasDeLaTarea(e: Escenario, tarea: number): number[] {
  return e.dialogo.flatMap((l, k) => (l.quien === "alumno" && l.tarea === tarea ? [k] : []));
}

/**
 * La pregunta con la que el personaje lleva a una tarea en el diálogo de
 * ejemplo: la última pregunta de su línea anterior a la del alumno. Con
 * `parte` 1, la que lleva a la segunda línea del alumno para esa tarea
 * (la otra mitad de una tarea doble: "Oh no. When did it start?").
 */
export function preguntaDeLaTarea(e: Escenario, tarea: number, parte = 0): string | null {
  const i = lineasDeLaTarea(e, tarea)[parte] ?? -1;
  for (let k = i - 1; k >= 0; k--) {
    if (e.dialogo[k].quien !== "personaje") continue;
    const preguntas = (e.dialogo[k].dice.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((o) => o.trim()).filter((o) => o.endsWith("?"));
    return preguntas.at(-1) ?? null;
  }
  return null;
}

/** Lo que el alumno contesta en el diálogo de ejemplo a esa pregunta: la idea cuando el código la pone. */
function respuestaDelEjemplo(e: Escenario, tarea: number, parte = 0): string {
  const k = lineasDeLaTarea(e, tarea)[parte];
  return k === undefined ? "" : e.dialogo[k].dice;
}

/** La escena no trae diálogo de ejemplo (los viajes, los escenarios propios): solo la apertura. */
function sinEjemplo(e: Escenario): boolean {
  return !e.dialogo.some((l) => l.quien === "alumno");
}

/**
 * ¿La tarea es que el alumno pregunte? "Pregunta…" y también
 * "Pregúntale…": con la tilde, /^pregunta/ no la veía (auditoría, 28 de
 * octubre de 2026).
 */
export function esTareaDePreguntar(tarea: string): boolean {
  return /^preg[uú]nta/i.test(tarea.trim());
}

/** Las tareas a medias que siguen pendientes, como mapa tarea → lo que falta. */
function mediasPendientes(aMedias: TareaAMedias[] | undefined, pendientes: Set<number>): Map<number, string> {
  return new Map((aMedias ?? []).filter((a) => pendientes.has(a.tarea) && a.falta.trim()).map((a) => [a.tarea, a.falta.trim()]));
}

/**
 * Sin diálogo de ejemplo (los viajes, los escenarios propios) no hay
 * pregunta aprobada que lleve a la tarea: una sencilla por lo que pide.
 * En México la línea quedaba en "The Maya built Chichén Itzá…", sin
 * pregunta, y el alumno no sabía qué decir (auditoría, 28 de octubre de
 * 2026). Para despedirse no se pregunta nada.
 */
export function preguntaParaLaTarea(tarea: string): string | null {
  const t = tarea.trim().toLowerCase();
  if (!t || /desp[ií]de|da las gracias|agradece/.test(t)) return null;
  if (esTareaDePreguntar(t)) return INVITA_A_PREGUNTAR;
  if (/compar|colombia/.test(t)) return "Is it the same in Colombia?";
  if (/comida|comer|plato|tacos|pizza|pasta|postre|bebida|desayuno|almuerzo|cena|caf[eé]|helado|t[ií]pic/.test(t)) return "Are you hungry?";
  if (/^pide/.test(t)) return "What would you like?";
  if (/te parece|opina|describe|sorprende|habla de/.test(t)) return "What do you think?";
  if (/te gusta/.test(t)) return "What do you like to do?";
  if (/gustar[ií]a|quieres|planea/.test(t)) return "What would you like to do?";
  return "What about you?";
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
 * repite, va la pregunta de la tarea que sigue (o `otra`, una del
 * personaje que no ha hecho); si no hay otra, solo vuelve a hacer su
 * pregunta, sin lo demás, y si su línea era solo esa pregunta, "So, …".
 * Sin pregunta que hacer, la misma línea: quien llama decide (antes se
 * quedaba así, idéntica; auditoría, 28 de octubre de 2026).
 */
export function sinRepetirLaAnterior(linea: string, anterior: string, siguiente: string | null, otra: string | null = null): string {
  if (!repiteLaAnterior(linea, anterior)) return linea;
  const a = palabras(anterior).join(" ");
  for (const p of [siguiente, otra]) if (p && !a.includes(palabras(p).join(" "))) return `Okay! ${p}`;
  const suya = oracionesDe(anterior).filter(esPregunta).at(-1);
  if (!suya) return linea;
  if (palabras(suya).join(" ") !== palabras(linea).join(" ")) return suya;
  return /^(?:I|I'm|I'd|I've|I'll)\b/.test(suya) ? `So, ${suya}` : `So, ${suya.charAt(0).toLowerCase()}${suya.slice(1)}`;
}

/**
 * ¿La línea es la anterior otra vez, o la trae entera con apenas un
 * "Okay."? Con algo nuevo delante ("We have ice cream or cake. Would you
 * like a dessert?") no es repetir: vuelve a hacer la pregunta.
 */
function repiteLaAnterior(linea: string, anterior: string): boolean {
  const a = palabras(anterior).join(" ");
  const l = palabras(linea).join(" ");
  if (!a || !l) return false;
  if (l === a) return true;
  return a.split(" ").length >= 4 && l.includes(a) && l.replace(a, " ").trim().split(/\s+/).filter(Boolean).length <= 2;
}

/** Las preguntas del mensaje del alumno, en inglés ("And you, where are you from?"), o "". */
function preguntasDelAlumno(texto: string): string {
  if (!texto.trim() || hablaEspanol(texto) || mezclaEspanol(texto)) return "";
  return oracionesDe(texto)
    .filter((o) => esPregunta(o) || /^(?:and you|where|what|who|when|why|how|which|is there|are there|do you|does|can you|can i|are you)\b/i.test(o))
    .join(" ")
    .slice(0, 200);
}

/**
 * Despedirse: "Bye!", "See you soon!", "Have a nice day!", "Enjoy your
 * stay!". "Nice to see you!" y "Can I see your passport?" no.
 */
const SE_DESPIDE =
  /\b(bye|goodbye|good-bye|good night|take care|see you|have a (?:nice|good|great|wonderful|safe) (?:day|night|evening|trip|weekend|time|flight|stay|one)|enjoy your (?:stay|trip|visit|day))\b/i;
/** ¿Se despide? Una pregunta no ("Did you have a good trip?"). */
const seDespide = (texto: string) =>
  oracionesDe(conApostrofoRecto(texto)).some((o) => !esPregunta(o) && SE_DESPIDE.test(o) && !NO_ES_DESPEDIDA.test(o));

/**
 * Sin las oraciones de despedida: antes del mínimo de intervenciones la
 * escena sigue, y Allison se despedía ("Thank you! Have a nice day!") con
 * la escena abierta (auditoría, 28 de octubre de 2026).
 */
export function sinDespedida(linea: string): string {
  return oracionesDe(linea)
    .filter((o) => !seDespide(o))
    .join(" ");
}

/**
 * El calco más común al traducir lo que dijo en español: "Somos tres" →
 * "We are three (people)." En inglés: "There are three of us." Aun con el
 * ejemplo en el prompt salía (auditoría, 28 de octubre de 2026).
 */
export function sinCalcos(frase: string): string {
  return frase.replace(
    /\b(we are|we're) (\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty)(?: (?:people|persons))?\b(?! years?\b)/gi,
    (_m: string, nosotros: string, n: string) => `${/^W/.test(nosotros) ? "There" : "there"} are ${n} of us`
  );
}

/** Las preguntas del personaje en el diálogo de ejemplo, en orden. */
function preguntasDelPersonaje(e: Escenario): string[] {
  return e.dialogo
    .filter((l) => l.quien === "personaje" && !/^\(.*\)$/.test(l.dice.trim()))
    .flatMap((l) => oracionesDe(l.dice))
    .filter((o) => esPregunta(o) && palabras(o).length >= 2);
}

/** Preguntas de su papel cuando no queda ninguna del ejemplo: valen en casi cualquier escena. */
const PREGUNTAS_DE_RELLENO = ["Anything else?", "Do you have any questions?"];

/**
 * Una pregunta del personaje que todavía no hizo (del diálogo de
 * ejemplo), sin las que llevan a tareas ya hechas; si no queda ninguna,
 * una que vale en cualquier papel. Para que la escena siga cuando todo
 * está hecho antes del mínimo, o cuando se quitó una despedida.
 */
export function preguntaSinUsar(e: Escenario, dichas: string[], excluir: string[] = []): string | null {
  const usadas = new Set([...dichas.flatMap(oracionesDe), ...excluir].map(comoPregunta));
  return [...preguntasDelPersonaje(e), ...PREGUNTAS_DE_RELLENO].find((p) => !usadas.has(comoPregunta(p))) ?? null;
}

/**
 * Allison no salta tareas: si su pregunta es la del ejemplo de OTRA tarea
 * pendiente, va la de la tarea que sigue (o ninguna, si la que sigue es
 * que el alumno pregunte). En el aeropuerto preguntaba por la tarea 4
 * con la 3 pendiente (auditoría, 28 de octubre de 2026).
 */
export function sinSaltarTareas(linea: string, e: Escenario, quedan: number[], ejemplo: string | null): string {
  const sigue = quedan[0];
  const otras = new Set(
    quedan
      .filter((n) => n !== sigue)
      .map((n) => preguntaDeLaTarea(e, n) ?? "")
      .filter(Boolean)
      .map(comoPregunta)
  );
  const oraciones = oracionesDe(linea);
  if (!oraciones.some((o) => esPregunta(o) && otras.has(comoPregunta(o)))) return linea;
  const sinEsas = oraciones.filter((o) => !(esPregunta(o) && otras.has(comoPregunta(o))));
  if (ejemplo && !sinEsas.some((o) => comoPregunta(o) === comoPregunta(ejemplo))) sinEsas.push(ejemplo);
  return sinEsas.join(" ");
}

/** Sin las oraciones en que Allison pide como si fuera el alumno ("I'd like…", "Can I have…?") ni el "With…" que las sigue. */
export function sinPedirPorElAlumno(linea: string): string {
  const fuera: number[] = [];
  const oraciones = oracionesDe(linea);
  oraciones.forEach((o, i) => {
    if (/^(?:I'd like|I would like|I want|Can I have|Could I have|I'll have)\b/i.test(conApostrofoRecto(o))) fuera.push(i);
    else if (fuera.includes(i - 1) && /^with\b/i.test(o)) fuera.push(i);
  });
  return oraciones.filter((_, i) => !fuera.includes(i)).join(" ");
}

/** La última pregunta de la línea, para comparar ("" si no hay). */
function ultimaPregunta(linea: string): string {
  return comoPregunta(oracionesDe(linea).filter(esPregunta).at(-1) ?? "");
}

/**
 * Una línea demasiado larga para el nivel, sin romper oraciones: se
 * quitan las del medio (nunca la primera, que reacciona, ni la última,
 * que pregunta). En A1 salió una de 16 palabras con 8 de límite
 * (auditoría, 28 de octubre de 2026).
 */
export function recortarLinea(linea: string, maximo: number): string {
  const oraciones = oracionesDe(linea);
  const cuenta = () => oraciones.join(" ").split(/\s+/).filter(Boolean).length;
  while (oraciones.length > 2 && cuenta() > maximo) {
    const medio = oraciones.slice(1, -1).map((o, i) => ({ i: i + 1, o })).filter(({ o }) => !esPregunta(o));
    if (!medio.length) break;
    const larga = medio.reduce((a, b) => (b.o.length > a.o.length ? b : a));
    oraciones.splice(larga.i, 1);
  }
  return oraciones.join(" ");
}

/** Fórmulas de cortesía que dicen los dos ("Here you are.", "No, thank you."): no son la frase del alumno. */
const CORTESIA = /^(?:here you (?:are|go)|here it is|no thank you|yes please|thank you (?:so|very) much|nice to meet you(?: too)?|you're welcome)$/;

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
 *     "A lemonade, please." → "And what would you like to drink?";
 *   · cualquier otra oración del alumno para una tarea pendiente, de tres
 *     palabras o más: Mia decía "See you, Mia! Bye!" (auditoría, 28 de
 *     octubre de 2026). Las cortas ("Thank you!", "Bye!") son de los dos.
 * Después, si no quedó pregunta, el código pone la de la tarea que sigue.
 */
export function sinFrasesFueraDeLugar(linea: string, e: Escenario, pendientes: Set<number>, hechas: number[], dicho = ""): string {
  const pendiente = (n?: number) => !!n && pendientes.has(n) && !hechas.includes(n);
  const delAlumno = e.dialogo.filter((l) => l.quien === "alumno" && pendiente(l.tarea)).flatMap((l) => oracionesDe(l.dice));
  const yaHechas = hechas.map((n) => preguntaDeLaTarea(e, n) ?? "").filter(Boolean);
  const fuera = new Set([...delAlumno.filter((o) => esPregunta(o) || enPrimeraPersona(o)), ...yaHechas].map(comoPregunta));
  const suyas = new Set(delAlumno.map(comoPregunta).filter((o) => o.split(" ").length >= 3 && !CORTESIA.test(o)));
  // Lo que el personaje contesta en el ejemplo a una pregunta que el alumno
  // todavía tiene que hacer ("My name is Mia.", "M-I-A.", "I live in
  // Rio."): Mia daba su nombre antes de que se lo preguntaran (auditoría,
  // 28 de octubre de 2026). Si el alumno acaba de preguntar algo, ella
  // contesta: eso no se toca.
  const adelantadas = new Set(
    preguntasDelAlumno(dicho)
      ? []
      : e.dialogo
          .flatMap((l, k) => (l.quien === "alumno" && pendiente(l.tarea) && oracionesDe(l.dice).some(esPregunta) && e.dialogo[k + 1]?.quien === "personaje" ? [e.dialogo[k + 1].dice] : []))
          .flatMap(oracionesDe)
          .filter((o) => !esPregunta(o))
          .map(comoPregunta)
          .filter((o) => o.split(" ").length >= 3 && !CORTESIA.test(o))
  );
  return oracionesDe(linea)
    .filter(
      (o) =>
        !((esPregunta(o) || enPrimeraPersona(o)) && fuera.has(comoPregunta(o))) &&
        !suyas.has(comoPregunta(o)) &&
        !(!esPregunta(o) && adelantadas.has(comoPregunta(o)))
    )
    .join(" ");
}

/**
 * ¿Solo dice nombres, o un nombre deletreado ("Gómez. G-O-M-E-Z.")? No es
 * español ni inglés: el modelo lo marcaba como español y Allison pedía
 * "Sorry, in English, please!" a un apellido (verificación del 28 de
 * octubre de 2026).
 */
function soloNombres(t: string): boolean {
  const resto = t
    .replace(/\b[A-Za-z](?:[-.\s]+[A-Za-z]\b)+/g, " ")
    .replace(/\b\p{Lu}[\p{L}'’-]*/gu, " ")
    .replace(/[\s.,!?;:¡¿"'’-]+/g, "");
  return !resto;
}

/** ¿Comparten tres palabras seguidas? (Dos oraciones que dicen lo mismo.) */
function compartenTramo(a: string, b: string): boolean {
  const pa = palabras(a);
  const pb = ` ${palabras(b).join(" ")} `;
  for (let i = 0; i + 3 <= pa.length; i++) if (pb.includes(` ${pa.slice(i, i + 3).join(" ")} `)) return true;
  return false;
}

/** Tareas que se hacen diciendo algo, no preguntando (contar, pagar, comparar, escoger…). */
const DE_AFIRMAR =
  /^(?:di|cuenta|cu[eé]ntale|responde|compara|explica|paga|describe|elige|escoge|agradece|da las gracias|desp[ií]dete|deletrea|presenta|pres[eé]ntate|disc[uú]lpate|recomi[eé]ndale|opina|decide|entrega)\b/i;

/** Algo de pagar, en sentido amplio ("Here you are.", "with card", "ten dollars"): solo para descartar. */
const ALGO_DE_PAGAR = /\b(?:here you (?:are|go)|here(?:'s| is| it is)|pay|paying|card|cash|money|dollars?|pounds?|euros?|pesos?|coins?|change|keep)\b|\$|£|€/i;
/** Lo que dice quien compara ("cheaper", "more expensive", "than", "the same"). */
const COMPARA = /\b(?:than|more|less|cheaper|bigger|smaller|better|worse|same|different|both|also|too|like|but|\w+er)\b/i;

/** Algo contado en pasado: un tiempo pasado ("last weekend", "ago") o un verbo en pasado. */
const PASADO =
  /\b(?:last (?:weekend|week|year|night|month|summer|saturday|sunday)|yesterday|ago|\w{3,}ed|went|ate|saw|had|did|made|took|got|bought|met|swam|ran|came|drank|flew|rode|was|were)\b/i;

/** "nothing", "none", "-": no falta nada. */
function limpiarFalta(falta: string): string {
  const f = falta.trim().slice(0, 80);
  return /^(?:none|nothing|n\/a|-|no|nada|ninguna?)?\.?$/i.test(f) ? "" : f;
}

/**
 * Las tareas que cumple este mensaje y las que quedan a medias (auditoría,
 * 28 de octubre de 2026: con una sola parte se marcaban "Cuenta qué te
 * duele y desde cuándo", "Pregunta de dónde es y dónde vive" y "Da la
 * dirección y despídete"):
 *   · las del modelo y las que el código reconoce solo (tareasObvias, y
 *     una tarea de preguntar con la pregunta misma del ejemplo);
 *   · si el modelo dice que a una le falta algo, queda a medias, salvo
 *     que el código la haya reconocido;
 *   · una tarea "…y despídete" no está hecha sin una despedida, en este
 *     mensaje o antes; y una a medias por la despedida se completa al
 *     despedirse;
 *   · un saludo solo deja a medias "Saluda y…" (antes no contaba nada, y
 *     el resto, dicho en el turno siguiente, tampoco).
 */
export function tareasDelTurno(o: {
  e: Escenario;
  pendientes: Set<number>;
  dicho: string;
  modelo: { tareas?: unknown; aMedias?: unknown };
  antes: TareaAMedias[];
  /** El alumno ya se despidió en un turno anterior. */
  despidioAntes: boolean;
}): { tareas: number[]; aMedias: TareaAMedias[] } {
  const { e, pendientes, dicho } = o;
  // Una tarea de preguntar, con la pregunta misma del ejemplo ("Where are
  // you from?"), está hecha: el modelo contestaba la pregunta y no contaba
  // la tarea (pruebas, 28 de octubre de 2026). Solo si el ejemplo es una
  // sola línea (en una tarea doble, una pregunta es la mitad).
  const suyas = new Set(oracionesDe(dicho).filter(esPregunta).map(comoPregunta).filter((p) => p.split(" ").length >= 3));
  const conSuPregunta = [...pendientes].filter((n) => {
    const lineas = lineasDeLaTarea(e, n);
    if (!esTareaDePreguntar(e.tareas[n - 1] ?? "") || lineas.length !== 1) return false;
    return oracionesDe(e.dialogo[lineas[0]].dice).some((p) => esPregunta(p) && suyas.has(comoPregunta(p)));
  });
  // La frase misma del ejemplo (todas sus líneas, si son dos) también
  // cuenta, la diga como la diga: "No, I've never eaten haggis. Is it
  // good?" o "We're taking a boat on the river at three…" no contaban
  // (verificación del 28 de octubre de 2026).
  const dichoP = ` ${palabras(dicho).join(" ")} `;
  /** ¿Dijo esa línea del ejemplo? Dentro de lo dicho si es de tres palabras o más; si es corta ("What time?"), sola. */
  const dijoLaLinea = (k: number) => {
    const p = palabras(e.dialogo[k].dice).join(" ");
    return !!p && (p.split(" ").length >= 3 ? dichoP.includes(` ${p} `) : dichoP.trim() === p);
  };
  const conSuFrase = [...pendientes].filter((n) => {
    const lineas = lineasDeLaTarea(e, n);
    return lineas.length > 0 && lineas.every(dijoLaLinea);
  });
  // En los viajes (sin diálogo de ejemplo) el modelo no contaba nunca
  // algunas tareas abiertas: "In Colombia we also celebrate the New Year
  // with family…" para "Compara una costumbre con Colombia", o "Tomorrow
  // we're going to visit the Louvre…" para "Planea un día en la ciudad"
  // (verificación del 28 de octubre de 2026). Respaldo: lo dice afirmando.
  const afirma = !oracionesDe(dicho).every(esPregunta);
  const abiertas = [...pendientes].filter((n) => {
    const tarea = e.tareas[n - 1] ?? "";
    if (!afirma || palabras(dicho).length < 5) return false;
    if (/^compara\b.*\bcolombia\b/i.test(tarea)) return /\bcolombia\b/i.test(dicho);
    if (/^planea\b/i.test(tarea)) return /\b(?:going to|gonna|will|we'll|i'll|tomorrow|first|then|after that)\b/i.test(dicho);
    // "Cuenta qué hiciste el fin de semana (pasado)": contado en pasado. El
    // modelo a veces no contaba "Last weekend I visited my grandparents…"
    // (viaje 6; tanda 1, 29 de octubre de 2026).
    if (sinEjemplo(e) && /^cuenta\b.*\(pasado\)/i.test(tarea)) return PASADO.test(dicho);
    return false;
  });
  const obvias = [...tareasObvias(e, dicho), ...conSuPregunta, ...conSuFrase, ...abiertas];
  const delModelo = (Array.isArray(o.modelo.tareas) ? o.modelo.tareas : []).map(Number).filter((n) => Number.isInteger(n));
  const nuevas = (Array.isArray(o.modelo.aMedias) ? (o.modelo.aMedias as { tarea?: unknown; falta?: unknown }[]) : [])
    .map((a) => ({ tarea: Number(a?.tarea), falta: limpiarFalta(String(a?.falta ?? "")) }))
    .filter((a) => pendientes.has(a.tarea));
  const medias = mediasPendientes(o.antes, pendientes);
  const hechas = new Set([...delModelo, ...obvias].filter((n) => pendientes.has(n)));
  for (const a of nuevas) {
    if (!a.falta) hechas.add(a.tarea);
    else if (!obvias.includes(a.tarea)) {
      hechas.delete(a.tarea);
      medias.set(a.tarea, a.falta);
    }
  }
  const seDespidio = seDespide(dicho);
  for (const [n, falta] of medias) if (seDespide(falta) && seDespidio) hechas.add(n);
  for (const n of [...hechas]) {
    if (/desp[ií]dete/i.test(e.tareas[n - 1] ?? "") && !seDespidio && !o.despidioAntes) {
      hechas.delete(n);
      medias.set(n, "say goodbye");
    }
  }
  // Lo que el modelo daba por hecho sin que el mensaje lo hiciera
  // (verificación de todas las escenas, 28 de octubre de 2026):
  //   · una tarea de decir algo (contar, pagar, comparar, escoger…) no se
  //     cumple con un mensaje que solo pregunta ("How much are the cough
  //     drops?" no es pagar; "What are my options?" no es escoger);
  //   · pagar pide algo de pagar ("Here you are.", "with card"), y
  //     comparar, una comparación ("cheaper", "more", "than") o, si la
  //     tarea es comparar con Colombia, nombrarla: "How much is the park
  //     apartment?" no comparaba, ni "How much are the cough drops?" pagaba.
  // (Exigir las dos preguntas de "Pregunta X y Y" se probó y se quitó: el
  // modelo a veces marca la tarea en la segunda, y la escena ya no se
  // podía terminar.)
  const oraciones = oracionesDe(dicho);
  // Pregunta de verdad: termina en "?" y empieza como pregunta ("I'm fine,
  // and you?" responde, aunque termine en "?").
  const soloPregunta =
    oraciones.length > 0 &&
    oraciones.every(
      (x) => esPregunta(x) && /^(?:and\s+|so\s+|okay,?\s+)?(?:what|where|how|who|when|why|which|whose|do|does|did|is|are|was|were|can|could|will|would|should|have|has|may)\b/i.test(x)
    );
  // Una línea del ejemplo de otra tarea, o de ninguna, no cumple esta,
  // salvo que también diga una suya: "I've been volunteering at a library
  // since January…" es de "Cuenta qué has estado haciendo", y el modelo la
  // daba también por "Di por qué quieres trabajar en el campamento"; "Yes.
  // Are there apples?" (de ninguna) pasaba por "Pregunta cuánto cuesta
  // algo" (tanda 1, 29 de octubre de 2026). Así pasa también con la frase
  // que muestra la Ayuda. Las cortas ("Yes, please!") no se miran, y si
  // agrega algo suyo ("Yes. Are there apples? How much are they?"), el
  // modelo decide.
  const lineasDeOtra = (n: number) => {
    const otras = e.dialogo.filter((l, k) => l.quien === "alumno" && l.tarea !== n && palabras(l.dice).length >= 3 && dijoLaLinea(k));
    const cubren = otras.reduce((s, l) => s + palabras(l.dice).length, 0);
    return otras.length > 0 && cubren >= palabras(dicho).length - 1 && !lineasDeLaTarea(e, n).some(dijoLaLinea);
  };
  for (const n of [...hechas]) {
    if (obvias.includes(n)) continue;
    const tarea = (e.tareas[n - 1] ?? "").trim();
    // Sin la situación de un imprevisto ("El hotel está lleno: escoge…").
    const accion = tarea.includes(":") ? tarea.slice(tarea.indexOf(":") + 1).trim() : tarea;
    const noHace =
      lineasDeOtra(n) ||
      (soloPregunta && DE_AFIRMAR.test(accion) && !/pregunt/i.test(accion)) ||
      (/^paga\b/i.test(accion) && !ALGO_DE_PAGAR.test(dicho)) ||
      (/^compara\b/i.test(accion) &&
        !COMPARA.test(dicho) &&
        (dicho.match(/\d+/g) ?? []).length < 2 &&
        !(/\bcolombia\b/i.test(accion) && /\bcolombia\b/i.test(dicho)));
    if (noHace) hechas.delete(n);
  }
  // En un viaje (sin ejemplo), una pregunta de verdad cuenta para la tarea
  // de preguntar que sigue si el modelo no contó ninguna: "What street food
  // is typical here?" para "Pregunta por una comida típica de la calle" no
  // contaba (verificación del 28 de octubre de 2026).
  if (sinEjemplo(e) && !hechas.size && oraciones.some((x) => esPregunta(x) && palabras(x).length >= 4)) {
    const sigueDePreguntar = [...pendientes].sort((a, b) => a - b).find((n) => esTareaDePreguntar(e.tareas[n - 1] ?? ""));
    if (sigueDePreguntar) hechas.add(sigueDePreguntar);
  }
  // Una tarea de dos líneas en el ejemplo, dichas en dos turnos ("Then you
  // should see Blue River…" y luego "It's about a boy who loves hockey…"):
  // con la primera queda a medias y con la segunda se cumple. Antes el
  // modelo a veces no la contaba nunca (B1, El festival de cine).
  const mediasAntes = mediasPendientes(o.antes, pendientes);
  // A medias de antes: Allison ya le hizo la pregunta de la otra parte
  // ("When did it start?"), y si contesta afirmando ("Since yesterday.")
  // sin hacer otra tarea, la completa. El modelo a veces no la contaba y
  // la escena quedaba sin terminar (probar:escena, 28 de octubre de 2026).
  // No las que esperan la despedida ni las de saludar: esas piden eso mismo.
  if (!hechas.size && !soloPregunta && afirma && !hablaEspanol(dicho)) {
    const completa = [...mediasAntes]
      .filter(([n, falta]) => !/goodbye|bye|desp[ií]d/i.test(falta) && !/^saluda/i.test((e.tareas[n - 1] ?? "").trim()))
      .map(([n]) => n)
      .sort((a, b) => a - b)[0];
    if (completa) {
      hechas.add(completa);
      medias.delete(completa);
    }
  }
  for (const n of pendientes) {
    if (hechas.has(n)) continue;
    const lineas = lineasDeLaTarea(e, n);
    if (lineas.length < 2) continue;
    if (!lineas.some(dijoLaLinea)) continue;
    if (mediasAntes.has(n) && !lineas.every(dijoLaLinea)) {
      hechas.add(n);
      medias.delete(n);
    } else if (!medias.has(n)) {
      // Lo que falta, con la otra línea del ejemplo: "the rest of the task"
      // no le decía al modelo qué esperar ("Since yesterday." no completaba).
      const otra = lineas.find((k) => !dijoLaLinea(k));
      medias.set(n, otra === undefined ? "the rest of the task" : `something like "${e.dialogo[otra].dice}"`);
    }
  }
  if (soloSaluda(dicho)) {
    for (const n of pendientes) {
      const resto = /^saluda y (.+?)\.?$/i.exec((e.tareas[n - 1] ?? "").trim())?.[1];
      if (!resto) continue;
      hechas.delete(n);
      if (!medias.has(n)) medias.set(n, resto);
    }
  }
  return {
    tareas: [...hechas].sort((a, b) => a - b),
    aMedias: [...medias].filter(([n]) => !hechas.has(n)).map(([tarea, falta]) => ({ tarea, falta })),
  };
}

/**
 * La línea de Allison, lista para la escena (todo con pruebas, auditoría
 * del 28 de octubre de 2026):
 *   · viajes y propios: si lo que sigue es que el alumno pregunte, ella
 *     no hace preguntas de información (le quitaría la tarea). Solo ahí:
 *     con diálogo de ejemplo, "Do you have any questions?" reemplazaba
 *     las preguntas del personaje ("When did it start?" a un enfermo);
 *   · antes del mínimo, sin despedidas;
 *   · sin saltar a la pregunta de otra tarea pendiente;
 *   · termina con una pregunta: la del ejemplo para la tarea que sigue
 *     (o su otra mitad); sin ejemplo, una por lo que pide la tarea; con
 *     todo hecho antes del mínimo, una del personaje que no ha hecho. Si
 *     lo que sigue es que el alumno pregunte, con diálogo no se agrega
 *     ninguna: el alumno pregunta;
 *   · nunca su línea anterior otra vez (se mira al final, ya con la
 *     pregunta: antes se miraba antes de agregarla y salía idéntica);
 *   · sin pasar mucho del largo del nivel.
 * `agregada`: la tarea cuya pregunta del ejemplo puso el código (la idea
 * es entonces la respuesta del ejemplo).
 */
export function ajustarLinea(o: {
  linea: string;
  e: Escenario;
  /** Las tareas pendientes después de este mensaje, en orden. */
  quedan: number[];
  /** Las que quedan a medias, con lo que les falta. */
  medias: Map<number, string>;
  /** Las tareas ya hechas, con las de este mensaje. */
  hechas: number[];
  turno: number;
  minimo: number;
  /** Las líneas anteriores de Allison, en inglés y en orden. */
  anteriores: string[];
  nivel: Nivel;
}): { linea: string; agregada: { tarea: number; parte: number } | null } {
  const { e, quedan } = o;
  const sigue = quedan[0];
  const libre = sinEjemplo(e);
  const anterior = o.anteriores.at(-1) ?? "";
  const falta = sigue ? o.medias.get(sigue) : undefined;
  const parte = falta ? 1 : 0;
  // A medias por la despedida, no se le pregunta nada: le toca despedirse.
  const ejemplo = sigue && !(falta && seDespide(falta)) ? preguntaDeLaTarea(e, sigue, parte) : null;
  const deTareaHecha = o.hechas.map((n) => preguntaDeLaTarea(e, n) ?? "").filter(Boolean);
  const sinUsar = () => preguntaSinUsar(e, o.anteriores, [...deTareaHecha, ...quedan.map((n) => preguntaDeLaTarea(e, n) ?? "").filter(Boolean)]);
  let agregada: { tarea: number; parte: number } | null = null;
  const conEjemplo = (l: string) => !!ejemplo && oracionesDe(l).some((x) => comoPregunta(x) === comoPregunta(ejemplo));

  let en = o.linea;
  if (libre && sigue && esTareaDePreguntar(e.tareas[sigue - 1] ?? "")) en = sinPreguntasDeInformacion(en);
  // Sin diálogo de ejemplo no hay frase del alumno con qué comparar: si le
  // toca pedir, Allison no pide por él ("I'd like some tacos, please. With
  // chicken and salsa.", la guía en México; pruebas, 28 de octubre de 2026).
  if (libre && quedan.some((n) => /^pide/i.test((e.tareas[n - 1] ?? "").trim()))) en = sinPedirPorElAlumno(en);
  // Antes del mínimo, o mientras falten tareas, la escena sigue: sin
  // despedidas (salía "…Goodbye! Do you have any questions?").
  if (o.turno < o.minimo || sigue) en = sinDespedida(en);
  if (!libre && sigue) {
    const sinSaltar = sinSaltarTareas(en, e, quedan, ejemplo);
    if (sinSaltar !== en && conEjemplo(sinSaltar) && sigue) agregada = { tarea: sigue, parte };
    en = sinSaltar;
  }

  if ((o.turno < o.minimo || sigue) && !llevaPregunta(en)) {
    const pregunta = ejemplo ?? (libre && sigue ? preguntaParaLaTarea(e.tareas[sigue - 1] ?? "") : null) ?? (!sigue ? sinUsar() : null);
    // La misma pregunta de relleno dos veces seguidas no ("Great! Do you
    // have any questions?" otra vez); la del ejemplo sí se puede repetir:
    // el alumno no la contestó.
    const yaLaHizo = !!pregunta && pregunta !== ejemplo && ultimaPregunta(anterior) === comoPregunta(pregunta);
    if (pregunta && !yaLaHizo && !oracionesDe(en).some((x) => comoPregunta(x) === comoPregunta(pregunta))) {
      en = `${conPunto(en)} ${pregunta}`.trim();
      if (pregunta === ejemplo && sigue) agregada = { tarea: sigue, parte };
    }
  }

  // Si de la línea no quedó nada (o solo "Okay."), algo que le dé pie al
  // alumno: con un "Okay." suelto no sabía qué decir (verificación del 28
  // de octubre de 2026). Si le toca preguntar, se lo pide.
  if (palabras(en).length <= 1 && (o.turno < o.minimo || sigue)) {
    const pie = sigue
      ? esTareaDePreguntar(e.tareas[sigue - 1] ?? "")
        ? INVITA_A_PREGUNTAR
        : (ejemplo ?? (libre ? preguntaParaLaTarea(e.tareas[sigue - 1] ?? "") : null) ?? sinUsar())
      : sinUsar();
    if (pie) {
      en = `Okay! ${pie}`;
      if (pie === ejemplo && sigue) agregada = { tarea: sigue, parte };
    }
  }

  if (repiteLaAnterior(en, anterior)) {
    const nueva = sinRepetirLaAnterior(en, anterior, ejemplo, !sigue ? sinUsar() : null);
    const relleno = PREGUNTAS_DE_RELLENO.find((p) => !palabras(anterior).join(" ").includes(comoPregunta(p)));
    en = !repiteLaAnterior(nueva, anterior) ? nueva : relleno ? `Okay! ${relleno}` : nueva;
    agregada = conEjemplo(en) && sigue ? { tarea: sigue, parte } : null;
  }

  return { linea: recortarLinea(en, PALABRAS[o.nivel] + 6) || "Okay.", agregada };
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

/** Una oración del repaso en español, aunque nombre lo que se repasa en inglés ("Vamos a repasar there is…"). */
const esDelRepaso = (o: string) => esEspanolClaro(o) || /\b(vamos a repasar|lo intentas de nuevo)\b/i.test(o);

/**
 * El cierre aprobado para cuando se acaban las intervenciones ("Pasa de 18
 * intervenciones sin cumplir las tareas"), en sus dos partes: la
 * despedida del personaje, en inglés (la dice Allison en el último
 * turno), y el repaso, en español (la caja "Te faltó"). Se separan por
 * oración: en A1 P8, A2 P5 y A2 P8 el repaso nombra lo que se repasa en
 * inglés ("Vamos a repasar there is…") y se iba con la despedida; en B1
 * viene con el nombre y entre comillas (Ms. Patel: "…") y el repaso
 * después de "En pantalla:" (auditoría, 28 de octubre de 2026). El
 * "Diego" del ejemplo es el nombre del alumno.
 */
export function cierreDelEscenario(e: Escenario, nombre?: string): { despedida: string; repaso: string } {
  const cierre = e.siSeAtasca.find((s) => /intervenciones/i.test(s.situacion));
  if (!cierre) return { despedida: "Thank you! Goodbye!", repaso: "" };
  const [dicho, enPantalla = ""] = cierre.ejemplo.split(/\s*\bEn pantalla:\s*/i);
  const sinEtiqueta = dicho
    .trim()
    .replace(/^[A-Z][\w.'’ -]{0,30}:\s*/, "")
    .replace(/["“”]/g, "")
    .trim();
  const ingles: string[] = [];
  const espanol: string[] = [];
  for (const o of oracionesDe(sinEtiqueta)) (esDelRepaso(o) ? espanol : ingles).push(o);
  const primero = nombre?.trim().split(/\s+/)[0];
  const despedida = sinPreguntas(ingles.join(" "))
    .replace(/,?\s*\bDiego\b/g, (m: string) => (primero ? m.replace("Diego", primero) : ""))
    // Sin nombre, sin el espacio que quedaba antes del signo ("Bye !").
    .replace(/\s+([!?.,])/g, "$1")
    .trim();
  return { despedida: despedida || "Thank you! Goodbye!", repaso: (enPantalla.trim() || espanol.join(" ")).trim() };
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
as the student would say it and the way a person from the US says it,
never word by word ("Somos tres" -> "There are three of us.", not "We
are three."). Only their words in English: never an answer to them.`,
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
  const r = await cliente().models.generateContent({
    model: modelo(),
    contents: [...historial, { role: "user", parts: [{ text: `${t.texto}\n\n${recordatorioEscenario(t)}` }] }],
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
    aMedias?: unknown;
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
    aMedias: t.aMedias ?? [],
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
  if (roto || finDelModelo !== "STOP") return { ...falla, transcripcion: t.texto.trim() };

  // Lo que el alumno escribió, o lo hablado ya transcrito a ciegas, ES la
  // transcripción: el modelo de la escena ya no recibe audio.
  const transcripcion = t.texto.trim();
  const pendientes = new Set(tareasVisibles(t.escenario, t.cumplidas).filter((n) => !t.cumplidas.includes(n)));
  // Español: lo dice el código, o el modelo salvo que la frase sea inglés
  // claro (llegó a marcar "I am Diego." como español). El código solo no
  // basta: "Me llamo Diego" o "Mucho gusto" le quedan en duda. Mezclado
  // ("Okay okay, somos 14 personas") también es español: no cuenta la
  // tarea y Allison le da la frase en inglés.
  const espanol = transcripcion
    ? hablaEspanol(transcripcion) ||
      mezclaEspanol(transcripcion) ||
      (d.espanol === true && !inglesClaroDelAlumno(transcripcion) && !soloNombres(transcripcion))
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
  // Sin calcos ("We are three." → "There are three of us.").
  const comoLaDijo = (s: string) => sinCalcos(pregunto ? s : sinPreguntas(s));
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
  // Si no queda nada, "Okay.": con "Great!" felicitaba a un enfermo
  // (auditoría, 28 de octubre de 2026).
  if (!espanol && transcripcion) en = sinEcoDelAlumno(en, transcripcion) || (delModelo ? "Okay." : "");
  // El último turno cierra sin preguntar: si el modelo preguntó igual, se
  // quita la pregunta; si no queda nada, o habló en español (la frase en
  // inglés sería de él, no de ella), la despedida del contenido.
  if (t.ultimo) en = (!espanol && sinPreguntas(en)) || cierreDelEscenario(t.escenario, t.nombre).despedida;
  // El alumno habló y el modelo no dio una línea en inglés que sirva: es
  // falla de la IA (se devuelve), no un "repite" que se le cobra.
  if (!delModelo && transcripcion && !t.ultimo) return { ...falla, transcripcion, tokensEntrada, tokensSalida };
  if (!en && transcripcion) en = REPETIR;

  // En español no se cumple ninguna tarea: Allison da la frase en inglés.
  const { tareas, aMedias } = espanol
    ? { tareas: [] as number[], aMedias: [...mediasPendientes(t.aMedias, pendientes)].map(([tarea, falta]) => ({ tarea, falta })) }
    : tareasDelTurno({
        e: t.escenario,
        pendientes,
        dicho: transcripcion,
        modelo: { tareas: d.tareas, aMedias: d.aMedias },
        antes: t.aMedias ?? [],
        despidioAntes: t.historial.some((m) => m.rol === "alumno" && seDespide(m.texto)),
      });
  // Sin la frase del alumno ni la pregunta de una tarea que acaba de cumplir.
  if (!espanol && !t.ultimo && transcripcion) en = sinFrasesFueraDeLugar(en, t.escenario, pendientes, tareas, transcripcion) || "Okay.";

  // El imprevisto (B1): al cumplir la tarea después de la cual pasa,
  // Allison lo trae con la línea aprobada del diálogo de ejemplo. Lo que
  // dijo el modelo queda como reacción corta, sin preguntas. La línea del
  // imprevisto no pregunta nada ("…It will arrive tomorrow night."): va la
  // pregunta del ejemplo para la tarea que trae (auditoría, 28 de octubre
  // de 2026).
  const imp = t.escenario.imprevisto;
  const llegaSorpresa = !!imp && !t.ultimo && !espanol && tareas.includes(imp.despuesDeTarea);
  const anteriores = t.historial.filter((m) => m.rol === "allison").map((m) => soloIngles(m.texto) || m.texto);
  let agregada: { tarea: number; parte: number } | null = null;
  if (llegaSorpresa && imp) {
    // Una oración de reacción, sin lo que ya trae la línea del imprevisto:
    // el modelo la adelantaba con otras palabras y salía dos veces ("Your
    // bag is still in Bogotá… Let me check… Your bag is still in Bogotá";
    // verificación del 28 de octubre de 2026).
    const reaccion = oracionesDe(sinPreguntas(en))
      .filter((x) => !compartenTramo(x, imp.linea))
      .slice(0, 1)
      .join(" ");
    en = reaccion ? `${reaccion} ${imp.linea}` : imp.linea;
    const suya = preguntaDeLaTarea(t.escenario, imp.tarea);
    if (suya && !llevaPregunta(en)) {
      en = `${conPunto(en)} ${suya}`;
      agregada = { tarea: imp.tarea, parte: 0 };
    }
  } else if (!t.ultimo && !espanol && transcripcion) {
    // Antes del mínimo, o mientras falten tareas, la línea termina con una
    // pregunta: sin ella el alumno no sabe qué decir y la escena se cae
    // ("Sure, this way. Here's the menu."). Un eco ("Fourteen people? Wow!
    // This way, please.") no cuenta como pregunta (prueba en producción,
    // octubre de 2026). El resto de los arreglos, en ajustarLinea.
    const quedan = [...pendientes].filter((n) => !tareas.includes(n));
    const ajustada = ajustarLinea({
      linea: en,
      e: t.escenario,
      quedan,
      medias: mediasPendientes(aMedias, new Set(quedan)),
      hechas: [...t.cumplidas, ...tareas],
      turno: t.turno,
      minimo: t.minimo,
      anteriores,
      nivel: t.nivel,
    });
    en = ajustada.linea;
    agregada = ajustada.agregada;
  }

  // La idea responde a la línea que escribió el modelo: sirve mientras la
  // pregunta de la línea sea la misma que él hizo (la sorpresa, una
  // pregunta agregada o quitada la dejan sin sentido). Si el código puso la
  // pregunta del ejemplo, la idea es lo que el alumno contesta en el
  // ejemplo ("How long is your trip?" → "For ten days."): antes quedaba sin
  // idea (auditoría, 28 de octubre de 2026).
  const quedan = new Set([...pendientes].filter((n) => !tareas.includes(n)));
  const ideaTarea = quedan.has(Number(d.ideaTarea)) ? Number(d.ideaTarea) : 0;
  // Una idea que es línea del personaje ("Welcome to Miami. Have a nice
  // day!", o una pregunta que ella ya hizo: "What do you think of the
  // pyramid?") o que no responde nada ni hace una tarea ("It's thirty-two
  // dollars." → "Do you like New Orleans?") no sirve: vuelve la frase de
  // la tarea que sigue (pruebas con el modelo, octubre de 2026). Se compara
  // por oraciones enteras: como parte de una línea, se perdían ideas
  // buenas ("Yes, it is."); las de una o dos palabras ("Thank you!") son
  // de cualquiera.
  const delPersonajeOraciones = new Set(
    [en, ...anteriores, ...t.escenario.dialogo.filter((l) => l.quien === "personaje").map((l) => l.dice)]
      .flatMap(oracionesDe)
      .map((o) => palabras(o).join(" "))
  );
  const delPersonaje = (s: string) => {
    const suyas = oracionesDe(s).map((o) => palabras(o).join(" ")).filter(Boolean);
    return suyas.length > 0 && suyas.every((o) => delPersonajeOraciones.has(o)) && suyas.some((o) => o.split(" ").length >= 3);
  };
  const ideaCandidata = soloIngles(d.idea ?? "");
  const mismaPregunta = !llegaSorpresa && ultimaPregunta(en) === ultimaPregunta(soloIngles(d.respuesta ?? ""));
  // Sin diálogo de ejemplo (viajes, propios), para una tarea de dos partes
  // el modelo daba la mitad ("I'd like some tacos, please." para "Pide
  // unos tacos y di qué les pones"): sin idea, la pantalla la pide a
  // /api/ayuda, que la hace con la tarea entera (auditoría y pruebas, 28 de
  // octubre de 2026). Despedirse dando las gracias sí se ve completo.
  const tareaDeLaIdea = ideaTarea ? (t.escenario.tareas[ideaTarea - 1] ?? "") : "";
  const ideaAMedias =
    sinEjemplo(t.escenario) && /\s+y\s+/i.test(tareaDeLaIdea) && !(/desp[ií]dete/i.test(tareaDeLaIdea) && seDespide(ideaCandidata));
  const ideaEn =
    ideaCandidata && mismaPregunta && !ideaAMedias && !delPersonaje(ideaCandidata) && (en.includes("?") || ideaTarea) ? ideaCandidata : "";
  const ideaDelEjemplo =
    agregada && ultimaPregunta(en) === comoPregunta(preguntaDeLaTarea(t.escenario, agregada.tarea, agregada.parte) ?? "")
      ? respuestaDelEjemplo(t.escenario, agregada.tarea, agregada.parte)
      : "";
  // Si habló en español, Allison le dio su frase en inglés ("My name is
  // Diego. Try it!"): la idea es esa frase, y lo que dijo es su traducción.
  // La traducción de la idea se queda salvo que sea inglés claro ("Dos
  // boletas." es español aunque sea corta).
  const ideaEs = (d.ideaEs ?? "").trim();
  const idea = t.ultimo
    ? null
    : espanol && traduccion
      ? { en: traduccion, es: transcripcion, tarea: 0 }
      : ideaEn
        ? { en: ideaEn, es: ideaEs && !esInglesClaro(ideaEs) ? ideaEs : "", tarea: ideaTarea }
        : ideaDelEjemplo && agregada
          ? { en: ideaDelEjemplo, es: "", tarea: agregada.tarea }
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
  const mejor = sinCalcos(soloIngles(d.errorMejor ?? ""));
  const error =
    !espanol && dijo && mejor && esCorreccionDe(dijo, mejor) && estaEnLoDicho(dijo, transcripcion) ? { dijo, mejor } : null;

  return {
    transcripcion,
    tareas,
    aMedias,
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
  /**
   * "pregunta": preguntó un dato; "respuesta": contestó el "And you?";
   * "social": saluda, agradece, se despide o dice que no sabe; "otro": no
   * se entiende.
   */
  tipo: "pregunta" | "respuesta" | "social" | "otro";
  /** El dato que preguntó (desde 1), o 0. */
  dato: number;
  /** Un segundo dato preguntado en el mismo turno ("Where are you from? How old are you?"), o 0. */
  otroDato?: number;
  /**
   * Una pregunta que además contesta el "And you?" ("I'm from Colombia.
   * How old are you?"): Allison reacciona antes de contestar. Antes la
   * respuesta se comía la pregunta y Allison pedía otra.
   */
  responde?: boolean;
  /** Lo dijo en español. */
  espanol: boolean;
  /**
   * Una pregunta en inglés que no está en la ficha ("When is Luna's
   * birthday?"): Allison no la sabe, pero no es pedir ayuda.
   */
  fuera?: boolean;
  /** El modelo no clasificó (JSON roto o vacío, no terminó): falla de la IA, se devuelve. */
  sinRespuesta?: boolean;
  tokensEntrada: number;
  tokensSalida: number;
}

/**
 * El JSON de un clasificador (Entrevista, Adivina, Enséñale), o null si
 * es falla de la IA: no se pudo leer, vino vacío o sin "tipo", o el
 * modelo no terminó (finishReason distinto de STOP: el tope de salida,
 * un bloqueo). Antes se tomaba como {} y el turno salía "otro": se cobraba
 * y sumaba una ayuda que quitaba estrella. Ahora es como en
 * turnoDeEscenario: el turno no cuenta y la ruta devuelve la intervención
 * (auditoría, 30 de octubre de 2026).
 */
function clasificacionDelModelo<T extends { tipo?: string }>(r: {
  text?: string;
  candidates?: { finishReason?: unknown }[];
}): T | null {
  if (String(r.candidates?.[0]?.finishReason ?? "STOP") !== "STOP") return null;
  try {
    const d = JSON.parse(r.text ?? "") as T | null;
    return d && typeof d === "object" && typeof d.tipo === "string" ? d : null;
  } catch {
    return null;
  }
}

/**
 * Clases de pregunta que el modelo confunde entre datos del mismo
 * personaje: "When is Luna's birthday?" salía como "How old is Luna?" y
 * Allison contestaba "She is three." aunque el prompt lo prohíbe
 * (auditoría, 28 de octubre de 2026). Si lo dicho y la pregunta del dato
 * son de clases distintas, no es ese dato.
 */
const CLASES_DE_PREGUNTA: [string, RegExp][] = [
  ["cumpleaños", /\b(birthday|born)\b/i],
  ["edad", /\b(how old|age|years old)\b/i],
  ["nombre", /\bname\b/i],
];
const clasesDe = (t: string) => CLASES_DE_PREGUNTA.filter(([, re]) => re.test(t)).map(([c]) => c);

/** Lo dicho pregunta otra cosa que la pregunta del dato (cumpleaños por edad, edad por nombre). */
export function otraClaseDePregunta(dicho: string, pregunta: string): boolean {
  const a = clasesDe(dicho);
  const b = clasesDe(pregunta);
  return a.length > 0 && b.length > 0 && !a.some((c) => b.includes(c));
}

/** Los nombres propios de una pregunta ("When is Emily's birthday?" → Emily), sin la primera palabra. */
const nombresDe = (pregunta: string) =>
  [...pregunta.matchAll(/(?<!^)\b([A-Z][a-z]+)(?:'s)?\b/g)].map((m) => m[1]).filter((n) => n !== "I");

/**
 * Lo dicho nombra a alguien de la ficha y el dato es de otro ("Luna
 * birthday?" no es "When is Emily's birthday?"). `nombres`: los de todas
 * las preguntas de la ficha.
 */
export function otraPersona(dicho: string, pregunta: string, nombres: string[]): boolean {
  const dichos = nombres.filter((n) => new RegExp(`\\b${n}\\b`, "i").test(dicho));
  const delDato = nombresDe(pregunta);
  return dichos.length > 0 && delDato.length > 0 && !dichos.some((n) => delDato.includes(n));
}

const ESQUEMA_CLASIFICAR = {
  type: Type.OBJECT,
  properties: {
    tipo: { type: Type.STRING, enum: ["pregunta", "respuesta", "social", "otro"] },
    dato: { type: Type.INTEGER },
    otroDato: { type: Type.INTEGER },
    responde: { type: Type.BOOLEAN },
    espanol: { type: Type.BOOLEAN },
  },
  required: ["tipo", "dato", "otroDato", "responde", "espanol"],
  propertyOrdering: ["tipo", "dato", "otroDato", "responde", "espanol"],
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
- "tipo":
  "pregunta" if it asks one of the things in the list (any
  understandable question counts, even with mistakes or very short,
  like "Your age?"), also when it first answers Allison and then asks
  ("I'm 15. Do you have a pet?"). It must ask for the same information
  about the same person or animal as the item. Same person but other
  information is not that item ("How old is your mom?" is not "What's
  your mom's name?"; "When is Luna's birthday?" is not "How old is
  Luna?"): then it is "otro".
  "respuesta" if it only answers Allison's question back, also when it
  ends by asking the same thing back ("My name is Diego. And you?").
  "social" if it only greets, thanks, says goodbye or says they don't
  know ("Hello!", "Thank you, Allison!", "Bye!", "I don't know").
  "otro" if it is none of these or cannot be understood.
- "dato": the number of the thing asked (1-${o.entrevista.datos.length}), or 0.
- "otroDato": if it asks a second, different thing from the list in the
  same message, its number; otherwise 0.
- "responde": true if the message answers Allison's question back.
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
  const tokens = {
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
  const d = clasificacionDelModelo<{ tipo?: string; dato?: number; otroDato?: number; responde?: boolean; espanol?: boolean }>(r);
  if (!d) return { tipo: "otro", dato: 0, espanol: false, sinRespuesta: true, ...tokens };
  const tipoModelo = d.tipo === "pregunta" || d.tipo === "respuesta" || d.tipo === "social" ? d.tipo : "otro";
  const valido = (n?: number) => (Number.isInteger(n) && n! >= 1 && n! <= o.entrevista.datos.length ? n! : 0);
  const nombres = [...new Set(o.entrevista.datos.flatMap((x) => nombresDe(x.pregunta)))];
  const ajeno = (n: number) =>
    n > 0 &&
    (otraClaseDePregunta(o.transcripcion, o.entrevista.datos[n - 1].pregunta) ||
      otraPersona(o.transcripcion, o.entrevista.datos[n - 1].pregunta, nombres));
  let dato = valido(d.dato);
  let otroDato = valido(d.otroDato);
  if (ajeno(otroDato)) otroDato = 0;
  if (ajeno(dato)) [dato, otroDato] = [otroDato, 0];
  const espanol = !!d.espanol;
  // Contestó su "And you?" y preguntó algo que no está en la ficha: es su respuesta.
  const tipo =
    tipoModelo === "pregunta" && !dato ? (d.responde && o.devuelta ? "respuesta" : "otro") : tipoModelo;
  return {
    tipo,
    dato: tipo === "pregunta" ? dato : 0,
    otroDato: tipo === "pregunta" && otroDato !== dato ? otroDato : 0,
    // Solo se contesta algo si Allison había devuelto la pregunta.
    responde: tipo === "pregunta" && !!dato && !!o.devuelta && !!d.responde,
    espanol,
    fuera: tipo === "otro" && !espanol && esPreguntaEnIngles(o.transcripcion),
    ...tokens,
  };
}

/** Una pregunta entendible en inglés: termina en "?" o empieza como pregunta, y no es español. */
const esPreguntaEnIngles = (t: string) =>
  !hablaEspanol(t) &&
  /[a-z]/i.test(t) &&
  (/\?\s*$/.test(t.trim()) || /^(what|when|where|who|how|why|which|do|does|did|is|are|can|have|has)\b/i.test(t.trim()));

/** Reacciones cortas de Allison a lo que el alumno le cuenta. */
const REACCIONES = ["Cool!", "Nice!", "Great!", "Oh, nice!", "Wow!"];

/**
 * La respuesta de Allison en la entrevista, armada con su ficha. Devuelve
 * el texto para mostrar, el texto para la voz y lo que queda pendiente.
 */
/**
 * ¿Se le puede devolver la pregunta al alumno? Solo si Allison habló de
 * sí misma ("My name is Allison.", "I'm 28.", "Yes! I have a cat."). "Her
 * name is Emily. And you?", "Take the ferry. And you?" o "It's made of
 * copper. And you?" no tenían sentido (auditoría, 28 de octubre de 2026).
 */
const seDevuelve = (respuesta: string) => /^(i\b|i'm\b|i've\b|i'd\b|i'll\b|my\b|yes\b|no\b)/i.test(respuesta.trim());

/**
 * Con la ficha completa, la pregunta que Allison le hace al alumno para
 * seguir la charla: no la que acaba de contestarle (`anterior`).
 */
const preguntaDeAllison = (e: Entrevista, turno: number, anterior?: string | null) => {
  const suyas = e.datos.filter((d) => seDevuelve(d.respuesta)).map((d) => d.pregunta);
  const lista = (suyas.length ? suyas : e.datos.map((d) => d.pregunta)).filter((q, _, todas) => todas.length < 2 || q !== anterior);
  return lista[turno % lista.length];
};

/** Deletreo con guiones ("A-L-L-I-S-O-N"): la voz lo lee de corrido; con comas, letra por letra. */
const deletreoParaVoz = (t: string) => t.replace(/\b[A-Za-z](?:-[A-Za-z]){2,}\b/g, (m) => m.toUpperCase().split("-").join(", "));

export function respuestaDeEntrevista(o: {
  entrevista: Entrevista;
  clasificacion: Pick<Clasificacion, "tipo" | "dato" | "espanol" | "responde"> & Partial<Pick<Clasificacion, "otroDato" | "fuera">>;
  descubiertos: number[];
  turno: number;
  /** Desde B1 Allison no habla en español: da la pista del dato en inglés. */
  nivel?: Nivel;
  /** Con este turno se llega al mínimo de intervenciones: si la ficha queda completa, Allison cierra. */
  alcanzaMinimo?: boolean;
  /** La pregunta que Allison le había devuelto: con la ficha completa no la repite. */
  devueltaAntes?: string | null;
}): { respuesta: string; respuestaVoz: string; descubierto: number | null; otroDescubierto: number | null; devuelta: string | null } {
  const e = o.entrevista;
  let c = o.clasificacion;
  // "My name is Diego. And you?": contesta y devuelve lo que ya se sabe.
  // Responder otra vez su nombre y volver a preguntar era un bucle.
  if (c.tipo === "pregunta" && c.responde && o.descubiertos.includes(c.dato) && !c.otroDato) c = { ...c, tipo: "respuesta", dato: 0 };
  const faltan = e.datos.map((_, i) => i + 1).filter((n) => !o.descubiertos.includes(n));
  const siguiente = e.datos[(faltan[0] ?? 1) - 1];
  const enIngles = !!o.nivel && o.nivel !== "A1" && o.nivel !== "A2";
  const reaccion = REACCIONES[o.turno % REACCIONES.length];
  const sinDato = { descubierto: null, otroDescubierto: null };
  /** La pista en inglés de un dato (desde 1): la aprobada, o la pregunta misma. */
  const pista = (n: number) => e.pistas?.[n - 1] ?? `Ask me: ${e.datos[n - 1].pregunta}`;

  // Con la ficha completa (y menos intervenciones que el mínimo), lo que
  // no es pregunta no es pedir ayuda: Allison sigue la charla y le
  // pregunta ella. Antes cada "Thank you!" o "Bye!" restaba un acierto y
  // recibía "Pregúntame así: What's your name?", un dato ya descubierto.
  if (!faltan.length && c.tipo !== "pregunta") {
    if (o.alcanzaMinimo) {
      const respuesta = `${reaccion} Thank you for your questions!`;
      return { respuesta, respuestaVoz: respuesta, ...sinDato, devuelta: null };
    }
    const q = preguntaDeAllison(e, o.turno, o.devueltaAntes);
    // A "I don't know" o "Thank you!" no le va "Oh, nice!".
    const respuesta = c.espanol ? `In English, please! ${q}` : `${c.tipo === "social" ? "OK!" : reaccion} ${q}`;
    return { respuesta, respuestaVoz: respuesta, ...sinDato, devuelta: q };
  }
  // Saluda, agradece o dice que no sabe: no cuenta como ayuda.
  if (c.tipo === "social" && !c.espanol) {
    const respuesta = "OK! Ask me a question!";
    return { respuesta, respuestaVoz: respuesta, ...sinDato, devuelta: null };
  }

  // Una buena pregunta que no está en la ficha ("When is Luna's
  // birthday?"): no la sabe y no le sopla la siguiente (no es ayuda).
  if (c.fuera) {
    const respuesta = "Good question! But I don't know. Ask me another question!";
    return { respuesta, respuestaVoz: respuesta, ...sinDato, devuelta: null };
  }

  if (enIngles && c.tipo !== "respuesta" && !(c.tipo === "pregunta" && c.dato && !c.espanol)) {
    const n = c.tipo === "pregunta" && c.dato ? c.dato : (faltan[0] ?? 1);
    const respuesta = c.espanol ? `In English, please! ${pista(n)}` : pista(n);
    return { respuesta, respuestaVoz: respuesta, ...sinDato, devuelta: null };
  }

  // En español: lo entiende, pero pide la pregunta en inglés (cuenta como
  // pista). Si en español contestaba su "And you?", es solo una respuesta.
  if (c.espanol && c.tipo !== "respuesta") {
    const en = c.tipo === "pregunta" && c.dato ? e.datos[c.dato - 1].pregunta : siguiente.pregunta;
    const es = c.tipo === "pregunta" && c.dato ? "¡Eso es! Pregúntalo en inglés:" : "¿Qué quieres saber? Pregúntame así:";
    return { respuesta: `${es} ${en}`, respuestaVoz: `${MARCADOR_ES} ${es} ${MARCADOR_EN} ${en}`, ...sinDato, devuelta: null };
  }

  if (c.tipo === "pregunta" && c.dato) {
    // Dos preguntas en un turno ("Where are you from? How old are you?"):
    // contesta las dos. Antes la segunda se perdía.
    const datos = [c.dato, ...(c.otroDato && c.otroDato !== c.dato ? [c.otroDato] : [])].map((n) => e.datos[n - 1]);
    const ultimo = datos[datos.length - 1];
    // Si de paso contestó la de Allison ("I'm from Colombia. How old are
    // you?"), primero reacciona a lo que le contó.
    const antes = c.responde ? `${reaccion} ` : "";
    const dicho = `${antes}${datos.map((d) => d.respuesta).join(" ")}`;
    const quedan = faltan.filter((n) => n !== c.dato && n !== c.otroDato).length > 0;
    // Le devuelve la pregunta, así la entrevista va y viene; si la ficha
    // ya trae una pregunta suya, esa. Si no se puede devolver, pide otra.
    // Con la ficha completa y el mínimo cumplido, cierra: la hoja de "Ficha
    // completa" sale ya, y una pregunta suya quedaría sin respuesta.
    if (!quedan && o.alcanzaMinimo) {
      const respuesta = `${dicho.replace(/\s*[^.!]*\?\s*$/, "")} Thank you for your questions!`.trim();
      return { respuesta, respuestaVoz: deletreoParaVoz(respuesta), descubierto: c.dato, otroDescubierto: datos.length > 1 ? c.otroDato! : null, devuelta: null };
    }
    const termina = /\?\s*$/.test(ultimo.respuesta);
    const devuelta = termina ? ultimo.respuesta : seDevuelve(ultimo.respuesta) ? ultimo.pregunta : null;
    const respuesta = termina || !devuelta ? `${dicho}${!termina && quedan ? " Ask me another question!" : ""}` : `${dicho} And you?`;
    return {
      respuesta,
      respuestaVoz: deletreoParaVoz(respuesta),
      descubierto: c.dato,
      otroDescubierto: datos.length > 1 ? c.otroDato! : null,
      devuelta,
    };
  }

  if (c.tipo === "respuesta") {
    const respuesta = faltan.length ? `${reaccion} Ask me another question!` : `${reaccion} Thank you for your questions!`;
    return { respuesta, respuestaVoz: respuesta, ...sinDato, devuelta: null };
  }

  // No se entendió: pregunta en español qué quiere saber y le da la pregunta.
  const es = "¿Qué quieres saber? Pregúntame así:";
  return {
    respuesta: `${es} ${siguiente.pregunta}`,
    respuestaVoz: `${MARCADOR_ES} ${es} ${MARCADOR_EN} ${siguiente.pregunta}`,
    ...sinDato,
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
}): Promise<LecturaAdivina & { tokensEntrada: number; tokensSalida: number; sinRespuesta?: boolean }> {
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
  question, "${a.opciones[1]?.nombre ?? a.opciones[0].nombre}?", or with mistakes), also when it
  asks something else in the same message ("Do you travel a lot? Are you a
  ${a.opciones[0].nombre.toLowerCase()}?"): the guess wins.
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
  const tokens = {
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
  const d = clasificacionDelModelo<{ tipo?: string; fila?: number; opcion?: number; espanol?: boolean }>(r);
  if (!d) return { tipo: "otro", fila: 0, opcion: 0, espanol: false, sinRespuesta: true, ...tokens };
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
    // El modelo marcaba como español preguntas abiertas en inglés ("What do
    // you do?") y contaban como ayuda: si es inglés claro, no lo es.
    espanol: hablaEspanol(o.transcripcion) || (!!d.espanol && !inglesClaroDelAlumno(o.transcripcion)),
    ...tokens,
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
   * a Allison; "aclarar": pide que le repita o le explique la pregunta;
   * "otro": no responde o no se entiende.
   */
  tipo: "respuesta" | "corta" | "pregunta" | "aclarar" | "otro";
  /** Si preguntó algo de la lista de Allison: cuál (desde 1), o 0. */
  pregunta: number;
  /** Una pregunta que además responde la de Allison ("I swam in the sea. What do you like to do?"). */
  responde?: boolean;
  espanol: boolean;
  /** El modelo no clasificó (JSON roto o vacío, no terminó): falla de la IA, se devuelve. */
  sinRespuesta?: boolean;
  tokensEntrada: number;
  tokensSalida: number;
}

const ESQUEMA_ENSENALE = {
  type: Type.OBJECT,
  properties: {
    tipo: { type: Type.STRING, enum: ["respuesta", "corta", "pregunta", "aclarar", "otro"] },
    pregunta: { type: Type.INTEGER },
    responde: { type: Type.BOOLEAN },
    espanol: { type: Type.BOOLEAN },
  },
  required: ["tipo", "pregunta", "responde", "espanol"],
  propertyOrdering: ["tipo", "pregunta", "responde", "espanol"],
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
  "pregunta" if the student asks Allison a question, also when they
  answer first ("I swam in the sea. What do you like to do?").
  "aclarar" if the student asks Allison to repeat or explain her
  question ("What?", "Can you repeat?", "What do you mean?").
  "otro" if it does not answer, or it cannot be understood.
- "pregunta": if "tipo" is "pregunta" and it asks one of these things,
  its number; otherwise 0.
${lista || "  (none)"}
- "responde": true if the message also answers Allison's question.
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
  const tokens = {
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
  const d = clasificacionDelModelo<{ tipo?: string; pregunta?: number; responde?: boolean; espanol?: boolean }>(r);
  if (!d) return { tipo: "otro", pregunta: 0, espanol: false, sinRespuesta: true, ...tokens };
  const tipos = ["respuesta", "corta", "pregunta", "aclarar"] as const;
  let tipo: LecturaEnsenale["tipo"] = tipos.find((t) => t === d.tipo) ?? "otro";
  // "It's in August." es una frase: el modelo a veces la toma por corta y
  // Allison volvía a hacer la misma pregunta (auditoría, 28 de octubre de 2026).
  if (tipo === "corta" && o.transcripcion.trim().split(/\s+/).length >= 3) tipo = "respuesta";
  const n = Number.isInteger(d.pregunta) && d.pregunta! >= 1 && d.pregunta! <= suyas.length ? d.pregunta! : 0;
  return {
    tipo,
    pregunta: tipo === "pregunta" ? n : 0,
    responde: tipo === "pregunta" && !!d.responde,
    // Como en Adivina: si es inglés claro, no es español aunque el modelo diga que sí.
    espanol: hablaEspanol(o.transcripcion) || (!!d.espanol && !inglesClaroDelAlumno(o.transcripcion)),
    ...tokens,
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
  lectura: Pick<LecturaEnsenale, "tipo" | "pregunta" | "espanol"> & Partial<Pick<LecturaEnsenale, "responde">>;
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
  // Corta ("In August."): "Tell me more!" y la pregunta, como dice la
  // actividad. Si vuelve a contestar corto, ya respondió: sigue (antes
  // daba vueltas y a los tres intentos la saltaba sin contarla).
  if (l.tipo === "corta") {
    if (o.intentos > 0) return siguiente(true, e.reacciones[o.actual % Math.max(1, e.reacciones.length)] ?? "Wow!");
    return quedarse(`Tell me more! ${p.simple}`, true);
  }
  // Pidió que le repita o le explique: la pregunta más simple, sin contar intento.
  if (l.tipo === "aclarar") return quedarse(p.simple, false);
  if (l.tipo === "pregunta") {
    // Le preguntó algo a ella: contesta con su ficha (o "hoy enseñas tú").
    const suya = l.pregunta ? e.respuestasDeAllison?.[l.pregunta - 1]?.respuesta : undefined;
    // Si además respondió la suya ("I swam in the sea. What do you like to
    // do?"), la respuesta cuenta y sigue con la siguiente pregunta. Antes
    // se perdía y Allison repetía la misma.
    if (l.responde) return siguiente(true, suya ?? e.reacciones[o.actual % Math.max(1, e.reacciones.length)] ?? "Wow!");
    // Si no, vuelve a su pregunta, que siempre se ve (antes "Good question!
    // But today you're the teacher." la dejaba sin pregunta). No cuenta como intento.
    return quedarse(suya ? `${suya} ${p.pregunta}` : `${e.otraPregunta ?? OTRA_PREGUNTA} ${p.pregunta}`, false);
  }
  return quedarse(p.simple, true);
}
