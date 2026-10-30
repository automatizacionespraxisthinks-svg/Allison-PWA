import type { Repaso } from "../tipos.ts";

/**
 * Repaso final · Londres (A2). Documento "Contenido A2", aprobado el 17 de
 * octubre de 2026. No tiene ilustraciones nuevas: usa las de las paradas de
 * A2 (public/ilustraciones/a2) y las de A1 que se reutilizan llevan "a1/".
 */
export const REPASO_FINAL: Repaso = {
  nombre: "Repaso final",
  despuesDeParada: 10,
  ciudad: "Londres",
  titulo: "Tu viaje por el Reino Unido",
  objetivo:
    "Al terminar, el alumno se desenvuelve con poca ayuda en un día de viaje con un cambio de planes: recibe a alguien, cuenta su viaje, propone planes, los cambia cuando llueve, compra y se despide, usando todo A2. No agrega gramática nueva.",
  comoEsDistinto:
    'Las lecciones mezclan las paradas 6 a 10 y luego todo A2; no hay palabras nuevas ni ilustraciones nuevas. El escenario es más largo: cuatro momentos seguidos con Allison, que es ella misma y llega a Londres a pasar contigo el último día (en A1 se despidió con "See you in the UK!"). En la mitad llueve y el plan cambia. La ayuda aparece solo desde el segundo fallo en una tarea. Al final gana el sello "A2 completo" y se abre B1, siempre que tenga completas todas las actividades de A2, también las de las paradas que saltó. Este repaso lo revisa además un profesor nativo de Estados Unidos.',
  portada: "londres",
  lecciones: [
    {
      numero: 1,
      titulo: "Planes e invitaciones (paradas 6 y 7)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Ben asks: "Would you like to come to the movies on Friday?" Priya says: "Sorry, I can\'t. I\'m flying to Paris on Friday." (no está escrito). Pregunta: ¿qué hace Priya el viernes? Elige entre Priya en el aeropuerto (f-priya-aeropuerto), un cine (f-cine) y Priya en la biblioteca (f-priya-biblioteca).',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Ben asks: "Would you like to come to the movies on Friday?"', 'Priya says: "Sorry, I can\'t. I\'m flying to Paris on Friday."'],
          traduccion: ['Ben pregunta: "¿Te gustaría venir a cine el viernes?"', 'Priya dice: "Lo siento, no puedo. El viernes viajo a París en avión."'],
          pregunta: "¿Qué hace Priya el viernes?",
          opciones: [
            { imagen: "f-priya-aeropuerto", descripcion: "Priya en el aeropuerto", etiqueta: "Fly to Paris", etiquetaEs: "Volar a París" },
            { imagen: "f-priya-museo", descripcion: "Priya en un museo", etiqueta: "Go to the museum", etiquetaEs: "Ir al museo" },
            { imagen: "f-priya-biblioteca", descripcion: "Priya en la biblioteca", etiqueta: "Study at the library", etiquetaEs: "Estudiar en la biblioteca" },
          ],
          correcta: 0,
          porRevisar: ["opciones: el cine salía entre las opciones y es justo la invitación que Priya rechaza; ahora es el museo. Etiquetas como acciones, la correcta como suena (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "¿Qué tal el domingo? Tomo el tren de las diez." Las palabras de apoyo aparecen después del primer fallo: how about, Sunday, I\'m, taking, the, ten o\'clock, train.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "I take the train at ten": Para lo que ya está arreglado: I\'m taking the train. Si dice "How about on Sunday?", se acepta. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "¿Qué tal el domingo? Tomo el tren de las diez.",
          respuesta: "How about Sunday? I'm taking the ten o'clock train.",
          // Las dos primeras, de "También se acepta"; la tercera, de "Si responde
          // mal": "Si dice 'How about on Sunday?', se acepta".
          aceptadas: [
            "What about Sunday? I'm taking the train at ten.",
            "How about Sunday? My train leaves at ten.",
            "How about on Sunday? I'm taking the ten o'clock train.",
          ],
          // El documento agrupa "how about" y "ten o'clock"; aquí van palabra por
          // palabra, como en Londres, para que sean las de la respuesta.
          palabras: ["How", "about", "Sunday?", "I'm", "taking", "the", "ten", "o'clock", "train."],
          explicaciones: [{ siDice: "I take the train at ten", explicacion: "Para lo que ya está arreglado: I'm taking the train." }],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: What are you doing this weekend? Would you like to go to the beach with me? How about pizza tonight? Where are you going on your next vacation? Let's study English together tomorrow!",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "What are you doing this weekend?", modelo: "I'm visiting my grandparents." },
            { pregunta: "Would you like to go to the beach with me?", modelo: "I'd love to!" },
            { pregunta: "How about pizza tonight?", modelo: "Sorry, I can't. I'm having dinner with my family." },
            { pregunta: "Where are you going on your next vacation?", modelo: "I'm going to Santa Marta." },
            { pregunta: "Let's study English together tomorrow!", modelo: "Good idea! Let's meet at four." },
          ],
          aceptadas: ["Yes!", "Sorry, I can't.", "Santa Marta."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 2,
      titulo: "Cómo te sientes y de compras (paradas 8 y 9)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Ben\'s throat hurts. He can\'t talk a lot today." (no está escrito). Elige entre Ben con dolor de estómago, con dolor de cabeza y con dolor de garganta (f-ben-estomago, f-ben-cabeza, f-ben-garganta).',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Ben's throat hurts.", "He can't talk a lot today."],
          traduccion: ["A Ben le duele la garganta.", "Hoy no puede hablar mucho."],
          pregunta: "¿Qué le duele a Ben?",
          opciones: [
            { imagen: "f-ben-estomago", descripcion: "Ben con dolor de estómago", etiqueta: "A stomachache", etiquetaEs: "Dolor de estómago" },
            { imagen: "f-ben-cabeza", descripcion: "Ben con dolor de cabeza", etiqueta: "A headache", etiquetaEs: "Dolor de cabeza" },
            { imagen: "f-ben-garganta", descripcion: "Ben con dolor de garganta", etiqueta: "A sore throat", etiquetaEs: "Dolor de garganta" },
          ],
          correcta: 2,
          porRevisar: ["etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Ben con dolor de garganta"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'La chaqueta negra con la etiqueta de £30 (f-ropa-chaqueta). Allison: "You like this jacket, but you need a large. Ask the clerk!"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "You need a different size." → "Start with: Do you have…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "Do you have in large?": Falta it: do you have it in a large?',
          imagen: "f-ropa-chaqueta",
          pregunta: "You like this jacket, but you need a large. Ask the clerk!",
          contexto: "Te gusta esta chaqueta, pero necesitas talla grande. Pregúntale al vendedor en inglés.",
          respuesta: "Do you have it in a large?",
          aceptadas: ["Do you have this jacket in a large?", "Do you have a large?"],
          pistas: ["You need a different size.", "Start with: Do you have…"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about a time you were sick." Preguntas guía: When were you sick? What did you have? What did people tell you to do?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I was a fever" → La fiebre se tiene: I had a fever. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about a time you were sick.",
          guias: ["When were you sick?", "What did you have?", "What did people tell you to do?"],
          modelo:
            "Last year I had a bad cold. I had a fever and a sore throat, so I stayed home for three days. My mom said: You should drink a lot of water. I watched a lot of movies!",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Compara y repasa todo (parada 10 y todo A2)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya says: "The museum is closer than the movie theater, and it\'s free! Let\'s go to the museum." (no está escrito). Elige entre un museo (f-plan-museo), un cine (f-cine) y un picnic (f-parque-picnic).',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya says: "The museum is closer than the movie theater, and it\'s free! Let\'s go to the museum."'],
          traduccion: ['Priya dice: "El museo está más cerca que el cine, ¡y es gratis! Vamos al museo."'],
          pregunta: "¿Adónde quiere ir Priya?",
          opciones: [
            { imagen: "f-plan-museo", descripcion: "Un museo", etiqueta: "To the museum", etiquetaEs: "Al museo" },
            { imagen: "f-cine", descripcion: "Un cine", etiqueta: "To the movies", etiquetaEs: "A cine" },
            { imagen: "f-parque-picnic", descripcion: "Un picnic", etiqueta: "To a picnic", etiquetaEs: "A un picnic" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca el museo"'],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'El andén cuando llegó el tren (f-anden-tren). Allison: "This was the station yesterday when the train arrived. Tell me 3 things people were doing." Sin palabras de ayuda.',
          siRespondeMal:
            'Si dice "A woman reading", Allison repite bien la frase (A woman was reading.) y el alumno la dice. Si nombra menos de 3, Allison señala a los niños y pregunta "What were they doing?".',
          imagen: "f-anden-tren",
          pregunta: "This was the station yesterday when the train arrived. Tell me 3 things people were doing.",
          plantillas: [],
          palabrasAyuda: [],
          modelo: ["A woman was reading.", "A man was eating a sandwich.", "Two kids were playing."],
          aceptadas: [],
          tambienSeAcepta: "Cualquier frase correcta en pasado continuo sobre la imagen",
          cosas: ["woman", "man", "kid", "child", "children", "book", "sandwich", "train", "reading", "eating", "playing"],
          minimo: 3,
          porRevisar: [
            "cosas: el documento no las nombra; salen de las frases modelo y de la imagen f-anden-tren (tabla de ilustraciones de la parada 3: una mujer lee, un hombre come un sándwich y dos niños juegan)",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos, de partes distintas del viaje: What do you usually do on Sundays? What were you doing at seven this morning? Have you ever been to the sea? Which is better, pizza or hamburgers? What are you going to do after this lesson?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "What do you usually do on Sundays?", modelo: "I usually visit my grandparents." },
            { pregunta: "What were you doing at seven this morning?", modelo: "I was having breakfast." },
            { pregunta: "Have you ever been to the sea?", modelo: "Yes, I have. I've been to Cartagena." },
            { pregunta: "Which is better, pizza or hamburgers?", modelo: "Pizza is better!" },
            { pregunta: "What are you going to do after this lesson?", modelo: "I'm going to do my homework." },
          ],
          aceptadas: ["Breakfast.", "Yes, I have.", "Pizza."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "¿Cuánto sabes de Allison?",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "I\'ve never been to London. Next month I\'m visiting it for the first time!" (no está escrito). Elige entre las portadas de Londres, Edimburgo y Cardiff.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["I've never been to London.", "Next month I'm visiting it for the first time!"],
          traduccion: ["Nunca he estado en Londres.", "¡El mes que viene la visito por primera vez!"],
          pregunta: "¿Qué ciudad va a visitar Allison el mes que viene?",
          // Las portadas de las paradas 1, 4 y 10 de A2.
          opciones: [
            { imagen: "londres", descripcion: "Londres", etiqueta: "London", etiquetaEs: "Londres" },
            { imagen: "edimburgo", descripcion: "Edimburgo", etiqueta: "Edinburgh", etiquetaEs: "Edimburgo" },
            { imagen: "cardiff", descripcion: "Cardiff", etiqueta: "Cardiff", etiquetaEs: "Cardiff" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca Londres"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'La foto de Ben montando a caballo (f-ben-caballo). Allison: "Ben has ridden a horse. Have I ever ridden a horse?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Remember Edinburgh." → "Start with: No, you…" Sin pistas, Allison dice "No, I haven\'t. I\'m a little scared of horses!" y el alumno responde "No, you haven\'t."',
          imagen: "f-ben-caballo",
          pregunta: "Ben has ridden a horse. Have I ever ridden a horse?",
          contexto: "Allison te pregunta si ella ha montado a caballo alguna vez. En la foto solo está Ben. Respóndele con una respuesta corta en inglés.",
          respuesta: "No, you haven't.",
          aceptadas: ["No, never.", "No, you haven't. You're scared of horses!"],
          pistas: ["Remember Edinburgh.", "Start with: No, you…"],
          porRevisar: [
            'aceptadas: el documento las escribe seguidas ("No, never. No, you haven\'t. You\'re scared of horses!"); se separaron en dos formas, "No, never." y "No, you haven\'t. You\'re scared of horses!"',
          ],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            "Ficha final con cinco datos tapados, uno de cada parte del viaje: qué hizo el sábado pasado, si ha estado en Cartagena, qué hace el sábado, qué hace cuando está estresada y si su apartamento es más grande que el de Emily. Sin palabras de ayuda. Mínimo 10 intervenciones.",
          siRespondeMal: "Allison: ¿Qué quieres saber? y entonces muestra las palabras de ayuda solo para esa pregunta.",
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "Last Saturday?", "Cartagena?", "Your apartment is bigger?"',
          ficha: "Allison (ficha final)",
          // "Respuestas de Allison (salen de su ficha y de lo aprobado en las
          // paradas 2, 4, 6, 8 y 10; el repaso no agrega datos suyos)".
          datos: [
            {
              dato: "Qué hizo el sábado pasado",
              pregunta: "What did you do last Saturday?",
              respuesta: "I visited my sister Emily. We made arepas!",
            },
            { dato: "Si ha estado en Cartagena", pregunta: "Have you ever been to Cartagena?", respuesta: "No, never! I really want to go." },
            { dato: "Qué hace el sábado", pregunta: "What are you doing on Saturday?", respuesta: "I'm visiting Emily, like every Saturday." },
            { dato: "Qué hace cuando está estresada", pregunta: "What do you do when you're stressed?", respuesta: "I dance! Music always helps." },
            {
              dato: "Si su apartamento es más grande que el de Emily",
              pregunta: "Is your apartment bigger than Emily's?",
              respuesta: "No! Emily's apartment is bigger. Mine is small, but it's across from a park.",
            },
          ],
          aceptadas: ["Last Saturday?", "Cartagena?", "Your apartment is bigger?"],
          ayuda: "¿Qué quieres saber?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Un día en Londres con Allison",
    imagen: "londres",
    contexto:
      "Es el último día de tu viaje. Allison llega a Londres a pasarlo contigo: es ella misma y es su primera vez en la ciudad. Tú eres el guía.",
    personaje:
      "Allison, ella misma, que llega a Londres por primera vez a pasar contigo el último día del viaje; en la tienda del museo hace de cajera",
    objetivo: "Desenvolverse con poca ayuda en un día de viaje con un cambio de planes, usando todo A2",
    tareas: [
      "Saluda a Allison y pregúntale cómo fue el viaje.",
      "Dale un consejo.",
      "Cuéntale dónde has estado.",
      "Cuéntale qué estabas haciendo cuando pasó algo.",
      "Propón el plan de la tarde.",
      "Propón otro plan y compara las opciones.",
      "Ofrécete a hacer algo.",
      "Pregunta precios y pide lo que quieres.",
      "Cuéntale tus planes y despídete.",
    ],
    // "Diálogo de ejemplo (15 intervenciones del alumno)". Las tareas 6, 8 y 9
    // se cumplen con dos líneas: las dos llevan el número.
    dialogo: [
      { momento: "Estación", quien: "personaje", dice: "Hi! I'm here! London is so big!" },
      { momento: "Estación", quien: "alumno", dice: "Hi, Allison! Welcome to London! How was your flight?", tarea: 1 },
      { momento: "Estación", quien: "personaje", dice: "It was long! I didn't sleep on the plane. I'm so tired." },
      { momento: "Estación", quien: "alumno", dice: "You should drink some coffee. There's a café near here.", tarea: 2 },
      { momento: "Café", quien: "personaje", dice: "Good idea! I love coffee. So, tell me about your trip! Where have you been?" },
      {
        momento: "Café",
        quien: "alumno",
        dice: "I've been to ten cities! I visited Manchester, Liverpool, Edinburgh and Cardiff.",
        tarea: 3,
      },
      { momento: "Café", quien: "personaje", dice: "Wow! Which city was the best?" },
      { momento: "Café", quien: "alumno", dice: "Edinburgh was the most beautiful, but Cardiff was cheaper." },
      { momento: "Café", quien: "personaje", dice: "Did anything funny happen?" },
      { momento: "Café", quien: "alumno", dice: "Yes! In Liverpool I was waiting for the train when I lost my bag!", tarea: 4 },
      { momento: "Café", quien: "personaje", dice: "Oh no! Did you find it?" },
      { momento: "Café", quien: "alumno", dice: "Yes, I did. And you? Have you ever been to London?" },
      { momento: "Café", quien: "personaje", dice: "No, never! This is my first time. What are we doing this afternoon?" },
      {
        momento: "Café",
        quien: "alumno",
        dice: "We're taking a boat on the river at three. Would you like to see Big Ben first?",
        tarea: 5,
      },
      { momento: "Calle", quien: "personaje", dice: "I'd love to! … Oh no, it's raining a lot. Look, the boat tour is canceled!" },
      { momento: "Calle", quien: "alumno", dice: "How about going to a museum?", tarea: 6 },
      { momento: "Calle", quien: "personaje", dice: "Or a movie. Which one is better?" },
      { momento: "Calle", quien: "alumno", dice: "The museum is better. It's closer than the movie theater, and it's free!", tarea: 6 },
      { momento: "Calle", quien: "personaje", dice: "Perfect! But how do we get there?" },
      { momento: "Calle", quien: "alumno", dice: "Don't worry. I'll look at the subway map.", tarea: 7 },
      // En la tienda del museo, Allison hace de cajera.
      { momento: "Tienda del museo", quien: "personaje", dice: "Hi! Can I help you?" },
      { momento: "Tienda del museo", quien: "alumno", dice: "Hi! How much are these postcards?", tarea: 8 },
      { momento: "Tienda del museo", quien: "personaje", dice: "They're two pounds each. How many would you like?" },
      { momento: "Tienda del museo", quien: "alumno", dice: "I'd like five, please. Do you have any umbrellas?", tarea: 8 },
      { momento: "Tienda del museo", quien: "personaje", dice: "Yes, we have some. They're twelve pounds." },
      { momento: "Tienda del museo", quien: "alumno", dice: "Great! I'll take one. It's raining a lot!" },
      { momento: "Tienda del museo", quien: "personaje", dice: "This was a great day! What are you going to do tomorrow?" },
      { momento: "Tienda del museo", quien: "alumno", dice: "Tomorrow I'm flying home to Colombia. I'm going to miss the UK!", tarea: 9 },
      { momento: "Tienda del museo", quien: "personaje", dice: "Have a good flight! See you in B1!" },
      { momento: "Tienda del museo", quien: "alumno", dice: "Thank you for everything, Allison! Bye!", tarea: 9 },
    ],
    // "La app cambia el fondo en cada momento con imágenes que ya existen: el
    // andén (f-anden-tren), el café (c-cafeteria), la calle con lluvia
    // (f-parada-lluvia) y el museo (f-plan-museo)". La fila "Momentos y tareas"
    // llama al tercero "Calle (llueve)"; el diálogo, "Calle".
    momentos: [
      { nombre: "Estación", tareas: [1, 2], imagen: "f-anden-tren", repasar: "paradas 2 y 8" },
      { nombre: "Café", tareas: [3, 4, 5], imagen: "a1/c-cafeteria", repasar: "paradas 3, 4 y 7" },
      { nombre: "Calle", tareas: [6, 7], imagen: "f-parada-lluvia", repasar: "paradas 5 y 10" },
      { nombre: "Tienda del museo", tareas: [8, 9], imagen: "f-plan-museo", repasar: "parada 9" },
    ],
    resumen: "¡Terminaste A2! Viajaste por el Reino Unido en inglés y resolviste un cambio de planes.",
    recompensa:
      'El resumen muestra lo que el alumno ya sabe decir (una frase por parada) y en qué parada tuvo más errores. Gana el sello "A2 completo" en el pasaporte y se abre B1.',
    siSeAtasca: [],
    siSeAtascaTexto:
      "Igual que en las paradas, con el cierre amable a las 24 intervenciones. Si se atasca en un momento, Allison propone repasar la parada de ese momento (estación, paradas 2 y 8; café, paradas 3, 4 y 7; calle, paradas 5 y 10; tienda del museo, parada 9) y luego seguir donde iba, sin empezar de cero.",
    // Duración: "Mínimo 12 intervenciones en total (unas 3 por momento); al
    // cumplirlas, la app avisa que la meta se cumplió. Como son cuatro momentos,
    // lo normal es que el alumno llegue a 15 o 20".
    minimoIntervenciones: 12,
    // "Qué pasa si se atasca": "con el cierre amable a las 24 intervenciones".
    maximoIntervenciones: 24,
    // Ayuda: "El comienzo de la frase de la tarea actual, solo desde el segundo
    // fallo en esa tarea. Apaga una estrella". El documento no escribe los
    // comienzos: cada uno sale de las primeras palabras de la línea del alumno
    // que cumple la tarea en el diálogo de ejemplo (de la primera, si son dos),
    // + " ___" (por revisar).
    ayudaDesdeSegundoFallo: true,
    ayudas: [
      "Hi, Allison! Welcome to London! How was your ___?",
      "You should ___",
      "I've been to ___",
      "Yes! In Liverpool I was ___",
      "We're taking ___",
      "How about ___?",
      "Don't worry. I'll ___",
      "How much are ___?",
      "Tomorrow I'm ___",
    ],
  },
  notas: [
    'Nota de nivel: no hay gramática nueva. "Canceled" se escribe con una l, como en Estados Unidos, y solo hay que entenderlo. "Subway map" y "movie theater", nunca "tube map" ni "cinema". "It\'s free" es cierto: los grandes museos de Londres no cobran la entrada.',
    "Dato nuevo (aprobado el 17 de octubre de 2026). Allison (solo en esta actividad): nunca había estado en Londres: llega en avión para pasar el último día del viaje con el alumno. No pasa a su ficha.",
    "Dato nuevo (aprobado el 17 de octubre de 2026). El alumno: al día siguiente vuelve en avión a Colombia.",
  ],
};
