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
    // Una o dos palabras se repiten a propósito: "School. Say it with
    // me: school." Solo se quitan las frases repetidas más largas.
    if (k.split(" ").length > 2 && vistas.has(k)) continue;
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

/** Termina en un signo (con su comilla o paréntesis de cierre, si lo lleva). */
const TERMINA_CON_SIGNO = /[.!?…:;,]["'”’»)]?$/;

/**
 * La frase con su punto final si no tenía ningún signo: "Nice to meet
 * you" seguido de "Say it:" se oye como una sola frase, sin pausa.
 */
export function conPunto(frase: string): string {
  const t = frase.trim();
  return !t || TERMINA_CON_SIGNO.test(t) ? t : `${t}.`;
}

/**
 * La puntuación como la necesita la voz: la API no tiene marcas de
 * pausa, así que las pausas salen SOLO de los signos (octubre de 2026).
 *   · Un salto de línea sin signo al final es una pausa: se vuelve punto.
 *   · Tres puntos o más son puntos suspensivos; dos, un punto; y el punto
 *     pegado a otro signo sobra ("Can I try it on?." → "Can I try it on?",
 *     "Good morning.!" → "Good morning!").
 *   · Sin espacio después del signo, la voz junta las frases ("Hi!How").
 *     Solo tras una minúscula: "U.S.A." se queda como está.
 */
export function puntuarParaVoz(texto: string): string {
  return texto
    .replace(/([^\s.!?…:;,"'”’»)])(["'”’»)]?)[ \t]*(?:\r?\n)+/g, "$1$2. ")
    .replace(/\.{3,}/g, "…")
    .replace(/\.\./g, ".")
    .replace(/([!?…])\./g, "$1")
    .replace(/\.([!?])/g, "$1")
    .replace(/(?<=[a-záéíóúñ"'”’)])([.!?…;:])(?=[A-ZÁÉÍÓÚÑ¿¡])/g, "$1 ");
}

/**
 * Limpia el texto para que suene bien: el motor lee lo que ve, y un
 * asterisco de negrita o un emoji se convierten en ruido o en una
 * pausa rara. Los saltos de línea se vuelven pausas (puntuarParaVoz) y
 * la puntuación se conserva, que es lo que marca las pausas naturales.
 * Los marcadores de idioma sobreviven.
 */
export function limpiarParaVoz(texto: unknown): string {
  if (typeof texto !== "string") return "";
  return puntuarParaVoz(
    texto
      // Marcas de formato que a veces se cuelan en un texto generado
      .replace(/[*_`#>~]+/g, " ")
      // Emojis y pictogramas: el motor no los pronuncia, los tropieza
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, " ")
      .replace(/[ \t]+/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Texto limpio y marcadores normalizados: lo que se le manda a la API. */
export function prepararParaVoz(texto: unknown): string {
  return typeof texto === "string" ? normalizarMarcadores(limpiarParaVoz(texto)) : "";
}

/** Una parte de lo que se dice, toda en un idioma. */
export interface SegmentoVoz {
  texto: string;
  idioma: IdiomaVoz;
}

/**
 * En qué idioma empieza un texto. Con marcadores es una respuesta de
 * Allison, que empieza en inglés, salvo que se haya pedido en español.
 */
export function idiomaBase(texto: string, idioma: IdiomaVoz | "auto" = "auto"): IdiomaVoz {
  if (idioma !== "auto") return idioma;
  return tieneMarcadores(texto) ? "en" : idiomaDe(texto);
}

/**
 * Los tramos de un texto según sus marcadores ([es] … [en-US] …), cada
 * uno con su idioma; lo que va antes del primero, en `base`. Cada tramo
 * que da paso a otro idioma termina en un signo: sin él la voz pasaba de
 * un idioma al otro sin respirar ("…en pasado [en-US] Now try" → "…en
 * pasado. Now try").
 */
export function tramosDeVoz(texto: string, base: IdiomaVoz): SegmentoVoz[] {
  const salida: SegmentoVoz[] = [];
  let idioma = base;
  for (const parte of normalizarMarcadores(texto).split(/(\[es\]|\[en-US\])/)) {
    if (parte === MARCADOR_ES) idioma = "es";
    else if (parte === MARCADOR_EN) idioma = "en";
    else if (parte.trim()) {
      const previo = salida.at(-1);
      if (previo?.idioma === idioma) previo.texto = `${previo.texto} ${parte.trim()}`;
      else salida.push({ texto: parte.trim(), idioma });
    }
  }
  for (const s of salida.slice(0, -1)) s.texto = conPunto(s.texto);
  return salida;
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
export function tiempoDeEsperaMs(texto: string, velocidad = 1): number {
  return Math.round((2 * (estimarSegundos(texto) / velocidad) + 30) * 1000);
}

/**
 * La velocidad que se le pide a la API: entre 0,5 y 2 (lo que acepta),
 * con dos decimales. Redondeada, la misma velocidad pide siempre el
 * mismo audio y la caché del servicio lo encuentra (0,8 × 0,7 da
 * 0,5599999…, que sería otro audio distinto de 0,56).
 */
export function velocidadParaVoz(velocidad: unknown): number {
  const v = typeof velocidad === "number" && Number.isFinite(velocidad) ? velocidad : 1;
  return Math.round(Math.min(2, Math.max(0.5, v)) * 100) / 100;
}

/** Un X-Request-ID válido para la API: alfanumérico con - _ . :, máximo 64. */
export function nuevoIdPeticion(): string {
  return `allison-${crypto.randomUUID()}`;
}
