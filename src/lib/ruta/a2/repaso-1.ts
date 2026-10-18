import type { Repaso } from "../tipos.ts";

/**
 * Repaso 1 · Londres (A2). Documento "Contenido A2", aprobado el 17 de
 * octubre de 2026. No tiene ilustraciones nuevas: usa las de las paradas
 * 1 a 5 de A2 (tal cual) y las de A1 (con "a1/" delante).
 */
export const REPASO_1: Repaso = {
  nombre: "Repaso 1",
  despuesDeParada: 5,
  ciudad: "Londres",
  titulo: "Una semana en Londres",
  objetivo:
    "Al terminar, el alumno cuenta en una sola conversación qué hace estos días, qué hizo, qué estaba pasando, qué ha vivido y qué va a hacer. Repasa todo lo de las paradas 1 a 5 y no agrega gramática nueva.",
  comoEsDistinto:
    'Las lecciones 1 y 2 mezclan dos paradas cada una, la 3 repasa la parada 5 y la 4 junta todo con Allison. No hay palabras nuevas ni ilustraciones nuevas: usa las de A1 y las de las paradas 1 a 5. La Entrevista va sin palabras de ayuda. Al final el alumno recibe la estampilla "Repaso 1" y se abre la parada 6.',
  portada: "londres",
  lecciones: [
    {
      numero: 1,
      titulo: "Lo de siempre y lo que pasó (paradas 1 y 2)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Priya usually studies in the library after school. But last Saturday she stayed home and watched TV." (no está escrito). Pregunta: ¿qué hizo Priya el sábado pasado? Elige entre Priya en la biblioteca (f-priya-biblioteca), Priya en el sofá frente a la TV (f-priya-sofa-pasta) y Priya en un estadio (f-priya-estadio).',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Priya usually studies in the library after school.", "But last Saturday she stayed home and watched TV."],
          traduccion: ["Priya normalmente estudia en la biblioteca después del colegio.", "Pero el sábado pasado se quedó en casa y vio televisión."],
          pregunta: "¿Qué hizo Priya el sábado pasado?",
          opciones: [
            { imagen: "f-priya-biblioteca", descripcion: "Priya en la biblioteca" },
            { imagen: "f-priya-sofa-pasta", descripcion: "Priya en el sofá frente a la TV" },
            { imagen: "f-priya-estadio", descripcion: "Priya en un estadio" },
          ],
          correcta: 1,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Este mes estoy aprendiendo a cocinar. Ayer hice arroz." Las palabras de apoyo aparecen después del primer fallo: this, month, I\'m, learning, to, cook, yesterday, I, made, rice.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "I learn to cook": Para lo de estos días: I\'m learning. Si dice "Yesterday I make rice": Para ayer va el pasado: I made. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Este mes estoy aprendiendo a cocinar. Ayer hice arroz.",
          respuesta: "This month I'm learning to cook. Yesterday I made rice.",
          aceptadas: ["This month I am learning to cook. Yesterday I cooked rice."],
          palabras: ["This", "month", "I'm", "learning", "to", "cook.", "Yesterday", "I", "made", "rice."],
          explicaciones: [
            { siDice: "I learn to cook", explicacion: "Para lo de estos días: I'm learning." },
            { siDice: "Yesterday I make rice", explicacion: "Para ayer va el pasado: I made." },
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: What do you usually do after school? What are you learning these days? What did you do last weekend? What did you eat yesterday? Where did you go on your last vacation?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "What do you usually do after school?", modelo: "I usually do my homework." },
            { pregunta: "What are you learning these days?", modelo: "I'm learning to play the guitar." },
            { pregunta: "What did you do last weekend?", modelo: "I visited my grandma." },
            { pregunta: "What did you eat yesterday?", modelo: "I ate rice and chicken." },
            { pregunta: "Where did you go on your last vacation?", modelo: "I went to Santa Marta." },
          ],
          aceptadas: ["Homework.", "Guitar.", "Santa Marta."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 2,
      titulo: "Lo que estaba pasando y lo que has vivido (paradas 3 y 4)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Last night at nine, Priya was cooking dinner when her mom called." (no está escrito). Elige entre Priya leyendo (f-priya-leyendo-hermano), Priya cocinando (f-priya-cocinando) y Priya dormida (f-priya-dormida).',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Last night at nine, Priya was cooking dinner when her mom called."],
          traduccion: ["Anoche a las nueve, Priya estaba cocinando la cena cuando su mamá llamó."],
          pregunta: "¿Qué estaba haciendo Priya cuando su mamá llamó?",
          opciones: [
            { imagen: "f-priya-leyendo-hermano", descripcion: "Priya leyendo" },
            { imagen: "f-priya-cocinando", descripcion: "Priya cocinando" },
            { imagen: "f-priya-dormida", descripcion: "Priya dormida" },
          ],
          correcta: 1,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Priya cocinando"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Foto de Priya frente a la torre Eiffel (f-priya-paris). Allison: "Where has Priya been?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Look at the tower." → "Start with: She\'s been to…" Sin pistas, Allison dice "She\'s been to Paris" y el alumno la repite. Si dice "She has been in Paris": Para lugares: she\'s been to Paris.',
          imagen: "f-priya-paris",
          pregunta: "Where has Priya been?",
          respuesta: "She's been to Paris.",
          aceptadas: ["She has been to Paris.", "She's been to France."],
          pistas: ["Look at the tower.", "Start with: She's been to…"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about a day when something went wrong." Preguntas guía: Where were you? What were you doing when it happened? What did you do?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I was walk to school" → Para lo que estaba pasando: I was walking. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about a day when something went wrong.",
          guias: ["Where were you?", "What were you doing when it happened?", "What did you do?"],
          modelo:
            "Last month I was walking to school when it started to rain. I didn't have an umbrella! I ran to a store and waited there. I was late for school, but my teacher wasn't angry.",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Tus planes (parada 5)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Next Saturday Ben is going to play soccer with his friends. After the game, they\'re going to eat pizza." (no está escrito). Elige entre Ben y su abuela horneando una torta (f-plan-torta), niños jugando fútbol en un parque (f-parque-futbol) y un cine (f-cine).',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Next Saturday Ben is going to play soccer with his friends.", "After the game, they're going to eat pizza."],
          traduccion: ["El próximo sábado Ben va a jugar fútbol con sus amigos.", "Después del partido, van a comer pizza."],
          pregunta: "¿Qué va a hacer Ben el próximo sábado?",
          opciones: [
            { imagen: "f-plan-torta", descripcion: "Ben y su abuela horneando una torta" },
            { imagen: "f-parque-futbol", descripcion: "Niños jugando fútbol en un parque" },
            { imagen: "f-cine", descripcion: "Un cine" },
          ],
          correcta: 1,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a los niños jugando fútbol"'],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Mañana voy a visitar a mi abuela. Te llamo después." Las palabras de apoyo aparecen después del primer fallo: tomorrow, I\'m, going to, visit, my, grandma, I\'ll, call, you, later.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "I go to visit": Para planes: I\'m going to visit. Si dice "I call you later": Para ofrecer en el momento: I\'ll call you later. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Mañana voy a visitar a mi abuela. Te llamo después.",
          respuesta: "Tomorrow I'm going to visit my grandma. I'll call you later.",
          aceptadas: [
            "I'm going to visit my grandma tomorrow. I'll call you later.",
            "Tomorrow I'm going to visit my grandmother. I will call you later.",
          ],
          palabras: ["Tomorrow", "I'm", "going", "to", "visit", "my", "grandma.", "I'll", "call", "you", "later."],
          explicaciones: [
            { siDice: "I go to visit", explicacion: "Para planes: I'm going to visit." },
            { siDice: "I call you later", explicacion: "Para ofrecer en el momento: I'll call you later." },
          ],
          porRevisar: ['palabras: el documento trae "going to" como una sola palabra de apoyo; aquí van separadas, como las demás'],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "We\'re going to visit the museum on Wednesday." Se practica la palabra Wednesday.',
          siRespondeMal:
            'Si pronuncia todas las letras: Escucha: Wednesday. Suena "uénsdei": la primera d no suena. Say it: Wednesday. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "We're going to visit the museum on Wednesday.",
          palabraDificil: "Wednesday",
          consejo: 'Suena "uénsdei": la primera d no suena.',
        },
      ],
    },
    {
      numero: 4,
      titulo: "Todo junto con Allison",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Last Sunday it was sunny, so I walked in the park." (no está escrito). Elige entre una mujer caminando en un parque (f-mujer-parque), dos mujeres tomando café (f-amigas-cafe) y dos mujeres viendo una película (f-hermanas-pelicula).',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Last Sunday it was sunny, so I walked in the park."],
          traduccion: ["El domingo pasado hizo sol, así que caminé en el parque."],
          pregunta: "¿Qué hizo Allison el domingo pasado?",
          opciones: [
            { imagen: "a1/f-mujer-parque", descripcion: "Una mujer caminando en un parque" },
            { imagen: "a1/f-amigas-cafe", descripcion: "Dos mujeres tomando café" },
            { imagen: "f-hermanas-pelicula", descripcion: "Dos mujeres viendo una película" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca a la mujer en el parque"'],
        },
        {
          paso: 2,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos, una de cada parada: What are you doing right now? What did you do yesterday afternoon? What were you doing at eight last night? Have you ever been to the beach? What are you going to do tomorrow?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "What are you doing right now?", modelo: "I'm practicing English." },
            { pregunta: "What did you do yesterday afternoon?", modelo: "I played soccer with my friends." },
            { pregunta: "What were you doing at eight last night?", modelo: "I was watching TV." },
            { pregunta: "Have you ever been to the beach?", modelo: "Yes, I have. I've been to Santa Marta." },
            { pregunta: "What are you going to do tomorrow?", modelo: "I'm going to study for a test." },
          ],
          aceptadas: ["Studying.", "TV.", "Yes, I have."],
          segundos: 15,
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            '¿Cuánto recuerdas de Allison? Ficha con cinco datos ya vistos, tapados: qué hace siempre en la mañana, qué hizo el sábado pasado, si ha estado en Cartagena, si ha visto nieve y qué va a hacer el sábado. Esta vez no hay palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal: "Allison: ¿Qué quieres saber? y entonces muestra las palabras de ayuda solo para esa pregunta.",
          tambienSeAcepta: "Cualquier pregunta que se entienda",
          ficha: "Allison (datos ya vistos)",
          // Respuestas de Allison del documento: salen de su ficha y de los datos
          // aprobados en las paradas 2, 4 y 5; el repaso no agrega datos suyos.
          datos: [
            {
              dato: "Qué hace siempre en la mañana",
              pregunta: "What do you usually do in the morning?",
              respuesta: "I get up at 6:30 and I always drink coffee.",
            },
            {
              dato: "Qué hizo el sábado pasado",
              pregunta: "What did you do last Saturday?",
              respuesta: "I visited my sister Emily. We made arepas!",
            },
            { dato: "Si ha estado en Cartagena", pregunta: "Have you ever been to Cartagena?", respuesta: "No, never! I really want to go." },
            { dato: "Si ha visto nieve", pregunta: "Have you ever seen snow?", respuesta: "Yes, a lot! It snows in New York in winter." },
            {
              dato: "Qué va a hacer el sábado",
              pregunta: "What are you going to do on Saturday?",
              respuesta: "I'm going to visit Emily. We're going to watch a movie.",
            },
          ],
          aceptadas: ["Last Saturday?", "You been to Cartagena?", "Snow?"],
          ayuda: "¿Qué quieres saber?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Reencuentro en Londres",
    imagen: "londres",
    contexto:
      "Vuelves a Londres al final de tu viaje. Cerca del Big Ben te encuentras por casualidad con Mia (Allison en su papel), tu compañera de Brasil de la escuela de idiomas de Nueva York. No se veían hace dos años.",
    personaje: "Mia, tu compañera de Brasil de la escuela de idiomas de Nueva York, que ahora vive en Londres",
    objetivo: "Usar en una sola conversación todo lo de las paradas 1 a 5",
    tareas: [
      "Saluda y cuenta qué estás haciendo estos días.",
      "Cuenta algo que hiciste en tu viaje.",
      "Cuenta qué estabas haciendo cuando pasó algo.",
      "Pregúntale a Mia si alguna vez ha hecho algo.",
      "Cuéntale un plan y ofrécete a hacer algo.",
      "Despídete.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Oh my gosh! It's me, Mia, from the language school in New York!" },
      { quien: "alumno", dice: "Mia! Hi! It's so good to see you!" },
      { quien: "personaje", dice: "You too! What are you doing in London?" },
      { quien: "alumno", dice: "I'm traveling around the UK. These days I'm learning a lot of English.", tarea: 1 },
      { quien: "personaje", dice: "That's great! Where did you go?" },
      { quien: "alumno", dice: "I went to Manchester. I watched a soccer game there.", tarea: 2 },
      { quien: "personaje", dice: "Soccer! Our favorite sport! Did anything funny happen on your trip?" },
      { quien: "alumno", dice: "Yes! In Liverpool I was waiting for the train when I lost my bag.", tarea: 3 },
      { quien: "personaje", dice: "Oh no! Did you find it?" },
      { quien: "alumno", dice: "Yes, I did. It was at the lost and found office." },
      { quien: "personaje", dice: "Lucky you! I live in London now. I study music here." },
      { quien: "alumno", dice: "Cool! Have you ever been to Scotland?", tarea: 4 },
      { quien: "personaje", dice: "No, never! But I really want to go. Have you?" },
      { quien: "alumno", dice: "Yes, I have. I've been to Edinburgh. It's beautiful." },
      { quien: "personaje", dice: "Amazing! How long are you going to stay in London?" },
      { quien: "alumno", dice: "One more week. Tomorrow I'm going to visit a museum." },
      { quien: "personaje", dice: "I love museums! Can I go with you?" },
      { quien: "alumno", dice: "Of course! I'll call you tonight.", tarea: 5 },
      { quien: "personaje", dice: "Perfect! Talk to you tonight!" },
      { quien: "alumno", dice: "Bye, Mia! See you tomorrow!", tarea: 6 },
    ],
    resumen: "¡Lo lograste! Usaste todo lo de las paradas 1 a 5 en una conversación.",
    recompensa:
      'Tres estrellas si no usó la ayuda, la estampilla "Repaso 1" en el pasaporte y se abre la parada 6. El resumen muestra en qué parada tuvo más errores y le sugiere repasarla.',
    siSeAtasca: [],
    siSeAtascaTexto:
      "Igual que en las paradas (pregunta más simple, ayuda al segundo fallo, frase en inglés si habla en español, sin correcciones durante la conversación y cierre amable a las 18 intervenciones). La única diferencia: si se atasca en una tarea, Allison propone repasar la parada de esa tarea, no una lección.",
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    // El documento da seis comienzos para seis tareas, pero dos son de la
    // tarea 5 (el plan, "I'm going to ___", y el ofrecimiento, "I'll ___"),
    // que van juntos; "Despídete" no tiene comienzo y sale de la línea del
    // alumno en el diálogo de ejemplo (por revisar).
    ayudas: [
      "These days I'm ___",
      "I went to ___",
      "I was ___ when ___",
      "Have you ever ___?",
      "I'm going to ___. I'll ___",
      "Bye, ___",
    ],
  },
  notas: [
    "Dato nuevo (aprobado el 17 de octubre de 2026). Mia: la compañera de Brasil de la escuela de idiomas de Nueva York (A1, parada 3), la misma que en A1. Ahora vive en Londres y estudia música; nunca ha estado en Escocia y quiere ir; le encantan los museos; su deporte favorito sigue siendo el fútbol.",
    "Datos nuevos (aprobados el 17 de octubre de 2026). Allison: nada nuevo; sus respuestas en la Entrevista salen de su ficha y de lo aprobado en las paradas 2, 4 y 5.",
  ],
};
