import type { Parada } from "../tipos.ts";

/** Parada 10 · San Francisco. Documento "Contenido A1", aprobada el 15 de octubre de 2026. */
export const PARADA_10: Parada = {
  numero: 10,
  ciudad: "San Francisco",
  titulo: "Muévete por la ciudad",
  gramatica: "Imperativos y direcciones",
  objetivo:
    "Al terminar, el alumno pregunta cómo llegar a un lugar y entiende y da indicaciones. Gramática: imperativos (afirmativos y con don't) y direcciones. Usa todo lo de las paradas 1 a 9.",
  fraseMeta: "Excuse me, where is the bridge? Go straight and turn left.",
  portada: "san-francisco",
  vocabulario: [
    {
      grupo: "Direcciones",
      ingles: "turn left, turn right, go straight, go up / down the street, cross the street, stop, wait",
      nota: "",
    },
    {
      grupo: "Distancias",
      ingles: "one block, two blocks, on the corner, across from, between, Is it far? It's near.",
      nota: 'Inglés de Estados Unidos: las distancias en la ciudad se dan en "blocks" (cuadras) y se usa "across from" (no "opposite")',
    },
    {
      grupo: "Imperativos",
      ingles: "Go straight. Turn left. Take the bus. Don't cross! Don't take a taxi.",
      nota: 'Es la gramática central de la parada. Desde aquí Allison ya puede usar órdenes como "Let\'s go" o "Ask me"',
    },
    {
      grupo: "Preguntar el camino",
      ingles: "Excuse me, where is…? How do I get to…? Is it far?",
      nota: '"How do I get to…?" se enseña como frase fija',
    },
    { grupo: "Transporte", ingles: "subway, taxi, cable car, ferry", nota: '"Subway" ya se conoce de la parada 5' },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Izquierda, derecha y derecho",
      objetivo: "Entender y decir las direcciones básicas.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Oye: "Turn left." (no está escrito). Elige entre tres flechas dibujadas por la app: izquierda, derecha y derecho. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Turn left."],
          traduccion: ["Gira a la izquierda."],
          opciones: [
            { dibujo: { flecha: "izquierda" }, descripcion: "Flecha a la izquierda", etiqueta: "Turn left", etiquetaEs: "Gira a la izquierda" },
            { dibujo: { flecha: "derecha" }, descripcion: "Flecha a la derecha", etiqueta: "Turn right", etiquetaEs: "Gira a la derecha" },
            { dibujo: { flecha: "derecho" }, descripcion: "Flecha derecho", etiqueta: "Go straight", etiquetaEs: "Sigue derecho" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: la indicación, que Allison dice al elegir la flecha (cambio del 30 de octubre de 2026)", "traduccion", "quienHabla: el documento no dice quién habla"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'La portada de San Francisco con el Golden Gate. Allison pregunta: "What is this? It\'s a…"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "It\'s over the water." → "It\'s red and very long." → "It starts with b." Sin pistas, Allison dice "bridge" y el alumno la repite.',
          imagen: "san-francisco",
          pregunta: "What is this? It's a…",
          contexto: "Mira la foto de San Francisco. ¿Qué es esto? Completa la frase.",
          respuesta: "bridge",
          aceptadas: ["Golden Gate"],
          pistas: ["It's over the water.", "It's red and very long.", "It starts with b."],
          flecha: { x: 78, y: 53 },
          porRevisar: ["aceptadas: también «the Golden Gate» (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "Go straight and turn right."',
          siRespondeMal: 'Si dice "estraight": Escucha: straight. Empieza con s, sin e antes. Luego la frase completa.',
          frase: "Go straight and turn right.",
          palabraDificil: "straight",
          consejo: "Empieza con s, sin e antes.",
        },
      ],
    },
    {
      numero: 2,
      titulo: "¡Cruza! ¡No cruces!",
      objetivo: "Dar y entender órdenes, también con don't.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Oye: "Don\'t cross! Wait." Elige entre tres semáforos peatonales dibujados por la app: mano roja, figura caminando y apagado.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Don't cross! Wait."],
          traduccion: ["¡No cruces! Espera."],
          opciones: [
            { dibujo: { semaforo: "mano" }, descripcion: "Semáforo peatonal con la mano roja", etiqueta: "Don't cross", etiquetaEs: "No cruces" },
            { dibujo: { semaforo: "caminando" }, descripcion: "Semáforo peatonal con la figura caminando", etiqueta: "Cross", etiquetaEs: "Cruza" },
            { dibujo: { flecha: "izquierda" }, descripcion: "Flecha a la izquierda", etiqueta: "Turn left", etiquetaEs: "Gira a la izquierda" },
          ],
          correcta: 0,
          porRevisar: ["opciones: el semáforo apagado no tenía nada que decir y podía parecer «espera»; ahora es la flecha a la izquierda de la lección 1. Cada opción suena al elegirla (cambio del 30 de octubre de 2026)", "traduccion", "quienHabla: el documento no dice quién habla"],
        },
        {
          paso: 2,
          tipo: "tu-turno",
          queAparece:
            'Una turista, perdida: "Excuse me, where is the bus stop?" En pantalla un mapa sencillo de la app y: "Go straight. It\'s next to the ___."',
          siRespondeMal: "No se califica. Puede oír el modelo y grabar otra vez.",
          dialogo: [{ quien: "Una turista", dice: "Excuse me, where is the bus stop?" }],
          plantilla: "Go straight. It's next to the ___.",
          modelo: "Go straight. It's next to the bank.",
          aceptadas: ["It's next to the bank. Go straight two blocks."],
          // El mapa muestra lo del modelo (derecho dos cuadras, la parada junto
          // al banco) y un café enfrente, que no es la respuesta.
          mapa: {
            meta: "bus stop",
            indicaciones: [
              "Go straight two blocks.",
              "The bus stop is on the right.",
              "There's a bank next to the bus stop.",
              "There's a café across from the bank.",
            ],
          },
          porRevisar: [
            "mapa: el documento no dice qué más hay en el mapa; el café enfrente del banco es una propuesta",
          ],
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece: 'Frase en español: "Cruza la calle y gira a la izquierda."',
          siRespondeMal:
            'Si dice "You cross" o "Crossing": Para dar una indicación, el verbo va solo al comienzo: Cross. Al segundo fallo Allison dice la frase y el alumno la repite.',
          espanol: "Cruza la calle y gira a la izquierda.",
          respuesta: "Cross the street and turn left.",
          aceptadas: ["Cross the street, and turn left.", "Cross the street and turn to the left.", "Cross the street and then turn left.", "Cross the street, then turn left."],
          palabras: ["Cross", "the", "street", "and", "turn", "left."],
          explicaciones: [
            { siDice: "You cross", explicacion: "Para dar una indicación, el verbo va solo al comienzo: Cross." },
            { siDice: "Crossing", explicacion: "Para dar una indicación, el verbo va solo al comienzo: Cross." },
            { siDice: "to left", explicacion: "Se dice turn left." },
          ],
          porRevisar: ["aceptadas: también «turn to the left» y «then turn left»; explicación para «turn to left» (cambio del 30 de octubre de 2026)"],
        },
      ],
    },
    {
      numero: 3,
      titulo: "En el mapa",
      objetivo: "Seguir y dar indicaciones con cuadras y lugares.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Un mapa sencillo de la app con un punto "You are here" y tres edificios. Oye: "Go straight two blocks and turn left. The museum is on the right." Toca el edificio.',
          siRespondeMal: "Se repite la indicación despacio y el camino se dibuja paso a paso.",
          quienHabla: "Allison",
          audio: ["Go straight two blocks and turn left. The museum is on the right."],
          traduccion: ["Sigue derecho dos cuadras y gira a la izquierda. El museo está a la derecha."],
          pregunta: "¿Dónde está el museo? Toca el edificio.",
          opciones: [
            {
              dibujo: { edificio: { cuadras: 2, gira: "izquierda", lado: "derecha" } },
              descripcion: "El edificio a la derecha después de seguir derecho dos cuadras y girar a la izquierda (el museo)",
              etiqueta: "Two blocks and turn left",
              etiquetaEs: "Dos cuadras y gira a la izquierda",
            },
            {
              dibujo: { edificio: { cuadras: 1, gira: "izquierda", lado: "derecha" } },
              descripcion: "El edificio a la derecha después de seguir derecho una cuadra y girar a la izquierda",
              etiqueta: "One block and turn left",
              etiquetaEs: "Una cuadra y gira a la izquierda",
            },
            {
              dibujo: { edificio: { cuadras: 2, gira: "derecha", lado: "derecha" } },
              descripcion: "El edificio a la derecha después de seguir derecho dos cuadras y girar a la derecha",
              etiqueta: "Two blocks and turn right",
              etiquetaEs: "Dos cuadras y gira a la derecha",
            },
          ],
          correcta: 0,
          porRevisar: [
            "opciones: los tres edificios quedan a la derecha y se distinguen por lo que se oye (dos cuadras o una, izquierda o derecha); antes uno quedaba a la izquierda y había que girar el mapa en la cabeza. Con pregunta, y cada edificio dice su camino al tocarlo (cambio del 30 de octubre de 2026)",
            "traduccion",
            "quienHabla: el documento no dice quién habla",
            "opciones: el documento no dice dónde están los tres edificios del mapa; las posiciones de los dos incorrectos son una propuesta",
          ],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Una calle de San Francisco con un hotel, un banco y un café en fila, y un parque al otro lado de la calle. Allison: "Tell me 3 things." Debajo: "The ___ is next to / across from the ___."',
          siRespondeMal:
            'Si dice "in front of" donde va "across from", se acepta. Si nombra menos de 3, Allison pregunta "Where is the park?".',
          imagen: "f-calle-sf",
          pregunta: "Tell me 3 things.",
          plantillas: ["The ___ is next to / across from the ___."],
          palabrasAyuda: [],
          modelo: ["The bank is next to the hotel.", "The café is next to the bank.", "The park is across from the bank."],
          aceptadas: ["The bank is between the hotel and the café."],
          cosas: ["hotel", "bank", "café", "park"],
          minimo: 3,
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Where is your school? Is it far from your house? How do you go to school? What's your favorite place in your city? Is there a bank near your school?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          preguntas: [
            { pregunta: "Where is your school?", modelo: "It's near my house." },
            { pregunta: "Is it far from your house?", modelo: "No, it isn't." },
            { pregunta: "How do you go to school?", modelo: "I walk." },
            { pregunta: "What's your favorite place in your city?", modelo: "The park." },
            { pregunta: "Is there a bank near your school?", modelo: "Yes, there is." },
          ],
          aceptadas: [],
          tambienSeAcepta: "Respuestas cortas",
          segundos: 10,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Nueva York con Allison",
      objetivo: "Pedir indicaciones a otra persona.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison: "In New York, take the subway. Don\'t take a taxi. It\'s expensive!" Pregunta: ¿qué recomienda Allison? Elige entre el metro, el taxi y la bicicleta.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["In New York, take the subway. Don't take a taxi. It's expensive!"],
          traduccion: ["En Nueva York, toma el metro. No tomes taxi. ¡Es caro!"],
          pregunta: "¿Qué recomienda Allison?",
          opciones: [
            { imagen: "f-metro", descripcion: "El metro", etiqueta: "The subway", etiquetaEs: "El metro" },
            { imagen: "f-taxi", descripcion: "El taxi", etiqueta: "A taxi", etiquetaEs: "Un taxi" },
            { imagen: "f-bicicleta", descripcion: "La bicicleta", etiqueta: "A bike", etiquetaEs: "Una bicicleta" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Un tranvía de cable subiendo una calle empinada. Allison pregunta: "In San Francisco, you can ride a…"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "It goes up the hills." → "It\'s red and old." → "It\'s a car on a cable." Sin pistas, Allison dice "cable car" y el alumno la repite.',
          imagen: "f-tranvia",
          pregunta: "In San Francisco, you can ride a…",
          contexto: "¿En qué puedes montar en San Francisco? Completa la frase.",
          respuesta: "cable car",
          aceptadas: ["a cable car"],
          pistas: ["It goes up the hills.", "It's red and old.", "It's a car on a cable."],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            "Allison te invita a Nueva York para el final del viaje. Ficha con cinco lugares por descubrir: cómo llegar a su apartamento, dónde está el parque, cómo llegar a la Estatua de la Libertad, si el museo está lejos y cuál es su lugar favorito. Arma cada pregunta con palabras de ayuda. Mínimo 10 intervenciones.",
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿Cómo llegar a mi apartamento? Say: How do I get to your apartment? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "los lugares de Allison en Nueva York",
          // Las respuestas sí están en el documento ("Respuestas de Allison").
          datos: [
            {
              dato: "Cómo llegar a su apartamento",
              pregunta: "How do I get to your apartment?",
              respuesta: "Take the subway to Brooklyn. My building is on the corner, next to a café.",
            },
            {
              dato: "Dónde está el parque",
              pregunta: "Where is the park?",
              respuesta: "Go straight two blocks and turn left. It's across from my building.",
            },
            {
              dato: "Cómo llegar a la Estatua de la Libertad",
              pregunta: "How do I get to the Statue of Liberty?",
              respuesta: "Take the ferry. It's beautiful!",
            },
            { dato: "Si el museo está lejos", pregunta: "Is the museum far?", respuesta: "No, it isn't far. Take the subway." },
            {
              dato: "Cuál es su lugar favorito",
              pregunta: "What's your favorite place in New York?",
              respuesta: "The park on a sunny Sunday!",
            },
          ],
          aceptadas: [],
          tambienSeAcepta: "Cualquier pregunta que se entienda",
          ayuda: "¿Qué quieres saber? ¿Cómo llegar a mi apartamento? Say: How do I get to your apartment?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Rumbo al Golden Gate",
    imagen: "e-san-francisco-calle",
    contexto:
      "Estás en una calle de San Francisco y quieres ir al puente Golden Gate. Le preguntas a Carmen, una señora que pasa por ahí (Allison en su papel). La app muestra un mapa sencillo que se va dibujando con lo que ella dice.",
    personaje: "Carmen, la señora que da indicaciones en San Francisco",
    objetivo: "Preguntar cómo llegar, entender las indicaciones y confirmarlas",
    tareas: [
      "Llama su atención con Excuse me.",
      "Pregunta cómo llegar al Golden Gate.",
      "Repite las indicaciones para confirmar.",
      "Pregunta si está lejos.",
      "Pregunta por otro lugar que necesitas.",
      "Da las gracias y despídete.",
    ],
    dialogo: [
      { quien: "personaje", dice: "(pasa caminando)" },
      { quien: "alumno", dice: "Excuse me! Hi!", tarea: 1 },
      { quien: "personaje", dice: "Hi! Can I help you?" },
      { quien: "alumno", dice: "Yes, please. How do I get to the Golden Gate Bridge?", tarea: 2 },
      { quien: "personaje", dice: "Take the bus. The bus stop is near here. Go straight one block and turn right." },
      { quien: "alumno", dice: "Go straight one block and turn right?", tarea: 3 },
      { quien: "personaje", dice: "Yes! The bus stop is on the corner, across from a café." },
      { quien: "alumno", dice: "Across from a café. OK. Is the bridge far?", tarea: 4 },
      { quien: "personaje", dice: "It's twenty minutes by bus. Don't walk, it's very far!" },
      { quien: "alumno", dice: "OK, I can't walk there. Thank you." },
      { quien: "personaje", dice: "Do you need anything else?" },
      { quien: "alumno", dice: "Yes. Is there a drugstore near here?", tarea: 5 },
      { quien: "personaje", dice: "There's a drugstore next to the bus stop." },
      { quien: "alumno", dice: "Next to the bus stop. Great!" },
      { quien: "personaje", dice: "Are you a tourist?" },
      { quien: "alumno", dice: "Yes, I'm from Colombia." },
      { quien: "personaje", dice: "Welcome to San Francisco! Have a great day." },
      { quien: "alumno", dice: "Thank you so much!", tarea: 6 },
      { quien: "personaje", dice: "You're welcome!" },
      { quien: "alumno", dice: "Bye!", tarea: 6 },
    ],
    resumen: "¡Lo lograste! Llegaste al Golden Gate preguntando en inglés.",
    recompensa:
      "Tres estrellas si no usó la ayuda, y la estampilla de San Francisco en el pasaporte. Se abre el Repaso final en Nueva York.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y le da pie",
        ejemplo: '"OK" → Where do you want to go?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina el botón de ayuda con la frase sugerida",
        ejemplo: 'Ayuda: "How do I get to ___?"',
      },
      {
        situacion: "Responde en español",
        accion: "Sale un momento del personaje, da la frase y vuelve a la escena",
        ejemplo: '"¿Está lejos?" → En inglés: Is it far? Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you repeat that?",
      },
      {
        situacion: "No entiende las indicaciones",
        accion: "Las repite más despacio, una a la vez, y el mapa las dibuja",
        ejemplo: "Go straight… one block… and turn right.",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"Where is the bridge is?" → la escena sigue; en el resumen: Basta con un is: Where is the bridge?',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Allison cierra la escena con amabilidad y propone repasar la lección que faltó",
        ejemplo: "Good luck! Vamos a repasar las direcciones y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    // "La app muestra un mapa sencillo que se va dibujando con lo que ella
    // dice": el camino a la parada del bus y, lejos, el puente.
    mapa: { meta: "bus stop", destino: "Golden Gate Bridge" },
  },
  ilustraciones: [
    { archivos: ["f-metro"], muestra: "Un vagón de metro en la estación", uso: "Lección 4 (paso 1)" },
    { archivos: ["f-taxi"], muestra: "Un taxi amarillo", uso: "Lección 4 (paso 1)" },
    { archivos: ["f-tranvia"], muestra: "Un tranvía de cable rojo subiendo una calle empinada", uso: "Lección 4 (paso 2)" },
    {
      archivos: ["f-calle-sf"],
      muestra: "Una calle con un hotel, un banco y un café en fila, y un parque al otro lado",
      uso: "Lección 3 (paso 2)",
    },
  ],
};
