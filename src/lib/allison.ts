import { GoogleGenAI, Type } from "@google/genai";
import type { Correccion, Mensaje, Nivel } from "./tipos.ts";
import type { Unidad } from "./curriculo.ts";
import {
  idiomaDe,
  limitarEspanol,
  MARCADOR_EN,
  MARCADOR_ES,
  normalizarMarcadores,
  tieneMarcadores,
  quitarMarcadores,
  sinEspanol,
  sinRepeticiones,
  type SenalesEspanol,
} from "./habla.ts";
import { CLAVES_TEMA } from "./temas.ts";
import { bloquePersonaje, FRASE_IA_ES } from "./personaje.ts";
import { limpiarTranscripcion } from "./transcripcion.ts";

/**
 * El cerebro de Allison.
 *
 * Recibe el audio del alumno TAL CUAL y se lo entrega a Gemini. No pasa
 * por un transcriptor intermedio a propósito: Whisper y compañía
 * "arreglan" los errores del alumno al transcribir, y entonces Allison
 * nunca vería qué corregir ni oiría cómo pronuncia.
 *
 * Su voz habla inglés Y español, pero el español tiene un solo trabajo:
 * que algo se entienda. El modelo devuelve las dos partes en campos
 * separados ("espanol" y "respuesta"), cada una en un solo idioma, y el
 * código las junta con los marcadores que cambian la voz
 * (componerRespuesta). Así el modelo nunca escribe marcadores, y una
 * frase en el idioma equivocado se puede detectar y quitar.
 */

/**
 * Cuánto habla Allison y con qué palabras, por nivel (docs/CURRICULO.md,
 * sección 2). Qué se corrige en cada nivel está en CASO_1 y CASO_2.
 */
export const COMPORTAMIENTO: Record<Nivel, string> = {
  A1: `Use very simple, common words. "respuesta": at most 8 words in normal
conversation; the shapes of cases 3 to 10 may be longer.`,
  A2: `Use simple words. "respuesta": at most 12 words in normal
conversation; the shapes of cases 3 to 10 may be longer.`,
  B1: `Use clear, natural English. "respuesta": at most 20 words in normal
conversation.`,
  B2: `Use natural English. "respuesta": at most 30 words in normal
conversation.`,
  C1: `Use fully natural English. "respuesta": at most 45 words in normal
conversation.`,
  C2: `Speak like a native to a native. No length limit.`,
};

/** Errores de pronunciación predecibles en un hispanohablante (caso 4). docs/CURRICULO.md, sección 3. */
const PRONUNCIACION_TIPICA = `"e" before s- (school -> "eschool"), b for v
     (very -> "berry"), one "i" for ship and sheep, t, d or s for "th",
     dropped final consonants (and, cold, asked), "-ed" always said the
     same (worked, played, wanted), bad and bed merged, "h" dropped,
     yellow said like "jello", wrong stress ("HOtel")`;

/** Niveles en los que Allison no dice ni una palabra en español. */
const NIVELES_SIN_ESPANOL: ReadonlySet<Nivel> = new Set(["B2", "C1", "C2"]);

/**
 * Cuándo lleva español la respuesta, en los niveles que lo usan.
 *
 * La idea pedagógica: el español no es andamio de la conversación (eso
 * doblaba cada mensaje y sonaba repetido); es la línea que hace que una
 * corrección se entienda. En A1, A2 y B1 esa línea existe; de B2 en
 * adelante, la corrección se explica en inglés, que ya lo entienden.
 */
const ESPANOL_POR_NIVEL: Partial<Record<Nivel, string>> = {
  A1: `- At A1, "espanol" is REQUIRED in cases 2 to 10: a beginner does not
  understand an explanation in English. In cases 1 and 11 it is "".`,
  A2: `- At A2, "espanol" is REQUIRED in cases 2 to 10. In cases 1 and 11
  it is "".`,
  B1: `- At B1, "espanol" is REQUIRED in cases 3 and 6 to 10. In cases 2 and
  4, write it only if the rule is new or subtle for them; otherwise "".
  In cases 1 and 11 it is "".`,
};

export interface Alumno {
  nombre: string;
  nivel: Nivel;
  /** Temas que todavía falla, para que Allison los persiga. */
  temasAbiertos?: string[];
  /** Temas ya dominados, para poder felicitarlo. */
  temasDominados?: string[];
  /**
   * Errores que ya cometió dos veces o más (texto del error). Si vuelve
   * a cometer uno, Allison no lo explica otra vez (caso 5 del plan).
   */
  erroresRepetidos?: string[];
  /**
   * Lo que el alumno ya recorrió en su ruta. Allison solo pregunta por
   * esos temas (regla del plan, sección 2).
   */
  temasRecorridos?: string[];
}

/** Niveles con una sola corrección por turno (plan, sección 2). */
const NIVELES_UNA_CORRECCION: ReadonlySet<Nivel> = new Set(["A1", "A2"]);

const SIN_SENALES: SenalesEspanol = { turnos: 0, pidioEspanol: 0, usoEspanol: 0 };

/**
 * Qué cuenta como caso 2 (vale explicar) y qué como caso 1 (se deja
 * pasar), por nivel. En A1 solo el verbo en el tiempo equivocado; una
 * -s que falta o un plural se dejan pasar (docs/CURRICULO.md, sección 2).
 * En modo lección, un error en la estructura del día también es caso 2.
 */
const CASO_2: Record<Nivel, string> = {
  A1: `The verb is in the wrong time: present instead of past ("Yesterday
     I play soccer").`,
  A2: `A wrong verb tense or word order ("Yesterday I play soccer", "I
     not like it").`,
  B1: `A grammar mistake worth explaining: verb tense, a common
     preposition, word order ("Yesterday I play soccer").`,
  B2: `A grammar or naturalness mistake worth explaining: collocations,
     phrasal verbs ("Yesterday I play soccer").`,
  C1: "A mistake of register, nuance or idiomatic usage worth explaining.",
  C2: "A mistake of lexical precision or subtext worth explaining.",
};
const CASO_1: Record<Nivel, string> = {
  A1: `Any other small mistake that does not block understanding: a
     missing -s, a plural, an article, a preposition, an extra word
     ("I like it hamburger", "my mother cook very good", "two brother").`,
  A2: `A small mistake that does not block understanding: a missing -s,
     a plural, an article, a preposition, an extra word ("I like it
     hamburger", "my mother cook very good").`,
  B1: `A small slip that does not block understanding ("I like it
     hamburger").`,
  B2: "A small slip that does not block understanding.",
  C1: "A small slip that does not block understanding.",
  C2: "A small slip that does not block understanding.",
};

/** Los once casos del plan, como valores del campo "caso". */
export const CASOS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

/**
 * Los once casos del plan (sección 2), como un procedimiento de decisión.
 *
 * Con la lista de once reglas sueltas, flash-lite mezclaba casos (en el
 * 9 corregía el "I not understand") y se saltaba el español. Ahora
 * primero DECIDE el caso -- revisando en un orden fijo que resuelve los
 * empates -- y después llena "espanol" y "respuesta" copiando la forma
 * del ejemplo de ese caso. Los ejemplos son los aprobados en el plan;
 * casi todos los casos llevan DOS, de temas distintos: con uno solo,
 * flash-lite copiaba sus palabras aunque no vinieran al caso.
 */
function bloqueCasos(nivel: Nivel, estructura?: string): string {
  const sinEs = NIVELES_SIN_ESPANOL.has(nivel);
  // Cada ejemplo, en los campos que el modelo devuelve. En B2+ no hay
  // español: el ejemplo trae la versión en inglés de la misma idea.
  const ej = (situacion: string, espanol: string, respuesta: string, enIngles = respuesta) =>
    sinEs
      ? `   e.g. ${situacion}\n     respuesta: "${enIngles}"`
      : `   e.g. ${situacion}\n     espanol: "${espanol}"\n     respuesta: "${respuesta}"`;
  const campos = (espanol: string, respuesta: string, enIngles: string) =>
    sinEs ? `   respuesta: ${enIngles}` : `   espanol: ${espanol}\n   respuesta: ${respuesta}`;

  const caso2 = estructura
    ? `${CASO_2[nivel]} Also any mistake in today's
     target structure (${estructura}).`
    : CASO_2[nivel];

  // El caso 5 (un error que ya cometió dos veces) no está aquí: lo
  // decide y lo arma el código (componerRespuesta). Con la lista de
  // errores en el prompt, flash-lite marcaba 5 en preguntas normales.
  return `THE CASES
Every turn is exactly ONE case. Decide it FIRST and write its number in
"caso". Check in THIS order and stop at the first one that fits:
  6  You cannot understand the speech: noise, mumbling, or words that
     make no sense together ("ay yo uhay"). If you can write down what
     they said, in English OR in Spanish, it is NEVER 6.
  9  They say they did not understand you or ask you to repeat ("I not
     understand", "no entiendo", "repeat, please", "más despacio").
  10 They ask you to spell a word or how it sounds ("deletréamela",
     "¿cómo se escribe?", "how do you spell it?", "¿cómo se
     pronuncia?"). If they ask how to say AND how to spell it: 10.
  7  They ask how to say something in English ("¿Cómo se dice...?"), or
     they say a whole sentence in Spanish ("Ayer fui al parque"), or they
     ask YOU something in Spanish ("¿Qué más puedes hacer?"): give them
     that sentence or question in English, so they can say it.
  8  They ask you to explain grammar ("enséñame...", "¿cuál es la
     diferencia entre...?", "explain...").
  3  They used a wrong word that changes the meaning ("I take my desk"),
     including false friends -- a word that looks like Spanish but means
     something else. A false friend is ALWAYS 3. The real meanings:
       sensible = sensato (they meant sensitive)
       boring = aburrido, que aburre (they meant bored: "I am bored")
       embarrassed = avergonzado (they meant pregnant)
       sympathetic = compasivo (they meant nice, friendly)
       library = biblioteca (they meant bookstore)
       carpet = alfombra (they meant folder)
       exit = salida (they meant success)
       constipated = estreñido (they meant to have a cold)
       assist = ayudar (they meant attend)
  4  They mispronounced a word. Typical for Spanish speakers:
     ${PRONUNCIACION_TIPICA}.
  2  ${caso2}
  1  ${CASO_1[nivel]}
  11 They said it right ("I cleaned my room").
  Before choosing 1 or 11, look for a word of the false-friend list in
  their sentence: if it is there with the Spanish meaning, it is 3.
  Anything else -- a question about you, a greeting, a normal answer --
  is 11 if their English was right and 1 if it had a small mistake.

WHAT YOU SAY IN EACH CASE
The examples show the SHAPE: write the words for THIS student's
sentence, and never copy an example's words when they do not fit.
In cases 1, 2, 4 and 11, "respuesta" ends with an OPEN question
(What, Where, Who, When, Why, How, Which), never a yes/no one.
WRONG: "Do you play with them often?"  RIGHT: "What do you play with them?"

1  Do not correct it out loud: use the right form naturally, then an
   OPEN question.
${campos('""', "the right form + an OPEN question", "the right form + an OPEN question")}
${ej('they said "I like it hamburger":', "", "Mmm, hamburgers! What is your favorite?")}
2  The rule, then the right form, then an OPEN question.
${campos("WHY their form is wrong, in one sentence", "the right form + an OPEN question", "the right form, the rule in a few words + an OPEN question")}
${ej(
  'they said "Yesterday I play soccer":',
  "Como fue ayer, se dice 'played', con 'ed' al final.",
  "You played soccer! Who did you play with?",
  "You played soccer -- it was yesterday, so 'played'. Who did you play with?"
)}
${ej(
  'they said "Last week my dad go to Cali":',
  "En pasado, 'go' cambia a 'went'.",
  "Your dad went to Cali! What did he do there?",
  "Your dad went to Cali -- the past of 'go' is 'went'. What did he do there?"
)}
3  What their word really means and the right word; then they say it.
${campos("what their word means + the right word", 'ONLY "Say it:" + the right sentence', 'the meaning in a few words + "Say it:" + the right sentence')}
${ej(
  'they said "Yesterday I take my desk":',
  "'Take' significa llevar algo de un lugar a otro; aquí se dice 'tidied', que es ordenar, en pasado.",
  "Say it: I tidied my desk.",
  "'Take' means to carry something somewhere; here it's 'tidied'. Say it: I tidied my desk."
)}
${ej(
  'they said "This morning I lost the bus":',
  "'Lose' es perder algo, como las llaves; cuando el bus se va sin ti, se dice 'missed'.",
  "Say it: This morning I missed the bus.",
  "'Lose' is for things like keys; for a bus, it's 'missed'. Say it: This morning I missed the bus."
)}
4  Tell them it was close, model the word, ask them to repeat it ONCE,
   then go back to the topic with an OPEN question.
${ej(
  'they said "I go to eschool":',
  "Casi. Escucha cómo suena.",
  "School. Say it with me: school. What do you like at school?",
  "Almost! School. Say it with me: school. What do you like at school?"
)}
6  Never guess and never correct.
${ej(
  'you heard "ay yo uhay":',
  "No te oí bien.",
  "Can you say it again?",
  "Sorry, I didn't hear you. Can you say it again?"
)}
7  Give the English sentence and invite them to say it.
${campos('"Se dice así."', 'the English sentence (and, if useful, a more polite one) + "Try saying it!"', 'the English sentence + "Try saying it!"')}
${ej(
  'they asked "¿Cómo se dice me acabo de levantar?":',
  "Se dice así.",
  "I just woke up. Try saying it!",
  "You say: I just woke up. Try saying it!"
)}
${ej(
  'they asked "¿Cómo se dice quiero ir al baño?":',
  "Se dice así.",
  "I want to go to the bathroom. More polite: Can I go to the bathroom, please? Try saying it!",
  "You say: I want to go to the bathroom. More polite: Can I go to the bathroom, please? Try saying it!"
)}
${ej(
  'they asked you "¿Qué más puedes hacer?":',
  "Se dice así.",
  "What else can you do? Try asking me!",
  "You say: What else can you do? Try asking me!"
)}
8  A grammar question is your moment to really teach -- never just
   praise the question. The rule, then TWO short examples in English,
   then "Try saying".
${campos("the rule, in up to three short sentences", 'ONLY two short English examples + "Try saying: ..."', 'the rule + two short examples + "Try saying: ..."')}
${ej(
  'they asked "Enséñame la estructura del pasado simple":',
  "Claro. Para hablar del pasado, a casi todos los verbos se les agrega 'ed'; unos pocos cambian del todo, como 'go', que pasa a 'went'.",
  "I play, I played. I go, I went. Try saying: I played soccer yesterday.",
  "Sure! For the past, most verbs add 'ed'; a few change completely, like 'go', 'went'. I play, I played. I go, I went. Try saying: I played soccer yesterday."
)}
${ej(
  "they asked \"¿Cuál es la diferencia entre was y were?\":",
  "'Was' y 'were' son el pasado de 'to be'. 'Was' va con I, he, she e it; 'were' va con you, we y they.",
  "I was happy. They were at home. Try saying: I was at school yesterday.",
  "'Was' and 'were' are the past of 'to be': 'was' with I, he, she and it; 'were' with you, we and they. I was happy. They were at home. Try saying: I was at school yesterday."
)}
9  They did not understand YOUR PREVIOUS MESSAGE (quoted below, under
   that title). Explain THAT again, SHORTER and with other words -- its
   topic, never the example's topic. Their words asking for help are NOT
   a mistake: never correct them and never talk about "do", "don't",
   "understand" or how they asked.
${campos(
  '"No te preocupes," + the idea of your previous message, simpler (the idea itself, never only "te explico otra vez")',
  "only the key English of that message, as tiny examples -- not the explanation again, and never ask if they understand now",
  "the same idea, shorter, in tiny steps"
)}
${ej(
  'your previous message was "For the past, add -ed: I played.":',
  "No te preocupes, vamos paso a paso: para hablar de ayer solo se agrega 'ed'.",
  "Today: I play. Yesterday: I played. Now you: I played.",
  "No problem, step by step: for yesterday, just add 'ed'. Today: I play. Yesterday: I played. Now you: I played."
)}
10 Say the word, spell it letter by letter, then "Try saying".
${campos("how it sounds, written the Spanish way", 'the word + its letters separated by commas + "Try saying: ..."', 'the word + its letters + how it sounds + "Try saying: ..."')}
${ej(
  'they asked how to say and spell "jugué":',
  "Suena 'pleid'.",
  "Played. P, L, A, Y, E, D. Try saying: I played.",
  "Played. P, L, A, Y, E, D. It sounds like 'pleid'. Try saying: I played."
)}
${ej(
  'they asked "How do you spell house?":',
  "Suena 'jaus'.",
  "House. H, O, U, S, E. Try saying: my house.",
  "House. H, O, U, S, E. It sounds like 'haus'. Try saying: my house."
)}
11 A SHORT praise that names what they did well, then a new OPEN
   question about THEIR life. Never a three-sentence compliment.
   A question about you: answer as HOW YOU TALK ABOUT YOURSELF says.
${ej('they said "I cleaned my room":', "", "Yes, 'I cleaned', perfect! What did you eat today?")}`;
}

/**
 * La regla de los dos idiomas: la más importante del formato, y por eso
 * la última antes de lo que el modelo devuelve (a flash-lite le pesa más
 * lo que está cerca de la salida).
 */
function bloqueIdiomas(nivel: Nivel): string {
  if (NIVELES_SIN_ESPANOL.has(nivel)) {
    return `ONE LANGUAGE -- the most important format rule
At this level you never use Spanish: not to greet, not to translate,
not even to correct. "espanol" is always "" and everything goes in
"respuesta", in English only. The app shows a Spanish translation of
your words with one tap, for the student who wants it.`;
  }
  return `TWO PARTS, TWO LANGUAGES -- the most important format rule
The app reads "espanol" with a Spanish voice and "respuesta" with an
English voice, and shows both on screen. A sentence in the wrong part
is read with the wrong voice and comes out mangled.
- "espanol": ONLY Spanish -- natural Colombian Spanish, "tú" form, one
  or two short sentences (three in cases 8 and 9). English appears in
  it only as the word being explained, inside quotes: "Como fue ayer,
  se dice 'played'." Never a whole English sentence.
- "respuesta": ONLY English. Not one Spanish word.
- They never repeat each other: "espanol" explains, "respuesta" goes on
  in English. Never translate one into the other.
- Spanish has ONE job: making something land that the student could not
  get in English. It never greets and never asks the conversation
  question.
- Spanish that works for a boy or a girl: never a word that changes
  with their gender. "No te preocupes", never "Tranquilo/Tranquila";
  "cuando te aburres", never "si estás aburrido/aburrida"; never
  "bienvenido" or "¿listo?".
- Never write language codes like [es] or [en-US]: the app adds them.
${ESPANOL_POR_NIVEL[nivel]}`;
}

export function construirInstruccion(
  alumno: Alumno,
  tema?: string,
  leccion?: Unidad,
  senales: SenalesEspanol = SIN_SENALES,
  /** El alumno escribió en vez de hablar: no hay audio que transcribir. */
  escrito = false
): string {
  const { nombre, nivel } = alumno;
  const primerNombre = nombre.split(" ")[0];
  const sinEs = NIVELES_SIN_ESPANOL.has(nivel);

  /**
   * El bloque de la lección: convierte la charla libre en una clase
   * con objetivo. La regla de oro: se enseña PREGUNTANDO cosas cuya
   * respuesta natural obliga a usar la estructura, nunca dictando
   * gramática que nadie pidió.
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
  (greet them by name first, unless that opener asks for their name).
- If they drift to another topic, follow them for a turn -- it is a
  conversation, not a script -- then bring it back with your next
  question.
- "objetivoUsado": set it to true ONLY if in THIS turn the student
  produced the target structure correctly in a sentence of their own --
  not a word-for-word repetition of yours. In every other case,
  including doubt, set false.
`
    : "";

  /**
   * El hábito de apoyarse en el español. Las cifras las calcula el
   * servidor (src/lib/habla.ts, senalesDeEspanol) y solo entran al
   * prompt cuando cambian algo: desde 3 veces.
   */
  const bloqueHabito =
    senales.pidioEspanol >= 3
      ? `
- They used or asked for Spanish in ${senales.pidioEspanol} of their last ${senales.turnos} turns.
  In case 9, add ONE short tip${sinEs ? "" : ' in "espanol"'} -- only if you have not given it in
  the messages above: listen again, use the slow speed and read the
  translation.`
      : "";

  return `You are Allison, a warm and encouraging English teacher.

YOUR STUDENT
Name: ${primerNombre}. Use their name naturally, the way a teacher who
knows them would -- not in every sentence, but enough that they feel
recognized. Never call them "student" or "user".
They are a Spanish speaker from Colombia at CEFR level ${nivel}.${
  alumno.temasAbiertos?.length
    ? `
Still getting wrong: ${alumno.temasAbiertos.join(", ")}. Steer the
conversation so these come up naturally, without announcing it.`
    : ""
}${
  alumno.temasDominados?.length
    ? `
Already mastered: ${alumno.temasDominados.join(", ")}. If one comes up
and they get it right, say so briefly -- people need to hear that they
improved.`
    : ""
}${
  alumno.temasRecorridos?.length
    ? `
Topics they have already studied: ${alumno.temasRecorridos.join("; ")}.
Only ask about these topics (or simpler things). Never quiz them on
grammar they have not reached yet.`
    : ""
}${tema ? `\nToday's topic: ${tema}.` : ""}

${COMPORTAMIENTO[nivel]}

${bloquePersonaje(nivel)}
${bloqueLeccion}
HOW YOU TEACH
- The conversation never stops for a grammar lesson. You correct in
  passing and keep talking.
- In "respuesta", never repeat their wrong form: say only the right
  one. Wrong: "You TAKE your desk." Right: "You tidied your desk!"${
    sinEs
      ? `
  (Case 3 may name their word only to explain what it means.)`
      : `
  ("espanol" may name their word only to explain it, as in case 3.)`
  }
- Say each thing once: never the same sentence twice, never your
  question twice.
- Never mock a mistake. Warm tone, always.
${
  NIVELES_UNA_CORRECCION.has(nivel)
    ? `- At this level: in cases 2, 3 and 4, ONE item in "correcciones" (the
  mistake of that case), unless you are not sure of the right form. In
  every other case "correcciones" is [].`
    : `- Report every real mistake in "correcciones" (grammar,
  pronunciation, vocabulary, naturalness), but in "respuesta" recast
  only the most important one. In cases 6 and 9 "correcciones" is [].`
}

${bloqueCasos(nivel, leccion?.estructuraEn)}

ACCURACY OF CORRECTIONS — a wrong correction is worse than no
correction. The student trusts this list and will memorize it.
- NEVER invent a correction to make the list longer. An empty
  "correcciones" array is a perfectly good answer when the student
  spoke correctly.
- Every "correccion" must be genuinely correct English, and every
  "explicacion" must state the real rule. Age uses TO BE: "I am 25
  years old" — never "I have".
- Your corrections must AGREE with "respuesta". If you say "You are
  twenty-five", you cannot tell them to use "to have".
- NEVER change the meaning of what the student said. Fix the form, keep
  the message. If they said something negative it stays negative:
  "I no have money" becomes "I don't have money", NEVER "I have money".
  Deleting a word to make the sentence grammatical is not a correction,
  it is putting words in their mouth.
- NEVER change the time of their sentence. If they talk about now or
  about what always happens, it stays present: "she cry with movies"
  becomes "she cries with movies", NEVER "she cried".
- If you are not certain what the student said or what the right form
  is, leave it out. Silence beats a wrong rule.
- This is SPEECH, not writing. Never correct spelling, numerals,
  capitalization or punctuation. "25" and "twenty-five" are the same
  spoken words — that is not a mistake.
- Correct only what the student actually got wrong, never their style
  choices. Standard SPOKEN English is correct English: "taller than
  me", "it's me", contractions, ending with a preposition. Never "fix"
  them into formal forms -- that teaches the student to sound stiff.

WHEN THE STUDENT SPEAKS SPANISH
Beginners sometimes ask you things in Spanish. That is allowed, and it
is often the most valuable moment of the class.
- When they mention English words inside a Spanish sentence ("el was",
  "el did"), they are NAMING vocabulary, not making a mistake. A turn
  spoken in Spanish gets an EMPTY "correcciones" array.
- If they asked a question, ANSWER IT for real (cases 7, 8 and 10).${bloqueHabito}

${bloqueIdiomas(nivel)}

WHAT YOU RETURN, in this order
${
  escrito
    ? `- "transcripcion": this turn was TYPED, not spoken (their microphone may
  not work): copy their text exactly as written. There is no audio, so
  case 4 cannot happen and there are no pronunciation corrections.`
    : `- "transcripcion": what the student ACTUALLY said IN THIS TURN'S AUDIO,
  word for word, in the language they used, errors included. Never fix
  or translate it. It comes ONLY from the attached audio: NEVER copy,
  repeat or reconstruct it from earlier messages -- guessing from
  history invents a turn the student never said. If there is no speech
  at all, "transcripcion" is "".`
}
- "caso": the number of the case, decided with THE CASES.
- "espanol": ${sinEs ? 'always "".' : 'the Spanish part of that case, or "". Only Spanish.'}
- "respuesta": the English part. Only English.
- "correcciones": the mistakes you heard, following the rules above.
  Each one carries the rule twice: "explicacion" in simple English and
  "explicacionEs", the same rule in Spanish ("Use 'to be' for age" /
  "Para la edad se usa 'to be', no 'to have'").`;
}

const ESQUEMA_RESPUESTA = {
  type: Type.OBJECT,
  properties: {
    transcripcion: {
      type: Type.STRING,
      description: "Literal transcript, errors preserved exactly as spoken",
    },
    caso: {
      type: Type.STRING,
      enum: CASOS,
      description: "Which of the eleven cases this turn is, checked in the order of the instructions",
    },
    espanol: {
      type: Type.STRING,
      description:
        'Spanish only, or "". No language codes.',
    },
    respuesta: {
      type: Type.STRING,
      description:
        "The English part of your reply. English only, no Spanish, no language codes. In cases 1, 2, 4, 5 and 11 it ends with an OPEN question (What, Where, Who, How...), never a yes/no question.",
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
  required: ["transcripcion", "caso", "espanol", "respuesta", "correcciones"],
  // El orden importa: la decisión y el español se escriben ANTES que la
  // respuesta, y la respuesta antes que las correcciones, para que la
  // voz pueda empezar en cuanto "respuesta" cierra.
  propertyOrdering: ["transcripcion", "caso", "espanol", "respuesta", "correcciones", "objetivoUsado"],
};

export interface RespuestaAllison {
  transcripcion: string;
  /** Lo que se MUESTRA: sin marcadores de idioma. */
  respuesta: string;
  /** Lo que se DICE: con los marcadores [es] / [en-US] para la voz.
   *  Idéntico a `respuesta` cuando no hubo español. */
  respuestaVoz: string;
  correcciones: Correccion[];
  /** Cuál de los once casos del plan decidió el modelo. */
  caso?: string;
  /** Solo en modo lección: el alumno usó bien la estructura objetivo. */
  objetivoUsado: boolean;
  tokensEntrada: number;
  tokensSalida: number;
  /**
   * El modelo no terminó: su JSON llegó cortado y no se pudo rescatar.
   * No es silencio (que se cobra): la ruta devuelve la intervención
   * (auditoría, 30 de octubre de 2026).
   */
  fallaIA?: boolean;
}

/**
 * ¿El alumno está diciendo que no entendió o pidiendo que le repitan?
 * (caso 9 del plan). Entonces ese turno no lleva correcciones.
 */
export function esPedidoDeAyuda(transcripcion: string): boolean {
  return /\b(not|no|don'?t|didn'?t|can'?t)\s+(understand|get it)\b|\bno\s+(?:te\s+|le\s+)?(?:entiend|entend|comprend|escuch|capt)|m[aá]s\s+despacio|\brepeat\b|\brepet[ií]|\brepite\b|\bslower\b|\bagain\b|otra\s+vez|\bi'?m\s+lost\b|qu[eé]\s+dijiste|what did you say|what do you mean|\bpardon\b|^\W*(?:what|qu[eé]|c[oó]mo|huh|sorry)\W*$/i.test(
    transcripcion
  );
}

/**
 * ¿El turno entero es un pedido de ayuda? Para borrar sus correcciones
 * no basta con que aparezca "again" o "didn't understand": "Yesterday I
 * watch a movie but I didn't understand it" es una frase con un error
 * que sí se corrige. Tiene que ser corta.
 */
export function soloPideAyuda(transcripcion: string): boolean {
  const palabras = transcripcion.trim().split(/\s+/).filter(Boolean).length;
  // "again" solo ("I want to go to Cartagena again") no es pedir ayuda.
  const sinAgain = transcripcion.replace(/\bagain\b|otra\s+vez/gi, "");
  return palabras <= 8 && esPedidoDeAyuda(sinAgain);
}

/**
 * Red de seguridad para los marcadores de idioma.
 *
 * A veces el modelo escribe una frase en español y olvida el [es]; la
 * voz en inglés la leería con fonética inglesa. Si la respuesta no trae
 * NINGÚN marcador, cada oración que idiomaDe reconoce como español
 * (regla conservadora: ante la duda, inglés) se envuelve en [es] ...
 * [en-US]. Si el modelo puso marcadores, se respetan tal cual.
 */
export function marcarEspanolSuelto(texto: string): string {
  if (tieneMarcadores(texto)) return texto;
  const oraciones = texto.match(/[^.!?]+[.!?]+["')]?|[^.!?]+$/g) ?? [];
  if (!oraciones.some((o) => idiomaDe(o) === "es")) return texto;
  return normalizarMarcadores(
    oraciones
      .map((o) => (idiomaDe(o) === "es" ? `${MARCADOR_ES} ${o.trim()} ${MARCADOR_EN}` : o.trim()))
      .join(" ")
  );
}

/**
 * ¿Lo que dijo el alumno contiene un error que ya cometió dos veces o
 * más? (caso 5 del plan). La base guarda el "original" de la corrección
 * en minúsculas ("playet"); se busca como palabra o frase completa
 * dentro de la transcripción, sin mayúsculas ni puntuación. Se decide
 * con la transcripción y no con las correcciones porque éstas llegan
 * DESPUÉS de la respuesta, y la voz arranca antes.
 */
export function contieneErrorRepetido(transcripcion: string, repetidos: string[]): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z']+/g, " ").trim();
  const dicho = ` ${norm(transcripcion)} `;
  // Menos de 3 letras ("a", "in") aparece en cualquier frase: no cuenta.
  return repetidos.map(norm).some((r) => r.length >= 3 && dicho.includes(` ${r} `));
}

/**
 * El último mensaje de Allison, citado aparte para el caso 9.
 *
 * Con solo el historial, flash-lite leía "I not understand what is the
 * structure" como una pregunta sobre "I don't understand" y enseñaba
 * eso. Citado y con nombre propio, sabe QUÉ tiene que volver a explicar.
 */
export function bloqueMensajeAnterior(historial: Mensaje[]): string {
  const ultimo = [...historial].reverse().find((m) => m.rol === "allison");
  if (!ultimo?.texto.trim()) return "";
  // Las dos partes por separado: el historial ya le muestra al modelo
  // solo el inglés, y una línea con los dos idiomas pegados era lo
  // último que leía antes de responder.
  const { espanol, ingles } = separarIdiomas(ultimo.textoVoz ?? ultimo.texto);
  return `

YOUR PREVIOUS MESSAGE (what they did not understand, if this turn is case 9):${
    espanol ? `\n- the Spanish part: "${espanol}"` : ""
  }
- the English part: "${ingles || ultimo.texto.trim()}"`;
}

/**
 * Lo que va junto a cada turno del alumno (ver conversarEnStream): a
 * flash-lite le pesa más lo que está junto a la entrada que lo que está
 * lejos en el prompt.
 */
function recordatorioTurno(nivel: Nivel): string {
  const idiomas = NIVELES_SIN_ESPANOL.has(nivel)
    ? '"espanol" is "" and "respuesta" is only English.'
    : '"espanol" is only Spanish and "respuesta" is only English.';
  return `[Not the student's words. Decide the case first. A false friend (sensible, embarrassed, sympathetic, boring, carpet, exit, constipated, assist, library) used with its Spanish meaning is case 3. ${idiomas} In cases 1, 2, 4 and 11, end with an OPEN question, never a yes/no one. If they did not understand (case 9), explain your previous message again, shorter -- never teach them how to say "I don't understand".]`;
}

/** Palabras que no dicen de qué trata un mensaje. */
const VACIAS = new Set([
  "what", "with", "that", "this", "your", "have", "there", "they", "them",
  "then", "when", "where", "from", "just", "very", "does", "don't", "it's",
  "i'm", "you're", "let's", "say", "saying", "try", "now", "okay", "sorry",
  "good", "great", "step", "steps", "about", "tell", "more", "some", "like",
  "today", "yesterday", "tomorrow", "past", "present",
  "you", "did", "the", "and", "are", "was", "for", "but", "not", "can", "how",
  "why", "who", "yes", "she", "him", "her", "his", "its", "our", "too", "use",
  "add",
]);

/**
 * Caso 9: ¿la respuesta falló? Falla si:
 *   · enseñó la frase de pedir ayuda ("I don't understand"), preguntó
 *     "¿entendiste?" o respondió como si no hubiera oído (eso es el 6).
 *     Un "para que entiendas" dentro de la explicación es normal;
 *   · no vuelve sobre el mensaje anterior: si ese mensaje citaba una
 *     palabra ('was'), la nueva explicación tiene que nombrarla; si no
 *     citaba ninguna, tiene que compartir al menos una palabra de
 *     contenido. Así se atrapa el error que más repetía flash-lite:
 *     copiar el tema del ejemplo ("se agrega 'ed'") en vez del suyo.
 * "Do you understand now?" también es preguntar si entendió: con "No te
 * preocupes, te explico otra vez." no explicaba nada (tanda 1, 29 de
 * octubre de 2026).
 */
export function casoNueveFallido(texto: string, anterior?: string): boolean {
  if (/(?:n'?t|not) understand|understood|(?:did|do) you understand|do you get it|entendiste|entiendes ahora|didn't hear|no te o[ií]|(?:could|can) you repeat|say (?:that|it) again/i.test(texto)) return true;
  if (!anterior) return false;
  const dicho = texto.toLowerCase();
  const nombra = (p: string) => new RegExp(`(^|[^a-z])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(dicho);
  const citadas = [...anterior.matchAll(/(?:^|[\s(¿¡])['‘"“]([^'’"”]+)['’"”]/g)].map((m) => m[1].toLowerCase().trim());
  const contenido = (anterior.toLowerCase().match(/[a-z']{3,}/g) ?? []).filter((p) => !VACIAS.has(p));
  // Si el mensaje anterior explicaba algo, lo citado es el tema. Si
  // terminaba en una pregunta de conversación ("Yes, 'I cleaned',
  // perfect! What did you eat today?"), lo citado era un elogio: basta
  // con volver sobre cualquier palabra suya.
  if (citadas.length > 0 && !anterior.trim().endsWith("?")) return !citadas.some(nombra);
  const todas = [...citadas, ...contenido];
  if (todas.length === 0) return false;
  return !todas.some(nombra);
}

/**
 * El español, como máximo en `maximo` oraciones: el prompt pide dos
 * (tres en el caso 8) y flash-lite a veces agrega una tercera que solo
 * repite la idea. Una muletilla inicial corta ("Claro.", "Tranquilo,
 * Diego.") no cuenta.
 */
export function recortarOraciones(texto: string, maximo: number): string {
  const oraciones = texto.match(/[^.!?]+[.!?]+["')]?|[^.!?]+$/g)?.map((s) => s.trim()) ?? [];
  const muletilla = oraciones.length > 0 && oraciones[0].split(/\s+/).length <= 3 ? 1 : 0;
  if (oraciones.length <= maximo + muletilla) return texto.trim();
  return oraciones.slice(0, maximo + muletilla).join(" ");
}

/**
 * El caso que de verdad se aplica. El código corrige al modelo en dos
 * situaciones que flash-lite clasificaba mal:
 *   · el error ya se repitió dos veces -> 5, diga el modelo lo que diga;
 *   · su propia respuesta dice que no entendió o pide repetir -> 6 (salvo
 *     en el 9, donde el que no entendió es el alumno).
 */
export function casoEfectivo(caso: string | undefined, respuesta: string, repetido: boolean): string {
  if (repetido) return "5";
  const c = String(caso ?? "").replace(/\D/g, "");
  // Solo en primera persona: "Could you repeat it?" dentro del caso 4
  // ("say it with me") o "you didn't understand the movie?" no son ella
  // diciendo que no oyó. En los casos que responden un pedido (4, 7, 8,
  // 9, 10) nunca aplica.
  // "Say it again: I missed the bus." (caso 3) o un "…Can you say it again?"
  // dentro de una corrección no son ella pidiendo que repita: solo la
  // pregunta entera, sin el "Say it:" de una corrección (auditoría).
  const noEntendio =
    /\bI didn'?t (?:understand|hear|catch)\b/i.test(respuesta) ||
    (/\b(?:can|could) you (?:please )?(?:repeat that|say (?:that|it) again)\b[^.!]*\?/i.test(respuesta) && !/\bSay it\b(?! again\?)/i.test(respuesta));
  if (!["3", "4", "7", "8", "9", "10"].includes(c) && noEntendio) return "6";
  // Un 5 sin error repetido no existe: el modelo lo confundía con
  // preguntas normales ("What is your Instagram?") y traducía al español.
  if (c === "5") return "11";
  return c;
}

/** Letras que en la pista de pronunciación pueden sonar igual. */
const SONIDO_INICIAL: Record<string, string> = {
  c: "k", k: "k", q: "k", h: "j", j: "j", w: "u", u: "u", y: "i", i: "i",
  v: "b", b: "b", z: "s", s: "s", t: "t", d: "t",
};
const sonido = (letra: string) => SONIDO_INICIAL[letra] ?? letra;

/**
 * Las consonantes que una pista escrita "a la española" puede usar para
 * una palabra inglesa. "th" admite t, d, s o z; "sh" y "ch" la ch; la
 * w admite la g de "guater"; la g, la y de "yiraf". Vocales, y, w y h
 * mudas no se juzgan.
 */
function consonantesPosibles(palabra: string): Set<string> {
  const p = palabra.toLowerCase();
  const posibles = new Set<string>();
  const agregar = (...letras: string[]) => letras.forEach((l) => posibles.add(l));
  if (p.includes("th")) agregar("t", "d", "s");
  if (/sh|ch|ti/.test(p)) agregar("S");
  if (p.includes("ch")) agregar("k"); // school, chemistry
  if (p.includes("ph")) agregar("f");
  if (p.includes("w")) agregar("g");
  if (p.includes("g")) agregar("y", "h");
  if (p.includes("j")) agregar("y");
  for (const l of p.replace(/th|sh|ch|ph/g, "")) {
    if ("cqk".includes(l)) agregar("k", "s");
    else if (l === "x") agregar("k", "s");
    else if (l === "z") agregar("s");
    else if (l === "v") agregar("b");
    else if (/[bdfghlmnprst]/.test(l)) agregar(l);
  }
  return posibles;
}

/** Las consonantes de la pista, leídas como las lee un hispanohablante. */
function consonantesDeLaPista(pista: string): string[] {
  return (
    pista
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ch|sh/g, "S")
      .replace(/ll/g, "y")
      .replace(/qu/g, "k")
      .replace(/j/g, "h")
      .replace(/z/g, "s")
      .replace(/c/g, "k")
      .replace(/v/g, "b")
      .match(/[bdfghklmnprstS]/g) ?? []
  );
}

/**
 * Caso 10: ¿la pista "Suena '...'" tiene sentido para la palabra que se
 * deletreó? flash-lite a veces escribe una pista inventada ("Suena
 * 'yuguei'" para "played", "'bern-fey-dey'" para "birthday"). Dos
 * pruebas: el primer sonido coincide (h de "house" y j de "jaus" valen
 * igual; una s inicial admite la e de "eschool"), y cada consonante de
 * la pista puede salir de la palabra. Si no hay deletreo o no hay pista
 * entre comillas, no se juzga.
 */
export function pistaDeSonidoCreible(espanol: string, respuesta: string): boolean {
  const letras = respuesta.match(/\b[A-Z](?:, [A-Z]){2,}\b/)?.[0];
  const pista = espanol.match(/['‘"“]([a-záéíóúñ][a-záéíóúñ -]*)['’"”]/i)?.[1]?.toLowerCase();
  if (!letras || !pista) return true;
  const palabra = letras.replace(/[^A-Z]/g, "").toLowerCase();
  const primera = palabra[0];
  const empiezaBien =
    sonido(primera) === sonido(pista[0]) ||
    // "know" -> 'nou' (k muda), "school" -> 'escul', "water" ->
    // 'guáter', "three" -> 'zri'.
    (primera === "k" && pista[0] === "n") ||
    (primera === "s" && pista[0] === "e") ||
    (primera === "w" && /[gu]/.test(pista[0])) ||
    (palabra.startsWith("th") && /[tdsz]/.test(pista[0]));
  const posibles = consonantesPosibles(palabra);
  return empiezaBien && consonantesDeLaPista(pista).every((c) => posibles.has(c));
}

/** Una pregunta de sí o no: empieza con un auxiliar. */
const SI_O_NO =
  /^(?:[a-z]+,\s*)?(?:do|does|did|is|are|was|were|can|could|have|has|will|would|don'?t|doesn'?t|didn'?t|isn'?t|aren'?t|won'?t|can'?t)\b[^?]*\?$/i;
/** Casos que cierran con una pregunta abierta. */
const CASOS_CON_PREGUNTA = new Set(["1", "2", "4", "5", "11"]);

/**
 * Si termina en una pregunta de sí o no, agrega "Tell me more!". La
 * regla pide una pregunta abierta para que el alumno hable más que
 * Allison; flash-lite cae en "Do you see them often?" unas 2 de cada 100
 * veces, y con la invitación el alumno igual queda llamado a contar.
 */
export function abrirPregunta(en: string, caso: string): string {
  if (!CASOS_CON_PREGUNTA.has(caso)) return en;
  const ultima = (quitarMarcadores(en).match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).pop()?.trim() ?? "";
  return SI_O_NO.test(ultima) ? `${en.trim()} Tell me more!` : en;
}

/**
 * ¿Le está preguntando a Allison si es real, una persona, un robot o una
 * IA? Entonces la respuesta es la aprobada en la ficha, sin excepción.
 */
export function preguntaSiEsReal(transcripcion: string): boolean {
  return /\bare you (?:a |an )?(?:real(?!\s+madrid)|human|person|robot|bot|ai|machine|artificial)\b|\breal person\b|\beres (?:una? )?(?:real|humana?|persona|robot|ia|m[aá]quina|inteligencia artificial)\b|\beres de verdad\b/i.test(
    transcripcion
  );
}

/** Casos en los que el alumno no dijo nada que corregir. */
const CASOS_SIN_CORRECCIONES = new Set(["6", "9"]);
/** En A1 y A2 solo se corrige en estos casos (el 1 se deja pasar). */
const CASOS_QUE_CORRIGEN = new Set(["2", "3", "4", "5"]);

/** Palabras que solo aparecen en una oración en inglés. */
const SOLO_INGLES = new Set([
  "the", "you", "your", "i", "it", "is", "are", "am", "be", "been", "to",
  "and", "of", "in", "on", "at", "for", "from", "with", "that", "this",
  "there", "here", "what", "how", "do", "does", "did", "have", "has", "was",
  "were", "not", "very", "good", "great", "nice", "let's", "we", "they",
  "he", "she", "my", "can", "will", "about", "like", "say", "try", "saying",
  "now", "it's", "i'm", "don't", "where", "who", "when", "why", "which",
  "yes", "please", "sorry", "today", "yesterday", "tell", "more", "an",
  "almost", "well", "done", "job", "perfect", "awesome", "exactly", "cool",
  "okay", "wow", "listen",
]);
/** Palabras que solo aparecen en una oración en español. */
const SOLO_ESPANOL = new Set([
  "el", "la", "los", "las", "un", "una", "de", "del", "que", "y", "es", "en",
  "no", "por", "para", "con", "como", "pero", "se", "te", "tu", "su", "mi",
  "muy", "bien", "hay", "cuando", "dice", "significa", "aquí", "así", "casi",
  "va", "ya", "suena", "escucha", "claro", "sigamos", "fue", "ayer", "hoy",
  "verbo", "pasado", "hablar", "decir", "tiene", "tienes", "tengo", "quiero",
  "puedes", "gracias", "hola", "porque", "otra", "otro", "vez", "algo",
  "eso", "esto", "esta", "este", "vamos", "paso", "sí", "más", "también",
  "qué", "cómo", "cuál", "dónde", "cuándo", "está", "estás", "genial",
  "perfecto", "excelente", "hecho", "exacto", "chévere", "buen", "buena",
]);

/** Una comilla abre solo al empezar una palabra: el apóstrofo de "I'm" no cuenta. */
const CITA = /(^|[\s(¿¡])['‘"“]([^'’"”]*)['’"”](?=[\s.,;:!?)]|$)/g;

/**
 * Lo que está entre comillas no cuenta para decidir el idioma de una
 * oración en "espanol": ahí el inglés aparece así, como la palabra que se
 * explica ("se dice 'played'").
 */
const sinCitas = (oracion: string) => oracion.replace(CITA, "$1 ");

/**
 * Los nombres propios con tilde ("Bogotá", "El Peñol") no dicen nada del
 * idioma: "No, not Bogotá." es inglés. Se quitan las palabras con
 * mayúscula que no abren la oración.
 */
const sinNombresPropios = (oracion: string) =>
  oracion.replace(/(?<=\S\s+)[A-ZÁÉÍÓÚÑ][\wáéíóúñü]*/g, " ");

const contar = (oracion: string) => {
  const palabras = oracion.toLowerCase().match(/[a-záéíóúñü']+/g) ?? [];
  return {
    en: palabras.filter((p) => SOLO_INGLES.has(p)).length,
    es: palabras.filter((p) => SOLO_ESPANOL.has(p)).length,
    // "no" está en las dos lenguas ("No problem!"): sola no decide nada.
    esFuerte: palabras.filter((p) => SOLO_ESPANOL.has(p) && p !== "no").length,
  };
};

/**
 * ¿Es inglés? Para una oración de "espanol": basta una palabra inglesa
 * y ninguna española ("Almost!", "Well done!"). Las citas no cuentan.
 */
export function esInglesClaro(oracion: string): boolean {
  const limpia = sinCitas(oracion);
  if (/[¿¡ñáéíóú]/i.test(sinNombresPropios(limpia))) return false;
  const { en, es } = contar(limpia);
  return es === 0 && en >= 1;
}

/**
 * ¿Es español? Para una oración de "respuesta": "¿Cómo estás?", "Bien
 * hecho!", "Perfecto, Juan!". Aquí las citas SÍ cuentan: "'Me acabo de
 * levantar' is 'I just woke up'" lleva español y la voz inglesa lo
 * leería mal. Ante la duda, no.
 */
export function esEspanolClaro(oracion: string): boolean {
  const sinNombres = sinNombresPropios(oracion);
  const { en, es, esFuerte } = contar(sinNombres);
  const cita = [...oracion.matchAll(CITA)].map((m) => m[2]).join(" ");
  const citaEnEspanol = /[¿¡ñáéíóú]/i.test(cita) || contar(cita).esFuerte >= 1;
  if (citaEnEspanol) return true;
  if (en >= 2) return false;
  if (/[¿¡]/.test(sinNombres)) return true;
  return es >= 2 || (esFuerte >= 1 && en === 0) || (es >= 1 && /[ñáéíóú]/i.test(sinNombres));
}

/**
 * ¿El alumno dijo una frase clara en español (tres palabras o más, nada en
 * inglés)? Entonces se oyó bien, aunque no fuera en inglés: no es "No te
 * oí" (caso 6).
 */
export function hablaEspanolClaro(transcripcion: string): boolean {
  // Con ¿ o ¡ bastan dos palabras ("¿Qué haces?").
  const minimo = /[¿¡]/.test(transcripcion) ? 2 : 3;
  if (transcripcion.trim().split(/\s+/).length < minimo) return false;
  const { espanol, ingles } = separarIdiomas(transcripcion);
  return !!espanol.trim() && !ingles.trim() && esEspanolClaro(transcripcion);
}

/** Las oraciones de un texto. */
const oracionesDe = (texto: string) =>
  texto.match(/[^.!?]+[.!?]+["')]?|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];

/**
 * Las partes de un texto para decidir el idioma: oraciones, y dentro de
 * ellas lo que va antes y después de ":" o ";" ("se dice así: You played
 * soccer" son dos idiomas en una oración).
 */
const partesDe = (texto: string) =>
  texto.match(/[^.!?:;]+[.!?:;]+["')]?|[^.!?:;]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];

/**
 * Separa un texto en su parte en español y su parte en inglés, con o
 * sin marcadores. Sirve para las dos direcciones: el español que el
 * modelo metió en "respuesta" y el inglés que metió en "espanol", y
 * para dejarle al modelo solo el inglés de sus mensajes anteriores.
 * Cada parte se juzga sola: una inglesa dentro del tramo en español es
 * inglés, y una española fuera de él es español.
 */
export function separarIdiomas(texto: string): { espanol: string; ingles: string } {
  const espanol: string[] = [];
  const ingles: string[] = [];
  let enEspanol = false;
  for (const tramo of normalizarMarcadores(texto).split(/(\[es\]|\[en-US\])/)) {
    if (tramo === MARCADOR_ES) enEspanol = true;
    else if (tramo === MARCADOR_EN) enEspanol = false;
    else
      for (const o of partesDe(tramo)) {
        const esEs = enEspanol ? !esInglesClaro(o) : esEspanolClaro(o);
        (esEs ? espanol : ingles).push(o);
      }
  }
  return { espanol: espanol.join(" "), ingles: ingles.join(" ") };
}


/** Casos en los que "espanol" explica una regla y el inglés solo la usa. */
const CASOS_QUE_EXPLICAN = new Set(["2", "3", "8", "9"]);

/** Palabras con las que una oración habla DE la regla, no la usa. */
const HABLA_DE_LA_REGLA =
  /^use\b|\b(means?|rules?|tense|verbs?|plural|singular|the word|we use|we say|you say|we add|adds?|sounds? like|goes with|go with|(?:is|are) used for|(?:is|are) (?:with|for)|past of|(?:present|past) simple|simple (?:present|past))\b|\b(?:I|you|he|she|it|we|they),\s+(?:I|you|he|she|it|we|they)\b/i;

/**
 * Muletillas del español y su traducción al inglés: si el español ya la
 * dijo, la versión inglesa al principio de una oración sobra ("Casi.
 * Escucha cómo suena." + "Almost! Listen to how it sounds.").
 */
const MULETILLAS: [RegExp, RegExp][] = [
  [/no te preocupes/i, /^(don'?t worry|no problem|no worries|it'?s okay|it is okay|that'?s okay|sorry)\b/i],
  [/\bcasi\b/i, /^(almost|close)\b/i],
  [/\bclaro\b/i, /^(sure|of course)\b/i],
  [/\b(muy bien|bien hecho|excelente|perfecto)\b/i, /^(great|very good|well done|good job|excellent|perfect)\b/i],
  [/\bescucha\b/i, /^listen\b/i],
  [/\bsuena\b/i, /\bsounds? like\b/i],
];

/**
 * Quita del inglés lo que vuelve a decir lo que el español ya dijo: el
 * defecto que más se nota, porque el alumno oye la misma idea dos veces
 * con dos voces distintas. Sobra una oración en inglés que:
 *   · cita entre comillas una palabra que el español también citó ("For a
 *     bus, we say 'missed'" después de "se dice 'missed'");
 *   · en los casos que explican una regla (2, 3, 8, 9), habla DE la regla
 *     ("we add 'ed' to the end of the verb"). Los ejemplos ("I go, I
 *     went", "She is used to the cold") solo la usan y se quedan;
 *   · traduce una muletilla que el español ya dijo ("Almost!", "Don't
 *     worry", "It sounds like...").
 *
 * "Say it:", "Try saying:" y las preguntas nunca se quitan, y si quitar
 * dejara el inglés vacío, no se quita nada.
 */
export function sinRepetirElEspanol(en: string, es: string, caso = ""): string {
  if (!es.trim()) return en;
  const citadasEs = new Set([...es.matchAll(CITA)].map((m) => m[2].toLowerCase().trim()).filter(Boolean));
  const explica = CASOS_QUE_EXPLICAN.has(caso);
  const muletillas = MULETILLAS.filter(([enEspanol]) => enEspanol.test(es)).map(([, enIngles]) => enIngles);

  const quedan = oracionesDe(en).filter((o) => {
    if (/^(say it|try saying)/i.test(o) || o.endsWith("?")) return true;
    if (muletillas.some((m) => m.test(o))) return false;
    if ([...o.matchAll(CITA)].some((m) => citadasEs.has(m[2].toLowerCase().trim()))) return false;
    return !(explica && HABLA_DE_LA_REGLA.test(o));
  });
  return quedan.length ? quedan.join(" ") : en;
}

/**
 * El español de Allison sirve igual para un alumno que para una alumna.
 * "Tranquilo" era el desliz más común (el ejemplo viejo del caso 9).
 */
export function sinGenero(es: string): string {
  return es
    .replace(/\btranquil[oa]\b/gi, (m) => (m[0] === "T" ? "No te preocupes" : "no te preocupes"))
    .replace(/\bti mism[oa]\b/gi, "ti")
    .replace(/\b(?:te sientes|estás) aburrid[oa]\b/gi, "te aburres")
    .replace(/¿\s*list[oa]s?\s*\?/gi, "¿Vamos?")
    .replace(/\best[aá]s list[oa]\b/gi, "ya puedes")
    .replace(/\bbienvenid[oa]s?\b/gi, (m) => (m[0] === "B" ? "Te damos la bienvenida" : "te damos la bienvenida"));
}

const comparable = (s: string) => s.toLowerCase().replace(/[^a-záéíóúñ ]/g, "").trim();

/**
 * Junta "espanol" y "respuesta" en lo que Allison dice, con los
 * marcadores para la voz, y hace cumplir la forma de los casos que
 * tienen una forma fija. El modelo decide el caso y escribe el
 * contenido; el orden, el idioma de cada parte y las frases fijas los
 * pone el código, porque flash-lite se saltaba justamente eso (pruebas
 * en vivo, 16-oct-2026).
 *
 *   · cada parte en su idioma: una oración inglesa dentro de "espanol"
 *     pasa a "respuesta" y una española dentro de "respuesta" pasa a
 *     "espanol" (si no, la leería la voz equivocada);
 *   · 6: siempre "[es] No te oí bien. [en-US] Can you say it again?":
 *     cada idioma dice algo distinto (antes repetía "No te oí" y "I
 *     didn't hear you"). Si el alumno sí habló claro en español, no es
 *     que no se oyera: "Te entendí" y que lo intente en inglés;
 *   · 7: el español es siempre "Se dice así.";
 *   · 5 (error repetido): elogio fijo y solo la pregunta para seguir;
 *   · 1 y 11: sin español, salvo la frase aprobada "soy una profesora
 *     de inglés con inteligencia artificial";
 *   · 10, esa frase y las correcciones de B1: el español va antes de la
 *     última oración ("Played. P, L, A... [es] Suena 'pleid'. [en-US]
 *     Try..."). En los demás casos va primero.
 */
export function componerRespuesta(o: Parameters<typeof componerSinCierre>[0]): string {
  // El "Tell me more!" va al final de todo: en B1 el español de una
  // corrección queda antes de la última oración, y la invitación tiene
  // que seguir a la pregunta, no al español.
  return abrirPregunta(componerSinCierre(o), casoEfectivo(o.caso, o.respuesta ?? "", o.repetido ?? false));
}

function componerSinCierre(o: {
  caso?: string;
  espanol?: string;
  respuesta?: string;
  nivel: Nivel;
  nombre: string;
  repetido?: boolean;
  /** El mensaje anterior de Allison, solo en inglés (respaldo del caso 9). */
  anterior?: string;
  /** El alumno preguntó si Allison es real, humana o una IA. */
  preguntaIA?: boolean;
  /**
   * Lo que dijo el alumno es una frase clara en español: si el modelo
   * igual marcó 6 ("no se entiende"), Allison no dice "No te oí".
   */
  espanolClaro?: boolean;
}): string {
  const sinEs = NIVELES_SIN_ESPANOL.has(o.nivel);
  const caso = casoEfectivo(o.caso, o.respuesta ?? "", o.repetido ?? false);

  if (caso === "6") {
    // En producción, "¿qué más puedes hacer?" recibió "No te oí" dos veces
    // seguidas (octubre de 2026): se oyó, solo que en español.
    if (o.espanolClaro) {
      return sinEs ? "I understood you. Now try to say it in English!" : `${MARCADOR_ES} Te entendí. ${MARCADOR_EN} Now try to say it in English!`;
    }
    return sinEs ? "Sorry, I didn't hear you. Can you say it again?" : `${MARCADOR_ES} No te oí bien. ${MARCADOR_EN} Can you say it again?`;
  }

  // Cada parte en su idioma. Lo que el modelo puso en el campo
  // equivocado se mueve al otro, y solo se usa si ese otro vino vacío.
  const campoEs = separarIdiomas(`${MARCADOR_ES} ${quitarMarcadores(o.espanol ?? "")}`);
  const campoEn = separarIdiomas(o.respuesta ?? "");
  let es = campoEs.espanol || campoEn.espanol;
  let en = (campoEn.ingles || campoEs.ingles)
    // Deletreo con guiones ("B-I-R-T-H-D-A-Y"): la voz lo lee como una
    // palabra. Con comas dice letra por letra, como en el caso 10.
    .replace(/\b[A-Za-z](?:-[A-Za-z]){2,}\b/g, (m) => m.toUpperCase().split("-").join(", "));

  // Le preguntaron si es real: la respuesta aprobada, siempre. Con audio,
  // flash-lite contestó "Yes, I am!" -- Allison nunca dice que es una
  // persona. Se conserva solo la pregunta con la que el modelo seguía.
  if (o.preguntaIA) {
    // La pregunta con que seguía, salvo que sea el eco de la del alumno
    // ("Are you real?").
    const pregunta = en.match(/[^.!?]*\?/g)?.pop()?.trim();
    const sigue = pregunta && !preguntaSiEsReal(pregunta) ? ` ${pregunta}` : " What do you like to do?";
    en = `I'm an AI teacher. But I love talking with you!${sigue}`;
    es = FRASE_IA_ES;
  }

  // Caso 9: si igual enseñó "I don't understand" o no volvió sobre su
  // mensaje anterior, se cambia por una respuesta segura: calma, y ese
  // mensaje otra vez (el alumno lo puede oír también a velocidad lenta).
  if (caso === "9" && casoNueveFallido(`${es} ${en}`, o.anterior)) {
    const otraVez = o.anterior?.trim() || "Let's try again, step by step.";
    if (sinEs) return `No problem, step by step. ${otraVez}`;
    es = "No te preocupes, vamos paso a paso. Escúchalo otra vez.";
    en = otraVez;
  }

  if (o.repetido) {
    // Solo la pregunta para seguir: nada que vuelva a modelar el error
    // ("Say it: ..."). Sin pregunta, una abierta fija.
    const pregunta = en.match(/[^.!?]*\?/g)?.pop()?.trim() || "What else can you tell me?";
    if (sinEs) return `Good try, ${o.nombre}! ${pregunta}`;
    es = `¡Buen intento, ${o.nombre}! Ya se entiende, sigamos.`;
    en = pregunta;
  }

  if (caso === "7" && !sinEs) {
    es = "Se dice así.";
    // "You say: I just woke up." -> "I just woke up.": el "se dice así"
    // ya lo dijo el español.
    en = en.replace(/^you (?:can )?say(?: it)?(?: like this)?\s*:\s*/i, "");
    en = en.charAt(0).toUpperCase() + en.slice(1);
  }

  if (caso === "10" && !pistaDeSonidoCreible(es, en)) es = "Escúchalo con atención.";

  // Al decir que es una profesora con IA va la frase aprobada en
  // español, aunque el modelo la haya olvidado.
  const fraseIA = /\bI'?m an AI teacher\b/i.test(en) || comparable(es) === comparable(FRASE_IA_ES);
  if (fraseIA) es = FRASE_IA_ES;
  if ((caso === "1" || caso === "11") && !fraseIA) es = "";
  // Nunca una respuesta vacía (la ruta la cobraría): si el modelo solo
  // escribió en español en un caso sin español, se dice ese español con
  // su voz; si no hay nada, una invitación a seguir.
  if (!en.trim() && !es) {
    const espanolSuelto = campoEs.espanol || campoEn.espanol;
    return !sinEs && espanolSuelto ? `${MARCADOR_ES} ${sinGenero(espanolSuelto)}` : "Let's keep going! What else can you tell me?";
  }
  if (sinEs || !es) return en;
  es = sinGenero(recortarOraciones(es, caso === "8" || caso === "9" ? 3 : 2));
  // Caso 9: "I asked if you like pizza" solo traduce lo que el español ya
  // contó. Si no queda nada más, va la parte en inglés del mensaje
  // anterior, que es lo que el alumno tiene que volver a oír.
  if (caso === "9") {
    const sinNarrar = oracionesDe(en).filter(
      (s) => !/\bI (?:asked|said|told you|meant|was (?:asking|explaining|saying|talking)|will explain|'ll explain)\b|\blet me explain\b/i.test(s)
    );
    en = sinNarrar.length ? sinNarrar.join(" ") : o.anterior?.trim() || en;
  }
  en = sinRepetirElEspanol(en, es, caso);

  // La frase de IA va justo después de "I'm an AI teacher", como en la
  // ficha aprobada: "I'm an AI teacher. [es] Soy... [en-US] But I love...".
  if (fraseIA) {
    const oraciones = oracionesDe(en);
    const i = oraciones.findIndex((s) => /AI teacher/i.test(s));
    if (i >= 0 && i < oraciones.length - 1) {
      const antes = oraciones.slice(0, i + 1).join(" ");
      const despues = oraciones.slice(i + 1).join(" ");
      return `${antes} ${MARCADOR_ES} ${es} ${MARCADOR_EN} ${despues}`;
    }
  }

  // En B1 el español del caso 2 va después de la forma correcta ("You
  // watched a movie! [es] Como fue... [en-US] What movie...?"). En el 3
  // y el 4 va primero: la explicación antes de "Say it:" o de la palabra.
  const alFinal = fraseIA || caso === "10" || (o.nivel === "B1" && caso === "2");
  if (alFinal) {
    const oraciones = oracionesDe(en);
    if (oraciones.length > 1) {
      const ultima = oraciones.pop();
      return `${oraciones.join(" ")} ${MARCADOR_ES} ${es} ${MARCADOR_EN} ${ultima}`;
    }
  }
  return `${MARCADOR_ES} ${es} ${MARCADOR_EN} ${en}`;
}

/**
 * Las correcciones que el caso admite: ninguna cuando no entendió el
 * audio (6) o pidió ayuda (9), y en A1/A2 solo en los casos 2 a 5 --
 * el error pequeño del caso 1 no se corrige. Sin caso (respuesta
 * rescatada de un JSON cortado), no se filtra nada.
 */
export function correccionesDelCaso(correcciones: Correccion[], caso: string | undefined, nivel: Nivel): Correccion[] {
  if (!caso) return correcciones;
  if (CASOS_SIN_CORRECCIONES.has(caso)) return [];
  if (NIVELES_UNA_CORRECCION.has(nivel) && !CASOS_QUE_CORRIGEN.has(caso)) return [];
  return correcciones;
}

/**
 * En A1 y A2, una corrección por turno como máximo (plan, sección 2).
 * El prompt lo pide; el código lo garantiza, porque el modelo ya
 * incumplía reglas escritas. Queda la de mayor prioridad (a igual
 * prioridad, la primera que dio el modelo).
 */
export function limitarCorrecciones(correcciones: Correccion[], nivel: Nivel): Correccion[] {
  if (!NIVELES_UNA_CORRECCION.has(nivel)) return correcciones;
  const peso = (c: Correccion) => ({ alta: 0, media: 1, baja: 2 })[c.prioridad] ?? 3;
  return [...correcciones].sort((a, b) => peso(a) - peso(b)).slice(0, 1);
}

/**
 * La respuesta del modelo, pulida antes de que suene o se guarde: sin
 * frases repetidas, con un solo tramo en español (ninguno en los
 * niveles altos) y con los marcadores bien escritos. El prompt lo pide;
 * esto lo garantiza aunque el modelo se distraiga.
 */
export function pulirRespuesta(respuesta: string, nivel: Nivel): string {
  // Sin marcarEspanolSuelto: el idioma de cada parte ya lo decidió
  // componerRespuesta, con detectores que ignoran las citas y los
  // nombres propios. El de habla.ts marcaba como español "In English,
  // 'mañana' is 'tomorrow'" por la ñ de la cita.
  const base = sinRepeticiones(normalizarMarcadores(respuesta));
  return NIVELES_SIN_ESPANOL.has(nivel) ? sinEspanol(base) : limitarEspanol(base, 1);
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

  // Sus propias respuestas van al modelo SOLO con la parte en inglés,
  // que es lo que escribe en "respuesta". Verlas con el español pegado
  // lo invitaba a mezclar los dos idiomas en "respuesta". Lo que explicó
  // en español en su último mensaje lo ve igual, completo, en
  // bloqueMensajeAnterior (lo necesita para el caso 9).
  const contexto = historial.slice(-12).map((m) => ({
    role: m.rol === "alumno" ? "user" : "model",
    parts: [{ text: m.rol === "allison" ? separarIdiomas(m.textoVoz ?? m.texto).ingles || m.texto : m.texto }],
  }));

  const ultimoDeAllison = [...historial].reverse().find((m) => m.rol === "allison");
  const anteriorEnIngles = ultimoDeAllison
    ? quitarMarcadores(sinEspanol(ultimoDeAllison.textoVoz ?? ultimoDeAllison.texto))
    : undefined;

  /** El caso que de verdad se aplicó (el 5 lo puede poner el código). */
  let casoAplicado: string | undefined;
  /** Lo que Allison dice, armado con los campos ya cerrados del JSON. */
  const armar = (d: { transcripcion?: string; caso?: string; espanol?: string; respuesta?: string }) => {
    // "6", 6, "6." o "caso 6": el modelo no siempre respeta el formato.
    const leido = String(d.caso ?? "").replace(/\D/g, "") || undefined;
    // Un turno escrito no tiene pronunciación: el caso 4 no puede ser. Y
    // el 9 exige que el alumno haya pedido ayuda: flash-lite llegó a
    // marcar "I have two brother" como 9.
    const caso =
      (texto && leido === "4") ||
      (leido === "9" && !esPedidoDeAyuda(d.transcripcion ?? ""))
        ? "11"
        : leido;
    // Caso 5 lo decide el código: el modelo ya no ve la lista de errores
    // repetidos (la confundía con preguntas normales). Si vio un error
    // (casos 1 a 4) y es uno de la lista, es el 5. Si dijo que estaba
    // bien (11), no: un error guardado puede ser una palabra válida
    // ("play"), y "I play soccer every day" no lleva "¡buen intento!".
    // En los casos 6 a 10 el alumno no dijo una frase suya: pidió algo.
    const repetido =
      ["1", "2", "3", "4", "5"].includes(caso ?? "") &&
      contieneErrorRepetido(d.transcripcion ?? "", alumno.erroresRepetidos ?? []);
    casoAplicado = casoEfectivo(caso, d.respuesta ?? "", repetido) || undefined;
    return pulirRespuesta(
      componerRespuesta({
        caso,
        espanol: d.espanol,
        respuesta: d.respuesta,
        nivel: alumno.nivel,
        nombre: alumno.nombre.split(" ")[0],
        repetido,
        anterior: anteriorEnIngles,
        preguntaIA: preguntaSiEsReal(d.transcripcion ?? ""),
        espanolClaro: hablaEspanolClaro(d.transcripcion ?? ""),
      }),
      alumno.nivel
    );
  };

  const stream = await ai.models.generateContentStream({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [
      ...contexto,
      {
        role: "user",
        // El recordatorio va pegado al turno, ANTES de lo que dijo el
        // alumno: a flash-lite le pesa más lo que está junto a la entrada
        // que lo que está lejos en el prompt. Antes y no después, para
        // que nunca termine copiado en la transcripción.
        parts: texto
          ? [{ text: recordatorioTurno(alumno.nivel) }, { text: texto }]
          : [
              { text: recordatorioTurno(alumno.nivel) },
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
        construirInstruccion(alumno, tema, leccion, senales, Boolean(texto)) + bloqueMensajeAnterior(historial),
      responseMimeType: "application/json",
      responseSchema: ESQUEMA_RESPUESTA,
      temperature: temperatura,
      // Sin tope, un bucle del modelo llegó a 200KB en una prueba real.
      // Un turno legítimo — transcripción + respuesta + correcciones —
      // cabe de sobra en mil tokens.
      maxOutputTokens: 1024,
      // Una llamada que se queda colgada deja al alumno esperando con su
      // intervención gastada: se corta y la ruta la devuelve.
      abortSignal: AbortSignal.timeout(30_000),
    },
  });

  // Las marcas de tiempo ("00:01") y el eco duplicado no son nada que el
  // alumno haya dicho (src/lib/transcripcion.ts).
  const sinArtefactos = limpiarTranscripcion;

  let acumulado = "";
  const entregada = { transcripcion: false, respuesta: false };
  /** Lo que ya sonó: la versión final debe ser exactamente ésta. */
  let vozEntregada: string | null = null;
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

  /**
   * Un turno ESCRITO no se transcribe: lo que el alumno tecleó es la
   * transcripción, letra por letra. Pedírsela al modelo solo agrega una
   * forma de fallar -- en una prueba real la devolvió vacía, y la ruta lo
   * tomó por un audio sin voz ("No te escuchamos").
   */
  const escrito = texto?.trim() || undefined;
  /**
   * Un audio que, limpio, no dice nada ("00:00 00:01"): Allison no
   * responde (antes la respuesta sonaba y después salía "No te
   * escuchamos"). La ruta lo trata como audio sin voz.
   */
  let sinVoz = false;

  for await (const trozo of stream) {
    acumulado += trozo.text ?? "";
    if (trozo.usageMetadata) uso = trozo.usageMetadata;

    if (!entregada.transcripcion) {
      const t = campoCompleto(acumulado, "transcripcion");
      if (t !== null) {
        entregada.transcripcion = true;
        sinVoz = !escrito && !sinArtefactos(t);
        yield { tipo: "transcripcion", texto: escrito ?? quitarMarcadores(sinArtefactos(t)) };
      }
    }

    if (entregada.transcripcion && !entregada.respuesta && !sinVoz) {
      const r = campoCompleto(acumulado, "respuesta");
      // Se espera también a "caso" y "espanol": sin ellos no se puede
      // armar lo que Allison dice. Casi siempre ya cerraron (van antes en
      // el esquema), pero el modelo no siempre respeta el orden; si
      // llegan al final, la respuesta se arma con el JSON completo.
      const listos =
        campoCompleto(acumulado, "caso") !== null && campoCompleto(acumulado, "espanol") !== null;
      if (r !== null && listos) {
        entregada.respuesta = true;
        // La misma respuesta, dos veces: limpia para leerla y con los
        // marcadores para decirla. Armada antes, para que lo que suena
        // sea exactamente lo que después se guarda. "caso" y "espanol"
        // van antes que "respuesta" en el esquema: ya cerraron.
        const voz = armar({
          transcripcion: escrito ?? sinArtefactos(campoCompleto(acumulado, "transcripcion") ?? ""),
          caso: campoCompleto(acumulado, "caso") ?? undefined,
          espanol: campoCompleto(acumulado, "espanol") ?? undefined,
          respuesta: r,
        });
        vozEntregada = voz;
        yield { tipo: "respuesta", texto: quitarMarcadores(voz), voz };
      }
    }
  }

  let datos: {
    transcripcion?: string;
    caso?: string;
    espanol?: string;
    respuesta?: string;
    correcciones?: Correccion[];
    objetivoUsado?: boolean;
  };
  // El JSON llegó cortado y sin lo esencial: falla de la IA, no silencio.
  let fallaIA = false;
  try {
    datos = JSON.parse(acumulado || "{}");
  } catch {
    // El JSON llegó cortado (tope de tokens o desborde del modelo). Se
    // rescatan los campos que alcanzaron a cerrar; si falta alguno de
    // los dos esenciales, el turno se anula entero y la ruta devuelve el
    // crédito (fallaIA). Si lo que cerró fue una transcripción vacía, sí
    // fue silencio.
    const t = escrito ?? campoCompleto(acumulado, "transcripcion") ?? "";
    const r = campoCompleto(acumulado, "respuesta") ?? "";
    fallaIA = !(t && r) && !sinVoz;
    datos =
      t && r
        ? {
            transcripcion: t,
            caso: campoCompleto(acumulado, "caso") ?? undefined,
            espanol: campoCompleto(acumulado, "espanol") ?? undefined,
            respuesta: r,
            correcciones: [],
          }
        : { transcripcion: "", respuesta: "", correcciones: [] };
  }

  // La respuesta, dos veces: con marcadores para la voz y limpia para
  // la pantalla. Si ya sonó, es esa misma. Si no alcanzó a salir durante
  // el stream (el modelo cambió el orden de los campos), se arma ahora y
  // se entrega antes del final, para que el cliente la reciba igual.
  // Va ANTES del filtro de correcciones: arma() fija el caso aplicado.
  const respuestaVoz =
    vozEntregada ?? armar({ ...datos, transcripcion: escrito ?? sinArtefactos(datos.transcripcion ?? "") });
  if (!entregada.respuesta && respuestaVoz && !sinVoz) {
    entregada.respuesta = true;
    yield { tipo: "respuesta", texto: quitarMarcadores(respuestaVoz), voz: respuestaVoz };
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
    // "¿" o "¡" bastan; una tilde sola no: "Yesterday I go to Bogotá"
    // es inglés con un nombre propio, y sus errores sí se corrigen.
    if (/[¿¡]/.test(t)) return true;
    const senales = new Set([
      "como", "cómo", "cual", "cuál", "que", "qué", "quiero", "dice", "entre", "para",
      "una", "esto", "eso", "significa", "diferencia", "gracias",
      "hola", "decir", "ingles", "inglés", "espanol", "español", "ayuda", "puedo",
      "el", "la", "los", "las", "de", "del", "y", "es", "con", "se", "por",
    ]);
    let n = 0;
    for (const palabra of t.toLowerCase().split(/[^a-záéíóúñü]+/i)) {
      if (senales.has(palabra)) n++;
    }
    return n >= 2;
  };

  const normalizar = (t: string) =>
    t.trim().toLowerCase().replace(/[.,;:!?¡¿"'‘’]/g, "").replace(/\s+/g, " ");

  const transcripcionLimpia = escrito ?? quitarMarcadores(sinArtefactos(datos.transcripcion ?? ""));
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
  }).map((c): Correccion =>
    // Las dos explicaciones con el idioma cambiado: la pantalla mostraría
    // el español donde va el inglés. Se intercambian.
    c.explicacionEs && idiomaDe(c.explicacion) === "es" && esInglesClaro(c.explicacionEs)
      ? { ...c, explicacion: c.explicacionEs, explicacionEs: c.explicacion }
      : c
  );

  const enEspanol = esTurnoEnEspanol(transcripcionLimpia);

  // Caso 9 del plan: cuando el alumno pide ayuda ("I not understand"),
  // no se le corrige cómo la pidió. El prompt lo dice; esto lo asegura,
  // aunque el modelo se haya equivocado de caso. Luego, lo que el caso
  // admite (correccionesDelCaso) y el tope de una en A1/A2.
  const permitidas = soloPideAyuda(transcripcionLimpia)
    ? []
    : limitarCorrecciones(correccionesDelCaso(correcciones, casoAplicado ?? datos.caso, alumno.nivel), alumno.nivel);

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

  yield {
    tipo: "fin",
    resultado: {
      transcripcion: transcripcionLimpia,
      respuesta: quitarMarcadores(respuestaVoz),
      respuestaVoz,
      correcciones: enEspanol ? [] : permitidas,
      caso: casoAplicado,
      objetivoUsado,
      tokensEntrada: uso?.promptTokenCount ?? 0,
      tokensSalida: uso?.candidatesTokenCount ?? 0,
      ...(fallaIA ? { fallaIA } : {}),
    },
  };
}
