import type { Parada } from "../tipos.ts";

/**
 * Parada 4 · Edimburgo (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2 (f-arepas viene de la parada 2); las de A1 que
 * se reutilizan llevan "a1/".
 */
export const PARADA_04: Parada = {
  numero: 4,
  ciudad: "Edimburgo",
  titulo: "Habla de tus experiencias",
  gramatica: "Presente perfecto con ever y never",
  objetivo:
    'Al terminar, el alumno cuenta lo que ha vivido y lo que nunca ha hecho: "Have you ever been to London? I\'ve never flown alone." Gramática: presente perfecto con ever y never. Usa A1 y las paradas 1 a 3; nada de going to ni will.',
  fraseMeta: "Have you ever been to London? I've never flown alone.",
  portada: "edimburgo",
  vocabulario: [
    {
      grupo: "Experiencias",
      ingles: "I've been to… I've seen… I've tried… I've eaten… I've ridden… I've flown… I've met…",
      nota: '"Been to" para lugares: "I\'ve been to Mexico", nunca "been in"',
    },
    {
      grupo: "Ever y never",
      ingles: "Have you ever…? I've never…",
      nota: 'Never va con have afirmativo: "I\'ve never been", nunca "I haven\'t never"',
    },
    {
      grupo: "Respuestas cortas",
      ingles: "Yes, I have. No, I haven't. Yes, she has. No, he hasn't.",
      nota: "Se responde con have o has, no con did",
    },
    {
      grupo: "Participios",
      ingles: "been, seen, eaten, tried, ridden, flown, met, traveled",
      nota: '"Traveled" con una l, de Estados Unidos',
    },
    {
      grupo: "Contar el detalle",
      ingles: "I've been to Cartagena. I went there last year.",
      nota: 'La experiencia va con have; cuándo y cómo, en pasado simple. En Estados Unidos también se oye "Did you ever…?" y se acepta',
    },
    {
      grupo: "Frases",
      ingles: "Have you ever been to Scotland? This is my first time. I've never eaten haggis.",
      nota: "",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Alguna vez…?",
      objetivo: "Entender y decir experiencias con have o has y el participio.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Priya has been to Paris, but she has never been to Spain." (no está escrito). Elige entre tres imágenes de Priya: frente a la torre Eiffel, frente a la Sagrada Familia y frente al Coliseo.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Priya has been to Paris, but she has never been to Spain."],
          traduccion: ["Priya ha estado en París, pero nunca ha estado en España."],
          pregunta: "¿Dónde ha estado Priya?",
          opciones: [
            { imagen: "f-priya-paris", descripcion: "Priya frente a la torre Eiffel", etiqueta: "París" },
            { imagen: "f-priya-sagrada", descripcion: "Priya frente a la Sagrada Familia", etiqueta: "Barcelona" },
            { imagen: "f-priya-coliseo", descripcion: "Priya frente al Coliseo", etiqueta: "Roma" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Priya frente a la torre Eiffel"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Foto de Ben montando a caballo, con el letrero "Ben, last summer". Allison: "Has Ben ever ridden a horse?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Look at the photo." → "Answer with: Yes, he…" Sin pistas, Allison dice "Yes, he has" y el alumno la repite. Si dice "Yes, he did": Si preguntan con has, se responde con has: yes, he has.',
          imagen: "f-ben-caballo",
          pregunta: "Has Ben ever ridden a horse?",
          contexto: "¿Ben ha montado a caballo alguna vez? Responde con una respuesta corta en inglés.",
          respuesta: "Yes, he has.",
          aceptadas: ["Yes, he has ridden a horse."],
          pistas: ["Look at the photo.", "Answer with: Yes, he…"],
          porRevisar: [
            'aceptadas: el documento también acepta "Yes."; no se puso suelto porque aceptaría "Yes, he did", el error que corrige',
          ],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "I\'ve never eaten sushi." Se practica la palabra I\'ve.',
          siRespondeMal:
            'Si dice "I never" o "I have" separado: Escucha: I\'ve. Suena "aiv", con una v suave al final. Say it: I\'ve. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "I've never eaten sushi.",
          palabraDificil: "I've",
          consejo: 'Suena "aiv", con una v suave al final.',
        },
      ],
    },
    {
      numero: 2,
      titulo: "Los participios",
      objetivo: "Usar los participios más comunes para contar lo que ha vivido.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Ben has never flown in a plane, but he has traveled by train a lot." (no está escrito). Elige entre tres imágenes: un tren, un avión y un barco.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Ben has never flown in a plane, but he has traveled by train a lot."],
          traduccion: ["Ben nunca ha volado en avión, pero ha viajado mucho en tren."],
          pregunta: "¿En qué ha viajado mucho Ben?",
          opciones: [
            { imagen: "f-tren", descripcion: "Un tren", etiqueta: "Tren" },
            { imagen: "f-avion", descripcion: "Un avión", etiqueta: "Avión" },
            { imagen: "f-barco", descripcion: "Un barco", etiqueta: "Barco" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca el tren"'],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Nunca he probado el sushi, pero he comido tacos." Dibujo de un plato de sushi tachado y unos tacos. Las palabras de apoyo aparecen después del primer fallo: I\'ve, never, tried, sushi, but, eaten, tacos.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "I have never try": Después de have va el participio: tried. Si dice "I\'ve never eat": El participio de eat es eaten. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Nunca he probado el sushi, pero he comido tacos.",
          imagen: "f-sushi-tacos",
          respuesta: "I've never tried sushi, but I've eaten tacos.",
          aceptadas: ["I have never tried sushi, but I have eaten tacos.", "I never tried sushi, but I ate tacos."],
          palabras: ["I've", "never", "tried", "sushi,", "but", "I've", "eaten", "tacos."],
          explicaciones: [
            { siDice: "I have never try", explicacion: "Después de have va el participio: tried." },
            { siDice: "I've never eat", explicacion: "El participio de eat es eaten." },
          ],
          porRevisar: ['palabras: el documento trae "I\'ve" una vez; la frase lo usa dos veces'],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about a place you\'ve visited." Preguntas guía: Where have you been? Who did you go with? What did you see there?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I have been in Cartagena" → Para lugares: I\'ve been to Cartagena. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about a place you've visited.",
          guias: ["Where have you been?", "Who did you go with?", "What did you see there?"],
          modelo:
            "I've been to Cartagena. I went there with my family last year. We saw the old city and we swam in the sea. I've never been to another country.",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Have you ever…?",
      objetivo: "Preguntar y responder por experiencias.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya asks: "Have you ever seen snow, Ben?" Ben says: "Yes, I have. I\'ve seen snow in Scotland." (no está escrito). Elige entre tres paisajes: montañas con nieve, una playa y un desierto.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya asks: "Have you ever seen snow, Ben?"', 'Ben says: "Yes, I have. I\'ve seen snow in Scotland."'],
          traduccion: ['Priya pregunta: "¿Alguna vez has visto nieve, Ben?"', 'Ben dice: "Sí, la he visto. He visto nieve en Escocia."'],
          pregunta: "¿Qué ha visto Ben?",
          opciones: [
            { imagen: "f-montanas-nieve", descripcion: "Montañas con nieve", etiqueta: "Nieve" },
            { imagen: "a1/f-playa-la", descripcion: "Una playa", etiqueta: "Playa" },
            { imagen: "f-desierto", descripcion: "Un desierto", etiqueta: "Desierto" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'pregunta: el documento no la escribe; sale de "Toca las montañas con nieve"',
            "opciones: la playa es la de A1 (f-playa-la), con una muchacha que surfea, un muchacho que nada y un señor con guitarra",
          ],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Tres fotos del viaje de Priya: en una playa, montando en camello y en un barco. Allison: "Tell me 3 things Priya has done." Debajo: "She has ___." y been to the beach, ridden a camel, been on a boat.',
          siRespondeMal:
            'Si dice "She has ride a camel", Allison repite bien la frase (She has ridden a camel.) y el alumno la dice. Si nombra menos de 3, Allison señala el camello y pregunta "What has she done?".',
          imagen: "f-fotos-priya",
          pregunta: "Tell me 3 things Priya has done.",
          plantillas: ["She has ___."],
          palabrasAyuda: ["been to the beach", "ridden a camel", "been on a boat"],
          modelo: ["She has been to the beach.", "She has ridden a camel.", "She has been on a boat."],
          aceptadas: ["She's ridden a camel.", "Priya has been on a boat.", "She went to the beach."],
          cosas: ["beach", "camel", "boat", "sea", "ship"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen de las fotos y de las frases modelo"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: Have you ever been to the beach? Have you ever eaten sushi? Have you ever seen a famous person? Have you ever flown in a plane? What's the best place you've ever visited?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "Have you ever been to the beach?", modelo: "Yes, I have. I've been to Santa Marta." },
            { pregunta: "Have you ever eaten sushi?", modelo: "No, I haven't." },
            { pregunta: "Have you ever seen a famous person?", modelo: "No, never." },
            { pregunta: "Have you ever flown in a plane?", modelo: "Yes, I have." },
            { pregunta: "What's the best place you've ever visited?", modelo: "Cartagena is the best place I've visited." },
          ],
          aceptadas: ["Yes, I have.", "No.", "Cartagena."],
          segundos: 15,
          porRevisar: [
            'preguntas.modelo: el documento dice "Una frase a cada una" pero trae seis; "Yes, I have. I\'ve been to Santa Marta." se dejó junta para la primera',
          ],
        },
      ],
    },
    {
      numero: 4,
      titulo: "Las experiencias de Allison",
      objetivo: "Hacer preguntas con Have you ever…?",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "I\'ve been to Colombia! I\'ve tried a lot of Colombian food." (no está escrito). Elige entre tres platos: unas arepas, una hamburguesa y una pizza.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["I've been to Colombia!", "I've tried a lot of Colombian food."],
          traduccion: ["¡He estado en Colombia!", "He probado mucha comida colombiana."],
          pregunta: "¿Qué plato ha probado Allison?",
          opciones: [
            { imagen: "f-arepas", descripcion: "Unas arepas", etiqueta: "Arepas" },
            { imagen: "a1/f-hamburguesa", descripcion: "Una hamburguesa", etiqueta: "Hamburguesa" },
            { imagen: "a1/f-pizza", descripcion: "Una pizza", etiqueta: "Pizza" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca las arepas"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de una calle de Nueva York con nieve en diciembre. Allison: "In New York, I\'ve seen a lot of…"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "It\'s white and cold." → "It starts with s." Sin pistas, Allison dice "snow" y el alumno la repite.',
          imagen: "a1/f-navidad-nieve",
          pregunta: "In New York, I've seen a lot of…",
          contexto: "¿Qué ha visto mucho Allison en Nueva York? Completa la frase.",
          respuesta: "snow",
          aceptadas: ["A lot of snow.", "You've seen snow."],
          pistas: ["It's white and cold.", "It starts with s."],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha de las experiencias de Allison con cinco datos por descubrir: si ha estado en Colombia, si ha estado en Cartagena, si ha probado el mute santandereano, si ha visto nieve y si ha montado a caballo. Arma cada pregunta; las palabras de ayuda aparecen después del primer fallo. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿Si he montado a caballo? Say: Have you ever ridden a horse? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "las experiencias de Allison",
          datos: [
            {
              dato: "Si ha estado en Colombia",
              pregunta: "Have you ever been to Colombia?",
              respuesta: "Yes! I've been to Bogotá and Boyacá.",
            },
            {
              dato: "Si ha estado en Cartagena",
              pregunta: "Have you ever been to Cartagena?",
              respuesta: "No, I've never been to Cartagena. I really want to go!",
            },
            {
              dato: "Si ha probado el mute santandereano",
              pregunta: "Have you ever tried mute santandereano?",
              respuesta: "Yes, many times! It's my favorite.",
            },
            {
              dato: "Si ha visto nieve",
              pregunta: "Have you ever seen snow?",
              respuesta: "Yes, a lot! It snows in New York in winter.",
            },
            {
              dato: "Si ha montado a caballo",
              pregunta: "Have you ever ridden a horse?",
              respuesta: "No, never! I'm a little scared of horses.",
            },
          ],
          aceptadas: ["You been to Colombia?", "Did you ever try mute?", "Snow?"],
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "You been to Colombia?", "Did you ever try mute?", "Snow?"',
          ayuda: "¿Qué quieres saber? ¿Si he montado a caballo? Say: Have you ever ridden a horse?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Tu primera noche en un hostal de Edimburgo",
    imagen: "e-edimburgo-hostal",
    contexto:
      "Es tu primera noche en un hostal de Edimburgo. En la sala común conoces a Chloe (Allison en su papel), una viajera de Canadá que recorre Europa.",
    personaje: "Chloe, una viajera de Canadá que recorre Europa",
    objetivo: "Contar lo que ha vivido y lo que nunca ha hecho, y preguntarle a Chloe por sus viajes",
    tareas: [
      "Saluda y preséntate.",
      "Cuenta un lugar donde has estado.",
      "Pregúntale a Chloe si alguna vez ha estado en Colombia.",
      "Cuenta algo que nunca has hecho.",
      "Despídete y deséale buen viaje.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hi! Is this your first night here?" },
      { quien: "alumno", dice: "Yes, it is. Hi! I'm Diego. I'm from Colombia.", tarea: 1 },
      { quien: "personaje", dice: "Nice to meet you, Diego! I'm Chloe, from Canada. Have you been to Scotland before?" },
      { quien: "alumno", dice: "No, I haven't. This is my first time." },
      { quien: "personaje", dice: "Wow! Have you traveled a lot?" },
      { quien: "alumno", dice: "Not a lot. But I've been to Mexico and Peru.", tarea: 2 },
      { quien: "personaje", dice: "Cool! Have you ever seen Machu Picchu?" },
      { quien: "alumno", dice: "Yes, I have! It was amazing." },
      { quien: "personaje", dice: "I've never been to South America." },
      { quien: "alumno", dice: "Have you ever been to Colombia?", tarea: 3 },
      { quien: "personaje", dice: "No, never! What's it like?" },
      { quien: "alumno", dice: "It's beautiful. You can visit Cartagena and the Coffee Region." },
      { quien: "personaje", dice: "That sounds great! I've been to twelve countries this year." },
      { quien: "alumno", dice: "Twelve! That's a lot. Have you ever traveled alone before?" },
      { quien: "personaje", dice: "No, this is my first time. Have you ever eaten haggis? It's from Scotland." },
      { quien: "alumno", dice: "No, I've never eaten haggis. Is it good?", tarea: 4 },
      { quien: "personaje", dice: "Some people love it! I tried it yesterday." },
      { quien: "alumno", dice: "Maybe I can try it tomorrow!" },
      { quien: "personaje", dice: "OK! It's late. Good night, Diego!" },
      { quien: "alumno", dice: "Good night, Chloe! Have a good trip!", tarea: 5 },
    ],
    resumen: "¡Lo lograste! Hablaste en inglés de lo que has vivido y de lo que nunca has hecho.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Edimburgo en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like this hostel" → Me too! Have you been to other countries?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "I\'ve been to ___"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"Nunca he comido haggis" → En inglés: I\'ve never eaten haggis. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"I have be in Mexico" → la escena sigue; en el resumen: Para lugares: I\'ve been to Mexico.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "It's late! Good night! Vamos a repasar el presente perfecto y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    // El documento da cuatro comienzos para cinco tareas; el de "Saluda y
    // preséntate" sale de la línea del alumno en el diálogo de ejemplo
    // ("Hi! I'm Diego"), por revisar.
    ayudas: ["Hi! I'm ___", "I've been to ___", "Have you ever ___?", "I've never ___", "Have a ___"],
  },
  ilustraciones: [
    { archivos: ["edimburgo"], muestra: "Portada de la ciudad: el castillo sobre la colina y una calle de piedra", uso: "Portada de la parada" },
    {
      archivos: ["e-edimburgo-hostal"],
      muestra: "La sala común de un hostal con mochilas y sofás; por la ventana se ve el castillo",
      uso: "Escenario",
    },
    {
      archivos: ["f-priya-paris", "f-priya-sagrada", "f-priya-coliseo"],
      muestra: "Priya frente a la torre Eiffel, frente a la Sagrada Familia y frente al Coliseo",
      uso: "Lección 1 (paso 1)",
    },
    { archivos: ["f-ben-caballo"], muestra: 'Una foto de Ben montando a caballo, con el letrero "Ben, last summer"', uso: "Lección 1 (paso 2)" },
    { archivos: ["f-tren", "f-avion", "f-barco"], muestra: "Un tren, un avión y un barco", uso: "Lección 2 (paso 1)" },
    { archivos: ["f-sushi-tacos"], muestra: "Un plato de sushi tachado y unos tacos", uso: "Lección 2 (paso 2)" },
    { archivos: ["f-montanas-nieve", "f-desierto"], muestra: "Unas montañas con nieve; un desierto", uso: "Lección 3 (paso 1)" },
    {
      archivos: ["a1/f-playa-la"],
      muestra: "La playa con una muchacha que surfea, un muchacho que nada y un señor con guitarra (de A1)",
      uso: "Lección 3 (paso 1), como la playa",
    },
    {
      archivos: ["f-fotos-priya"],
      muestra: "Tres fotos del viaje de Priya: en una playa, montando en camello y en un barco",
      uso: "Lección 3 (paso 2)",
    },
    { archivos: ["f-arepas"], muestra: "Unas arepas (de la parada 2)", uso: "Lección 4 (paso 1)" },
    { archivos: ["a1/f-hamburguesa", "a1/f-pizza"], muestra: "Una hamburguesa; una pizza (de A1)", uso: "Lección 4 (paso 1)" },
    {
      archivos: ["a1/f-navidad-nieve"],
      muestra: "Un árbol de Navidad en una calle de Nueva York con nieve (de A1)",
      uso: "Lección 4 (paso 2)",
    },
  ],
};
