import type { Parada } from "../tipos.ts";

/**
 * Parada 5 · Oxford (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/" y las
 * de las paradas 2 y 3 de A2 van tal cual.
 *
 * Datos nuevos (aprobados el 17 de octubre de 2026): Allison no tiene
 * datos nuevos en esta parada; su plan del sábado sale de su ficha (los
 * sábados visita a Emily y los fines de semana ve películas). Ben: su
 * abuela vive en Oxford y hornea tortas; este fin de semana Ben la visita.
 * Priya: vive en Londres y va a Oxford a pasar el fin de semana con el
 * alumno; le encantan los castillos y tomar fotos. El alumno: en esta
 * parada está en Oxford en un curso de inglés de dos semanas.
 */
export const PARADA_05: Parada = {
  numero: 5,
  ciudad: "Oxford",
  titulo: "Haz planes",
  gramatica: "Going to y will",
  objetivo:
    'Al terminar, el alumno cuenta sus planes y se ofrece a hacer cosas: "I\'m going to visit the castle. I\'ll call you later." Gramática: going to y will. Usa A1 y las paradas 1 a 4.',
  fraseMeta: "I'm going to visit the castle. I'll call you later.",
  portada: "oxford",
  vocabulario: [
    {
      grupo: "Planes",
      ingles: "I'm going to visit… We're going to watch… She's going to travel.",
      nota: "Going to para lo que ya decidiste antes de hablar",
    },
    {
      grupo: "Decidir y ofrecer",
      ingles: "I'll close the window. I'll get you some water. I'll buy the tickets. I'll call you later.",
      nota: "Will para lo que decides en el momento o cuando ofreces ayuda; casi siempre contraído: I'll",
    },
    {
      grupo: "Predecir",
      ingles: "It's going to rain! I think it will be cold. It'll be fun.",
      nota: "Si lo estás viendo venir, going to; si es lo que crees, I think… will",
    },
    {
      grupo: "Preguntas y negativas",
      ingles: "Are you going to…? What are you going to do? I'm not going to… Will it be cold? I won't…",
      nota: "Won't es will not",
    },
    {
      grupo: "Cuándo",
      ingles: "tonight, tomorrow, this weekend, on Saturday, next week, next vacation, later",
      nota: '"Vacation", de Estados Unidos, nunca "holiday"',
    },
    {
      grupo: "Frases",
      ingles: "What are you going to do this weekend? I'll call you later. See you at ten!",
      nota: "",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Lo que vas a hacer",
      objetivo: "Entender y decir planes con going to.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "This weekend Ben is going to visit his grandma in Oxford. They\'re going to bake a cake." (no está escrito). Elige entre tres imágenes: Ben y su abuela horneando una torta, niños jugando fútbol en un parque y un cine.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["This weekend Ben is going to visit his grandma in Oxford.", "They're going to bake a cake."],
          traduccion: ["Este fin de semana Ben va a visitar a su abuela en Oxford.", "Van a hornear una torta."],
          pregunta: "¿Qué va a hacer Ben este fin de semana?",
          opciones: [
            { imagen: "f-plan-torta", descripcion: "Ben y su abuela horneando una torta", etiqueta: "Bake a cake", etiquetaEs: "Hornear una torta" },
            { imagen: "f-parque-futbol", descripcion: "Niños jugando fútbol en un parque", etiqueta: "Play soccer", etiquetaEs: "Jugar fútbol" },
            { imagen: "f-cine", descripcion: "Un cine", etiqueta: "Go to the movies", etiquetaEs: "Ir a cine" },
          ],
          correcta: 0,
          porRevisar: ["opciones: f-parque-futbol es un dibujo nuevo, solo niños jugando con el balón (cambio del 30 de octubre de 2026)", "etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Ben con su abuela"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de Priya en el aeropuerto con su maleta y su pasaje. Allison: "Look at Priya. What is she going to do?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "She has a suitcase." → "She\'s at the airport." → "Start with: She\'s going to…" Sin pistas, Allison dice "She\'s going to travel" y el alumno la repite. Si dice "She going to travel": Antes de going to va is: she\'s going to travel.',
          imagen: "f-priya-aeropuerto",
          pregunta: "Look at Priya. What is she going to do?",
          contexto: "Mira a Priya. ¿Qué va a hacer? Responde con una frase en inglés.",
          respuesta: "She's going to travel.",
          aceptadas: ["is going to travel", "is going to fly", "is going to take a plane", "is going to take the plane", "is going to take a trip", "is going to go on a trip", "is going to go on vacation", "is going to get on the plane"],
          pistas: ["She has a suitcase.", "She's at the airport.", "Start with: She's going to…"],
          explicaciones: [
            { siDice: "She going to", explicacion: "Antes de going to va is: she's going to travel." },
          ],
          porRevisar: ["aceptadas: con is going to, también «Priya is going to travel» y «She's going to take a trip»; tercera pista con el comienzo; explicaciones: la del documento (Si dice…), que no estaba en los datos (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "We\'re going to visit the castle." Se practica la palabra castle.',
          siRespondeMal:
            'Si pronuncia la t: Escucha: castle. La t no suena: "kásel". Say it: castle. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "We're going to visit the castle.",
          palabraDificil: "castle",
          consejo: 'La t no suena: "kásel".',
        },
      ],
    },
    {
      numero: 2,
      titulo: "I'll",
      objetivo: "Decidir en el momento y ofrecer ayuda con I'll.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya says: "It\'s cold in here." Ben says: "OK, I\'ll close the window." (no está escrito). Elige entre tres imágenes de Ben: cerrando la ventana, abriendo la puerta y prendiendo el televisor.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya says: "It\'s cold in here."', 'Ben says: "OK, I\'ll close the window."'],
          traduccion: ['Priya dice: "Hace frío aquí adentro."', 'Ben dice: "Bueno, yo cierro la ventana."'],
          pregunta: "¿Qué hace Ben?",
          opciones: [
            { imagen: "f-ben-ventana", descripcion: "Ben cerrando la ventana", etiqueta: "Close the window", etiquetaEs: "Cerrar la ventana" },
            { imagen: "f-ben-puerta", descripcion: "Ben abriendo la puerta", etiqueta: "Open the door", etiquetaEs: "Abrir la puerta" },
            { imagen: "f-ben-televisor", descripcion: "Ben prendiendo el televisor", etiqueta: "Turn on the TV", etiquetaEs: "Prender el televisor" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Ben cerrando la ventana"'],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "¿Tienes sed? Te traigo un vaso de agua." Dibujo de una muchacha cansada después de correr y un vaso de agua. Las palabras de apoyo aparecen después del primer fallo: are, you, thirsty, I\'ll, get, a glass of, water.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "Do you have thirst?": La sed se dice con be: are you thirsty? Si dice "I get you": Para ofrecer en el momento: I\'ll get you. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "¿Tienes sed? Te traigo un vaso de agua.",
          imagen: "f-vaso-agua",
          respuesta: "Are you thirsty? I'll get you a glass of water.",
          aceptadas: ["Are you thirsty? I will get you a glass of water.", "Are you thirsty? I'll get you some water."],
          palabras: ["Are", "you", "thirsty?", "I'll", "get", "you", "a", "glass", "of", "water."],
          explicaciones: [
            { siDice: "Do you have thirst?", explicacion: "La sed se dice con be: are you thirsty?" },
            { siDice: "I get you", explicacion: "Para ofrecer en el momento: I'll get you." },
          ],
          porRevisar: [
            'palabras: el documento trae "you" una sola vez y "a glass of" junto; aquí van una por una, con "you" dos veces, como en la respuesta',
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about your plans for your next vacation." Preguntas guía: Where are you going to go? Who are you going to go with? What are you going to do there?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I going to visit my grandma" → Para planes: I\'m going to visit my grandma. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about your plans for your next vacation.",
          guias: ["Where are you going to go?", "Who are you going to go with?", "What are you going to do there?"],
          modelo:
            "On my next vacation I'm going to visit my grandparents in Santa Marta. I'm going to go with my family. We're going to swim in the sea and eat fish. I think it will be fun!",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Preguntas y predicciones",
      objetivo: "Preguntar por planes y decir lo que va a pasar.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Ben says: "Look at those clouds. It\'s going to rain!" Priya says: "OK, I\'ll take my umbrella." (no está escrito). Elige entre tres cosas: un paraguas, unas gafas de sol y unos tenis.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Ben says: "Look at those clouds. It\'s going to rain!"', 'Priya says: "OK, I\'ll take my umbrella."'],
          traduccion: ['Ben dice: "Mira esas nubes. ¡Va a llover!"', 'Priya dice: "Bueno, llevo mi paraguas."'],
          pregunta: "¿Qué va a llevar Priya?",
          opciones: [
            { imagen: "a1/f-paraguas", descripcion: "Un paraguas", etiqueta: "An umbrella", etiquetaEs: "Un paraguas" },
            { imagen: "f-gafas-sol", descripcion: "Unas gafas de sol", etiqueta: "Sunglasses", etiquetaEs: "Gafas de sol" },
            { imagen: "a1/f-tenis", descripcion: "Unos tenis", etiqueta: "Sneakers", etiquetaEs: "Tenis" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca el paraguas"'],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Una calle un sábado por la mañana: un muchacho con una raqueta camino a la cancha de tenis, una muchacha con libros en la puerta de la biblioteca y un señor con una maleta en la estación de tren. Allison: "Tell me 3 things they\'re going to do." Debajo: "He\'s / She\'s going to ___." y play tennis, study, travel.',
          siRespondeMal:
            'Si dice "He going to play tennis", Allison repite bien la frase (He\'s going to play tennis.) y el alumno la dice. Si nombra menos de 3, Allison señala la maleta y pregunta "What\'s he going to do?".',
          imagen: "f-calle-planes",
          pregunta: "Tell me 3 things they're going to do.",
          plantillas: ["He's / She's going to ___."],
          palabrasAyuda: ["play tennis", "study", "travel"],
          modelo: ["He's going to play tennis.", "She's going to study.", "He's going to travel."],
          aceptadas: ["The boy is going to play tennis.", "She's going to read.", "The man is going to take a train."],
          cosas: ["tennis", "racket", "study", "read", "book", "library", "travel", "train", "suitcase"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen del dibujo, de las frases modelo y de las aceptadas"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: What are you going to do this weekend? Are you going to study tonight? What are you going to eat for dinner? Do you think it will rain tomorrow? Where are you going to go on your next vacation?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "What are you going to do this weekend?", modelo: "I'm going to play soccer." },
            { pregunta: "Are you going to study tonight?", modelo: "Yes, I am." },
            { pregunta: "What are you going to eat for dinner?", modelo: "I'm going to eat rice and chicken." },
            { pregunta: "Do you think it will rain tomorrow?", modelo: "No, I don't think so." },
            { pregunta: "Where are you going to go on your next vacation?", modelo: "I'm going to go to the beach." },
          ],
          aceptadas: ["Soccer.", "No.", "Pizza."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "¿Qué plan es?",
      objetivo: "Preguntar con Are you going to…?",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "On Saturday I\'m going to visit my sister Emily. We\'re going to watch a movie." (no está escrito). Elige entre tres imágenes: dos mujeres viendo una película en un sofá, dos mujeres tomando café y una mujer caminando en un parque.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["On Saturday I'm going to visit my sister Emily.", "We're going to watch a movie."],
          traduccion: ["El sábado voy a visitar a mi hermana Emily.", "Vamos a ver una película."],
          pregunta: "¿Qué van a hacer Allison y Emily el sábado?",
          opciones: [
            { imagen: "f-hermanas-pelicula", descripcion: "Dos mujeres viendo una película en un sofá", etiqueta: "Watch a movie", etiquetaEs: "Ver una película" },
            { imagen: "a1/f-amigas-cafe", descripcion: "Dos mujeres tomando café", etiqueta: "Have coffee", etiquetaEs: "Tomar café" },
            { imagen: "a1/f-mujer-parque", descripcion: "Una mujer caminando en un parque", etiqueta: "Walk in the park", etiquetaEs: "Caminar en el parque" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca a las dos mujeres viendo la película"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de un muchacho al que se le caen muchos libros; una muchacha corre a ayudarlo. Allison: "He has a lot of books! What does she say?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "She wants to help." → "Start with: I\'ll…" Sin pistas, Allison dice "I\'ll help you!" y el alumno la repite. Si dice "I help you": Para ofrecer ayuda en el momento: I\'ll help you.',
          imagen: "f-ayudar-libros",
          pregunta: "He has a lot of books! What does she say?",
          contexto: "A él se le caen los libros y ella corre hacia él. ¿Qué le dice ella? Dilo en inglés.",
          respuesta: "I'll help you!",
          aceptadas: ["I'll help", "Let me help", "I'll pick them up", "I'll get them", "I'll carry them"],
          pistas: ["She wants to help.", "Start with: I'll…"],
          explicaciones: [
            { siDice: "I help you", explicacion: "Para ofrecer ayuda en el momento: I'll help you." },
          ],
          porRevisar: ["aceptadas: también otras ofertas con I'll («I'll pick them up», «I'll carry them»); explicaciones: la del documento (Si dice…), que no estaba en los datos (cambio del 30 de octubre de 2026)"],
        },
        // El párrafo del documento bajo la tabla ("Hmm, I can't answer that
        // one…" para una pregunta fuera de la tabla, y la misma pregunta con
        // will vale como la de la tabla) ya lo hacen respuestaDeAdivina
        // (src/lib/ruta/adivina.ts) y clasificarAdivina (escena.ts).
        {
          paso: 3,
          tipo: "adivina",
          queAparece:
            'Seis tarjetas con dibujo de planes para el fin de semana: go to the movies, play soccer, visit a museum, go shopping, bake a cake y go camping. Allison: "I have a plan for the weekend. Ask me yes or no questions and guess!" Dos rondas (museum y camping, en orden al azar).',
          siRespondeMal:
            'Si no es de sí o no ("What are you going to do?"): Allison, "That\'s a secret! Ask me: Are you going to…?". Al segundo intento fallido se ilumina la ayuda con una pregunta de ejemplo. Si adivina mal: "No! Ask me more."',
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "You going outside?", "Will you buy clothes?", "Museum?"',
          apertura: "I have a plan for the weekend. Ask me yes or no questions and guess!",
          opciones: [
            { nombre: "go to the movies", imagen: "f-cine" },
            { nombre: "play soccer", imagen: "f-parque-futbol" },
            { nombre: "visit a museum", imagen: "f-plan-museo" },
            { nombre: "go shopping", imagen: "f-plan-compras" },
            { nombre: "bake a cake", imagen: "f-plan-torta" },
            { nombre: "go camping", imagen: "f-plan-camping" },
          ],
          rondas: ["visit a museum", "go camping"],
          preguntas: [
            { pregunta: "Are you going to stay at home?", si: ["bake a cake"] },
            { pregunta: "Are you going to be outside?", si: ["play soccer", "go camping"] },
            { pregunta: "Are you going to need a ticket?", si: ["go to the movies", "visit a museum"] },
            { pregunta: "Are you going to play a sport?", si: ["play soccer"] },
            { pregunta: "Are you going to see art?", si: ["visit a museum"] },
            { pregunta: "Are you going to eat popcorn?", si: ["go to the movies"] },
            { pregunta: "Are you going to buy clothes?", si: ["go shopping"] },
            { pregunta: "Are you going to go to the mall?", si: ["go shopping"] },
            { pregunta: "Are you going to be in the kitchen?", si: ["bake a cake"] },
            { pregunta: "Are you going to sleep in a tent?", si: ["go camping"] },
          ],
          adivinar: "Are you going to {x}?",
          secreto: "That's a secret! Ask me: Are you going to…?",
          aceptadas: ["You going outside?", "Will you buy clothes?", "Museum?"],
          porRevisar: [
            'opciones: los nombres largos de las tarjetas ("go to the movies", "play soccer", "visit a museum", "go shopping", "bake a cake", "go camping") salen de la lista de tarjetas del documento (Qué aparece); la tabla de respuestas y las rondas usan los cortos (movies, soccer, museum, shopping, cake, camping)',
            'adivinar: "Are you going to {x}?" no está escrita como regla; sale del ejemplo "Are you going to visit a museum?" y sirve con los nombres largos',
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "Planeas el fin de semana con Priya en Oxford",
    imagen: "e-oxford-cafe",
    contexto:
      "Estás en Oxford en un curso de inglés de dos semanas. Tu amiga Priya (Allison en su papel) llegó de Londres a pasar el fin de semana contigo. En un café, planean qué van a hacer.",
    personaje: "Priya, tu amiga que llegó de Londres a pasar el fin de semana contigo en Oxford",
    objetivo: "Contar planes con going to, ofrecerse a hacer cosas con I'll y ponerse de acuerdo con Priya",
    tareas: [
      "Dale la bienvenida a Priya.",
      "Cuéntale un plan para el sábado.",
      "Pregúntale qué quiere hacer el domingo.",
      "Ofrécete a hacer algo.",
      "Despídete y confirma la hora.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hi! Wow, Oxford is so beautiful!" },
      { quien: "alumno", dice: "Hi, Priya! Welcome to Oxford!", tarea: 1 },
      { quien: "personaje", dice: "Thanks! How was your week?" },
      { quien: "alumno", dice: "It was great. I studied a lot." },
      { quien: "personaje", dice: "Good! So, what are we going to do this weekend?" },
      { quien: "alumno", dice: "On Saturday we're going to visit the castle.", tarea: 2 },
      { quien: "personaje", dice: "Cool! What time are we going to go?" },
      { quien: "alumno", dice: "In the morning. It opens at ten." },
      { quien: "personaje", dice: "Do you think it will be cold?" },
      { quien: "alumno", dice: "Yes, I think it will be cold. I'm going to take a jacket." },
      { quien: "personaje", dice: "Good idea! I'm going to take a lot of photos." },
      { quien: "alumno", dice: "Great! What do you want to do on Sunday?", tarea: 3 },
      { quien: "personaje", dice: "Hmm… Can we take a boat on the river?" },
      { quien: "alumno", dice: "Sure! I'll buy the tickets.", tarea: 4 },
      { quien: "personaje", dice: "Thanks! And where are we going to eat?" },
      { quien: "alumno", dice: "I don't know. I'll look for a restaurant tonight." },
      { quien: "personaje", dice: "Perfect! I'm tired now. I'm going to go to my hotel." },
      { quien: "alumno", dice: "OK. I'll call you later." },
      { quien: "personaje", dice: "See you tomorrow!" },
      { quien: "alumno", dice: "See you at ten, Priya!", tarea: 5 },
    ],
    resumen: "¡Lo lograste! Contaste en inglés tus planes y te ofreciste a ayudar.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Oxford en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like this café" → Me too! So, what are we going to do on Saturday?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "I\'ll ___"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"Yo compro los boletos" → En inglés: I\'ll buy the tickets. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"We going to visit the castle" → la escena sigue; en el resumen: Para planes: we\'re going to visit the castle.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "I'm tired! See you tomorrow! Vamos a repasar going to y will y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    ayudas: ["Welcome to ___", "On Saturday we're going to ___", "What do you want to ___?", "I'll ___", "See you at ___"],
  },
  ilustraciones: [
    {
      archivos: ["oxford"],
      muestra: "Portada de la ciudad: edificios antiguos de piedra con torres, bicicletas y el río con botes",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-oxford-cafe"],
      muestra: "Un café con mesas de madera; por la ventana, edificios de piedra y bicicletas",
      uso: "Escenario",
    },
    {
      archivos: ["f-plan-torta"],
      muestra: "Ben y su abuela horneando una torta",
      uso: "Lección 1 (paso 1) y la tarjeta bake a cake",
    },
    {
      archivos: ["f-parque-futbol", "f-cine"],
      muestra: "Niños jugando fútbol en un parque (de la parada 3); un cine (de la parada 2)",
      uso: "Lección 1 (paso 1) y las tarjetas play soccer y go to the movies",
    },
    {
      archivos: ["f-plan-museo", "f-plan-compras", "f-plan-camping"],
      muestra: "Una muchacha mirando cuadros en un museo; una muchacha con bolsas en un centro comercial; una carpa junto a un lago",
      uso: "Las tarjetas de Adivina",
    },
    { archivos: ["f-priya-aeropuerto"], muestra: "Priya en el aeropuerto con su maleta y su pasaje", uso: "Lección 1 (paso 2)" },
    {
      archivos: ["f-ben-ventana", "f-ben-puerta", "f-ben-televisor"],
      muestra: "Ben cerrando la ventana, abriendo la puerta y prendiendo el televisor",
      uso: "Lección 2 (paso 1)",
    },
    { archivos: ["f-vaso-agua"], muestra: "Una muchacha cansada después de correr y un vaso de agua", uso: "Lección 2 (paso 2)" },
    {
      archivos: ["a1/f-paraguas", "a1/f-tenis"],
      muestra: "Un paraguas abierto bajo la lluvia; unos tenis (de A1)",
      uso: "Lección 3 (paso 1)",
    },
    { archivos: ["f-gafas-sol"], muestra: "Unas gafas de sol", uso: "Lección 3 (paso 1)" },
    {
      archivos: ["f-calle-planes"],
      muestra:
        "Una calle un sábado por la mañana: un muchacho con una raqueta, una muchacha con libros en la puerta de la biblioteca y un señor con una maleta en la estación",
      uso: "Lección 3 (paso 2)",
    },
    { archivos: ["f-hermanas-pelicula"], muestra: "Dos mujeres viendo una película en un sofá, con palomitas", uso: "Lección 4 (paso 1)" },
    {
      archivos: ["a1/f-amigas-cafe", "a1/f-mujer-parque"],
      muestra: "Dos mujeres tomando café; una mujer caminando en un parque (de A1)",
      uso: "Lección 4 (paso 1)",
    },
    {
      archivos: ["f-ayudar-libros"],
      muestra: "A un muchacho se le caen muchos libros y una muchacha corre a ayudarlo",
      uso: "Lección 4 (paso 2)",
    },
  ],
};
