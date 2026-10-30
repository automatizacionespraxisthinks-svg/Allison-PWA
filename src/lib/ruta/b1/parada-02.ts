import type { Parada } from "../tipos.ts";

/**
 * Parada 2 · Montreal (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; las de A1 y A2 que se reutilizan llevan "a1/"
 * o "a2/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison (van a su ficha): de niña vivía en Queens, en Nueva York,
 *     con su mamá y Emily; jugaba fútbol en el parque con Emily los fines
 *     de semana; no le gustaba el café; no tenía mascota (Luna es la
 *     primera); en verano iban a la playa de Coney Island.
 *   · Liam: de niño pasaba los veranos con sus abuelos en un lago y
 *     pescaba con su abuelo.
 *   · Zoe: de niña veía dibujos animados los sábados, le tenía miedo a la
 *     oscuridad y le daba las verduras a su perro. Tiene un perro.
 *   · Mrs. Tremblay: solo en este escenario y en la lección 3; la abuela
 *     de Liam. Creció en Montreal, de niña le escribía cartas a su prima de
 *     Quebec y patinaba en el lago congelado del parque; su postre favorito
 *     es la torta de mantequilla de maní.
 */
export const PARADA_02: Parada = {
  numero: 2,
  ciudad: "Montreal",
  titulo: "Habla de tu infancia",
  gramatica: "Used to",
  objetivo:
    'Al terminar, el alumno cuenta cómo era su vida de niño y qué ha cambiado: "When I was a kid, I used to play in the street every day." Gramática: used to (I used to, I didn\'t use to, Did you use to…?). Usa A1, A2 y la parada 1 de B1, y nada de paradas posteriores (ni pasado perfecto, ni voz pasiva, ni condicionales).',
  fraseMeta: "When I was a kid, I used to play in the street every day.",
  portada: "montreal",
  vocabulario: [
    {
      grupo: "La infancia",
      ingles: "kid, little, grow up, toy, cartoons, playground, hide-and-seek, tag, neighborhood, grandparents",
      nota: '"Kid" y "grow up" de Estados Unidos; "cartoons" son los dibujos animados',
    },
    {
      grupo: "Antes y ahora",
      ingles: "used to, didn't use to, Did you use to…?, anymore, now, these days",
      nota: 'Con d solo en la afirmación ("I used to"); sin d en la negación y la pregunta ("I didn\'t use to", "Did you use to…?")',
    },
    {
      grupo: "Montreal y el invierno",
      ingles: "snow, skate, frozen, hockey, hot chocolate, mittens, sled",
      nota: '"Sled" es el trineo',
    },
    {
      grupo: "Frases",
      ingles: "When I was a kid, I used to… I didn't use to like… Did you use to…? I don't… anymore. I grew up in…",
      nota: '"Used to" es para lo que se hacía muchas veces y ya no; lo de una sola vez va en pasado: "I went to Disney once."',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Qué solías hacer?",
      objetivo: "Contar lo que alguien hacía muchas veces y ya no hace.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "When Liam was a kid, he used to spend every summer with his grandparents at a lake. He used to fish with his grandpa every morning. Now he prefers video games!" (no está escrito). Pregunta: ¿qué solía hacer Liam con su abuelo? Elige entre tres imágenes: un niño pescando con su abuelo en un lago, un niño jugando hockey y una bicicleta.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "When Liam was a kid, he used to spend every summer with his grandparents at a lake.",
            "He used to fish with his grandpa every morning.",
            "Now he prefers video games!",
          ],
          traduccion: [],
          pregunta: "¿Qué solía hacer Liam con su abuelo?",
          opciones: [
            { imagen: "f-nino-hockey", descripcion: "Un niño jugando hockey", dice: "Playing hockey" },
            { imagen: "a1/f-bicicleta", descripcion: "Una bicicleta", dice: "Riding a bike" },
            { imagen: "f-liam-pesca", descripcion: "Un niño pescando con su abuelo en un lago", dice: "Fishing with his grandpa" },
          ],
          correcta: 2,
          porRevisar: ["opciones: cada dibujo dice su nombre en inglés al elegirlo (dice), sin texto a la vista (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de Zoe de niña, en pijama, viendo dibujos animados en la TV un sábado por la mañana. Allison: "This is Zoe when she was six. What did she use to do on Saturday mornings?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: She used to…". Sin pista, Allison dice "She used to watch cartoons" y el alumno la repite. Si dice "She use to watch": "In the past: used to, with d."',
          imagen: "f-zoe-caricaturas",
          pregunta: "This is Zoe when she was six. What did she use to do on Saturday mornings?",
          respuesta: "She used to watch cartoons.",
          aceptadas: ["She used to watch", "Zoe used to watch", "She used to eat", "Zoe used to eat", "She watched cartoons."],
          pistas: ["Start with: She used to…"],
          explicaciones: [
            { siDice: "She use to watch", explicacion: "In the past: used to, with d.", es: "En pasado: used to, con d." },
            { siDice: "was used to", explicacion: "Just say: She used to watch cartoons.", es: "Solo di: She used to watch cartoons." },
            { siDice: "used to see", explicacion: "For TV, we say watch: She used to watch cartoons.", es: "Para la TV decimos watch: She used to watch cartoons." },
          ],
          porRevisar: ["aceptadas: también «She used to eat cereal» (el plato se ve tanto como la TV) y «Zoe used to watch cartoons»; explicaciones para «She was used to watch» y «used to see» (cambio del 30 de octubre de 2026)", "explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece:
            'Audio de Allison: "I used to live in a small town." Se practica que used to suene como una sola palabra, "iusta".',
          siRespondeMal:
            'Si dice "iused tu": "Listen: used to sounds like \'yoos-tuh\'. Say it: I used to live in a small town."',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "I used to live in a small town.",
          palabraDificil: "used to",
          consejo: "Listen: used to sounds like 'yoos-tuh'.",
          consejoEs: "Escucha: used to suena como 'iusta'.",
          porRevisar: ['consejoEs: traducción; usa "iusta" (el sonido que escribe "Qué aparece") en vez de \'yoos-tuh\''],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Antes y ahora",
      objetivo: "Comparar lo de antes con lo de ahora, con didn't use to y anymore.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe didn\'t use to like vegetables. She used to give them to her dog under the table! Now she loves salad." (no está escrito). Pregunta: ¿qué hacía Zoe con las verduras? Elige entre tres imágenes: una niña dándole verduras a su perro debajo de la mesa, una niña escondiendo verduras en una servilleta y una niña dándole verduras a su hermano.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe didn't use to like vegetables.",
            "She used to give them to her dog under the table!",
            "Now she loves salad.",
          ],
          traduccion: [],
          pregunta: "¿Qué hacía Zoe con las verduras?",
          opciones: [
            { imagen: "f-zoe-perro-verduras", descripcion: "Una niña dándole verduras a su perro debajo de la mesa", dice: "Giving vegetables to her dog" },
            { imagen: "f-nina-servilleta", descripcion: "Una niña escondiendo verduras en una servilleta", dice: "Hiding vegetables in a napkin" },
            { imagen: "f-nina-hermano-verduras", descripcion: "Una niña dándole verduras a su hermano", dice: "Giving vegetables to her brother" },
          ],
          correcta: 0,
          porRevisar: ["opciones: cada dibujo dice su nombre en inglés al elegirlo (dice), sin texto a la vista (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Antes vivía en un pueblo pequeño, pero ahora vivo en una ciudad grande." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló ("I used…", "…but now I…"). Si dice "I use to live": "In the past: used, with d." Si dice "I was used to live": "Just say: I used to live." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Antes vivía en un pueblo pequeño, pero ahora vivo en una ciudad grande.",
          respuesta: "I used to live in a small town, but now I live in a big city.",
          aceptadas: ["Before, I lived in a small town, but now I live in a big city.", "I used to live in a small village, but now I live in a big city.", "I lived in a small town before, but now I live in a big city."],
          palabras: [],
          partes: ["I used to live in a small town,", "but now I live in a big city."],
          explicaciones: [
            { siDice: "I use to live", explicacion: "In the past: used, with d.", es: "En pasado: used, con d." },
            { siDice: "I was used to live", explicacion: "Just say: I used to live.", es: "Di solo: I used to live." },
            { siDice: "town small", explicacion: "The adjective goes first: a small town.", es: "El adjetivo va primero: a small town." },
            { siDice: "city big", explicacion: "The adjective goes first: a big city.", es: "El adjetivo va primero: a big city." },
          ],
          porRevisar: ["aceptadas: también «I used to live in a small village, but now I live in a big city.» y «I lived in a small town before, but now I live in a big city.»; explicaciones para «town small», «city big» (cambio del 30 de octubre de 2026)", "explicaciones.es: traducciones"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about when you were a kid." Tres preguntas guía en pantalla: Where did you use to live? What did you use to play? What didn\'t you use to like? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "I use to play soccer" → Better: I used to play soccer. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Tell me about when you were a kid.",
          guias: ["Where did you use to live?", "What did you use to play?", "What didn't you use to like?"],
          modelo:
            "When I was a kid, I used to live in Tunja with my grandparents. I used to play soccer in the street every afternoon. My grandma used to make arepas on Sundays. I didn't use to like vegetables, but now I eat them. I don't live in Tunja anymore, but I visit it every December.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Cómo era antes",
      objetivo: "Contar en orden cómo era un día de antes, con used to.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam\'s grandma grew up in Montreal. Her cousin lived far away, in Quebec City. Liam\'s grandma used to write letters to her cousin every month." (no está escrito). Pregunta: ¿cómo se comunicaba la abuela con su prima? Elige entre una carta, un teléfono antiguo y un computador.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam's grandma grew up in Montreal.",
            "Her cousin lived far away, in Quebec City.",
            "Liam's grandma used to write letters to her cousin every month.",
          ],
          traduccion: [],
          pregunta: "¿Cómo se comunicaba la abuela con su prima?",
          opciones: [
            { imagen: "f-telefono-antiguo", descripcion: "Un teléfono antiguo", dice: "An old phone" },
            { imagen: "f-carta", descripcion: "Una carta", dice: "A letter" },
            { imagen: "a2/f-ben-computador", descripcion: "Un computador", dice: "A computer" },
          ],
          correcta: 1,
          porRevisar: ["audio: sin «there weren't any cell phones», que hacía oír phones junto al dibujo del teléfono antiguo; ahora dice que la prima vivía lejos y que la abuela le escribía cartas. Cada dibujo suena al elegirlo (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden de un día de invierno de la abuela de Liam cuando era niña, en Montreal: (1) se levantaba temprano y miraba la nieve por la ventana; (2) caminaba al colegio con guantes y bufanda; (3) después del colegio patinaba en el lago congelado del parque con sus amigas; (4) en la noche tomaba chocolate caliente en la cocina. Allison: "Tell me about a winter day when Liam\'s grandma was a girl." Debajo: first, then, after school, at night.',
          siRespondeMal:
            'Si dice "She use to skate", Allison repite bien la frase ("She used to skate on the frozen lake in the park.") y el alumno la dice. Si cuenta menos de 3 dibujos, Allison señala el que falta: "What happened next?"',
          tambienSeAcepta: 'El pasado simple en algunas frases: "After school, she skated on the river."',
          imagenes: ["f-abuela-invierno-1", "f-abuela-invierno-2", "f-abuela-invierno-3", "f-abuela-invierno-4"],
          dibujos: [
            "La abuela de Liam, de niña, se levantaba temprano y miraba la nieve por la ventana",
            "La abuela de Liam caminaba al colegio con guantes y bufanda",
            "Después del colegio, la abuela de Liam patinaba en el lago congelado del parque con sus amigas",
            "En la noche, la abuela de Liam tomaba chocolate caliente en la cocina",
          ],
          pregunta: "Tell me about a winter day when Liam's grandma was a girl.",
          debajo: ["first", "then", "after school", "at night"],
          modelo:
            "When she was a girl, she used to get up early and look at the snow. Then she used to walk to school in the snow. After school, she used to skate on the frozen lake in the park with her friends. At night, she used to drink hot chocolate in the kitchen.",
          verbos: ["used to get up", "used to walk", "used to skate", "used to drink"],
          gramatica: "used to + verb for things she did many times in the past (the past simple is also OK in some sentences)",
          explicaciones: [
            {
              siDice: "She use to skate",
              explicacion: "She used to skate on the frozen lake in the park.",
              es: "Se dice así: She used to skate on the frozen lake in the park.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            'dibujos: salen de "Qué aparece"; se agregó "la abuela de Liam" para que cada uno se entienda solo',
            "verbos: salen del modelo",
            "gramatica: escrita para el evaluador",
            "explicaciones.es: traducción (el documento solo da la frase bien dicha)",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: What did you use to play when you were little? Did you use to like school? What TV shows did you use to watch? Where did you use to live? What food didn't you use to like?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("Yes, I did."); Allison pide el detalle: "Tell me more!"',
          preguntas: [
            {
              pregunta: "What did you use to play when you were little?",
              modelo: "I used to play hide-and-seek with my cousins.",
            },
            { pregunta: "Did you use to like school?", modelo: "Yes, I did. I used to love my teacher." },
            { pregunta: "What TV shows did you use to watch?", modelo: "I used to watch cartoons every morning." },
            { pregunta: "Where did you use to live?", modelo: "I used to live in Cali, but now I live in Bogotá." },
            { pregunta: "What food didn't you use to like?", modelo: "I didn't use to like fish." },
          ],
          aceptadas: ["Yes, I did."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Entrevista a Allison",
      objetivo: "Preguntar con Did you use to…? y What did you use to…? por la infancia de alguien.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe used to be afraid of the dark. She used to sleep with the light on every night. Now she sleeps with the window open!" (no está escrito). Pregunta: ¿de qué tenía miedo Zoe? Elige entre una habitación oscura, un perro y una piscina.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe used to be afraid of the dark.",
            "She used to sleep with the light on every night.",
            "Now she sleeps with the window open!",
          ],
          traduccion: [],
          pregunta: "¿De qué tenía miedo Zoe?",
          opciones: [
            { imagen: "a1/f-perro", descripcion: "Un perro", dice: "Dogs" },
            { imagen: "a1/f-nadar", descripcion: "Una piscina", dice: "Swimming" },
            { imagen: "f-habitacion-oscura", descripcion: "Una habitación oscura", dice: "The dark" },
          ],
          correcta: 2,
          porRevisar: ["opciones: cada dibujo dice su nombre en inglés al elegirlo (dice), sin texto a la vista (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Cuando era niño no me gustaba leer, pero ahora leo todas las noches." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "I didn\'t used to like": "With didn\'t, no d: I didn\'t use to like." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Cuando era niño no me gustaba leer, pero ahora leo todas las noches.",
          respuesta: "When I was a kid, I didn't use to like reading, but now I read every night.",
          aceptadas: ["When I was little, I didn't like reading, but now I read every night.", "When I was a kid, I didn't like reading, but now I read every night.", "When I was a kid, I didn't like to read, but now I read every night.", "When I was a kid, I didn't use to like to read, but now I read every night.", "When I was little, I didn't use to like reading, but now I read every night."],
          palabras: [],
          partes: ["When I was a kid, I didn't use to like reading,", "but now I read every night."],
          explicaciones: [
            { siDice: "I didn't used to like", explicacion: "With didn't, no d: I didn't use to like.", es: "Con didn't, sin d: I didn't use to like." },
            { siDice: "all the nights", explicacion: "Say: every night.", es: "Di: every night." },
          ],
          porRevisar: [
            "aceptadas: también «When I was a kid, I didn't like reading, but now I read every night.» y «When I was a kid, I didn't like to read, but now I read every night.» y otras; explicaciones para «all the nights» (cambio del 30 de octubre de 2026)",
            "explicaciones.es: traducción",
            'partes: la frase empieza por When y además lleva but; se parte antes de but (antes / ahora), como "…but now I…" en la lección 2',
          ],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha de la infancia de Allison con cinco datos por descubrir: dónde vivía, a qué jugaba, qué no le gustaba, si tenía mascota y qué hacía en verano. Arma cada pregunta sin palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            'Una sola pista en inglés: "Ask me about my summers! Start with: What did you use to…?" Hay un botón de ayuda con la pregunta escrita.',
          tambienSeAcepta:
            'Cualquier pregunta que se entienda: "Where you lived when you were a kid?", "You had a pet?", "What you played?"',
          ficha: "la infancia de Allison",
          datos: [
            {
              dato: "Dónde vivía",
              pregunta: "Where did you use to live?",
              respuesta: "I used to live in Queens, in New York, with my mom and my sister Emily.",
            },
            {
              dato: "A qué jugaba",
              pregunta: "What did you use to play?",
              respuesta: "I used to play soccer in the park with Emily every weekend.",
            },
            {
              dato: "Qué no le gustaba",
              pregunta: "What didn't you use to like?",
              respuesta: "I didn't use to like coffee! Now I drink it every morning.",
            },
            {
              dato: "Si tenía mascota",
              pregunta: "Did you use to have a pet?",
              respuesta: "No, I didn't. Luna, my cat, is my first pet!",
            },
            {
              dato: "Qué hacía en verano",
              pregunta: "What did you use to do in the summer?",
              respuesta: "We used to go to the beach at Coney Island. I loved swimming!",
            },
          ],
          aceptadas: ["Where you lived when you were a kid?", "You had a pet?", "What you played?"],
          ayuda:
            'Una sola pista en inglés: "Ask me about my summers! Start with: What did you use to…?" Hay un botón de ayuda con la pregunta escrita.',
          minimoIntervenciones: 10,
          pistas: [
            "Ask me about my home! Start with: Where did you use to…?",
            "Ask me about my games! Start with: What did you use to…?",
            "Ask me about the things I didn't like! Start with: What didn't you use to…?",
            "Ask me about pets! Start with: Did you use to…?",
            "Ask me about my summers! Start with: What did you use to…?",
          ],
          porRevisar: [
            "pistas: solo la del verano (la quinta) está en el documento; las otras cuatro siguen su patrón",
          ],
        },
      ],
    },
  ],
  // Escenario: nada inventado. La tarea 4 es la que trae el imprevisto (el
  // texto entre comillas de la celda Imprevisto); el título va con
  // mayúscula inicial.
  escenario: {
    titulo: "Cena con los abuelos de Liam",
    imagen: "e-montreal-comedor",
    contexto:
      "Estás de intercambio en Montreal y eres alérgico al maní. Liam te invitó a cenar a casa de sus abuelos. La abuela, Mrs. Tremblay (Allison en su papel), te recibe y te pregunta por tu infancia mientras cenan.",
    personaje: "Mrs. Tremblay, la abuela de Liam en Montreal",
    objetivo:
      "Contar cómo era su infancia, preguntarle a Mrs. Tremblay por la suya y resolver con amabilidad un problema con el postre",
    tareas: [
      "Saluda y agradece la invitación.",
      "Cuenta qué solías hacer de niño.",
      "Pregúntale a Mrs. Tremblay cómo era Montreal cuando era niña.",
      "El postre tiene maní: explica con amabilidad que no puedes comerlo y por qué.",
      "Agradece la cena y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Mrs. Tremblay trae su postre favorito: una torta de mantequilla de maní. En esta escena eres alérgico al maní (lo dice el contexto en pantalla). Ahí aparece la tarea 4: "El postre tiene maní: explica con amabilidad que no puedes comerlo y por qué."',
      linea: "Ha! Now, here's my favorite dessert: peanut butter cake!",
    },
    dialogo: [
      { quien: "personaje", dice: "Welcome! Come in, it's cold outside. I'm Liam's grandma." },
      { quien: "alumno", dice: "Hello, Mrs. Tremblay! Thank you for inviting me.", tarea: 1 },
      { quien: "personaje", dice: "You're welcome! Liam says you're from Colombia. Is it your first time in the snow?" },
      { quien: "alumno", dice: "Yes, it is! I've never seen snow before." },
      { quien: "personaje", dice: "Ha! Sit down, please. So, what did you use to do when you were a kid?" },
      { quien: "alumno", dice: "I used to play soccer in the street with my cousins every afternoon.", tarea: 2 },
      { quien: "personaje", dice: "That sounds fun! Did you use to live in a big city?" },
      { quien: "alumno", dice: "No, I used to live in a small town, but now I live in Bogotá." },
      { quien: "personaje", dice: "And did you use to help your parents at home?" },
      { quien: "alumno", dice: "Yes. I used to wash the dishes after dinner. I didn't use to like it!" },
      { quien: "personaje", dice: "Ha! Liam didn't use to like it either." },
      { quien: "alumno", dice: "What was Montreal like when you were a girl?", tarea: 3 },
      {
        quien: "personaje",
        dice: "Oh, it was very different! There weren't so many cars, and we used to skate on the frozen lake in the park every winter.",
      },
      { quien: "alumno", dice: "Wow! Did you use to skate every day?" },
      { quien: "personaje", dice: "Almost every day! And we didn't use to have a TV in every room." },
      { quien: "alumno", dice: "That's so different! We have three TVs at home." },
      { quien: "personaje", dice: "Ha! Now, here's my favorite dessert: peanut butter cake!" },
      { quien: "alumno", dice: "Oh no, I'm so sorry. I can't eat peanuts. I'm allergic to them.", tarea: 4 },
      { quien: "personaje", dice: "Oh dear! Thank you for telling me. Would you like some fruit instead?" },
      { quien: "alumno", dice: "Yes, please. That's very kind." },
      { quien: "personaje", dice: "Here you go. Do you like apples?" },
      { quien: "alumno", dice: "I love apples! When I was little, I used to eat a lot of mangoes." },
      { quien: "personaje", dice: "Mangoes! How lovely. It was a pleasure to meet you!" },
      { quien: "alumno", dice: "Thank you for dinner, Mrs. Tremblay. It was delicious. Good night!", tarea: 5 },
    ],
    ayudas: [
      "Thank her for the invitation.",
      "Say what you used to do as a kid.",
      "Ask what Montreal was like when she was a girl.",
      "Say kindly that you can't eat it, and why.",
      "Thank her and say goodbye.",
    ],
    resumen: "¡Lo lograste! Contaste en inglés cómo era tu infancia y resolviste con amabilidad lo del postre.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Montreal en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like the food" → Thank you! And when you were little, what did you use to play?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Say what you used to do as a kid."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Soy alérgico" → Sorry, in English, please! Can you eat it?',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo: '"I use to play soccer" → la escena sigue; en el resumen: In the past: used to, with d.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Mrs. Tremblay: "It was lovely to meet you! Come back soon." En pantalla: Vamos a repasar used to y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["montreal"],
      muestra: "Portada de la ciudad: las calles de piedra del Viejo Montreal, la basílica y el río San Lorenzo",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-montreal-comedor"],
      muestra: "El comedor de una casa antigua con la mesa servida y nieve por la ventana",
      uso: "Escenario",
    },
    {
      archivos: ["f-liam-pesca", "f-nino-hockey"],
      muestra: "Liam de niño pescando con su abuelo en un lago; un niño jugando hockey",
      uso: "Lección 1 (paso 1)",
    },
    { archivos: ["a1/f-bicicleta"], muestra: "Una bicicleta (de A1)", uso: "Lección 1 (paso 1)" },
    {
      archivos: ["f-zoe-caricaturas"],
      muestra: "Zoe de niña, en pijama, viendo dibujos animados un sábado",
      uso: "Lección 1 (paso 2)",
    },
    {
      archivos: ["f-zoe-perro-verduras", "f-nina-servilleta", "f-nina-hermano-verduras"],
      muestra:
        "Una niña dándole verduras a su perro debajo de la mesa; escondiéndolas en una servilleta; dándoselas a su hermano",
      uso: "Lección 2 (paso 1)",
    },
    {
      archivos: ["f-carta", "f-telefono-antiguo"],
      muestra: "Una carta con sobre; un teléfono antiguo de disco",
      uso: "Lección 3 (paso 1)",
    },
    {
      archivos: ["a2/f-ben-computador"],
      muestra: 'Ben (de A2) frente a su computador; se usa como "un computador"',
      uso: "Lección 3 (paso 1)",
    },
    {
      archivos: ["f-abuela-invierno-1", "f-abuela-invierno-2", "f-abuela-invierno-3", "f-abuela-invierno-4"],
      muestra:
        "Los cuatro dibujos del día de invierno de la abuela de Liam de niña: la ventana con nieve, el camino al colegio, el lago congelado del parque, el chocolate caliente",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["f-habitacion-oscura"],
      muestra: "Una habitación oscura con una niña asustada bajo la cobija",
      uso: "Lección 4 (paso 1)",
    },
    { archivos: ["a1/f-perro", "a1/f-nadar"], muestra: "Un perro; una piscina (de A1)", uso: "Lección 4 (paso 1)" },
  ],
};
