import type { Parada } from "../tipos.ts";

/**
 * Parada 4 · Vancouver (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1. Esta parada no trae Repite: el punto no es un
 * sonido.
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison (va a su ficha): cree que Nueva York es la mejor ciudad del
 *     mundo, pero muy cara; quiere a los gatos y a los perros, pero
 *     prefiere los gatos; diciembre le parece hermoso y enero, demasiado
 *     frío. Lo demás ya está en su ficha (prefiere el metro a los taxis,
 *     le gusta un poco el reguetón, prefiere el pop).
 *   · Zoe: cree que el colegio debería empezar a las nueve; su mamá no
 *     está de acuerdo. Su curso votó el paseo de fin de año y eligió
 *     Toronto Island.
 *   · Liam: quiere un perro, pero no tiene; su papá dice que necesita
 *     mucho tiempo. Usa el celular para estudiar francés y lo apaga en la
 *     cena.
 *   · Ms. Wong: solo en este escenario, la presidenta de la junta de
 *     vecinos en Vancouver.
 */
export const PARADA_04: Parada = {
  numero: 4,
  ciudad: "Vancouver",
  titulo: "Opina y responde",
  gramatica: "Expresiones de opinión y conectores",
  objetivo:
    'Al terminar, el alumno da su opinión con razones y responde a la de otros con amabilidad: "I see your point, but I think it\'s too expensive." Gramática: expresiones de opinión (I think, In my opinion, I agree, I see your point, but…) y conectores (because, so, although, on the other hand). Usa todo lo anterior y nada de paradas posteriores (ni voz pasiva, ni if + will, ni might).',
  fraseMeta: "I see your point, but I think it's too expensive.",
  portada: "vancouver",
  vocabulario: [
    {
      grupo: "Dar tu opinión",
      ingles: "I think, I don't think, In my opinion, I believe, For me",
      nota: 'Mejor "I don\'t think it\'s a good idea" que "I think it isn\'t a good idea"',
    },
    {
      grupo: "Estar de acuerdo o no",
      ingles: "I agree, I disagree, I see your point, but…, That's true, but…, You're right",
      nota: '"I agree", nunca "I am agree"',
    },
    {
      grupo: "Conectores",
      ingles: "because, so, but, although, on the other hand, also",
      nota: '"Although" une dos ideas que chocan, sin "but": "Although it\'s expensive, I like it."',
    },
    {
      grupo: "El barrio",
      ingles: "park, skate park, dog park, playground, trees, lights, noise, neighbors, meeting",
      nota: '"Neighbor" de Estados Unidos, nunca "neighbour"',
    },
    {
      grupo: "Frases",
      ingles: "What do you think about…? Do you agree? I see your point, but I think… That's a good idea, because…",
      nota: 'Para preguntar la opinión valen "What do you think about…?" y "What do you think of…?"',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Qué opinas?",
      objetivo: "Dar una opinión y una razón. Esta parada no trae Repite: aquí el punto no es un sonido.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe thinks school should start at nine, because teenagers need more sleep. Her mom doesn\'t agree. Her mom thinks Zoe should just go to bed earlier!" (no está escrito). Pregunta: ¿qué opina la mamá de Zoe? Elige entre tres tarjetas dibujadas por la app: Zoe should go to bed earlier. / School should start at nine. / Zoe needs a new alarm.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe thinks school should start at nine, because teenagers need more sleep.",
            "Her mom doesn't agree.",
            "Her mom thinks Zoe should just go to bed earlier!",
          ],
          traduccion: [],
          pregunta: "¿Qué opina la mamá de Zoe?",
          opciones: [
            { texto: "School should start at nine.", descripcion: "School should start at nine." },
            { texto: "Zoe needs a new alarm.", descripcion: "Zoe needs a new alarm." },
            { texto: "Zoe should go to bed earlier.", descripcion: "Zoe should go to bed earlier." },
          ],
          correcta: 2,
          porRevisar: ["audio: «Her mom thinks…» en vez de «She thinks…», para que no haya duda de quién lo piensa (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de un salón de clase con una caja llena de celulares en el escritorio del profesor. Allison: "Some schools don\'t allow phones in class. What do you think?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: I think… because…". Si dice "I am agree": "Just say: I agree." Si no da razón, Allison pregunta "Why?" y el alumno completa.',
          tambienSeAcepta: "Cualquier opinión con I think, In my opinion o I don't think, y una razón",
          imagen: "f-salon-celulares",
          pregunta: "Some schools don't allow phones in class. What do you think?",
          respuesta: "I think it's a good idea, because students pay more attention.",
          aceptadas: ["In my opinion, it's a bad idea, because we use our phones to study."],
          pistas: ["Start with: I think… because…"],
          explicaciones: [{ siDice: "I am agree", explicacion: "Just say: I agree.", es: "Solo di: I agree." }],
          porRevisar: [
            'respuesta: el documento pide "Una opinión con una razón" y da dos ejemplos; el primero va como respuesta y el segundo en aceptadas. La regla queda en tambienSeAcepta',
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Creo que los uniformes son buena idea, porque todos se ven iguales." Dibujo de estudiantes con uniforme. Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló ("I think…", "…because everyone…"). Si dice "uniforms is": "Use are: uniforms are." Si dice "everyone look": "Everyone looks, with s." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Creo que los uniformes son buena idea, porque todos se ven iguales.",
          imagen: "f-uniformes",
          respuesta: "I think uniforms are a good idea, because everyone looks the same.",
          aceptadas: ["In my opinion, uniforms are a good idea, because we all look the same."],
          palabras: [],
          partes: ["I think uniforms are a good idea,", "because everyone looks the same."],
          explicaciones: [
            { siDice: "uniforms is", explicacion: "Use are: uniforms are.", es: "Va are: uniforms are." },
            { siDice: "everyone look", explicacion: "Everyone looks, with s.", es: "Everyone looks, con s." },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Estar de acuerdo o no",
      objetivo: "Responder a la opinión de otro con amabilidad: estar de acuerdo, o no estarlo y explicar por qué.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam wants a dog. His dad says a dog needs a lot of time. Liam sees his point, but he thinks he can walk the dog every morning before school." (no está escrito). Pregunta: ¿qué propone Liam? Elige entre tres tarjetas dibujadas por la app: Walk the dog every morning. / Get a cat instead. / Wait until summer.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam wants a dog.",
            "His dad says a dog needs a lot of time.",
            "Liam sees his point, but he thinks he can walk the dog every morning before school.",
          ],
          traduccion: [],
          pregunta: "¿Qué propone Liam?",
          opciones: [
            { texto: "Get a cat instead.", descripcion: "Get a cat instead." },
            { texto: "Walk the dog every morning.", descripcion: "Walk the dog every morning." },
            { texto: "Wait until summer.", descripcion: "Wait until summer." },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Entiendo tu punto, pero creo que es demasiado caro." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "very much expensive": "Say: too expensive." Si dice "I think is too expensive": "Say it: I think it\'s too expensive." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Entiendo tu punto, pero creo que es demasiado caro.",
          respuesta: "I see your point, but I think it's too expensive.",
          aceptadas: [
            "I understand your point, but I think it's too expensive.",
            "That's true, but I think it's too expensive.",
          ],
          palabras: [],
          partes: ["I see your point,", "but I think it's too expensive."],
          explicaciones: [
            { siDice: "very much expensive", explicacion: "Say: too expensive.", es: "Di: too expensive." },
            {
              siDice: "I think is too expensive",
              explicacion: "Say it: I think it's too expensive.",
              es: "Dilo así: I think it's too expensive.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Is it better to live in a big city or in a small town? Tell me what you think." Tres preguntas guía: What do you prefer? Why? What\'s one problem with it? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "I am agree that cities are noisy" → Better: I agree that cities are noisy. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Is it better to live in a big city or in a small town? Tell me what you think.",
          guias: ["What do you prefer?", "Why?", "What's one problem with it?"],
          modelo:
            "In my opinion, it's better to live in a big city. There are more schools, stores and things to do. I agree that cities are noisy, but I don't think it's a big problem. On the other hand, small towns are quiet and safe. Although I love my grandparents' town, I prefer the city, because there are more opportunities.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Narra lo que decidieron",
      objetivo: "Contar una decisión de grupo uniendo las ideas con because, so, but y although.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe\'s class voted on their end-of-year trip. Most students wanted to go to Niagara Falls, but it was too expensive, so they chose Toronto Island. Zoe thinks it was a good choice." (no está escrito). Pregunta: ¿por qué no fueron a las cataratas del Niágara? Elige entre tres tarjetas dibujadas por la app: It was too expensive. / It was too far. / It was raining.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe's class voted on their end-of-year trip.",
            "Most students wanted to go to Niagara Falls, but it was too expensive, so they chose Toronto Island.",
            "Zoe thinks it was a good choice.",
          ],
          traduccion: [],
          pregunta: "¿Por qué no fueron a las cataratas del Niágara?",
          opciones: [
            { texto: "It was too expensive.", descripcion: "It was too expensive." },
            { texto: "It was too far.", descripcion: "It was too far." },
            { texto: "It was raining.", descripcion: "It was raining." },
          ],
          correcta: 0,
          porRevisar: ["pregunta: «cataratas del Niágara», como el Niagara Falls que se oye (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden de un parque de Vancouver: (1) el parque está sucio y sin luces; (2) los vecinos en una reunión; (3) unos con un dibujo de una pista de skate y otros con un dibujo de árboles; (4) el parque nuevo, con árboles, luces y una pista de skate pequeña. Allison: "Tell me what happened to the park. Use because, so, but and although." Debajo: first, then, after that, now.',
          siRespondeMal:
            'Si dice "Although they didn\'t agree, but they found…": "With although, no but: Although they didn\'t agree, they found a solution." Allison repite bien la frase y el alumno la dice. Si cuenta menos de 3 dibujos, Allison señala el que falta: "What happened next?"',
          tambienSeAcepta:
            'Narraciones que usan los conectores aunque cambien las palabras: "The park was dirty, so they had a meeting."',
          imagenes: ["f-parque-vancouver-1", "f-parque-vancouver-2", "f-parque-vancouver-3", "f-parque-vancouver-4"],
          dibujos: [
            "El parque está sucio y sin luces",
            "Los vecinos en una reunión",
            "Unos vecinos con un dibujo de una pista de skate y otros con un dibujo de árboles",
            "El parque nuevo, con árboles, luces y una pista de skate pequeña",
          ],
          pregunta: "Tell me what happened to the park. Use because, so, but and although.",
          debajo: ["first", "then", "after that", "now"],
          modelo:
            "First, the park was dirty and it didn't have any lights, so the neighbors had a meeting. Some people wanted a skate park, because there was nothing for teenagers, but others wanted more trees. Although they didn't agree at first, they found a solution. Now the park has trees, lights and a small skate park.",
          verbos: ["was", "had a meeting", "wanted", "has"],
          gramatica:
            "past simple narration that joins ideas with the connectors because, so, but and although (never although… but), ending in the present with now",
          explicaciones: [
            {
              siDice: "Although they didn't agree, but they found…",
              explicacion: "With although, no but: Although they didn't agree, they found a solution.",
              es: "Con although, sin but: Although they didn't agree, they found a solution.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            'dibujos: salen de queAparece, sin la numeración; en el dibujo 3 se agregó "vecinos" ("Unos vecinos con…")',
            "verbos: salen del modelo",
            "gramatica: escrita para el evaluador",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: Should students wear uniforms? Is homework useful? Which is better, summer or winter? Should kids have a phone at twelve? Is it better to study alone or with friends?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden ("Yes."); Allison pregunta "Why?"',
          preguntas: [
            { pregunta: "Should students wear uniforms?", modelo: "I think so, because it's easier in the morning." },
            { pregunta: "Is homework useful?", modelo: "In my opinion, yes, because we practice." },
            { pregunta: "Which is better, summer or winter?", modelo: "For me, summer, because I love the beach." },
            { pregunta: "Should kids have a phone at twelve?", modelo: "I don't think so. They're too young." },
            { pregunta: "Is it better to study alone or with friends?", modelo: "With friends, because it's more fun." },
          ],
          aceptadas: ["Yes."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Entrevista a Allison",
      objetivo: "Preguntarle a alguien qué opina, con What do you think about…? y Do you think…?",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam\'s grandpa thinks phones are bad for teenagers. Liam disagrees: he uses his phone to study French. But he agrees that he should turn it off at dinner." (no está escrito). Pregunta: ¿en qué está de acuerdo Liam con su abuelo? Elige entre tres tarjetas dibujadas por la app: Turn off the phone at dinner. / Go to bed early. / Study French every day.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam's grandpa thinks phones are bad for teenagers.",
            "Liam disagrees: he uses his phone to study French.",
            "But he agrees that he should turn it off at dinner.",
          ],
          traduccion: [],
          pregunta: "¿En qué está de acuerdo Liam con su abuelo?",
          opciones: [
            { texto: "Go to bed early.", descripcion: "Go to bed early." },
            { texto: "Study French every day.", descripcion: "Study French every day." },
            { texto: "Turn off the phone at dinner.", descripcion: "Turn off the phone at dinner." },
          ],
          correcta: 2,
          porRevisar: ["opciones: «Go to bed early.» en vez de «Phones are bad for teenagers.», que es justo con lo que Liam NO está de acuerdo (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "En mi opinión, los videojuegos no son malos, aunque algunos son violentos." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "although… but": "With although, no but." Si dice "video games isn\'t": "Use aren\'t: video games aren\'t." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "En mi opinión, los videojuegos no son malos, aunque algunos son violentos.",
          respuesta: "In my opinion, video games aren't bad, although some are violent.",
          aceptadas: [
            "I think video games aren't bad, but some are violent.",
            "I don't think video games are bad, although some are violent.",
          ],
          palabras: [],
          partes: ["In my opinion, video games aren't bad,", "although some are violent."],
          explicaciones: [
            { siDice: "although… but", explicacion: "With although, no but.", es: "Con although, sin but." },
            {
              siDice: "video games isn't",
              explicacion: "Use aren't: video games aren't.",
              es: "Va aren't: video games aren't.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha de las opiniones de Allison con cinco datos por descubrir: qué opina de Nueva York, de los taxis, de los gatos y los perros, del reguetón y del invierno. Arma cada pregunta sin palabras de ayuda. Al acertar, el dato se llena, Allison da su opinión y le pregunta la suya ("What do you think?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            'Una sola pista en inglés: "Ask me what I think! Start with: What do you think about…?" Hay un botón de ayuda con la pregunta escrita.',
          tambienSeAcepta:
            'Cualquier pregunta que se entienda: "New York, what you think?", "Taxis are good?", "Cats or dogs?"',
          ficha: "las opiniones de Allison",
          datos: [
            {
              dato: "Nueva York",
              pregunta: "What do you think about New York?",
              respuesta: "I think it's the best city in the world! But it's very expensive.",
            },
            {
              dato: "Los taxis",
              pregunta: "Do you think taxis are expensive in New York?",
              respuesta: "Yes, I do! They're very expensive. I think the subway and the ferry are better.",
            },
            {
              dato: "Gatos o perros",
              pregunta: "Which do you prefer, cats or dogs?",
              respuesta: "I love both! My sister Emily has a dog, Rocky, but I prefer cats. My cat Luna often sleeps on the sofa!",
            },
            {
              dato: "El reguetón",
              pregunta: "What do you think about reggaeton?",
              respuesta: "I like it a little! I prefer pop, but reggaeton is great for dancing.",
            },
            {
              dato: "El invierno",
              pregunta: "What do you think about winter in New York?",
              respuesta: "I think December is beautiful, but January is too cold for me!",
            },
          ],
          aceptadas: ["New York, what you think?", "Taxis are good?", "Cats or dogs?"],
          ayuda:
            'Una sola pista en inglés: "Ask me what I think! Start with: What do you think about…?" Hay un botón de ayuda con la pregunta escrita.',
          minimoIntervenciones: 10,
          pistas: [
            "Ask me what I think! Start with: What do you think about…?",
            "Ask me about taxis! Start with: Do you think…?",
            "Ask me about cats and dogs! Start with: Which do you prefer…?",
            "Ask me about reggaeton! Start with: What do you think about…?",
            "Ask me about winter! Start with: What do you think about…?",
          ],
          porRevisar: [
            "pistas: la primera es la del documento (es general, no nombra Nueva York); las otras cuatro siguen el patrón de la guía",
          ],
        },
      ],
    },
  ],
  // Escenario: el documento no trae texto que haya tenido que crear. La
  // tarea 4 es la del imprevisto ("Elige una y defiéndela con dos
  // razones.") y su línea es la del diálogo marcada "(imprevisto)".
  escenario: {
    titulo: "La reunión de vecinos",
    imagen: "e-vancouver-reunion",
    contexto:
      "Pasas el verano con una familia en Vancouver. Ellos no pueden ir a la reunión de vecinos sobre el parque nuevo y te piden que vayas y des tu opinión. Ms. Wong, la presidenta de la junta de vecinos (Allison en su papel), dirige la reunión.",
    personaje: "Ms. Wong, la presidenta de la junta de vecinos en Vancouver",
    objetivo: "Dar su opinión sobre el parque con razones, responder a la de Ms. Wong y defender una elección",
    tareas: [
      "Saluda y di por qué viniste.",
      "Di qué quieres para el parque y por qué.",
      "Responde a la idea de Ms. Wong con amabilidad.",
      "Elige una y defiéndela con dos razones.",
      "Agradece y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Ms. Wong lee un correo de la ciudad: solo hay dinero para una cosa, una pista de skate o un parque para perros. Ahí aparece la tarea 4: "Elige una y defiéndela con dos razones."',
      linea:
        "OK. Oh, wait. I've just received an email from the city. They only have money for one thing: a skate park or a dog park.",
    },
    dialogo: [
      { quien: "personaje", dice: "Good evening, everyone! I'm Ms. Wong. Are you new in the neighborhood?" },
      {
        quien: "alumno",
        dice: "Good evening! Yes, I'm staying with the Lee family this summer. They asked me to come.",
        tarea: 1,
      },
      { quien: "personaje", dice: "Welcome! Tonight we're talking about the new park. What do you think it needs?" },
      { quien: "alumno", dice: "I think it needs a skate park, because there's nothing for teenagers.", tarea: 2 },
      { quien: "personaje", dice: "Interesting. Do you skate?" },
      { quien: "alumno", dice: "Yes, I do. I skate every weekend in Bogotá." },
      { quien: "personaje", dice: "Is there a skate park near your house there?" },
      { quien: "alumno", dice: "Yes, there is. It's always full of kids." },
      { quien: "personaje", dice: "Well, I think the park needs more trees. It's very hot in the summer." },
      {
        quien: "alumno",
        dice: "I see your point, but I think trees and a skate park can be in the same park.",
        tarea: 3,
      },
      { quien: "personaje", dice: "That's true. Do you agree that it also needs lights?" },
      { quien: "alumno", dice: "Yes, I agree. It's very dark at night, so people don't go." },
      {
        quien: "personaje",
        dice: "OK. Oh, wait. I've just received an email from the city. They only have money for one thing: a skate park or a dog park.",
      },
      { quien: "alumno", dice: "In my opinion, the skate park is better.", tarea: 4 },
      { quien: "personaje", dice: "Why do you think so? A lot of neighbors have dogs." },
      {
        quien: "alumno",
        dice: "Because teenagers need a place to meet. Also, people can already walk their dogs in the park, although there isn't a dog area.",
        tarea: 4,
      },
      { quien: "personaje", dice: "Good points. But some people think skate parks are noisy." },
      { quien: "alumno", dice: "That's true, but the skate park can be far from the houses." },
      { quien: "personaje", dice: "I like that idea! Let's vote next week. Will you come?" },
      { quien: "alumno", dice: "I'm sorry, I can't. I'm going to Calgary on Friday." },
      { quien: "personaje", dice: "Oh, that's too bad! Will you visit Vancouver again?" },
      { quien: "alumno", dice: "I hope so! I love this city." },
      { quien: "personaje", dice: "Thank you for coming. It was nice to hear your opinion." },
      { quien: "alumno", dice: "Thank you, Ms. Wong. Good night!", tarea: 5 },
    ],
    ayudas: [
      "Say who you are and why you came.",
      "Say what you want and why.",
      "Say kindly if you agree or not.",
      "Choose one and give two reasons.",
      "Thank her and say goodbye.",
    ],
    resumen: "¡Lo lograste! Diste tu opinión en inglés con razones y la defendiste con amabilidad.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Vancouver en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"The park is big" → Yes, it is! And what do you think it needs?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Choose one and give two reasons."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Prefiero la pista de skate" → Sorry, in English, please! Which do you prefer?',
      },
      {
        situacion: "Da una opinión sin razón",
        accion: "Pregunta por qué, en personaje",
        ejemplo: '"The skate park." → Why do you think so?',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo: '"I am agree" → la escena sigue; en el resumen: Just say: I agree.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Ms. Wong: "Thank you for coming. See you next time!" En pantalla: Vamos a repasar cómo dar tu opinión y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["vancouver"],
      muestra: "Portada de la ciudad: los rascacielos junto al mar, el parque Stanley y las montañas con nieve al fondo",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-vancouver-reunion"],
      muestra: "Un salón comunal con sillas, un tablero con el dibujo del parque y ventanas con montañas",
      uso: "Escenario",
    },
    {
      archivos: ["f-salon-celulares"],
      muestra: "Un salón de clase con una caja llena de celulares en el escritorio del profesor",
      uso: "Lección 1 (paso 2)",
    },
    { archivos: ["f-uniformes"], muestra: "Tres estudiantes con el mismo uniforme", uso: "Lección 1 (paso 3)" },
    {
      archivos: ["f-parque-vancouver-1", "f-parque-vancouver-2", "f-parque-vancouver-3", "f-parque-vancouver-4"],
      muestra:
        "Los cuatro dibujos del parque, con el mismo fondo: sucio y sin luces, la reunión de vecinos, los dos grupos con sus dibujos, el parque nuevo",
      uso: "Lección 3 (paso 2)",
    },
  ],
};
