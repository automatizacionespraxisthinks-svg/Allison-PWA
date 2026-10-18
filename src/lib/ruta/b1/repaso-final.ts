import type { Repaso } from "../tipos.ts";

/**
 * Repaso final · Vancouver (B1). Documento "Contenido B1", aprobado el 18 de
 * octubre de 2026. No tiene palabras nuevas ni ilustraciones nuevas: usa las
 * de las paradas de B1 (tal cual) y las de A1 y A2 que se reutilizan llevan
 * su carpeta delante. Las opciones de Escucha y elige son tarjetas que
 * dibuja la app.
 *
 * Datos nuevos del documento (aprobados el 18 de octubre de 2026), también
 * en `notas`:
 *   · Ms. Park: solo en este escenario: la agente de servicio al cliente de
 *     la aerolínea en Vancouver.
 *   · Tu mamá: ya salió en la parada 9 (no habla inglés y su apellido es
 *     Gómez). Nuevo aquí: se llama Marta y llegó a Vancouver para volver
 *     contigo a Colombia; no habla en la app.
 *   · La cantante de Zoe: la cantante colombiana de la parada 7 da un
 *     concierto en Vancouver al final del viaje; no habla en la app.
 *   · Zoe: vuelve a limpiar la playa con sus amigos; si llueve el sábado,
 *     podrían ir el domingo.
 *   · Liam: le hizo una tarjeta de agradecimiento al conductor que encontró
 *     su computador. Si tuviera una banda, tocaría en la panadería donde
 *     trabaja su mamá, y su abuela iría a todos los conciertos.
 *   · Allison: nada nuevo; todo lo suyo sale de su ficha y de lo aprobado
 *     en las paradas 6 a 10.
 */
export const REPASO_FINAL: Repaso = {
  nombre: "Repaso final",
  despuesDeParada: 10,
  ciudad: "Vancouver",
  titulo: "Tu viaje por Canadá",
  objetivo:
    "Al terminar, el alumno resuelve solo, en inglés, un viaje con varios imprevistos usando todo B1: cuenta qué pasó, explica por qué una opción no le sirve, escoge otra con una razón, pide lo que necesita y propone otra solución cuando algo falla. No agrega gramática nueva.",
  comoEsDistinto:
    'Como en el Repaso 1, las lecciones 1 y 2 mezclan dos paradas cada una (6 y 7, 8 y 9), la 3 repasa la parada 10 y la 4 junta todo B1 con Allison. No hay palabras nuevas ni ilustraciones nuevas: usa las de A1, A2 y B1. Narra la secuencia vuelve sobre la historia del oso de Banff y le suma una idea con could o might. La Entrevista pregunta por datos de Allison ya vistos, uno por parada de la 6 a la 10. El escenario tiene varios imprevistos y cada tarea se apoya en una o varias paradas de todo B1. Al final, la estampilla "B1 completo" y se abre B2. Como dice la pestaña principal, esta pestaña la revisa también un nativo de Estados Unidos.',
  portada: "vancouver",
  lecciones: [
    {
      numero: 1,
      titulo: "Cómo se hace y qué recomiendas (paradas 6 y 7)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "A few weeks ago, Liam left his laptop on the bus. It was found by the driver and taken to the lost and found. Liam made a thank-you card for the driver who helped him!" (no está escrito). Pregunta: ¿qué hizo Liam para el conductor? Elige entre tres tarjetas dibujadas por la app: He made a thank-you card. / He bought him lunch. / He gave him a book.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "A few weeks ago, Liam left his laptop on the bus.",
            "It was found by the driver and taken to the lost and found.",
            "Liam made a thank-you card for the driver who helped him!",
          ],
          traduccion: [],
          pregunta: "¿Qué hizo Liam para el conductor?",
          opciones: [
            { texto: "He bought him lunch.", descripcion: "He bought him lunch." },
            { texto: "He gave him a book.", descripcion: "He gave him a book." },
            { texto: "He made a thank-you card.", descripcion: "He made a thank-you card." },
          ],
          correcta: 2,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "El libro que me recomendaste fue escrito por una mujer colombiana, así que se lo voy a regalar a mi mamá." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "was wrote": "Passive: was written." Si dice "The book what you recommended": "For things: that." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "El libro que me recomendaste fue escrito por una mujer colombiana, así que se lo voy a regalar a mi mamá.",
          respuesta: "The book that you recommended was written by a Colombian woman, so I'm going to give it to my mom.",
          aceptadas: ["The book you recommended was written by a Colombian woman, so I'll give it to my mom."],
          palabras: [],
          partes: ["The book that you recommended was written by a Colombian woman,", "so I'm going to give it to my mom."],
          explicaciones: [
            { siDice: "was wrote", explicacion: "Passive: was written.", es: "Voz pasiva: was written." },
            { siDice: "The book what you recommended", explicacion: "For things: that.", es: "Para cosas: that." },
          ],
          porRevisar: ["explicaciones.es: traducciones"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: How are arepas made? What's a movie that everyone should watch? Where was your phone made? What's the most boring thing you do every week? Who's a singer that your family loves?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("With corn."); Allison pide el detalle: "Tell me more!"',
          preguntas: [
            { pregunta: "How are arepas made?", modelo: "They're made with corn. My grandma makes them on Sundays." },
            {
              pregunta: "What's a movie that everyone should watch?",
              modelo: "Encanto is a movie that everyone should watch, because it's about a Colombian family.",
            },
            { pregunta: "Where was your phone made?", modelo: "I think it was made in China." },
            { pregunta: "What's the most boring thing you do every week?", modelo: "Cleaning my room is the most boring thing I do!" },
            { pregunta: "Who's a singer that your family loves?", modelo: "Shakira is a singer that everyone in my family loves." },
          ],
          aceptadas: ["With corn."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 2,
      titulo: "Lo que pasará y lo que podría pasar (paradas 8 y 9)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Next Saturday, Zoe and her friends are going to clean the beach again. If a lot of students come, they\'ll finish before lunch. But it might rain, so they could go on Sunday instead. Zoe is bringing gloves and bags for everyone!" (no está escrito). Pregunta: ¿qué podrían hacer si llueve? Elige entre tres tarjetas dibujadas por la app: Go on Sunday. / Stay home. / Clean the school.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Next Saturday, Zoe and her friends are going to clean the beach again.",
            "If a lot of students come, they'll finish before lunch.",
            "But it might rain, so they could go on Sunday instead.",
            "Zoe is bringing gloves and bags for everyone!",
          ],
          traduccion: [],
          pregunta: "¿Qué podrían hacer si llueve?",
          opciones: [
            { texto: "Stay home.", descripcion: "Stay home." },
            { texto: "Go on Sunday.", descripcion: "Go on Sunday." },
            { texto: "Clean the school.", descripcion: "Clean the school." },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Los cuatro dibujos del oso en el campamento, de la parada 8 (f-oso-1 a f-oso-4). Allison: "Tell me again what will happen. Then tell me what the family could do." Debajo: first, then, after that, so.',
          siRespondeMal:
            'Si dice "If the bear will smell the food": "After if, no will: If the bear smells the food." Si no da la idea, Allison pregunta: "And what could the family do?" Si cuenta menos de 3 dibujos: "And then what will happen?"',
          tambienSeAcepta: "La historia con 3 dibujos o más, con if y will, y cualquier idea con could, might o may",
          imagenes: ["f-oso-1", "f-oso-2", "f-oso-3", "f-oso-4"],
          // Esta pestaña no describe los dibujos: salen de la Narra de la
          // parada 8 (lección 3, paso 2), tal cual.
          dibujos: [
            "una familia deja basura y comida en el campamento",
            "un oso huele la comida",
            "el oso llega al campamento",
            "la guardaparques cierra el campamento",
          ],
          pregunta: "Tell me again what will happen. Then tell me what the family could do.",
          debajo: ["first", "then", "after that", "so"],
          modelo:
            "First, if people leave food at the campsite, a bear will smell it. Then, if the bear smells the food, it will come to the campsite. After that, the ranger will close the campsite. So the family could keep their food in the car, or they might take their trash with them.",
          // La idea final (could keep, might take) no es un dibujo: no lleva verbo aquí.
          verbos: ["leave", "will smell", "will come", "will close"],
          gramatica: "first conditional: if + present, will + verb; then one idea with could, might or may",
          explicaciones: [
            {
              siDice: "If the bear will smell the food",
              explicacion: "After if, no will: If the bear smells the food.",
              es: "Después de if, sin will: If the bear smells the food.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            "dibujos: esta pestaña no los describe; salen de la parada 8 (Narra, lección 3)",
            "verbos: salen del modelo",
            "gramatica: escrita para el evaluador; no está en el documento",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about a problem you had on a trip or at school, and how you solved it." Tres preguntas guía: What was the problem? What could you do? What will you do next time? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "If we will travel in December" → Better: If we travel in December. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Tell me about a problem you had on a trip or at school, and how you solved it.",
          guias: ["What was the problem?", "What could you do?", "What will you do next time?"],
          modelo:
            "Last December, I went to Santa Marta with my family, but when we arrived, the hotel was full! My dad said we could sleep in the car, but my mom didn't like that idea. Then she found a small hotel near the beach that had one room. It was small, but it was really nice. Next time, if we travel in December, we'll make a reservation early.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Lo que harías (parada 10)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam takes guitar lessons on Saturdays. He says that if he had a band, he would play at the bakery where his mom works. His grandma says she would go to every concert!" (no está escrito). Pregunta: ¿qué haría la abuela de Liam? Elige entre tres tarjetas dibujadas por la app: Go to every concert. / Sing with the band. / Learn the drums.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam takes guitar lessons on Saturdays.",
            "He says that if he had a band, he would play at the bakery where his mom works.",
            "His grandma says she would go to every concert!",
          ],
          traduccion: [],
          pregunta: "¿Qué haría la abuela de Liam?",
          // La correcta se deja primera, como en el documento: en este repaso
          // queda en 2, 1, 0 y 1.
          opciones: [
            { texto: "Go to every concert.", descripcion: "Go to every concert." },
            { texto: "Sing with the band.", descripcion: "Sing with the band." },
            { texto: "Learn the drums.", descripcion: "Learn the drums." },
          ],
          correcta: 0,
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'El dibujo del muchacho que mira la lluvia por la ventana (f-lluvia-ventana, de la parada 10). Allison: "It\'s raining, and he\'s bored. What would you do if you were him?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: If I were him…". Sin pista, Allison dice "If I were him, I would watch a movie" y el alumno la repite. Si dice "If I am him": "It\'s imagined: If I were him." Si dice "I will watch": "It\'s imagined: I would watch."',
          tambienSeAcepta:
            'Cualquier actividad con If I were him, I would… o I\'d…: "If I were him, I\'d play video games." También cuenta como bien "If I was him…" (ver la nota)',
          imagen: "f-lluvia-ventana",
          pregunta: "It's raining, and he's bored. What would you do if you were him?",
          respuesta: "If I were him, I would watch a movie.",
          aceptadas: ["If I were him, I'd play video games."],
          pistas: ["Start with: If I were him…"],
          explicaciones: [
            { siDice: "If I am him", explicacion: "It's imagined: If I were him.", es: "Es algo imaginado: If I were him." },
            { siDice: "I will watch", explicacion: "It's imagined: I would watch.", es: "Es algo imaginado: I would watch." },
            {
              siDice: "If I was him",
              explicacion: "Good! In the app we say: If I were him.",
              es: "¡Bien! En la app decimos: If I were him.",
            },
          ],
          porRevisar: [
            "explicaciones.es: traducciones",
            'explicaciones: la de "If I was him" sale de la nota para la docente (cuenta como bien; Allison solo dice cómo se dice en la app)',
          ],
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Si tuviera más tiempo, aprendería a tocar guitarra, pero ahora tengo mucha tarea." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "If I would have more time": "After if: If I had more time." Si dice "I will learn": "It\'s imagined: I would learn." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Si tuviera más tiempo, aprendería a tocar guitarra, pero ahora tengo mucha tarea.",
          respuesta: "If I had more time, I would learn to play the guitar, but right now I have a lot of homework.",
          aceptadas: ["If I had more time, I'd learn the guitar, but now I have a lot of homework."],
          palabras: [],
          partes: ["If I had more time, I would learn to play the guitar,", "but right now I have a lot of homework."],
          explicaciones: [
            { siDice: "If I would have more time", explicacion: "After if: If I had more time.", es: "Después de if: If I had more time." },
            { siDice: "I will learn", explicacion: "It's imagined: I would learn.", es: "Es algo imaginado: I would learn." },
          ],
          porRevisar: [
            "explicaciones.es: traducciones",
            "partes: la frase empieza por if y también lleva but; se partió justo antes de but, la palabra que une",
          ],
        },
      ],
    },
    {
      numero: 4,
      titulo: "Todo B1 con Allison",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "On Saturdays, I visit my sister Emily, who lives in New York too. If it\'s sunny on Sunday, I\'ll walk in the park. But it might rain, so I could stay home and watch a movie instead!" (no está escrito). Pregunta: ¿qué podría hacer Allison si llueve? Elige entre tres tarjetas dibujadas por la app: Stay home and watch a movie. / Walk in the park. / Visit Emily.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "On Saturdays, I visit my sister Emily, who lives in New York too.",
            "If it's sunny on Sunday, I'll walk in the park.",
            "But it might rain, so I could stay home and watch a movie instead!",
          ],
          traduccion: [],
          pregunta: "¿Qué podría hacer Allison si llueve?",
          opciones: [
            { texto: "Walk in the park.", descripcion: "Walk in the park." },
            { texto: "Stay home and watch a movie.", descripcion: "Stay home and watch a movie." },
            { texto: "Visit Emily.", descripcion: "Visit Emily." },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos, una de cada parada de la 6 a la 10: When was your school built? What's a place where you feel happy? What will you do if you have free time this weekend? Where might you go on your next vacation? If you could have any job, what would it be?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("A pilot."); Allison pide la frase completa',
          preguntas: [
            { pregunta: "When was your school built?", modelo: "I think it was built in 1985." },
            { pregunta: "What's a place where you feel happy?", modelo: "My grandma's house is a place where I always feel happy." },
            { pregunta: "What will you do if you have free time this weekend?", modelo: "If I have free time, I'll play soccer with my friends." },
            { pregunta: "Where might you go on your next vacation?", modelo: "I might go to Cartagena, or we could visit my cousins in Cali." },
            { pregunta: "If you could have any job, what would it be?", modelo: "I would be a pilot, because I love traveling." },
          ],
          aceptadas: ["A pilot."],
          segundos: 20,
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            '¿Cuánto recuerdas de Allison? Ficha con cinco datos ya vistos, uno por parada de la 6 a la 10, tapados: cuándo se abrió el metro de Nueva York, qué música la pone a bailar, qué hará si le da gripa, si podría ir a Medellín algún día y qué haría si ganara mucho dinero. Arma cada pregunta sin palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            'Una sola pista en inglés: "Ask me about the New York subway! Start with: When was…?" Hay un botón de ayuda con la pregunta escrita.',
          tambienSeAcepta:
            'Cualquier pregunta que se entienda: "New York subway, when it opened?", "What music makes you dance?", "If you win a lot of money, what you do?"',
          ficha: "lo que recuerdas de Allison (un dato por parada, de la 6 a la 10)",
          // "Lo que responde Allison en la Entrevista (sale de su ficha y de lo
          // aprobado en las paradas 6 a 10; el repaso no agrega datos suyos)".
          // La tabla trae la parada en vez del dato: el dato sale de "Qué aparece".
          datos: [
            {
              dato: "Cuándo se abrió el metro de Nueva York (parada 6)",
              pregunta: "When was the first subway line in New York opened?",
              respuesta: "It was opened in 1904. And I take the subway to work every day! How do you get to school?",
            },
            {
              dato: "Qué música la pone a bailar (parada 7)",
              pregunta: "What's a kind of music that makes you want to dance?",
              respuesta: "Pop! And I like reggaeton a little. They're great for dancing!",
            },
            {
              dato: "Qué hará si le da gripa (parada 8)",
              pregunta: "What will you do if you get a cold?",
              respuesta: "If I get a cold, I'll drink hot tea with honey and rest a lot.",
            },
            {
              dato: "Si podría ir a Medellín algún día (parada 9)",
              pregunta: "Do you think you might go to Medellín someday?",
              respuesta: "I might! I've never been there, but now I really want to go.",
            },
            {
              dato: "Qué haría si ganara mucho dinero (parada 10)",
              pregunta: "What would you do if you won a lot of money?",
              respuesta: "I would take my sister Emily on a trip to Colombia!",
            },
          ],
          aceptadas: ["New York subway, when it opened?", "What music makes you dance?", "If you win a lot of money, what you do?"],
          ayuda:
            'Una sola pista en inglés: "Ask me about the New York subway! Start with: When was…?" Hay un botón de ayuda con la pregunta escrita.',
          minimoIntervenciones: 10,
          pistas: [
            "Ask me about the New York subway! Start with: When was…?",
            "Ask me about music! Start with: What's a kind of music…?",
            "Ask me about getting a cold! Start with: What will you do if…?",
            "Ask me about Medellín! Start with: Do you think…?",
            "Ask me about money! Start with: What would you do if…?",
          ],
          porRevisar: [
            'ficha: sale de "¿Cuánto recuerdas de Allison?"',
            'datos: la tabla del documento trae la parada (6 a 10) en vez del dato; cada dato sale de la lista de "Qué aparece"',
            "pistas: la primera es la del documento; las otras cuatro se escribieron con el mismo patrón",
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "El vuelo cancelado, el hotel lleno y el concierto",
    // "La portada de Vancouver (de la parada 4)".
    imagen: "vancouver",
    contexto:
      "Hoy es martes y es el final de tu viaje por Canadá. Tu mamá, la que te acompañó en Halifax, llegó a Vancouver hace dos días para volver contigo a Colombia; como ella no habla inglés, tú haces la llamada. Esta noche van al concierto de la cantante colombiana que le encanta a Zoe (la de la parada 7): tienen las boletas desde hace tres meses. Mañana miércoles, a las siete de la mañana, vuelan a Bogotá. Pero esta mañana llegó un mensaje: el vuelo fue cancelado. Llamas a la aerolínea y te atiende Ms. Park (Allison en su papel).",
    personaje: "Ms. Park, la agente de servicio al cliente de la aerolínea, por teléfono",
    objetivo:
      "Resolver solo un viaje con varios imprevistos usando todo B1: contar qué pasó, explicar por qué una opción no le sirve, escoger otra con una razón, pedir lo que necesita y proponer otra solución cuando el hotel está lleno",
    // Las tareas 1, 2, 3 y 5 son las de "Tareas visibles"; la 4 aparece con
    // el imprevisto. En qué paradas se apoya cada una ("Tarea que cumple" del
    // diálogo): 1, paradas 1, 3 y 6; 2, paradas 5, 7 y 10; 3, paradas 4 y 9;
    // 4, paradas 9 y 8; 5, parada 1.
    tareas: [
      "Saluda y di qué pasó con tu vuelo.",
      "Explica por qué no te sirve la primera opción.",
      "Escoge la otra opción y pide lo que necesitas.",
      "Tu hotel está lleno: propón otra solución para esa noche.",
      "Agradece y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Ms. Park busca una noche más en tu hotel: está lleno, porque hay un festival grande en Vancouver. Ahí aparece la tarea 4: "Tu hotel está lleno: propón otra solución para esa noche."',
      linea: "Of course. Let me check… Oh, I'm sorry. Your hotel is full tomorrow night. There's a big festival in Vancouver this week.",
    },
    // "Diálogo de ejemplo (12 intervenciones del alumno)". Las tareas 2, 3, 4 y
    // 5 se cumplen con dos líneas: las dos llevan el número. Dos líneas del
    // alumno no cumplen tarea y el documento solo marca la parada que repasan:
    // la del nombre de la reserva (parada 6) y la de las canciones (parada 2).
    dialogo: [
      { quien: "personaje", dice: "Good morning! Thank you for calling. This is Ms. Park. How can I help you?" },
      {
        quien: "alumno",
        dice: "Hi, Ms. Park! Our flight to Bogotá has been canceled. By the time I woke up, the airline had already sent us a message.",
        tarea: 1,
      },
      { quien: "personaje", dice: "I'm so sorry about that. What's the name on the reservation?" },
      // (parada 6)
      { quien: "alumno", dice: "The reservation was made under my mom's name, Marta Gómez. She doesn't speak English, so I'm calling for her." },
      {
        quien: "personaje",
        dice: "Thank you. Yes, I see it. Your flight tomorrow morning was canceled because there's a problem with the plane. I can put you on a flight tonight at nine, or on the same flight on Thursday morning.",
      },
      {
        quien: "alumno",
        dice: "The flight tonight won't work for us. We have tickets for a concert tonight, and we've been waiting for it for three months!",
        tarea: 2,
      },
      { quien: "personaje", dice: "Oh, really? Who's playing?" },
      {
        quien: "alumno",
        dice: "A Colombian singer who sings in English and Spanish. If we took the flight tonight, we would miss the concert!",
        tarea: 2,
      },
      { quien: "personaje", dice: "Oh no, you can't miss that!" },
      {
        quien: "alumno",
        dice: "Exactly. I think the flight on Thursday is better for us, because then we can go to the concert.",
        tarea: 3,
      },
      { quien: "personaje", dice: "No problem. Done! You're on Thursday's flight at seven in the morning." },
      {
        quien: "alumno",
        dice: "Thank you! But now we need a hotel for one more night. Could the airline pay for another night at our hotel?",
        tarea: 3,
      },
      // (imprevisto)
      {
        quien: "personaje",
        dice: "Of course. Let me check… Oh, I'm sorry. Your hotel is full tomorrow night. There's a big festival in Vancouver this week.",
      },
      { quien: "alumno", dice: "Oh no! Maybe we could stay at a hotel near the airport. Our flight is very early.", tarea: 4 },
      { quien: "personaje", dice: "Good idea! Let me look… Yes, the airport hotel has a room. And there's a free bus to the airport." },
      { quien: "alumno", dice: "Perfect! If we sleep near the airport, we won't be late for our flight.", tarea: 4 },
      {
        quien: "personaje",
        dice: "Exactly. And don't worry: the airline will pay for the room, because the problem was with our plane.",
      },
      { quien: "alumno", dice: "That's great news! My mom will be so happy." },
      { quien: "personaje", dice: "I've sent everything to your email. Is there anything else I can help you with?" },
      { quien: "alumno", dice: "No, that's all. Thank you so much, Ms. Park. You've been really helpful!", tarea: 5 },
      { quien: "personaje", dice: "My pleasure! So, are you excited about the concert?" },
      // (parada 2)
      { quien: "alumno", dice: "Yes! When I was little, I used to listen to her songs with my mom every weekend." },
      { quien: "personaje", dice: "That's so sweet! Enjoy the concert, and have a safe flight home." },
      { quien: "alumno", dice: "Thank you! Have a great day, Ms. Park. Bye!", tarea: 5 },
    ],
    // Ayuda: "La idea de la tarea actual, en inglés y sin la frase (…). Apaga
    // una estrella".
    ayudas: [
      "Say what happened to your flight.",
      "Explain why the first option doesn't work for you.",
      "Choose the other option and ask for what you need.",
      "Suggest another place to stay.",
      "Thank her and say goodbye.",
    ],
    resumen: "¡Lo lograste! Resolviste solo, en inglés, un viaje con varios imprevistos usando todo B1.",
    recompensa:
      'Tres estrellas si no usó la ayuda, la estampilla "B1 completo" en el pasaporte y se abre B2. El resumen muestra en qué parada tuvo más errores y le sugiere repasarla.',
    siSeAtasca: [],
    siSeAtascaTexto:
      'Igual que en el Repaso 1 (pregunta más simple, la ayuda con la idea en inglés al segundo fallo, en inglés si habla en español, sin correcciones durante la conversación y propuesta de repasar la parada de la tarea en la que se atascó). Si pasa de 24 intervenciones sin cumplir las tareas, Ms. Park cierra con amabilidad: "I\'ll send you an email with all the options. Have a good day!" En pantalla: Vamos a repasar las paradas que más te costaron y lo intentas de nuevo.',
    // Duración: "Mínimo 12 intervenciones; al cumplirlas, la app avisa y el
    // alumno puede seguir hablando si quiere".
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  notas: [
    'Nota para la docente: en Estados Unidos se escribe "canceled", con una sola l; "cancelled", con dos, es la forma de Canadá y del Reino Unido. Aunque el viaje es por Canadá, la app enseña la de Estados Unidos. Y "If I was him" cuenta como bien, como "If I was you" en la parada 10: Allison dice "Good! In the app we say: If I were him."',
    "Dato nuevo (aprobado el 18 de octubre de 2026). Ms. Park: solo en este escenario: la agente de servicio al cliente de la aerolínea en Vancouver.",
    "Dato nuevo (aprobado el 18 de octubre de 2026). Tu mamá: ya salió en la parada 9: no habla inglés y su apellido es Gómez. Nuevo aquí: se llama Marta y llegó a Vancouver para volver contigo a Colombia; no habla en la app.",
    "Dato nuevo (aprobado el 18 de octubre de 2026). La cantante de Zoe: la cantante colombiana de la parada 7 da un concierto en Vancouver al final del viaje; no habla en la app.",
    "Dato nuevo (aprobado el 18 de octubre de 2026). Zoe: vuelve a limpiar la playa con sus amigos; si llueve el sábado, podrían ir el domingo.",
    "Dato nuevo (aprobado el 18 de octubre de 2026). Liam: le hizo una tarjeta de agradecimiento al conductor que encontró su computador. Si tuviera una banda, tocaría en la panadería donde trabaja su mamá, y su abuela iría a todos los conciertos.",
    "Datos nuevos (aprobados el 18 de octubre de 2026). Allison: nada nuevo: todo lo suyo sale de su ficha y de lo aprobado en las paradas 6 a 10.",
  ],
};
