import type { Parada } from "../tipos.ts";

/**
 * Parada 10 · Cardiff (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison (va a su ficha): el apartamento de Emily es más grande que
 *     el suyo.
 *   · Priya: ha visitado varias ciudades del Reino Unido; para ella
 *     Edimburgo es la más bonita.
 *   · Noah, Jack y Ethan: solo en los dibujos de la lección 1: compañeros del
 *     equipo de fútbol de Ben.
 *   · Mrs. Morgan: solo en este escenario: agente de apartamentos en Cardiff.
 *   · Los apartamentos: Downtown: 1 bedroom, £1,200 al mes, a 5 minutos del
 *     castillo, sin ascensor. Park: 2 bedrooms, £1,000 al mes, a 20 minutos
 *     en bus del centro, con un patio pequeño.
 *   · La familia del ejemplo: papás, el alumno y un hermano menor (solo es
 *     el ejemplo; cada alumno habla de su familia real).
 */
export const PARADA_10: Parada = {
  numero: 10,
  ciudad: "Cardiff",
  titulo: "Describe y compara",
  gramatica: "Comparativos y superlativos",
  objetivo:
    'Al terminar, el alumno describe y compara cosas y lugares, y elige el mejor: "This apartment is bigger, but that one is the cheapest." Gramática: comparativos (-er, more… than, better, worse) y superlativos (the -est, the most…, the best, the worst). Usa A1, las paradas 1 a 9 y el Repaso 1.',
  fraseMeta: "This apartment is bigger, but that one is the cheapest.",
  portada: "cardiff",
  vocabulario: [
    {
      grupo: "Comparar",
      ingles: "bigger, smaller, cheaper, newer, closer, taller; more expensive, more comfortable, more beautiful; better, worse",
      nota: "Palabras cortas: -er. Largas: more. Big → bigger, con dos g",
    },
    {
      grupo: "Con than",
      ingles: "The park apartment is bigger than the downtown one.",
      nota: 'Than dice con qué comparas. Nunca "more bigger"',
    },
    {
      grupo: "Superlativos",
      ingles: "the biggest, the cheapest, the closest, the most expensive, the most beautiful, the best, the worst",
      nota: "Siempre con the",
    },
    {
      grupo: "La casa",
      ingles: "apartment, bedroom, living room, bathroom, kitchen, yard, closet, elevator, stairs, downtown",
      nota: "De Estados Unidos: apartment (nunca flat), elevator (nunca lift), downtown (nunca city centre). En Estados Unidos el first floor es el piso de la calle",
    },
    {
      grupo: "Opinar",
      ingles: "Which one do you like? I think the blue one is better. I prefer this one.",
      nota: "One evita repetir: the big one, the cheap one",
    },
    {
      grupo: "Frases",
      ingles: "Which one is cheaper? This one is the best for us.",
      nota: "",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Más grande, más barato",
      objetivo: "Comparar dos cosas con -er, more y than.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison muestra fotos del equipo de fútbol de Ben: "Noah is taller than Jack and Ethan." (no está escrito). Elige a Noah entre tres dibujos con el mismo fondo y una regla de medir en la pared: un muchacho mediano, uno alto y uno bajo, sin nombres. Para elegir hay que entender "taller than".',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Noah is taller than Jack and Ethan."],
          traduccion: ["Noah es más alto que Jack y Ethan."],
          pregunta: "¿Quién es Noah?",
          // Sin nombres en el dibujo (decidido el 17 de octubre de 2026): con
          // los nombres debajo se elegía leyendo, sin entender "taller".
          opciones: [
            { imagen: "f-muchacho-mediano", descripcion: "Un muchacho de estatura media junto a la regla", etiqueta: "Average height", etiquetaEs: "Mediano" },
            { imagen: "f-muchacho-alto", descripcion: "Un muchacho alto junto a la regla", etiqueta: "Tall", etiquetaEs: "Alto" },
            { imagen: "f-muchacho-bajo", descripcion: "Un muchacho bajo junto a la regla", etiqueta: "Short", etiquetaEs: "Bajo" },
          ],
          correcta: 1,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Noah, el más alto"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de dos maletas: una grande de £60 y una pequeña de £25. Allison: "Look at the prices. Which one is cheaper?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Look at the prices." → "Start with: The small one is…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "more cheap": Cheap es corta: cheaper.',
          imagen: "f-dos-maletas",
          pregunta: "Look at the prices. Which one is cheaper?",
          contexto: "Mira los precios. ¿Cuál maleta es más barata? Responde con una frase en inglés.",
          respuesta: "The small one is cheaper.",
          aceptadas: ["The small suitcase is cheaper.", "It's cheaper than the big one."],
          pistas: ["Look at the prices.", "Start with: The small one is…"],
          porRevisar: [
            'aceptadas: sin "The small one." del documento: con esa forma también valdría "The small one is more cheap", el error que se corrige',
          ],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "This sofa is more comfortable." Se practica la palabra comfortable.',
          siRespondeMal:
            'Si dice "com-for-ta-ble" en cuatro sílabas: Escucha: comfortable. Suena "cómftabl": la or casi no suena. Say it: comfortable. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "This sofa is more comfortable.",
          palabraDificil: "comfortable",
          consejo: 'Suena "cómftabl": la or casi no suena.',
        },
      ],
    },
    {
      numero: 2,
      titulo: "El mejor",
      objetivo: "Usar the -est, the most y the best.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Priya has visited a lot of cities in the UK. She thinks Edinburgh is the most beautiful!" (no está escrito). Elige entre las portadas de Edimburgo, Oxford y Manchester.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Priya has visited a lot of cities in the UK.", "She thinks Edinburgh is the most beautiful!"],
          traduccion: ["Priya ha visitado muchas ciudades del Reino Unido.", "¡Para ella, Edimburgo es la más bonita!"],
          pregunta: "¿Cuál es la ciudad más bonita para Priya?",
          opciones: [
            { imagen: "edimburgo", descripcion: "La portada de Edimburgo", etiqueta: "Edinburgh", etiquetaEs: "Edimburgo" },
            { imagen: "oxford", descripcion: "La portada de Oxford", etiqueta: "Oxford", etiquetaEs: "Oxford" },
            { imagen: "manchester", descripcion: "La portada de Manchester", etiqueta: "Manchester", etiquetaEs: "Manchester" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca Edimburgo"'],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Este es el apartamento más barato, pero no es el mejor." Las palabras de apoyo aparecen después del primer fallo: this, is, the cheapest, apartment, but, it, isn\'t, the best.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "the more cheap": Cheap es corta: the cheapest. Si dice "the most good": Good cambia: the best. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Este es el apartamento más barato, pero no es el mejor.",
          respuesta: "This is the cheapest apartment, but it isn't the best.",
          aceptadas: [
            "This apartment is the cheapest, but it's not the best.",
            "This is the cheapest apartment, but it's not the best one.",
          ],
          palabras: ["This", "is", "the", "cheapest", "apartment,", "but", "it", "isn't", "the", "best."],
          explicaciones: [
            { siDice: "the more cheap", explicacion: "Cheap es corta: the cheapest." },
            { siDice: "the most good", explicacion: "Good cambia: the best." },
          ],
          porRevisar: [
            'palabras: el documento trae "the cheapest" y "the best" juntas y sin puntuación; aquí van palabra por palabra, como en Londres',
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about the best place in your town." Preguntas guía: What\'s the best place? Why is it better than other places? What\'s the most fun thing to do there?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "It\'s more big than the park" → Big es corta: bigger than the park. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about the best place in your town.",
          guias: ["What's the best place?", "Why is it better than other places?", "What's the most fun thing to do there?"],
          modelo:
            "The best place in my town is the main square. It's bigger and more beautiful than the other parks. On Sundays there's a market, and the arepas there are the most delicious in town!",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "¿Cuál prefieres?",
      objetivo: "Comparar y dar tu opinión.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "The train is faster than the bus, and it\'s more comfortable. But the bus is cheaper." (no está escrito). Pregunta: ¿cuál es el más barato? Elige entre un tren, un avión y un bus.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["The train is faster than the bus, and it's more comfortable.", "But the bus is cheaper."],
          traduccion: ["El tren es más rápido que el bus, y es más cómodo.", "Pero el bus es más barato."],
          pregunta: "¿Cuál es más barato?",
          opciones: [
            { imagen: "f-tren", descripcion: "Un tren", etiqueta: "Train", etiquetaEs: "Tren" },
            { imagen: "f-avion", descripcion: "Un avión", etiqueta: "Plane", etiquetaEs: "Avión" },
            { imagen: "a1/c-bus", descripcion: "Un bus", etiqueta: "Bus", etiquetaEs: "Bus" },
          ],
          correcta: 2,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Dos cuartos de hotel: el de la izquierda es grande, con vista al mar y cuesta £120; el de la derecha es pequeño, sin ventana y cuesta £60. Allison: "Compare the two rooms. Tell me 3 things." Debajo: "The ___ room is ___ than the ___ one." y bigger, cheaper, more beautiful, more expensive.',
          siRespondeMal:
            'Si dice "The left room is more big", Allison repite bien la frase (The left room is bigger.) y el alumno la dice. Si nombra menos de 3, Allison señala los precios y pregunta "Which one is cheaper?".',
          imagen: "f-dos-habitaciones",
          pregunta: "Compare the two rooms. Tell me 3 things.",
          plantillas: ["The ___ room is ___ than the ___ one."],
          palabrasAyuda: ["bigger", "cheaper", "more beautiful", "more expensive"],
          modelo: ["The left room is bigger than the right one.", "The right room is cheaper.", "The left room is more beautiful."],
          aceptadas: ["The big room is more expensive.", "The small one is cheaper.", "I prefer the big room."],
          cosas: ["bigger", "smaller", "cheaper", "more expensive", "more beautiful", "more comfortable", "better", "prefer"],
          minimo: 3,
          porRevisar: [
            'cosas: el documento no las nombra; salen de las palabras de ayuda, las frases modelo y lo que también se acepta ("I prefer the big room")',
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: Who is the tallest in your family? Which is better, soccer or basketball? What's the most delicious food in Colombia? Is your town bigger than Bogotá? What's the best day of the week?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "Who is the tallest in your family?", modelo: "My dad is the tallest." },
            { pregunta: "Which is better, soccer or basketball?", modelo: "Soccer is better!" },
            { pregunta: "What's the most delicious food in Colombia?", modelo: "Ajiaco is the most delicious." },
            { pregunta: "Is your town bigger than Bogotá?", modelo: "No, it's smaller than Bogotá." },
            { pregunta: "What's the best day of the week?", modelo: "Saturday is the best day." },
          ],
          aceptadas: ["My dad.", "Soccer.", "Ajiaco."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Allison compara",
      objetivo: "Preguntar con comparativos y superlativos.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "My apartment is small, but it\'s across from a park. My sister\'s apartment is bigger." (no está escrito). ¿Dónde está el apartamento de Allison? Elige entre una calle con un parque al lado, una playa y una granja.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["My apartment is small, but it's across from a park.", "My sister's apartment is bigger."],
          traduccion: ["Mi apartamento es pequeño, pero queda frente a un parque.", "El apartamento de mi hermana es más grande."],
          pregunta: "¿Dónde está el apartamento de Allison?",
          opciones: [
            { imagen: "a1/f-barrio", descripcion: "Una calle con un parque al lado", etiqueta: "Street with a park", etiquetaEs: "Calle con parque" },
            { imagen: "a1/f-playa-la", descripcion: "Una playa", etiqueta: "Beach", etiquetaEs: "Playa" },
            { imagen: "f-granjero-vacas", descripcion: "Una granja", etiqueta: "Farm", etiquetaEs: "Granja" },
          ],
          correcta: 0,
          porRevisar: ["traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de tres helados: uno pequeño de vainilla, uno mediano de fresa y uno grande de chocolate. Allison: "Which ice cream is the biggest?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Look at the sizes." → "Start with: The chocolate one…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "the most big": Big es corta: the biggest. Al acertar: "Good! Chocolate is my favorite!"',
          imagen: "f-tres-helados",
          pregunta: "Which ice cream is the biggest?",
          contexto: "¿Cuál helado es el más grande? Responde con una frase en inglés.",
          respuesta: "The chocolate one is the biggest.",
          aceptadas: ["The chocolate ice cream is the biggest."],
          pistas: ["Look at the sizes.", "Start with: The chocolate one…"],
          porRevisar: [
            'aceptadas: sin "The chocolate one." del documento: con esa forma también valdría "The chocolate one is the most big", el error que se corrige',
          ],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha de Allison con cinco comparaciones por descubrir: si su apartamento es más grande que el de Emily, quién es mayor, cuál es el mejor mes en Nueva York, cuál es la comida colombiana más rica y qué es mejor, el metro o el taxi. Arma cada pregunta; las palabras de ayuda aparecen después del primer fallo. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿Quién es mayor? Say: Who is older, you or Emily? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "cinco comparaciones sobre Allison",
          // Las respuestas sí están en el documento ("Respuestas de Allison";
          // salen de su ficha y solo la primera es un dato nuevo).
          datos: [
            {
              dato: "Si su apartamento es más grande que el de Emily",
              pregunta: "Is your apartment bigger than Emily's?",
              respuesta: "No! Emily's apartment is bigger. Mine is small, but it's across from a park.",
            },
            { dato: "Quién es mayor, ella o Emily", pregunta: "Who is older, you or Emily?", respuesta: "Emily is older. She's 31!" },
            {
              dato: "Cuál es el mejor mes en Nueva York",
              pregunta: "What's the best month in New York?",
              respuesta: "December! New York is beautiful in December.",
            },
            {
              dato: "Cuál es la comida colombiana más rica",
              pregunta: "What's the most delicious Colombian food?",
              respuesta: "Mute santandereano! It's my favorite.",
            },
            {
              dato: "Qué es mejor, el metro o el taxi",
              pregunta: "Which is better, the subway or a taxi?",
              respuesta: "The subway! It's cheaper than a taxi.",
            },
          ],
          aceptadas: ["Your apartment is bigger?", "Who is older?", "Best month?"],
          tambienSeAcepta: "Cualquier pregunta que se entienda",
          ayuda: "¿Qué quieres saber? ¿Quién es mayor? Say: Who is older, you or Emily?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Eliges apartamento en Cardiff",
    imagen: "e-cardiff-apartamentos",
    // La última frase sale de la fila Imagen del documento: la ficha de
    // cada apartamento que muestra la app (así Mrs. Morgan no se contradice).
    contexto:
      "Tu familia va a pasar un mes en Cardiff y te pide hablar con la agente porque eres quien mejor habla inglés. Son cuatro: tus papás, tu hermano menor y tú. Mrs. Morgan (Allison en su papel) te muestra dos apartamentos. La app muestra la ficha de cada apartamento: Downtown: 1 bedroom, £1,200 a month, 5 minutes from the castle, no elevator. Park: 2 bedrooms, £1,000 a month, 20 minutes by bus from downtown, small yard.",
    personaje: "Mrs. Morgan, la agente de apartamentos en Cardiff",
    objetivo: "Comparar los dos apartamentos y elegir el mejor para su familia, diciendo por qué",
    tareas: [
      "Saluda y di qué buscan.",
      "Pregunta cuál es más grande.",
      "Compara los precios.",
      "Pregunta si está lejos del centro.",
      "Elige uno y di por qué.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hello! Welcome to Cardiff. Are you looking for an apartment?" },
      { quien: "alumno", dice: "Hello! Yes. We're looking for an apartment for one month.", tarea: 1 },
      { quien: "personaje", dice: "How many people are in your family?" },
      { quien: "alumno", dice: "Four people: my parents, my little brother and me." },
      { quien: "personaje", dice: "OK. I have two apartments: one downtown and one near the park." },
      { quien: "alumno", dice: "Which one is bigger?", tarea: 2 },
      { quien: "personaje", dice: "The park apartment is bigger. It has two bedrooms. The downtown one has only one." },
      { quien: "alumno", dice: "We need two bedrooms. How much is the park apartment?" },
      { quien: "personaje", dice: "It's one thousand pounds a month. The downtown one is one thousand two hundred." },
      { quien: "alumno", dice: "So the park apartment is cheaper than the downtown one.", tarea: 3 },
      { quien: "personaje", dice: "Yes, it is. But the downtown one is closer to the castle and the stores." },
      { quien: "alumno", dice: "Is the park apartment far from downtown?", tarea: 4 },
      { quien: "personaje", dice: "It's twenty minutes by bus. And it has a small yard!" },
      { quien: "alumno", dice: "Great! My brother loves to play outside." },
      { quien: "personaje", dice: "And the park across the street is the most beautiful park in the neighborhood." },
      { quien: "alumno", dice: "I think the park apartment is the best for us. It's bigger and cheaper.", tarea: 5 },
      { quien: "personaje", dice: "Great choice! Would you like to see it today?" },
      { quien: "alumno", dice: "Yes, please! Let's go!" },
      { quien: "personaje", dice: "Perfect. My car is outside." },
      { quien: "alumno", dice: "Thank you, Mrs. Morgan!" },
    ],
    resumen: "¡Lo lograste! Comparaste en inglés dos apartamentos y elegiste el mejor para tu familia.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Cardiff en el pasaporte. Se abre el Repaso final en Londres.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like Cardiff" → It\'s a great city! So, what kind of apartment are you looking for?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "Which one is ___er?"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"¿Cuál es más barato?" → En inglés: Which one is cheaper? Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"The park apartment is more cheap" → la escena sigue; en el resumen: Cheap es corta: cheaper.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "I have another client now. Call me tomorrow! Vamos a repasar los comparativos y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    // Los cinco comienzos salen de la fila Ayuda del documento, uno por tarea y en su orden.
    ayudas: [
      "We're looking for ___",
      "Which one is ___er?",
      "The ___ one is cheaper ___",
      "Is it far from ___?",
      "I think the ___ one is the best because ___",
    ],
  },
  ilustraciones: [
    { archivos: ["cardiff"], muestra: "Portada de la ciudad: el castillo, el estadio y la bahía", uso: "Portada de la parada" },
    {
      archivos: ["e-cardiff-apartamentos"],
      muestra: 'Una calle con dos edificios con el letrero "For rent" y la agente con las llaves',
      uso: "Escenario",
    },
    {
      archivos: ["f-muchacho-alto", "f-muchacho-mediano", "f-muchacho-bajo"],
      muestra:
        "Tres muchachos del equipo de fútbol de Ben, cada uno en su dibujo, con el mismo fondo y la misma regla de medir en la pared: uno alto, uno mediano y uno bajo. Sin nombres",
      uso: "Lección 1 (paso 1)",
    },
    {
      archivos: ["f-dos-maletas"],
      muestra: "Una maleta grande con etiqueta de £60 y una pequeña con etiqueta de £25",
      uso: "Lección 1 (paso 2)",
    },
    {
      archivos: ["edimburgo", "oxford", "manchester"],
      muestra: "Las portadas de las tres ciudades (de las paradas 4, 5 y 2)",
      uso: "Lección 2 (paso 1)",
    },
    {
      archivos: ["f-tren", "f-avion", "a1/c-bus"],
      muestra: "Un tren, un avión (de la parada 4) y un bus (de A1)",
      uso: "Lección 3 (paso 1)",
    },
    {
      archivos: ["f-dos-habitaciones"],
      muestra: "Dos cuartos de hotel: uno grande con vista al mar y £120; uno pequeño sin ventana y £60",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["a1/f-barrio", "a1/f-playa-la", "f-granjero-vacas"],
      muestra: "Una calle con un parque al lado, una playa (de A1) y una granja (de la parada 1)",
      uso: "Lección 4 (paso 1)",
    },
    {
      archivos: ["f-tres-helados"],
      muestra: "Tres helados: uno pequeño de vainilla, uno mediano de fresa y uno grande de chocolate",
      uso: "Lección 4 (paso 2)",
    },
  ],
};
