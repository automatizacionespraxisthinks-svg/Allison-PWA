/**
 * El prompt de Allison y el español en su voz (src/lib/allison.ts y
 * src/lib/habla.ts), sin red ni base.
 *
 * Lo que se prueba es lo que, si falla, muestra claves internas en el
 * chat, repite frases o dice más español del permitido:
 *   · los marcadores [es] / [en-US] desaparecen del texto de pantalla
 *     y llegan normalizados a la voz (solo esos dos, bien escritos);
 *   · las frases repetidas se quitan; el español se limita a UN tramo
 *     por turno y a ninguno en los niveles altos, en código;
 *   · las señales del hábito se cuentan bien sobre los últimos turnos;
 *   · el prompt lleva la regla de "español solo al corregir" para cada
 *     nivel, el formato de los marcadores y la orden de no repetirse.
 *
 *   node scripts/probar-prompt.mjs
 */
const { construirInstruccion, pulirRespuesta } = await import("../src/lib/allison.ts");
const {
  limitarEspanol,
  normalizarMarcadores,
  prepararParaVoz,
  quitarMarcadores,
  senalesDeEspanol,
  sinEspanol,
  sinRepeticiones,
  tieneMarcadores,
} = await import("../src/lib/habla.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

console.log("Los marcadores, en la pantalla:");
const mixta = "You WENT to the park. [es] En pasado, 'go' se vuelve 'went'. [en-US] Who did you go with?";
probar("desaparecen y no dejan huecos", quitarMarcadores(mixta) === "You WENT to the park. En pasado, 'go' se vuelve 'went'. Who did you go with?", quitarMarcadores(mixta));
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

console.log("\nSin repeticiones:");
probar(
  "la misma frase dos veces queda una",
  sinRepeticiones("Where do you live? Where do you live?") === "Where do you live?",
  sinRepeticiones("Where do you live? Where do you live?")
);
probar(
  "la respuesta pegada dos veces queda una",
  sinRepeticiones("You went to the park! Who did you go with? You went to the park! Who did you go with?") === "You went to the park! Who did you go with?",
  sinRepeticiones("You went to the park! Who did you go with? You went to the park! Who did you go with?")
);
probar(
  "repetir en inglés lo dicho antes se quita aunque cambie la puntuación o las mayúsculas",
  sinRepeticiones("Great job, Ana! [es] Muy bien. [en-US] great job Ana. What did you eat?") === "Great job, Ana! [es] Muy bien. [en-US] What did you eat?",
  sinRepeticiones("Great job, Ana! [es] Muy bien. [en-US] great job Ana. What did you eat?")
);
probar(
  "frases distintas se respetan, y los marcadores también",
  sinRepeticiones(mixta) === mixta,
  sinRepeticiones(mixta)
);
probar(
  "si al quitar repeticiones un marcador queda vacío, desaparece",
  sinRepeticiones("Hola. [es] Hola. [en-US] Bye.") === "Hola. Bye.",
  sinRepeticiones("Hola. [es] Hola. [en-US] Bye.")
);

console.log("\nEl candado del español:");
const dosTramos = "You WENT. [es] Fuiste. [en-US] Where? [es] ¿Dónde? [en-US] Tell me.";
probar("como máximo un tramo en español por turno", limitarEspanol(dosTramos, 1) === "You WENT. [es] Fuiste. [en-US] Where? Tell me.", limitarEspanol(dosTramos, 1));
probar("sin español: se quitan los tramos enteros, con su texto", sinEspanol(dosTramos) === "You WENT. Where? Tell me.", sinEspanol(dosTramos));
probar("un tramo al final, sin marcador de cierre, también cuenta", sinEspanol("Hi. [es] Hola.") === "Hi.");
probar("un texto sin español queda igual", limitarEspanol("Hello, Ana!") === "Hello, Ana!");
probar("pulir: A1 conserva UN tramo y quita repeticiones", pulirRespuesta("Hi! Hi! [ES] Hola. [en-us] Bye. [es] Chao.", "A1") === "Hi! [es] Hola. [en-US] Bye.", pulirRespuesta("Hi! Hi! [ES] Hola. [en-us] Bye. [es] Chao.", "A1"));
probar("pulir: B2 no deja español", pulirRespuesta("Hi! [es] Hola. [en-US] Bye.", "B2") === "Hi! Bye.", pulirRespuesta("Hi! [es] Hola. [en-US] Bye.", "B2"));
probar("pulir: C1 y C2 tampoco", pulirRespuesta("Hi! [es] Hola. [en-US] Bye.", "C1") === "Hi! Bye." && pulirRespuesta("Hi! [es] Hola. [en-US] Bye.", "C2") === "Hi! Bye.");

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
const a1 = construirInstruccion({ nombre: "Ana Pérez", nivel: "A1" }, undefined, undefined, { turnos: 4, pidioEspanol: 3, usoEspanol: 2 });
probar("el español tiene un solo trabajo: la corrección", a1.includes("exactly ONE job: making a correction land"));
probar("explica el formato con el ejemplo de una corrección", a1.includes("[es] En pasado, 'go' se vuelve 'went'. [en-US]"));
probar("dice que la pantalla borra los marcadores y que nunca se mencionan", a1.includes("deletes the markers") && a1.includes("never mention them"));
probar("lleva la regla del nivel A1: una frase, tras la corrección", a1.includes("Your level rule (A1): when you correct a mistake, add ONE short"));
probar("sin corrección no hay español", a1.includes("If there is nothing to correct, there is no Spanish"));
probar("prohíbe traducir la respuesta y el andamio en las preguntas", a1.includes("never translates your reply") && !a1.includes("Spanish is part of the class"));
probar("manda decir cada cosa una sola vez", a1.includes("SAY EACH THING ONCE") && a1.includes("never ask your question twice"));
probar("si piden español: no traduce, simplifica y recuerda los botones", a1.includes("do NOT translate") && a1.includes("Translation button") && a1.includes("slow speed"));
probar("lleva las cifras del hábito y la recomendación a partir de 3", a1.includes("asked for Spanish 3 times") && a1.includes("3 or more") && a1.includes("train the ear"));
probar("la transcripción nunca lleva marcadores", a1.includes("Never put language markers here"));
probar("la última frase del turno es en inglés", a1.includes("last sentence of your turn\n  is always in English") || a1.includes("last sentence of your turn is always in English"));
probar("el nombre del alumno va en el prompt", a1.includes("Name: Ana."));
probar("las respuestas modelo van solo en inglés", !/\[es\] Las\s+dos son el pasado/.test(a1));

const b2 = construirInstruccion({ nombre: "Luis", nivel: "B2" });
probar("B2: nada de español, ni al corregir", b2.includes("Your level rule (B2): no Spanish at all") && b2.includes("at this level you never use it"));
probar("B2: sin el bloque de formato de marcadores (no lo necesita)", !b2.includes("How to write it"));
probar("sin señales, las cifras van en cero", b2.includes("In the last 0 student turns"));
for (const nivel of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
  const p = construirInstruccion({ nombre: "X", nivel });
  probar(`${nivel}: tiene su regla de español y el bloque de voz`, p.includes(`Your level rule (${nivel})`) && p.includes("SPANISH IN YOUR VOICE"));
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nPrompt y español correctos.");
