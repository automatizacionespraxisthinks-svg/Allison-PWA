/**
 * Las reglas del glosario (src/lib/frases.ts), sin red ni base.
 *
 * Lo que importa: que una selección con espacios y saltos se guarde
 * limpia, que no se guarden párrafos ni cosas sin letras, y que el
 * contexto quede acotado sin partir la frase de mala manera.
 *
 *   node scripts/probar-glosario.mjs
 */
const { CONTEXTO_MAX, FRASE_MAX, normalizarFrase, recortarContexto, validarFrase } =
  await import("../src/lib/frases.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

console.log("Normalizar lo seleccionado:");
probar("colapsa espacios y saltos", normalizarFrase("  good \n\n  morning\t ") === "good morning");
probar("lo que no es texto vale vacío", normalizarFrase(null) === "" && normalizarFrase(42) === "");
probar("no toca las mayúsculas ni la puntuación", normalizarFrase("I'd love to!") === "I'd love to!");

console.log("\nQué se puede guardar:");
probar("una palabra", validarFrase("Tuesday") === null);
probar("una frase", validarFrase("How have you been?") === null);
probar("con tildes y eñes", validarFrase("señor") === null);
probar("nada, no", validarFrase("") !== null);
probar("solo números o signos, no", validarFrase("123 !!!") !== null);
probar(
  `un párrafo de más de ${FRASE_MAX} caracteres, no`,
  validarFrase("word ".repeat(60).trim()) !== null
);
probar("justo el máximo, sí", validarFrase("a".repeat(FRASE_MAX)) === null);

console.log("\nEl contexto:");
probar("sin contexto queda null", recortarContexto("") === null && recortarContexto(undefined) === null);
probar("uno corto queda igual", recortarContexto("  Nice to  meet you. ") === "Nice to meet you.");
const largo = recortarContexto("x".repeat(CONTEXTO_MAX + 50));
probar(
  `uno largo se recorta a ${CONTEXTO_MAX} con puntos suspensivos`,
  largo.length === CONTEXTO_MAX && largo.endsWith("…"),
  String(largo.length)
);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nGlosario correcto.");
