import type { Parada } from "../tipos.ts";

/**
 * Parada 3 · Ottawa (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; las de A1 que se reutilizan llevan "a1/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison (va a su ficha): nunca ha celebrado el Día de las Velitas;
 *     estuvo en Bogotá y Boyacá, pero no en diciembre.
 *   · Zoe: tiene un primo; le prestó su bicicleta y se la robaron afuera
 *     de una tienda.
 *   · Liam: nunca había visto un alce hasta el verano pasado, en el parque
 *     Algonquin. En diciembre su familia hace una cena grande donde la
 *     abuela.
 *   · Officer Grant: solo en este escenario, la policía que toma la
 *     declaración en Ottawa.
 */
export const PARADA_03: Parada = {
  numero: 3,
  ciudad: "Ottawa",
  titulo: "Cuenta bien una historia",
  gramatica: "Pasado perfecto y conectores de tiempo",
  objetivo:
    'Al terminar, el alumno cuenta una historia en orden y dice qué había pasado antes: "The thief had already left when the police arrived." Gramática: pasado perfecto (had + participio) y conectores de tiempo (when, before, after, by the time). Usa todo lo anterior y nada de paradas posteriores (ni voz pasiva, ni condicionales, ni might).',
  fraseMeta: "The thief had already left when the police arrived.",
  portada: "ottawa",
  vocabulario: [
    {
      grupo: "Lo que ya había pasado (pasado perfecto)",
      ingles: "had already, had just, hadn't… yet, had never… before, by the time",
      nota: 'Lo que pasó primero va con had: "By the time I got there, the bus had left."',
    },
    {
      grupo: "Para contar en orden",
      ingles: "first, then, after that, when, before, after, suddenly, in the end",
      nota: '"Suddenly" para lo inesperado; "in the end" para cómo terminó',
    },
    {
      grupo: "La calle y la policía",
      ingles: "thief, steal, lock, bike rack, police officer, witness, hoodie, cap",
      nota: '"Police officer", nunca "policeman". "Witness" es el testigo',
    },
    {
      grupo: "Frases",
      ingles:
        "When I got there, the bus had already left. I had never seen… before. By the time the police arrived, he had gone. I realized I had forgotten…",
      nota: '"Had" se dice corto: "I\'d already left"',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Lo que ya había pasado",
      objetivo: "Decir qué había pasado antes de otro momento del pasado.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Yesterday Zoe ran to the bus stop. But when she got there, the bus had already left. So she walked to school, and she was late for her test!" (no está escrito). Pregunta: ¿por qué llegó tarde Zoe? Elige entre tres tarjetas dibujadas por la app: The bus had left. / She had woken up late. / She had lost her bag.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Yesterday Zoe ran to the bus stop.",
            "But when she got there, the bus had already left.",
            "So she walked to school, and she was late for her test!",
          ],
          traduccion: [],
          pregunta: "¿Por qué llegó tarde Zoe?",
          opciones: [
            { texto: "She had woken up late.", descripcion: "She had woken up late." },
            { texto: "The bus had left.", descripcion: "The bus had left." },
            { texto: "She had lost her bag.", descripcion: "She had lost her bag." },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo: Liam en la puerta de una sala de cine vacía, con cara de sorpresa. Dos relojes dibujados por la app: la película terminó a las 9:00; Liam llegó a las 9:30. Allison: "Liam got to the movie theater at 9:30. What had happened?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: The movie had…". Sin pista, Allison dice "The movie had already ended" y el alumno la repite. Si dice "The movie already ended": "It happened first, so use had: The movie had already ended."',
          imagen: "f-cine-vacio",
          relojes: [{ hora: "9:00", etiqueta: "The movie ended" }, { hora: "9:30", etiqueta: "Liam arrived" }],
          pregunta: "Liam got to the movie theater at 9:30. What had happened?",
          respuesta: "The movie had already ended.",
          aceptadas: ["had ended", "had already ended", "had finished", "had already finished", "had left", "had already left", "had gone home"],
          pistas: ["Start with: The movie had…"],
          explicaciones: [
            { siDice: "The movie already ended", explicacion: "It happened first, so use had: The movie had already ended.", es: "Pasó primero, así que va con had: The movie had already ended." },
            { siDice: "movie has", explicacion: "It happened before 9:30, so use had: The movie had already ended.", es: "Pasó antes de las 9:30, así que va con had: The movie had already ended." },
            { siDice: "movie ended", explicacion: "It happened first, so use had: The movie had ended.", es: "Pasó primero, así que va con had: The movie had ended." },
            { siDice: "movie finished", explicacion: "It happened first, so use had: The movie had finished.", es: "Pasó primero, así que va con had: The movie had finished." },
            { siDice: "started", explicacion: "Look: the theater is empty. The movie had already ended.", es: "Mira: la sala está vacía. The movie had already ended." },
          ],
          porRevisar: [
            "relojes: «The movie ended» a las 9:00 (antes «The movie» a las 7:00, y «The movie had already started» también era cierto); aceptadas: también «The movie had already finished» y «Everybody had already left»; explicaciones para el presente perfecto y el pasado simple (cambio del 30 de octubre de 2026)",
            "explicaciones.es: traducción",
            'relojes: las etiquetas en inglés ("The movie", "Liam arrived") no están escritas en el documento',
          ],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece:
            'Audio de Allison: "When I arrived, she\'d already left." Se practica que se oiga la d corta de she\'d.',
          siRespondeMal:
            'Si no se oye la d ("she already left"): "Listen: she\'d, with a short d. Say it: When I arrived, she\'d already left."',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "When I arrived, she'd already left.",
          palabraDificil: "she'd",
          consejo: "Listen: she'd, with a short d.",
          consejoEs: "Escucha: she'd, con una d corta.",
          porRevisar: ["consejoEs: traducción"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Primero y después",
      objetivo: "Unir dos momentos del pasado con when, before, after y by the time.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam had never seen a moose before last summer. Then, on a trip to Algonquin Park, he saw one next to the road. But he had already put his camera in his bag, so he didn\'t get a photo!" (no está escrito). Pregunta: ¿por qué no tomó la foto Liam? Elige entre tres tarjetas dibujadas por la app: He had put his camera in his bag. / It was too dark. / His phone had no battery.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam had never seen a moose before last summer.",
            "Then, on a trip to Algonquin Park, he saw one next to the road.",
            "But he had already put his camera in his bag, so he didn't get a photo!",
          ],
          traduccion: [],
          pregunta: "¿Por qué no tomó la foto Liam?",
          opciones: [
            { texto: "It was too dark.", descripcion: "It was too dark." },
            { texto: "His phone had no battery.", descripcion: "His phone had no battery." },
            { texto: "He had put his camera in his bag.", descripcion: "He had put his camera in his bag." },
          ],
          correcta: 2,
          porRevisar: ["audio y tarjeta: «put his camera in his bag» en vez de «put his camera away», que es más difícil; «It was too dark.» en vez de «The moose had run away.», que juntaba palabras de la historia (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Cuando llegué a la fiesta, mis amigos ya se habían ido." Dibujo de una fiesta. Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló ("When I…", "…my friends had…"). Si dice "my friends already left": "They left first: had already left." Si dice "have already left": "In the past, use had." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Cuando llegué a la fiesta, mis amigos ya se habían ido.",
          imagen: "a1/a-fiesta",
          respuesta: "When I got to the party, my friends had already left.",
          aceptadas: ["When I arrived at the party, my friends had left."],
          palabras: [],
          partes: ["When I got to the party,", "my friends had already left."],
          explicaciones: [
            {
              siDice: "my friends already left",
              explicacion: "They left first: had already left.",
              es: "Se fueron primero: had already left.",
            },
            { siDice: "have already left", explicacion: "In the past, use had.", es: "En pasado, va had." },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about a day when everything went wrong." Tres preguntas guía: What happened first? What had you forgotten? How did the day end? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "When I arrived, the class already started" → Better: When I arrived, the class had already started. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Tell me about a day when everything went wrong.",
          guias: ["What happened first?", "What had you forgotten?", "How did the day end?"],
          modelo:
            "Last month I had a terrible day. My alarm didn't go off, so I woke up late. I ran to the bus stop, but the bus had already left. When I got to school, I realized I had forgotten my homework. Then it started to rain. But in the end, my mom made my favorite dinner, so the day ended well!",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Narra la historia",
      objetivo: "Contar una historia completa, en orden, con lo que ya había pasado.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe lent her bike to her cousin. Two hours later, he came back without it. He had left it outside a store, and when he came out, someone had taken it!" (no está escrito). Pregunta: ¿dónde había dejado la bicicleta el primo? Elige entre tres tarjetas dibujadas por la app: Outside a store / In the park / At school.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe lent her bike to her cousin.",
            "Two hours later, he came back without it.",
            "He had left it outside a store, and when he came out, someone had taken it!",
          ],
          traduccion: [],
          pregunta: "¿Dónde había dejado la bicicleta el primo?",
          opciones: [
            { texto: "Outside a store", descripcion: "Outside a store" },
            { texto: "In the park", descripcion: "In the park" },
            { texto: "At school", descripcion: "At school" },
          ],
          correcta: 0,
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden frente a un café de Ottawa, con un reloj dibujado por la app en el primero y el último: (1) 4:00, una muchacha deja su bicicleta roja con canasta en el parqueadero de bicicletas y entra al café; (2) un muchacho de buzo verde y gorra negra abre el candado; (3) se va en la bicicleta; (4) 4:20, llega la policía y la muchacha señala el lugar vacío. Allison: "Tell me the story. What had happened when the police arrived?" Debajo: first, then, after that, when.',
          siRespondeMal:
            'Si dice "When the police arrived, the thief left": "He left first: the thief had already left." Allison repite bien la frase y el alumno la dice. Si cuenta menos de 3 dibujos, Allison señala el que falta: "What happened next?"',
          tambienSeAcepta: "He stole the bike. By the time the police arrived, he had gone.",
          imagenes: ["f-robo-1", "f-robo-2", "f-robo-3", "f-robo-4"],
          dibujos: [
            "A las 4:00, una muchacha deja su bicicleta roja con canasta en el parqueadero de bicicletas y entra al café",
            "Un muchacho de buzo verde y gorra negra abre el candado",
            "El muchacho se va en la bicicleta",
            "A las 4:20, llega la policía y la muchacha señala el lugar vacío",
          ],
          pregunta: "Tell me the story. What had happened when the police arrived?",
          debajo: ["first", "then", "after that", "when"],
          modelo:
            "At four o'clock, a girl left her red bike outside a café. Then a young man in a green hoodie opened the lock. After that, he rode away on the bike. When the police arrived at 4:20, the thief had already left.",
          verbos: ["left", "opened", "rode away", "had already left"],
          gramatica:
            "past simple for the events in order and past perfect (had + past participle) for what had already happened, with time connectors (first, then, after that, when)",
          explicaciones: [
            {
              siDice: "When the police arrived, the thief left",
              explicacion: "He left first: the thief had already left.",
              es: "Él se fue primero: the thief had already left.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            'dibujos: salen de queAparece, sin la numeración; se agregó "A las" antes de las horas y el sujeto del dibujo 3 ("El muchacho")',
            "verbos: salen del modelo",
            "gramatica: escrita para el evaluador",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: Had you ever been on a plane before this year? By the time you got to school today, what had you already done? The last time you arrived late somewhere, had everyone already left? What had you eaten before you went to bed last night? Had you studied English before high school?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta:
            'Respuestas cortas que responden bien ("No, I hadn\'t."); Allison pide el detalle: "Tell me more!"',
          preguntas: [
            {
              pregunta: "Had you ever been on a plane before this year?",
              modelo: "No, I hadn't. I took my first flight in June.",
            },
            {
              pregunta: "By the time you got to school today, what had you already done?",
              modelo: "I had already eaten breakfast and walked my dog.",
            },
            {
              pregunta: "The last time you arrived late somewhere, had everyone already left?",
              modelo: "Yes! When I got to the party, everyone had gone home.",
            },
            {
              pregunta: "What had you eaten before you went to bed last night?",
              modelo: "I had eaten a big sandwich, so I wasn't hungry.",
            },
            {
              pregunta: "Had you studied English before high school?",
              modelo: "Yes, I had. I studied English in elementary school.",
            },
          ],
          aceptadas: ["No, I hadn't."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Enséñale a Allison",
      objetivo: "Explicarle a Allison cómo se celebra el Día de las Velitas y contar lo que hiciste, en orden.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Last December, Liam\'s family had a big dinner at his grandma\'s house. Liam got there late. By the time he arrived, his grandma had already cooked everything, and his cousins had eaten half of the cake!" (no está escrito). Pregunta: ¿qué habían hecho los primos? Elige entre tres tarjetas dibujadas por la app: They had eaten half of the cake. / They had decorated the tree. / They had washed the dishes.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Last December, Liam's family had a big dinner at his grandma's house.",
            "Liam got there late.",
            "By the time he arrived, his grandma had already cooked everything, and his cousins had eaten half of the cake!",
          ],
          traduccion: [],
          pregunta: "¿Qué habían hecho los primos?",
          opciones: [
            { texto: "They had decorated the tree.", descripcion: "They had decorated the tree." },
            { texto: "They had eaten half of the cake.", descripcion: "They had eaten half of the cake." },
            { texto: "They had washed the dishes.", descripcion: "They had washed the dishes." },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "No pude montar bicicleta porque mi hermano se la había llevado." Dibujo de una bicicleta. Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "has taken": "He took it first: had taken." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "No pude montar bicicleta porque mi hermano se la había llevado.",
          imagen: "a1/f-bicicleta",
          respuesta: "I couldn't ride my bike because my brother had taken it.",
          aceptadas: ["I couldn't ride my bike because my brother took it."],
          palabras: [],
          partes: ["I couldn't ride my bike", "because my brother had taken it."],
          explicaciones: [
            { siDice: "has taken", explicacion: "He took it first: had taken.", es: "Él se la llevó primero: had taken." },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "ensenale",
          queAparece:
            'Allison: "I\'ve never celebrated the Day of the Little Candles! Teach me about it." Cuatro preguntas en orden, de la lista de abajo. Dibujo de una calle con velitas y faroles de noche.',
          siRespondeMal:
            'Si responde con una palabra: "Tell me more!" y repite la pregunta. Si habla en español: "In English, please!" y la pregunta más simple. Si no lo celebra: "Tell me about a holiday you celebrate in December!" y sigue la lista con esa fiesta.',
          tambienSeAcepta: "Respuestas que se entienden aunque tengan errores",
          tema: "el Día de las Velitas",
          apertura: "I've never celebrated the Day of the Little Candles! Teach me about it.",
          imagen: "f-velitas",
          preguntas: [
            {
              pregunta: "When do people celebrate it?",
              simple: "When is it?",
              modelo: "People celebrate it on December 7th, at night.",
            },
            {
              pregunta: "What do people do that night?",
              simple: "What do people do?",
              modelo: "They light candles and paper lanterns outside their houses.",
            },
            {
              pregunta: "What did you do last year?",
              simple: "What did you do?",
              modelo: "Last year I lit candles with my family in front of our house.",
            },
            {
              pregunta: "What had your family prepared before the night began?",
              simple: "What did your family prepare?",
              modelo: "We had bought a lot of candles before that night.",
            },
          ],
          reacciones: ["That sounds beautiful!", "I love that!", "How nice!", "I didn't know that!"],
          cierre: "Thank you! Now I want to light candles too!",
          respuestasDeAllison: [
            {
              siPregunta: "si ha estado en Colombia en diciembre",
              respuesta: "I've been to Bogotá and Boyacá, but never in December. I'd love to see the candles!",
            },
          ],
          otraPregunta: "Good question! But today you're the teacher. Tell me more!",
          minimoRespuestas: 3,
          porRevisar: ["preguntas.simple: versiones más simples escritas para la app"],
        },
      ],
    },
  ],
  // Escenario: el documento no trae texto que haya tenido que crear. La
  // tarea 4 es la del imprevisto ("Di si es la misma bicicleta y por qué.")
  // y su línea es la del diálogo marcada "(imprevisto)".
  escenario: {
    titulo: "El robo de la bicicleta",
    imagen: "e-ottawa-calle",
    contexto:
      "Estás en Ottawa tomando un chocolate en la ventana de un café y viste cómo un muchacho se robaba la bicicleta de una muchacha. Sales a contárselo a la policía: te atiende Officer Grant (Allison en su papel).",
    personaje: "Officer Grant, la policía que toma la declaración en Ottawa",
    objetivo: "Contar en orden lo que vio, ayudar a reconocer la bicicleta y describir al ladrón",
    tareas: [
      "Saluda y di qué viste.",
      "Di dónde estabas y a qué hora pasó.",
      "Cuenta en orden qué pasó.",
      "Di si es la misma bicicleta y por qué.",
      "Describe al ladrón y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Officer Grant recibe una llamada: encontraron una bicicleta cerca del río, pero es azul y no tiene canasta. Ahí aparece la tarea 4: "Di si es la misma bicicleta y por qué."',
      linea:
        "That's very helpful. Wait… I'm getting a call. OK, my partner has found a bike near the river. It's blue, and it doesn't have a basket.",
    },
    dialogo: [
      { quien: "personaje", dice: "Hello. I'm Officer Grant. Did you see what happened?" },
      { quien: "alumno", dice: "Yes. Good afternoon, officer. I saw a young man steal a bike.", tarea: 1 },
      { quien: "personaje", dice: "OK. Where were you, and what time was it?" },
      { quien: "alumno", dice: "I was in that café, next to the window. It was about four o'clock.", tarea: 2 },
      { quien: "personaje", dice: "Tell me what happened, from the beginning." },
      { quien: "alumno", dice: "First, a girl left her red bike outside and went into the café.", tarea: 3 },
      { quien: "personaje", dice: "And then?" },
      { quien: "alumno", dice: "Then a young man opened the lock. He had a small tool." },
      { quien: "personaje", dice: "Had you seen him before?" },
      { quien: "alumno", dice: "Not before today. But he had walked past the café two or three times." },
      { quien: "personaje", dice: "What did he do after that?" },
      {
        quien: "alumno",
        dice: "He rode away on the bike, very fast. By the time I went outside, he had already left.",
        tarea: 3,
      },
      { quien: "personaje", dice: "Did you see where he went?" },
      { quien: "alumno", dice: "He went toward the river." },
      {
        quien: "personaje",
        dice: "That's very helpful. Wait… I'm getting a call. OK, my partner has found a bike near the river. It's blue, and it doesn't have a basket.",
      },
      { quien: "alumno", dice: "Then it isn't the same bike. The girl's bike was red, and it had a basket.", tarea: 4 },
      { quien: "personaje", dice: "Are you sure?" },
      { quien: "alumno", dice: "Yes, I'm sure. I had seen it before the thief came." },
      { quien: "personaje", dice: "OK. Can you describe him?" },
      { quien: "alumno", dice: "He was tall. He was wearing a green hoodie and a black cap.", tarea: 5 },
      { quien: "personaje", dice: "Thank you. You've been a great witness." },
      { quien: "alumno", dice: "You're welcome. I hope you find the bike!" },
      { quien: "personaje", dice: "We'll do our best. Enjoy Ottawa!" },
      { quien: "alumno", dice: "Thank you, officer. Goodbye!", tarea: 5 },
    ],
    ayudas: [
      "Say what you saw.",
      "Say where you were and what time it was.",
      "Tell the story in order.",
      "Say if it's the same bike, and why.",
      "Describe his clothes and say goodbye.",
    ],
    resumen: "¡Lo lograste! Contaste en inglés lo que viste, en orden y con lo que ya había pasado.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Ottawa en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I was scared" → I understand. What did he do first?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Say if it\'s the same bike, and why."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Tenía un buzo verde" → Sorry, in English, please! What was he wearing?',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo:
          '"When I went outside, he already left" → la escena sigue; en el resumen: He left first: he had already left.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Officer Grant: "Thank you for your help. Have a good day." En pantalla: Vamos a repasar el pasado perfecto y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["ottawa"],
      muestra: "Portada de la ciudad: el Parlamento con la Torre de la Paz y el canal Rideau",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-ottawa-calle"],
      muestra: "Una calle frente a un café, con un parqueadero de bicicletas vacío y una patrulla",
      uso: "Escenario",
    },
    {
      archivos: ["f-cine-vacio"],
      muestra: "Liam en la puerta de una sala de cine vacía, sorprendido",
      uso: "Lección 1 (paso 2)",
    },
    { archivos: ["a1/a-fiesta"], muestra: "Una fiesta (de A1)", uso: "Lección 2 (paso 2)" },
    {
      archivos: ["f-robo-1", "f-robo-2", "f-robo-3", "f-robo-4"],
      muestra:
        "Los cuatro dibujos del robo frente al café, con el mismo fondo: la muchacha deja la bicicleta, el muchacho abre el candado, se va en ella, llega la policía",
      uso: "Lección 3 (paso 2)",
    },
    { archivos: ["a1/f-bicicleta"], muestra: "Una bicicleta (de A1)", uso: "Lección 4 (paso 2)" },
    {
      archivos: ["f-velitas"],
      muestra: "Una calle de noche con velitas y faroles de papel frente a las casas",
      uso: "Lección 4 (paso 3)",
    },
  ],
};
