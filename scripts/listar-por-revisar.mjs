/**
 * Escribe docs/CONTENIDO-POR-REVISAR.md: todo lo que NO estaba escrito en
 * el documento aprobado "Contenido A1" y se agregó al pasarlo a datos
 * (traducciones de lo que se oye, respuestas de Allison en las
 * entrevistas, las palabras debajo de los dibujos, la situación en
 * español de ¿Qué es esto?, zonas de las fotos por marcar). Es la lista para la
 * revisión de la licenciada o el licenciado en inglés (paso 4 del plan).
 *
 *   node scripts/listar-por-revisar.mjs       A1 y el catálogo de Escenarios
 *   node scripts/listar-por-revisar.mjs a2    A2 ("Contenido A2"), en docs/CONTENIDO-A2-POR-REVISAR.md
 *   node scripts/listar-por-revisar.mjs b1    B1 ("Contenido B1"), en docs/CONTENIDO-B1-POR-REVISAR.md
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const NIVEL = (process.argv[2] ?? "a1").toLowerCase();
const DIR = `src/lib/ruta/${NIVEL}`;
const SALIDA = NIVEL === "a1" ? "docs/CONTENIDO-POR-REVISAR.md" : `docs/CONTENIDO-${NIVEL.toUpperCase()}-POR-REVISAR.md`;
const DOCUMENTO = `Contenido ${NIVEL.toUpperCase()}`;
const NOMBRES = {
  "escucha-elige": "Escucha y elige",
  "que-es-esto": "¿Qué es esto?",
  repite: "Repite",
  "tu-turno": "Tu turno en el diálogo",
  dilo: "Dilo en inglés",
  describe: "Describe la imagen",
  responde: "Responde rápido",
  entrevista: "Entrevista a Allison",
  adivina: "Adivina",
  cuentame: "Cuéntame",
  narra: "Narra la secuencia",
  ensenale: "Enséñale a Allison",
};

const lineas = [
  `# ${DOCUMENTO}: lo que falta revisar`,
  "",
  "> ARCHIVO GENERADO por `scripts/listar-por-revisar.mjs`. No lo edites a mano.",
  "",
  `Al pasar el documento aprobado "${DOCUMENTO}" a datos para la app, hubo que escribir`,
  "algunas cosas que el documento no traía. Esta lista es para que una licenciada o un",
  "licenciado en inglés las revise junto con el resto de la parada.",
  "",
];

let total = 0;
const pendientesZona = [];
const archivos = readdirSync(DIR).filter((f) => /^(parada-\d+|repaso-[\w-]+)\.ts$/.test(f)).sort();
for (const archivo of archivos) {
  const mod = await import(pathToFileURL(join(DIR, archivo)).href);
  const u = Object.values(mod).find((v) => v && typeof v === "object" && "lecciones" in v);
  if (!u) continue;
  const titulo = u.numero ? `Parada ${u.numero} · ${u.ciudad}` : `${u.nombre} · ${u.ciudad}`;
  const filas = [];
  for (const l of u.lecciones) {
    for (const a of l.actividades) {
      const donde = `Lección ${l.numero}, paso ${a.paso} (${NOMBRES[a.tipo] ?? a.tipo})`;
      // Las palabras debajo de los dibujos y la situación en español se
      // escribieron para la app (octubre de 2026): se revisan todas.
      if (a.tipo === "escucha-elige" && a.opciones?.some((o) => o.etiqueta)) {
        filas.push(`| ${donde} | Palabras debajo de los dibujos | ${a.opciones.map((o) => o.etiqueta).join(" · ")} |`);
      }
      if (a.tipo === "que-es-esto" && a.contexto) filas.push(`| ${donde} | Situación en español | ${a.contexto} |`);
      for (const nota of a.porRevisar ?? []) {
        if (nota.startsWith("traduccion") && a.traduccion) {
          a.audio.forEach((en, i) => filas.push(`| ${donde} | Traducción | "${en}" → "${a.traduccion[i]}" |`));
        } else if (nota.startsWith("datos.respuesta") && a.datos) {
          for (const d of a.datos) filas.push(`| ${donde} | Respuesta de Allison | ${d.pregunta} → "${d.respuesta}" |`);
        } else if (nota.startsWith("preguntas.modelo") && a.preguntas) {
          for (const p of a.preguntas) filas.push(`| ${donde} | Respuesta modelo | ${p.pregunta} → "${p.modelo}" |`);
        } else if (nota.startsWith("explicaciones") && a.explicaciones) {
          // B1: lo que explica Allison en inglés y su traducción para «En español».
          for (const x of a.explicaciones.filter((x) => x.es))
            filas.push(`| ${donde} | Traducción de la explicación | "${x.explicacion}" → "${x.es}" |`);
        } else if (nota.startsWith("consejoEs") && a.consejoEs) {
          filas.push(`| ${donde} | Traducción del consejo | "${a.consejo}" → "${a.consejoEs}" |`);
        } else if (nota.startsWith("preguntas.simple") && a.preguntas) {
          for (const p of a.preguntas) filas.push(`| ${donde} | Pregunta más simple | ${p.pregunta} → "${p.simple}" |`);
        } else if (nota.startsWith("pistas") && a.pistas && a.datos) {
          a.datos.forEach((d, i) => filas.push(`| ${donde} | Pista en inglés | ${d.dato} → "${a.pistas[i] ?? ""}" |`));
        } else if (nota.startsWith("verbos") && a.verbos) {
          filas.push(`| ${donde} | Verbos de la ayuda | ${a.verbos.map((v, i) => `${i + 1}. ${v}`).join(" · ")} |`);
        } else if (nota.startsWith("gramatica") && a.gramatica) {
          filas.push(`| ${donde} | Gramática para el evaluador | "${a.gramatica}" |`);
        } else if (nota.startsWith("dibujos") && a.dibujos) {
          filas.push(`| ${donde} | Qué muestra cada dibujo | ${a.dibujos.map((v, i) => `${i + 1}. ${v}`).join(" · ")} |`);
        } else if (/zona|flecha/.test(nota)) {
          pendientesZona.push(`${titulo}, ${donde}: ${nota}`);
          continue;
        } else {
          filas.push(`| ${donde} | Nota | ${nota} |`);
        }
      }
    }
  }
  for (const nota of u.escenario?.porRevisar ?? []) filas.push(`| Escenario de cierre | Nota | ${nota} |`);
  if (!filas.length) continue;
  total += filas.length;
  lineas.push(`## ${titulo}`, "", "| Dónde | Qué | Texto |", "|---|---|---|", ...filas, "");
}

// Escenarios (pantalla 5, etapa 7): los documentos aprobados solo traen
// el nombre, el lugar y el nivel de las tarjetas del boceto. El papel de
// Allison, el contexto, las 3 tareas y el diálogo de ejemplo se
// escribieron para la app: se revisan enteros.
const { CATALOGO } = await import(pathToFileURL(join("src/lib/escenarios/datos.ts")).href);
const filasCatalogo = [];
// El catálogo va una sola vez, con A1.
for (const c of NIVEL === "a1" ? CATALOGO : []) {
  const e = c.escenario;
  const donde = `${c.titulo} (${c.lugar}, desde ${c.nivelMinimo})`;
  filasCatalogo.push(`| ${donde} | Papel y contexto | ${e.personaje}. ${e.contexto} |`);
  filasCatalogo.push(`| ${donde} | Tareas | ${e.tareas.join(" ")} |`);
  filasCatalogo.push(
    `| ${donde} | Diálogo de ejemplo | ${e.dialogo.map((l) => `${l.quien === "alumno" ? "Alumno" : "Allison"}: ${l.dice}`).join(" / ")} |`
  );
}
total += filasCatalogo.length;
if (filasCatalogo.length) lineas.push(
  "## Escenarios (catálogo de la pantalla 5)",
  "",
  "Escritos completos para la etapa 7: el boceto aprobado solo trae el nombre, el lugar y el nivel. Inglés de Estados Unidos.",
  "",
  "| Escenario | Qué | Texto |",
  "|---|---|---|",
  ...filasCatalogo,
  ""
);

// Viajes (pestaña Viajes de "Contenido A1"): las tareas agregadas el 24 de octubre de 2026.
const { VIAJES } = await import(pathToFileURL(join("src/lib/ruta/viajes.ts")).href);
const filasViajes = NIVEL === "a1" ? VIAJES.flatMap((v) => (v.porRevisar ?? []).map((n) => `| Viaje ${v.numero} · ${v.pais} | ${n} |`)) : [];
total += filasViajes.length;
if (filasViajes.length) lineas.push("## Viajes", "", "| Viaje | Nota |", "|---|---|", ...filasViajes, "");

// La frase del día (src/lib/expresiones.ts): escrita para la app el 24 de octubre de 2026.
const { EXPRESIONES } = await import(pathToFileURL(join("src/lib/expresiones.ts")).href);
const expresiones = EXPRESIONES[NIVEL.toUpperCase()] ?? [];
total += expresiones.length;
if (expresiones.length) lineas.push(
  "## Frase del día (expresiones)",
  "",
  "Expresiones de los nativos que no se traducen palabra por palabra: qué significan, qué NO significan (la traducción literal) y un ejemplo del nivel. Inglés de Estados Unidos; el español tiene que servir para un muchacho o una muchacha.",
  "",
  "| Expresión | Significa | No es | Ejemplo |",
  "|---|---|---|---|",
  ...expresiones.map((e) => `| ${e.en} | ${e.significa} | ${e.literal} | ${e.ejemplo} |`),
  ""
);

if (pendientesZona.length) {
  lineas.push(
    "## Para el equipo técnico (no es contenido)",
    "",
    "Falta marcar sobre la imagen dónde está cada persona o cosa (para la flecha o para tocarla):",
    "",
    ...pendientesZona.map((p) => `- ${p}`),
    ""
  );
}

writeFileSync(SALIDA, lineas.join("\n"));
console.log(`  generado  ${SALIDA} (${total} textos por revisar, ${pendientesZona.length} zonas por marcar)`);
