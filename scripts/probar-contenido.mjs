/**
 * El contenido de la ruta (src/lib/ruta), sin red: que cada parada
 * tenga la forma aprobada, que cada actividad traiga lo que su pantalla
 * y la evaluación corta necesitan, que existan sus ilustraciones y que
 * el inglés sea de Estados Unidos.
 *
 *   node scripts/probar-contenido.mjs              todas las paradas
 *   node scripts/probar-contenido.mjs parada-03    solo un archivo
 *
 * A2 se revisa con sus reglas (Contenido A2): Responde rápido de 15
 * segundos, la lección 4 cierra con Adivina en las paradas impares y con
 * la Entrevista en las pares, y un Cuéntame por parada. Sus ilustraciones
 * se producen aparte: si falta una de A2 o B1 es un aviso, no un fallo.
 *
 * B1 se revisa con las suyas (Contenido B1): Escucha y elige sin
 * traducción, una sola pista en ¿Qué es esto?, Dilo sin palabras de apoyo
 * y con sus dos partes, Responde rápido de 20 segundos, Cuéntame de un
 * minuto, una Narra la secuencia por parada, la lección 4 con Enséñale a
 * Allison en las impares y la Entrevista en las pares, las explicaciones
 * en inglés con su traducción, y el escenario con su imprevisto y un
 * mínimo de 12 intervenciones.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { contieneAlguna, cosasNombradas, normalizar } = await import("../src/lib/evaluacion.ts");
/** Las palabras tal como están escritas: minúsculas, sin signos, con sus apóstrofos. */
const tal = (t) => ` ${t.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim()} `;
const { respuestaCorta } = await import("../src/lib/ruta/adivina.ts");

const NIVELES = [
  { nivel: "A1", dir: "src/lib/ruta/a1" },
  { nivel: "A2", dir: "src/lib/ruta/a2" },
  { nivel: "B1", dir: "src/lib/ruta/b1" },
];
/** Dónde puede estar cada ilustración, por nivel. */
const IMAGENES = {
  a1: ["public/ilustraciones/a1", "ilustraciones-a1/originales", "ilustraciones-a1/ampliadas"],
  // Las fichas de los personajes (referencia-*) quedan en referencias/: no salen en la app.
  a2: ["public/ilustraciones/a2", "ilustraciones-a2/referencias"],
  b1: ["public/ilustraciones/b1", "ilustraciones-b1/referencias"],
};
/** El nivel del archivo que se revisa ahora (las reglas cambian un poco en A2 y en B1). */
let nivelActual = "A1";
const solo = process.argv[2];

/** Palabras británicas o que no se enseñan (plan: inglés de Estados Unidos siempre). */
const BRITANICO =
  /\b(mum|mummy|colour|favourite|flat|football|holiday|autumn|lift|biscuits?|trousers|rubbish|queue|centre|neighbour|realise|organise|theatre|grey|maths|petrol|motorway|pavement|crisps|sweets|cinema|mobile phone|have got|has got|'ve got|'s got)\b/i;

/** "It's flat!" de una llanta es de Estados Unidos: no es el "flat" (apartamento) británico. */
const esBritanico = (t) => BRITANICO.test(String(t).replace(/\bflat (tire|tyre)\b|\b(tire|it)('s| is) flat\b/gi, ""));

/** B1 en adelante: Allison explica en inglés, sin palabras de apoyo ni traducciones. */
const desdeB1 = () => nivelActual !== "A1" && nivelActual !== "A2";

let fallos = 0;
let avisos = 0;
const fallo = (donde, msg) => {
  console.log(`  FALLO ${donde}: ${msg}`);
  fallos++;
};
const aviso = (donde, msg) => {
  console.log(`  aviso ${donde}: ${msg}`);
  avisos++;
};

/** Los tipos que pasan por la evaluación corta o la conversación: necesitan saber qué más vale. */
const EVALUADAS = new Set(["que-es-esto", "dilo", "describe", "responde", "tu-turno", "entrevista", "adivina", "cuentame", "narra"]);

/** Palabras que delatan un texto en español ("Cualquier pregunta que se entienda", "Respuestas cortas"). */
const ESPANOL = /[áéíóúñ¿¡]|\b(cualquier|cualquiera|solo|respuestas?|frases?|cortas?|completas?|que|de|del|el|la|los|las|con|sin|sobre|y|o)\b/i;

/** "f-tenis" es de la carpeta del nivel; "a1/f-tenis", de A1 aunque se use en A2. */
function existeImagen(nombre) {
  const [carpeta, archivo] = nombre.includes("/") ? nombre.split("/") : [nivelActual.toLowerCase(), nombre];
  return (IMAGENES[carpeta] ?? []).some((d) => existsSync(join(d, `${archivo}.webp`)) || existsSync(join(d, `${archivo}.png`)));
}

/** Los textos en inglés de una actividad (donde se buscan palabras británicas). */
function inglesDe(a) {
  const t = [];
  const add = (x) => x && t.push(...(Array.isArray(x) ? x : [x]));
  add(a.audio);
  add(a.pregunta && a.tipo !== "escucha-elige" ? a.pregunta : null);
  add(a.respuesta);
  add(a.aceptadas);
  add(a.pistas);
  add(a.frase);
  add(a.plantilla);
  add(a.modelo);
  add(a.plantillas);
  add(a.palabrasAyuda);
  add(a.palabras);
  add(a.cosas);
  add(a.dialogo?.map((d) => d.dice));
  add(a.preguntas?.flatMap((p) => [p.pregunta, p.modelo]));
  add(a.datos?.flatMap((d) => [d.pregunta, d.respuesta]));
  add(a.apertura);
  add(a.adivinar);
  add(a.secreto);
  if (a.tipo === "adivina") add(a.opciones?.map((o) => o.nombre));
  if (a.tipo !== "ensenale") add(a.tema);
  add(a.guias);
  // B1: lo que explica Allison va en inglés (la traducción, en `es`).
  if (desdeB1()) {
    add(a.explicaciones?.map((x) => x.explicacion));
    add(a.consejo);
  }
  add(a.preguntas?.map((p) => p.simple));
  add(a.reacciones);
  add(a.cierre);
  add(a.otraPregunta);
  add(a.respuestasDeAllison?.map((x) => x.respuesta));
  add(a.debajo);
  add(a.verbos);
  return t;
}

/**
 * Una sola voz (17-oct-2026): la app tiene la voz de Allison, que es una
 * mujer. En Escucha y elige no se ve quién habla, así que todo lo dice
 * Allison (lo que dice otro va contado o citado: Ben says: "…"). Solo un
 * anuncio sin persona puede sonar tal cual. En Tu turno y en los
 * escenarios Allison hace un papel con nombre, y tiene que ser de mujer.
 */
const PAPEL_DE_HOMBRE =
  /\bMr\.|^(el|un) |\b(el|un) (agente|empleado|mesero|farmacéutico|vendedor|recepcionista|médico|doctor|conductor|policía|profesor|compañero|guía|señor)\b|^(Tom|Leo|Ben|Noah|Jack|Ethan|Arjun|Mark)\b/i;
function revisarVoz(a, donde) {
  if (a.tipo === "escucha-elige" && a.quienHabla !== "Allison" && !/anuncio/i.test(a.quienHabla ?? ""))
    fallo(donde, `en Escucha y elige habla "${a.quienHabla}": la única voz es Allison (cuéntalo o cítalo)`);
  if (a.tipo === "tu-turno")
    for (const l of a.dialogo ?? []) if (PAPEL_DE_HOMBRE.test(l.quien)) fallo(donde, `"${l.quien}" habla con la voz de Allison: el papel tiene que ser de mujer`);
  // En Adivina, Allison es la tarjeta de cada ronda ("Who was I?"): tampoco puede ser un hombre.
  if (a.tipo === "adivina")
    for (const r of a.rondas ?? []) {
      const deHombre = (a.preguntas ?? []).some((p) => /\b(a man|a boy)\b/i.test(p.pregunta) && p.si.includes(r));
      if (PAPEL_DE_HOMBRE.test(r) || deHombre) fallo(donde, `en la ronda "${r}" Allison sería un hombre: el papel tiene que ser de mujer`);
    }
}

function revisarActividad(a, donde, imagenes) {
  revisarVoz(a, donde);
  if (!a.queAparece?.trim()) fallo(donde, "falta queAparece");
  if (!a.siRespondeMal?.trim()) fallo(donde, "falta siRespondeMal");
  for (const s of inglesDe(a)) if (s && esBritanico(s)) fallo(donde, `inglés británico: "${s}"`);
  // B1: cada explicación en inglés lleva su traducción para «En español».
  if (desdeB1()) {
    for (const x of a.explicaciones ?? []) if (!x.es?.trim()) aviso(donde, `la explicación "${x.explicacion}" no tiene su traducción (es)`);
    if (a.tipo === "repite" && a.consejo && !a.consejoEs?.trim()) aviso(donde, "el consejo en inglés no tiene su traducción (consejoEs)");
  }

  // "También se acepta" como regla: el texto del documento, en español. Las
  // formas concretas en inglés van en aceptadas.
  if (a.tambienSeAcepta !== undefined) {
    if (typeof a.tambienSeAcepta !== "string" || !a.tambienSeAcepta.trim()) fallo(donde, "tambienSeAcepta vacío");
    // Narra (B1) trae ejemplos de relatos en inglés en esa celda: no hay campo aparte para ellos.
    else if (a.tipo !== "narra" && !ESPANOL.test(a.tambienSeAcepta))
      aviso(donde, `tambienSeAcepta no parece español ("${a.tambienSeAcepta}"); las formas en inglés van en aceptadas`);
  }
  // Sin formas concretas ni regla, la evaluación solo aceptaría la respuesta esperada.
  if (EVALUADAS.has(a.tipo) && !a.aceptadas?.length && !a.tambienSeAcepta)
    aviso(donde, "aceptadas vacío y sin tambienSeAcepta: solo valdría la respuesta esperada");

  switch (a.tipo) {
    case "escucha-elige":
      if (!a.audio?.length) fallo(donde, "sin audio");
      if (desdeB1()) {
        // B1: una historia de tres o cuatro frases, sin traducción.
        if (a.traduccion?.length) fallo(donde, "B1 no lleva traducción (traduccion: [])");
        if (a.audio.length < 3 || a.audio.length > 4) aviso(donde, `la historia tiene ${a.audio.length} frases (B1: tres o cuatro)`);
      } else if (a.traduccion?.length !== a.audio?.length) fallo(donde, "cada línea de audio necesita su traducción");
      if (a.opciones?.length !== 3) fallo(donde, `tiene ${a.opciones?.length} opciones, deben ser 3`);
      if (!(a.correcta >= 0 && a.correcta < (a.opciones?.length ?? 0))) fallo(donde, "correcta fuera de rango");
      a.opciones?.forEach((o) => {
        if (o.imagen) imagenes.push(o.imagen);
        else if (!o.texto?.trim() && !o.descripcion?.trim()) fallo(donde, "una opción sin imagen ni texto");
      });
      {
        const conEtiqueta = (a.opciones ?? []).filter((o) => o.etiqueta?.trim()).length;
        if (conEtiqueta && conEtiqueta !== a.opciones.length) fallo(donde, "la etiqueta va en las tres opciones o en ninguna");
        if ((a.opciones ?? []).some((o) => Math.max(o.etiqueta?.length ?? 0, o.etiquetaEs?.length ?? 0) > 22))
          aviso(donde, "una etiqueta de más de dos líneas no cabe debajo del dibujo");
        // La etiqueta va en inglés y se traduce con un toque (28 de octubre de 2026).
        for (const o of a.opciones ?? []) {
          if (!o.etiqueta?.trim()) continue;
          if (!o.etiquetaEs?.trim()) fallo(donde, `la etiqueta "${o.etiqueta}" no tiene traducción (etiquetaEs)`);
          if (/[áéíóúñ¿¡]/i.test(o.etiqueta)) fallo(donde, `la etiqueta "${o.etiqueta}" parece en español: va en inglés`);
        }
        if (conEtiqueta && desdeB1()) aviso(donde, "B1 no lleva texto a la vista (etiqueta)");
      }
      break;
    case "que-es-esto":
      if (!a.respuesta?.trim()) fallo(donde, "sin respuesta");
      if (!a.pistas?.length || a.pistas.length > 3) fallo(donde, `tiene ${a.pistas?.length} pistas (1 a 3)`);
      if (a.contexto !== undefined && !a.contexto.trim()) fallo(donde, "el contexto está vacío");
      if (a.contexto && desdeB1()) aviso(donde, "B1 no lleva la situación en español (contexto)");
      if (desdeB1() && a.pistas?.length !== 1) aviso(donde, `tiene ${a.pistas?.length} pistas (B1: una sola)`);
      if (a.imagen) imagenes.push(a.imagen);
      else if (!a.texto?.trim()) fallo(donde, "sin imagen ni texto de lo que dibuja la app");
      break;
    case "repite":
      if (!a.frase?.trim()) fallo(donde, "sin frase");
      // Como está escrita: abierta sola, "she'd" sería "she would", y en la
      // frase ("she'd already left") es "she had".
      if (a.palabraDificil && !tal(a.frase).includes(tal(a.palabraDificil)))
        fallo(donde, `la palabra difícil "${a.palabraDificil}" no está en la frase`);
      break;
    case "tu-turno":
      if (!a.dialogo?.length) fallo(donde, "sin diálogo");
      if (!a.plantilla?.includes("___") && !a.plantilla?.trim()) fallo(donde, "sin plantilla");
      if (!a.modelo?.trim()) fallo(donde, "sin modelo");
      break;
    case "dilo": {
      if (!a.espanol?.trim() || !a.respuesta?.trim()) fallo(donde, "falta espanol o respuesta");
      if (desdeB1()) {
        // B1: sin palabras de apoyo; la frase tiene dos partes y al fallar se da la primera palabra de la que falló.
        if (a.palabras?.length) fallo(donde, "B1 no lleva palabras de apoyo (palabras: [])");
        if (a.partes?.length !== 2) fallo(donde, `tiene ${a.partes?.length ?? 0} partes (B1: dos)`);
        else if (a.partes.join(" ") !== a.respuesta) fallo(donde, "las dos partes juntas no son la respuesta");
      } else {
        const deRespuesta = normalizar(a.respuesta).trim().split(" ").sort().join(" ");
        const dePalabras = normalizar(a.palabras.join(" ")).trim().split(" ").sort().join(" ");
        if (deRespuesta !== dePalabras) fallo(donde, `las palabras de apoyo no son las de la respuesta: [${a.palabras}]`);
      }
      if (!contieneAlguna(a.respuesta, [a.respuesta, ...a.aceptadas])) fallo(donde, "la respuesta no se acepta a sí misma");
      if (a.imagen) imagenes.push(a.imagen);
      break;
    }
    case "describe":
      imagenes.push(a.imagen);
      if (!(a.minimo >= 1)) fallo(donde, "sin mínimo");
      if ((a.cosas?.length ?? 0) < a.minimo) fallo(donde, `solo ${a.cosas?.length} cosas para un mínimo de ${a.minimo}`);
      if (cosasNombradas(a.modelo.join(" "), a.cosas).length < a.minimo)
        fallo(donde, "el modelo no nombra el mínimo de cosas: la evaluación lo calificaría mal");
      break;
    case "responde": {
      if (a.preguntas?.length !== 5) aviso(donde, `tiene ${a.preguntas?.length} preguntas (el plan dice cinco)`);
      if (a.preguntas?.some((p) => !p.pregunta?.trim() || !p.modelo?.trim())) fallo(donde, "pregunta sin modelo");
      const segundos = nivelActual === "A1" ? 10 : nivelActual === "A2" ? 15 : 20;
      if (a.segundos !== segundos) aviso(donde, `segundos = ${a.segundos} (en ${nivelActual} son ${segundos})`);
      break;
    }
    case "adivina": {
      const nombres = (a.opciones ?? []).map((o) => o.nombre);
      if (nombres.length !== 6) aviso(donde, `tiene ${nombres.length} tarjetas (el documento dice seis)`);
      if (new Set(nombres).size !== nombres.length) fallo(donde, "dos tarjetas con el mismo nombre");
      for (const o of a.opciones ?? []) {
        if (!o.nombre?.trim()) fallo(donde, "una tarjeta sin nombre");
        if (o.imagen) imagenes.push(o.imagen);
        else fallo(donde, `la tarjeta "${o.nombre}" no tiene ilustración`);
      }
      if (!a.rondas?.length) fallo(donde, "sin rondas");
      for (const r of a.rondas ?? []) if (!nombres.includes(r)) fallo(donde, `la ronda "${r}" no es una de las tarjetas`);
      if (!a.preguntas?.length) fallo(donde, "sin tabla de preguntas");
      for (const p of a.preguntas ?? []) {
        for (const n of p.si ?? []) if (!nombres.includes(n)) fallo(donde, `"${p.pregunta}": "${n}" no es una de las tarjetas`);
        // La respuesta corta sale de la pregunta ("Do you…?" → "Yes, I do."): una que no se reconoce queda en "Yes!".
        if (respuestaCorta(p.pregunta, true) === "Yes!") aviso(donde, `"${p.pregunta}" no tiene respuesta corta propia (Allison diría "Yes!" / "No!")`);
      }
      // Cada ronda tiene que poder descubrirse con preguntas, no solo adivinando a ciegas.
      for (const r of a.rondas ?? []) {
        for (const otra of nombres.filter((n) => n !== r)) {
          if (!(a.preguntas ?? []).some((p) => p.si.includes(r) !== p.si.includes(otra)))
            aviso(donde, `ninguna pregunta distingue "${r}" de "${otra}"`);
        }
      }
      if (!a.adivinar?.includes("{x}")) fallo(donde, 'adivinar no lleva "{x}"');
      for (const [n, dice] of Object.entries(a.alAdivinar ?? {})) {
        if (!nombres.includes(n)) fallo(donde, `alAdivinar: "${n}" no es una de las tarjetas`);
        if (BRITANICO.test(dice)) fallo(donde, `inglés británico: "${dice}"`);
      }
      if (!a.secreto?.trim() || !a.apertura?.trim()) fallo(donde, "falta secreto o apertura");
      break;
    }
    case "cuentame": {
      if (!a.tema?.trim() || !a.modelo?.trim()) fallo(donde, "falta tema o modelo");
      if (a.guias?.length !== 3) aviso(donde, `tiene ${a.guias?.length} preguntas guía (el documento dice tres)`);
      // A2: 30 segundos, acierto desde 20 con 3 frases. B1: un minuto, desde 40 con 5 frases.
      const [reloj, minimo, frasesMin] = desdeB1() ? [60, 40, 5] : [30, 20, 3];
      if (a.segundos !== reloj || a.minimoSegundos !== minimo)
        aviso(donde, `reloj ${a.segundos} s, mínimo ${a.minimoSegundos} s (el documento: ${reloj} y ${minimo})`);
      if (a.minimoFrases !== frasesMin) aviso(donde, `mínimo de ${a.minimoFrases} frases (el documento: ${frasesMin})`);
      if (!(a.minimoFrases >= 1)) fallo(donde, "sin mínimo de frases");
      const frases = (a.modelo.match(/[^.!?]+[.!?]+/g) ?? []).length;
      if (frases < a.minimoFrases) fallo(donde, `el modelo tiene ${frases} frases y el mínimo es ${a.minimoFrases}`);
      break;
    }
    case "narra": {
      if (!a.pregunta?.trim() || !a.modelo?.trim() || !a.gramatica?.trim()) fallo(donde, "falta pregunta, modelo o gramatica");
      if (a.imagenes?.length !== 4) fallo(donde, `tiene ${a.imagenes?.length} dibujos (deben ser cuatro)`);
      if (a.dibujos?.length !== a.imagenes?.length) fallo(donde, "cada dibujo necesita su descripción");
      if (a.verbos?.length !== a.imagenes?.length) fallo(donde, "cada dibujo necesita su verbo (la ayuda)");
      if (!a.debajo?.length) fallo(donde, "sin las palabras de Debajo");
      if (!(a.minimoDibujos >= 1 && a.minimoDibujos <= (a.imagenes?.length ?? 0))) fallo(donde, "minimoDibujos fuera de rango");
      if (a.segundos !== 60) aviso(donde, `reloj de ${a.segundos} s (el documento: un minuto)`);
      const frases = (a.modelo.match(/[^.!?]+[.!?]+/g) ?? []).length;
      if (frases < a.minimoFrases) fallo(donde, `el modelo tiene ${frases} frases y el mínimo escrito es ${a.minimoFrases}`);
      imagenes.push(...(a.imagenes ?? []));
      break;
    }
    case "ensenale":
      if (!a.tema?.trim() || !a.apertura?.trim() || !a.cierre?.trim()) fallo(donde, "falta tema, apertura o cierre");
      if (a.preguntas?.length !== 4) aviso(donde, `tiene ${a.preguntas?.length} preguntas (el documento dice cuatro)`);
      if (a.preguntas?.some((p) => !p.pregunta?.trim() || !p.simple?.trim() || !p.modelo?.trim()))
        fallo(donde, "una pregunta sin su versión simple o sin modelo");
      if (!a.reacciones?.length) fallo(donde, "sin reacciones");
      if (!(a.minimoRespuestas >= 1 && a.minimoRespuestas <= (a.preguntas?.length ?? 0))) fallo(donde, "minimoRespuestas fuera de rango");
      if (a.imagen) imagenes.push(a.imagen);
      break;
    case "entrevista":
      if (a.datos?.length !== 5) aviso(donde, `tiene ${a.datos?.length} datos (el plan dice cinco)`);
      if (desdeB1() && a.pistas?.length !== a.datos?.length) aviso(donde, "B1: cada dato necesita su pista en inglés");
      if (a.datos?.some((d) => !d.pregunta?.trim() || !d.respuesta?.trim())) fallo(donde, "dato sin pregunta o sin respuesta");
      if (!(a.minimoIntervenciones >= 10)) fallo(donde, "mínimo de intervenciones menor que 10");
      break;
    default:
      fallo(donde, `tipo desconocido "${a.tipo}"`);
  }
}

/** Lecciones y escenario: lo que comparten paradas y repasos. */
function revisarLeccionesYEscenario(p, d, imagenes, { conObjetivo }) {
  if (p.lecciones?.length !== 4) fallo(d, `tiene ${p.lecciones?.length} lecciones, deben ser 4`);
  p.lecciones?.forEach((l, i) => {
    const dl = `${d} lección ${l.numero}`;
    if (l.numero !== i + 1) fallo(dl, "numeración");
    if (!l.titulo?.trim()) fallo(dl, "falta título");
    if (conObjetivo && !l.objetivo?.trim()) fallo(dl, "falta objetivo");
    if (l.actividades?.length !== 3) fallo(dl, `tiene ${l.actividades?.length} actividades, deben ser 3`);
    if (l.actividades?.[0]?.tipo !== "escucha-elige") fallo(dl, "no empieza con Escucha y elige");
    l.actividades?.forEach((a, j) => {
      if (a.paso !== j + 1) fallo(`${dl} paso ${j + 1}`, "numeración del paso");
      revisarActividad(a, `${dl} paso ${a.paso} (${a.tipo})`, imagenes);
    });
  });
  // A1 y los repasos cierran con la Entrevista; en A2, las paradas impares con Adivina y las pares con la
  // Entrevista; en B1, las impares con Enséñale a Allison y las pares con la Entrevista.
  const impar = desdeB1() ? "ensenale" : "adivina";
  const cierre = nivelActual === "A1" || !p.numero ? "entrevista" : p.numero % 2 ? impar : "entrevista";
  const NOMBRES = { adivina: "Adivina", ensenale: "Enséñale a Allison", entrevista: "la Entrevista a Allison" };
  if (p.lecciones?.[3]?.actividades?.at(-1)?.tipo !== cierre) fallo(d, `la lección 4 no cierra con ${NOMBRES[cierre]}`);
  if (nivelActual !== "A1" && p.numero) {
    const todas = p.lecciones?.flatMap((l) => l.actividades) ?? [];
    const cuentame = todas.filter((a) => a.tipo === "cuentame").length;
    if (cuentame !== 1) aviso(d, `tiene ${cuentame} Cuéntame (uno por parada)`);
    if (desdeB1()) {
      const narra = todas.filter((a) => a.tipo === "narra").length;
      if (narra !== 1) aviso(d, `tiene ${narra} Narra la secuencia (B1: una por parada)`);
      if (todas.some((a) => a.tipo === "describe")) fallo(d, "B1 no lleva Describe la imagen: la reemplaza Narra la secuencia");
    }
  }

  const e = p.escenario;
  const de = `${d} escenario`;
  if (!e) return fallo(d, "sin escenario");
  imagenes.push(e.imagen);
  for (const k of ["titulo", "contexto", "personaje", "objetivo", "resumen", "recompensa"]) if (!e[k]?.trim()) fallo(de, `falta ${k}`);
  if (PAPEL_DE_HOMBRE.test(e.personaje ?? "")) fallo(de, `Allison hace "${e.personaje}": el papel tiene que ser de mujer`);
  if (!e.tareas?.length) fallo(de, "sin tareas");
  // Cada tarea necesita al menos una línea del alumno que la cumpla: de
  // ahí sale la frase del botón Ayuda (ayudasDe).
  e.tareas?.forEach((_, i) => {
    if (!e.dialogo?.some((l) => l.quien === "alumno" && l.tarea === i + 1))
      fallo(de, `ninguna línea del diálogo cumple la tarea ${i + 1}`);
  });
  for (const l of e.dialogo ?? [])
    if (l.tarea && !(l.tarea >= 1 && l.tarea <= e.tareas.length)) fallo(de, `una línea dice cumplir la tarea ${l.tarea}, que no existe`);
  if (e.momentos) {
    const cubiertas = e.momentos.flatMap((m) => m.tareas).sort((a, b) => a - b);
    const todas = e.tareas.map((_, i) => i + 1);
    if (cubiertas.join() !== todas.join()) fallo(de, `los momentos no reparten las tareas 1 a ${todas.length}: [${cubiertas}]`);
    for (const m of e.momentos) if (m.imagen) imagenes.push(m.imagen);
  }
  const delAlumno = e.dialogo?.filter((l) => l.quien === "alumno").length ?? 0;
  // El diálogo de ejemplo ilustra; el mínimo real lo hace cumplir la app en la conversación.
  // Uno más corto (la parada 1, escrita antes de la regla) es un aviso, no un fallo.
  if (delAlumno < e.minimoIntervenciones) aviso(de, `el diálogo de ejemplo tiene ${delAlumno} intervenciones del alumno (el mínimo es ${e.minimoIntervenciones})`);
  const minimo = desdeB1() ? 12 : 10;
  if (e.minimoIntervenciones !== minimo) aviso(de, `mínimo de intervenciones = ${e.minimoIntervenciones} (${nivelActual}: ${minimo})`);
  // B1: a mitad de la escena pasa un imprevisto que trae su tarea, y Allison lo dice con la línea aprobada.
  if (desdeB1()) {
    const imp = e.imprevisto;
    if (!imp) fallo(de, "B1: sin imprevisto");
    else {
      const n = e.tareas?.length ?? 0;
      if (!(imp.tarea >= 1 && imp.tarea <= n) || !(imp.despuesDeTarea >= 1 && imp.despuesDeTarea <= n) || imp.tarea === imp.despuesDeTarea)
        fallo(de, "el imprevisto apunta a tareas que no existen");
      if (!imp.texto?.trim()) fallo(de, "el imprevisto no dice qué pasa");
      if (!e.dialogo?.some((l) => l.quien === "personaje" && l.dice === imp.linea)) fallo(de, "la línea del imprevisto no está en el diálogo");
      if (esBritanico(imp.linea ?? "")) fallo(de, `inglés británico: "${imp.linea}"`);
    }
  }
  if (!(e.maximoIntervenciones > e.minimoIntervenciones)) fallo(de, "máximo de intervenciones");
  for (const l of e.dialogo ?? []) if (esBritanico(l.dice)) fallo(de, `inglés británico: "${l.dice}"`);
  if (!e.siSeAtasca?.length && !e.siSeAtascaTexto?.trim()) fallo(de, "sin qué hacer si se atasca");
  // A2: la ayuda da el comienzo de la frase de cada tarea ("I usually ___").
  if (nivelActual !== "A1") {
    if (e.ayudas?.length !== e.tareas?.length) fallo(de, `tiene ${e.ayudas?.length ?? 0} ayudas para ${e.tareas?.length} tareas (A2: el comienzo de la frase de cada una)`);
    for (const x of e.ayudas ?? []) {
      // B1: la ayuda da la idea en inglés, sin las palabras; A2, el comienzo de la frase.
      if (!desdeB1() && !x.includes("___")) aviso(de, `la ayuda "${x}" no deja espacio (___) para que el alumno termine la frase`);
      if (esBritanico(x)) fallo(de, `inglés británico: "${x}"`);
    }
  }
}

let porProducir = 0;
function revisarImagenes(d, imagenes) {
  for (const nombre of new Set(imagenes.filter(Boolean))) {
    if (existeImagen(nombre)) continue;
    // Las ilustraciones de los niveles nuevos se producen aparte (avance de Contenido A2 y B1, paso 6):
    // falta una de A2 o B1, propia o reutilizada, es un aviso. Las de A1 ya existen todas.
    const carpeta = nombre.includes("/") ? nombre.split("/")[0] : nivelActual.toLowerCase();
    if (carpeta !== "a1") porProducir++;
    else fallo(d, `no existe la ilustración "${nombre}"`);
  }
}

const porRevisarDe = (p) => p.lecciones?.flatMap((l) => l.actividades.flatMap((a) => a.porRevisar ?? [])).length ?? 0;

function revisarParada(p, archivo) {
  const imagenes = [p.portada];
  const d = `parada ${p.numero}`;
  if (!archivo.includes(String(p.numero).padStart(2, "0"))) fallo(d, `el número no coincide con el archivo ${archivo}`);
  for (const k of ["ciudad", "titulo", "gramatica", "objetivo", "fraseMeta"]) if (!p[k]?.trim()) fallo(d, `falta ${k}`);
  if (esBritanico(p.fraseMeta)) fallo(d, `inglés británico en la frase meta`);
  if (!p.vocabulario?.length) fallo(d, "sin vocabulario");
  revisarLeccionesYEscenario(p, d, imagenes, { conObjetivo: true });
  for (const fila of p.ilustraciones ?? []) imagenes.push(...fila.archivos);
  revisarImagenes(d, imagenes);
  return porRevisarDe(p);
}

function revisarRepaso(r) {
  const imagenes = [r.portada];
  const d = r.nombre ?? "repaso";
  for (const k of ["nombre", "ciudad", "titulo", "objetivo", "comoEsDistinto"]) if (!r[k]?.trim()) fallo(d, `falta ${k}`);
  if (!(r.despuesDeParada >= 1)) fallo(d, "falta despuesDeParada");
  revisarLeccionesYEscenario(r, d, imagenes, { conObjetivo: false });
  revisarImagenes(d, imagenes);
  return porRevisarDe(r);
}

function revisarViajes(viajes) {
  if (viajes.length !== 10) fallo("viajes", `hay ${viajes.length} viajes, deben ser 10`);
  viajes.forEach((v, i) => {
    const d = `viaje ${v.numero} · ${v.pais}`;
    if (v.numero !== i + 1) fallo(d, "numeración");
    for (const k of ["pais", "lugar", "papel", "inicio", "estampilla", "evita"]) if (!v[k]?.trim()) fallo(d, `falta ${k}`);
    if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(v.nivelMinimo)) fallo(d, `nivel "${v.nivelMinimo}"`);
    // 3 del documento y 3 agregadas (24 de octubre de 2026), para 10 intervenciones.
    if (!(v.tareas?.length >= 5 && v.tareas?.length <= 7)) fallo(d, `tiene ${v.tareas?.length} tareas, deben ser de 5 a 7`);
    if (!v.puentes?.length) fallo(d, "sin puentes con Colombia");
    if (!v.palabrasPorNivel?.length) fallo(d, "sin palabras por nivel");
    if (!v.datos?.length) fallo(d, "sin datos verificados");
    for (const x of v.datos ?? []) if (!/^https:\/\//.test(x.fuente?.url ?? "")) fallo(d, `dato sin fuente: "${x.texto?.slice(0, 40)}"`);
    if (v.minimoIntervenciones !== 10) aviso(d, `mínimo de intervenciones = ${v.minimoIntervenciones}`);
    if (BRITANICO.test(v.inicio)) fallo(d, `inglés británico: "${v.inicio}"`);
  });
}

const objetosCon = (mod, campo) => Object.values(mod).filter((v) => v && typeof v === "object" && !Array.isArray(v) && campo in v);

const archivos = NIVELES.flatMap(({ nivel, dir }) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => /^(parada-\d+|repaso-[\w-]+)\.ts$/.test(f))
        .filter((f) => !solo || f.startsWith(solo))
        .sort()
        .map((archivo) => ({ nivel, dir, archivo }))
    : []
);

let pendientes = 0;
let paradas = 0;
let repasos = 0;
for (const { nivel, dir, archivo } of archivos) {
  nivelActual = nivel;
  const mod = await import(pathToFileURL(join(dir, archivo)).href);
  const unidades = objetosCon(mod, "lecciones");
  if (unidades.length !== 1) {
    fallo(archivo, "debe exportar exactamente una parada o un repaso");
    continue;
  }
  const u = unidades[0];
  if (archivo.startsWith("parada-")) {
    console.log(`${nivel} ${archivo}: parada ${u.numero} · ${u.ciudad}`);
    pendientes += revisarParada(u, archivo);
    paradas++;
  } else {
    console.log(`${nivel} ${archivo}: ${u.nombre} · ${u.ciudad}`);
    pendientes += revisarRepaso(u);
    repasos++;
  }
}

if (!solo || solo.startsWith("viajes")) {
  const ruta = "src/lib/ruta/viajes.ts";
  if (existsSync(ruta)) {
    const mod = await import(pathToFileURL(ruta).href);
    const lista = Object.values(mod).find((v) => Array.isArray(v) && v[0]?.pais);
    if (!lista) fallo("viajes.ts", "no exporta la lista de viajes");
    else {
      console.log(`viajes.ts: ${lista.length} viajes`);
      revisarViajes(lista);
    }
  }
}

// La frase del día (src/lib/expresiones.ts): inglés de Estados Unidos, como todo lo demás.
// También el catálogo de Escenarios (src/lib/escenarios/datos.ts), que no es de una parada.
{
  const { EXPRESIONES } = await import(pathToFileURL("src/lib/expresiones.ts").href);
  for (const [nivel, lista] of Object.entries(EXPRESIONES))
    for (const e of lista)
      for (const s of [e.en, e.ejemplo]) if (esBritanico(s)) fallo(`expresiones ${nivel}`, `inglés británico: "${s}"`);
  const { CATALOGO } = await import(pathToFileURL("src/lib/escenarios/datos.ts").href);
  for (const c of CATALOGO) {
    const e = c.escenario;
    for (const l of e.dialogo) if (esBritanico(l.dice)) fallo(c.clave, `inglés británico: "${l.dice}"`);
    if (PAPEL_DE_HOMBRE.test(e.personaje)) fallo(c.clave, `Allison hace "${e.personaje}": el papel tiene que ser de mujer`);
    e.tareas.forEach((_, i) => {
      if (!e.dialogo.some((l) => l.quien === "alumno" && l.tarea === i + 1)) fallo(c.clave, `ninguna línea del diálogo cumple la tarea ${i + 1}`);
    });
    const delAlumno = e.dialogo.filter((l) => l.quien === "alumno").length;
    if (delAlumno < e.minimoIntervenciones) aviso(c.clave, `el diálogo de ejemplo tiene ${delAlumno} intervenciones del alumno (el mínimo es ${e.minimoIntervenciones})`);
  }
}

console.log(`\n${paradas} parada(s), ${repasos} repaso(s), ${fallos} fallo(s), ${avisos} aviso(s), ${pendientes} texto(s) por revisar.`);
if (porProducir) console.log(`${porProducir} ilustración(es) de A2 y B1 por producir.`);
if (fallos > 0) process.exit(1);
