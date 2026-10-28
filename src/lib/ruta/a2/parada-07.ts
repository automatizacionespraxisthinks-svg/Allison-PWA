import type { Parada } from "../tipos.ts";

/**
 * Parada 7 · Cambridge (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Olivia: 16 años, hija de la familia anfitriona en Cambridge. Los
 *     sábados trabaja en el café de su tía; hace galletas de chocolate.
 *   · Ben y Priya: van de Londres a Cambridge para el picnic del domingo
 *     (el tiquete de Ben es el de la parada 6).
 *   · Sam: la compañera de Manchester (parada 2) vuelve en la lección 3:
 *     Ben la invita a la playa.
 *   · Allison (solo en esta actividad): Emily la invitó a un picnic y ella
 *     aceptó; no pasa a su ficha.
 *   · El alumno: organiza el picnic del domingo a las 2 en el parque junto
 *     al río.
 */
export const PARADA_07: Parada = {
  numero: 7,
  ciudad: "Cambridge",
  titulo: "Invita y responde",
  gramatica: "Would you like to…?, Let's… y How about…?",
  objetivo:
    'Al terminar, el alumno invita, propone un plan y responde a una invitación: "Would you like to come? Let\'s meet at five." Gramática: Would you like to…?, Let\'s… y How about…?; "Shall we…?" solo se entiende. Usa A1, las paradas 1 a 6 y el Repaso 1.',
  fraseMeta: "Would you like to come? Let's meet at five.",
  portada: "cambridge",
  vocabulario: [
    {
      grupo: "Invitar",
      ingles: "Would you like to come to a picnic? Do you want to come?",
      nota: "Would you like es la forma amable; Do you want to, la de confianza",
    },
    {
      grupo: "Ofrecer",
      ingles: "Would you like some water? Would you like a cookie?",
      nota: "Para aceptar: Yes, please. Para no aceptar: No, thank you",
    },
    {
      grupo: "Proponer",
      ingles: "Let's meet at five. How about Sunday? How about going to the park?",
      nota: 'Después de let\'s va el verbo solo; después de how about, un día, una cosa o un verbo con -ing. "Shall we…?" se oye en el Reino Unido y en Estados Unidos casi no: solo hay que entenderlo',
    },
    {
      grupo: "Aceptar",
      ingles: "I'd love to! Sure! Sounds great! Good idea!",
      nota: "",
    },
    {
      grupo: "Decir que no",
      ingles: "Sorry, I can't. I'm visiting my grandma. Maybe next time!",
      nota: "Se dice no con una razón, con el presente continuo de la parada 6",
    },
    {
      grupo: "Picnic",
      ingles: "blanket, sandwiches, cookies, chips, lemonade, soda",
      nota: "De Estados Unidos: cookies (nunca biscuits) y chips para las papas de paquete (nunca crisps)",
    },
    {
      grupo: "Frases",
      ingles: "Would you like to come to my picnic on Sunday? Let's meet at the park at two. What can I bring?",
      nota: "",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Quieres venir?",
      objetivo: "Entender y hacer invitaciones con Would you like to…?",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya asks: "Would you like to play tennis on Tuesday after school?" Ben says: "Sorry, I can\'t. I\'m studying for a test." (no está escrito). Pregunta: ¿qué hace Ben el martes? Elige entre Ben estudiando, Ben frente a su computador y Ben horneando con su abuela.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya asks: "Would you like to play tennis on Tuesday after school?"', 'Ben says: "Sorry, I can\'t. I\'m studying for a test."'],
          traduccion: ['Priya pregunta: "¿Te gustaría jugar tenis el martes después del colegio?"', 'Ben dice: "Lo siento, no puedo. Estoy estudiando para un examen."'],
          pregunta: "¿Qué hace Ben el martes?",
          opciones: [
            { imagen: "f-ben-estudiando", descripcion: "Ben estudiando", etiqueta: "Study", etiquetaEs: "Estudiar" },
            { imagen: "f-ben-computador", descripcion: "Ben frente a su computador", etiqueta: "Use the computer", etiquetaEs: "Usar el computador" },
            { imagen: "f-plan-torta", descripcion: "Ben horneando con su abuela", etiqueta: "Bake a cake", etiquetaEs: "Hornear una torta" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de una tarjeta de invitación: "Picnic! Sunday · 2:00 p.m. · The park by the river". Allison: "Read the card. Now invite me!"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "It\'s an invitation." → "Start with: Would you like…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "You like to come to a picnic?": Para invitar con amabilidad: would you like to come…?',
          imagen: "f-invitacion-picnic",
          pregunta: "Read the card. Now invite me!",
          contexto: "Lee la tarjeta e invita a Allison al plan. Dilo en inglés.",
          respuesta: "Would you like to come to a picnic on Sunday?",
          aceptadas: ["Would you like to come to my picnic?", "Do you want to come to a picnic on Sunday?"],
          pistas: ["It's an invitation.", "Start with: Would you like…"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "Would you like to come to my house?" Se practica la palabra would.',
          siRespondeMal:
            'Si pronuncia la l: Escucha: would. La l no suena: "wud", y would you suena casi "wúdyu". Say it: would. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "Would you like to come to my house?",
          palabraDificil: "would",
          consejo: 'La l no suena: "wud", y would you suena casi "wúdyu".',
        },
      ],
    },
    {
      numero: 2,
      titulo: "Let's y How about",
      objetivo: "Proponer planes y ponerse de acuerdo.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya asks: "How about going to the park?" Ben says: "Good idea! Let\'s take our bikes." (no está escrito). Elige entre un parque con una bicicleta, un cine y un vagón de metro.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya asks: "How about going to the park?"', 'Ben says: "Good idea! Let\'s take our bikes."'],
          traduccion: ['Priya pregunta: "¿Qué tal si vamos al parque?"', 'Ben dice: "¡Buena idea! Llevemos nuestras bicicletas."'],
          pregunta: "¿Adónde van Priya y Ben?",
          opciones: [
            { imagen: "f-parque-corredor-bici", descripcion: "Un parque con una bicicleta", etiqueta: "Park", etiquetaEs: "Parque" },
            { imagen: "f-cine", descripcion: "Un cine", etiqueta: "Movie theater", etiquetaEs: "Cine" },
            { imagen: "a1/f-metro", descripcion: "Un vagón de metro", etiqueta: "Subway", etiquetaEs: "Metro" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca el parque con la bicicleta"'],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "¿Qué tal el sábado? Encontrémonos a las cinco." Las palabras de apoyo aparecen después del primer fallo: how about, Saturday, let\'s, meet, at, five.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "Let\'s to meet": Después de let\'s va el verbo solo: let\'s meet. Si dice "We meet at five?": Para proponer: let\'s meet at five. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "¿Qué tal el sábado? Encontrémonos a las cinco.",
          respuesta: "How about Saturday? Let's meet at five.",
          aceptadas: ["What about Saturday? Let's meet at five o'clock."],
          palabras: ["How", "about", "Saturday?", "Let's", "meet", "at", "five."],
          explicaciones: [
            { siDice: "Let's to meet", explicacion: "Después de let's va el verbo solo: let's meet." },
            { siDice: "We meet at five?", explicacion: "Para proponer: let's meet at five." },
          ],
          porRevisar: ['palabras: el documento junta "how about"; van separadas, con la mayúscula y la puntuación de la respuesta'],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about your perfect Saturday with your friends." Preguntas guía: What would you like to do? Where would you like to go? Who would you like to invite?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I would like go to the river" → Después de would like va to: I\'d like to go. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about your perfect Saturday with your friends.",
          guias: ["What would you like to do?", "Where would you like to go?", "Who would you like to invite?"],
          modelo:
            "On my perfect Saturday, I'd like to go to the river with my friends. I'd like to invite my best friend, Camila, and my cousins. We can swim and eat sandwiches, and at night we can watch a movie at my house.",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Sí, no y tal vez",
      objetivo: "Aceptar una invitación o decir que no con una razón.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Ben asks: "Would you like to come to the beach on Sunday?" Sam says: "Sounds great! What can I bring?" (no está escrito). ¿Qué respondió Sam? Elige entre tres tarjetas dibujadas por la app: Sí, No y Tal vez.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Ben asks: "Would you like to come to the beach on Sunday?"', 'Sam says: "Sounds great! What can I bring?"'],
          traduccion: ['Ben pregunta: "¿Te gustaría venir a la playa el domingo?"', 'Sam dice: "¡Suena genial! ¿Qué puedo llevar?"'],
          pregunta: "¿Qué respondió Sam?",
          opciones: [
            { texto: "Sí", descripcion: "La tarjeta Sí" },
            { texto: "No", descripcion: "La tarjeta No" },
            { texto: "Tal vez", descripcion: "La tarjeta Tal vez" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Un parque de Cambridge un domingo: una manta con sándwiches y limonada, unos muchachos jugando frisbee y un bote en el río. Allison: "Invite me to 3 things in the picture." Debajo: "Would you like to ___?", "Let\'s ___.", "How about ___?" y have a picnic, play frisbee, take a boat.',
          siRespondeMal:
            'Si dice "Would you like play frisbee?", Allison repite bien la frase (Would you like to play frisbee?) y el alumno la dice. Si invita a menos de 3 cosas, Allison señala el bote y dice "And the boat? Invite me!".',
          imagen: "f-parque-cambridge",
          pregunta: "Invite me to 3 things in the picture.",
          plantillas: ["Would you like to ___?", "Let's ___.", "How about ___?"],
          palabrasAyuda: ["have a picnic", "play frisbee", "take a boat"],
          modelo: ["Would you like to have a picnic?", "Let's play frisbee!", "How about taking a boat on the river?"],
          aceptadas: ["Do you want to play frisbee?", "How about a picnic?", "Let's take a boat!"],
          cosas: ["picnic", "frisbee", "boat", "sandwich", "lemonade", "blanket"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen del dibujo y de las frases modelo"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco invitaciones con quince segundos; el alumno acepta o dice que no con una razón: Would you like to play soccer after school? How about pizza for dinner? Would you like to come to my house on Saturday? Let's watch a movie tonight! Would you like to go to the beach next vacation?",
          siRespondeMal: "Se muestra una respuesta modelo y la invitación vuelve al final.",
          tambienSeAcepta:
            'Respuestas cortas que responden bien: "Yes!" "No, sorry." Allison sugiere la frase completa, y si es un no, con una razón',
          preguntas: [
            { pregunta: "Would you like to play soccer after school?", modelo: "Sure! I'd love to." },
            { pregunta: "How about pizza for dinner?", modelo: "Sounds great!" },
            { pregunta: "Would you like to come to my house on Saturday?", modelo: "Sorry, I can't. I'm visiting my grandma." },
            { pregunta: "Let's watch a movie tonight!", modelo: "Good idea!" },
            { pregunta: "Would you like to go to the beach next vacation?", modelo: "Yes, I'd love to!" },
          ],
          aceptadas: ["Yes!", "No, sorry."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "¿Qué plan te gusta?",
      objetivo: "Invitar con Would you like to…? hasta dar con el plan.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Last week Emily invited me to a picnic. I said: I\'d love to!" (no está escrito). ¿A qué la invitó Emily? Elige entre un picnic en un parque, un museo y un cine.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Last week Emily invited me to a picnic.", "I said: I'd love to!"],
          traduccion: ["La semana pasada Emily me invitó a un picnic.", "Le dije: ¡Me encantaría!"],
          pregunta: "¿A qué la invitó Emily?",
          opciones: [
            { imagen: "f-parque-picnic", descripcion: "Un picnic en un parque", etiqueta: "Picnic", etiquetaEs: "Picnic" },
            { imagen: "f-plan-museo", descripcion: "Un museo", etiqueta: "Museum", etiquetaEs: "Museo" },
            { imagen: "f-cine", descripcion: "Un cine", etiqueta: "Movie theater", etiquetaEs: "Cine" },
          ],
          correcta: 0,
          porRevisar: [
            "traduccion",
            "opciones: la tabla de ilustraciones no nombra el cine de esta lección; se usa f-cine (de la parada 2), el mismo de la lección 2",
          ],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de una muchacha cansada después de correr y un vaso de agua. Allison: "Your friend is thirsty. Offer her some water!"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Be polite!" → "Start with: Would you like…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "You like water?": Para ofrecer con amabilidad: would you like some water?',
          imagen: "f-vaso-agua",
          pregunta: "Your friend is thirsty. Offer her some water!",
          contexto: "Tu amiga tiene sed. Ofrécele agua en inglés.",
          respuesta: "Would you like some water?",
          aceptadas: ["Would you like a glass of water?", "Do you want some water?"],
          pistas: ["Be polite!", "Start with: Would you like…"],
        },
        // El documento agrega, debajo de la tabla de respuestas: "Una
        // invitación que no está en la tabla recibe 'Hmm, I can't answer
        // that one. Invite me to something else!' y no gasta la ronda. La
        // misma invitación con Do you want to…? o How about…? vale como la
        // de la tabla." A un sí Allison responde "I'd love to!"; a un no,
        // "No, thanks." (respuestaCorta lo saca de "Would you like…").
        {
          paso: 3,
          tipo: "adivina",
          queAparece:
            'Seis tarjetas con dibujo de planes: have a picnic, go to a concert, ride bikes, take a boat on the river, visit a museum y watch a soccer game. Allison: "I\'m thinking of a plan for Sunday. Invite me with yes or no questions and guess!" Dos rondas (concert y bikes, en orden al azar).',
          siRespondeMal:
            'Si no es de sí o no ("What do you want to do?"): Allison, "That\'s a secret! Invite me: Would you like to…?". Al segundo intento fallido se ilumina la ayuda con una invitación de ejemplo. Si adivina mal: "No, thanks! Ask me more."',
          tambienSeAcepta: 'Cualquier invitación que se entienda: "You want to be outside?", "How about music?", "Concert?"',
          apertura: "I'm thinking of a plan for Sunday. Invite me with yes or no questions and guess!",
          opciones: [
            { nombre: "have a picnic", imagen: "f-parque-picnic" },
            { nombre: "go to a concert", imagen: "f-plan-concierto" },
            { nombre: "ride bikes", imagen: "f-parque-corredor-bici" },
            { nombre: "take a boat on the river", imagen: "f-plan-bote" },
            { nombre: "visit a museum", imagen: "f-plan-museo" },
            { nombre: "watch a soccer game", imagen: "f-estadio-hotdogs" },
          ],
          rondas: ["go to a concert", "ride bikes"],
          preguntas: [
            { pregunta: "Would you like to be outside?", si: ["have a picnic", "ride bikes", "take a boat on the river", "watch a soccer game"] },
            { pregunta: "Would you like to be inside?", si: ["go to a concert", "visit a museum"] },
            { pregunta: "Would you like to sit on the grass?", si: ["have a picnic"] },
            { pregunta: "Would you like to bring food?", si: ["have a picnic"] },
            { pregunta: "Would you like to listen to music?", si: ["go to a concert"] },
            { pregunta: "Would you like to get some exercise?", si: ["ride bikes"] },
            { pregunta: "Would you like to go on the river?", si: ["take a boat on the river"] },
            { pregunta: "Would you like to see art?", si: ["visit a museum"] },
            { pregunta: "Would you like to watch a game?", si: ["watch a soccer game"] },
          ],
          adivinar: "Would you like to {x}?",
          secreto: "That's a secret! Invite me: Would you like to…?",
          aceptadas: ["You want to be outside?", "How about music?", "Concert?"],
          porRevisar: [
            'opciones: los nombres son los de "Qué aparece" (have a picnic, go to a concert…); el encabezado de la tabla los abrevia (picnic, concert, bikes, boat, museum, soccer game)',
            'rondas: el documento dice "concert y bikes"; son las tarjetas go to a concert y ride bikes',
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "Organizas un picnic en Cambridge",
    imagen: "e-cambridge-cocina",
    contexto:
      "En Cambridge te quedas con una familia anfitriona. Quieres organizar un picnic con tus amigos y en la cocina encuentras a Olivia (Allison en su papel), la hija de la familia, de 16 años.",
    personaje: "Olivia, la hija de 16 años de tu familia anfitriona en Cambridge",
    objetivo: "Invitar, proponer día, hora y lugar, y responder a una invitación",
    tareas: [
      "Invita a Olivia al picnic.",
      "Propón otro día.",
      "Propón la hora y el lugar.",
      "Cuéntale quién más va.",
      "Responde a su invitación.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hi! You look busy. What are you doing?" },
      { quien: "alumno", dice: "Hi, Olivia! I'm planning a picnic for this weekend." },
      { quien: "personaje", dice: "Oh, fun!" },
      { quien: "alumno", dice: "Would you like to come?", tarea: 1 },
      { quien: "personaje", dice: "I'd love to! When is it?" },
      { quien: "alumno", dice: "It's on Saturday afternoon." },
      { quien: "personaje", dice: "Oh, sorry, I can't. I'm working at my aunt's café on Saturday." },
      { quien: "alumno", dice: "Oh no! How about Sunday?", tarea: 2 },
      { quien: "personaje", dice: "Sunday is perfect! What time?" },
      { quien: "alumno", dice: "Let's meet at two at the park by the river.", tarea: 3 },
      { quien: "personaje", dice: "Great! Who's coming?" },
      { quien: "alumno", dice: "My friends Ben and Priya are coming from London.", tarea: 4 },
      { quien: "personaje", dice: "Cool! I want to meet them. What can I bring?" },
      { quien: "alumno", dice: "Can you bring some cookies?" },
      { quien: "personaje", dice: "Sure! I can make chocolate cookies. Hey, would you like to take a boat on the river after the picnic?" },
      { quien: "alumno", dice: "Yes, I'd love to!", tarea: 5 },
      { quien: "personaje", dice: "Awesome! Do you want lemonade or soda for the picnic?" },
      { quien: "alumno", dice: "Lemonade, please. I'll bring the sandwiches." },
      { quien: "personaje", dice: "Perfect! See you on Sunday!" },
      { quien: "alumno", dice: "See you, Olivia! Thanks!" },
    ],
    resumen: "¡Lo lograste! Invitaste, propusiste un plan y respondiste a una invitación en inglés.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Cambridge en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like picnics" → Me too! Are you inviting me?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "How about ___?"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"¿Quieres venir?" → En inglés: Would you like to come? Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"Let\'s to meet at two" → la escena sigue; en el resumen: Después de let\'s va el verbo solo: let\'s meet at two.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "I'm late for work! See you later! Vamos a repasar cómo invitar y proponer, y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    ayudas: ["Would you like to ___?", "How about ___?", "Let's meet ___", "My friends ___", "I'd love ___"],
  },
  ilustraciones: [
    {
      archivos: ["cambridge"],
      muestra: "Portada de la ciudad: la capilla del King's College y un puente de madera sobre el río",
      uso: "Portada de la parada",
    },
    { archivos: ["e-cambridge-cocina"], muestra: "La cocina de una casa, con un calendario en la nevera", uso: "Escenario" },
    {
      archivos: ["f-ben-estudiando", "f-ben-computador", "f-plan-torta"],
      muestra:
        "Ben estudiando (de la parada 2), Ben frente a su computador (de la parada 1) y Ben horneando con su abuela (de la parada 5)",
      uso: "Lección 1 (paso 1)",
    },
    {
      archivos: ["f-invitacion-picnic"],
      muestra: 'Una tarjeta de invitación: "Picnic! Sunday · 2:00 p.m. · The park by the river"',
      uso: "Lección 1 (paso 2)",
    },
    {
      archivos: ["f-parque-corredor-bici", "f-cine", "a1/f-metro"],
      muestra: "Un parque con una bicicleta (de la parada 3), un cine (de la parada 2) y un vagón de metro (de A1)",
      uso: "Lección 2 (paso 1); el parque también es la tarjeta ride bikes",
    },
    {
      archivos: ["f-parque-cambridge"],
      muestra: "Un parque un domingo: una manta con sándwiches y limonada, unos muchachos jugando frisbee y un bote en el río",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["f-parque-picnic", "f-plan-museo"],
      muestra: "Una familia en un picnic (de la parada 3); una muchacha mirando cuadros en un museo (de la parada 5)",
      uso: "Lección 4 (paso 1) y las tarjetas have a picnic y visit a museum",
    },
    {
      archivos: ["f-vaso-agua"],
      muestra: "Una muchacha cansada después de correr y un vaso de agua (de la parada 5)",
      uso: "Lección 4 (paso 2)",
    },
    {
      archivos: ["f-plan-concierto", "f-plan-bote"],
      muestra: "Un concierto en un teatro; un bote en el río",
      uso: "Las tarjetas go to a concert y take a boat on the river",
    },
    { archivos: ["f-estadio-hotdogs"], muestra: "Un estadio con hot dogs (de la parada 2)", uso: "La tarjeta watch a soccer game" },
  ],
};
