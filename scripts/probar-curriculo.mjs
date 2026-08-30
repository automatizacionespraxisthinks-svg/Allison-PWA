/**
 * Integridad del currículo.
 *
 * El contenido pedagógico es código y se prueba como código: una
 * unidad a medias, una clave repetida o una apertura en español no
 * deben poder llegar a producción. Corre sin base y sin red.
 *
 *   node scripts/probar-curriculo.mjs
 */
import { UNIDADES, META_LOGROS, unidad, unidadesDe } from "../src/lib/curriculo.ts";

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  if (ok) {
    console.log(`  ok    ${nombre}`);
  } else {
    fallos++;
    console.error(`  FALLO ${nombre}${detalle ? ` -- ${detalle}` : ""}`);
  }
};

const NIVELES = ["A1", "A2", "B1", "B2", "C1", "C2"];

console.log("Currículo:");

probar("son 60 unidades", UNIDADES.length === 60, `hay ${UNIDADES.length}`);

for (const nivel of NIVELES) {
  const del = unidadesDe(nivel);
  probar(`${nivel} tiene 10 unidades`, del.length === 10, `tiene ${del.length}`);
  probar(
    `${nivel} tiene orden 1..10 sin huecos`,
    JSON.stringify(del.map((u) => u.orden).sort((a, b) => a - b)) ===
      JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  );
}

const claves = UNIDADES.map((u) => u.clave);
probar("las claves son únicas", new Set(claves).size === claves.length);
probar(
  "cada clave lleva su nivel de prefijo",
  UNIDADES.every((u) => u.clave.startsWith(u.nivel.toLowerCase() + "-"))
);

const camposLlenos = UNIDADES.every(
  (u) =>
    u.titulo.trim() &&
    u.objetivo.trim() &&
    u.gramatica.trim() &&
    u.metaEn.trim() &&
    u.estructuraEn.trim() &&
    u.apertura.trim() &&
    u.vocabulario.length >= 5 &&
    u.vocabulario.every((v) => v.trim())
);
probar("ninguna unidad tiene campos vacíos (y 5+ palabras de vocabulario)", camposLlenos);

// Lo que ve Allison va en inglés: una tilde o una eñe ahí es señal de
// que se coló español, y la voz en-US lo destroza.
const esEspanol = (t) => /[áéíóúñü¿¡]/i.test(t);
const conEspanol = UNIDADES.filter(
  (u) =>
    esEspanol(u.apertura) ||
    esEspanol(u.metaEn) ||
    esEspanol(u.estructuraEn) ||
    u.vocabulario.some(esEspanol)
);
probar(
  "apertura, metaEn, estructuraEn y vocabulario están en inglés puro",
  conEspanol.length === 0,
  conEspanol.map((u) => u.clave).join(", ")
);

// La apertura respeta el largo del nivel (con margen: es UNA frase de
// arranque, no la regla completa de docs/CURRICULO.md sección 2).
const palabras = (t) => t.split(/\s+/).length;
const TOPE = { A1: 8, A2: 13, B1: 20, B2: 30 };
for (const nivel of ["A1", "A2", "B1", "B2"]) {
  const largas = unidadesDe(nivel).filter((u) => palabras(u.apertura) > TOPE[nivel]);
  probar(
    `las aperturas de ${nivel} caben en ${TOPE[nivel]} palabras`,
    largas.length === 0,
    largas.map((u) => `${u.clave} (${palabras(u.apertura)})`).join(", ")
  );
}

probar("la meta de logros es alcanzable", META_LOGROS >= 3 && META_LOGROS <= 10);
probar("unidad() encuentra por clave", unidad("a2-finde")?.titulo === "El fin de semana pasado");
probar("unidad() devuelve null con clave inventada", unidad("z9-nada") === null);

// El mismo control de caracteres de control que salvó a allison.ts:
// un backspace invisible en el contenido rompería el prompt sin que
// nadie lo vea en el editor.
import { readFileSync } from "node:fs";
const fuente = readFileSync(new URL("../src/lib/curriculo.ts", import.meta.url), "utf8");
const controles = [...fuente].filter((c) => c.charCodeAt(0) < 32 && c !== "\n" && c !== "\r" && c !== "\t");
probar("el archivo no tiene caracteres de control invisibles", controles.length === 0);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nCurrículo íntegro.");
