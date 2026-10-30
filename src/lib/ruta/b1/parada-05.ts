import type { Parada } from "../tipos.ts";

/**
 * Parada 5 · Calgary (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; la de A2 que se reutiliza lleva "a2/".
 *
 * Datos nuevos de personajes (aprobados el 17 de octubre de 2026):
 *   · Allison (va a su ficha): nunca ha ido al Carnaval de Barranquilla. Lo
 *     demás ya está en su ficha: le encanta bailar y baila cuando está estresada.
 *   · Zoe: juega hockey desde los seis años y es la capitana de su equipo.
 *     Desde septiembre ahorra para una bicicleta nueva (la suya se la
 *     robaron, parada 3) paseando el perro de su vecino.
 *   · Liam: es voluntario en una biblioteca de Montreal desde enero: los
 *     miércoles les lee cuentos a niños. Su mamá es panadera desde hace 15
 *     años y se levanta a las cuatro.
 *   · Ms. Clark: solo en este escenario, la directora de un campamento de
 *     verano cerca de Calgary.
 */
export const PARADA_05: Parada = {
  numero: 5,
  ciudad: "Calgary",
  titulo: "Supera una entrevista",
  gramatica: "Presente perfecto continuo",
  objetivo:
    'Al terminar, el alumno cuenta qué ha estado haciendo y desde cuándo: "I\'ve been studying English for three years." Gramática: presente perfecto continuo (have been + -ing) con for, since y How long…? Usa todo lo anterior y nada de paradas posteriores (ni voz pasiva, ni condicionales, ni might).',
  // En el mapa va con un * delante: es la marca de los ajustes aprobados, no parte de la frase.
  fraseMeta: "I've been studying English for three years.",
  portada: "calgary",
  vocabulario: [
    {
      grupo: "Desde cuándo",
      ingles: "for, since, How long have you been…?, all day, lately, recently",
      nota: '"For" con un tiempo (for two years); "since" con un momento (since 2023, since I was ten)',
    },
    {
      grupo: "Lo que vienes haciendo",
      ingles: "have been studying, has been working, have been practicing",
      nota: 'Like, know y want no van con -ing: "I\'ve known her for years", nunca "I\'ve been knowing"',
    },
    {
      grupo: "El campamento",
      ingles: "summer camp, junior counselor, kids, activities, swimming pool, lifeguard, volunteer, schedule",
      nota: '"Counselor" es el monitor del campamento en Estados Unidos y Canadá',
    },
    {
      grupo: "Frases",
      ingles:
        "I've been volunteering at a library since January. How long have you been…? I've been practicing every weekend. I'm good with kids.",
      nota: '"Since January", nunca "since three months"',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Desde cuándo?",
      objetivo: "Decir qué vienes haciendo y desde cuándo, con for y since.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe has been playing hockey since she was six. She has been practicing every Sunday morning for ten years. Now she\'s the captain of her team!" (no está escrito). Pregunta: ¿desde cuándo juega hockey Zoe? Elige entre tres tarjetas dibujadas por la app: Since she was six. / Since she was twelve. / Since last summer.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe has been playing hockey since she was six.",
            "She has been practicing every Sunday morning for ten years.",
            "Now she's the captain of her team!",
          ],
          traduccion: [],
          pregunta: "¿Desde cuándo juega hockey Zoe?",
          opciones: [
            { texto: "Since she was twelve.", descripcion: "Since she was twelve." },
            { texto: "Since she was six.", descripcion: "Since she was six." },
            { texto: "Since last summer.", descripcion: "Since last summer." },
          ],
          correcta: 1,
          porRevisar: ["opciones: «Since she was twelve.» y «Since last summer.»; antes los distractores tomaban el ten y el six que se oyen en la historia (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo: Liam cansado y sudado en una cancha de tenis. Dos relojes dibujados por la app: empezó a las 4:00 y ahora son las 6:00. Allison: "Liam started playing tennis at four o\'clock. It\'s six o\'clock now. How long has he been playing?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: He\'s been…". Sin pista, Allison dice "He\'s been playing tennis for two hours" y el alumno la repite. Si dice "He is playing tennis for two hours": "From then until now: he\'s been playing."',
          imagen: "f-liam-tenis",
          relojes: [
            { hora: "4:00", etiqueta: "He started" },
            { hora: "6:00", etiqueta: "Now" },
          ],
          pregunta: "Liam started playing tennis at four o'clock. It's six o'clock now. How long has he been playing?",
          respuesta: "He's been playing for two hours.",
          aceptadas: ["He's been playing tennis for two hours.", "has been playing for two hours", "has been playing tennis for two hours", "has been playing since four", "has been playing tennis since four", "Liam's been playing for two hours", "Liam's been playing tennis for two hours"],
          pistas: ["Start with: He's been…"],
          explicaciones: [
            { siDice: "He is playing tennis for two hours", explicacion: "From then until now: he's been playing.", es: "Desde entonces hasta ahora: he's been playing." },
            { siDice: "is playing", explicacion: "From then until now: he's been playing.", es: "Desde entonces hasta ahora: he's been playing." },
            { siDice: "for two hours", explicacion: "Right, two hours! Now say it all: He's been playing for two hours.", es: "¡Sí, dos horas! Ahora dilo completo: He's been playing for two hours." },
          ],
          porRevisar: [
            "aceptadas: también «Liam has been playing for two hours» y «since four»; explicaciones para «He's playing for two hours» y para la respuesta corta «For two hours» (cambio del 30 de octubre de 2026)",
            "explicaciones.es: traducción",
            'relojes: las etiquetas en inglés ("He started", "Now") no están escritas en el documento',
          ],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "I\'ve been waiting for an hour." Se practica que been suene corto, "bin".',
          siRespondeMal: 'Si dice "biin", largo: "Listen: been is short, like \'bin\'. Say it: I\'ve been waiting for an hour."',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "I've been waiting for an hour.",
          palabraDificil: "been",
          consejo: "Listen: been is short, like 'bin'.",
          consejoEs: "Escucha: been es corto, como 'bin'.",
          porRevisar: ["consejoEs: traducción"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Tu experiencia",
      objetivo: "Contar tu experiencia con el presente perfecto continuo, como en una entrevista.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam has been volunteering at a library in Montreal since January. Every Wednesday afternoon, he reads stories to little kids. He loves it!" (no está escrito). Pregunta: ¿qué hace Liam los miércoles? Elige entre tres imágenes de Liam: leyéndoles cuentos a niños, organizando libros en un estante y estudiando en una mesa.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam has been volunteering at a library in Montreal since January.",
            "Every Wednesday afternoon, he reads stories to little kids.",
            "He loves it!",
          ],
          traduccion: [],
          pregunta: "¿Qué hace Liam los miércoles?",
          opciones: [
            { imagen: "f-liam-libros", descripcion: "Liam organizando libros en un estante", dice: "Putting books on a shelf" },
            { imagen: "f-liam-estudiando", descripcion: "Liam estudiando en una mesa", dice: "Studying at a table" },
            { imagen: "f-liam-cuentos", descripcion: "Liam leyéndoles cuentos a niños", dice: "Reading stories to kids" },
          ],
          correcta: 2,
          porRevisar: ["opciones: cada dibujo dice su nombre en inglés al elegirlo (dice), sin texto a la vista (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "He estado estudiando inglés por tres años, pero todavía estoy aprendiendo." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "since three years": "For a period of time, use for: for three years." Si dice "I\'m studying English for three years": "From then until now: I\'ve been studying." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "He estado estudiando inglés por tres años, pero todavía estoy aprendiendo.",
          respuesta: "I've been studying English for three years, but I'm still learning.",
          aceptadas: ["I have been learning English for three years, but I'm still learning."],
          palabras: [],
          partes: ["I've been studying English for three years,", "but I'm still learning."],
          explicaciones: [
            {
              siDice: "since three years",
              explicacion: "For a period of time, use for: for three years.",
              es: "Para un período de tiempo, usa for: for three years.",
            },
            {
              siDice: "I'm studying English for three years",
              explicacion: "From then until now: I've been studying.",
              es: "Desde entonces hasta ahora: I've been studying.",
            },
          ],
          porRevisar: ["explicaciones.es: traducciones"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about something you\'ve been doing for a long time." Tres preguntas guía: What have you been doing? How long have you been doing it? Why do you like it? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "I play the guitar since two years" → Better: I\'ve been playing the guitar for two years. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Tell me about something you've been doing for a long time.",
          guias: ["What have you been doing?", "How long have you been doing it?", "Why do you like it?"],
          modelo:
            "I've been playing the guitar for two years. I started when I was thirteen. I've been practicing every afternoon after school, and lately I've been learning songs by my favorite band. It isn't easy, but I love it. My family says I play much better now.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Narra cómo va el día",
      objetivo: "Contar lo que alguien ha estado haciendo hasta ahora y cómo está todo en este momento.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam\'s mom is a baker. She has been working at the same bakery for fifteen years. She gets up at four every morning, so she\'s always tired at night!" (no está escrito). Pregunta: ¿a qué hora se levanta la mamá de Liam? Elige entre tres relojes dibujados por la app: 4:00, 7:00 y 10:00.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam's mom is a baker.",
            "She has been working at the same bakery for fifteen years.",
            "She gets up at four every morning, so she's always tired at night!",
          ],
          traduccion: [],
          pregunta: "¿A qué hora se levanta la mamá de Liam?",
          opciones: [
            { texto: "4:00", descripcion: "Un reloj que marca las 4:00", dice: "At four o'clock" },
            { texto: "7:00", descripcion: "Un reloj que marca las 7:00", dice: "At seven o'clock" },
            { texto: "10:00", descripcion: "Un reloj que marca las 10:00", dice: "At ten o'clock" },
          ],
          correcta: 0,
          porRevisar: ["opciones: 4:00, 7:00 y 10:00, bien distintas; entre las 4:00 y las 5:00 la aguja apenas se movía. Los relojes muestran la hora en números y suenan «At four o'clock» (cambio del 30 de octubre de 2026)", 'opciones.descripcion: "Un reloj que marca las…", como en A1'],
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden de la mañana de Zoe, con un reloj dibujado por la app en cada uno: (1) 7:00, empieza a ordenar su cuarto lleno de ropa; (2) 8:30, sigue ordenando, con audífonos; (3) 10:00, entra su mamá sorprendida; (4) el cuarto ordenado y Zoe, cansada, en la cama. Allison: "Tell me about Zoe\'s morning. Her mom asks: What have you been doing?" Debajo: first, then, after that, now.',
          siRespondeMal:
            'Si dice "She is cleaning since seven": "From seven until now: she\'s been cleaning." Allison repite bien la frase y el alumno la dice. Si cuenta menos de 3 dibujos, Allison señala el que falta: "What happened next?"',
          tambienSeAcepta: "She has been cleaning since seven. She has been working all morning.",
          // El reloj de cada dibujo ya viene puesto en la ilustración (7:00,
          // 8:30, 10:00 y el último); las horas también van en `dibujos`.
          imagenes: ["f-zoe-cuarto-1", "f-zoe-cuarto-2", "f-zoe-cuarto-3", "f-zoe-cuarto-4"],
          dibujos: [
            "7:00, empieza a ordenar su cuarto lleno de ropa",
            "8:30, sigue ordenando, con audífonos",
            "10:00, entra su mamá sorprendida",
            "el cuarto ordenado y Zoe, cansada, en la cama",
          ],
          pregunta: "Tell me about Zoe's morning. Her mom asks: What have you been doing?",
          debajo: ["first", "then", "after that", "now"],
          modelo:
            "At seven, Zoe started cleaning her room. She's been cleaning for three hours. She's been listening to music all morning. Now her room is clean, but she's very tired.",
          verbos: ["started cleaning", "has been cleaning", "has been listening", "is clean"],
          gramatica:
            "present perfect continuous: have/has been + -ing, with for, since or all morning (past simple only for when it started)",
          explicaciones: [
            {
              siDice: "She is cleaning since seven",
              explicacion: "From seven until now: she's been cleaning.",
              es: "Desde las siete hasta ahora: she's been cleaning.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            "verbos: salen del modelo, uno por frase en el orden del modelo; \"she's been\" va como \"has been\"",
            "gramatica: escrita para el evaluador a partir de la gramática de la parada",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: How long have you been studying English? What have you been doing this week? How long have you been living in your city? What have you been learning at school lately? How long have you known your best friend?",
          siRespondeMal:
            'Se muestra una respuesta modelo y la pregunta vuelve al final. Si dice "I\'ve been knowing her": "Know doesn\'t take -ing: I\'ve known her."',
          tambienSeAcepta: 'Respuestas cortas que responden bien ("For four years."); Allison pide la frase completa',
          preguntas: [
            { pregunta: "How long have you been studying English?", modelo: "I've been studying English for four years." },
            { pregunta: "What have you been doing this week?", modelo: "I've been studying for my math test." },
            { pregunta: "How long have you been living in your city?", modelo: "I've been living in Pereira since I was born." },
            { pregunta: "What have you been learning at school lately?", modelo: "We've been learning about the solar system." },
            { pregunta: "How long have you known your best friend?", modelo: "I've known her since first grade." },
          ],
          aceptadas: ["For four years."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Enséñale a Allison",
      objetivo: "Explicarle a Allison el Carnaval de Barranquilla y contar desde cuándo se celebra.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe has been saving money for a new bike since September. She has been earning money by walking her neighbor\'s dog every afternoon. She needs fifty more dollars!" (no está escrito). Pregunta: ¿cómo ha estado ganando dinero Zoe? Elige entre tres imágenes: paseando un perro, lavando un carro y cuidando a un niño.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe has been saving money for a new bike since September.",
            "She has been earning money by walking her neighbor's dog every afternoon.",
            "She needs fifty more dollars!",
          ],
          traduccion: [],
          pregunta: "¿Cómo ha estado ganando dinero Zoe?",
          opciones: [
            { imagen: "f-lavar-carro", descripcion: "Una muchacha lavando un carro", dice: "Washing a car" },
            { imagen: "f-pasear-perro", descripcion: "Una muchacha paseando un perro", dice: "Walking a dog" },
            { imagen: "f-cuidar-nino", descripcion: "Una muchacha cuidando a un niño pequeño", dice: "Taking care of a little boy" },
          ],
          correcta: 1,
          porRevisar: [
            "opciones: cada dibujo dice su nombre en inglés al elegirlo (dice), sin texto a la vista (cambio del 30 de octubre de 2026)",
            "opciones: orden cambiado para que la correcta no sea siempre la primera",
            "opciones.descripcion: salen de la tabla de ilustraciones",
          ],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "He estado esperando el bus por veinte minutos, pero todavía no ha llegado." Dibujo de un hombre esperando en una parada de bus. Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "I\'m waiting for the bus since twenty minutes": "For twenty minutes, with I\'ve been: I\'ve been waiting for twenty minutes." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "He estado esperando el bus por veinte minutos, pero todavía no ha llegado.",
          imagen: "a2/f-parada-lluvia",
          respuesta: "I've been waiting for the bus for twenty minutes, but it still hasn't arrived.",
          aceptadas: ["I have been waiting for the bus for twenty minutes, but it hasn't come yet."],
          palabras: [],
          partes: ["I've been waiting for the bus for twenty minutes,", "but it still hasn't arrived."],
          explicaciones: [
            {
              siDice: "I'm waiting for the bus since twenty minutes",
              explicacion: "For twenty minutes, with I've been: I've been waiting for twenty minutes.",
              es: "Por veinte minutos, con I've been: I've been waiting for twenty minutes.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "ensenale",
          queAparece:
            'Allison: "I\'ve never been to the Barranquilla Carnival! Teach me about it." Cuatro preguntas en orden, de la lista de abajo. Dibujo de un desfile del Carnaval con disfraces de colores y máscaras.',
          siRespondeMal:
            'Si responde con una palabra: "Tell me more!" y repite la pregunta. Si habla en español: "In English, please!" y la pregunta más simple. Si no lo conoce: "Tell me about a festival in your city!" y sigue la lista con esa fiesta.',
          tambienSeAcepta:
            'Respuestas que se entienden aunque tengan errores. Si no sabe desde cuándo: "I don\'t know, but I think for a long time."',
          tema: "el Carnaval de Barranquilla",
          apertura: "I've never been to the Barranquilla Carnival! Teach me about it.",
          imagen: "f-carnaval",
          preguntas: [
            {
              pregunta: "When is the carnival?",
              simple: "When is it?",
              modelo: "It's in February or March, and it lasts four days.",
            },
            {
              pregunta: "What do people wear?",
              simple: "What do they wear?",
              modelo: "People wear colorful costumes and masks.",
            },
            {
              pregunta: "Have you ever been there, or have you watched it on TV?",
              simple: "Have you been there?",
              modelo: "I've never been there, but I've watched it on TV.",
            },
            {
              pregunta: "How long have people been celebrating it?",
              simple: "How old is the carnival?",
              modelo: "People have been celebrating it for more than a hundred years.",
            },
          ],
          reacciones: ["That sounds so fun!", "I love colorful costumes!", "Wow!", "I want to dance there!"],
          cierre: "Thank you! Now I want to dance at the Carnival!",
          respuestasDeAllison: [{ siPregunta: "si le gusta bailar", respuesta: "Yes! I love to dance. When I'm stressed, I dance!" }],
          otraPregunta: "Good question! But today you're the teacher. Tell me more!",
          minimoRespuestas: 3,
          porRevisar: ["preguntas.simple: versiones más simples, no estaban en el documento"],
        },
      ],
    },
  ],
  escenario: {
    titulo: "La entrevista en el campamento",
    imagen: "e-calgary-campamento",
    contexto:
      "Pasas el verano en Calgary con tu tía y te postulaste como ayudante de monitor en un campamento para niños. La entrevista era el viernes, pero hoy te escribieron: la directora viaja mañana y te entrevista en una hora. Ms. Clark, la directora del campamento (Allison en su papel), te recibe.",
    personaje: "Ms. Clark, la directora de un campamento de verano cerca de Calgary",
    objetivo:
      "Presentarse, contar qué ha estado haciendo y desde cuándo, explicar por qué quiere el trabajo y responder con honestidad a una pregunta inesperada",
    tareas: [
      "Saluda y agradece que te reciban.",
      "Cuenta qué has estado haciendo este año y desde cuándo.",
      "Di por qué quieres trabajar en el campamento.",
      "Te preguntan si puedes ayudar en la piscina: responde con honestidad y di desde cuándo nadas.",
      "Pregunta por el horario y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Ms. Clark recibe un mensaje: el instructor de natación renunció. Ahí aparece la tarea 4: "Te preguntan si puedes ayudar en la piscina: responde con honestidad y di desde cuándo nadas."',
      linea: "Wonderful. Oh, excuse me, a message… Oh no, our swimming instructor has just quit! Can you swim?",
    },
    dialogo: [
      { quien: "personaje", dice: "Hi! Thank you for coming so early. I'm Ms. Clark, the camp director." },
      { quien: "alumno", dice: "Hi, Ms. Clark. Thank you for seeing me today.", tarea: 1 },
      { quien: "personaje", dice: "No problem. I'm sorry about the change. I have to travel tomorrow. So, tell me about yourself." },
      { quien: "alumno", dice: "I'm fifteen, and I'm from Colombia. I'm spending the summer with my aunt in Calgary." },
      { quien: "personaje", dice: "Your English is very good! How long have you been studying it?" },
      { quien: "alumno", dice: "Thank you! I've been studying English for three years.", tarea: 2 },
      { quien: "personaje", dice: "What do you like to do in your free time?" },
      { quien: "alumno", dice: "I like playing soccer and drawing. Lately I've been taking an art class." },
      { quien: "personaje", dice: "Great. Have you ever worked with kids?" },
      { quien: "alumno", dice: "Yes. I've been volunteering at a library since January. I read stories to children every Saturday.", tarea: 2 },
      { quien: "personaje", dice: "That's perfect. Why do you want to work at our camp?" },
      {
        quien: "alumno",
        dice: "Because I love being outside, and I'm good with kids. I've been helping my little cousins with their homework for two years.",
        tarea: 3,
      },
      { quien: "personaje", dice: "Wonderful. Oh, excuse me, a message… Oh no, our swimming instructor has just quit! Can you swim?" },
      { quien: "alumno", dice: "Yes, I can. I've been swimming since I was eight.", tarea: 4 },
      { quien: "personaje", dice: "Could you help at the pool with the little kids?" },
      { quien: "alumno", dice: "I can help, but I'm not a lifeguard. I can play games with the kids in the water.", tarea: 4 },
      { quien: "personaje", dice: "That's honest, and that's important. We have a lifeguard, so that's perfect." },
      { quien: "alumno", dice: "Thank you. I really want to help." },
      { quien: "personaje", dice: "Do you have any questions for me?" },
      { quien: "alumno", dice: "Yes. What's the schedule?", tarea: 5 },
      { quien: "personaje", dice: "From nine to four, Monday to Friday. Can you start next Monday?" },
      { quien: "alumno", dice: "Yes, I can! Thank you so much." },
      { quien: "personaje", dice: "You're welcome. See you on Monday!" },
      { quien: "alumno", dice: "See you on Monday, Ms. Clark. Have a good trip!", tarea: 5 },
    ],
    ayudas: [
      "Say hello and thank her.",
      "Say what you've been doing and for how long.",
      "Say why you want the job.",
      "Say if you can swim, and since when.",
      "Ask about the schedule and say goodbye.",
    ],
    resumen:
      "¡Lo lograste! Contaste en inglés qué has estado haciendo y desde cuándo, y respondiste con honestidad a lo inesperado.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Calgary en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like Calgary" → Me too! And how long have you been studying English?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Say what you\'ve been doing and for how long."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Sé nadar" → Sorry, in English, please! Can you swim?',
      },
      {
        situacion: "Dice que no sabe nadar",
        accion: "Lo acepta y sigue: la tarea se cumple diciendo la verdad",
        ejemplo: '"No, I can\'t swim." → That\'s OK! Thank you for being honest.',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo: '"I study English since three years" → la escena sigue; en el resumen: I\'ve been studying English for three years.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Ms. Clark: "Thank you for coming. We\'ll call you!" En pantalla: Vamos a repasar el presente perfecto continuo y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["calgary"],
      muestra: "Portada de la ciudad: los rascacielos y la Calgary Tower, el río Bow y las Montañas Rocosas al fondo",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-calgary-campamento"],
      muestra: "La oficina de un campamento de verano con cabañas, un lago y montañas por la ventana",
      uso: "Escenario",
    },
    { archivos: ["f-liam-tenis"], muestra: "Liam cansado y sudado en una cancha de tenis", uso: "Lección 1 (paso 2)" },
    {
      archivos: ["f-liam-cuentos", "f-liam-libros", "f-liam-estudiando"],
      muestra: "Liam leyéndoles cuentos a niños; organizando libros en un estante; estudiando en una mesa",
      uso: "Lección 2 (paso 1)",
    },
    {
      archivos: ["f-zoe-cuarto-1", "f-zoe-cuarto-2", "f-zoe-cuarto-3", "f-zoe-cuarto-4"],
      muestra:
        "Los cuatro dibujos de la mañana de Zoe, con el mismo cuarto: lleno de ropa, ordenando con audífonos, la mamá entra, el cuarto ordenado y Zoe cansada",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["f-pasear-perro", "f-lavar-carro", "f-cuidar-nino"],
      muestra: "Una muchacha paseando un perro; lavando un carro; cuidando a un niño pequeño",
      uso: "Lección 4 (paso 1)",
    },
    { archivos: ["a2/f-parada-lluvia"], muestra: "Un hombre esperando en una parada de bus (de A2)", uso: "Lección 4 (paso 2)" },
    {
      archivos: ["f-carnaval"],
      muestra: "Un desfile del Carnaval de Barranquilla con disfraces de colores y máscaras",
      uso: "Lección 4 (paso 3)",
    },
  ],
};
