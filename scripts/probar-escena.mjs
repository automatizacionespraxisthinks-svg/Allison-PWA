/**
 * El escenario de cierre, un viaje, un escenario del catálogo, la
 * Entrevista a Allison, Adivina y el comentario de Cuéntame y Narra contra el
 * modelo real (src/lib/ruta/escena.ts, src/lib/evaluacion.ts). Turnos ESCRITOS para que sea barato y
 * repetible; el audio usa el mismo prompt. Llama a Gemini: gasta
 * créditos y por eso no está en "npm run revisar".
 *
 *   node --env-file=.env scripts/probar-escena.mjs [repeticiones]
 *   VER=1 ...   muestra cada respuesta
 */
const { turnoDeEscenario, clasificarEntrevista, respuestaDeEntrevista, preguntaDeLaTarea, llevaPregunta, clasificarAdivina, EN_INGLES } = await import(
  "../src/lib/ruta/escena.ts"
);
const { comentarRelato, comentarNarracion, estaEnLoDicho } = await import("../src/lib/evaluacion.ts");
const { PARADA_01: A2_P01 } = await import("../src/lib/ruta/a2/parada-01.ts");
const { PARADA_01: B1_P01 } = await import("../src/lib/ruta/b1/parada-01.ts");
const ZOE = B1_P01.lecciones.flatMap((l) => l.actividades).find((a) => a.tipo === "narra");
const { esEspanolClaro, separarIdiomas } = await import("../src/lib/allison.ts");
const { PARADA_01 } = await import("../src/lib/ruta/a1/parada-01.ts");
const { PARADA_04 } = await import("../src/lib/ruta/a1/parada-04.ts");
const { PARADA_07 } = await import("../src/lib/ruta/a1/parada-07.ts");
const { PARADA_08: A1_P08 } = await import("../src/lib/ruta/a1/parada-08.ts");
const { PARADA_08: A2_P08 } = await import("../src/lib/ruta/a2/parada-08.ts");
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
      ["Hi! I'd like tacos with chicken and cheese, please.", [[3]]],
      ["What is the Day of the Dead?", [[4]], { maxPalabras: 30 }],
      ["In Colombia we eat arepas with corn.", [[5]], { maxPalabras: 30 }],
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
    // Las tareas de dos partes hechas a medias, como las guarda la escena.
    let aMedias = [];
    let turno = 0;
    for (const [dice, esperadas, op = {}] of turnos) {
      turno++;
      const r = await turnoDeEscenario({
        escenario,
        nivel: "A1",
        nombre: "Diego",
        historial,
        cumplidas,
        aMedias,
        ultimo: false,
        turno,
        minimo: escenario.minimoIntervenciones,
        extra,
        texto: dice,
      });
      aMedias = r.aMedias;
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

  // Lo que encontró la auditoría de los escenarios (28 de octubre de 2026).
  console.log(`Escenarios · auditoría (vuelta ${rep + 1})`);
  const turnoA1 = (o) => turnoDeEscenario({ nivel: "A1", nombre: "Diego", ultimo: false, minimo: o.escenario.minimoIntervenciones, ...o });
  const conversacion = (...l) => l.map((texto, i) => ({ rol: i % 2 === 0 ? "allison" : "alumno", texto }));
  // Contesta y pregunta en el mismo turno: Allison contesta primero, en su
  // papel ("Oh, you're from Colombia! Why are you here?" no contestaba).
  const ambas = await turnoA1({
    escenario: AEROPUERTO,
    historial: conversacion(AEROPUERTO.dialogo[0].dice, "Good morning! My name is Diego.", "Nice to meet you! Where are you from?"),
    cumplidas: [1],
    turno: 2,
    texto: "I'm from Colombia. And you, where are you from?",
  });
  revisar("Responde y pregunta · Allison contesta", /\bI'?m from|\bI am from|\bfrom (here|Miami|Florida|the (US|USA|United States))\b/i.test(ambas.respuesta), ambas.respuesta);
  revisar("Responde y pregunta · tareas", JSON.stringify(ambas.tareas) === "[2]", JSON.stringify(ambas.tareas));
  revisarRespuesta("Responde y pregunta", ambas);
  // Tarea doble ("Cuenta qué te duele y desde cuándo"): con una parte no
  // cuenta y Allison no cambia su pregunta por "Do you have any questions?";
  // con la otra, en el turno siguiente, sí.
  const enBrighton = conversacion(A2_P08.escenario.dialogo[0].dice, "Good morning. I don't feel well.", "Oh, I'm sorry. What's wrong?");
  const mitad = await turnoA1({ escenario: A2_P08.escenario, nivel: "A2", historial: enBrighton, cumplidas: [1], turno: 2, texto: "I have a sore throat and a headache." });
  revisar("Tarea doble · una parte no cuenta", !mitad.tareas.includes(2), `${JSON.stringify(mitad.tareas)} ${JSON.stringify(mitad.aMedias)}`);
  revisar("Tarea doble · sigue con su pregunta", llevaPregunta(mitad.respuesta) && !/any questions/i.test(mitad.respuesta), mitad.respuesta);
  const otraParte = await turnoA1({
    escenario: A2_P08.escenario,
    nivel: "A2",
    historial: [...enBrighton, { rol: "alumno", texto: "I have a sore throat and a headache." }, { rol: "allison", texto: mitad.respuesta }],
    cumplidas: [1, ...mitad.tareas],
    aMedias: mitad.aMedias,
    turno: 3,
    texto: "Since yesterday.",
  });
  revisar("Tarea doble · la otra parte la completa", otraParte.tareas.includes(2), JSON.stringify(otraParte.tareas));
  // Antes del mínimo, Allison no se despide: la tarea cuenta y la escena sigue con una pregunta.
  const temprano = await turnoA1({
    escenario: PARADA_01.escenario,
    historial: conversacion("Good morning!", "Good morning.", "How are you?", "I'm fine, thanks. And you?", "I'm fine, thank you! What's your name?", "My name is Diego.", "Nice to meet you, Diego! How old are you?", "I'm 15.", "Where are you from, Diego?", "I am from Colombia.", "Oh, you're from Colombia! Nice.", "And you? Where are you from?", "I'm from Miami. Welcome!"),
    cumplidas: [1, 2, 3, 4, 5, 6],
    turno: 7,
    texto: "Thank you. Goodbye!",
  });
  revisar("Despedida antes del mínimo · cuenta la tarea", temprano.tareas.includes(7), JSON.stringify(temprano.tareas));
  revisar(
    "Despedida antes del mínimo · no se despide y pregunta",
    !/\b(bye|goodbye|have a (nice|good) day|see you)\b/i.test(temprano.respuesta) && llevaPregunta(temprano.respuesta),
    temprano.respuesta
  );
  // La despedida del último turno sale del cierre aprobado: sin "Ms. Patel:"
  // ni comillas (B1) y sin el "Vamos a repasar…" en español (A1 P8).
  for (const [nombre, e, nivel] of [["B1 Toronto", B1_P01.escenario, "B1"], ["A1 Boston", A1_P08.escenario, "A1"]]) {
    const fin = await turnoDeEscenario({
      escenario: e,
      nivel,
      nombre: "Diego",
      historial: [{ rol: "allison", texto: e.dialogo[0].dice }],
      cumplidas: [1],
      ultimo: true,
      turno: e.maximoIntervenciones,
      minimo: e.minimoIntervenciones,
      texto: "no sé qué decir, gracias",
    });
    revisar(
      `Despedida final ${nombre} · sin etiqueta ni mezcla`,
      !/[:"“”]|vamos|repasar|pantalla/i.test(fin.respuesta) && !separarIdiomas(fin.respuesta).espanol.trim() && !/\?\s*$/.test(fin.respuesta),
      fin.respuesta
    );
  }

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
  // Contesta el "And you?" y pregunta en el mismo turno: antes la respuesta
  // se comía la pregunta y Allison pedía otra (28 de octubre de 2026).
  const AMBAS = [
    ["My name is Andres. Where are you from?", "What's your name?", 2],
    ["I am from Colombia. Who old are you?", "Where are you from?", 3],
    ["I'm 15. Do you have a pet?", "How old are you?", 4],
  ];
  for (const [dice, devuelta, dato] of AMBAS) {
    const c = await clasificarEntrevista({ entrevista, transcripcion: dice, devuelta });
    revisar(`"${dice}" · responde y pregunta ${dato}`, c.tipo === "pregunta" && c.dato === dato && c.responde, JSON.stringify(c));
  }
  const a = respuestaDeEntrevista({ entrevista, clasificacion: { tipo: "pregunta", dato: 2, espanol: false }, descubiertos: [], turno: 0 });
  revisar("Allison contesta y devuelve", a.respuesta.endsWith("And you?") && a.descubierto === 2, a.respuesta);
  // "When is Luna's birthday?" salía como "How old is Luna?" y Allison
  // contestaba "She is three." (tanda 1, 29 de octubre de 2026).
  const fechas = PARADA_04.lecciones[3].actividades.find((x) => x.tipo === "entrevista");
  const luna = await clasificarEntrevista({ entrevista: fechas, transcripcion: "When is Luna's birthday?" });
  revisar('"When is Luna\'s birthday?" · no es la edad de Luna', luna.dato !== 4 && luna.tipo === "otro" && luna.fuera, JSON.stringify(luna));
  const edad = await clasificarEntrevista({ entrevista: fechas, transcripcion: "How old is Luna?" });
  revisar('"How old is Luna?" · la edad de Luna', edad.tipo === "pregunta" && edad.dato === 4, JSON.stringify(edad));

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
  // Auditoría del 28 de octubre de 2026: una tirada con "and" contaba 2
  // frases, y una frase bien dicha salía corregida ("at six o'clock").
  const tirada = "I go to school at six and I study math and English and after school I do my homework and I play soccer with my friends";
  const c4 = await comentarRelato({ tema, transcripcion: tirada, nivel: "A2" });
  revisar("Relato en una tirada · 4 frases", c4.frases >= 4, JSON.stringify({ frases: c4.frases }));
  const bienDicho = "I go to school at six. I study math and science. After school I play soccer.";
  const c5 = await comentarRelato({ tema, transcripcion: bienDicho, nivel: "A2" });
  revisar("Relato bien dicho · sin corrección", !c5.mejora, JSON.stringify(c5.mejora));

  // Narra la secuencia (B1): el orden lo pone el código y lo contado en
  // español no cuenta.
  console.log(`Narra (vuelta ${rep + 1})`);
  const narra = { pregunta: ZOE.pregunta, dibujos: ZOE.dibujos, gramatica: ZOE.gramatica, nivel: "B1", modelo: ZOE.modelo };
  const n1 = await comentarNarracion({
    ...narra,
    transcripcion: "Her bag hasn't arrived. She waited for one hour. She flew to Vancouver. She checked her bag in Toronto.",
  });
  revisar("Narra al revés · no va en orden", n1.enOrden < 3, JSON.stringify({ dibujos: n1.dibujos, enOrden: n1.enOrden }));
  const n2 = await comentarNarracion({
    ...narra,
    transcripcion: "Zoe checked her bag in Toronto. Luego voló a Vancouver. Esperó una hora por la maleta. Her bag hasn't arrived.",
  });
  revisar("Narra mitad en español · solo los dibujos en inglés", n2.enOrden < 3 && !n2.dibujos.includes(2) && !n2.dibujos.includes(3), JSON.stringify({ dibujos: n2.dibujos }));
  const n3 = await comentarNarracion({
    ...narra,
    transcripcion: "First Zoe checked her bag in Toronto. Then she flew to Vancouver. After that she waited for one hour. Now her bag hasn't arrived.",
  });
  revisar("Narra bien contada · 4 en orden, sin corrección", n3.enOrden === 4 && !n3.mejora, JSON.stringify({ dibujos: n3.dibujos, mejora: n3.mejora }));
}

console.log(
  `\n${total - fallos}/${total} comprobaciones bien. Errores anotados para el resumen: ${avisos.anotados}/${avisos.esperados}.`
);
process.exit(fallos ? 1 : 0);
