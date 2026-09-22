/**
 * Lo que se dice en voz alta, antes de mandarlo a la API de voz, y las
 * reglas del español dentro de lo que dice Allison. Sin base ni Next,
 * para que scripts/probar-voz.mjs y probar-prompt.mjs lo prueben con Node.
 */

/** Tope de lo que la app manda a sintetizar de una vez (la API admite 5000). */
export const TEXTO_VOZ_MAX = 3000;

export type IdiomaVoz = "en" | "es";

// ---------------------------------------------------------------------
//  Marcadores de idioma.
//
//  La API de voz cambia de idioma dentro de un mismo audio con un código
//  entre corchetes: "...the park. [es] Fuiste al parque. [en-US] Who...".
//  Allison los escribe en su respuesta para que su voz diga el español
//  en español; la pantalla NUNCA los muestra (quitarMarcadores) y a la
//  API solo le llegan los dos que Allison puede usar, normalizados.
// ---------------------------------------------------------------------
export const MARCADOR_ES = "[es]";
export const MARCADOR_EN = "[en-US]";

/** Cualquier código que la API reconoce, en cualquiera de sus grafías. */
const MARCADOR = /\[\s*(en[-_ ]?us|en[-_ ]?gb|es|fr|it|pt[-_ ]?br|hi|ja|zh)\s*\]/gi;

export function tieneMarcadores(texto: string): boolean {
  MARCADOR.lastIndex = 0;
  return MARCADOR.test(texto);
}

/** El texto tal como se muestra: sin marcadores y sin los espacios que dejan. */
export function quitarMarcadores(texto: string): string {
  return texto
    .replace(MARCADOR, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * El texto tal como va a la voz: solo [es] y [en-US], bien escritos.
 *
 * Cualquier otro código se quita (Allison no debe usarlos, y si el
 * modelo se equivoca es mejor seguir en el idioma vigente que cambiar
 * a japonés). Un marcador de inglés al principio sobra (la voz ya
 * empieza en inglés), y dos seguidos se reducen al último.
 */
export function normalizarMarcadores(texto: string): string {
  let salida = texto.replace(MARCADOR, (_, codigo: string) => {
    const c = codigo.toLowerCase().replace(/[-_ ]/g, "");
    if (c === "es") return ` ${MARCADOR_ES} `;
    if (c === "enus") return ` ${MARCADOR_EN} `;
    return " ";
  });
  // Varios marcadores seguidos: vale el último.
  salida = salida.replace(/(?:\[(?:es|en-US)\]\s*)+(\[(?:es|en-US)\])/g, "$1");
  // Un marcador de inglés antes del primer español está de más: la voz
  // ya va en inglés. Se quitan todos los que haya hasta ese punto.
  const primerEs = salida.indexOf(MARCADOR_ES);
  const antes = primerEs === -1 ? salida : salida.slice(0, primerEs);
  const despues = primerEs === -1 ? "" : salida.slice(primerEs);
  salida = antes.replace(/\s*\[en-US\]\s*/g, " ") + despues;
  // Al final, un marcador sin nada detrás no dice nada.
  salida = salida.replace(/\s*\[(?:es|en-US)\]\s*$/, "");
  return salida.replace(/\s+([.,;:!?])/g, "$1").replace(/\s+/g, " ").trim();
}

/** Las oraciones y los marcadores de un texto, como unidades sueltas. */
function trozos(texto: string): string[] {
  return texto.match(/\[(?:es|en-US)\]|[^.!?[]+[.!?]+["')]?|[^.!?[]+/g) ?? [];
}

/**
 * Sin frases repetidas.
 *
 * El modelo, a veces, dice lo mismo dos veces: repite su pregunta al
 * final, vuelve a decir en inglés lo que acaba de decir en español, o
 * pega la respuesta entera dos veces. Al alumno le llega un mensaje que
 * suena a máquina. Se conserva la primera vez que aparece cada oración
 * (sin distinguir mayúsculas ni puntuación) y se descartan las demás.
 */
export function sinRepeticiones(texto: string): string {
  const clave = (s: string) =>
    s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
  const vistas = new Set<string>();
  const salida: string[] = [];
  for (const parte of trozos(normalizarMarcadores(texto))) {
    const t = parte.trim();
    if (!t) continue;
    if (t === MARCADOR_ES || t === MARCADOR_EN) {
      salida.push(t);
      continue;
    }
    const k = clave(t);
    if (k.length > 0 && vistas.has(k)) continue;
    vistas.add(k);
    salida.push(t);
  }
  return normalizarMarcadores(salida.join(" "));
}

/**
 * Como máximo `maximo` tramos en español; los demás se quitan enteros,
 * con su texto. El prompt pide UNA frase en español por turno y solo al
 * corregir; si el modelo se pasa, el candado está aquí, antes de que
 * suene. Con 0 no queda español.
 */
export function limitarEspanol(texto: string, maximo = 1): string {
  let n = 0;
  const salida = normalizarMarcadores(texto).replace(
    /\[es\][^[]*(?:\[en-US\]|$)/g,
    (tramo) => (++n <= maximo ? tramo : " ")
  );
  return normalizarMarcadores(salida);
}

/** Sin ningún español: para los niveles donde Allison no lo usa. */
export function sinEspanol(texto: string): string {
  return limitarEspanol(texto, 0);
}

/**
 * Limpia el texto para que suene bien: el motor lee lo que ve, y un
 * asterisco de negrita o un emoji se convierten en ruido o en una
 * pausa rara. Los saltos de línea pasan a espacios; la puntuación se
 * conserva, que es lo que marca las pausas naturales. Los marcadores
 * de idioma sobreviven: se normalizan ANTES de llegar aquí.
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

/** Marcadores normalizados y texto limpio: lo que se le manda a la API. */
export function prepararParaVoz(texto: unknown): string {
  return typeof texto === "string" ? limpiarParaVoz(normalizarMarcadores(texto)) : "";
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
 * Para textos SIN marcadores (una palabra del glosario, una selección):
 * el alumno puede seleccionar un trozo en español y leerlo con fonética
 * inglesa suena a extranjero tropezando. La regla es conservadora: solo
 * se declara español con señales claras; ante la duda, inglés.
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

// ---------------------------------------------------------------------
//  Las señales que deciden cuánto español lleva la clase.
// ---------------------------------------------------------------------

/** Lo mínimo de un mensaje que hace falta para leer la conversación. */
export interface TurnoResumen {
  rol: "alumno" | "allison";
  texto: string;
  /** La versión con marcadores, si Allison usó español. */
  textoVoz?: string;
}

export interface SenalesEspanol {
  /** Turnos del alumno que se miraron. */
  turnos: number;
  /** Cuántos de esos turnos fueron en español o pidieron español. */
  pidioEspanol: number;
  /** En cuántas de sus respuestas recientes Allison usó español. */
  usoEspanol: number;
}

/** Lo que el alumno dice cuando quiere español o no entendió. */
const PIDE_ESPANOL =
  /\b(en\s+espa[ñn]ol|espa[ñn]ol|no\s+(te\s+)?entiendo|no\s+(te\s+)?entend[ií]|qu[eé]\s+significa|trad[uú]ce|m[aá]s\s+despacio|rep[ií]te(lo|me)?|no\s+s[eé]\s+qu[eé]\s+dijiste|in\s+spanish|i\s+don'?t\s+understand|say\s+it\s+in\s+spanish)\b/i;

/**
 * Cuenta, sobre los últimos turnos, cuántas veces el alumno se apoyó
 * en el español y cuántas Allison se lo dio. El prompt recibe los
 * números y decide con ellos: un alumno que lleva tres turnos pidiendo
 * español necesita otra cosa que más español.
 */
export function senalesDeEspanol(historial: TurnoResumen[], ventana = 10): SenalesEspanol {
  const delAlumno = historial.filter((m) => m.rol === "alumno").slice(-ventana);
  const deAllison = historial.filter((m) => m.rol === "allison").slice(-ventana);
  return {
    turnos: delAlumno.length,
    pidioEspanol: delAlumno.filter(
      (m) => idiomaDe(m.texto) === "es" || PIDE_ESPANOL.test(m.texto)
    ).length,
    usoEspanol: deAllison.filter((m) => tieneMarcadores(m.textoVoz ?? m.texto)).length,
  };
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
