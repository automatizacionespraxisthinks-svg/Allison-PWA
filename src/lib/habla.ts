/**
 * Lo que se dice en voz alta, antes de mandarlo a la API de voz. Sin
 * base ni Next, para que scripts/probar-voz.mjs lo pruebe con Node.
 */

/** Tope de lo que la app manda a sintetizar de una vez (la API admite 5000). */
export const TEXTO_VOZ_MAX = 3000;

export type IdiomaVoz = "en" | "es";

/**
 * Limpia el texto para que suene bien: el motor lee lo que ve, y un
 * asterisco de negrita o un emoji se convierten en ruido o en una
 * pausa rara. Los saltos de línea pasan a espacios; la puntuación se
 * conserva, que es lo que marca las pausas naturales.
 */
export function limpiarParaVoz(texto: unknown): string {
  if (typeof texto !== "string") return "";
  return (
    texto
      // Marcas de formato que a veces se cuelan en un texto generado
      .replace(/[*_`#>~]+/g, " ")
      // Emojis y pictogramas: el motor no los pronuncia, los tropieza
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

const PALABRAS_ES = new Set([
  "el", "la", "los", "las", "un", "una", "de", "del", "que", "qué", "y", "es",
  "en", "no", "sí", "por", "para", "con", "como", "cómo", "pero", "esto", "eso",
  "muy", "más", "tu", "su", "mi", "hola", "gracias", "bien", "está", "están",
  "tiene", "puedes", "quiero", "tengo", "hay", "cuando", "cuándo", "dónde",
]);

const PALABRAS_EN = new Set([
  "the", "a", "an", "and", "is", "are", "you", "your", "i", "it", "to", "of",
  "in", "on", "for", "with", "that", "this", "what", "how", "do", "does",
  "did", "have", "has", "was", "were", "not", "very", "good", "great", "let's",
  "we", "they", "he", "she", "my", "me", "can", "will", "about", "like",
]);

/**
 * ¿En qué idioma hay que leer esto?
 *
 * Allison responde siempre en inglés, pero el alumno puede seleccionar
 * un trozo en español (la explicación de una corrección) o escribir uno
 * en su glosario, y leerlo con voz y fonética inglesas suena a
 * extranjero tropezando. La regla es conservadora: solo se declara
 * español con señales claras; ante la duda, inglés.
 */
export function idiomaDe(texto: string): IdiomaVoz {
  if (/[¿¡ñÑ]/.test(texto)) return "es";
  const palabras = texto
    .toLowerCase()
    .split(/[^a-záéíóúü']+/)
    .filter((p) => p.length > 0);
  let es = 0;
  let en = 0;
  for (const p of palabras) {
    if (PALABRAS_ES.has(p)) es++;
    else if (PALABRAS_EN.has(p)) en++;
  }
  if (es >= 2 && es > en) return "es";
  if (es > 0 && en === 0 && /[áéíóú]/.test(texto)) return "es";
  return "en";
}

/**
 * Cuánto audio produce un texto, en segundos. La guía de la API da
 * ~19 s por 300 caracteres y ~60 s por 1000: unos 15 caracteres por
 * segundo. Sirve para dimensionar la espera, no para prometer nada.
 */
export function estimarSegundos(texto: string): number {
  return Math.max(1, Math.ceil(texto.length / 15));
}

/**
 * El tiempo de espera del cliente, dimensionado al audio esperado como
 * pide la guía: dos veces la duración estimada más treinta segundos.
 * La API genera casi en tiempo real, así que un tope fijo y corto
 * cortaría justo las respuestas largas.
 */
export function tiempoDeEsperaMs(texto: string): number {
  return (2 * estimarSegundos(texto) + 30) * 1000;
}

/** Un X-Request-ID válido para la API: alfanumérico con - _ . :, máximo 64. */
export function nuevoIdPeticion(): string {
  return `allison-${crypto.randomUUID()}`;
}
