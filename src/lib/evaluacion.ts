import { GoogleGenAI, Type } from "@google/genai";
import type { Nivel } from "./tipos.ts";
import { palabrasDeFrase } from "./ruta/rayas.ts";
import { limpiarTranscripcion } from "./transcripcion.ts";
import { hablaEspanol, mezclaEspanol } from "./ruta/escena.ts";
import { esInglesClaro } from "./allison.ts";

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
 *     que decide el modelo -- con la pregunta, que no es la respuesta, y
 *     sobre lo ya transcrito a ciegas (en dos llamadas: en una sola,
 *     traducía lo dicho en español y lo daba por bueno).
 *   · ¿Qué es esto? con respuesta abierta ("Cualquier consejo con
 *     should"): si no es una frase de ejemplo, el modelo juzga lo
 *     transcrito con la regla aprobada.
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
  /**
   * ¿Qué es esto? con respuesta abierta: la regla aprobada de "También se
   * acepta" ("Cualquier consejo con should…"). Si no dijo una forma
   * aceptada, el modelo juzga lo transcrito con esta regla.
   */
  regla?: string;
  /** La situación en español de ¿Qué es esto?, para juzgar con la regla. */
  contexto?: string;
  /**
   * Dilo en inglés: lo que había que decir, en español. Si no dijo una de
   * las frases aprobadas, el modelo juzga si dijo lo mismo con otras
   * palabras ("exam" por "test", "What about" por "How about").
   */
  espanol?: string;
  /**
   * Repite desde A2 ("Pequeñas fallas en el resto de la frase"): solo
   * cuenta la palabra difícil; las demás se marcan pero no hacen fallar.
   */
  clave?: string;
  /**
   * Lo escrito: se llama una vez, antes de la primera llamada al modelo
   * (juzgar o revisar la gramática), y cobra la intervención. Si devuelve
   * false (sin saldo), no se llama al modelo. Lo que el código resuelve
   * solo (una frase aprobada) sigue gratis: todo lo que usa la IA cuesta,
   * porque los tokens se pagan (decisión del usuario, 29 de octubre de 2026).
   */
  antesDelModelo?: () => Promise<boolean>;
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
  /**
   * Describe desde A2: la frase nombra algo, pero con un error de
   * gramática; `mejor` es la misma frase bien dicha, para repetirla.
   */
  mejora?: { dijo: string; mejor: string };
  /** Lo escrito necesitaba al modelo y no había saldo: no se calificó. */
  sinSaldo?: boolean;
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

function esquemaTranscripcion() {
  // "hayVoz" va primero: decidir antes si hay alguien hablando evita que
  // el modelo invente una frase sobre un audio en silencio (lo hizo).
  const properties: Record<string, unknown> = {
    hayVoz: { type: Type.BOOLEAN, description: "Is there a human voice saying words in the recording?" },
    transcripcion: { type: Type.STRING, description: "Exactly what was heard, never corrected or completed. Empty if hayVoz is false." },
  };
  const required = ["hayVoz", "transcripcion"];
  return { type: Type.OBJECT, properties, required, propertyOrdering: Object.keys(properties) };
}

/**
 * El JSON que devolvió el modelo. Si llegó cortado (tope de salida),
 * vacío o bloqueado, es falla de la IA: se lanza un error y la ruta
 * devuelve la intervención. Antes quedaba "{}": un audio se tomaba por
 * silencio y un relato por cero frases, y se cobraban (auditoría,
 * octubre de 2026).
 */
function jsonDelModelo<T>(r: { text?: string; candidates?: { finishReason?: unknown }[] }): T {
  const fin = String(r.candidates?.[0]?.finishReason ?? "STOP");
  if (fin !== "STOP") throw new Error(`El modelo no terminó la respuesta (${fin})`);
  try {
    return JSON.parse(r.text ?? "") as T;
  } catch {
    throw new Error("El modelo devolvió un JSON incompleto");
  }
}

const NUMEROS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", thirteen: "13",
  fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18",
  nineteen: "19", twenty: "20",
  // "It's 9:30" llega en cifras: "thirty" también (antes "thirty" nunca
  // coincidía y Repite lo marcaba aunque se dijera bien).
  thirty: "30", forty: "40", fifty: "50", sixty: "60", seventy: "70", eighty: "80", ninety: "90",
};

/** Quién puede llevar "'s" de "is"/"has" (el resto es posesivo: "Allison's cat"). */
const SUJETOS_S = new Set([
  "he", "she", "it", "what", "that", "there", "here", "who", "where", "how", "when", "this",
  "name", "everyone", "everybody", "someone", "somebody", "nobody", "nothing", "everything",
]);
/** Lo que sigue a "'s"/"'d" cuando es "has"/"had": "He's been…", "She'd already left". */
const PIDE_HAS = new Set(["been", "got", "gotten", "gone", "done", "had", "already", "never", "just", "ever", "seen", "eaten", "left", "lost", "finished"]);
const PIDE_HAD = new Set([...PIDE_HAS, "better", "made", "taken", "given", "written", "found", "bought", "brought", "told", "said", "come", "become", "begun", "felt", "kept", "met", "known"]);

/**
 * Una palabra con su contracción abierta. La siguiente decide las que
 * tienen dos lecturas: "he's been" es "he has been" y "he's tired", "he
 * is tired"; "I'd like" es "I would like" y "she'd already left", "she
 * had already left". Abrir solo unas pocas (como antes) marcaba mal
 * respuestas correctas: "I have been studying…" no coincidía con "I've
 * been studying…" (auditoría, 28 de octubre de 2026).
 */
function abrirContraccion(p: string, siguiente = ""): string[] {
  if (p === "cannot" || p === "can't") return ["can", "not"];
  if (p === "won't") return ["will", "not"];
  if (p === "shan't") return ["shall", "not"];
  if (p === "let's") return ["let", "us"];
  const negada = /^([a-z]+)n't$/.exec(p);
  if (negada) return [negada[1], "not"];
  const m = /^([a-z]+)'(m|re|ve|ll|d|s)$/.exec(p);
  if (!m) return [p];
  const [, base, fin] = m;
  if (fin === "m") return [base, "am"];
  if (fin === "re") return [base, "are"];
  if (fin === "ve") return [base, "have"];
  if (fin === "ll") return [base, "will"];
  if (fin === "d") return [base, PIDE_HAD.has(siguiente) || /ed$/.test(siguiente) ? "had" : "would"];
  return SUJETOS_S.has(base) ? [base, PIDE_HAS.has(siguiente) ? "has" : "is"] : [p];
}

/** Las palabras de un texto, en minúsculas y sin tildes ni signos (con su apóstrofo). */
function palabrasCrudas(texto: string): string[] {
  return (
    texto
      .toLowerCase()
      // Sin tildes: "café" y "cafe" son la misma palabra (antes la tilde
      // se borraba con la letra y "café" quedaba "caf").
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[’‘`´]/g, "'")
      // "ten o'clock" nombra el reloj del dibujo: cuenta como "clock".
      .replace(/\bo'clock\b/g, "o clock")
      .replace(/[^a-z0-9' ]+/g, " ")
      .split(/\s+/)
      // Comillas simples alrededor de una palabra ('played'), no apóstrofos.
      .map((p) => p.replace(/^'+|'+$/g, ""))
      .filter(Boolean)
  );
}

/** En cifras, y "twenty five" como "25" (la transcripción escribe "25"). */
function enCifras(palabras: string[]): string[] {
  const salida: string[] = [];
  for (const p of palabras.map((x) => NUMEROS[x] ?? x)) {
    const antes = salida[salida.length - 1] ?? "";
    if (/^[2-9]0$/.test(antes) && /^[1-9]$/.test(p)) salida[salida.length - 1] = String(Number(antes) + Number(p));
    else salida.push(p);
  }
  // "oh" es cero solo entre números ("three one oh five"); suelto es
  // una exclamación ("Oh, nice!").
  return salida.map((p, i, todas) => (p === "oh" && (/^\d+$/.test(todas[i - 1] ?? "") || /^\d+$/.test(todas[i + 1] ?? "")) ? "0" : p));
}

/** Minúsculas, sin puntuación, con contracciones abiertas y números en cifras. */
export function normalizar(texto: string): string {
  const crudas = palabrasCrudas(texto);
  const abiertas = crudas.flatMap((p, i) => abrirContraccion(p, crudas[i + 1]));
  return ` ${enCifras(abiertas).join(" ")} `;
}

/** Una palabra de la frase, abierta como en la frase ("she'd" antes de "already" es "she had"). */
function palabraNormalizada(palabra: string, siguiente?: string): string[] {
  const [p = "", sig] = palabrasCrudas(`${palabra} ${siguiente ?? ""}`);
  return enCifras(palabrasCrudas(palabra).length > 1 ? palabrasDe(palabra) : abrirContraccion(p, sig));
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

const VOCAL = /[aeiou]/;

/**
 * ¿Es la misma palabra, oída con acento? En palabras de 6 letras o más
 * se tolera UNA letra de más o de menos ("mornin" por "morning", "please"
 * por "pleased": al oído casi no se distinguen) o una vocal por otra
 * ("Columbia"). Una consonante cambiada ya es otra palabra: "grandpa" no
 * es "grandma", "watches" no es "watched" (justo lo que se practica) ni
 * "fridge" es "bridge" (auditoría, 28 de octubre de 2026). En las cortas,
 * nada: "God" no es "Good", "might" no es "night".
 */
export function mismaPalabra(oida: string, esperada: string): boolean {
  if (oida === esperada) return true;
  if (Math.min(oida.length, esperada.length) < 6 || distancia(oida, esperada) > 1) return false;
  if (oida.length !== esperada.length) return true;
  const i = [...oida].findIndex((c, k) => c !== esperada[k]);
  return VOCAL.test(oida[i]) && VOCAL.test(esperada[i]);
}

const palabrasDe = (texto: string) => normalizar(texto).trim().split(" ").filter(Boolean);

/**
 * ¿Están las palabras de la forma, seguidas, en lo dicho? También juntas
 * o separadas: la transcripción escribe "stomach ache" por "stomachache"
 * y "ice cream" se oye igual que "icecream".
 */
function estaEn(d: string[], n: string[]): boolean {
  for (let i = 0; i + n.length <= d.length; i++) {
    if (n.every((w, k) => mismaPalabra(d[i + k], w))) return true;
  }
  const junta = n.join("");
  for (let i = 0; i < d.length; i++) {
    let pegado = "";
    for (let j = i; j < d.length && pegado.length < junta.length; j++) {
      pegado += d[j];
      if (pegado === junta) return true;
    }
  }
  return false;
}

/** ¿Lo dicho contiene alguna de las formas que valen, como frase completa? */
export function contieneAlguna(dicho: string, formas: string[]): boolean {
  const d = palabrasDe(dicho);
  return formas.some((f) => {
    const n = palabrasDe(f);
    return n.length > 0 && estaEn(d, n);
  });
}

/**
 * Describe la imagen: qué cosas del dibujo nombró. Vale con el artículo
 * o sin él, en singular o en plural, y una acción con -ing ("cook" en
 * "Her mom is cooking", "swim" en "He is swimming", "dance" en "They're
 * dancing"; antes no contaban, auditoría del 28 de octubre de 2026).
 */
export function cosasNombradas(dicho: string, cosas: string[]): string[] {
  const d = normalizar(dicho);
  return cosas.filter((c) => {
    const n = normalizar(c).trim();
    const formas = [n, `${n}s`, `${n}es`, `${n}ing`, `${n.replace(/e$/, "")}ing`, `${n}${n.at(-1)}ing`];
    return formas.some((f) => d.includes(` ${f} `));
  });
}

/**
 * Repite: cada palabra de la frase, "bien" si aparece en lo que se
 * transcribió a ciegas. Una palabra repetida en la frase tiene que
 * aparecer las mismas veces.
 */
export function palabrasDeRepite(frase: string, transcripcion: string): { palabra: string; estado: EstadoPalabra }[] {
  const disponibles = palabrasDe(transcripcion);
  const deLaFrase = palabrasDeFrase(frase);
  return deLaFrase.map((palabra, n) => {
    // Una contracción ("I'm") son dos palabras normalizadas: valen las
    // dos. La siguiente decide "she'd already" (had) o "I'd like" (would).
    const partes = palabraNormalizada(palabra, deLaFrase[n + 1]);
    const posiciones = partes.map((p) => disponibles.findIndex((d) => mismaPalabra(d, p)));
    let todas = posiciones.every((i) => i >= 0);
    if (todas) {
      for (const i of [...posiciones].sort((a, b) => b - a)) disponibles.splice(i, 1);
    } else if (partes.length === 1) {
      // Escrita en dos: "stomach ache" por "stomachache".
      const i = disponibles.findIndex((d, k) => d + (disponibles[k + 1] ?? "") === partes[0]);
      if (i >= 0) {
        disponibles.splice(i, 2);
        todas = true;
      }
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
  largo = false,
  /**
   * En una escena, su situación en español ("Llegas en avión a Estados
   * Unidos…"): nunca la pregunta ni lo que se espera que diga. Con el
   * acento, "I'm here on vacation" salía "I'm going to make a cake" y "I
   * have two brothers", "y a bet your brothers". Con la situación al
   * final, solo para lo que no se entiende, 24 de 24 grabaciones de
   * acento marcado salen bien (sin ella, 22), y el español, los titubeos
   * y el silencio quedan igual. Dicha como "contexto" a secas, cambiaba
   * palabras que sí se oían bien ("My favorite for all this pizza"), y
   * como "fondo", traducía el español (pruebas, 25 de octubre de 2026).
   */
  escena?: string
): Promise<{ transcripcion: string; tokensEntrada: number; tokensSalida: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const r = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: audioBase64 } }] }],
    config: {
      systemInstruction: escena
        ? `${TRANSCRIBIR}
- Write what the sounds say first. Only if a word is unclear, the
  role-play (in Spanish) may help: ${escena}`
        : TRANSCRIBIR,
      responseMimeType: "application/json",
      responseSchema: esquemaTranscripcion(),
      temperature: 0,
      maxOutputTokens: largo ? 1000 : 400,
      abortSignal: AbortSignal.timeout(largo ? 20_000 : 12_000),
    },
  });
  const datos = jsonDelModelo<{ hayVoz?: boolean; transcripcion?: string }>(r);
  return {
    transcripcion: datos.hayVoz === false ? "" : limpiarTranscripcion(datos.transcripcion ?? ""),
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

/**
 * Juzga con el modelo un texto YA transcrito: se le da la pregunta o la
 * regla, nunca el audio. Antes Responde rápido transcribía y juzgaba en
 * la misma llamada, y con la pregunta a la vista traducía lo dicho en
 * español ("Tengo quince años" salía "I have fifteen years", correcto) y
 * le arreglaba los errores al alumno (auditoría, 28 de octubre de 2026).
 */
async function juzgar(dicho: string, criterio: string): Promise<{ correcto: boolean; tokensEntrada: number; tokensSalida: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const r = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: `The student said: ${dicho}` }] }],
    config: {
      systemInstruction: `You check one short answer of a Spanish-speaking student learning English. Judge only what is written, as it is.${criterio}`,
      responseMimeType: "application/json",
      responseSchema: { type: Type.OBJECT, properties: { correcto: { type: Type.BOOLEAN } }, required: ["correcto"] },
      temperature: 0,
      maxOutputTokens: 40,
      // Una evaluación tarda 1-3 s; en la prueba hubo una de 24 s por
      // la red. Mejor cortar y que la ruta devuelva la intervención que
      // dejar al alumno mirando la pantalla.
      abortSignal: AbortSignal.timeout(12_000),
    },
  });
  return {
    correcto: jsonDelModelo<{ correcto?: boolean }>(r).correcto === true,
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

/** ¿Qué es esto? abierta: la regla aprobada de "También se acepta". */
const juzgarConRegla = (p: PedidoEvaluacion) => `
- "correcto": the student (CEFR ${p.nivel}) was in this situation (in Spanish): "${p.contexto ?? ""}".
  The teacher accepts (in Spanish): "${p.regla}". Good answers look like:
  ${[p.esperado, ...(p.aceptadas ?? [])].map((x) => `"${x}"`).join(", ")}. true if what they
  said follows that rule and makes sense in the situation, in English,
  even with small mistakes. false if it does not, is in Spanish, or is empty.`;

/**
 * Dilo en inglés con otras palabras: vale si es inglés correcto, dice lo
 * mismo y usa la gramática de la frase aprobada. Antes solo valían las
 * frases fijas y "I'm 15 years old and I have a sister." salía mal
 * (auditoría, 28 de octubre de 2026).
 */
const juzgarDilo = (p: PedidoEvaluacion) => `
- "correcto": the student (CEFR ${p.nivel}) had to say this in English: "${p.espanol}" (in Spanish).
  Approved answers: ${[p.esperado, ...(p.aceptadas ?? [])].map((x) => `"${x}"`).join(", ")}.
  true if what they said is correct English that says the same thing, with
  the same grammar as the approved answers. Other words with the same
  meaning are fine ("exam" for "test", "What about" for "How about", "15"
  for "15 years old"). false if it has a grammar mistake, leaves out part
  of the meaning, changes the tense or the structure, is in Spanish, or
  is unfinished.`;

/**
 * Describe desde A2: ¿la frase tiene un error de gramática? Y si lo
 * tiene, la misma frase bien dicha. "Si dice 'He wash the car', Allison
 * repite bien la frase (He washed the car.) y el alumno la dice" (Si
 * responde mal de cada Describe de A2); antes recibía "Yes! What else?"
 * (auditoría, 28 de octubre de 2026). Sobre el texto ya transcrito a
 * ciegas, con la consigna a la vista para el tiempo verbal.
 */
export async function corregirFrase(
  dicho: string,
  consigna: string,
  nivel: Nivel
): Promise<{ mejor: string | null; tokensEntrada: number; tokensSalida: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const r = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: `The student said: ${dicho}` }] }],
    config: {
      systemInstruction: `A Spanish-speaking student (English level ${nivel}) is describing a picture.
The teacher asked: "${consigna}". Judge only what is written, as it is.
- "correcto": true if the sentence is correct English, with a verb form
  that fits the teacher's request (the past for what they did, "was/were
  + -ing" for what people were doing, "is/are + -ing" for what people are
  doing). Short and simple sentences are fine, and so is another correct
  way to say it ("Would you like to…?", "Do you want to…?", "Let's…").
  ${NO_ES_ERROR} false only if it has a real grammar mistake.
- "mejor": if "correcto" is false, the same sentence with only the
  mistakes fixed, in simple US English, keeping their words; "" if it is
  correct. Never reword a correct sentence.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { correcto: { type: Type.BOOLEAN }, mejor: { type: Type.STRING } },
        required: ["correcto", "mejor"],
        propertyOrdering: ["correcto", "mejor"],
      },
      temperature: 0,
      maxOutputTokens: 80,
      abortSignal: AbortSignal.timeout(12_000),
    },
  });
  const d = jsonDelModelo<{ correcto?: boolean; mejor?: string }>(r);
  const mejor = (d.mejor ?? "").trim();
  // Una "mejor" que dice lo mismo (otra contracción, otro signo) no corrige nada.
  const distinta = !!mejor && sinConectores(palabrasDelRelato(mejor)).join(" ") !== sinConectores(palabrasDelRelato(dicho)).join(" ");
  return {
    mejor: d.correcto === false && distinta && !agregaContenido(palabrasDelRelato(dicho), palabrasDelRelato(mejor)) ? mejor : null,
    tokensEntrada: r.usageMetadata?.promptTokenCount ?? 0,
    tokensSalida: r.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

/** Repite desde A2: ¿la palabra difícil salió bien? Busca su lugar en la frase. */
function claveMal(palabras: { palabra: string; estado: EstadoPalabra }[], clave: string): boolean | null {
  const frase = palabras.map((w) => normalizar(w.palabra).trim());
  const buscada = palabrasDeFrase(clave).map((c) => normalizar(c).trim());
  for (let i = 0; i + buscada.length <= frase.length; i++) {
    if (buscada.every((c, k) => frase[i + k] === c)) return palabras.slice(i, i + buscada.length).some((w) => w.estado === "mejorar");
  }
  return null;
}

export async function evaluarRespuestaCorta(p: PedidoEvaluacion): Promise<ResultadoEvaluacion> {
  if (!p.texto && !p.audioBase64) throw new Error("Hace falta el audio o el texto del alumno");

  // Primero, a ciegas: el modelo no sabe la respuesta ni la pregunta.
  // Lo escrito no se transcribe.
  let transcripcion = p.texto?.trim() ?? "";
  let tokensEntrada = 0;
  let tokensSalida = 0;
  if (!transcripcion && p.audioBase64) {
    const tr = await transcribirACiegas(p.audioBase64, p.mimeType ?? "audio/webm");
    transcripcion = tr.transcripcion.trim();
    tokensEntrada += tr.tokensEntrada;
    tokensSalida += tr.tokensSalida;
  }
  const resultado: ResultadoEvaluacion = { transcripcion, correcto: false, palabras: [], tokensEntrada, tokensSalida };
  // Lo dicho en español no se juzga: nunca vale, y sería otra llamada.
  const juzgable = !!transcripcion && !hablaEspanol(transcripcion);
  // Lo escrito paga la primera vez que hace falta el modelo (antesDelModelo).
  let permitido: boolean | null = p.antesDelModelo ? null : true;
  const puedeUsarModelo = async () => {
    if (permitido === null) permitido = await p.antesDelModelo!();
    return permitido;
  };
  const conModelo = async (criterio: string) => {
    if (!(await puedeUsarModelo())) {
      resultado.sinSaldo = true;
      return false;
    }
    const j = await juzgar(transcripcion, criterio);
    resultado.tokensEntrada += j.tokensEntrada;
    resultado.tokensSalida += j.tokensSalida;
    return j.correcto;
  };

  switch (p.tipo) {
    case "que-es-esto":
    case "dilo":
      resultado.correcto = contieneAlguna(transcripcion, [p.esperado, ...(p.aceptadas ?? [])]);
      // Respuesta abierta ("Cualquier consejo con should"): si no es una de
      // las frases de ejemplo, la juzga el modelo con la regla aprobada.
      // Antes se calificaba contra las frases fijas y "You should drink
      // water." salía mal.
      if (!resultado.correcto && p.regla && juzgable) resultado.correcto = await conModelo(juzgarConRegla(p));
      else if (!resultado.correcto && p.tipo === "dilo" && p.espanol && juzgable) resultado.correcto = await conModelo(juzgarDilo(p));
      // ¿Qué es esto?: las palabras de la respuesta que ya dijo van llenando las rayas.
      if (p.tipo === "que-es-esto") resultado.palabras = palabrasDeRepite(p.esperado, transcripcion);
      break;
    case "describe": {
      // "Tell me 3 things you see": tres cosas distintas del dibujo.
      const cosas = cosasNombradas(transcripcion, p.aceptadas ?? []);
      resultado.correcto = cosas.length >= 3;
      // Desde A2, una frase que nombra algo se revisa: con un error,
      // Allison la dice bien y el alumno la repite (tanda 1, 29 de octubre de 2026).
      // Si la revisión falla, la frase cuenta igual: lo que nombró ya se sabe.
      // Escrita y sin saldo, no se revisa (no se usa el modelo) y cuenta.
      if ((p.nivel ?? "A1") !== "A1" && cosas.length && juzgable && (await puedeUsarModelo())) {
        const c = await corregirFrase(transcripcion, p.esperado, p.nivel).catch(() => null);
        if (c) {
          resultado.tokensEntrada += c.tokensEntrada;
          resultado.tokensSalida += c.tokensSalida;
          if (c.mejor) resultado.mejora = { dijo: transcripcion, mejor: c.mejor };
        }
      }
      break;
    }
    case "responde":
      resultado.correcto = juzgable && (await conModelo(juzgarRespuesta(p.esperado, p.nivel)));
      break;
    case "repite": {
      resultado.palabras = palabrasDeRepite(p.esperado, transcripcion);
      const mal = resultado.palabras.filter((w) => w.estado === "mejorar");
      const dificilMal = p.clave ? claveMal(resultado.palabras, p.clave) : null;
      if (dificilMal !== null) {
        // "Pequeñas fallas en el resto de la frase": solo hace fallar la
        // palabra difícil, o no haber dicho casi nada de la frase.
        const casiNada = mal.length * 2 > resultado.palabras.length;
        resultado.correcto = !dificilMal && !casiNada;
        resultado.palabraAMejorar = dificilMal ? p.clave : casiNada ? mal[0]?.palabra : undefined;
        // Si pasó, las pequeñas fallas no salen como errores debajo de "Great!".
        if (resultado.correcto) resultado.palabras = resultado.palabras.map((w) => ({ ...w, estado: "bien" as const }));
      } else {
        resultado.palabraAMejorar = mal[0]?.palabra;
        resultado.correcto = !resultado.palabraAMejorar;
      }
      break;
    }
  }
  return resultado;
}

// ---------------------------------------------------------------------
//  Cuéntame (A2 y B1) y Narra la secuencia (B1)
//
//  El relato se transcribe primero a ciegas (transcribirACiegas, largo):
//  quien transcribe no sabe de qué tema se habló. Después, con el texto
//  ya fijo, el modelo copia las frases que se entienden y elige una sola
//  por mejorar y una cosa bien hecha. El código verifica que lo que cita
//  esté de verdad en lo que dijo el alumno, cuenta las frases y descarta
//  las correcciones que no corrigen nada.
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

/**
 * Los campos del comentario: las frases, la mejora y lo bien hecho (los
 * "porqué" en español, o desde B1 en inglés y en español). La mejora va
 * antes que lo bien hecho: con la frase del error ya elegida, el modelo
 * no la elogia (antes elogiaba la misma frase que corregía).
 */
function camposComentario(nivel: Nivel) {
  const b1 = enIngles(nivel);
  return {
    frases: { type: Type.ARRAY, items: { type: Type.STRING } },
    espanol: { type: Type.BOOLEAN },
    mejorDijo: { type: Type.STRING },
    mejorFrase: { type: Type.STRING },
    mejorPorque: { type: Type.STRING },
    ...(b1 ? { mejorPorqueEs: { type: Type.STRING } } : {}),
    bienFrase: { type: Type.STRING },
    bienPorque: { type: Type.STRING },
    ...(b1 ? { bienPorqueEs: { type: Type.STRING } } : {}),
  };
}

/**
 * Las frases se piden copiadas, no contadas: así el código no cuenta dos
 * veces la misma ("I go to school." cuatro veces eran 4 frases) ni las
 * que no dijo. Cada idea con su verbo es una frase aunque vaya unida con
 * "and": un relato de cuatro ideas en una sola tirada contaba 2 (auditoría,
 * 28 de octubre de 2026).
 */
const PEDIDO_FRASES = `- "frases": each understandable sentence in English they said, copied
  exactly from the message, once. Every idea with its own verb is one
  sentence, even when it is joined to the next one with "and", "then" or
  "but", or said without periods: "I get up and I eat breakfast" is two.
  A sentence counts if an English speaker understands it, even with
  mistakes. Spanish sentences, lone words and broken pieces do not count.`;

/**
 * Lo que no es un error, dicho al modelo: corregía frases bien dichas
 * (quitaba el "First" que pide la actividad, "at six" → "at six o'clock",
 * "hasn't" → "has not", el modelo mismo de Allison).
 */
const NO_ES_ERROR = `These are correct, never mistakes: contractions (I'm, hasn't, don't),
  sequence words (first, then, after that, now, so, finally), a time
  said with just the number ("at six"), punctuation and capital letters.`;

/** Cómo se pide el comentario (mejora y bien), en el idioma del nivel. */
function pedidoComentario(nivel: Nivel): string {
  const comun = `- "mejorDijo": the whole sentence with their most important real mistake
  in grammar or vocabulary, copied exactly from the message. ${NO_ES_ERROR}
  "" if every sentence is correct: never correct a sentence that is right.
- "mejorFrase": that sentence with only the mistake fixed, in simple US
  English (soccer, apartment, vacation, math). Keep their words and ideas:
  add nothing new.`;
  const bien = `- "bienFrase": a sentence with no mistakes at all, copied exactly from
  the message, not the one in "mejorDijo". "" if every sentence has a
  mistake.`;
  if (!enIngles(nivel)) {
    return `${comun}
- "mejorPorque": in Spanish, at most 10 words: the rule ("Para un lugar
  se dice at school.").
${bien}
- "bienPorque": in Spanish, at most 8 words: what they did well in it
  ("Usaste bien el presente simple.").`;
  }
  return `${comun}
- "mejorPorque": in very simple English, at most 10 words: the rule
  ("After if, no will: if it rains.").
- "mejorPorqueEs": the same rule, in Spanish ("Después de if no va will:
  if it rains.").
${bien}
- "bienPorque": in very simple English, at most 8 words: what they did
  well in it ("You used the past perfect well.").
- "bienPorqueEs": the same, in Spanish ("Usaste bien el pasado perfecto.").`;
}

type DatosComentario = {
  frases?: unknown;
  espanol?: boolean;
  bienFrase?: string;
  bienPorque?: string;
  bienPorqueEs?: string;
  mejorDijo?: string;
  mejorFrase?: string;
  mejorPorque?: string;
  mejorPorqueEs?: string;
};

/** Muletillas del habla: no son palabras de la frase ("Eh... I go to school"). */
const MULETILLAS = new Set(["eh", "em", "um", "umm", "uh", "uhm", "ah", "mm", "mmm", "hmm", "er", "erm"]);

/** Las palabras de una frase como las compara el código: normalizadas y sin muletillas. */
const palabrasDelRelato = (t: string) =>
  normalizar(t)
    .trim()
    .split(" ")
    .filter((p) => p && !MULETILLAS.has(p));

/** Las palabras que ordenan la historia (las pide Narra: first, then, after that, now). */
const CONECTORES = new Set(["first", "then", "next", "now", "finally", "later"]);

/**
 * Sin los conectores de orden, ni el "and" o el "so" que los acompañan o
 * abren la frase: "First Zoe checked her bag" y "Zoe checked her bag"
 * dicen lo mismo, y "and then she flew" y "then she flew", también. El
 * "so" de en medio se queda: "Because it rained, so we stayed" sí es un
 * error que vale corregir.
 */
function sinConectores(palabras: string[]): string[] {
  const salida: string[] = [];
  for (let i = 0; i < palabras.length; i++) {
    const [p, sig, tras] = [palabras[i], palabras[i + 1] ?? "", palabras[i + 2] ?? ""];
    if (CONECTORES.has(p)) continue;
    if (p === "after" && (sig === "that" || sig === "this")) {
      i++;
      continue;
    }
    if (p === "in" && sig === "the" && tras === "end") {
      i += 2;
      continue;
    }
    if ((p === "and" || p === "so") && (!salida.length || CONECTORES.has(sig) || (sig === "after" && tras === "that"))) continue;
    salida.push(p);
  }
  return salida;
}

/** Lo que agrega una corrección de gramática: artículos, preposiciones, auxiliares, pronombres. */
const DE_GRAMATICA = new Set([
  "a", "an", "the", "to", "at", "in", "on", "for", "of", "with", "from", "by", "about", "into",
  "am", "is", "are", "was", "were", "be", "been", "being", "do", "does", "did", "not",
  "have", "has", "had", "will", "would", "can", "could", "should", "must",
  "it", "there", "i", "you", "he", "she", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their", "that", "this", "these", "those", "some", "any", "than", "as",
]);

/**
 * ¿La frase mejor agrega contenido? Si lo dicho está entero y en orden
 * dentro de la mejor, la mejor solo agrega palabras, y si alguna no es de
 * gramática, inventa: "Math." → "I like math.", "at six" → "at six
 * o'clock" o "at 6 AM" (auditoría, 28 de octubre de 2026). "I happy" →
 * "I am happy" sí corrige.
 */
function agregaContenido(dijo: string[], mejor: string[]): boolean {
  let i = 0;
  const nuevas: string[] = [];
  mejor.forEach((p, k) => {
    if (i < dijo.length && p === dijo[i]) i++;
    // El "AM" de una hora no es el verbo "am".
    else nuevas.push(p === "am" && /^\d+$/.test(mejor[k - 1] ?? "") ? "a.m." : p);
  });
  return i === dijo.length && nuevas.some((p) => !DE_GRAMATICA.has(p));
}

/** ¿Una frase contiene a la otra (las dos con palabras)? */
function seTocan(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false;
  const [x, y] = [` ${a.join(" ")} `, ` ${b.join(" ")} `];
  return x.includes(y) || y.includes(x);
}

/**
 * Dónde dijo el alumno lo citado (en palabras desde el principio), o -1
 * si no lo dijo. Si el modelo lo copió con un cambio pequeño (una palabra
 * corregida), basta un tramo de tres palabras seguidas; lo traducido del
 * español no aparece y no cuenta.
 */
function posicionEnLoDicho(cita: string, dicho: string): number {
  const d = palabrasDelRelato(dicho);
  const c = palabrasDelRelato(cita);
  const busca = (n: string[]) => {
    for (let i = 0; n.length && i + n.length <= d.length; i++) if (n.every((w, k) => d[i + k] === w)) return i;
    return -1;
  };
  const exacta = busca(c);
  if (exacta >= 0 || c.length <= 3) return exacta;
  for (let i = 0; i + 3 <= c.length; i++) {
    const tramo = busca(c.slice(i, i + 3));
    if (tramo >= 0) return Math.max(0, tramo - i);
  }
  return -1;
}

/**
 * ¿Dos citas ocupan parte de las mismas palabras de lo dicho? Así se
 * reconoce la misma frase aunque el modelo la copie con un cambio pequeño.
 */
function seSolapanEnLoDicho(a: string, b: string, dicho: string): boolean {
  const [pa, pb] = [posicionEnLoDicho(a, dicho), posicionEnLoDicho(b, dicho)];
  if (pa < 0 || pb < 0) return false;
  const [la, lb] = [palabrasDelRelato(a).length, palabrasDelRelato(b).length];
  return pa < pb + lb && pb < pa + la;
}

/** Una palabra con tilde o eñe: en un relato en inglés solo va en un nombre ("Bogotá"). */
const TILDADA = /[a-záéíóúüñ]*[áéíóúñ][a-záéíóúüñ]*/gi;

/**
 * ¿Está en español una cita o una frase? Respaldo del modelo, frase por
 * frase: contaba los dibujos contados en español. "Luego voló a
 * Vancouver" no tiene palabras de las listas de hablaEspanol y
 * mezclaEspanol; la delata la tilde, si sin las palabras con tilde no
 * queda inglés claro ("I play fútbol with my friends" sigue en inglés).
 */
const enEspanol = (t: string) =>
  hablaEspanol(t) || mezclaEspanol(t) || (/[áéíóúñ]/i.test(t) && !esInglesClaro(t.replace(TILDADA, " ")));

/**
 * Cuántas frases distintas en inglés dijo: las que el modelo copió, si
 * están en lo dicho, no son español y tienen al menos dos palabras. La
 * misma frase dos veces (o con otro conector) cuenta una.
 */
function frasesContadas(frases: unknown, transcripcion: string): number {
  const vistas = new Set<string>();
  for (const f of Array.isArray(frases) ? frases : []) {
    if (typeof f !== "string" || enEspanol(f) || posicionEnLoDicho(f, transcripcion) < 0) continue;
    const palabras = sinConectores(palabrasDelRelato(f));
    if (palabras.length >= 2) vistas.add(palabras.join(" "));
  }
  return Math.min(30, vistas.size);
}

/**
 * Arma el comentario verificado: solo lo que de verdad dijo, y una mejora
 * solo si corrige algo. Se descarta si lo dicho y lo mejor son lo mismo
 * sin signos, contracciones ni conectores; si la mejor agrega contenido;
 * o si lo dicho es una frase del modelo de Allison, que está bien por
 * definición. Lo bien hecho no puede ser la frase que se corrige ni un
 * error previsto de la actividad (`previstas`, los "siDice" de Narra).
 */
export function comentarioVerificado(
  d: DatosComentario,
  transcripcion: string,
  nivel: Nivel,
  extra: { modelo?: string; previstas?: string[] } = {}
) {
  const corto = (t: string | undefined, max: number) => (t ?? "").trim().split(/\s+/).slice(0, max).join(" ");
  const b1 = enIngles(nivel);
  const bienFrase = (d.bienFrase ?? "").trim();
  const dijo = (d.mejorDijo ?? "").trim();
  const mejor = (d.mejorFrase ?? "").trim();
  const [dijoP, mejorP] = [sinConectores(palabrasDelRelato(dijo)), sinConectores(palabrasDelRelato(mejor))];
  const modeloP = sinConectores(palabrasDelRelato(extra.modelo ?? ""));
  const delModelo = dijoP.length >= 3 && ` ${modeloP.join(" ")} `.includes(` ${dijoP.join(" ")} `);
  // Una frase en español no se corrige: se traduce, y eso no es una regla.
  const corrige =
    dijoP.length > 0 &&
    mejorP.length > 0 &&
    dijoP.join(" ") !== mejorP.join(" ") &&
    !agregaContenido(dijoP, mejorP) &&
    !delModelo &&
    !enEspanol(dijo);
  const conEs = (es: string | undefined, max: number) => (b1 && es?.trim() ? { porqueEs: corto(es, max) } : {});
  const mejora = corrige && estaEnLoDicho(dijo, transcripcion) ? { dijo, mejor, porque: corto(d.mejorPorque, 14), ...conEs(d.mejorPorqueEs, 16) } : null;
  const bienP = palabrasDelRelato(bienFrase);
  const bienConError =
    (mejora && (seTocan(bienP, palabrasDelRelato(mejora.dijo)) || seSolapanEnLoDicho(bienFrase, mejora.dijo, transcripcion))) ||
    (extra.previstas ?? []).some((s) => seTocan(bienP, palabrasDelRelato(s)));
  const frases = frasesContadas(d.frases, transcripcion);
  // "La mayor parte en español" no, si dijo más frases en inglés que en
  // español: con una sola en español, el modelo daba por no contada una
  // historia de tres frases en inglés (pruebas, 28 de octubre de 2026).
  const enEspanolDichas = (transcripcion.match(/[^.!?]+[.!?]*/g) ?? []).filter((o) => o.trim() && enEspanol(o)).length;
  return {
    frases,
    espanol: d.espanol === true && frases <= enEspanolDichas,
    // Solo lo que de verdad dijo: una frase inventada no se muestra.
    bien:
      bienFrase && !bienConError && estaEnLoDicho(bienFrase, transcripcion)
        ? { frase: bienFrase, porque: corto(d.bienPorque, 12), ...conEs(d.bienPorqueEs, 14) }
        : null,
    mejora,
  };
}

/**
 * Lo bien hecho, revisado aparte: el modelo corrige un solo error y a
 * veces elogia otra frase que también tiene uno ("I study mathematic and
 * english."; 1 de cada 4 relatos con errores en la auditoría). Juzgada
 * sola, con el tema y sin el resto, una frase con error se reconoce. Si
 * no está bien o el juez falla, no se elogia nada (tanda 1, 29 de
 * octubre de 2026).
 */
export async function bienRevisado<T extends { bien: ComentarioRelato["bien"] }>(
  c: T,
  tema: string
): Promise<T & { tokensEntrada: number; tokensSalida: number }> {
  if (!c.bien) return { ...c, tokensEntrada: 0, tokensSalida: 0 };
  try {
    const j = await juzgar(
      c.bien.frase,
      `
- "correcto": the sentence is from what they told about: ${tema}.
  true if an English teacher would mark it right: no grammar mistakes, no
  wrong words, natural word order, and a verb tense that fits the topic
  (any correct tense is fine: the past simple for what happened, the
  present simple for routines). ${NO_ES_ERROR}
  false if it has a real mistake.`
    );
    return { ...c, bien: j.correcto ? c.bien : null, tokensEntrada: j.tokensEntrada, tokensSalida: j.tokensSalida };
  } catch {
    return { ...c, bien: null, tokensEntrada: 0, tokensSalida: 0 };
  }
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
  /** El relato modelo de Allison: no va al prompt; una frase suya nunca se corrige. */
  modelo?: string;
}): Promise<ComentarioRelato> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const props = camposComentario(p.nivel);
  const instruccion = `A Spanish-speaking teenager from Colombia (English level ${p.nivel}) talked
for up to ${p.segundos ?? 30} seconds about this topic: "${p.tema}". The message is
exactly what they said (or wrote), with their mistakes.

Return:
${PEDIDO_FRASES}
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
      // Las frases van copiadas: un relato de un minuto ocupa más.
      maxOutputTokens: 1000,
      abortSignal: AbortSignal.timeout(15_000),
    },
  });
  const d = jsonDelModelo<DatosComentario>(r);
  const c = await bienRevisado(comentarioVerificado(d, p.transcripcion, p.nivel, { modelo: p.modelo }), `"${p.tema}"`);
  return {
    ...c,
    tokensEntrada: (r.usageMetadata?.promptTokenCount ?? 0) + c.tokensEntrada,
    tokensSalida: (r.usageMetadata?.candidatesTokenCount ?? 0) + c.tokensSalida,
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
 * Los dibujos que contó, en el orden en que los contó: el de cada cita en
 * lo dicho. Sin los de cita en español ni los que no dijo (una cita
 * traducida no aparece en lo dicho).
 */
export function dibujosContados(citas: unknown, total: number, transcripcion: string): number[] {
  const citados = (Array.isArray(citas) ? citas : [])
    .map((x) => ({ n: Number(x?.dibujo), cita: String(x?.cita ?? "").trim() }))
    .filter((x) => Number.isInteger(x.n) && x.n >= 1 && x.n <= total && x.cita && !enEspanol(x.cita))
    .map((x) => ({ ...x, donde: posicionEnLoDicho(x.cita, transcripcion) }))
    .filter((x) => x.donde >= 0)
    .sort((a, b) => a.donde - b.donde || a.n - b.n);
  return [...new Set(citados.map((x) => x.n))];
}

/**
 * Narra la secuencia (B1): con el texto ya transcrito a ciegas, el modelo
 * dice qué dibujos contó (le damos qué muestra cada uno), con las palabras
 * con que contó cada uno, y elige una cosa por mejorar y una bien hecha.
 *
 * El orden lo pone el código, por dónde está cada cita en lo dicho: el
 * modelo devolvía [1, 2, 3, 4] aunque lo contara al revés. Y un dibujo
 * contado en español no cuenta, aunque el modelo lo dé (lo daba): la cita
 * en español, o traducida (no está en lo dicho), se cae (auditoría, 28
 * de octubre de 2026).
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
  /** La narración modelo de Allison: no va al prompt; una frase suya nunca se corrige. */
  modelo?: string;
  /** Los errores previstos de la actividad ("siDice"): no van al prompt; nunca son lo bien hecho. */
  previstas?: string[];
}): Promise<ComentarioNarracion> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const props = {
    dibujos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { dibujo: { type: Type.INTEGER }, cita: { type: Type.STRING } },
        required: ["dibujo", "cita"],
        propertyOrdering: ["dibujo", "cita"],
      },
    },
    ...camposComentario(p.nivel),
  };
  const lista = p.dibujos.map((x, i) => `  ${i + 1}. ${x}`).join("\n");
  const instruccion = `A Spanish-speaking teenager from Colombia (English level ${p.nivel}) is
telling a story from four pictures, in English. Their teacher asked:
"${p.pregunta}" The grammar to practice: ${p.gramatica}.
The four pictures, in order (described in Spanish):
${lista}
The message is exactly what they said (or wrote), with their mistakes.

Return:
- "dibujos": one item for each picture they told about in English:
  "dibujo" is its number and "cita" the words where they tell it, copied
  exactly from the message. A picture counts if an English speaker would
  understand that part of the story, even with mistakes or other words.
  A picture told in Spanish does not count. Leave out a picture they did
  not talk about.
${PEDIDO_FRASES}
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
      // Las citas y las frases van copiadas: una historia de un minuto ocupa más.
      maxOutputTokens: 1200,
      abortSignal: AbortSignal.timeout(15_000),
    },
  });
  const d = jsonDelModelo<DatosComentario & { dibujos?: unknown }>(r);
  const total = p.dibujos.length;
  const dibujos = dibujosContados(d.dibujos, total, p.transcripcion);
  const faltante = Array.from({ length: total }, (_, i) => i + 1).find((n) => !dibujos.includes(n)) ?? null;
  const c = await bienRevisado(
    comentarioVerificado(d, p.transcripcion, p.nivel, { modelo: p.modelo, previstas: p.previstas }),
    // Sin la gramática pedida: con ella, el juez rechazaba un pasado simple bien dicho.
    `four pictures ("${p.pregunta}")`
  );
  return {
    ...c,
    dibujos,
    enOrden: dibujosEnOrden(dibujos),
    faltante,
    tokensEntrada: (r.usageMetadata?.promptTokenCount ?? 0) + c.tokensEntrada,
    tokensSalida: (r.usageMetadata?.candidatesTokenCount ?? 0) + c.tokensSalida,
  };
}
