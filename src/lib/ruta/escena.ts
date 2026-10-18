import { GoogleGenAI, Type } from "@google/genai";
import { esEspanolClaro, separarIdiomas } from "../allison.ts";
import { MARCADOR_EN, MARCADOR_ES, quitarMarcadores } from "../habla.ts";
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
 * B1: junto a cada tarea, lo que dice el alumno para cumplirla en el
 * diálogo de ejemplo aprobado. Con el imprevisto en juego, el modelo no
 * puede dar una tarea por cumplida antes de tiempo (en la prueba, contaba
 * "pide lo que necesitas" cuando el alumno apenas explicaba el problema).
 */
function conEjemplo(e: Escenario, tarea: number): string {
  if (!e.imprevisto) return "";
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
2. Lead the student to the next pending task with one simple question,
   like the examples. Never do a pending task for them: if a task is to
   ask for something (the price, the time, the way), do not say it until
   they ask.
   The scene lasts at least ${t.minimo} student turns. Between tasks, ask
   extra simple questions that fit the situation and your role, so the
   scene does not end too soon. Do not say goodbye before turn ${t.minimo}:
   if the student says goodbye earlier, answer kindly and ask one more
   question.
3. NEVER correct the student and never explain grammar in the scene. If
   you understand them, the scene goes on.
4. If their message does not do the task you asked about, stay in your
   role and ask again, simpler.${otraVez ? ` Example: ${otraVez.ejemplo}` : ""}
5. If the student speaks Spanish ("espanol": true): no task counts. In
   "respuesta" write only what they just said, in simple correct
   English, and then "Try it!". "Soy de Colombia" -> "I'm from Colombia.
   Try it!"${t.nivel !== "A1" && t.nivel !== "A2" ? ` (Level ${t.nivel}: never write Spanish; the app adds "Sorry, in English, please!".)` : ""}
6. You are an AI teacher: never say you are a person.
${t.extra ? `\n${t.extra.trim()}\n` : ""}
THE JSON
- "transcripcion": exactly what the student said, in the language they
  used, with their mistakes. Never complete it or correct it. "" if you
  hear no voice.
- "espanol": true if the student's last message is in Spanish.
- "tareas": the numbers of the PENDING tasks that the student's last
  message does: in English, understandable, even with mistakes. [] if
  none. Count only what the student said, never what you said.${
    e.imprevisto
      ? `
  A task counts only if the message really does ALL of it, like its
  example (other words are fine). Talking about something near the task
  is not doing it.`
      : ""
  }
- "respuesta": your line in the scene. English only.
- "errorDijo" and "errorMejor": the most important grammar or word
  mistake in the student's last English message: their exact words and
  the same sentence said correctly. A wrong ANSWER is not a mistake.
  "" and "" if there is no mistake or they spoke Spanish.`;
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
  const pendientes = tareasVisibles(t.escenario, t.cumplidas)
    .filter((n) => !t.cumplidas.includes(n))
    .map((n) => `${n}. ${t.escenario.tareas[n - 1]}`)
    .join(" ");
  return `[${cuenta} Pending tasks: ${pendientes} Stay in your role, English only in respuesta, never correct, short.${sinDespedirse}${antesDeSorpresa}]`;
}

const ESQUEMA_ESCENARIO = {
  type: Type.OBJECT,
  properties: {
    transcripcion: { type: Type.STRING },
    espanol: { type: Type.BOOLEAN },
    tareas: { type: Type.ARRAY, items: { type: Type.INTEGER } },
    respuesta: { type: Type.STRING },
    errorDijo: { type: Type.STRING },
    errorMejor: { type: Type.STRING },
  },
  required: ["transcripcion", "espanol", "tareas", "respuesta", "errorDijo", "errorMejor"],
  propertyOrdering: ["transcripcion", "espanol", "tareas", "respuesta", "errorDijo", "errorMejor"],
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
 * Saludar y despedirse: las tareas que el código reconoce solo, como
 * respaldo del modelo (en la prueba, flash-lite dejó pasar un "Thank
 * you. Goodbye!" una de cada tres veces). Solo cuando la tarea es
 * únicamente eso ("Saluda.", "Despídete.", "Da las gracias y despídete.").
 */
export function tareasObvias(e: Escenario, dicho: string): number[] {
  const saludo = /\b(hi|hello|hey|good (morning|afternoon|evening))\b/i.test(dicho);
  const despedida = /\b(bye|goodbye|see you|good night|have a (nice|good) (day|night|evening))\b/i.test(dicho);
  return e.tareas
    .map((x, i) => ({ n: i + 1, x: x.trim().toLowerCase() }))
    .filter(({ x }) => (saludo && /^saluda\.?$/.test(x)) || (despedida && /^(da las gracias y )?despídete\.?$/.test(x)))
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

const palabras = (t: string) => t.toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean);

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
      maxOutputTokens: 400,
      abortSignal: AbortSignal.timeout(20_000),
    },
  });

  let d: { transcripcion?: string; espanol?: boolean; tareas?: number[]; respuesta?: string; errorDijo?: string; errorMejor?: string } = {};
  try {
    d = JSON.parse(r.text ?? "{}");
  } catch {
    d = {};
  }

  // Escrito, lo que el alumno escribió ES la transcripción.
  const transcripcion = (t.texto?.trim() || d.transcripcion || "").trim();
  const pendientes = new Set(tareasVisibles(t.escenario, t.cumplidas).filter((n) => !t.cumplidas.includes(n)));
  const espanol = transcripcion ? d.espanol === true || hablaEspanol(transcripcion) : false;
  const b1 = t.nivel !== "A1" && t.nivel !== "A2";

  let en = soloIngles(d.respuesta ?? "")
    // Deletreo con guiones ("M-I-A"): la voz lo lee como una palabra. Con
    // comas dice letra por letra, como en la conversación (allison.ts).
    .replace(/\b[A-Za-z](?:-[A-Za-z]){2,}\b/g, (m) => m.toUpperCase().split("-").join(", "));
  const delModelo = !!en;
  // El último turno cierra sin preguntar: si el modelo preguntó igual, se
  // quita la pregunta; si no queda nada, la despedida del contenido.
  if (t.ultimo) en = sinPreguntas(en) || despedidaDe(t.escenario);
  // El alumno habló y el modelo no dio una línea en inglés que sirva: es
  // falla de la IA (se devuelve), no un "repite" que se le cobra.
  if (!delModelo && transcripcion && !t.ultimo) {
    return {
      transcripcion,
      tareas: [],
      respuesta: "",
      respuestaVoz: "",
      error: null,
      sinRespuesta: true,
      tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
      tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
  if (!en && transcripcion) en = REPETIR;

  // En español no se cumple ninguna tarea: Allison da la frase en inglés.
  const tareas = espanol
    ? []
    : [...new Set([...(d.tareas ?? []), ...tareasObvias(t.escenario, transcripcion)].filter((n) => pendientes.has(n)))].sort(
        (a, b) => a - b
      );

  // El imprevisto (B1): al cumplir la tarea después de la cual pasa,
  // Allison lo trae con la línea aprobada del diálogo de ejemplo. Lo que
  // dijo el modelo queda como reacción corta, sin preguntas.
  const imp = t.escenario.imprevisto;
  const llegaSorpresa = !!imp && !t.ultimo && !espanol && tareas.includes(imp.despuesDeTarea);
  if (llegaSorpresa && imp) {
    const reaccion = sinPreguntas(en);
    en = reaccion && !imp.linea.toLowerCase().includes(reaccion.toLowerCase()) ? `${reaccion} ${imp.linea}` : imp.linea;
  }

  // Antes del mínimo, la línea de Allison termina con una pregunta: sin
  // ella el alumno no sabe qué decir y la escena se cae ("Sure, this way.
  // Here's the menu."). Si el modelo no la hizo, va la del ejemplo
  // aprobado para la tarea que sigue.
  if (!llegaSorpresa && !t.ultimo && !espanol && t.turno < t.minimo && transcripcion && !en.includes("?")) {
    const sigue = [...pendientes].find((n) => !tareas.includes(n));
    const pregunta = sigue ? preguntaDeLaTarea(t.escenario, sigue) : null;
    if (pregunta && !en.toLowerCase().includes(pregunta.toLowerCase())) en = `${en} ${pregunta}`;
  }
  // "En inglés se dice así:" solo antecede a la versión en inglés de lo
  // que el alumno dijo, dada por el modelo; nunca a la despedida de cierre.
  const conFrase = espanol && delModelo && !t.ultimo;
  // Desde B1 Allison no sale al español: lo pide en inglés (Contenido B1).
  const respuesta = conFrase ? (b1 ? `${EN_INGLES_B1} ${en}` : `${EN_INGLES} ${en}`) : en;
  const respuestaVoz = conFrase ? (b1 ? respuesta : `${MARCADOR_ES} ${EN_INGLES} ${MARCADOR_EN} ${en}`) : en;

  const dijo = (d.errorDijo ?? "").trim();
  const mejor = soloIngles(d.errorMejor ?? "");
  const error = !espanol && dijo && mejor && esCorreccionDe(dijo, mejor) ? { dijo, mejor } : null;

  return {
    transcripcion,
    tareas,
    respuesta,
    respuestaVoz,
    error,
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
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
