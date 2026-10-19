/**
 * Las reglas de "Mi ruta" sin base de datos (src/lib/ruta/estado.ts):
 * qué está abierto, qué sigue, saltar paradas, alumnos actuales,
 * estrellas y cuándo se completa el nivel. Y lo que Allison responde en
 * Adivina (A2), armado con la tabla del contenido.
 *
 *   node scripts/probar-ruta.mjs
 */
const {
  estadoDeRuta,
  claveDe,
  pasoDe,
  estrellasDeLeccion,
  estrellasDeEscenario,
  pasaElSalto,
  actividadPrincipal,
} = await import("../src/lib/ruta/estado.ts");
const { RUTA_A1 } = await import("../src/lib/ruta/index.ts");
const { esCorreccionDe, tareasObvias, respuestaDeEntrevista } = await import("../src/lib/ruta/escena.ts");
const { PARADA_01 } = await import("../src/lib/ruta/a1/parada-01.ts");
const { PARADA_07 } = await import("../src/lib/ruta/a1/parada-07.ts");
const { PARADA_01: A2_P01 } = await import("../src/lib/ruta/a2/parada-01.ts");
const { PARADA_09: A2_P09 } = await import("../src/lib/ruta/a2/parada-09.ts");
const { respuestaCorta, respuestaDeAdivina, preguntaDeEjemplo, barajarRondas } = await import("../src/lib/ruta/adivina.ts");
const { estaEnLoDicho, palabrasDeRepite } = await import("../src/lib/evaluacion.ts");
const { palabrasDeFrase, lugaresDeLetra, respuestaCompleta, letraDicha } = await import("../src/lib/ruta/rayas.ts");
const { rutaDe } = await import("../src/lib/ruta/index.ts");
const { srcIlustracion } = await import("../src/lib/ruta/ilustracion.ts");

let fallos = 0;
let total = 0;
function ok(nombre, condicion, detalle = "") {
  total++;
  if (!condicion) {
    fallos++;
    console.log(`  ✗ ${nombre}${detalle ? `: ${detalle}` : ""}`);
  }
}

const claves = RUTA_A1.map((p) => claveDe("A1", p));
const leccionesDe = (clave) => pasoDe(clave).paso[pasoDe(clave).paso.tipo].lecciones.length;
const hecha = (parada, leccion) => ({ parada, leccion, paso: 0, estrellas: 3, completada: true });
const sello = (parada, extra = {}) => ({ parada, estrellas: 3, sello: true, saltada: false, anterior: false, saltoHoy: false, ...extra });

// Claves estables
ok("12 pasos en la ruta A1", claves.length === 12, claves.join(","));
ok("claves", claves[0] === "a1-p01" && claves[5] === "a1-r1" && claves[11] === "a1-rf", claves.join(","));
ok("pasoDe vuelve al paso", claves.every((c) => claveDe("A1", pasoDe(c).paso) === c));
ok("pasoDe de una clave inventada", pasoDe("a1-p99") === null && pasoDe("b2-p01") === null);

// Alumno nuevo: solo la lección 1 de la parada 1
{
  const e = estadoDeRuta("A1", [], []);
  ok("nuevo: sigue la lección 1 de Miami", e.siguiente?.parada === "a1-p01" && e.siguiente?.leccion === 1, JSON.stringify(e.siguiente));
  ok("nuevo: la parada 1 en curso", e.paradas[0].estado === "en-curso");
  ok("nuevo: la lección 2 bloqueada", e.paradas[0].lecciones[1].estado === "bloqueada");
  ok("nuevo: el escenario bloqueado", e.paradas[0].escenario.estado === "bloqueado");
  ok("nuevo: la parada 2 bloqueada y se puede saltar", e.paradas[1].estado === "bloqueada" && e.paradas[1].puedeSaltar);
  ok("nuevo: el Repaso final no se puede saltar", !e.paradas[11].puedeSaltar);
  ok("nuevo: 0 de 12 sellos", e.sellos === 0 && e.totalSellos === 12);
  ok("nuevo: el ícono de la lección 1 es ¿Qué es esto?", e.paradas[0].lecciones[0].principal === "que-es-esto");
}

// Lección a medias: el globo dice la actividad que sigue
{
  const e = estadoDeRuta("A1", [{ parada: "a1-p01", leccion: 1, paso: 1, estrellas: 0, completada: false }], []);
  ok("a medias: paso 1", e.paradas[0].lecciones[0].paso === 1 && e.paradas[0].lecciones[0].estado === "actual");
}

// Las cuatro lecciones hechas: el escenario es lo que sigue
{
  const filas = [1, 2, 3, 4].map((n) => hecha("a1-p01", n));
  const e = estadoDeRuta("A1", filas, []);
  ok("4 lecciones: sigue el escenario", e.siguiente?.leccion === "escenario", JSON.stringify(e.siguiente));
  ok("4 lecciones: escenario actual", e.paradas[0].escenario.estado === "actual");
}

// Escenario pasado: se abre la parada 2
{
  const filas = [1, 2, 3, 4].map((n) => hecha("a1-p01", n));
  const e = estadoDeRuta("A1", filas, [sello("a1-p01")]);
  ok("sello: parada 1 superada", e.paradas[0].estado === "superada" && e.paradas[0].sello);
  ok("sello: sigue la parada 2", e.siguiente?.parada === "a1-p02" && e.siguiente?.leccion === 1);
  ok("sello: 1 de 12", e.sellos === 1);
}

// Saltar hasta la parada 5 desde la 3: la 3 y la 4 quedan saltadas, la 5 con sello
{
  const filas = [1, 2, 3, 4].flatMap((n) => [hecha("a1-p01", n), hecha("a1-p02", n)]);
  const paradas = [
    sello("a1-p01"),
    sello("a1-p02"),
    sello("a1-p03", { sello: false, saltada: true, estrellas: 0 }),
    sello("a1-p04", { sello: false, saltada: true, estrellas: 0 }),
    sello("a1-p05", { saltada: true, estrellas: 2 }),
  ];
  const e = estadoDeRuta("A1", filas, paradas);
  ok("salto: la 3 saltada", e.paradas[2].estado === "saltada");
  ok("salto: la 5 con estampilla", e.paradas[4].sello && e.paradas[4].estado === "superada");
  ok("salto: sigue el Repaso 1", e.siguiente?.parada === "a1-r1", JSON.stringify(e.siguiente));
  ok("salto: lecciones de la saltada abiertas", e.paradas[2].lecciones.every((l) => l.estado === "disponible"));
  ok("salto: no completa el nivel", !e.completa);
}

// Alumnos actuales: unidades completas en la versión anterior
{
  const paradas = ["a1-p01", "a1-p02"].map((p) => sello(p, { sello: false, anterior: true, estrellas: 0 }));
  const e = estadoDeRuta("A1", [], paradas);
  ok("anterior: la 1 se ve saltada", e.paradas[0].estado === "saltada" && e.paradas[0].anterior);
  ok("anterior: sin estampilla", e.sellos === 0);
  ok("anterior: sigue en la parada 3", e.siguiente?.parada === "a1-p03" && e.siguiente?.leccion === 1, JSON.stringify(e.siguiente));
}

// Alumnos actuales con unidades más adelante hechas: se ven saltadas, no bloqueadas
{
  const paradas = ["a1-p01", "a1-p02", "a1-p06", "a1-p07"].map((p) => sello(p, { sello: false, anterior: true, estrellas: 0 }));
  const e = estadoDeRuta("A1", [], paradas);
  ok("anterior adelante: la 6 se ve saltada", e.paradas[6].estado === "saltada", e.paradas[6].estado);
  ok("anterior adelante: sus lecciones abiertas", e.paradas[6].lecciones.every((l) => l.estado === "disponible"));
  ok("anterior adelante: sin oferta de salto", !e.paradas[6].puedeSaltar);
  ok("anterior adelante: sigue en la 3", e.siguiente?.parada === "a1-p03", JSON.stringify(e.siguiente));
}

// Todo superado pero con lecciones pendientes: lo siguiente es lo que falta
{
  const paradas = claves.map((c) => sello(c, { saltada: c !== "a1-rf" }));
  const e = estadoDeRuta("A1", [], paradas);
  ok("pendientes: sigue la primera lección que falta", e.siguiente?.parada === "a1-p01" && e.siguiente?.leccion === 1);
  ok("pendientes: no completa el nivel", !e.completa);
}

// Repaso final con paradas saltadas y lecciones pendientes: no se abre
{
  const filasRF = Array.from({ length: leccionesDe("a1-rf") }, (_, i) => hecha("a1-rf", i + 1));
  const paradas = claves.filter((c) => c !== "a1-rf").map((c) => sello(c, { saltada: true }));
  const e = estadoDeRuta("A1", filasRF, paradas);
  ok("final: el escenario sigue cerrado", e.paradas[11].escenario.estado === "bloqueado", e.paradas[11].escenario.estado);
  ok("final: lo siguiente es la primera lección pendiente", e.siguiente?.parada === "a1-p01" && e.siguiente?.leccion === 1, JSON.stringify(e.siguiente));
  ok("final: cuenta las pendientes", e.leccionesPendientes === 44, String(e.leccionesPendientes));
}

// Nivel completo
{
  const filas = claves.flatMap((c) => Array.from({ length: leccionesDe(c) }, (_, i) => hecha(c, i + 1)));
  const e = estadoDeRuta("A1", filas, claves.map((c) => sello(c)));
  ok("completo: el nivel queda completo", e.completa);
  ok("completo: no hay siguiente", e.siguiente === null);
  ok("completo: 12 de 12", e.sellos === 12);
}

// Otros niveles: todavía sin ruta escrita
ok("A2 sin ruta escrita", estadoDeRuta("A2", [], []) === null);

// Estrellas
ok("lección 80 % → 3", estrellasDeLeccion(4, 5) === 3);
ok("lección 50 % → 2", estrellasDeLeccion(1, 2) === 2);
ok("lección 0 % → 1", estrellasDeLeccion(0, 3) === 1);
ok("lección sin calificar → 3", estrellasDeLeccion(0, 0) === 3);
ok("escenario completo sin ayuda → 3", estrellasDeEscenario(4, 4, 0) === 3);
ok("escenario completo con ayuda → 2", estrellasDeEscenario(4, 4, 2) === 2);
ok("escenario la mitad → 1", estrellasDeEscenario(2, 4, 0) === 1);
ok("escenario menos de la mitad → 0", estrellasDeEscenario(1, 4, 0) === 0);
ok("salto: 2 estrellas y 1 ayuda pasa", pasaElSalto(2, 1));
ok("salto: 2 ayudas no pasa", !pasaElSalto(2, 2));
ok("salto: 1 estrella no pasa", !pasaElSalto(1, 0));

// Escenas
ok("corrección: I from → I'm from", esCorreccionDe("I from Colombia.", "I'm from Colombia."));
ok("corrección: no es otra respuesta", !esCorreccionDe("I am fine.", "My name is..."));
ok("corrección: igual no cuenta", !esCorreccionDe("Good morning!", "Good morning."));
ok("tarea obvia: saluda", JSON.stringify(tareasObvias(PARADA_01.escenario, "Hello!")) === "[1]");
ok("tarea obvia: despídete", JSON.stringify(tareasObvias(PARADA_01.escenario, "Thank you. Goodbye!")) === "[4]");
ok(
  "tarea obvia: da las gracias y despídete",
  tareasObvias(PARADA_07.escenario, "Thanks! Bye!").includes(PARADA_07.escenario.tareas.length)
);
ok("tarea obvia: nada", tareasObvias(PARADA_01.escenario, "My name is Diego.").length === 0);
const ent = PARADA_01.lecciones[3].actividades.find((a) => a.tipo === "entrevista");
{
  const r = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "pregunta", dato: 2, espanol: false }, descubiertos: [], turno: 0 });
  ok("entrevista: responde con la ficha y devuelve", r.respuesta === "I'm from New York! It's a big, busy city! And you?" && r.descubierto === 2, r.respuesta);
  const es = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "pregunta", dato: 2, espanol: true }, descubiertos: [], turno: 0 });
  ok("entrevista: en español, sin mezclar en una oración", es.respuestaVoz.startsWith("[es]") && es.respuestaVoz.includes("[en-US] Where are you from?"), es.respuestaVoz);
  const otro = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "otro", dato: 0, espanol: false }, descubiertos: [1], turno: 3 });
  ok("entrevista: no se entiende → la pregunta que sigue", otro.respuesta.endsWith("Where are you from?"), otro.respuesta);
}
ok("actividad principal", actividadPrincipal(PARADA_01.lecciones[0].actividades) === "que-es-esto");

// --- Adivina (A2) --------------------------------------------------------
ok("respuesta corta: do", respuestaCorta("Do you cook?", true) === "Yes, I do." && respuestaCorta("Do you cook?", false) === "No, I don't.");
ok("respuesta corta: are", respuestaCorta("Are you going to be outside?", false) === "No, I'm not.");
ok("respuesta corta: is/was", respuestaCorta("Is it for your feet?", false) === "No, it isn't." && respuestaCorta("Was it expensive?", true) === "Yes, it was.");
ok("respuesta corta: did", respuestaCorta("Did you buy any shoes?", false) === "No, I didn't.");
ok("respuesta corta: would you like", respuestaCorta("Would you like to go on the river?", true) === "I'd love to!" && respuestaCorta("Would you like to see art?", false) === "No, thanks.");
const adv = A2_P01.lecciones[3].actividades.find((a) => a.tipo === "adivina");
{
  const ronda = { secreto: "pilot", descartadas: [], preguntadas: [], ultima: false };
  const p = respuestaDeAdivina(adv, { tipo: "pregunta", fila: 4, opcion: 0, espanol: false }, ronda);
  ok("adivina: contesta con la tabla", p.respuesta === "Yes, I do." && p.entendida && !p.fallo, p.respuesta);
  ok("adivina: apaga las que no darían esa respuesta", p.descartar.sort().join() === "farmer,teacher", p.descartar.join());
  const no = respuestaDeAdivina(adv, { tipo: "pregunta", fila: 1, opcion: 0, espanol: false }, ronda);
  ok("adivina: un no apaga las del sí", no.respuesta === "No, I don't." && no.descartar.join() === "nurse", no.descartar.join());
  const mal = respuestaDeAdivina(adv, { tipo: "adivina", fila: 0, opcion: 1, espanol: false }, ronda);
  ok("adivina: adivina mal", mal.respuesta === "No! Ask me more." && mal.descartar.join() === "chef" && !mal.gano);
  const bien = respuestaDeAdivina(adv, { tipo: "adivina", fila: 0, opcion: 6, espanol: false }, ronda);
  ok("adivina: adivina bien y sigue otra ronda", bien.gano && /You got it! Let's play again/.test(bien.respuesta), bien.respuesta);
  const fin = respuestaDeAdivina(adv, { tipo: "adivina", fila: 0, opcion: 6, espanol: false }, { ...ronda, ultima: true });
  ok("adivina: la última ronda cierra", fin.gano && fin.respuesta.endsWith("Great job!"), fin.respuesta);
  const abierta = respuestaDeAdivina(adv, { tipo: "abierta", fila: 0, opcion: 0, espanol: false }, ronda);
  ok("adivina: pregunta abierta → el secreto", abierta.respuesta === adv.secreto && abierta.fallo);
  const otra = respuestaDeAdivina(adv, { tipo: "otra", fila: 0, opcion: 0, espanol: false }, ronda);
  ok("adivina: fuera de la tabla no cuenta como fallo", !otra.fallo && !otra.entendida && otra.respuesta.startsWith("Hmm"));
  const es = respuestaDeAdivina(adv, { tipo: "pregunta", fila: 7, opcion: 0, espanol: true }, ronda);
  ok("adivina: en español, la pregunta en inglés (sin español)", es.respuesta === "Do you work in a school? Try it!" && es.fallo, es.respuesta);
  const esNada = respuestaDeAdivina(adv, { tipo: "otro", fila: 0, opcion: 0, espanol: true }, ronda);
  ok("adivina: en español sin entender → un ejemplo en inglés", /^Ask me in English! Try this: .+?$/.test(esNada.respuesta), esNada.respuesta);
  ok("adivina: la ayuda parte las tarjetas en dos (2 y 4)", preguntaDeEjemplo(adv, [], []) === "Do you work outside?", preguntaDeEjemplo(adv, [], []));
  ok("adivina: con una sola tarjeta, adivinarla", preguntaDeEjemplo(adv, ["chef", "nurse", "police officer", "teacher", "farmer"], []) === "Are you a pilot?");
  const ropa = A2_P09.lecciones[3].actividades.find((a) => a.tipo === "adivina");
  const medias = ropa.opciones.findIndex((o) => o.nombre === "socks") + 1;
  const pares = respuestaDeAdivina(ropa, { tipo: "adivina", fila: 0, opcion: medias, espanol: false }, { secreto: "socks", descartadas: [], preguntadas: [], ultima: true });
  ok("adivina: lo que dice Allison al adivinar las medias", pares.gano && pares.respuesta === "Yes! I bought five pairs! You got it! Great job!", pares.respuesta);
  const orden = barajarRondas(["pilot", "nurse"], () => 0);
  ok("adivina: barajar no pierde rondas", orden.slice().sort().join() === "nurse,pilot");
}

// --- Cuéntame y A2 ---------------------------------------------------------
ok("relato: la cita está en lo dicho", estaEnLoDicho("I study math.", "I go to school at seven. I study math and art."));
ok("relato: una frase inventada no", !estaEnLoDicho("I play soccer.", "I go to school at seven."));
ok("ilustración: la del nivel y la reutilizada", srcIlustracion("f-chef-cocina", "A2") === "/ilustraciones/a2/f-chef-cocina.webp" && srcIlustracion("a1/a-profesor", "A2") === "/ilustraciones/a1/a-profesor.webp");
ok("A2: sin RUTA_A2 sigue la ruta provisional", process.env.RUTA_A2 === "1" || rutaDe("A2") === null);

// --- Las rayas de ¿Qué es esto? (se llenan con palabras y letras) ----------
{
  ok("rayas: palabras sin puntuación y con el apóstrofo", palabrasDeFrase("It's ten o'clock.").join("|") === "It's|ten|o'clock");
  ok("rayas: la coma no lleva raya", palabrasDeFrase("Yes, he has.").join("|") === "Yes|he|has");
  const gm = palabrasDeFrase("Good morning");
  ok("rayas: la O va en tres lugares", lugaresDeLetra(gm, "o").join() === "0:1,0:2,1:1");
  ok("rayas: sin las letras de una palabra ya dicha", lugaresDeLetra(gm, "o", [0]).join() === "1:1");
  ok("rayas: una letra que no tiene", lugaresDeLetra(gm, "z").length === 0);
  ok("rayas: completa con una palabra dicha y las letras de la otra", respuestaCompleta(gm, [0], ["1:0", "1:1", "1:2", "1:3", "1:4", "1:5", "1:6"]));
  ok("rayas: incompleta si falta una letra", !respuestaCompleta(gm, [0], ["1:0", "1:1"]));
  ok("rayas: el apóstrofo no hay que hallarlo", respuestaCompleta(palabrasDeFrase("It's"), [], ["0:0", "0:1", "0:3"]));
  const letras = [["G.", "g"], ["Gee", "g"], ["the letter G", "g"], ["la jota", "j"], ["double you", "w"], ["Eye", "i"], ["Good", null], ["good morning", null], ["", null]];
  for (const [dicho, letra] of letras) ok(`rayas: letra dicha "${dicho}"`, letraDicha(dicho) === letra, String(letraDicha(dicho)));
  // La evaluación devuelve las palabras en el mismo orden que las rayas.
  const dicho = palabrasDeRepite("Good morning", "good");
  ok("rayas: dijo solo «good»", dicho.map((w) => w.estado).join() === "bien,mejorar", JSON.stringify(dicho));
  ok("rayas: las palabras de la evaluación son las de las rayas", palabrasDeRepite("It's ten o'clock.", "").map((w) => w.palabra).join("|") === palabrasDeFrase("It's ten o'clock.").join("|"));
}

console.log(`${total - fallos}/${total} comprobaciones de la ruta bien.`);
process.exit(fallos ? 1 : 0);
