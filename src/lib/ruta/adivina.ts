import type { Adivina } from "./tipos.ts";

/**
 * Adivina (A2): lo que Allison responde, armado en el código con la tabla
 * aprobada del contenido. El modelo solo reconoce QUÉ preguntó el alumno
 * (clasificarAdivina, en escena.ts); todo lo de aquí es puro, para que la
 * pantalla lo use sin cargar la IA y para probarlo sin red
 * (scripts/probar-ruta.mjs).
 */

/** Lo que el modelo reconoció en el mensaje del alumno. */
export interface LecturaAdivina {
  /**
   * "pregunta": una de la tabla. "adivina": nombró una opción.
   * "otra": de sí o no, pero fuera de la tabla. "abierta": no es de sí o
   * no ("What do you do?"). "otro": no es una pregunta o no se entiende.
   */
  tipo: "pregunta" | "adivina" | "otra" | "abierta" | "otro";
  /** La pregunta de la tabla (desde 1), o 0. */
  fila: number;
  /** La opción que nombró (desde 1), o 0. */
  opcion: number;
  espanol: boolean;
}

/** Cómo va la ronda, sin decir en qué piensa Allison. */
export interface RondaAdivina {
  /** La opción en que piensa Allison en esta ronda. */
  secreto: string;
  /** Las tarjetas ya apagadas. */
  descartadas: string[];
  /** Las preguntas de la tabla ya hechas (desde 1). */
  preguntadas: number[];
  /** Es la última ronda. */
  ultima: boolean;
}

export interface RespuestaAdivina {
  /** Solo en inglés: Allison nunca mezcla idiomas en una respuesta. */
  respuesta: string;
  /** Adivinó la opción de esta ronda. */
  gano: boolean;
  /** Las tarjetas que esta respuesta apaga. */
  descartar: string[];
  /** La pregunta de la tabla que contestó (desde 1), o null. */
  preguntada: number | null;
  /** Un intento que no sirvió: dos seguidos iluminan la ayuda. */
  fallo: boolean;
  /** Una pregunta o un intento de adivinar que se entendió: se califica. */
  entendida: boolean;
}

/** "Do you…?" → "Yes, I do." / "No, I don't.", y así con cada auxiliar. */
const CORTAS: [RegExp, string, string][] = [
  [/^would you like\b/, "I'd love to!", "No, thanks."],
  [/^(do|does) (you|i)\b/, "Yes, I do.", "No, I don't."],
  [/^does (it|he|she)\b/, "Yes, $1 does.", "No, $1 doesn't."],
  [/^did (you|i)\b/, "Yes, I did.", "No, I didn't."],
  [/^are you\b/, "Yes, I am.", "No, I'm not."],
  [/^were you\b/, "Yes, I was.", "No, I wasn't."],
  [/^(is|was) (it|he|she)\b/, "Yes, $2 $1.", "No, $2 $1n't."],
  // Las medias son "they" (auditoría, 28 de octubre de 2026: "Are they
  // expensive?" recibía "No, it wasn't.").
  [/^(are|were) they\b/, "Yes, they $1.", "No, they $1n't."],
  [/^(do|did) they\b/, "Yes, they $1.", "No, they $1n't."],
  [/^can (you|i)\b/, "Yes, I can.", "No, I can't."],
  [/^will you\b/, "Yes, I will.", "No, I won't."],
  [/^have you\b/, "Yes, I have.", "No, I haven't."],
];

/** La respuesta corta de Allison a una pregunta de la tabla. */
export function respuestaCorta(pregunta: string, si: boolean): string {
  const p = pregunta.trim().toLowerCase();
  for (const [re, afirmativa, negativa] of CORTAS) {
    const m = p.match(re);
    if (!m) continue;
    const forma = si ? afirmativa : negativa;
    return forma.replace("$1", m[1] ?? "").replace("$2", m[2] ?? "");
  }
  return si ? "Yes!" : "No!";
}

/**
 * La pregunta del alumno, si tiene una forma que Allison sabe contestar
 * ("Are they expensive?"): así la respuesta corta va con lo que él
 * preguntó y no con la pregunta de la tabla ("Was it expensive?").
 */
export function preguntaDelAlumno(dicho: string | undefined): string | null {
  if (!dicho) return null;
  const frases = dicho
    .split(/(?<=[.!?])\s+/)
    .map((f) => f.trim().replace(/^(hmm+|ok(ay)?|so|and|well|allison)\b[\s,!.]*/i, ""))
    .filter(Boolean);
  const pregunta = [...frases].reverse().find((f) => /\?\s*$/.test(f)) ?? frases[frases.length - 1];
  if (!pregunta) return null;
  const p = pregunta.toLowerCase();
  return CORTAS.some(([re]) => re.test(p)) ? pregunta : null;
}

/** "Are you a {x}?" con la opción. */
export function preguntaDeAdivinar(a: Pick<Adivina, "adivinar">, opcion: string): string {
  return a.adivinar.replace("{x}", opcion);
}

const invita = (a: Pick<Adivina, "adivinar">) => /^would you like\b/i.test(a.adivinar.trim());

/**
 * La pregunta de ejemplo de la ayuda: la de la tabla, aún sin hacer, que
 * mejor parte en dos las tarjetas que quedan. Si ya no hay ninguna que
 * sirva, la de adivinar una de las que quedan.
 */
export function preguntaDeEjemplo(a: Adivina, descartadas: string[], preguntadas: number[]): string {
  const quedan = a.opciones.map((o) => o.nombre).filter((n) => !descartadas.includes(n));
  let mejor = "";
  let mejorParte = 0;
  for (const [i, p] of a.preguntas.entries()) {
    if (preguntadas.includes(i + 1)) continue;
    const si = quedan.filter((n) => p.si.includes(n)).length;
    const parte = Math.min(si, quedan.length - si);
    if (parte > mejorParte) {
      mejor = p.pregunta;
      mejorParte = parte;
    }
  }
  return mejor || preguntaDeAdivinar(a, quedan[0] ?? a.opciones[0].nombre);
}

/**
 * Lo que responde Allison a un mensaje del alumno, y lo que cambia en la
 * ronda. Allison responde siempre solo en inglés (memoria "idiomas
 * separados"): si el alumno habla en español, le da la pregunta en inglés
 * para que la intente.
 */
export function respuestaDeAdivina(a: Adivina, l: LecturaAdivina, r: RondaAdivina, dicho?: string): RespuestaAdivina {
  const nada = { gano: false, descartar: [] as string[], preguntada: null };
  const fila = l.fila >= 1 && l.fila <= a.preguntas.length ? a.preguntas[l.fila - 1] : null;
  const opcion = l.opcion >= 1 && l.opcion <= a.opciones.length ? a.opciones[l.opcion - 1].nombre : null;

  if (l.espanol) {
    const en =
      l.tipo === "adivina" && opcion
        ? preguntaDeAdivinar(a, opcion)
        : l.tipo === "pregunta" && fila
          ? fila.pregunta
          : null;
    const respuesta = en ? `${en} Try it!` : `Ask me in English! Try this: ${preguntaDeEjemplo(a, r.descartadas, r.preguntadas)}`;
    return { ...nada, respuesta, fallo: true, entendida: false };
  }

  if (l.tipo === "pregunta" && fila) {
    const si = fila.si.includes(r.secreto);
    // Las tarjetas que no darían la misma respuesta se apagan solas.
    const descartar = a.opciones
      .map((o) => o.nombre)
      .filter((n) => !r.descartadas.includes(n) && fila.si.includes(n) !== si);
    const forma = preguntaDelAlumno(dicho) ?? fila.pregunta;
    return { respuesta: respuestaCorta(forma, si), gano: false, descartar, preguntada: l.fila, fallo: false, entendida: true };
  }

  if (l.tipo === "adivina" && opcion) {
    if (opcion === r.secreto) {
      const si = a.alAdivinar?.[opcion] ?? (invita(a) ? "Yes, I'd love to!" : "Yes!");
      const sigue = r.ultima ? "Great job!" : "Let's play again! I'm thinking of a new one.";
      return { respuesta: `${si} You got it! ${sigue}`, gano: true, descartar: [], preguntada: null, fallo: false, entendida: true };
    }
    const no = invita(a) ? "No, thanks!" : "No!";
    return { respuesta: `${no} Ask me more.`, gano: false, descartar: [opcion], preguntada: null, fallo: false, entendida: true };
  }

  if (l.tipo === "otra") {
    // Una pregunta de sí o no que no está en la tabla: no gasta la ronda.
    const otra = invita(a) ? "Invite me to something else!" : "Ask me another question!";
    return { ...nada, respuesta: `Hmm, I can't answer that one. ${otra}`, fallo: false, entendida: false };
  }
  if (l.tipo === "abierta") return { ...nada, respuesta: a.secreto, fallo: true, entendida: false };
  return { ...nada, respuesta: "Sorry, I don't understand. Ask me a yes or no question!", fallo: true, entendida: false };
}

/**
 * Lo que viaja al navegador de una Adivina: todo menos en qué piensa
 * Allison. Las rondas se quedan en el servidor (la pantalla solo
 * necesita cuántas son); la tabla de preguntas sí viaja, porque la ayuda
 * la usa y no es secreta: se ve en los dibujos.
 */
export function adivinaParaElNavegador(a: Adivina): Adivina {
  return { ...a, rondas: a.rondas.map(() => "") };
}

/** Las rondas en un orden al azar (el documento: "en orden al azar"). */
export function barajarRondas(rondas: string[], azar: () => number = Math.random): string[] {
  const copia = [...rondas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
