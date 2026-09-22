/**
 * El prompt de Allison y el español en su voz (src/lib/allison.ts y
 * src/lib/habla.ts), sin red ni base.
 *
 * Lo que se prueba es lo que, si falla, muestra claves internas en el
 * chat o deja al modelo sin la regla:
 *   · los marcadores [es] / [en-US] desaparecen del texto de pantalla
 *     y llegan normalizados a la voz (solo esos dos, bien escritos);
 *   · las señales del hábito se cuentan bien sobre los últimos turnos;
 *   · el prompt lleva la política del español para cada nivel, las
 *     cifras del hábito y el formato de los marcadores, y ya no lleva
 *     la prohibición vieja.
 *
 *   node scripts/probar-prompt.mjs
 */
const { construirInstruccion } = await import("../src/lib/allison.ts");
const { normalizarMarcadores, prepararParaVoz, quitarMarcadores, senalesDeEspanol, tieneMarcadores } =
  await import("../src/lib/habla.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

console.log("Los marcadores, en la pantalla:");
const mixta = "You WENT to the park. [es] Fuiste al parque. [en-US] Who did you go with?";
probar("desaparecen y no dejan huecos", quitarMarcadores(mixta) === "You WENT to the park. Fuiste al parque. Who did you go with?", quitarMarcadores(mixta));
probar("en cualquier grafía: [ES], [en_us], [en-us]", quitarMarcadores("Hi. [ES] Hola. [en_us] Bye [en-us].") === "Hi. Hola. Bye.", quitarMarcadores("Hi. [ES] Hola. [en_us] Bye [en-us]."));
probar("un texto sin marcadores queda igual", quitarMarcadores("I don't have money for the ticket.") === "I don't have money for the ticket.");
probar("corchetes que no son idiomas se respetan ([TODO], [1])", quitarMarcadores("See [TODO] and [1].") === "See [TODO] and [1]." && !tieneMarcadores("See [TODO]"));

console.log("\nLos marcadores, en la voz:");
probar("se reconocen", tieneMarcadores(mixta) && !tieneMarcadores("Hello there"));
probar(
  "se normalizan a [es] y [en-US], y otros idiomas se quitan",
  normalizarMarcadores("Hi. [ES] Hola. [en_us] Bye. [fr] Salut.") === "Hi. [es] Hola. [en-US] Bye. Salut.",
  normalizarMarcadores("Hi. [ES] Hola. [en_us] Bye. [fr] Salut.")
);
probar("un inglés al principio sobra", normalizarMarcadores("[en-US] Hi. [es] Hola.") === "Hi. [es] Hola.");
probar("un español al principio se queda", normalizarMarcadores("[es] Hola. [en-US] Hi.") === "[es] Hola. [en-US] Hi.");
probar("dos seguidos: vale el último, y un inglés sin español antes sobra", normalizarMarcadores("Hi. [es] [en-US] Bye.") === "Hi. Bye.", normalizarMarcadores("Hi. [es] [en-US] Bye."));
probar("dos seguidos que terminan en español: queda el español", normalizarMarcadores("Hi. [en-US] [es] Hola. [en-US] Bye.") === "Hi. [es] Hola. [en-US] Bye.", normalizarMarcadores("Hi. [en-US] [es] Hola. [en-US] Bye."));
probar("uno al final, sin nada detrás, se quita", normalizarMarcadores("Hi. [es]") === "Hi.");
probar(
  "la limpieza para la voz conserva el marcador (el guion sobrevive, el guion bajo se normalizó antes)",
  prepararParaVoz("**Hi** there. [en_us] Really. [es] De verdad. 🎉") === "Hi there. Really. [es] De verdad.",
  prepararParaVoz("**Hi** there. [en_us] Really. [es] De verdad. 🎉")
);

console.log("\nLas señales del hábito:");
const historial = [
  { rol: "alumno", texto: "Hello Allison" },
  { rol: "allison", texto: "Hi! Where do you live?", textoVoz: "Hi! Where do you live? [es] ¿Dónde vives?" },
  { rol: "alumno", texto: "no entiendo" },
  { rol: "allison", texto: "Where is your house?" },
  { rol: "alumno", texto: "¿Qué significa house?" },
  { rol: "allison", texto: "House is casa.", textoVoz: "House is casa. [es] Casa. [en-US] Where is your house?" },
  { rol: "alumno", texto: "I live in Duitama" },
];
const s = senalesDeEspanol(historial);
probar(
  "cuenta los turnos del alumno en español o pidiendo español, y las respuestas con español",
  s.turnos === 4 && s.pidioEspanol === 2 && s.usoEspanol === 2,
  JSON.stringify(s)
);
probar("solo mira la ventana reciente", senalesDeEspanol(historial, 1).turnos === 1 && senalesDeEspanol(historial, 1).pidioEspanol === 0);
probar("sin historial, ceros", JSON.stringify(senalesDeEspanol([])) === JSON.stringify({ turnos: 0, pidioEspanol: 0, usoEspanol: 0 }));
probar(
  "pedirlo en inglés también cuenta",
  senalesDeEspanol([{ rol: "alumno", texto: "say it in Spanish please" }]).pidioEspanol === 1
);

console.log("\nEl prompt:");
const alumno = { nombre: "Ana Pérez", nivel: "A1" };
const a1 = construirInstruccion(alumno, undefined, undefined, { turnos: 4, pidioEspanol: 3, usoEspanol: 2 });
probar("explica el formato con el ejemplo [es] … [en-US]", a1.includes("[es] Fuiste al parque. [en-US]"));
probar("dice que la pantalla borra los marcadores y que nunca se mencionan", a1.includes("deletes the markers") && a1.includes("never mention them"));
probar("lleva la regla del nivel A1", a1.includes("Your level rule (A1): Spanish is part of the class"));
probar("lleva las cifras del hábito", a1.includes("spoke Spanish or asked for Spanish 3 times") && a1.includes("you used Spanish in 2 of your replies"));
probar("y la regla de entrenar el oído a partir de 3", a1.includes("3 or more") && a1.includes("slow speed") && a1.includes("5 or more"));
probar("el inglés siempre primero y la última frase en inglés", a1.includes("English first, Spanish after it"));
probar("la transcripción nunca lleva marcadores", a1.includes("Never put language markers here"));
probar("la prohibición vieja del español desapareció", !a1.includes("NEVER put Spanish words") && !a1.includes("No Spanish."));
probar("el nombre del alumno va en el prompt", a1.includes("Name: Ana."));

const b2 = construirInstruccion({ nombre: "Luis", nivel: "B2" });
probar("B2: sin español salvo petición explícita", b2.includes("Your level rule (B2): no Spanish unless they explicitly ask"));
probar("sin señales, las cifras van en cero", b2.includes("In the last 0 student turns"));
for (const nivel of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
  const p = construirInstruccion({ nombre: "X", nivel });
  probar(`${nivel}: tiene su regla de español y las de formato`, p.includes(`Your level rule (${nivel})`) && p.includes("SPANISH IN YOUR VOICE"));
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nPrompt y español correctos.");
