/**
 * El escenario de cierre, un viaje, un escenario del catálogo, la
 * Entrevista a Allison, Adivina y el comentario de Cuéntame contra el
 * modelo real (src/lib/ruta/escena.ts, src/lib/evaluacion.ts). Turnos ESCRITOS para que sea barato y
 * repetible; el audio usa el mismo prompt. Llama a Gemini: gasta
 * créditos y por eso no está en "npm run revisar".
 *
 *   node --env-file=.env scripts/probar-escena.mjs [repeticiones]
 *   VER=1 ...   muestra cada respuesta
 */
const { turnoDeEscenario, clasificarEntrevista, respuestaDeEntrevista, preguntaDeLaTarea, clasificarAdivina, EN_INGLES } = await import(
  "../src/lib/ruta/escena.ts"
);
const { comentarRelato, estaEnLoDicho } = await import("../src/lib/evaluacion.ts");
const { PARADA_01: A2_P01 } = await import("../src/lib/ruta/a2/parada-01.ts");
const { esEspanolClaro, separarIdiomas } = await import("../src/lib/allison.ts");
const { PARADA_01 } = await import("../src/lib/ruta/a1/parada-01.ts");
const { PARADA_04 } = await import("../src/lib/ruta/a1/parada-04.ts");
const { PARADA_07 } = await import("../src/lib/ruta/a1/parada-07.ts");
const { VIAJES } = await import("../src/lib/ruta/viajes.ts");
const { escenarioDeViaje, reglasDeViaje } = await import("../src/lib/ruta/viaje.ts");
const { CATALOGO } = await import("../src/lib/escenarios/datos.ts");
const MEXICO = VIAJES.find((v) => v.numero === 1);
const LIBRERIA = CATALOGO.find((c) => c.clave === "cat:libreria").escenario;
const AEROPUERTO = CATALOGO.find((c) => c.clave === "cat:aeropuerto").escenario;

const reps = Number(process.argv[2] ?? 2);
const ver = process.env.VER === "1";
let fallos = 0;
const avisos = { esperados: 0, anotados: 0 };
let total = 0;

function revisar(nombre, ok, detalle) {
  total++;
  if (!ok) {
    fallos++;
    console.log(`  ✗ ${nombre}: ${detalle}`);
  } else if (ver) console.log(`  ✓ ${nombre}: ${detalle}`);
}

/** Lo que Allison dice en la escena: solo inglés, corto, sin corregir. */
function revisarRespuesta(nombre, r, { espanol = false, maxPalabras = 16 } = {}) {
  const en = espanol ? r.respuesta.replace(EN_INGLES, "").trim() : r.respuesta;
  const sep = separarIdiomas(en);
  revisar(`${nombre} · solo inglés`, !sep.espanol.trim() && !esEspanolClaro(en), r.respuesta);
  revisar(`${nombre} · corta`, en.split(/\s+/).length <= maxPalabras, `${en.split(/\s+/).length} palabras: ${en}`);
  revisar(`${nombre} · no corrige`, !/\b(correct|mistake|you should say|we say|say it like)\b/i.test(en), en);
  if (espanol) revisar(`${nombre} · frase en inglés`, r.respuesta.startsWith(EN_INGLES), r.respuesta);
}

// [escenario, turnos: [lo que dice, tareas esperadas (cualquiera de la lista), opciones], reglas extra]
const GUIONES = [
  [
    "Parada 1 · migración",
    PARADA_01.escenario,
    [
      ["Good morning!", [[1]]],
      ["I'm fine, thanks. And you?", [[2]]],
      ["My name is Diego.", [[3]]],
      ["I'm 15.", [[4]]],
      ["I from Colombia.", [[5]], { error: true, sinEco: true }],
      ["And you? Where are you from?", [[6]]],
      ["Thank you. Goodbye!", [[7]]],
    ],
  ],
  [
    "Parada 1 · en español",
    PARADA_01.escenario,
    [
      ["Hello!", [[1]]],
      ["Me llamo Diego", [[]], { espanol: true }],
      ["I am Diego.", [[3]]],
    ],
  ],
  [
    "Parada 1 · no cumple",
    PARADA_01.escenario,
    [
      ["Good morning.", [[1]]],
      ["I like pizza.", [[]]],
    ],
  ],
  [
    // Las capturas de producción (octubre de 2026): la tarea doble contaba
    // a medias, Allison decía "I'm from Colombia" y la idea no le respondía.
    "Escenarios · aeropuerto",
    AEROPUERTO,
    [
      ["Good morning! My name is Diego.", [[1]], { idea: true }],
      ["I from Colombia.", [[2]], { error: true, sinEco: true, idea: true }],
      ["Yes, it is.", [[]], { idea: true }],
      ["I'm here on vacation.", [[3]], { idea: true }],
    ],
  ],
  [
    "Parada 4 · taquilla",
    PARADA_04.escenario,
    [
      ["Good morning! A tour, please.", [[1]]],
      ["On Monday.", [[2]]],
      ["At ten o'clock.", [[3]]],
      ["Three people.", [[4]]],
    ],
  ],
  [
    "Parada 7 · restaurante",
    PARADA_07.escenario,
    [
      ["Good evening! A table for two, please.", [[1]]],
      ["I wants a burger and fries, please.", [[2]], { error: true }],
      ["A lemonade, please.", [[3]]],
      ["No, thank you.", [[4]]],
      ["How much is it?", [[5]]],
      ["Thank you! Bye!", [[6]]],
    ],
  ],
  [
    "Viaje 1 · México",
    escenarioDeViaje(MEXICO),
    [
      ["Hi! I'd like tacos with chicken and cheese, please.", [[1]]],
      ["What is the Day of the Dead?", [[2]], { maxPalabras: 30 }],
      ["In Colombia we eat arepas with corn.", [[3]], { maxPalabras: 30 }],
    ],
    reglasDeViaje(MEXICO, "A1"),
  ],
  [
    "Escenarios · librería (no adelanta el precio)",
    LIBRERIA,
    [
      ["Hi! I'd like a book in English, please.", [[1]], { sinPrecio: true }],
      ["I like books about animals.", [[2]], { sinPrecio: true }],
      ["How much is it?", [[3]]],
    ],
  ],
];

for (let rep = 0; rep < reps; rep++) {
  for (const [nombre, escenario, turnos, extra] of GUIONES) {
    console.log(`${nombre} (vuelta ${rep + 1})`);
    const historial = [{ rol: "allison", texto: escenario.dialogo[0].dice }];
    let cumplidas = [];
    let turno = 0;
    for (const [dice, esperadas, op = {}] of turnos) {
      turno++;
      const r = await turnoDeEscenario({
        escenario,
        nivel: "A1",
        nombre: "Diego",
        historial,
        cumplidas,
        ultimo: false,
        turno,
        minimo: escenario.minimoIntervenciones,
        extra,
        texto: dice,
      });
      // Antes del mínimo de intervenciones la escena no se cierra: Allison
      // termina con una pregunta para que siga.
      // (La despedida natural del ejemplo, sin pregunta, también vale.)
      revisar(
        `"${dice}" · sigue la escena`,
        r.respuesta.includes("?") || op.espanol || !preguntaDeLaTarea(escenario, Math.max(...cumplidas, 0) + 2),
        r.respuesta
      );
      const tareas = [...r.tareas].sort();
      const okTareas = esperadas.some((e) => JSON.stringify(e) === JSON.stringify(tareas));
      revisar(`"${dice}" · tareas`, okTareas, `${JSON.stringify(tareas)} (esperaba ${JSON.stringify(esperadas)})`);
      revisarRespuesta(`"${dice}"`, r, { espanol: op.espanol, maxPalabras: op.maxPalabras });
      // Allison no hace la tarea del alumno: si le toca preguntar el precio, ella no lo dice antes.
      if (op.sinPrecio) revisar(`"${dice}" · no adelanta el precio`, !/\$|\bdollars?\b|\bcents?\b/i.test(r.respuesta), r.respuesta);
      // Allison no dice como suya la frase del alumno ("I'm from Colombia.").
      if (op.sinEco) revisar(`"${dice}" · no la dice como suya`, !/\bI('m| am) from Colombia\b/i.test(r.respuesta), r.respuesta);
      // La idea le responde a la línea de Allison, en inglés y corta.
      if (op.idea) {
        const idea = r.idea?.en ?? "";
        revisar(`"${dice}" · trae idea`, !!idea && !separarIdiomas(idea).espanol.trim() && idea.split(/\s+/).length <= 14, `${idea} | ${r.respuesta}`);
      }
      // Anotar el error es lo mejor que se puede: el resumen lo muestra si
      // lo hay. Que falte no es un fallo, solo un aviso.
      if (op.error) {
        if (r.error) avisos.anotados++;
        avisos.esperados++;
      }
      else if (!op.espanol) revisar(`"${dice}" · sin error inventado`, !r.error, JSON.stringify(r.error));
      if (ver) console.log(`     Allison: ${r.respuesta}${r.idea ? `   (idea: ${r.idea.en} · tarea ${r.idea.tarea})` : ""}`);
      historial.push({ rol: "alumno", texto: dice }, { rol: "allison", texto: r.respuesta });
      cumplidas = [...new Set([...cumplidas, ...r.tareas])];
    }
  }

  // El último turno cierra la escena sin preguntar.
  const cierre = await turnoDeEscenario({
    escenario: PARADA_01.escenario,
    nivel: "A1",
    nombre: "Diego",
    historial: [{ rol: "allison", texto: "Good morning!" }],
    cumplidas: [1],
    ultimo: true,
    turno: 18,
    minimo: 10,
    texto: "Hello hello.",
  });
  revisarRespuesta("Último turno", cierre);
  revisar("Último turno · sin pregunta", !/\?\s*$/.test(cierre.respuesta), cierre.respuesta);

  // La entrevista: el modelo clasifica, el código responde.
  console.log(`Entrevista (vuelta ${rep + 1})`);
  const entrevista = PARADA_01.lecciones[3].actividades.find((a) => a.tipo === "entrevista");
  const PREGUNTAS = [
    ["Where are you from?", "pregunta", 2],
    ["Where you from", "pregunta", 2],
    ["How old you are?", "pregunta", 3],
    ["You have a pet?", "pregunta", 4],
    ["What you like?", "pregunta", 5],
    ["What is your name?", "pregunta", 1],
    ["¿De dónde eres?", "pregunta", 2, true],
    ["banana car", "otro", 0],
  ];
  for (const [dice, tipo, dato, es] of PREGUNTAS) {
    const c = await clasificarEntrevista({ entrevista, transcripcion: dice });
    revisar(`"${dice}" · ${tipo} ${dato}`, c.tipo === tipo && c.dato === dato && !!es === c.espanol, JSON.stringify(c));
  }
  const devuelta = await clasificarEntrevista({ entrevista, transcripcion: "I'm from Colombia.", devuelta: "Where are you from?" });
  revisar('"I\'m from Colombia." · respuesta', devuelta.tipo === "respuesta", JSON.stringify(devuelta));
  const a = respuestaDeEntrevista({ entrevista, clasificacion: { tipo: "pregunta", dato: 2, espanol: false }, descubiertos: [], turno: 0 });
  revisar("Allison contesta y devuelve", a.respuesta.endsWith("And you?") && a.descubierto === 2, a.respuesta);

  // Adivina (A2): el modelo solo reconoce qué preguntó; nunca sabe la respuesta.
  console.log(`Adivina (vuelta ${rep + 1})`);
  const adivina = A2_P01.lecciones[3].actividades.find((x) => x.tipo === "adivina");
  const JUGADAS = [
    ["Do you work in a hospital?", "pregunta", 1, 0],
    ["You work outside?", "pregunta", 3, 0],
    ["Uniform?", "pregunta", 4, 0],
    ["Do you travel a lot?", "pregunta", 8, 0],
    ["Are you a pilot?", "adivina", 0, 6],
    ["Police officer?", "adivina", 0, 3],
    ["What do you do?", "abierta", 0, 0],
    ["Do you like pizza?", "otra", 0, 0],
    ["¿Trabajas en un hospital?", "pregunta", 1, 0, true],
  ];
  for (const [dice, tipo, fila, opcion, es] of JUGADAS) {
    const c = await clasificarAdivina({ adivina, transcripcion: dice });
    revisar(
      `"${dice}" · ${tipo} ${fila || opcion}`,
      c.tipo === tipo && c.fila === fila && c.opcion === opcion && !!es === c.espanol,
      JSON.stringify({ tipo: c.tipo, fila: c.fila, opcion: c.opcion, espanol: c.espanol })
    );
  }

  // Cuéntame (A2): cuenta frases y cita solo lo que el alumno dijo.
  console.log(`Cuéntame (vuelta ${rep + 1})`);
  const tema = "Tell me about your school day.";
  const bueno = "I go to school at seven. I study math and science. My favorite subject is art. After school I play soccer with my friends.";
  const c1 = await comentarRelato({ tema, transcripcion: bueno, nivel: "A2" });
  revisar("Relato bueno · 4 frases", c1.frases >= 4 && !c1.espanol, JSON.stringify({ frases: c1.frases, espanol: c1.espanol }));
  revisar("Relato bueno · lo bien está en lo dicho", !!c1.bien && estaEnLoDicho(c1.bien.frase, bueno), JSON.stringify(c1.bien));
  const conErrores = "I study in the school. I go to school in bus. After school I playing soccer.";
  const c2 = await comentarRelato({ tema, transcripcion: conErrores, nivel: "A2" });
  revisar("Relato con errores · una mejora", !!c2.mejora && estaEnLoDicho(c2.mejora.dijo, conErrores), JSON.stringify(c2.mejora));
  const c3 = await comentarRelato({ tema, transcripcion: "Voy al colegio a las siete y estudio matemáticas.", nivel: "A2" });
  revisar("Relato en español · no cuenta", c3.espanol, JSON.stringify({ frases: c3.frases, espanol: c3.espanol }));
}

console.log(
  `\n${total - fallos}/${total} comprobaciones bien. Errores anotados para el resumen: ${avisos.anotados}/${avisos.esperados}.`
);
process.exit(fallos ? 1 : 0);
