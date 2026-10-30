import type { Parada } from "../tipos.ts";

/**
 * Parada 10 · Niagara (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; las de A1 y A2 que se reutilizan llevan su
 * carpeta delante. Las opciones de Escucha y elige son tarjetas que dibuja
 * la app.
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison (va a su ficha): si ganara mucho dinero, llevaría a Emily de
 *     viaje a Colombia. Lo demás ya está en su ficha: quiere ir a
 *     Cartagena, no tiene futbolista favorito, no sabe cantar y le gusta
 *     el pop.
 *   · Zoe: si ganara el concurso, compraría un palo de hockey y llevaría a
 *     su mamá a un concierto. Si pudiera vivir en cualquier parte, viviría
 *     en Vancouver, pero extrañaría a sus amigos.
 *   · Liam: toma clases de guitarra los sábados y sueña con tener una
 *     banda. Los domingos le va a enseñar guitarra a su abuela.
 *   · Dee: solo en este escenario: la locutora de una emisora de Niagara.
 */
export const PARADA_10: Parada = {
  numero: 10,
  ciudad: "Niagara",
  titulo: "Imagina situaciones",
  gramatica: "Condicional 2: if + would",
  objetivo:
    'Al terminar, el alumno imagina situaciones que no son reales y dice qué haría: "If I won the prize, I would travel around the world." Gramática: condicional 2 (if + pasado, would + verbo) e If I were you. Usa todo B1.',
  fraseMeta: "If I won the prize, I would travel around the world.",
  portada: "niagara",
  vocabulario: [
    {
      grupo: "Condicional 2",
      ingles: "If + pasado, would + verbo: If I won the prize, I would travel. If I had more time, I'd learn the piano.",
      nota: 'Es para lo imaginado, no para lo probable. Después de if va el pasado, nunca would: "If I had", nunca "If I would have"',
    },
    {
      grupo: "If I were",
      ingles: "If I were you, I'd… If I were rich…",
      nota: 'La app enseña "If I were"; en Estados Unidos también se oye "If I was" al hablar',
    },
    {
      grupo: "La radio y los concursos",
      ingles: "radio station, contest, prize, winner, caller, host, live, question",
      nota: '"Contest" de Estados Unidos; "competition" también se entiende',
    },
    {
      grupo: "Frases",
      ingles: "What would you do if…? If I were you, I would… I'd love to… I wouldn't…",
      nota: '"I\'d" es "I would" corto: "I\'d travel"',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Si ganara…",
      objetivo: "Decir qué harías en una situación imaginada, con if + pasado y would.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe is entering a radio contest. If she won, she would buy a new hockey stick and take her mom to a concert. She says she wouldn\'t spend all the money!" (no está escrito). Pregunta: ¿qué haría Zoe si ganara? Elige entre tres tarjetas dibujadas por la app: Buy a hockey stick and go to a concert / Buy a car / Travel to Europe.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe is entering a radio contest.",
            "If she won, she would buy a new hockey stick and take her mom to a concert.",
            "She says she wouldn't spend all the money!",
          ],
          traduccion: [],
          pregunta: "¿Qué haría Zoe si ganara?",
          opciones: [
            { texto: "Buy a car", descripcion: "Buy a car" },
            { texto: "Buy a hockey stick and go to a concert", descripcion: "Buy a hockey stick and go to a concert" },
            { texto: "Travel to Europe", descripcion: "Travel to Europe" },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de un muchacho con un balón mirando la lluvia por la ventana. Allison: "It\'s raining, so he can\'t play soccer. What would he do if it were sunny?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: He would…". Sin pista, Allison dice "If it were sunny, he would play soccer" y el alumno la repite. Si dice "he will play": "It\'s imagined: he would play."',
          imagen: "f-lluvia-ventana",
          pregunta: "It's raining, so he can't play soccer. What would he do if it were sunny?",
          respuesta: "If it were sunny, he would play soccer.",
          aceptadas: ["He would play soccer.", "He'd play soccer outside.", "If it was sunny, he'd play soccer."],
          pistas: ["Start with: He would…"],
          explicaciones: [
            { siDice: "he will play", explicacion: "It's imagined: he would play.", es: "Es algo imaginado: he would play." },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "If I had more time, I\'d travel more." Se practica que se oiga la d corta de I\'d.',
          siRespondeMal: 'Si dice "I travel" sin la d: "Listen: I\'d, short for I would. Say it: If I had more time, I\'d travel more."',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "If I had more time, I'd travel more.",
          palabraDificil: "I'd",
          consejo: "Listen: I'd, short for I would.",
          consejoEs: "Escucha: I'd, la forma corta de I would.",
          porRevisar: ["consejoEs: traducción"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "¿Qué harías tú?",
      objetivo: "Imaginar qué harías tú en una situación que no es real.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam\'s dream is to play in a band. If he could play the guitar well, he would start a band with his friends. Right now he\'s taking guitar lessons on Saturdays." (no está escrito). Pregunta: ¿qué haría Liam si tocara bien la guitarra? Elige entre tres tarjetas dibujadas por la app: Start a band / Write songs / Play in the street.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam's dream is to play in a band.",
            "If he could play the guitar well, he would start a band with his friends.",
            "Right now he's taking guitar lessons on Saturdays.",
          ],
          traduccion: [],
          pregunta: "¿Qué haría Liam si tocara bien la guitarra?",
          opciones: [
            { texto: "Write songs", descripcion: "Write songs" },
            { texto: "Play in the street", descripcion: "Play in the street" },
            { texto: "Start a band", descripcion: "Start a band" },
          ],
          correcta: 2,
          porRevisar: ["opciones: «Write songs» en vez de «Teach his friends», que tomaba friends de la respuesta (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Si ganara el premio, viajaría por el mundo con mi familia, porque nos encanta viajar juntos." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "If I would win": "After if, use the past: If I won." Si dice "I will travel": "It\'s imagined: I would travel." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Si ganara el premio, viajaría por el mundo con mi familia, porque nos encanta viajar juntos.",
          respuesta: "If I won the prize, I would travel around the world with my family, because we love traveling together.",
          aceptadas: ["If I won the prize, I'd travel around the world with my family, because we love traveling together."],
          palabras: [],
          partes: ["If I won the prize, I would travel around the world with my family,", "because we love traveling together."],
          explicaciones: [
            { siDice: "If I would win", explicacion: "After if, use the past: If I won.", es: "Después de if, usa el pasado: If I won." },
            { siDice: "I will travel", explicacion: "It's imagined: I would travel.", es: "Es algo imaginado: I would travel." },
          ],
          porRevisar: [
            "explicaciones.es: traducciones",
            "partes: la frase empieza por if y también lleva because; se partió justo antes de because, la palabra que une",
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "What would you do if you had a whole year off?" Tres preguntas guía: Where would you go? What would you learn? Who would you spend it with? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "If I would have a year off" → Better: If I had a year off. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "What would you do if you had a whole year off?",
          guias: ["Where would you go?", "What would you learn?", "Who would you spend it with?"],
          modelo:
            "If I had a whole year off, I would travel around South America. First, I would visit my cousins in Lima. I would learn to surf in Brazil, because I've never tried it. I would take my best friend with me, because she loves traveling. If I had enough money, I would also go to Canada to see the snow!",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Si yo fuera…",
      objetivo: "Contar en orden lo que alguien haría en una situación imaginada.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "If Zoe could live anywhere, she would live in Vancouver, near the ocean. But she says she would miss her friends in Toronto. So for now, she\'s happy at home!" (no está escrito). Pregunta: ¿dónde viviría Zoe si pudiera? Elige entre tres tarjetas dibujadas por la app: In Vancouver / In Toronto / In Montreal.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "If Zoe could live anywhere, she would live in Vancouver, near the ocean.",
            "But she says she would miss her friends in Toronto.",
            "So for now, she's happy at home!",
          ],
          traduccion: [],
          pregunta: "¿Dónde viviría Zoe si pudiera?",
          // La correcta se deja primera, como en el documento: en esta parada
          // queda en 1, 2, 0 y 1.
          opciones: [
            { texto: "In Vancouver", descripcion: "In Vancouver" },
            { texto: "In Toronto", descripcion: "In Toronto" },
            { texto: "In Montreal", descripcion: "In Montreal" },
          ],
          correcta: 0,
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden de lo que haría Liam si fuera el rector del colegio por un día: (1) el colegio empieza a las diez; (2) pizza en el almuerzo; (3) la tarde libre para hacer deporte; (4) un calendario con el viernes marcado y un cuaderno de tareas tachado. Allison: "Tell me what Liam would do if he were the principal for a day." Debajo: if he were…, first, then, and.',
          siRespondeMal:
            'Si dice "school will start at ten": "It\'s imagined: school would start." Allison repite bien la frase y el alumno la dice. Si cuenta menos de 3 dibujos, Allison señala el que falta: "What else would he do?"',
          tambienSeAcepta: "Cualquier narración con would y wouldn't, aunque cambien las palabras",
          imagenes: ["f-rector-1", "f-rector-2", "f-rector-3", "f-rector-4"],
          dibujos: [
            "el colegio empieza a las diez",
            "pizza en el almuerzo",
            "la tarde libre para hacer deporte",
            "un calendario con el viernes marcado y un cuaderno de tareas tachado",
          ],
          pregunta: "Tell me what Liam would do if he were the principal for a day.",
          debajo: ["if he were…", "first", "then", "and"],
          modelo:
            "If Liam were the principal for a day, first, school would start at ten. Then, there would be pizza for lunch. In the afternoon, he would give everyone free time for sports. And he wouldn't give any homework on Fridays!",
          verbos: ["would start", "would be", "would give", "wouldn't give"],
          gramatica: "second conditional: if + past (if he were), would / wouldn't + verb",
          explicaciones: [
            {
              siDice: "school will start at ten",
              explicacion: "It's imagined: school would start.",
              es: "Es algo imaginado: school would start.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            "verbos: salen del modelo",
            "gramatica: escrita para el evaluador; no está en el documento",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: What would you do if you won a lot of money? If you could meet a famous person, who would you meet? Where would you live if you could live anywhere? What would you change at your school? If you were an animal, what would you be?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("A cat."); Allison pide la frase completa',
          preguntas: [
            { pregunta: "What would you do if you won a lot of money?", modelo: "I would buy a house for my parents." },
            { pregunta: "If you could meet a famous person, who would you meet?", modelo: "I would meet Luis Díaz, because he's my favorite player." },
            { pregunta: "Where would you live if you could live anywhere?", modelo: "I would live in Japan, because I love anime." },
            { pregunta: "What would you change at your school?", modelo: "I would make the breaks longer." },
            { pregunta: "If you were an animal, what would you be?", modelo: "I would be a cat, because they sleep all day!" },
          ],
          aceptadas: ["A cat."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Entrevista a Allison",
      objetivo:
        "Preguntarle a alguien qué haría en una situación imaginada, con What would you do if…?, y dar un consejo con If I were you.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam\'s grandma says that if she were young again, she would learn to play the guitar. Liam thinks it\'s never too late. He\'s going to teach her the songs he knows on Sundays!" (no está escrito). Pregunta: ¿qué va a hacer Liam los domingos? Elige entre tres tarjetas dibujadas por la app: Teach his grandma the guitar / Play hockey / Visit the library.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam's grandma says that if she were young again, she would learn to play the guitar.",
            "Liam thinks it's never too late.",
            "He's going to teach her the songs he knows on Sundays!",
          ],
          traduccion: [],
          pregunta: "¿Qué va a hacer Liam los domingos?",
          opciones: [
            { texto: "Play hockey", descripcion: "Play hockey" },
            { texto: "Teach his grandma the guitar", descripcion: "Teach his grandma the guitar" },
            { texto: "Visit the library", descripcion: "Visit the library" },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Si yo fuera tú, practicaría inglés todos los días, porque mejorarías muy rápido." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "If I was you", cuenta como bien y Allison dice: "Good! In the app we say: If I were you." Si dice "I will practice": "It\'s imagined: I would practice." Al segundo fallo dice la frase completa y el alumno la repite.',
          // La celda trae una forma y una regla ("También cuenta como bien…
          // (ver la nota)"): va entera aquí y las dos formas, en aceptadas.
          tambienSeAcepta:
            'If I were you, I\'d practice English every day, because you\'d improve really fast. También cuenta como bien "If I was you, I\'d practice English every day, because you\'d improve really fast." (ver la nota)',
          espanol: "Si yo fuera tú, practicaría inglés todos los días, porque mejorarías muy rápido.",
          respuesta: "If I were you, I would practice English every day, because you would improve very fast.",
          aceptadas: [
            "If I were you, I'd practice English every day, because you'd improve really fast.",
            "If I was you, I'd practice English every day, because you'd improve really fast.",
          ],
          palabras: [],
          partes: ["If I were you, I would practice English every day,", "because you would improve very fast."],
          explicaciones: [
            {
              siDice: "If I was you",
              explicacion: "Good! In the app we say: If I were you.",
              es: "¡Bien! En la app decimos: If I were you.",
            },
            { siDice: "I will practice", explicacion: "It's imagined: I would practice.", es: "Es algo imaginado: I would practice." },
          ],
          porRevisar: [
            "explicaciones.es: traducciones",
            'explicaciones: "If I was you" cuenta como bien; Allison solo dice cómo se dice en la app',
            "partes: la frase empieza por if y también lleva because; se partió justo antes de because, la palabra que une",
          ],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            '¿Qué haría Allison? Ficha con cinco datos por descubrir: qué ciudad de Colombia visitaría, a qué futbolista conocería, qué haría si ganara mucho dinero, qué haría con un día libre y qué cantaría si supiera cantar. Arma cada pregunta sin palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            'Una sola pista en inglés: "Ask me about Colombia! Start with: If you could visit…" Hay un botón de ayuda con la pregunta escrita.',
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "Which city you would visit?", "If you win money, what you would do?"',
          ficha: "lo que haría Allison",
          // "Lo que responde Allison en la Entrevista (sale de esta tabla y de
          // su ficha; lo nuevo se marca abajo)".
          datos: [
            {
              dato: "Una ciudad de Colombia",
              pregunta: "If you could visit any city in Colombia, which one would you visit?",
              respuesta: "I would visit Cartagena, because I've never been there!",
            },
            {
              dato: "Un futbolista",
              pregunta: "If you could meet any soccer player, who would you meet?",
              respuesta: "I don't have a favorite player, so I would meet the whole Colombian team! Go Colombia!",
            },
            {
              dato: "Si ganara mucho dinero",
              pregunta: "What would you do if you won a lot of money?",
              respuesta: "I would take my sister Emily on a trip to Colombia!",
            },
            {
              dato: "Un día libre",
              pregunta: "What would you do if you had a free day tomorrow?",
              respuesta: "I would walk in the park and cook something Colombian.",
            },
            {
              dato: "Si supiera cantar",
              pregunta: "If you could sing, what would you sing?",
              respuesta: "I can't sing! But if I could, I would sing pop songs.",
            },
          ],
          aceptadas: ["Which city you would visit?", "If you win money, what you would do?"],
          ayuda:
            'Una sola pista en inglés: "Ask me about Colombia! Start with: If you could visit…" Hay un botón de ayuda con la pregunta escrita.',
          minimoIntervenciones: 10,
          pistas: [
            "Ask me about Colombia! Start with: If you could visit…",
            "Ask me about soccer! Start with: If you could meet…",
            "Ask me about money! Start with: What would you do if you won…",
            "Ask me about a free day! Start with: What would you do if you had…",
            "Ask me about singing! Start with: If you could sing…",
          ],
          porRevisar: [
            'ficha: sale de "¿Qué haría Allison?"',
            "pistas: la primera es la del documento; las otras cuatro se escribieron con el mismo patrón (sin signo de pregunta al final, como la primera)",
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "El concurso de radio",
    imagen: "e-niagara-radio",
    contexto:
      "Estás en Niagara Falls con tu familia anfitriona y llamas a un concurso de radio en vivo. Dee, la locutora (Allison en su papel), te hace preguntas al aire. En dos días viajas a Vancouver, la última parada antes de volver a Colombia.",
    personaje: "Dee, la locutora de una emisora de radio de Niagara",
    objetivo: "Imaginar qué haría en varias situaciones, ganar el concurso y decidir qué hacer con un premio que no puede usar",
    // Las tareas 1, 2, 3 y 5 son las de "Tareas visibles"; la 4 aparece con
    // el imprevisto.
    tareas: [
      "Saluda y di de dónde eres y dónde estás.",
      "Responde qué harías si ganaras el premio.",
      "Responde la pregunta del concurso.",
      "Ganaste un viaje que no puedes hacer: decide qué harías con el premio y explica por qué.",
      "Agradece y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Dee anuncia que ganaste: un fin de semana para dos en Montreal, y el tren sale mañana, pero tú viajas a Vancouver en dos días. Ahí aparece la tarea 4: "Ganaste un viaje que no puedes hacer: decide qué harías con el premio y explica por qué."',
      linea: "Delicious! And… you're our winner! You won a weekend for two in Montreal. The train leaves tomorrow morning!",
    },
    // "Diálogo de ejemplo (12 intervenciones del alumno)". Las tareas 2 y 3 se
    // cumplen con dos líneas y la 4 con tres ("Decide qué harías" y "Explica
    // por qué"): todas llevan el número.
    dialogo: [
      { quien: "personaje", dice: "Hello, caller! You're live on Niagara FM. Where are you calling from?" },
      { quien: "alumno", dice: "Hi, Dee! I'm calling from Niagara Falls. I'm from Colombia, and I'm visiting Canada.", tarea: 1 },
      { quien: "personaje", dice: "Welcome to Canada! Are you ready for the contest?" },
      { quien: "alumno", dice: "Yes, I'm ready! I'm a little nervous." },
      { quien: "personaje", dice: "Don't worry! First question: what would you do if you won our big prize?" },
      { quien: "alumno", dice: "If I won the prize, I would travel around the world with my family.", tarea: 2 },
      { quien: "personaje", dice: "Wonderful! Which country would you visit first?" },
      { quien: "alumno", dice: "I would visit Japan first, because I love Japanese food.", tarea: 2 },
      {
        quien: "personaje",
        dice: "Great answer. Now the contest question: if you were a tour guide in your city, what would you show us?",
      },
      {
        quien: "alumno",
        dice: "If I were a tour guide in Bogotá, I would show you Monserrate. You would see the whole city from there.",
        tarea: 3,
      },
      { quien: "personaje", dice: "That sounds amazing! And what would we eat?" },
      { quien: "alumno", dice: "You would eat ajiaco. It's a soup that everyone loves in Bogotá.", tarea: 3 },
      // (imprevisto)
      {
        quien: "personaje",
        dice: "Delicious! And… you're our winner! You won a weekend for two in Montreal. The train leaves tomorrow morning!",
      },
      { quien: "alumno", dice: "Really? Thank you! But I'm flying to Vancouver in two days.", tarea: 4 },
      { quien: "personaje", dice: "Oh no! So what would you do?" },
      {
        quien: "alumno",
        dice: "If I went tomorrow, I would miss my flight to Vancouver. Could I give the prize to my host family?",
        tarea: 4,
      },
      { quien: "personaje", dice: "Of course! That's very generous." },
      { quien: "alumno", dice: "They've been so nice to me. If they got this trip, they would be so happy.", tarea: 4 },
      { quien: "personaje", dice: "I love that! Who would go?" },
      { quien: "alumno", dice: "I think my host parents would go together. They never travel!" },
      { quien: "personaje", dice: "Perfect! Thank you for calling, and enjoy your last days in Canada!" },
      { quien: "alumno", dice: "Thank you, Dee! This is the best day of my trip." },
      { quien: "personaje", dice: "Bye, everybody, and stay tuned!" },
      { quien: "alumno", dice: "Bye!", tarea: 5 },
    ],
    // "Ayuda (menos que en A2)": "La idea de la tarea actual, en inglés y sin
    // la frase (…). Apaga una estrella".
    ayudas: [
      "Say where you're from and where you are.",
      "Say what you would do with the prize.",
      "Answer the contest question with would.",
      "Say what you would do with the trip, and why.",
      "Thank her and say goodbye.",
    ],
    resumen: "¡Lo lograste! Imaginaste en inglés qué harías en varias situaciones y decidiste qué hacer con tu premio.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Niagara en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like the radio" → Thank you! So, what would you do if you won?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Say what you would do with the prize."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Viajaría con mi familia" → Sorry, in English, please! What would you do?',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again? Our phone line isn't very good!",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo: '"If I would win, I will travel" → la escena sigue; en el resumen: If I won, I would travel.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Dee: "Thanks for calling! Good luck next time!" En pantalla: Vamos a repasar el condicional con if y would y lo intentas de nuevo.',
      },
    ],
    // Duración: "Mínimo 12 intervenciones; al cumplirlas, la app avisa y el
    // alumno puede seguir hablando si quiere".
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["niagara"],
      muestra: "Portada de la ciudad: las cataratas del Niágara con un barco abajo y un arcoíris",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-niagara-radio"],
      muestra: "Un estudio de radio con micrófonos, audífonos y una ventana con las cataratas al fondo",
      uso: "Escenario",
    },
    {
      archivos: ["f-lluvia-ventana"],
      muestra: "Un muchacho con un balón mirando la lluvia por la ventana",
      uso: "Lección 1 (paso 2)",
    },
    {
      archivos: ["f-rector-1", "f-rector-2", "f-rector-3", "f-rector-4"],
      muestra:
        "Los cuatro dibujos de Liam como rector por un día, con el mismo colegio: el reloj de entrada a las diez, la pizza del almuerzo, la tarde de deporte, el calendario con el viernes marcado y un cuaderno de tareas tachado",
      uso: "Lección 3 (paso 2)",
    },
  ],
};
