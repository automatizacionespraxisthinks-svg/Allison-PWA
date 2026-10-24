import type { Parada } from "../tipos.ts";

/**
 * Parada 6 · York (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/".
 * La lección 3 usa tarjetas que dibuja la app (texto, sin imagen).
 */
export const PARADA_06: Parada = {
  numero: 6,
  ciudad: "York",
  titulo: "Organiza un viaje",
  gramatica: "Presente continuo para planes ya arreglados",
  objetivo:
    'Al terminar, el alumno cuenta sus planes ya arreglados y compra un tiquete de tren: "I\'m taking the 9:15 train to Cambridge." Gramática: presente continuo para planes ya arreglados, con día u hora. Usa A1, las paradas 1 a 5 y el Repaso 1.',
  fraseMeta: "I'm taking the 9:15 train to Cambridge.",
  portada: "york",
  vocabulario: [
    {
      grupo: "Planes arreglados",
      ingles: "I'm taking the 9:15 train. We're meeting at the station. She's flying to Paris on Friday.",
      nota: "Presente continuo con un día o una hora para lo que ya está organizado (hay tiquete, cita o acuerdo). Going to, para lo que decidiste",
    },
    {
      grupo: "Preguntas",
      ingles: "What are you doing on Saturday? When are you leaving? How are you getting there?",
      nota: "",
    },
    {
      grupo: "En la estación",
      ingles: "ticket, one-way, round-trip, track, schedule, ticket window, the next train, on time, late",
      nota: "De Estados Unidos: round-trip (nunca return), schedule (nunca timetable) y track; en los letreros del Reino Unido verá platform",
    },
    {
      grupo: "Horas del viaje",
      ingles: "leave at…, arrive at…, nine fifteen (9:15), eleven forty (11:40), on Saturday morning",
      nota: "Las horas se dicen con los dos números: nine fifteen",
    },
    {
      grupo: "Frases",
      ingles: "I'd like a one-way ticket to Cambridge, please. Which track does it leave from?",
      nota: "",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Planes arreglados",
      objetivo: "Entender y decir planes ya arreglados con el presente continuo.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Priya is flying to Paris on Friday. Her aunt is meeting her at the airport." (no está escrito). Pregunta: ¿qué hace Priya el viernes? Elige entre Priya en el aeropuerto, Priya en la biblioteca y Priya en un estadio.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Priya is flying to Paris on Friday.", "Her aunt is meeting her at the airport."],
          traduccion: ["El viernes Priya vuela a París.", "Su tía la espera en el aeropuerto."],
          pregunta: "¿Qué hace Priya el viernes?",
          opciones: [
            { imagen: "f-priya-aeropuerto", descripcion: "Priya en el aeropuerto", etiqueta: "Aeropuerto" },
            { imagen: "f-priya-biblioteca", descripcion: "Priya en la biblioteca", etiqueta: "Biblioteca" },
            { imagen: "f-priya-estadio", descripcion: "Priya en un estadio", etiqueta: "Estadio" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo del tiquete de tren de Ben: "London → Cambridge · Saturday · 10:30". Allison: "Look at Ben\'s ticket. What is he doing on Saturday?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Look at the ticket." → "Start with: He\'s taking…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "He take the train": Para lo que ya está arreglado: he\'s taking the train.',
          imagen: "f-tiquete-tren",
          pregunta: "Look at Ben's ticket. What is he doing on Saturday?",
          contexto: "Mira el tiquete de Ben. ¿Qué plan tiene para el sábado? Responde con una frase en inglés.",
          respuesta: "He's taking the train to Cambridge.",
          aceptadas: ["He is taking the 10:30 train to Cambridge.", "He's going to Cambridge.", "He's traveling to Cambridge."],
          pistas: ["Look at the ticket.", "Start with: He's taking…"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "The train schedule is on the wall." Se practica la palabra schedule.',
          siRespondeMal:
            'Si dice "shedule" o "esquedule": Escucha: schedule. Suena "skédyul", con sk al principio. Say it: schedule. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "The train schedule is on the wall.",
          palabraDificil: "schedule",
          consejo: 'Suena "skédyul", con sk al principio.',
        },
      ],
    },
    {
      numero: 2,
      titulo: "¿Cuándo sales?",
      objetivo: "Preguntar y responder por planes arreglados.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Ben asks: "What are you doing tonight, Priya?" Priya says: "I\'m going to the movies with my brother Arjun at seven." (no está escrito). Elige entre un cine, un estadio y un museo.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Ben asks: "What are you doing tonight, Priya?"', 'Priya says: "I\'m going to the movies with my brother Arjun at seven."'],
          traduccion: ['Ben pregunta: "¿Qué vas a hacer esta noche, Priya?"', 'Priya dice: "Voy a cine con mi hermano Arjun a las siete."'],
          pregunta: "¿Adónde va Priya esta noche?",
          opciones: [
            { imagen: "f-cine", descripcion: "Un cine", etiqueta: "Cine" },
            { imagen: "f-estadio-hotdogs", descripcion: "Un estadio", etiqueta: "Estadio" },
            { imagen: "f-priya-museo", descripcion: "Un museo", etiqueta: "Museo" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'pregunta: el documento no la escribe; sale de "Toca el cine"',
            'opciones: el documento dice "un museo"; el dibujo de la tabla (f-priya-museo, de la parada 2) es Priya en un museo',
          ],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Mañana salgo a las ocho y llego a las diez." Las palabras de apoyo aparecen después del primer fallo: tomorrow, I\'m, leaving, at, eight, and, arriving, ten.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "I\'m leave": Después de I\'m va -ing: I\'m leaving. Si dice "I go out at eight": En español decimos "salgo"; para un viaje arreglado: I\'m leaving. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Mañana salgo a las ocho y llego a las diez.",
          respuesta: "Tomorrow I'm leaving at eight and I'm arriving at ten.",
          aceptadas: [
            "I'm leaving at eight tomorrow and I'm arriving at ten.",
            "Tomorrow I leave at eight and I arrive at ten.",
            "Tomorrow I'm going to leave at eight and arrive at ten.",
          ],
          palabras: ["Tomorrow", "I'm", "leaving", "at", "eight", "and", "I'm", "arriving", "at", "ten."],
          explicaciones: [
            { siDice: "I'm leave", explicacion: "Después de I'm va -ing: I'm leaving." },
            { siDice: "I go out at eight", explicacion: 'En español decimos "salgo"; para un viaje arreglado: I\'m leaving.' },
          ],
          porRevisar: ['palabras: el documento trae "I\'m" y "at" una sola vez; la respuesta usa cada una dos veces'],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about your plans for next week." Preguntas guía: What are you doing on Monday? Who are you meeting this week? What are you doing on the weekend?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "On Wednesday I playing soccer" → Para lo arreglado: on Wednesday I\'m playing soccer. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about your plans for next week.",
          guias: ["What are you doing on Monday?", "Who are you meeting this week?", "What are you doing on the weekend?"],
          modelo:
            "On Monday I'm having a math test. On Wednesday I'm playing soccer with my team. On Saturday I'm visiting my cousins in Paipa, and on Sunday we're having lunch with my grandparents.",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "En la estación",
      objetivo: "Entender horarios y contar lo que alguien tiene organizado.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Anuncio de la estación: "The 9:15 train to Cambridge is leaving from track 4." (no está escrito). Elige entre tres tarjetas dibujadas por la app: 9:15 · track 4, 9:50 · track 4 y 9:15 · track 14.',
          siRespondeMal: "Se repite el anuncio despacio y elige otra vez.",
          quienHabla: "El anuncio de la estación",
          audio: ["The 9:15 train to Cambridge is leaving from track 4."],
          traduccion: ["El tren de las 9:15 a Cambridge sale de la vía 4."],
          pregunta: "¿A qué hora y de qué vía sale el tren a Cambridge?",
          opciones: [
            { texto: "9:15 · track 4", descripcion: "El tren de las 9:15, vía 4" },
            { texto: "9:50 · track 4", descripcion: "El tren de las 9:50, vía 4" },
            { texto: "9:15 · track 14", descripcion: "El tren de las 9:15, vía 14" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca 9:15 · track 4"'],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'El calendario de Ben en la pared: el lunes una muela a las 4:00, el miércoles un balón de fútbol y el viernes una torta de cumpleaños con "Grandma". Allison: "Tell me 3 things Ben is doing this week." Debajo: "On ___ he\'s ___." y going to the dentist, playing soccer, having dinner with his grandma.',
          siRespondeMal:
            'Si dice "On Monday he go to the dentist", Allison repite bien la frase (On Monday he\'s going to the dentist.) y el alumno la dice. Si nombra menos de 3, Allison señala la torta y pregunta "What\'s he doing on Friday?".',
          imagen: "f-agenda-ben",
          pregunta: "Tell me 3 things Ben is doing this week.",
          plantillas: ["On ___ he's ___."],
          palabrasAyuda: ["going to the dentist", "playing soccer", "having dinner with his grandma"],
          modelo: ["On Monday he's going to the dentist.", "On Wednesday he's playing soccer.", "On Friday he's having dinner with his grandma."],
          aceptadas: ["He's seeing the dentist on Monday.", "On Friday he's visiting his grandma.", "It's her birthday."],
          cosas: ["dentist", "soccer", "dinner", "grandma", "birthday"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen del dibujo y de las frases modelo"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: What are you doing after school today? What are you doing this weekend? Are you visiting anyone this month? How are you getting home today? What time are you having dinner tonight?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "What are you doing after school today?", modelo: "I'm playing soccer with my friends." },
            { pregunta: "What are you doing this weekend?", modelo: "I'm visiting my cousins." },
            { pregunta: "Are you visiting anyone this month?", modelo: "Yes, I'm visiting my grandparents." },
            { pregunta: "How are you getting home today?", modelo: "I'm taking the bus." },
            { pregunta: "What time are you having dinner tonight?", modelo: "I'm having dinner at seven." },
          ],
          aceptadas: ["Soccer.", "By bus.", "At seven."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "La semana de Allison",
      objetivo: "Preguntar por planes arreglados con What are you doing…?",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Tonight I\'m cooking dinner for my mom. I\'m making ajiaco!" (no está escrito). Elige entre una mujer cocinando, una mujer caminando en un parque y dos mujeres tomando café.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Tonight I'm cooking dinner for my mom.", "I'm making ajiaco!"],
          traduccion: ["Esta noche le cocino la cena a mi mamá.", "¡Voy a hacer ajiaco!"],
          pregunta: "¿Qué hace Allison esta noche?",
          opciones: [
            { imagen: "a1/f-mujer-cocina", descripcion: "Una mujer cocinando", etiqueta: "Cocinar" },
            { imagen: "a1/f-mujer-parque", descripcion: "Una mujer caminando en un parque", etiqueta: "Caminar en el parque" },
            { imagen: "a1/f-amigas-cafe", descripcion: "Dos mujeres tomando café", etiqueta: "Tomar café" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca a la mujer cocinando"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de la entrada de Priya: "Concert · Thursday · 8:00 p.m.". Allison: "Look at Priya\'s ticket. What is she doing on Thursday?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Look at the ticket." → "Start with: She\'s going…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "She go to a concert": Para lo arreglado: she\'s going to a concert.',
          imagen: "f-entrada-concierto",
          pregunta: "Look at Priya's ticket. What is she doing on Thursday?",
          contexto: "Mira la entrada de Priya. ¿Qué plan tiene para el jueves? Responde con una frase en inglés.",
          respuesta: "She's going to a concert.",
          aceptadas: ["She is going to a concert on Thursday.", "She's seeing a concert."],
          pistas: ["Look at the ticket.", "Start with: She's going…"],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'La agenda de Allison con cinco datos por descubrir: qué hace esta noche, cómo va mañana al trabajo, qué hace el jueves, qué hace el sábado y qué hace el domingo. Arma cada pregunta; las palabras de ayuda aparecen después del primer fallo. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿Qué hago el sábado? Say: What are you doing on Saturday? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "la agenda de Allison",
          // Respuestas de Allison: el trabajo, el sábado y el domingo salen de
          // su ficha; esta noche y el jueves son datos nuevos de esta
          // actividad (su agenda de una semana: no pasan a la ficha).
          datos: [
            { dato: "Qué hace esta noche", pregunta: "What are you doing tonight?", respuesta: "I'm cooking dinner for my mom. I'm making ajiaco!" },
            { dato: "Cómo va mañana al trabajo", pregunta: "How are you getting to work tomorrow?", respuesta: "I'm taking the subway, like every day." },
            { dato: "Qué hace el jueves", pregunta: "What are you doing on Thursday?", respuesta: "I'm taking Luna to the vet. Don't worry, she's OK!" },
            { dato: "Qué hace el sábado", pregunta: "What are you doing on Saturday?", respuesta: "I'm visiting my sister Emily, like every Saturday." },
            { dato: "Qué hace el domingo", pregunta: "What are you doing on Sunday?", respuesta: "I'm walking in the park. I hope it's sunny!" },
          ],
          aceptadas: ["Tonight?", "How you go to work tomorrow?", "And Saturday?"],
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "Tonight?", "How you go to work tomorrow?", "And Saturday?"',
          ayuda: "¿Qué quieres saber? ¿Qué hago el sábado? Say: What are you doing on Saturday?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Compras tu tiquete en la estación de York",
    imagen: "e-york-estacion",
    contexto:
      "El sábado te vas de York para Cambridge, donde te espera una familia anfitriona. En la ventanilla de la estación te atiende Ms. Carter (Allison en su papel).",
    personaje: "Ms. Carter, la empleada de la ventanilla de la estación de York",
    objetivo: "Comprar el tiquete que necesita y contar sus planes de viaje con el presente continuo",
    tareas: [
      "Saluda y di para dónde viajas.",
      "Di qué día sales.",
      "Pide el tiquete que necesitas.",
      "Cuenta qué vas a hacer en Cambridge.",
      "Pregunta de qué vía sale el tren.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Good morning! How can I help you?" },
      { quien: "alumno", dice: "Good morning! I'm traveling to Cambridge.", tarea: 1 },
      { quien: "personaje", dice: "Great! When are you leaving?" },
      { quien: "alumno", dice: "I'm leaving on Saturday morning.", tarea: 2 },
      { quien: "personaje", dice: "Are you coming back to York?" },
      { quien: "alumno", dice: "No, I'm not. Next week I'm traveling to Brighton." },
      { quien: "personaje", dice: "Then you need a one-way ticket." },
      { quien: "alumno", dice: "Yes. I'd like a one-way ticket, please.", tarea: 3 },
      { quien: "personaje", dice: "There's a train at 9:15 and another one at 11:40." },
      { quien: "alumno", dice: "The 9:15 train, please. How much is it?" },
      { quien: "personaje", dice: "It's sixty pounds. Cash or card?" },
      { quien: "alumno", dice: "Card, please." },
      { quien: "personaje", dice: "Here you go. Are you visiting friends in Cambridge?" },
      { quien: "alumno", dice: "No. I'm staying with a host family. We're having a picnic on Sunday!", tarea: 4 },
      { quien: "personaje", dice: "That sounds fun! Here's your ticket." },
      { quien: "alumno", dice: "Thank you! Which track does the train leave from?", tarea: 5 },
      { quien: "personaje", dice: "Track 4. Don't be late!" },
      { quien: "alumno", dice: "Don't worry, I'll be here at nine." },
      { quien: "personaje", dice: "Perfect. Have a good trip!" },
      { quien: "alumno", dice: "Thanks! Have a nice day!" },
    ],
    resumen: "¡Lo lograste! Compraste tu tiquete y contaste en inglés tus planes de viaje.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de York en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like trains" → Me too! So, where are you traveling today?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "I\'m leaving on ___"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"Me voy el sábado" → En inglés: I\'m leaving on Saturday. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"I leaving on Saturday" → la escena sigue; en el resumen: Para lo arreglado: I\'m leaving on Saturday.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "The train is here! Have a good trip! Vamos a repasar el presente continuo para planes y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    ayudas: ["I'm traveling to ___", "I'm leaving on ___", "I'd like a ___ ticket", "I'm staying ___", "Which ___?"],
  },
  ilustraciones: [
    {
      archivos: ["york"],
      muestra: "Portada de la ciudad: la muralla antigua, la catedral y una calle estrecha de piedra",
      uso: "Portada de la parada",
    },
    { archivos: ["e-york-estacion"], muestra: "La ventanilla de tiquetes de la estación, con el tablero de horarios", uso: "Escenario" },
    {
      archivos: ["f-priya-aeropuerto", "f-priya-biblioteca", "f-priya-estadio"],
      muestra: "Priya en el aeropuerto, en la biblioteca y en un estadio (de las paradas 5, 1 y 2)",
      uso: "Lección 1 (paso 1)",
    },
    { archivos: ["f-tiquete-tren"], muestra: 'El tiquete de tren de Ben: "London → Cambridge · Saturday · 10:30"', uso: "Lección 1 (paso 2)" },
    {
      archivos: ["f-cine", "f-estadio-hotdogs", "f-priya-museo"],
      muestra: "Un cine, un estadio y un museo (de la parada 2)",
      uso: "Lección 2 (paso 1)",
    },
    {
      archivos: ["f-agenda-ben"],
      muestra: 'El calendario de Ben en la pared: una muela el lunes a las 4:00, un balón el miércoles y una torta con "Grandma" el viernes',
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["a1/f-mujer-cocina", "a1/f-mujer-parque", "a1/f-amigas-cafe"],
      muestra: "Una mujer cocinando, una mujer caminando en un parque y dos mujeres tomando café (de A1)",
      uso: "Lección 4 (paso 1)",
    },
    { archivos: ["f-entrada-concierto"], muestra: 'La entrada de Priya: "Concert · Thursday · 8:00 p.m."', uso: "Lección 4 (paso 2)" },
  ],
};
