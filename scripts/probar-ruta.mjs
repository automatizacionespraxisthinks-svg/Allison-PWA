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
const { esCorreccionDe, tareasObvias, respuestaDeEntrevista, tareasDelTurno, otraClaseDePregunta, otraPersona } = await import("../src/lib/ruta/escena.ts");
const { PARADA_01 } = await import("../src/lib/ruta/a1/parada-01.ts");
const { PARADA_02 } = await import("../src/lib/ruta/a1/parada-02.ts");
const { PARADA_07 } = await import("../src/lib/ruta/a1/parada-07.ts");
const { PARADA_01: A2_P01 } = await import("../src/lib/ruta/a2/parada-01.ts");
const { PARADA_09: A2_P09 } = await import("../src/lib/ruta/a2/parada-09.ts");
const { respuestaCorta, respuestaDeAdivina, preguntaDeEjemplo, barajarRondas, preguntaDelAlumno } = await import("../src/lib/ruta/adivina.ts");
const { estaEnLoDicho, palabrasDeRepite, comentarioVerificado, dibujosContados } = await import("../src/lib/evaluacion.ts");
const { palabrasDeFrase, lugaresDeLetra, respuestaCompleta, letraDicha } = await import("../src/lib/ruta/rayas.ts");
const { citaDe, frasesDe } = await import("../src/lib/ruta/frases.ts");
const { EXPRESIONES, expresionDelDia } = await import("../src/lib/expresiones.ts");
const { limpiarTranscripcion } = await import("../src/lib/transcripcion.ts");
const { sinEcoDelAlumno } = await import("../src/lib/ruta/escena.ts");
const { CATALOGO } = await import("../src/lib/escenarios/datos.ts");
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
ok("escenario completo antes del mínimo → 2", estrellasDeEscenario(4, 4, 0, false) === 2);
ok("escenario completo con el mínimo → 3", estrellasDeEscenario(4, 4, 0, true) === 3);
ok("escenario la mitad antes del mínimo → 1", estrellasDeEscenario(2, 4, 0, false) === 1);
ok("salto: completo antes del mínimo pasa", pasaElSalto(estrellasDeEscenario(4, 4, 0, false), 0));
ok("salto: 2 estrellas y 1 ayuda pasa", pasaElSalto(2, 1));
ok("salto: 2 ayudas no pasa", !pasaElSalto(2, 2));
ok("salto: 1 estrella no pasa", !pasaElSalto(1, 0));

// Escenas
ok("corrección: I from → I'm from", esCorreccionDe("I from Colombia.", "I'm from Colombia."));
ok("corrección: no es otra respuesta", !esCorreccionDe("I am fine.", "My name is..."));
ok("corrección: igual no cuenta", !esCorreccionDe("Good morning!", "Good morning."));
ok("tarea obvia: saluda", JSON.stringify(tareasObvias(PARADA_01.escenario, "Hello!")) === "[1]");
ok("tarea obvia: despídete", JSON.stringify(tareasObvias(PARADA_01.escenario, "Thank you. Goodbye!")) === "[7]");
ok(
  "tarea obvia: da las gracias y despídete",
  tareasObvias(PARADA_07.escenario, "Thanks! Bye!").includes(PARADA_07.escenario.tareas.length)
);
ok("tarea obvia: nada", tareasObvias(PARADA_01.escenario, "I like pizza.").length === 0 && tareasObvias(PARADA_01.escenario, "I'm happy.").length === 0);
{
  const p1 = (dicho) => JSON.stringify(tareasObvias(PARADA_01.escenario, dicho));
  ok(
    "tarea obvia: cómo estás",
    p1("I'm fine, thanks. And you?") === "[2]" && p1("Fine, thank you.") === "[2]" && p1("Good, thanks!") === "[2]",
    p1("I'm fine, thanks. And you?")
  );
  ok("tarea obvia: \"Good morning!\" es solo el saludo", p1("Good morning!") === "[1]" && p1("Good afternoon.") === "[1]", p1("Good morning!"));
  ok("tarea obvia: el nombre", p1("My name is Diego.") === "[3]" && p1("I'm Diego.") === "[3]", p1("I'm Diego."));
  ok("tarea obvia: la edad", p1("I'm 15.") === "[4]" && p1("I am fifteen years old.") === "[4]", p1("I'm 15."));
  ok("tarea obvia: de dónde", p1("I'm from Colombia.") === "[5]" && p1("I from Colombia.") === "[]", p1("I from Colombia."));
  // Los falsos positivos que encontró la auditoría (octubre de 2026).
  ok("tarea obvia: \"Nice to see you\" no es despedirse", p1("Hi Allison! Nice to see you!") === "[1]" && p1("Hi, Laura! I can see you too!") === "[1]", p1("Hi Allison! Nice to see you!"));
  ok("tarea obvia: \"See you later!\" sí es despedirse", p1("See you later!") === "[7]" && p1("OK. See you!") === "[7]", p1("See you later!"));
  ok("tarea obvia: \"I'm Colombian\" no es el nombre", p1("I'm Colombian.") === "[]", p1("I'm Colombian."));
  ok("tarea obvia: \"I'm good at soccer\" no es cómo estás", p1("I'm good at soccer.") === "[]" && p1("Great! My name is Diego.") === "[3]", p1("Great! My name is Diego."));
  ok("tarea obvia: la edad de otro no es la suya", p1("My brother is ten years old.") === "[]", p1("My brother is ten years old."));
  ok("tarea obvia: con apóstrofo curvo", p1("I’m from Colombia.") === "[5]" && p1("I’m 15.") === "[4]", p1("I’m from Colombia."));
  // Los viajes: 6 tareas (3 del documento y 3 agregadas), y la última es despedirse.
  const { VIAJES } = await import("../src/lib/ruta/viajes.ts");
  const { escenarioDeViaje } = await import("../src/lib/ruta/viaje.ts");
  const malos = VIAJES.filter((v) => {
    const e = escenarioDeViaje(v);
    return e.tareas.length < 5 || e.tareas.length > 7 || JSON.stringify(tareasObvias(e, "Thank you! Goodbye!")) !== `[${e.tareas.length}]`;
  });
  ok("viajes: de 5 a 7 tareas y la última es la despedida", malos.length === 0, malos.map((v) => v.pais).join(", "));
  const aeropuerto = CATALOGO.find((c) => c.clave === "cat:aeropuerto").escenario;
  ok("tarea obvia: saluda y di tu nombre (las dos)", JSON.stringify(tareasObvias(aeropuerto, "Good morning! My name is Diego.")) === "[1]" && tareasObvias(aeropuerto, "My name is Diego.").length === 0);
}
const ent = PARADA_01.lecciones[3].actividades.find((a) => a.tipo === "entrevista");
{
  const r = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "pregunta", dato: 2, espanol: false }, descubiertos: [], turno: 0 });
  ok("entrevista: responde con la ficha y devuelve", r.respuesta === "I'm from New York! It's a big, busy city! And you?" && r.descubierto === 2, r.respuesta);
  const es = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "pregunta", dato: 2, espanol: true }, descubiertos: [], turno: 0 });
  ok("entrevista: en español, sin mezclar en una oración", es.respuestaVoz.startsWith("[es]") && es.respuestaVoz.includes("[en-US] Where are you from?"), es.respuestaVoz);
  const otro = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "otro", dato: 0, espanol: false }, descubiertos: [1], turno: 3 });
  ok("entrevista: no se entiende → la pregunta que sigue", otro.respuesta.endsWith("Where are you from?"), otro.respuesta);
  // "I'm from Colombia. How old are you?": contesta el "And you?" y pregunta.
  const ambas = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "pregunta", dato: 3, responde: true, espanol: false }, descubiertos: [1, 2], turno: 3 });
  ok(
    "entrevista: responde y pregunta → reacciona, contesta y devuelve",
    ambas.respuesta === "Oh, nice! I'm 28. And you?" && ambas.descubierto === 3 && ambas.devuelta === "How old are you?",
    ambas.respuesta
  );
  // Auditoría del 28 de octubre de 2026.
  const bucle = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "pregunta", dato: 1, responde: true, espanol: false }, descubiertos: [1], turno: 1 });
  ok("entrevista: \"My name is Diego. And you?\" no repite su nombre en bucle", bucle.descubierto === null && bucle.devuelta === null && /Ask me another question/.test(bucle.respuesta), bucle.respuesta);
  const dos = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "pregunta", dato: 2, otroDato: 3, responde: false, espanol: false }, descubiertos: [1], turno: 0 });
  ok("entrevista: dos preguntas en un turno → contesta las dos", dos.descubierto === 2 && dos.otroDescubierto === 3 && dos.respuesta.includes("New York") && dos.respuesta.includes("I'm 28"), dos.respuesta);
  const social = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "social", dato: 0, responde: false, espanol: false }, descubiertos: [], turno: 0 });
  ok("entrevista: un saludo no es ayuda ni da la pregunta en español", social.respuesta === "OK! Ask me a question!", social.respuesta);
  const completa = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "otro", dato: 0, responde: false, espanol: false }, descubiertos: [1, 2, 3, 4, 5], turno: 0 });
  ok("entrevista: con la ficha completa sigue la charla en inglés y le pregunta ella", completa.devuelta && !/Pregúntame/.test(completa.respuesta), completa.respuesta);
  const cierra = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "pregunta", dato: 5, responde: false, espanol: false }, descubiertos: [1, 2, 3, 4], turno: 9, alcanzaMinimo: true });
  ok("entrevista: el último dato con el mínimo cumplido cierra sin devolver", cierra.devuelta === null && /Thank you for your questions/.test(cierra.respuesta), cierra.respuesta);
  // "When is Luna's birthday?" no es "How old is Luna?" (tanda 1, 29 de octubre de 2026).
  ok("entrevista: cumpleaños no es edad", otraClaseDePregunta("When is Luna's birthday?", "How old is Luna?"));
  ok("entrevista: edad no es nombre", otraClaseDePregunta("How old is your mom?", "What's your mom's name?"));
  ok("entrevista: la misma clase sí", !otraClaseDePregunta("Luna is how old?", "How old is Luna?") && !otraClaseDePregunta("Your age?", "How old are you?"));
  ok("entrevista: sin clase no se descarta", !otraClaseDePregunta("Do you have a pet?", "Do you have a pet?") && !otraClaseDePregunta("I'm 15. When is your birthday?", "When is your birthday?"));
  ok("entrevista: otra persona de la ficha no es ese dato", otraPersona("Luna birthday?", "When is Emily's birthday?", ["Luna", "Emily"]));
  ok("entrevista: la misma persona, o un dato sin nombre, sí", !otraPersona("Emily birthday?", "When is Emily's birthday?", ["Luna", "Emily"]) && !otraPersona("Hi! Luna is cute. When is your birthday?", "When is your birthday?", ["Luna", "Emily"]));
  const fuera = respuestaDeEntrevista({ entrevista: ent, clasificacion: { tipo: "otro", dato: 0, espanol: false, fuera: true }, descubiertos: [1], turno: 3 });
  ok("entrevista: pregunta fuera de la ficha → no la sabe y no sopla", /I don't know/.test(fuera.respuesta) && !/Pregúntame/.test(fuera.respuesta) && fuera.descubierto === null, fuera.respuesta);
  const ent2 = PARADA_02.lecciones[3].actividades.find((a) => a.tipo === "entrevista");
  const ajeno = ent2.datos.findIndex((d) => /^her name/i.test(d.respuesta)) + 1;
  if (ajeno) {
    const r2 = respuestaDeEntrevista({ entrevista: ent2, clasificacion: { tipo: "pregunta", dato: ajeno, responde: false, espanol: false }, descubiertos: [], turno: 0 });
    ok("entrevista: \"Her name is…\" no se devuelve con \"And you?\"", r2.devuelta === null && !/And you\?/.test(r2.respuesta), r2.respuesta);
  }
}
ok("actividad principal", actividadPrincipal(PARADA_01.lecciones[0].actividades) === "que-es-esto");

// --- Escenarios: lo que el código cuenta o descarta (verificación del 28 de octubre de 2026) ---
{
  const { PARADA_04: A2_P04 } = await import("../src/lib/ruta/a2/parada-04.ts");
  const { PARADA_08: A2_P08 } = await import("../src/lib/ruta/a2/parada-08.ts");
  const { PARADA_10: A2_P10 } = await import("../src/lib/ruta/a2/parada-10.ts");
  const { PARADA_07: B1_P07 } = await import("../src/lib/ruta/b1/parada-07.ts");
  const turno = (e, pendientes, dicho, tareas = [], antes = []) =>
    tareasDelTurno({ e, pendientes: new Set(pendientes), dicho, modelo: { tareas, aMedias: [] }, antes, despidioAntes: false });
  ok("escena: la frase del ejemplo cuenta aunque el modelo no la cuente", turno(A2_P04.escenario, [4, 5], "No, I've never eaten haggis. Is it good?").tareas.includes(4));
  // Tanda 1 (29 de octubre de 2026): una línea del ejemplo de otra tarea no cumple esta.
  const { PARADA_05: B1_P05 } = await import("../src/lib/ruta/b1/parada-05.ts");
  const biblioteca = "Yes. I've been volunteering at a library since January. I read stories to children every Saturday.";
  ok("escena: la línea de la tarea 2 no cumple la 3", !turno(B1_P05.escenario, [2, 3, 4, 5], biblioteca, [2, 3]).tareas.includes(3));
  ok("escena: su propia línea sí", turno(B1_P05.escenario, [3, 4, 5], "Because I love being outside, and I'm good with kids. I've been helping my little cousins with their homework for two years.", [3]).tareas.includes(3));
  const super_ = CATALOGO.find((c) => c.clave === "cat:supermercado").escenario;
  ok("escena: una línea del ejemplo sin tarea no cumple ninguna", !turno(super_, [3, 4, 5, 6], "Yes. Are there apples?", [3]).tareas.includes(3));
  ok("escena: con algo suyo además, decide el modelo", turno(super_, [3, 4, 5, 6], "Yes. Are there apples? How much are they?", [3]).tareas.includes(3));
  const { VIAJES: TODOS_LOS_VIAJES } = await import("../src/lib/ruta/viajes.ts");
  const { escenarioDeViaje: deViaje } = await import("../src/lib/ruta/viaje.ts");
  const roma = deViaje(TODOS_LOS_VIAJES.find((v) => v.numero === 6));
  ok("escena: en un viaje, contar en pasado cumple \"Cuenta qué hiciste… (pasado)\"", turno(roma, [5, 6], "Last weekend I visited my grandparents and we cooked pasta together.").tareas.includes(5));
  ok("escena: en presente no", !turno(roma, [5, 6], "On weekends I visit my grandparents and we cook pasta together.").tareas.includes(5));
  ok("escena: solo preguntar no es pagar", !turno(A2_P08.escenario, [5], "How much are the cough drops?", [5]).tareas.includes(5));
  ok("escena: pagar con \"Here you go\" sí", turno(A2_P08.escenario, [5], "Here you go. Thank you so much!", [5]).tareas.includes(5));
  ok("escena: preguntar el precio no es comparar", !turno(A2_P10.escenario, [3], "We need two bedrooms. How much is the park apartment?", [3]).tareas.includes(3));
  ok("escena: \"cheaper than\" sí compara", turno(A2_P10.escenario, [3], "The park one is cheaper than the other one.", [3]).tareas.includes(3));
  const primera = turno(B1_P07.escenario, [4], "Oh no! Then you should see Blue River. It's a movie that was made here in Quebec.");
  const segunda = turno(B1_P07.escenario, [4], "No, it isn't. It's about a boy who loves hockey. It's funny and very interesting.", [], primera.aMedias);
  ok("escena: una tarea de dos líneas, dichas en dos turnos, se cumple", primera.aMedias.some((a) => a.tarea === 4) && segunda.tareas.includes(4), JSON.stringify([primera, segunda]));
  ok("escena: a medias, la respuesta afirmativa que sigue la completa (\"Since yesterday.\")", turno(A2_P08.escenario, [2, 3], "Since yesterday.", [], [{ tarea: 2, falta: "since when" }]).tareas.includes(2));
  ok("escena: a medias por la despedida, otra frase no la completa", !turno(A2_P04.escenario, [5], "I like Scotland a lot.", [], [{ tarea: 5, falta: "say goodbye" }]).tareas.includes(5));
}

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
  // La respuesta corta va con lo que preguntó el alumno (tanda 1, 29 de octubre de 2026).
  const tienda = A2_P09.lecciones.flatMap((l) => l.actividades).find((a) => a.tipo === "adivina");
  const caras = tienda.preguntas.findIndex((q) => /expensive/i.test(q.pregunta)) + 1;
  const ellas = respuestaDeAdivina(tienda, { tipo: "pregunta", fila: caras, opcion: 0, espanol: false }, { secreto: "socks", descartadas: [], preguntadas: [], ultima: false }, "Are they expensive?");
  ok("adivina: \"Are they expensive?\" → \"No, they aren't.\"", ellas.respuesta === "No, they aren't.", ellas.respuesta);
  const tabla = respuestaDeAdivina(tienda, { tipo: "pregunta", fila: caras, opcion: 0, espanol: false }, { secreto: "socks", descartadas: [], preguntadas: [], ultima: false }, "Expensive?");
  ok("adivina: sin forma conocida, la de la tabla", tabla.respuesta === "No, it wasn't.", tabla.respuesta);
  ok("respuesta corta: they, he y she", respuestaCorta("Were they cheap?", true) === "Yes, they were." && respuestaCorta("Do they keep you warm?", false) === "No, they don't." && respuestaCorta("Is he a pilot?", true) === "Yes, he is." && respuestaCorta("Does she cook?", false) === "No, she doesn't.");
  ok("adivina: la pregunta del alumno, después de lo que dijo antes", preguntaDelAlumno("Hmm, okay. Are they for your feet?") === "Are they for your feet?" && preguntaDelAlumno("Socks?") === null);
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

// --- Narra: la parte que se pide además de la historia (tanda 1, 29 de octubre de 2026) ---
{
  const { seguimientoDeNarra, traeLaParte } = await import("../src/lib/ruta/seguimiento.ts");
  const narraDe = async (archivo, nombre) =>
    (await import(`../src/lib/ruta/b1/${archivo}`))[nombre].lecciones.flatMap((l) => l.actividades).find((a) => a.tipo === "narra");
  const torta = seguimientoDeNarra(await narraDe("parada-09.ts", "PARADA_09"));
  ok("narra p09: dos ideas con could o might", torta?.cuantas === 2 && torta.marcadores.join() === "could,might" && torta.pregunta === "What could they do now?", JSON.stringify(torta));
  const historia = "First Zoe's mom baked a cake. Then the dog jumped on the table. After that the cake fell on the floor. Everybody looked at the cake.";
  ok("narra p09: sin ideas falta la parte", !traeLaParte(historia, torta));
  ok("narra p09: una idea no basta", !traeLaParte(`${historia} They could buy a new cake.`, torta));
  ok("narra p09: dos ideas sí", traeLaParte(`${historia} They could buy a new cake, or they might eat ice cream.`, torta));
  ok("narra p09: una con \"or\" también", traeLaParte(`${historia} Now they could buy a cake or eat ice cream.`, torta));
  const robo = seguimientoDeNarra(await narraDe("repaso-1.ts", "REPASO_1"));
  ok("narra repaso 1: la opinión", robo?.cuantas === 1 && robo.pregunta === "And what do you think?" && traeLaParte("In my opinion, she should use a better lock.", robo) && !traeLaParte("The thief had already left.", robo), JSON.stringify(robo));
  const oso = seguimientoDeNarra(await narraDe("repaso-final.ts", "REPASO_FINAL"));
  ok("narra repaso final: una idea con could, might o may", oso?.marcadores.join() === "could,might,may" && oso.pregunta === "And what could the family do?" && traeLaParte("So the family might keep the food in the car.", oso), JSON.stringify(oso));
  const conParte = [
    [await narraDe("parada-09.ts", "PARADA_09"), torta],
    [await narraDe("repaso-1.ts", "REPASO_1"), robo],
    [await narraDe("repaso-final.ts", "REPASO_FINAL"), oso],
  ];
  ok("narra: el modelo de Allison trae la parte", conParte.every(([a, s]) => traeLaParte(a.modelo, s)));
  const sinParte = seguimientoDeNarra(await narraDe("parada-01.ts", "PARADA_01"));
  ok("narra sin parte extra: nada", sinParte === null);
}

// --- Cuéntame y A2 ---------------------------------------------------------
ok("relato: la cita está en lo dicho", estaEnLoDicho("I study math.", "I go to school at seven. I study math and art."));
ok("relato: una frase inventada no", !estaEnLoDicho("I play soccer.", "I go to school at seven."));
// El comentario de Cuéntame y Narra, con lo que devolvería el modelo
// (auditoría, 28 de octubre de 2026): cuántas frases, qué mejora y qué
// elogio se muestran, y en qué orden contó los dibujos.
{
  const cv = (d, t, extra) => comentarioVerificado(d, t, "A2", extra);
  const tirada = "I go to school at six and I study math and English and after school I do my homework and I play soccer with my friends";
  ok("relato: cada idea con su verbo es una frase", cv({ frases: ["I go to school at six", "I study math and English", "after school I do my homework", "I play soccer with my friends"] }, tirada).frases === 4);
  const cuatro = "I go to school. I go to school. I go to school. I go to school.";
  ok("relato: la misma frase cuatro veces es una", cv({ frases: Array(4).fill("I go to school.") }, cuatro).frases === 1);
  ok("relato: una frase que no dijo no cuenta", cv({ frases: ["I go to school.", "I play soccer."] }, cuatro).frases === 1);
  ok("relato: una palabra suelta no es frase", cv({ frases: ["I go to school.", "Math."] }, "I go to school. Math.").frases === 1);
  const mixto = "After school I play fútbol with my friends. Estudio matemáticas y inglés. Luego voló a Vancouver.";
  ok("relato: lo dicho en español no cuenta", cv({ frases: mixto.split(/(?<=\.) /) }, mixto).frases === 1);
  const mejora = (dijo, mejor, t = dijo, extra) => cv({ mejorDijo: dijo, mejorFrase: mejor }, t, extra).mejora;
  const inventadas = [
    ["First Zoe checked her bag in Toronto.", "Zoe checked her bag in Toronto."],
    ["Now her bag hasn't arrived.", "Now her bag has not arrived."],
    ["I go to school at six.", "I go to school at six o'clock."],
    ["I go to school at six.", "I go to school at 6 AM."],
    ["Math.", "I like math."],
    ["first she flew to Vancouver and then she waited", "First, she flew to Vancouver, then she waited."],
  ];
  for (const [dijo, mejor] of inventadas) ok(`relato: "${dijo}" → "${mejor}" no se muestra`, !mejora(dijo, mejor), JSON.stringify(mejora(dijo, mejor)));
  ok(
    "relato: una frase del modelo de Allison no se corrige",
    !mejora("sent to Canada by plane.", "it was sent to Canada by plane.", "Then it was put in a box and sent to Canada by plane.", { modelo: "Then it was put in a box and sent to Canada by plane." })
  );
  ok("relato: una frase en español no se corrige", !mejora("Luego voló a Vancouver.", "Then she flew to Vancouver."));
  const reales = [
    ["I happy.", "I am happy."],
    ["I study in the school.", "I study at school."],
    ["In my opinion is better live in a big city.", "In my opinion, it is better to live in a big city."],
    ["The bag no arrive.", "The bag didn't arrive."],
    ["Although they didn't agree, but they found a solution.", "Although they didn't agree, they found a solution."],
    ["Because it was raining, so we stayed home.", "Because it was raining, we stayed home."],
  ];
  for (const [dijo, mejor] of reales) ok(`relato: "${dijo}" sí se corrige`, !!mejora(dijo, mejor));
  const conMaleta = "Zoe checked her maleta. Then she flew to Vancouver.";
  ok("relato: lo bien hecho no es la frase que se corrige", !cv({ bienFrase: "Zoe checked her maleta.", mejorDijo: "Zoe checked her maleta.", mejorFrase: "Zoe checked her suitcase." }, conMaleta).bien);
  ok("relato: lo bien hecho puede ser otra frase", !!cv({ bienFrase: "Then she flew to Vancouver.", mejorDijo: "Zoe checked her maleta.", mejorFrase: "Zoe checked her suitcase." }, conMaleta).bien);
  ok(
    "relato: lo bien hecho no es un error previsto",
    !cv({ bienFrase: "When the police arrived, the thief left." }, "He rode away. When the police arrived, the thief left.", { previstas: ["When the police arrived, the thief left"] }).bien
  );
  const media = "Zoe checked her maleta. Then she flew to Vancouver. Después esperó una hora. Her bag is lost.";
  ok("relato: una frase en español no vuelve español todo el relato", !cv({ espanol: true, frases: ["Zoe checked her maleta.", "Then she flew to Vancouver.", "Her bag is lost."] }, media).espanol);
  ok("relato: en español sí", cv({ espanol: true, frases: [] }, "Yo voy al colegio a las seis. Juego fútbol.").espanol);
  const alReves = "Her bag hasn't arrived. She waited for one hour. She flew to Vancouver. She checked her bag in Toronto.";
  const citas = [
    { dibujo: 1, cita: "She checked her bag in Toronto." },
    { dibujo: 2, cita: "She flew to Vancouver." },
    { dibujo: 3, cita: "She waited for one hour." },
    { dibujo: 4, cita: "Her bag hasn't arrived." },
  ];
  ok("narra: los dibujos en el orden en que los contó", dibujosContados(citas, 4, alReves).join() === "4,3,2,1", dibujosContados(citas, 4, alReves).join());
  const mitad = "Zoe checked her bag in Toronto. Luego voló a Vancouver. Esperó una hora por la maleta. Her bag hasn't arrived.";
  const citasMitad = [
    { dibujo: 1, cita: "Zoe checked her bag in Toronto." },
    { dibujo: 2, cita: "Luego voló a Vancouver." },
    { dibujo: 3, cita: "She waited an hour for the bag." },
    { dibujo: 4, cita: "Her bag hasn't arrived." },
  ];
  ok("narra: un dibujo contado en español o traducido no cuenta", dibujosContados(citasMitad, 4, mitad).join() === "1,4", dibujosContados(citasMitad, 4, mitad).join());
  ok("narra: una cita con una palabra corregida sí cuenta", dibujosContados([{ dibujo: 1, cita: "Zoe gave her bag in the airport" }], 4, "Zoe give her bag in the airport. She fly.").join() === "1");
}
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

// --- Lo que se oyó y lo que dice Allison en la escena (pruebas en producción) -
{
  ok("transcripción: solo marcas de tiempo es silencio", limpiarTranscripcion("00:00 00:01 00:02") === "");
  ok("transcripción: sin las marcas en medio", limpiarTranscripcion("00:00 00:01 I don't know 00:02 00:03") === "I don't know");
  ok("transcripción: marcas con corchetes", limpiarTranscripcion("[00:01] Hello [0:02]") === "Hello");
  ok("transcripción: una hora dicha se queda", limpiarTranscripcion("It's 7:30") === "It's 7:30" && limpiarTranscripcion("At 10:00") === "At 10:00");
  ok("transcripción: un número solo es voz", limpiarTranscripcion("15") === "15");
  ok("transcripción: el eco duplicado", limpiarTranscripcion("I like soccer a lot I like soccer a lot") === "I like soccer a lot");
  ok(
    "transcripción: las notas de que no hubo voz",
    limpiarTranscripcion("[silence]") === "" && limpiarTranscripcion("(inaudible)") === "" && limpiarTranscripcion("[Música] Hello") === "Hello" && limpiarTranscripcion("Silence.") === ""
  );
  ok("transcripción: el apóstrofo curvo", limpiarTranscripcion("I’m from Colombia.") === "I'm from Colombia.");
  ok("escena: no dice como suya la frase del alumno", sinEcoDelAlumno("I'm from Colombia. Why are you here?", "I from Colombia") === "Why are you here?");
  ok("escena: su reacción sí se queda", sinEcoDelAlumno("I like pizza too! What else?", "I like pizza") === "I like pizza too! What else?");
  ok("escena: hablar de sí misma se queda", sinEcoDelAlumno("My name is Allison. And you?", "My name is Diego") === "My name is Allison. And you?");
  ok("escena: una línea en segunda persona no se toca", sinEcoDelAlumno("Oh, you're from Colombia! Nice!", "I from Colombia") === "Oh, you're from Colombia! Nice!");
  ok(
    "escena: si el alumno le preguntó (\"And you?\"), su respuesta se queda",
    sinEcoDelAlumno("I'm fine, thank you! What's your name?", "I'm fine, thank you. And you?") === "I'm fine, thank you! What's your name?"
  );
  // Restaurante en producción (octubre de 2026): "Okay okay, somos 14
  // personas" contó la tarea como inglés, y "Fourteen people? Wow! This
  // way, please." pasó por pregunta y la escena perdió el hilo.
  const { mezclaEspanol, llevaPregunta, sinFrasesFueraDeLugar, sinPreguntasDeInformacion, sinRepetirLaAnterior } = await import(
    "../src/lib/ruta/escena.ts"
  );
  // Producción, 25 de octubre de 2026: después de un "yes", Allison dijo su línea anterior otra vez.
  const anteriorAeropuerto = "Oh, you are from the United States? Is this your first time here?";
  ok(
    "escena: Allison no repite su línea anterior; va la pregunta de la tarea que sigue",
    sinRepetirLaAnterior(anteriorAeropuerto, anteriorAeropuerto, "Why are you here?") === "Okay! Why are you here?" &&
      sinRepetirLaAnterior(`Okay. ${anteriorAeropuerto}`, anteriorAeropuerto, "Why are you here?") === "Okay! Why are you here?"
  );
  ok(
    "escena: sin otra pregunta, solo vuelve a preguntar (sin lo demás)",
    sinRepetirLaAnterior(anteriorAeropuerto, anteriorAeropuerto, null) === "Is this your first time here?"
  );
  ok(
    "escena: una línea nueva, o una anterior muy corta, no se toca",
    sinRepetirLaAnterior("Why are you here?", anteriorAeropuerto, "Why are you here?") === "Why are you here?" &&
      sinRepetirLaAnterior("Hi! How are you?", "Hi!", null) === "Hi! How are you?"
  );
  ok(
    "escena: si sigue una pregunta del alumno, Allison no la hace ella (las que lo invitan se quedan)",
    sinPreguntasDeInformacion("Yes, it is! It's very old. Who built Chichén Itzá?") === "Yes, it is! It's very old." &&
      sinPreguntasDeInformacion("Gladiators fought there. What else do you want to know?") === "Gladiators fought there. What else do you want to know?" &&
      sinPreguntasDeInformacion("It's huge! Do you like it?") === "It's huge! Do you like it?"
  );
  const restaurante = CATALOGO.find((c) => c.clave === "cat:restaurante").escenario;
  const aeropuertoE = CATALOGO.find((c) => c.clave === "cat:aeropuerto").escenario;
  ok(
    "escena: Allison no dice la frase del alumno (pregunta o en primera persona)",
    sinFrasesFueraDeLugar("Okay. Can I have the check, please?", restaurante, new Set([5, 6]), []) === "Okay." &&
      sinFrasesFueraDeLugar("I'm here on vacation. Why are you here?", aeropuertoE, new Set([3, 4, 5, 6]), []) === "Why are you here?"
  );
  ok(
    "escena: tampoco repite la pregunta de la tarea que se acaba de cumplir",
    sinFrasesFueraDeLugar("And what would you like to drink?", restaurante, new Set([3, 4, 5, 6]), [3]) === "" &&
      sinFrasesFueraDeLugar("Here you go. Enjoy! Would you like a dessert?", restaurante, new Set([4, 5, 6]), []) ===
        "Here you go. Enjoy! Would you like a dessert?"
  );
  ok(
    "escena: español mezclado con muletillas en inglés es español",
    mezclaEspanol("Okay Okay somos 14 personas") && mezclaEspanol("Una hamburguesa, por favor") && mezclaEspanol("¿Cuánto cuesta?")
  );
  ok(
    "escena: inglés con un nombre o una palabra suelta en español sigue siendo inglés",
    !mezclaEspanol("Hello, good morning.") &&
      !mezclaEspanol("I'm from Cartagena de Indias.") &&
      !mezclaEspanol("My name is Diego de la Torre.") &&
      !mezclaEspanol("I want a hamburguesa, please.") &&
      !mezclaEspanol("Hi! Just one, please.")
  );
  ok(
    "escena: un eco corto no es pregunta; una pregunta de verdad sí",
    !llevaPregunta("Fourteen people? Wow! This way, please.") &&
      !llevaPregunta("Here's your table.") &&
      llevaPregunta("Great! What would you like to eat?") &&
      llevaPregunta("Anything else?") &&
      llevaPregunta("What would you like to drink? We have lemonade.")
  );
}

// --- La Guía de frases: lo que dice cada persona, sin "Sarah says:" ---------
{
  ok("frases: la cita de lo contado", citaDe('Sarah says: "Hi, I\'m Sarah."') === "Hi, I'm Sarah." && citaDe('Sarah dice: "Hola, soy Sarah."') === "Hola, soy Sarah.");
  ok("frases: una frase de Allison no es cita", citaDe("Good morning") === null && citaDe("I said: I'd love to!") === null);
  const guia = frasesDe(RUTA_A1[0]);
  ok("frases: la guía no trae «says:»", guia.every((f) => !/\b(says|asks|dice|pregunta):/.test(f.en + f.es)), guia.map((f) => f.en).join(" | "));
  ok("frases: la guía trae lo que dice cada uno", guia.some((f) => f.en === "Where are you from?" && f.es === "¿De dónde eres?"));
  ok("frases: sin frases a medias", RUTA_A1.flatMap(frasesDe).every((f) => !f.en.endsWith("…")));
}

// --- La frase del día: expresiones de los nativos que no se traducen literal --
{
  const comparable = (s) => s.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").trim();
  // Español que sirva para un muchacho o una muchacha (como en el prompt de Allison).
  const DE_GENERO = /\b(tranquil|cansad|list|bienvenid|aburrid|enferm|nervios|content|llen|solit|perdid|rendid|agotad)[oa]s?\b/i;
  for (const [nivel, lista] of Object.entries(EXPRESIONES)) {
    ok(`expresiones ${nivel}: al menos 25`, lista.length >= 25, String(lista.length));
    const repetidas = lista.map((e) => comparable(e.en)).filter((x, i, todas) => todas.indexOf(x) !== i);
    ok(`expresiones ${nivel}: sin repetidas`, repetidas.length === 0, repetidas.join(" | "));
    const incompletas = lista.filter((e) => !e.en?.trim() || !e.significa?.trim() || !e.literal?.trim() || !e.ejemplo?.trim());
    ok(`expresiones ${nivel}: completas`, incompletas.length === 0, incompletas.map((e) => e.en).join(" | "));
    const literales = lista.filter((e) => comparable(e.literal) === comparable(e.significa));
    ok(`expresiones ${nivel}: lo que significa no es la traducción literal`, literales.length === 0, literales.map((e) => e.en).join(" | "));
    const conGenero = lista.filter((e) => DE_GENERO.test(e.significa));
    ok(`expresiones ${nivel}: español sin género`, conGenero.length === 0, conGenero.map((e) => e.significa).join(" | "));
    const ejemploEnEspanol = lista.filter((e) => /[¿¡ñáéíóú]/i.test(e.ejemplo) || /[¿¡ñáéíóú]/i.test(e.en));
    ok(`expresiones ${nivel}: la expresión y el ejemplo, en inglés`, ejemploEnEspanol.length === 0, ejemploEnEspanol.map((e) => e.en).join(" | "));
  }
  const dias = Array.from({ length: 30 }, (_, d) => expresionDelDia("A1", new Date(Date.UTC(2026, 9, 1) + d * 86_400_000).toISOString().slice(0, 10)).en);
  ok("expresión del día: 30 días, 30 distintas", new Set(dias).size === 30, String(new Set(dias).size));
  ok("expresión del día: el mismo día, la misma", expresionDelDia("A2", "2026-10-24").en === expresionDelDia("A2", "2026-10-24").en);
  ok("expresión del día: desde B1, las de B1", EXPRESIONES.B1.some((e) => e.en === expresionDelDia("C1", "2026-10-24").en));
}

// --- El mapa que se dibuja con las indicaciones (A1, parada 10) -------------
{
  const { leerIndicaciones, sumarLinea, mapaDe, trazarMapa, MAPA_VACIO } = await import("../src/lib/ruta/indicaciones.ts");
  const { PARADA_10 } = await import("../src/lib/ruta/a1/parada-10.ts");
  const META = "bus stop";
  const pasos = (t) => JSON.stringify(leerIndicaciones(t, META).pasos);
  ok("mapa: derecho una cuadra y a la derecha", pasos("Go straight one block and turn right.") === '[{"derecho":1},{"gira":"derecha"}]');
  ok("mapa: dicho despacio, igual", pasos("Go straight… one block… and turn right.") === '[{"derecho":1},{"gira":"derecha"}]');
  ok("mapa: walk two blocks and take a left", pasos("Walk two blocks and take a left.") === '[{"derecho":2},{"gira":"izquierda"}]');
  ok("mapa: las cuadras sueltas son las del derecho", pasos("Go straight. It's two blocks.") === '[{"derecho":2}]');
  ok("mapa: sin indicaciones, nada", pasos("It's twenty minutes by bus. Don't walk, it's very far!") === "[]");
  const esquina = leerIndicaciones("Yes! The bus stop is on the corner, across from a café.", META).lugares[0];
  ok("mapa: la parada en la esquina, frente a un café", esquina?.nombre === META && esquina.esquina && esquina.frente === "café", JSON.stringify(esquina));
  const junto = leerIndicaciones("There's a drugstore next to the bus stop.", META).lugares[0];
  ok("mapa: la droguería junto a la parada", junto?.nombre === "drugstore" && junto.junto === META, JSON.stringify(junto));
  const ella = leerIndicaciones("It's on your left, next to the bank.", META).lugares[0];
  ok('mapa: "it" es la meta', ella?.nombre === META && ella.lado === "izquierda" && ella.junto === "bank", JSON.stringify(ella));

  // El diálogo de ejemplo de la escena: el camino, la parada, el café y la droguería.
  const lineas = PARADA_10.escenario.dialogo.filter((d) => d.quien === "personaje").map((d) => d.dice);
  const e = lineas.reduce((m, l) => sumarLinea(m, l, META), MAPA_VACIO);
  const t = trazarMapa(e, PARADA_10.escenario.mapa);
  const lugar = (n) => t.lugares.find((l) => l.nombre === n);
  ok("mapa de la escena: una cuadra y a la derecha", JSON.stringify(e.pasos) === '[{"derecho":1},{"gira":"derecha"}]', JSON.stringify(e.pasos));
  ok("mapa de la escena: el camino termina frente a la parada", t.camino.at(-1).x === lugar(META)?.calle.x, JSON.stringify(t.camino));
  ok("mapa de la escena: el café, al otro lado de la calle", lugar("café") && Math.sign(lugar("café").y - t.camino.at(-1).y) === -Math.sign(lugar(META).y - t.camino.at(-1).y));
  ok("mapa de la escena: la droguería, del mismo lado que la parada", lugar("drugstore") && lugar("drugstore").y === lugar(META).y && lugar("drugstore").x !== lugar(META).x);
  ok("mapa de la escena: el bus llega al puente", t.bus && t.destino && t.bus.at(-1).x === t.destino.x && t.bus.at(-1).y > t.destino.y);
  ok("mapa de la escena: una línea sin indicaciones no lo cambia", sumarLinea(e, "Are you a tourist?", META) === e);
  const repetida = sumarLinea(e, "Go straight… one block… and turn right.", META);
  ok("mapa de la escena: repetido, se vuelve a dibujar sin agregar", JSON.stringify(repetida.pasos) === JSON.stringify(e.pasos) && repetida.nuevoDesde === 0 && repetida.vuelta > e.vuelta);
  ok("mapa de la escena: then turn left, se agrega", sumarLinea(e, "Then turn left.", META).pasos.length === 3);
  ok("mapa de la escena: otro camino lo reemplaza", JSON.stringify(sumarLinea(e, "Sorry! Go straight two blocks and turn left.", META).pasos) === '[{"derecho":2},{"gira":"izquierda"}]');

  // Tu turno: lo que se ve es la respuesta (la parada, junto al banco).
  const tt = PARADA_10.lecciones[1].actividades.find((a) => a.tipo === "tu-turno");
  const m = trazarMapa(mapaDe(tt.mapa.indicaciones, tt.mapa.meta), tt.mapa);
  const [parada, banco, cafe] = ["bus stop", "bank", "café"].map((n) => m.lugares.find((l) => l.nombre === n));
  ok("Tu turno: el mapa muestra la parada, el banco y el café", parada && banco && cafe);
  ok("Tu turno: la parada queda junto al banco", parada && banco && parada.x === banco.x && Math.abs(parada.y - banco.y) < 50);
  ok("Tu turno: el café no queda junto a la parada", cafe && parada && cafe.x !== parada.x);
  ok("Tu turno: la respuesta del modelo es la del mapa", /next to the bank/i.test(tt.modelo));
}

{
  // Las explicaciones previstas comparan como la evaluación: con las contracciones abiertas (30 de octubre de 2026).
  const { explicacionPara } = await import("../src/lib/ruta/explicaciones.ts");
  const { contieneAlguna } = await import("../src/lib/evaluacion.ts");
  const una = (siDice, dicho, buena) => !!explicacionPara([{ siDice }], dicho, buena);
  ok("explicación: «He is boring» encuentra «He's boring»", una("He's boring", "He is boring."));
  ok("explicación: «I'm agree» encuentra «I am agree»", una("I am agree", "I'm agree because it's fun."));
  ok("explicación: «He'll play» encuentra «he will play»", una("he will play", "He'll play soccer."));
  ok("explicación: «drink» no está en «drinks»", !una("drink", "My mom drinks coffee."));
  ok("explicación: «…» vale por lo que sea", una("although… but", "Although it rained, but we went."));
  ok("explicación: dijo la forma buena, no es el error", !una("Is a lamp", "There is a lamp next to the bed.", "There is a lamp next to the bed."));
  ok("explicación: con «football» explica soccer", una("football", "I play football", "soccer"));
  ok("evaluación: «He's ridden a horse» es «has ridden»", contieneAlguna("He's ridden a horse.", ["has ridden a horse"]));
  ok("evaluación: «He's tired» sigue siendo «is tired»", contieneAlguna("He's tired.", ["is tired"]));

  // Dilo: la línea se llena como compara la evaluación (contracciones y números).
  const { palabrasEnOrden, primeraDeLaParte } = await import("../src/lib/ruta/dilo.ts");
  const edad = ["I'm", "15", "years", "old."];
  ok("Dilo: «I am fifteen years old» llena la línea", palabrasEnOrden(edad, "I am fifteen years old") === 4);
  ok("Dilo: «I'm 15 year» se queda en years", palabrasEnOrden(edad, "I'm 15 year old") === 2);
  ok("Dilo: palabras de más no cortan la línea", palabrasEnOrden(["This", "is", "my", "brother."], "Um this is uh my brother") === 4);
  ok("Dilo: «T-shirts» dicho como «T shirts»", palabrasEnOrden(["How", "many", "T-shirts"], "how many t shirts") === 3);
  ok("Dilo B1: empieza por la parte que falló", primeraDeLaParte(["I stayed home", "because it was raining."], "I stayed home so it rained") === "because");
  ok(
    "Dilo B1: con otra forma buena al comienzo, señala la parte que falló",
    primeraDeLaParte(["I've been studying English for three years,", "but I'm still learning."], "I have been studying English for three years, but I still learning") === "but"
  );

  // «used to» y «use to» suenan igual: lo transcrito de la voz va como la respuesta buena.
  const { comoSeOye } = await import("../src/lib/normalizar.ts");
  ok("voz: «use to» es «used to» si la respuesta lo trae", comoSeOye("She use to watch cartoons", ["She used to watch cartoons."]) === "She used to watch cartoons");
  ok("voz: «didn't used to» es «didn't use to»", comoSeOye("I didn't used to like reading", ["I didn't use to like reading."]) === "I didn't use to like reading");
  ok("voz: sin used to en la respuesta, no se toca", comoSeOye("What do you use to clean it?", ["I use a cloth."]) === "What do you use to clean it?");
  ok("voz: «didn't use to» no se vuelve «didn't used to»", comoSeOye("I didn't use to like it", ["I used to hate it, I didn't use to like it."]) === "I didn't use to like it");
}

console.log(`${total - fallos}/${total} comprobaciones de la ruta bien.`);
process.exit(fallos ? 1 : 0);
