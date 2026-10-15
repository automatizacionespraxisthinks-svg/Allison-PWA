/**
 * Las reglas de lo que se puede guardar en el glosario. Sin base ni
 * Next, para que scripts/probar-glosario.mjs las pruebe con Node a secas.
 */

/** Se guardan palabras y frases, no párrafos. */
export const FRASE_MAX = 200;
/** La frase completa de donde salió, para recordar el uso. */
export const CONTEXTO_MAX = 600;
/** Tope por alumno: más que suficiente para estudiar, poco para abusar. */
export const GLOSARIO_MAX = 1000;

/** Colapsa espacios y saltos y recorta: "  good \n morning " → "good morning". */
export function normalizarFrase(texto: unknown): string {
  return typeof texto === "string" ? texto.replace(/\s+/g, " ").trim() : "";
}

/** Por qué una frase no se puede guardar, o null si sirve. */
export function validarFrase(texto: string): string | null {
  if (!texto) return "Selecciona una palabra o una frase";
  if (texto.length > FRASE_MAX) {
    return `Máximo ${FRASE_MAX} caracteres: guarda palabras y frases, no párrafos`;
  }
  if (!/\p{L}/u.test(texto)) return "Eso no tiene letras";
  return null;
}

/** El contexto, limpio y acotado; null si no hay. */
export function recortarContexto(texto: unknown): string | null {
  const t = normalizarFrase(texto);
  if (!t) return null;
  return t.length <= CONTEXTO_MAX ? t : `${t.slice(0, CONTEXTO_MAX - 1)}…`;
}
