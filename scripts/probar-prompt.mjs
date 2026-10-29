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
const {
  construirInstruccion,
  pulirRespuesta,
  limitarCorrecciones,
  esPedidoDeAyuda,
  contieneErrorRepetido,
  marcarEspanolSuelto,
  componerRespuesta,
  hablaEspanolClaro,
  casoEfectivo,
  correccionesDelCaso,
  recortarOraciones,
  abrirPregunta,
  casoNueveFallido,
  bloqueMensajeAnterior,
  pistaDeSonidoCreible,
  esInglesClaro,
  sinGenero,
  separarIdiomas,
  sinRepetirElEspanol,
  preguntaSiEsReal,
  soloPideAyuda,
} = await import("../src/lib/allison.ts");
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
const plano = (s) => s.replace(/\s+/g, " ");
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
  sinRepeticiones("Muy bien hecho. [es] Muy bien hecho. [en-US] Bye.") === "Muy bien hecho. Bye.",
  sinRepeticiones("Muy bien hecho. [es] Muy bien hecho. [en-US] Bye.")
);
probar(
  "una o dos palabras se repiten a propósito (\"School. Say it with me: school.\")",
  sinRepeticiones("School. Say it with me. School. What do you like?") === "School. Say it with me. School. What do you like?"
);

console.log("\nEl candado del español:");
const dosTramos = "You WENT. [es] Fuiste. [en-US] Where? [es] ¿Dónde? [en-US] Tell me.";
probar("como máximo un tramo en español por turno", limitarEspanol(dosTramos, 1) === "You WENT. [es] Fuiste. [en-US] Where? Tell me.", limitarEspanol(dosTramos, 1));
probar("sin español: se quitan los tramos enteros, con su texto", sinEspanol(dosTramos) === "You WENT. Where? Tell me.", sinEspanol(dosTramos));
probar("un tramo al final, sin marcador de cierre, también cuenta", sinEspanol("Hi. [es] Hola.") === "Hi.");
probar("un texto sin español queda igual", limitarEspanol("Hello, Ana!") === "Hello, Ana!");
probar("pulir: A1 conserva UN tramo y quita repeticiones", pulirRespuesta("Nice to meet you! Nice to meet you! [ES] Hola. [en-us] Bye. [es] Chao.", "A1") === "Nice to meet you! [es] Hola. [en-US] Bye.", pulirRespuesta("Nice to meet you! Nice to meet you! [ES] Hola. [en-us] Bye. [es] Chao.", "A1"));
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
probar("el español tiene un solo trabajo: que algo se entienda", a1.includes("ONE job: making something land"));
probar("dos partes, dos idiomas: el español solo en su campo y la respuesta solo en inglés", a1.includes("TWO PARTS, TWO LANGUAGES") && plano(a1).includes('"espanol": ONLY Spanish') && plano(a1).includes('"respuesta": ONLY English. Not one Spanish word.'));
probar("el modelo nunca escribe marcadores: los pone la app", plano(a1).includes("Never write language codes like [es] or [en-US]"));
probar("lleva la regla del nivel A1: el español de los casos 2 a 10", plano(a1).includes('At A1, "espanol" is REQUIRED in cases 2 to 10'));
probar("en los casos 1 y 11 no hay español", plano(a1).includes('In cases 1 and 11 it is ""'));
probar("el español y el inglés nunca se repiten ni se traducen", plano(a1).includes("Never translate one into the other"));
probar("manda decir cada cosa una sola vez", plano(a1).includes("Say each thing once: never the same sentence twice, never your question twice"));
probar("desde 3 veces, lleva las cifras del hábito y el consejo", plano(a1).includes("They used or asked for Spanish in 3 of their last 4 turns") && a1.includes("slow speed"));
const retorno = a1.slice(a1.indexOf("WHAT YOU RETURN, in this order"));
probar(
  "devuelve los campos en orden: transcripción, caso, español, respuesta",
  retorno.length > 0 && retorno.indexOf('- "caso"') < retorno.indexOf('- "espanol"') && retorno.indexOf('- "espanol"') < retorno.indexOf('- "respuesta"')
);
probar("el nombre del alumno va en el prompt", a1.includes("Name: Ana."));
probar("las respuestas a preguntas de A1 llevan la regla en español", a1.includes("espanol: \"'Was' y 'were' son el pasado"));

const b2 = construirInstruccion({ nombre: "Luis", nivel: "B2" });
probar("B2: nada de español, ni al corregir", b2.includes("ONE LANGUAGE") && plano(b2).includes('"espanol" is always ""') && !b2.includes("TWO PARTS, TWO LANGUAGES"));
probar("B2: los ejemplos de los casos van solo en inglés", !b2.includes("espanol: \"") && b2.includes("respuesta: \"You played soccer -- it was yesterday"));
probar("sin señales, el bloque del hábito no aparece", !b2.includes("They used or asked for Spanish"));
for (const nivel of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
  const p = construirInstruccion({ nombre: "X", nivel });
  probar(`${nivel}: tiene su regla de idiomas y los casos`, (p.includes(`At ${nivel}, "espanol"`) || p.includes("ONE LANGUAGE")) && p.includes("THE CASES"));
}

console.log("\nLo aprobado en el plan de mejoras (secciones 2 y 3):");
probar("lleva la ficha de Allison (Nueva York, Luna, Cartagena)", a1.includes("From New York") && a1.includes("cat named Luna") && a1.includes("Cartagena"));
probar("lleva las 5 reglas para hablar de sí misma", a1.includes("HOW YOU TALK ABOUT YOURSELF") && a1.includes("Never invent facts about yourself"));
probar("dice que es una profesora con IA si se lo preguntan", plano(a1).includes("I'm an AI teacher"));
probar("lleva los casos, decididos en orden", a1.includes("THE CASES") && a1.includes("Decide it FIRST") && a1.includes("11 They said it right"));
probar("los ejemplos aprobados de los casos están", a1.includes("Como fue ayer, se dice 'played'") && a1.includes("Say it: I tidied my desk.") && a1.includes("Played. P, L, A, Y, E, D."));
probar("tabla de falsos amigos con su significado real", a1.includes("sensible = sensato") && a1.includes("embarrassed = avergonzado"));
probar("A1: el caso 2 es solo el verbo en el tiempo equivocado", plano(a1).includes("The verb is in the wrong time"));
probar("nunca repite en inglés la forma equivocada del alumno", plano(a1).includes('In "respuesta", never repeat their wrong form'));
probar("A1: UNA corrección en los casos 2 a 4, ninguna en los demás", plano(a1).includes('in cases 2, 3 and 4, ONE item in "correcciones"'));
probar("B1: sin el límite de una corrección", !construirInstruccion({ nombre: "X", nivel: "B1" }).includes("ONE item in"));
probar("pide preguntas abiertas, no de sí o no", plano(a1).includes('"respuesta" ends with an OPEN question'));
probar("inglés de Estados Unidos", a1.includes("Always US English"));
const conHistorial = construirInstruccion({ nombre: "Ana", nivel: "A1", erroresRepetidos: ["playet"], temasRecorridos: ["Saludos y presentarse (to be)"] });
probar("caso 5: lo decide el código, el prompt no lleva la lista de errores", !conHistorial.includes("MISTAKES THEY ALREADY MADE TWICE") && !conHistorial.includes("playet"));
probar("solo pregunta por lo recorrido", conHistorial.includes("Topics they have already studied: Saludos y presentarse (to be)"));
probar("sin temas recorridos no aparece ese bloque", !a1.includes("Topics they have already studied"));
probar("caso 9: el mensaje anterior va citado, con cada idioma aparte", bloqueMensajeAnterior([{ rol: "allison", texto: "Como fue ayer, se dice 'played'. You played!", textoVoz: "[es] Como fue ayer, se dice 'played'. [en-US] You played!" }]).includes('the Spanish part: "Como fue ayer, se dice \'played\'."') && bloqueMensajeAnterior([{ rol: "allison", texto: "For the past, add -ed." }]).includes('the English part: "For the past, add -ed."') && bloqueMensajeAnterior([]) === "");

const tres = [
  { tipo: "naturalidad", original: "a", correccion: "b", prioridad: "baja" },
  { tipo: "gramatica", original: "c", correccion: "d", prioridad: "alta" },
  { tipo: "vocabulario", original: "e", correccion: "f", prioridad: "media" },
];
const unaA1 = limitarCorrecciones(tres, "A1");
probar("código: A1 deja una sola corrección, la de prioridad alta", unaA1.length === 1 && unaA1[0].original === "c", JSON.stringify(unaA1));
probar("código: A2 también deja una", limitarCorrecciones(tres, "A2").length === 1);
probar("código: B1 deja todas", limitarCorrecciones(tres, "B1").length === 3);
probar("código: sin correcciones queda vacío", limitarCorrecciones([], "A1").length === 0);
probar("código: en los casos 6 y 9 no hay correcciones", correccionesDelCaso(tres, "6", "B2").length === 0 && correccionesDelCaso(tres, "9", "A1").length === 0);
probar("código: en A1 el caso 1 no corrige; el 2 sí", correccionesDelCaso(tres, "1", "A1").length === 0 && correccionesDelCaso(tres, "2", "A1").length === 3);
probar("código: en B1 el caso 1 sí reporta", correccionesDelCaso(tres, "1", "B1").length === 3);
probar("caso 9: reconoce que pide ayuda", esPedidoDeAyuda("I not understand what is the structure") && esPedidoDeAyuda("no entiendo") && esPedidoDeAyuda("Can you repeat please") && esPedidoDeAyuda("I don't understand"));
probar("caso 9: una frase normal no es pedido de ayuda", !esPedidoDeAyuda("I understand the movie") && !esPedidoDeAyuda("Yesterday I played soccer"));
probar("caso 5: reconoce el error repetido dentro de la frase", contieneErrorRepetido("On Sunday I playet basketball", ["playet"]));
probar("caso 5: un error nuevo no cuenta como repetido", !contieneErrorRepetido("I goed to school", ["playet"]));
probar("caso 5: no confunde partes de palabras ni palabras cortas", !contieneErrorRepetido("I played", ["play"]) && !contieneErrorRepetido("I have a dog", ["a"]));
probar("caso 5: sin lista no hay repetidos", !contieneErrorRepetido("I playet", []));

console.log("\nLo que el código arma con los campos del modelo:");
const armar = (caso, espanol, respuesta, extra = {}) =>
  componerRespuesta({ caso, espanol, respuesta, nivel: "A1", nombre: "Diego", ...extra });
probar(
  "caso 2: el español va primero y el inglés al final",
  armar("2", "Como fue ayer, se dice 'played'.", "You played soccer! Who did you play with?") === "[es] Como fue ayer, se dice 'played'. [en-US] You played soccer! Who did you play with?"
);
probar(
  "caso 6: siempre la frase fija, y cada idioma dice algo distinto",
  armar("6", "", "What? I don't know.") === "[es] No te oí bien. [en-US] Can you say it again?" &&
    componerRespuesta({ caso: "6", respuesta: "x", nivel: "B2", nombre: "D" }) === "Sorry, I didn't hear you. Can you say it again?",
  armar("6", "", "What? I don't know.")
);
probar(
  "caso 6: una frase clara en español sí se oyó (no es \"No te oí\")",
  armar("6", "", "Sorry, I didn't hear you.", { espanolClaro: true }) === "[es] Te entendí. [en-US] Now try to say it in English!" &&
    hablaEspanolClaro("te estoy preguntando que qué más puedes hacer") &&
    !hablaEspanolClaro("ay yo uhay") &&
    !hablaEspanolClaro("I like pizza")
);
probar("caso 6: si el modelo dice que no entendió, es el 6", casoEfectivo("1", "Sorry, I didn't understand that. Could you repeat it?", false) === "6" && casoEfectivo("9", "Can you say that again?", false) === "9");
probar(
  "caso 7: siempre \"Se dice así\" y sin el \"You say:\"",
  armar("7", "", "You say: I am hungry. Try saying it!") === "[es] Se dice así. [en-US] I am hungry. Try saying it!",
  armar("7", "", "You say: I am hungry. Try saying it!")
);
probar(
  "caso 5: elogio fijo y solo la pregunta, sin volver a explicar",
  armar("2", "Como fue ayer, se dice 'played'.", "You played soccer! Who did you play with?", { repetido: true }) === "[es] ¡Buen intento, Diego! Ya se entiende, sigamos. [en-US] Who did you play with?"
);
probar("caso 5: sin error repetido no existe (es un 11)", casoEfectivo("5", "I don't have social media.", false) === "11" && casoEfectivo("2", "x", true) === "5");
probar(
  "caso 10: el español va antes de la última oración",
  armar("10", "Suena 'pleid'.", "Played. P, L, A, Y, E, D. Try saying: I played.") === "Played. P, L, A, Y, E, D. [es] Suena 'pleid'. [en-US] Try saying: I played."
);
probar("caso 10: el deletreo con guiones pasa a comas", armar("10", "", "Birthday. B-I-R-T-H-D-A-Y. Try saying it!").includes("B, I, R, T, H, D, A, Y"));
probar(
  "caso 10: una pista de sonido inventada se cambia",
  armar("10", "Suena 'yuguei'.", "Played. P, L, A, Y, E, D. Try saying: I played.") === "Played. P, L, A, Y, E, D. [es] Escúchalo con atención. [en-US] Try saying: I played." &&
    pistaDeSonidoCreible("Suena 'jaus'.", "House. H, O, U, S, E.") && pistaDeSonidoCreible("Suena 'pleid'.", "Played. P, L, A, Y, E, D.")
);
probar("casos 1 y 11: nunca llevan español", armar("1", "Se dice 'hamburgers'.", "Mmm, hamburgers! What is your favorite?") === "Mmm, hamburgers! What is your favorite?");
probar(
  "si el modelo mete español en la respuesta y llena el campo, vale el campo",
  armar("2", "En pasado, 'go' cambia a 'went'.", "She went to Cali! [es] Fue a Cali. [en-US] What did she do?") === "[es] En pasado, 'go' cambia a 'went'. [en-US] She went to Cali! What did she do?"
);
probar("B2: el español del modelo se ignora", componerRespuesta({ caso: "2", espanol: "Hola.", respuesta: "You played! Who with?", nivel: "B2", nombre: "D" }) === "You played! Who with?");
probar("el español se recorta a dos oraciones (sin contar \"Claro.\")", recortarOraciones("Claro. Uno. Dos. Tres.", 2) === "Claro. Uno. Dos." && recortarOraciones("Uno. Dos.", 2) === "Uno. Dos.");
probar("una pregunta de sí o no recibe \"Tell me more!\"", abrirPregunta("Two brothers! Do you see them often?", "1") === "Two brothers! Do you see them often? Tell me more!" && abrirPregunta("What do they do?", "1") === "What do they do?" && abrirPregunta("Could you repeat?", "6") === "Could you repeat?");
probar("caso 9: falla si enseña el pedido de ayuda", casoNueveFallido("Para decir que no entiendes, dices 'I don't understand'.", "For the past, add -ed: I played."));
probar("caso 9: falla si no vuelve sobre el mensaje anterior", casoNueveFallido("Sorry. Can you say that again?", "Use 'was' with I: I was tired yesterday.") && !casoNueveFallido("Tranquilo. I was tired. Now you!", "Use 'was' with I: I was tired yesterday."));
probar(
  "caso 9: si falla, calma y el mensaje anterior otra vez",
  armar("9", "Para decir que no entiendes, dices 'I don't understand'.", "I don't understand.", { anterior: "For the past, add -ed: I played." }) === "[es] No te preocupes, vamos paso a paso. Escúchalo otra vez. [en-US] For the past, add -ed: I played."
);
console.log("\nCada parte en su idioma (el código):");
probar(
  "una oración inglesa dentro de \"espanol\" no se lee con la voz española",
  armar("7", "Se dice así. I am hungry.", "") === "[es] Se dice así. [en-US] I am hungry."
);
probar(
  "una oración española dentro de \"respuesta\" pasa al español si el campo vino vacío",
  armar("2", "", "Como fue ayer, se dice 'went'. Your sister went to the mall! What did she buy?") === "[es] Como fue ayer, se dice 'went'. [en-US] Your sister went to the mall! What did she buy?"
);
probar(
  "en los casos 1 y 11 el español que se coló en la respuesta se quita",
  armar("11", "", "No tengo redes sociales. I don't have social media. What apps do you like?") === "I don't have social media. What apps do you like?"
);
probar(
  "la frase aprobada de \"profesora con IA\" sí suena en el caso 11",
  armar("11", "Soy una profesora de inglés con inteligencia artificial.", "I'm an AI teacher. But I love talking with you!") === "I'm an AI teacher. [es] Soy una profesora de inglés con inteligencia artificial. [en-US] But I love talking with you!"
);
probar("las palabras citadas en inglés no vuelven inglés una oración española", !esInglesClaro("Como fue ayer, se dice 'played', con 'ed' al final.") && !esInglesClaro("'Was' y 'were' son el pasado de 'to be'.") && esInglesClaro("Say it: I tidied my desk."));
probar("\"Tranquilo\" y \"Tranquila\" pasan a \"No te preocupes\"", sinGenero("Tranquilo, vamos paso a paso.") === "No te preocupes, vamos paso a paso." && sinGenero("¡Tranquila!") === "¡No te preocupes!");
probar(
  "si le preguntan si es real, nunca dice que es una persona: va la respuesta aprobada",
  preguntaSiEsReal("Are you a real person?") && preguntaSiEsReal("¿Eres una persona de verdad?") && preguntaSiEsReal("are you a robot") && !preguntaSiEsReal("Are you from New York?") &&
    armar("11", "", "Yes, I am! It's nice to meet you. What do you like to do?", { preguntaIA: true }) ===
      "I'm an AI teacher. [es] Soy una profesora de inglés con inteligencia artificial. [en-US] But I love talking with you! What do you like to do?"
);
probar("\"ti mismo\" y \"ti misma\" pasan a \"ti\"", sinGenero("Para hablar de ti mismo en pasado.") === "Para hablar de ti en pasado.");
probar(
  "caso 9: \"It's okay\" y \"I will explain again\" traducen el español y se quitan",
  armar("9", "No te preocupes, Diego. Te explico de nuevo: 'was' va con I.", "It's okay, Diego. I will explain again. I was tired. Now you: I was...", { anterior: "Use 'was' with I: I was tired yesterday." }) ===
    "[es] No te preocupes, Diego. Te explico de nuevo: 'was' va con I. [en-US] I was tired. Now you: I was..."
);
probar(
  "el inglés que repite la regla dicha en español se quita; los ejemplos se quedan",
  sinRepetirElEspanol(
    "Was and were are the past of 'to be'. 'Was' goes with I, he, she, and it; 'were' goes with you, we, and they. I was happy. They were at home. Try saying: I was at school yesterday.",
    "'Was' y 'were' son el pasado de 'to be'. 'Was' va con I, he, she e it; 'were' va con you, we y they."
  ) === "I was happy. They were at home. Try saying: I was at school yesterday." &&
    sinRepetirElEspanol("You played soccer! Who did you play with?", "Como fue ayer, se dice 'played', con 'ed' al final.") === "You played soccer! Who did you play with?"
);
probar(
  "caso 9: el inglés no repite la regla ni traduce el \"No te preocupes\"",
  sinRepetirElEspanol(
    "Don't worry, Diego. To talk about yesterday, we add 'ed' to the end of the verb. Today I play. Yesterday I played. Now you: I played.",
    "No te preocupes, Diego. Para hablar de algo que pasó ayer, se agrega 'ed' al final del verbo.",
    "9"
  ) === "Today I play. Yesterday I played. Now you: I played."
);
probar(
  "caso 8: \"Use 'do' with...\" repite la regla y se quita",
  sinRepetirElEspanol("Use 'do' with I, you, we, and they. For example: Do you like music? Try saying: Do you like music?", "'Do' va con I, you, we, they.", "8") ===
    "For example: Do you like music? Try saying: Do you like music?"
);
probar(
  "caso 9: \"I asked if...\" traduce el español; va el inglés del mensaje anterior",
  armar("9", "No te preocupes. Te pregunté si te gusta la pizza.", "I asked if you like pizza.", { anterior: "What food do you like? Do you like pizza?" }) ===
    "[es] No te preocupes. Te pregunté si te gusta la pizza. [en-US] What food do you like? Do you like pizza?"
);
probar(
  "caso 8: los ejemplos que usan la regla se quedan",
  sinRepetirElEspanol("I play, I played. I go, I went. Try saying: I played soccer yesterday.", "Claro. En pasado se agrega 'ed'; 'go' pasa a 'went'.", "8") ===
    "I play, I played. I go, I went. Try saying: I played soccer yesterday."
);
probar(
  "\"I'm an AI teacher\" lleva la frase aprobada justo después, aunque el modelo la olvide",
  armar("11", "", "I'm an AI teacher. But I love talking with you! What is your favorite color?") ===
    "I'm an AI teacher. [es] Soy una profesora de inglés con inteligencia artificial. [en-US] But I love talking with you! What is your favorite color?"
);
probar("caso 9: \"para que entiendas\" no es un fallo; enseñar \"I don't understand\" sí", !casoNueveFallido("No te preocupes, para que entiendas: en pasado se agrega 'ed'. I played.", "For the past, add -ed: I played.") && casoNueveFallido("Se dice 'I don't understand'.", "For the past, add -ed.") && casoNueveFallido("Te pregunté si entendiste. Did you understand?", "Use was with I: I was tired."));
probar("caso 9: \"te explico otra vez\" + \"Do you understand now?\" es un fallo (tanda 1)", casoNueveFallido("No te preocupes, te explico otra vez. Do you understand now?", "We use 'do' for questions: Do you like pizza?"));
probar("el historial: de un mensaje mezclado queda solo el inglés", separarIdiomas("[es] Como fue ayer, se dice 'played'. [en-US] You played soccer! Who did you play with?").ingles === "You played soccer! Who did you play with?");

console.log("\nLo que encontró la auditoría (16-oct-2026):");
probar(
  "\"¿Cómo estás, Juan?\" dentro de la respuesta no se lee con la voz inglesa",
  !armar("11", "", "¿Cómo estás, Juan? You played soccer! What did you do?").includes("¿Cómo estás")
);
probar(
  "\"Well done!\" dentro del español pasa al inglés",
  armar("2", "Well done! Como fue ayer, se dice 'played'.", "You played soccer! Who did you play with?") ===
    "[es] Como fue ayer, se dice 'played'. [en-US] You played soccer! Who did you play with?"
);
probar(
  "\"se dice así: You played soccer\" se parte en sus dos idiomas",
  separarIdiomas("[es] Como fue ayer, se dice así: You played soccer yesterday.").ingles === "You played soccer yesterday."
);
probar(
  "una cita en español dentro de la respuesta se quita",
  !armar("7", "Se dice así.", "'Me acabo de levantar' is 'I just woke up'. I just woke up. Try saying it!").includes("levantar")
);
probar(
  "\"In English, 'mañana' is 'tomorrow'\" no se marca como español",
  !pulirRespuesta(armar("11", "", "Nice! In English, 'mañana' is 'tomorrow'. What will you do tomorrow?"), "A2").includes("[es]")
);
probar(
  "\"Could you repeat it?\" dentro del caso 4 no lo vuelve caso 6",
  casoEfectivo("4", "School. Could you repeat it? What do you like at school?", false) === "4" &&
    casoEfectivo("11", "Oh, you didn't understand the movie? What was it about?", false) === "11"
);
probar("\"Are you a Real Madrid fan?\" no es preguntar si Allison es real", !preguntaSiEsReal("Are you a Real Madrid fan?") && !preguntaSiEsReal("¿Es de verdad que te gusta el café?"));
probar(
  "una frase larga con \"didn't understand\" o \"again\" conserva sus correcciones",
  !soloPideAyuda("Yesterday I watch a movie but I didn't understand it") && !soloPideAyuda("I want to go to Cartagena again") && soloPideAyuda("no entiendo") && soloPideAyuda("Can you repeat? I not understand")
);
probar(
  "nunca una respuesta vacía: el español suelto se dice con su voz",
  armar("11", "", "¡Hola Juan! Estoy muy bien. ¿Y tú?") === "[es] ¡Hola Juan! Estoy muy bien. ¿Y tú?" &&
    componerRespuesta({ caso: "11", espanol: "", respuesta: "¡Hola! ¿Y tú?", nivel: "B2", nombre: "J" }) === "Let's keep going! What else can you tell me?"
);
probar(
  "B1 caso 4: \"escucha cómo suena\" va antes de la palabra",
  componerRespuesta({ caso: "4", espanol: "Casi. Escucha cómo suena.", respuesta: "School. Say it with me: school. What do you like at school?", nivel: "B1", nombre: "J" }).startsWith("[es] Casi.")
);
probar(
  "una pregunta de sí o no con el nombre delante también recibe \"Tell me more!\"",
  componerRespuesta({ caso: "11", espanol: "", respuesta: "Nice! Juan, do you play every day?", nivel: "A1", nombre: "Juan" }).endsWith("Tell me more!")
);
probar("\"¿Listo?\" y \"Bienvenido\" no dependen del género", sinGenero("¿Listo? Bienvenido.") === "¿Vamos? Te damos la bienvenida.");
probar(
  "caso 9: si el mensaje anterior era una pregunta, lo citado no es el tema",
  !casoNueveFallido("No te preocupes. Te pregunté qué comiste hoy. What did you eat today?", "Yes, 'I cleaned', perfect! What did you eat today?")
);
probar(
  "caso 5 forzado sin pregunta: una pregunta abierta fija, nunca \"Say it:\"",
  armar("3", "'Take' significa llevar.", "Say it: I tidied my desk.", { repetido: true }) === "[es] ¡Buen intento, Diego! Ya se entiende, sigamos. [en-US] What else can you tell me?"
);
probar(
  "caso 8: \"They are used for questions...\" y \"Was goes with I...\" repiten la regla",
  sinRepetirElEspanol("They are used for questions and negatives in the present simple. Try saying: Do you like music?", "Claro. 'Do' y 'does' se usan para preguntas.", "8") === "Try saying: Do you like music?" &&
    sinRepetirElEspanol("Was goes with I, he, she, and it. I was happy. Try saying: I was at school.", "Was y were son el pasado de 'to be'.", "8") === "I was happy. Try saying: I was at school."
);
probar("\"te sientes aburrido\" pasa a \"te aburres\"", sinGenero("Si tú te sientes aburrido, se dice 'bored'.") === "Si tú te aburres, se dice 'bored'.");
probar(
  "B1 caso 3: la explicación va antes de \"Say it:\"",
  componerRespuesta({ caso: "3", espanol: "'Boring' significa que algo aburre.", respuesta: "Say it: I am bored. What makes you bored?", nivel: "B1", nombre: "J" }).startsWith("[es] 'Boring'")
);
probar(
  "caso 8: una lista de pronombres (\"I, he, she\") es la regla repetida; \"I do, you do\" es un ejemplo",
  sinRepetirElEspanol("Was is with I, he, she, and it. Try saying: I was at school.", "Was va con I, he, she e it.", "8") === "Try saying: I was at school." &&
    sinRepetirElEspanol("I do, you do, we do. He does, she does. Try saying: I do.", "'Do' va con I, you, we.", "8") === "I do, you do, we do. He does, she does. Try saying: I do."
);
const suelto = marcarEspanolSuelto("Tranquilo, Diego, vamos paso a paso: para hablar de ayer solo se agrega 'ed' a los verbos. Today: I play. Yesterday: I played.");
probar("marcas: el español sin [es] se marca solo", suelto.startsWith("[es] Tranquilo") && suelto.includes("verbos. [en-US] Today: I play."));
probar("marcas: el inglés solo queda igual", marcarEspanolSuelto("You played soccer! Who did you play with?") === "You played soccer! Who did you play with?");
probar("marcas: si el modelo puso marcas, se respetan", marcarEspanolSuelto("Sorry. [es] No te oí. [en-US] Can you repeat?") === "Sorry. [es] No te oí. [en-US] Can you repeat?");
probar("marcas: un nombre con tilde no vuelve español una frase", !marcarEspanolSuelto("Have you been to Bogotá? It is a big city.").includes("[es]"));

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nPrompt y español correctos.");
