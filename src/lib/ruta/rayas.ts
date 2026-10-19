/**
 * Las rayas de ¿Qué es esto?: una por letra de la respuesta. En A1 y A2
 * el alumno las va llenando con la frase completa, con una palabra o con
 * una letra. Todo es puro, para que la pantalla lo use sin red y para
 * probarlo (scripts/probar-ruta.mjs).
 */

/**
 * Las palabras de una frase como se ven en pantalla: sin puntuación y con
 * el apóstrofo ("It's ten o'clock." → It's, ten, o'clock). La evaluación
 * de Repite y de ¿Qué es esto? parte la frase igual (palabrasDeRepite),
 * así que el orden de las palabras coincide con el de las rayas.
 */
export function palabrasDeFrase(frase: string): string[] {
  return frase
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9']/g, ""))
    .filter(Boolean);
}

/** Minúscula y sin tilde. */
const base = (c: string) =>
  c
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** El apóstrofo no lleva raya: se ve desde el principio. */
export const llevaRaya = (c: string) => /^[a-z0-9]$/.test(base(c));

/** Cada raya se nombra "palabra:letra", contando desde 0. */
export const lugar = (palabra: number, letra: number) => `${palabra}:${letra}`;

/**
 * Las rayas donde va una letra (la "o" de "Good morning" va en tres),
 * sin contar las de las palabras que ya dijo.
 */
export function lugaresDeLetra(palabras: string[], letra: string, dichas: number[] = []): string[] {
  const l = base(letra);
  return palabras.flatMap((w, p) =>
    dichas.includes(p) ? [] : [...w].flatMap((c, j) => (base(c) === l ? [lugar(p, j)] : []))
  );
}

/** ¿Ya se ve toda la respuesta, con las palabras dichas y las letras halladas? */
export function respuestaCompleta(palabras: string[], dichas: number[], halladas: string[]): boolean {
  return palabras.every(
    (w, p) => dichas.includes(p) || [...w].every((c, j) => !llevaRaya(c) || halladas.includes(lugar(p, j)))
  );
}

/**
 * Cómo se oye cada letra, en inglés y en español: la transcripción de
 * una letra dicha sale como la letra ("G.") o como su nombre ("Gee",
 * "jota").
 */
const NOMBRES: Record<string, string> = {
  ay: "a",
  bee: "b", be: "b",
  see: "c", sea: "c", ce: "c",
  dee: "d", de: "d",
  ee: "e",
  ef: "f", eff: "f", efe: "f",
  gee: "g", ge: "g", ji: "g",
  aitch: "h", eitch: "h", hache: "h", ache: "h",
  eye: "i",
  jay: "j", jota: "j",
  kay: "k", ka: "k",
  el: "l", ele: "l",
  em: "m", eme: "m",
  en: "n", ene: "n",
  oh: "o",
  pee: "p", pe: "p",
  cue: "q", queue: "q", cu: "q",
  ar: "r", are: "r", erre: "r", ere: "r",
  es: "s", ess: "s", ese: "s",
  tee: "t", tea: "t", te: "t",
  you: "u",
  vee: "v", ve: "v", uve: "v",
  "double u": "w", "double you": "w", "doble ve": "w", "doble u": "w", "doble uve": "w",
  ex: "x", equis: "x",
  why: "y", ye: "y", "i griega": "y",
  zee: "z", zed: "z", zeta: "z",
};

/**
 * La letra que dijo o escribió el alumno, si solo dijo una ("G", "the
 * letter G", "la jota"). Si dijo otra cosa, null.
 */
export function letraDicha(dicho: string): string | null {
  const t = base(dicho)
    .replace(/[^a-z\s]/g, " ")
    .replace(/\b(the|letter|la|letra)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/^[a-z]$/.test(t)) return t;
  return NOMBRES[t] ?? null;
}
