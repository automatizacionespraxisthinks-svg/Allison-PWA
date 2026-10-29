/**
 * El mapa que la app dibuja con indicaciones en inglés (A1, parada 10).
 * En el escenario de San Francisco se va dibujando con lo que dice Carmen
 * ("Go straight one block and turn right. The bus stop is on the corner,
 * across from a café."); en Tu turno muestra los lugares ya dichos. Todo
 * es código, sin el modelo: se leen las frases y se traza el camino.
 * Probado en scripts/probar-ruta.mjs.
 */

export type Giro = "izquierda" | "derecha";
export type Paso = { derecho: number } | { gira: Giro };

/** Un lugar y lo que se dijo de él ("on the corner", "across from a café"). */
export interface LugarDicho {
  nombre: string;
  esquina?: boolean;
  lado?: Giro;
  frente?: string;
  junto?: string;
}

/** El mapa de una escena o de una actividad (tipos.ts lo usa en Tu turno y en el escenario). */
export interface MapaDeLaApp {
  /** El lugar al que llevan las indicaciones: queda al final del camino ("bus stop"). */
  meta: string;
  /** Adonde se llega al final, lejos: se dibuja arriba, al otro lado del agua ("Golden Gate Bridge"). */
  destino?: string;
  /** Lo que el mapa ya muestra, dicho en inglés (Tu turno). En la escena se dibuja con lo que dice Allison. */
  indicaciones?: string[];
}

export interface EstadoMapa {
  pasos: Paso[];
  lugares: LugarDicho[];
  /** Desde qué paso es nuevo: esa parte del camino se dibuja paso a paso. */
  nuevoDesde: number;
  /** Cambia cada vez que algo se vuelve a dibujar (también cuando lo repite). */
  vuelta: number;
}

export const MAPA_VACIO: EstadoMapa = { pasos: [], lugares: [], nuevoDesde: 0, vuelta: 0 };

/** Los lugares que se reconocen, con su nombre en el mapa. */
export const LUGARES: Record<string, { etiqueta: string; re: RegExp }> = {
  "bus stop": { etiqueta: "Bus stop", re: /\bbus stops?\b/g },
  café: { etiqueta: "Café", re: /\b(?:café|cafe|coffee shop)s?(?![a-zé])/g },
  drugstore: { etiqueta: "Drugstore", re: /\b(?:drugstore|pharmacy)s?\b/g },
  bank: { etiqueta: "Bank", re: /\bbanks?\b/g },
  hotel: { etiqueta: "Hotel", re: /\bhotels?\b/g },
  park: { etiqueta: "Park", re: /\bparks?\b/g },
  museum: { etiqueta: "Museum", re: /\bmuseums?\b/g },
  supermarket: { etiqueta: "Supermarket", re: /\bsupermarkets?\b/g },
  restaurant: { etiqueta: "Restaurant", re: /\brestaurants?\b/g },
  library: { etiqueta: "Library", re: /\blibrar(?:y|ies)\b/g },
  school: { etiqueta: "School", re: /\bschools?\b/g },
  "subway station": { etiqueta: "Subway", re: /\b(?:subway|metro)(?: station)?\b/g },
  bridge: { etiqueta: "Golden Gate Bridge", re: /\b(?:the )?golden gate(?: bridge)?\b|\bbridge\b/g },
};

const NUMEROS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };
const numero = (t?: string) => (t ? (NUMEROS[t] ?? Number(t)) || 1 : 1);

/** Minúsculas, apóstrofos rectos y sin puntos suspensivos ("Go straight… one block…"). */
function normalizar(t: string): string {
  return t
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/…|\.{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Seguir derecho (con sus cuadras, si las dice), girar, o "two blocks" suelto.
const MOVIMIENTO =
  /\b(?:go|walk|keep going|keep walking|continue)\s+(?:straight(?:\s+ahead)?|ahead|down (?:this|the) street|up (?:this|the) street|along (?:this|the) street)(?:[\s,]+(?:for\s+)?(one|two|three|four|five|a|an|\d)\s+blocks?)?|\b(?:turn|take a|make a|go)\s+(left|right)\b|\b(one|two|three|four|five|\d)\s+blocks?\b/g;

/** Los pasos de una línea, en orden. */
function pasosDe(t: string): Paso[] {
  const pasos: Paso[] = [];
  // "Go straight. It's two blocks.": las cuadras sueltas son las de ese derecho.
  let sinCuadras = -1;
  for (const m of t.matchAll(MOVIMIENTO)) {
    if (m[2]) {
      pasos.push({ gira: m[2] === "left" ? "izquierda" : "derecha" });
      sinCuadras = -1;
    } else if (m[3]) {
      if (sinCuadras >= 0) pasos[sinCuadras] = { derecho: numero(m[3]) };
      else pasos.push({ derecho: numero(m[3]) });
      sinCuadras = -1;
    } else {
      pasos.push({ derecho: numero(m[1]) });
      sinCuadras = m[1] ? -1 : pasos.length - 1;
    }
  }
  return pasos;
}

/** Lo que una frase dice de los lugares. `meta` es a quién se refiere "it". */
function lugaresDe(frase: string, meta: string): LugarDicho[] {
  // Cada lugar nombrado pasa a ser §n§, para leer la frase sin confundirse.
  const nombres: string[] = [];
  const hallados: { i: number; fin: number; nombre: string }[] = [];
  for (const [nombre, { re }] of Object.entries(LUGARES)) {
    for (const m of frase.matchAll(re)) {
      const i = m.index ?? 0;
      if (hallados.some((h) => i < h.fin && i + m[0].length > h.i)) continue;
      hallados.push({ i, fin: i + m[0].length, nombre });
    }
  }
  hallados.sort((a, b) => b.i - a.i);
  let t = frase;
  for (const h of hallados) {
    nombres.push(h.nombre);
    t = `${t.slice(0, h.i)}§${nombres.length - 1}§${t.slice(h.fin)}`;
  }
  const lugar = (n: string) => nombres[Number(n)];

  // De quién habla la frase: "There's a drugstore…", "The bus stop is…", o "It's…" (la meta).
  const sujetos = [
    ...[...t.matchAll(/\bthere(?:'s| is| are)\s+(?:an?\s+|some\s+)?§(\d+)§/g)].map((m) => ({ i: m.index ?? 0, nombre: lugar(m[1]) })),
    ...[...t.matchAll(/§(\d+)§\s+(?:is|are)\b/g)].map((m) => ({ i: m.index ?? 0, nombre: lugar(m[1]) })),
    ...[...t.matchAll(/\bit(?:'s| is)\b/g)].map((m) => ({ i: m.index ?? 0, nombre: meta })),
  ].sort((a, b) => a.i - b.i);
  const vistos = hallados.map((h) => ({ nombre: h.nombre })).filter((l) => l.nombre !== "bridge");
  const sujeto = sujetos[0];
  if (!sujeto || sujeto.nombre === "bridge") return vistos;

  const resto = t.slice(sujeto.i);
  const dicho: LugarDicho = { nombre: sujeto.nombre };
  if (/\b(?:on|at) the corner\b/.test(resto)) dicho.esquina = true;
  const lado = resto.match(/\bon (?:the|your) (left|right)\b/);
  if (lado) dicho.lado = lado[1] === "left" ? "izquierda" : "derecha";
  const frente = resto.match(/\b(?:across from|across the street from|opposite|in front of)\s+(?:the\s+|an?\s+)?§(\d+)§/);
  if (frente && lugar(frente[1]) !== sujeto.nombre) dicho.frente = lugar(frente[1]);
  const junto = resto.match(/\bnext to\s+(?:the\s+|an?\s+)?§(\d+)§/);
  if (junto && lugar(junto[1]) !== sujeto.nombre) dicho.junto = lugar(junto[1]);
  return [dicho, ...vistos.filter((l) => l.nombre !== sujeto.nombre)];
}

/** Lo que dice una línea: los pasos en orden y lo dicho de cada lugar. */
export function leerIndicaciones(texto: string, meta: string): { pasos: Paso[]; lugares: LugarDicho[] } {
  const t = normalizar(texto);
  const lugares: LugarDicho[] = [];
  for (const frase of t.split(/[.!?;]+/)) {
    for (const l of lugaresDe(frase, meta)) mezclar(lugares, l);
  }
  return { pasos: pasosDe(t), lugares };
}

function mezclar(lugares: LugarDicho[], l: LugarDicho) {
  const ya = lugares.find((x) => x.nombre === l.nombre);
  if (!ya) lugares.push({ ...l });
  else Object.assign(ya, Object.fromEntries(Object.entries(l).filter(([, v]) => v !== undefined)));
}

/** Un derecho seguido de otro es uno solo. */
function juntar(pasos: Paso[]): Paso[] {
  const r: Paso[] = [];
  for (const p of pasos) {
    const u = r[r.length - 1];
    if ("derecho" in p && u && "derecho" in u) r[r.length - 1] = { derecho: u.derecho + p.derecho };
    else r.push(p);
  }
  return r;
}

const igual = (a: Paso, b: Paso) =>
  "derecho" in a ? "derecho" in b && a.derecho === b.derecho : "gira" in b && a.gira === b.gira;
const empiezaCon = (a: Paso[], b: Paso[]) => b.length <= a.length && b.every((p, i) => igual(a[i], p));

/**
 * Suma una línea de Allison al mapa. Si repite el camino (o una parte),
 * se vuelve a dibujar entero; si lo repite y sigue, se dibuja lo nuevo; si
 * sigue ("Then turn left", o empieza girando), se agrega; si da otro
 * camino, lo reemplaza. Una línea sin indicaciones ni lugares no cambia nada.
 */
export function sumarLinea(e: EstadoMapa, linea: string, meta: string): EstadoMapa {
  const dicho = leerIndicaciones(linea, meta);
  const lugares = e.lugares.map((l) => ({ ...l }));
  for (const l of dicho.lugares) mezclar(lugares, l);
  const cambianLugares = JSON.stringify(lugares) !== JSON.stringify(e.lugares);
  if (!dicho.pasos.length) return cambianLugares ? { ...e, lugares, nuevoDesde: e.pasos.length, vuelta: e.vuelta + 1 } : e;

  const antes = e.pasos;
  const nuevos = juntar(dicho.pasos);
  const sigue = "gira" in nuevos[0] || /^\W*(?:then|and then|after that|and)\b/.test(normalizar(linea));
  let pasos: Paso[];
  let nuevoDesde: number;
  if (empiezaCon(antes, nuevos)) [pasos, nuevoDesde] = [antes, 0];
  else if (empiezaCon(nuevos, antes)) [pasos, nuevoDesde] = [nuevos, antes.length];
  else if (sigue && antes.length) [pasos, nuevoDesde] = [juntar([...antes, ...nuevos]), antes.length];
  else [pasos, nuevoDesde] = [nuevos, 0];
  return { pasos, lugares, nuevoDesde, vuelta: e.vuelta + 1 };
}

/** El mapa de varias líneas seguidas (lo que ya muestra Tu turno). */
export function mapaDe(lineas: string[], meta: string): EstadoMapa {
  return lineas.reduce((e, l) => sumarLinea(e, l, meta), MAPA_VACIO);
}

// ---------------------------------------------------------------------
//  El trazo: coordenadas del dibujo (unidades del SVG)
// ---------------------------------------------------------------------

export const CUADRA = 100;
export const MEDIA_CALLE = 9;
/** El edificio: largo a lo largo de la calle y fondo hacia adentro. */
export const EDIFICIO = { largo: 36, fondo: 28 };
/** Del centro de la calle al centro del edificio. */
const AL_LADO = MEDIA_CALLE + 5 + EDIFICIO.fondo / 2;
/** Los dos lotes de cada lado de una cuadra, desde la esquina. */
const LOTES = [0.31, 0.69];
/**
 * "You are here" está al pie de una cuadra: hasta el primer cruce hay
 * esto. Larga, para que lo que quede junto a esa esquina no tape el punto.
 */
const HASTA_EL_CRUCE = 0.9;

export interface Punto {
  x: number;
  y: number;
}

export interface LugarTrazado {
  nombre: string;
  etiqueta: string;
  x: number;
  y: number;
  /** La calle de enfrente va de lado a lado (el edificio se dibuja acostado). */
  horizontal: boolean;
  /** Hacia dónde queda la calle: la puerta y, del otro lado, el nombre. */
  calle: Punto;
  /**
   * En una calle de lado a lado, hacia dónde se alarga el nombre (-1 a la
   * izquierda, 1 a la derecha): el del lote de la esquina hacia la esquina
   * y el otro hacia afuera, así dos lotes seguidos no se tapan.
   */
  alarga: -1 | 0 | 1;
}

export interface Trazo {
  camino: Punto[];
  /** Desde qué punto del camino es nuevo. */
  nuevoDesde: number;
  lugares: LugarTrazado[];
  destino: (Punto & { etiqueta: string }) | null;
  /** El bus de la parada al destino. */
  bus: Punto[] | null;
  caja: { x: number; y: number; ancho: number; alto: number };
  calles: { x: number[]; y: number[]; desde: number };
}

interface Lote {
  esquina: Punto;
  /** A lo largo de la calle, alejándose de la esquina. */
  u: Punto;
  /** A la derecha de quien camina. */
  r: Punto;
  k: number;
  s: 1 | -1;
}

/** Dónde queda cada cosa: el camino desde "You are here" y los lugares alrededor de la meta. */
export function trazarMapa(e: EstadoMapa, mapa: Pick<MapaDeLaApp, "meta" | "destino">): Trazo {
  let x = 0;
  let y = 0;
  let h: Punto = { x: 0, y: -1 };
  let enCruce = false;
  let girando = false;
  const camino: Punto[] = [{ x, y }];
  const pasoAPunto: number[] = [];
  e.pasos.forEach((p, i) => {
    pasoAPunto[i] = camino.length - 1;
    if ("derecho" in p) {
      const largo = (enCruce ? p.derecho : p.derecho - 1 + HASTA_EL_CRUCE) * CUADRA;
      x += h.x * largo;
      y += h.y * largo;
      camino.push({ x, y });
      enCruce = true;
      girando = false;
    } else {
      h = p.gira === "derecha" ? { x: -h.y, y: h.x } : { x: h.y, y: -h.x };
      girando = true;
    }
  });

  const lugares: LugarTrazado[] = [];
  const lotes = new Map<string, Lote>();
  if (e.pasos.length) {
    const r = { x: -h.y, y: h.x };
    // Girando, la meta queda en la primera casa de la calle nueva; si no,
    // justo antes del cruce al que llegó.
    const u = girando ? h : { x: -h.x, y: -h.y };
    const esquina = { x, y };
    if (girando) camino.push({ x: x + u.x * LOTES[0] * CUADRA, y: y + u.y * LOTES[0] * CUADRA });
    const dichoMeta = e.lugares.find((l) => l.nombre === mapa.meta);
    lotes.set(mapa.meta, { esquina, u, r, k: 0, s: dichoMeta?.lado === "izquierda" ? -1 : 1 });
    // Lo que se ubica respecto de otro (frente, al lado), en varias vueltas.
    // Vale en los dos sentidos: "the bus stop is across from a café" pone el café.
    const ocupado = (k: number, s: number) => [...lotes.values()].some((o) => o.k === k && o.s === s);
    const frenteA = (o: Lote): Lote | null => (ocupado(o.k, -o.s) ? null : { ...o, s: o.s === 1 ? -1 : 1 });
    const juntoA = (o: Lote): Lote | null => (ocupado(1 - o.k, o.s) ? null : { ...o, k: 1 - o.k });
    for (let vuelta = 0; vuelta < 4; vuelta++) {
      for (const l of e.lugares) {
        if (l.nombre === "bridge") continue;
        const yo = lotes.get(l.nombre);
        const f = l.frente ? lotes.get(l.frente) : undefined;
        const j = l.junto ? lotes.get(l.junto) : undefined;
        let lote: Lote | null = null;
        if (!yo && f) lote = frenteA(f);
        if (!yo && !lote && j) lote = juntoA(j);
        if (lote) lotes.set(l.nombre, lote);
        else if (yo && l.frente && !f && l.frente !== "bridge") {
          const otro = frenteA(yo);
          if (otro) lotes.set(l.frente, otro);
        } else if (yo && l.junto && !j && l.junto !== "bridge") {
          const otro = juntoA(yo);
          if (otro) lotes.set(l.junto, otro);
        }
      }
    }
    for (const [nombre, o] of lotes) {
      const a = LOTES[o.k] * CUADRA;
      const cx = o.esquina.x + o.u.x * a;
      const cy = o.esquina.y + o.u.y * a;
      lugares.push({
        nombre,
        etiqueta: LUGARES[nombre]?.etiqueta ?? nombre,
        x: cx + o.r.x * o.s * AL_LADO,
        y: cy + o.r.y * o.s * AL_LADO,
        horizontal: o.u.y === 0,
        alarga: o.u.y !== 0 ? 0 : o.k === 0 ? (o.u.x > 0 ? -1 : 1) : o.u.x > 0 ? 1 : -1,
        calle: { x: cx, y: cy },
      });
    }
  }

  // Los límites del dibujo: el camino, los lugares y "You are here" con su nombre.
  const xs = [...camino.map((p) => p.x), ...lugares.flatMap((l) => [l.x - 70, l.x + 70]), -20, 125];
  const ys = [...camino.map((p) => p.y), ...lugares.flatMap((l) => [l.y - 30, l.y + 30]), 30];
  let destino: Trazo["destino"] = null;
  let bus: Trazo["bus"] = null;
  if (mapa.destino) {
    const fin = camino[camino.length - 1];
    // El bus sigue por la calle hasta el cruce y sube por la calle hasta el
    // agua: no pasa por encima de los edificios.
    const cruce = h.y === 0 ? (h.x > 0 ? Math.floor(fin.x / CUADRA + 1) : Math.ceil(fin.x / CUADRA - 1)) * CUADRA : fin.x;
    const arriba = Math.min(...ys) - CUADRA;
    destino = { x: e.pasos.length ? cruce : 0, y: arriba, etiqueta: mapa.destino };
    xs.push(destino.x - 85, destino.x + 85);
    ys.push(destino.y - 45);
    if (lotes.has(mapa.meta)) bus = [fin, ...(cruce !== fin.x ? [{ x: cruce, y: fin.y }] : []), { x: cruce, y: arriba + 24 }];
  }
  const margen = 14;
  let x0 = Math.min(...xs) - margen;
  let x1 = Math.max(...xs) + margen;
  // Ni muy angosto ni muy bajo: se ven las calles de alrededor.
  if (x1 - x0 < 300) [x0, x1] = [(x0 + x1) / 2 - 150, (x0 + x1) / 2 + 150];
  const y0 = Math.min(...ys) - margen;
  const y1 = Math.max(...ys) + margen;
  /** Las calles entre a y b, cada cuadra, corridas `desfase`. */
  const entre = (a: number, b: number, desfase = 0) => {
    const r: number[] = [];
    for (let v = Math.ceil((a - desfase) / CUADRA) * CUADRA + desfase; v <= b; v += CUADRA) r.push(v);
    return r;
  };
  return {
    camino,
    nuevoDesde: e.nuevoDesde < e.pasos.length ? pasoAPunto[e.nuevoDesde] : camino.length - 1,
    lugares,
    destino,
    bus,
    caja: { x: x0, y: y0, ancho: x1 - x0, alto: y1 - y0 },
    calles: {
      x: entre(x0 - MEDIA_CALLE, x1 + MEDIA_CALLE),
      // Las de lado a lado, de "You are here" para arriba (debajo del punto no hay calle).
      y: entre(y0 - MEDIA_CALLE, y1 + MEDIA_CALLE, -HASTA_EL_CRUCE * CUADRA).filter((v) => v < -MEDIA_CALLE * 2),
      desde: destino ? destino.y + 30 : y0,
    },
  };
}
