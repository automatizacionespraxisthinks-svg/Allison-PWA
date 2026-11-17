import { CATALOGO } from "./escenarios/datos.ts";
import { idiomaBase, tramosDeVoz, type IdiomaVoz, type SegmentoVoz } from "./habla.ts";
import { todaLaRuta } from "./ruta/index.ts";
import { VIAJES } from "./ruta/viajes.ts";

/**
 * Qué parte de lo que se dice va en inglés y qué parte en español, para
 * que la voz pronuncie cada una con su fonética (octubre de 2026).
 *
 * Los marcadores [es] / [en-US] separan las frases, pero dentro de una
 * explicación en español viene el inglés que se explica, casi siempre
 * sin marcar: "Para pedir se usa I'd like.", "Con los días se usa on.",
 * "Como fue ayer, se dice 'played'". Leído con la fonética del español,
 * "I'd like" sonaba "id lique": justo lo que el alumno tiene que oír bien.
 *
 * Solo en el SERVIDOR: el vocabulario sale del contenido de las tres
 * rutas, el catálogo y los viajes. El navegador recibe los segmentos ya
 * hechos (/api/voz) para su voz de respaldo.
 */

/**
 * Los campos del contenido que siempre están en inglés. Lo que el alumno
 * aprende es justo lo que aparece citado en las explicaciones.
 */
const CAMPOS_EN = new Set([
  "audio", "respuesta", "aceptadas", "frase", "palabraDificil", "modelo", "palabras", "partes", "siDice",
  "plantilla", "plantillas", "cosas", "palabrasAyuda", "pistas", "reacciones", "cierre", "guias", "verbos",
  "ayudas", "inicio",
]);

/** Inglés de todos los días, por si el contenido no lo trae. */
const COMUNES_EN = `i i'm i'd i'll i've you you're your he she it it's we we're they they're my his her its our
their me him us them this that these those the an and or but because if so to of in on at for from with
about into over under after before up down out is am are was were be been being do does did don't doesn't
didn't have has had having can can't could will won't would should must may might not what where when who
why how which there here very too also just only always never usually sometimes often again please thank
thanks yes hello hi bye goodbye sorry okay ok good great nice fine well like love want need go goes went
going come comes came eat ate drink play played plays say said tell told see saw look make made take took
get got give gave know think feel live work study speak talk read write walk run sleep wake buy pay
open close help try use wear wearing ask answer meet visit stay travel today tomorrow yesterday morning
afternoon evening night week year day time name friend family mother father sister brother school home
house water food breakfast lunch dinner some any many much more most every all no one two three four
five six seven eight nine ten old new big small happy sad hot cold let let's that's what's there's isn't
aren't wasn't weren't couldn't wouldn't shouldn't you'll we'll they'll he's she's you've we've they've`;

/**
 * Palabras que también son español y de todos los días en una explicación
 * ("va a", "no lleva", "son las tres"): solas no deciden el idioma, lo
 * deciden sus vecinas.
 */
const TAMBIEN_ESPANOL = new Set([
  "a", "no", "me", "son", "come", "once", "van", "era", "real", "dice", "sin", "solo", "red", "pie", "fin",
  "mesa", "pan", "plan", "idea", "final", "total", "normal", "general", "animal", "hotel", "doctor",
  "taxi", "radio", "piano", "banana", "chocolate", "hospital", "actor", "color", "error", "popular",
  "natural", "local", "similar", "simple", "terrible", "horrible", "festival", "musical", "tour", "favor",
  "plural", "singular", "regular", "irregular", "sale", "base", "plaza", "fiesta", "salsa", "patio", "amigo",
  "mango", "tango", "taco", "tacos", "arepa", "arepas", "burrito", "nachos",
  // Salen en el contenido en inglés, pero son español y no inglés
  // (noviembre de 2026): "una caja", "el ajiaco", "protector solar". Los
  // préstamos (pizza, bus, hockey) no van aquí: al final de una frase en
  // inglés ("Do you want pizza?") se pasaban al español.
  "caja", "ajiaco", "vallenato", "tenis", "solar",
]);

/** Las palabras que solo pueden ser español en una explicación (ni inglés ni dudosas). */
const SOLO_ESPANOL = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "y", "o", "que", "en", "es", "se",
  "por", "para", "con", "como", "pero", "su", "sus", "tu", "tus", "mi", "mis", "lo", "le", "les", "va", "dos",
  "tres", "muy", "bien", "hay", "este", "esta", "eso", "esto", "cuando", "porque", "ya", "si", "nos", "te",
  "ni", "pues", "entonces", "aqui", "tambien",
  // "Profesiones u ocupaciones": la "u" del español. La U del deletreo va
  // en mayúscula y dentro del inglés, que no se parte.
  "u",
]);

/** En el texto, las palabras con minúscula: las de mayúscula suelen ser nombres ("Juan", "Rosa"). */
const PALABRAS_MINUSCULA = /(?<![\p{L}'])[a-z][a-z']*/gu;

let vocabulario: Set<string> | null = null;

/** El inglés del contenido, recorrido una vez. */
function vocabularioIngles(): Set<string> {
  if (vocabulario) return vocabulario;
  const palabras = new Set(COMUNES_EN.split(/\s+/).filter(Boolean));
  // Lo que va entre paréntesis es acotación en español: "(pasa caminando)".
  const anotar = (texto: string) => {
    for (const p of texto.replace(/\([^)]*\)/g, " ").match(PALABRAS_MINUSCULA) ?? []) palabras.add(p.replace(/'+$/, ""));
  };
  const recorrer = (valor: unknown, campo: string, enDialogo: boolean): void => {
    if (typeof valor === "string") {
      if (CAMPOS_EN.has(campo) || (enDialogo && campo === "dice")) anotar(valor);
    } else if (Array.isArray(valor)) {
      for (const v of valor) recorrer(v, campo, enDialogo || campo === "dialogo");
    } else if (valor && typeof valor === "object") {
      for (const [k, v] of Object.entries(valor)) recorrer(v, k, enDialogo);
    }
  };
  recorrer(todaLaRuta(), "", false);
  recorrer(CATALOGO, "", false);
  recorrer(VIAJES.map((v) => ({ inicio: v.inicio })), "", false);
  for (const p of SOLO_ESPANOL) palabras.delete(p);
  vocabulario = palabras;
  return palabras;
}

type Clase = "en" | "es" | "duda";

/** Lo que dice una ficha ("'played',", "his;"), sin comillas ni signos alrededor. */
const nucleo = (ficha: string) =>
  ficha
    .replace(/^[¿¡"'“‘«(]+/, "")
    .replace(/[.,;:!?…"'”’»)]+$/, "")
    .toLowerCase();

function claseDe(ficha: string, ingles: Set<string>): Clase {
  const n = nucleo(ficha);
  if (!n || /\d/.test(n)) return "duda";
  // Un sufijo que se explica ("no lleva -s", "-ed", "-ing") se dice en inglés.
  if (/^-[a-z]{1,4}$/.test(n)) return "en";
  if (/[áéíóúñü]/.test(n) || SOLO_ESPANOL.has(n)) return "es";
  if (ingles.has(n)) return TAMBIEN_ESPANOL.has(n) ? "duda" : "en";
  // "T-shirts": inglés si alguna de sus partes lo es.
  if (n.includes("-") && n.split("-").some((p) => p.length > 1 && ingles.has(p))) return "en";
  if (TAMBIEN_ESPANOL.has(n)) return "duda";
  // Una palabra que no está en el contenido pero se escribe como el inglés
  // y nunca como el español ("weekend", "backpack", "shopping").
  return GRAFIA_INGLESA.test(n) ? "en" : "es";
}

/**
 * Letras que el español no usa: w, k, th, sh, ck, ph, gh, -ing, consonante
 * + y final. Sin "oo": "coordinadora", "cooperar".
 */
const GRAFIA_INGLESA = /w|k|th|sh|ck|ph|gh|ing$|[^aeiouy]y$/;

/** "He comido", "has visto": el "he" y el "has" del español, antes de un participio. */
const ANTES_DE_PARTICIPIO = /^(he|has|ha|hemos|han)$/;
const PARTICIPIO = /(ado|ido|ada|ida|ados|idos|adas|idas|cho|to|so)$/;

/** Un número al final de una frase en inglés ("I'm 15.") se dice en inglés. */
const NUMERO_FINAL = /^\d+[.!?…]["'”’»)]?$/;

const ABRE_CITA = /^[¿¡(]*["'“‘«]/;
const CIERRA_CITA = /["'”’»][.,;:!?…)]*$/;
/** "Suena 'pleid'": lo citado es cómo se pronuncia, escrito para leerlo en español. */
const ANTES_DE_PRONUNCIACION = /^(suena|suenan|pronuncia|pronuncias|pronuncian|como)$/;
/** "Significa 'sensato'", "para decir 'hay'": lo citado es el español que se traduce. */
const ANTES_DE_SIGNIFICADO = /^(significa|significan|decir|decimos|traduce|traducen|espa[ñn]ol)$/;
/** "«Nunca» se dice never": lo citado es el español que se va a decir en inglés. */
/** "'Embarazada' en inglés es…" sí; "'Sensible' en inglés significa…" no: esa cita es inglés. */
const DESPUES_DE_ESPANOL = /^(se (dice|dicen|traduce|traducen|escribe)|en ingl[eé]s (es|se))\b/;

/** Una palabra que solo puede ser español: con tilde o eñe, o de las que nunca son inglés. */
const esEspanolSeguro = (n: string) => /[áéíóúñü]/.test(n) || SOLO_ESPANOL.has(n);

/**
 * Parte un tramo en español donde viene inglés. Una cita en inglés
 * ("'played'", "'I just woke up'") va entera en inglés; fuera de las
 * citas, una racha de palabras inglesas ("I'd like", "he can speak"), sin
 * las dudosas de los bordes ("can no lleva" → "can").
 *
 * `delMensaje` es el inglés que el mismo mensaje dice en su parte en
 * inglés: "se usa 'pregnant'. [en-US] Say it: My sister is pregnant".
 */
function inglesDentroDelEspanol(texto: string, delMensaje: Set<string> = new Set()): SegmentoVoz[] {
  const contenido = vocabularioIngles();
  const ingles = delMensaje.size ? new Set([...contenido, ...delMensaje]) : contenido;
  const fichas = texto.split(/\s+/).filter(Boolean);
  const clases: Clase[] = fichas.map((f, i) =>
    ANTES_DE_PARTICIPIO.test(nucleo(f)) && PARTICIPIO.test(nucleo(fichas[i + 1] ?? "")) ? "es" : claseDe(f, ingles)
  );

  // Las citas: una sola clase para todas sus palabras.
  for (let i = 0; i < fichas.length; i++) {
    if (!ABRE_CITA.test(fichas[i])) continue;
    let fin = i;
    while (fin < fichas.length - 1 && !CIERRA_CITA.test(fichas[fin])) fin++;
    if (!CIERRA_CITA.test(fichas[fin])) break;
    const dentro = clases.slice(i, fin + 1);
    const anterior = i > 0 ? nucleo(fichas[i - 1]) : "";
    // "En lugar de 'perro'", "en vez de 'parque'": lo que el alumno dijo en español.
    const enLugarDe = i > 2 && /^en (lugar|vez) de$/.test(fichas.slice(i - 3, i).map(nucleo).join(" "));
    // Entre comillas, dentro del español, va el inglés que se explica
    // ("la palabra correcta es 'sensitive'"). Solo se queda en español
    // lo que no puede ser inglés, la pronunciación escrita ("suena
    // 'pleid'") y el significado ("significa 'sensato'"). Antes, una
    // palabra que no estaba en el contenido de las rutas se leía con la
    // fonética del español (producción, noviembre de 2026).
    const seguro = fichas.slice(i, fin + 1).some((f) => esEspanolSeguro(nucleo(f)));
    const espanol =
      seguro ||
      enLugarDe ||
      ANTES_DE_PRONUNCIACION.test(anterior) ||
      ANTES_DE_SIGNIFICADO.test(anterior) ||
      DESPUES_DE_ESPANOL.test(fichas.slice(fin + 1, fin + 4).map(nucleo).join(" "));
    // Una frase citada con alguna palabra que también es inglés: decide la
    // mayoría. "'Me gusta la pizza'" es español; "'I like this café'", inglés.
    const nEn = dentro.filter((c) => c === "en").length;
    const nEs = dentro.filter((c) => c === "es").length;
    // Una sola palabra desconocida con terminación del español ('hermana',
    // 'colegio', 'parques'): es la palabra del alumno, no inglés. Lo citado
    // en inglés casi siempre está en el contenido o en la parte inglesa.
    const terminacionEspanola =
      i === fin && dentro[0] === "es" && /^[a-záéíóúñ]+(a|o|as|os)$/.test(nucleo(fichas[i]));
    const clase: Clase = nEn
      ? seguro && nEs >= nEn
        ? "es"
        : "en"
      : espanol || terminacionEspanola
        ? "es"
        : "en";
    for (let k = i; k <= fin; k++) clases[k] = clase;
    i = fin;
  }

  // Las rachas: inglés y dudosas seguidas, con al menos una inglesa, sin
  // dudosas en los bordes.
  const idiomas: IdiomaVoz[] = clases.map(() => "es");
  for (let i = 0; i < clases.length; i++) {
    if (clases[i] === "es") continue;
    let fin = i;
    while (fin + 1 < clases.length && clases[fin + 1] !== "es") fin++;
    let a = i;
    let b = fin;
    while (a <= b && clases[a] === "duda") a++;
    while (b >= a && clases[b] === "duda" && !(b > a && NUMERO_FINAL.test(fichas[b]))) b--;
    for (let k = a; k <= b; k++) idiomas[k] = "en";
    i = fin;
  }

  const salida: SegmentoVoz[] = [];
  fichas.forEach((f, i) => {
    // El sufijo se dice sin el guion: "-s" → "s" (la letra, en inglés).
    const ficha = idiomas[i] === "en" ? f.replace(/^-(?=[a-z])/i, "") : f;
    const previo = salida.at(-1);
    if (previo?.idioma === idiomas[i]) previo.texto = `${previo.texto} ${ficha}`;
    else salida.push({ texto: ficha, idioma: idiomas[i] });
  });
  return salida;
}

/** Del español, pero también inglés corriente ("a hay ride", "see ya"): no deciden solas. */
const SOLO_ESPANOL_NO_EN_INGLES = new Set(["hay", "ya", "o", "u"]);

/**
 * La red de seguridad del lado inglés: si al modelo se le escapa español
 * en la parte inglesa ("You ate arepas con huevo!"; auditoría del 17 de
 * noviembre de 2026, 1 de 18 respuestas), ese pedazo va en español. Solo
 * lo deciden palabras en minúscula que no pueden ser inglés ("con", "de",
 * "pero", una tilde); a su lado se suman las desconocidas sin grafía
 * inglesa ("huevo"). Los nombres y las comidas sueltas ("Bogotá",
 * "arepas") siguen con acento inglés, que suena natural.
 */
function espanolDentroDelIngles(texto: string): SegmentoVoz[] {
  const ingles = vocabularioIngles();
  const fichas = texto.split(/\s+/).filter(Boolean);
  const minuscula = (f: string) => /^[¿¡"'“‘«(]*[a-záéíóúñü]/.test(f);
  const fuerte = fichas.map((f) => {
    const n = nucleo(f);
    if (!minuscula(f) || !n) return false;
    // Una tilde sola no decide: "café" también es inglés.
    if (/^[¿¡]/.test(f)) return true;
    return SOLO_ESPANOL.has(n) && !SOLO_ESPANOL_NO_EN_INGLES.has(n);
  });
  const vecina = (i: number) => {
    const n = nucleo(fichas[i]);
    return minuscula(fichas[i]) && !!n && !ingles.has(n) && !GRAFIA_INGLESA.test(n) && !/\d/.test(n);
  };
  const idiomas: IdiomaVoz[] = fichas.map(() => "en");
  for (let i = 0; i < fichas.length; i++) {
    if (!fuerte[i]) continue;
    let a = i;
    let b = i;
    while (a > 0 && (fuerte[a - 1] || vecina(a - 1)) && !/[.!?:;,]$/.test(fichas[a - 1])) a--;
    while (b < fichas.length - 1 && (fuerte[b + 1] || vecina(b + 1)) && !/[.!?:;,]$/.test(fichas[b])) b++;
    // Una palabrita sola ("de", "el") no basta: puede ser un nombre o un error de dedo.
    const fuertes = fuerte.slice(a, b + 1).filter(Boolean).length;
    if (b > a || (fuertes > 0 && (nucleo(fichas[i]).length >= 3 || /^[¿¡]/.test(fichas[i])))) {
      for (let k = a; k <= b; k++) idiomas[k] = "es";
    }
    i = b;
  }
  const salida: SegmentoVoz[] = [];
  fichas.forEach((f, i) => {
    const previo = salida.at(-1);
    if (previo?.idioma === idiomas[i]) previo.texto = `${previo.texto} ${f}`;
    else salida.push({ texto: f, idioma: idiomas[i] });
  });
  return salida;
}

/**
 * Los segmentos de un texto ya preparado (prepararParaVoz): los tramos de
 * sus marcadores y, dentro de los tramos en español, el inglés. En los
 * tramos en inglés solo se aparta el español que se le escapó al modelo
 * (espanolDentroDelIngles): un nombre o una comida en español ("arepas",
 * "Bogotá") suena natural con acento inglés.
 */
export function segmentosParaVoz(
  texto: string,
  idioma: IdiomaVoz | "auto" = "auto"
): { base: IdiomaVoz; segmentos: SegmentoVoz[] } {
  const base = idiomaBase(texto, idioma);
  // Un idioma pedido a la fuerza ("Y, Y." en inglés) no se revisa.
  const tramos = tramosDeVoz(texto, base).flatMap((t) =>
    t.idioma === "en" && idioma === "auto" ? espanolDentroDelIngles(t.texto) : [t]
  );
  // El inglés que el mensaje dice en sus tramos en inglés: con él se
  // reconoce la misma palabra citada en la explicación, aunque no esté en
  // el contenido (el alumno habla de lo que quiere).
  const delMensaje = new Set<string>();
  for (const t of tramos) {
    if (t.idioma !== "en") continue;
    for (const p of t.texto.replace(/\([^)]*\)/g, " ").match(PALABRAS_MINUSCULA) ?? []) {
      const palabra = p.replace(/'+$/, "");
      if (!SOLO_ESPANOL.has(palabra)) delMensaje.add(palabra);
    }
  }
  const segmentos: SegmentoVoz[] = [];
  for (const tramo of tramos) {
    for (const s of tramo.idioma === "es" ? inglesDentroDelEspanol(tramo.texto, delMensaje) : [tramo]) {
      const previo = segmentos.at(-1);
      if (previo?.idioma === s.idioma) previo.texto = `${previo.texto} ${s.texto}`;
      else segmentos.push({ ...s });
    }
  }
  return { base, segmentos };
}
