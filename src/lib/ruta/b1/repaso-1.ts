import type { Repaso } from "../tipos.ts";

/**
 * Repaso 1 · Toronto (B1). Documento "Contenido B1", aprobado el 17 de
 * octubre de 2026. No tiene ilustraciones nuevas: usa las de las paradas
 * 1 a 5 de B1 (tal cual) y las de A1 y A2 (con "a1/" o "a2/" delante).
 *
 * Datos nuevos de personajes (aprobados el 17 de octubre de 2026):
 *   · Mrs. Walker: la mamá de Zoe. La familia Walker hospeda al alumno en
 *     Toronto durante el repaso.
 *   · Zoe: ya compró su bicicleta nueva con lo que ahorró (cierra lo de la
 *     parada 5). Entrena hockey en una pista que el alumno ya conoce.
 *   · Liam: el fin de semana pasado pescó un pez muy grande. Los niños de la
 *     biblioteca le hicieron un dibujo.
 *   · Allison: nada nuevo; todo lo suyo sale de su ficha y de lo aprobado en
 *     las paradas 2 y 4.
 */
export const REPASO_1: Repaso = {
  nombre: "Repaso 1",
  despuesDeParada: 5,
  ciudad: "Toronto",
  titulo: "Una semana en Toronto",
  objetivo:
    "Al terminar, el alumno resuelve en inglés un malentendido usando todo lo de las paradas 1 a 5: dice dónde ha estado y desde cuándo, cuenta qué pasó y qué ya había pasado, compara con lo que hacía antes y da su opinión. No agrega gramática nueva.",
  comoEsDistinto:
    'Las lecciones 1 y 2 mezclan dos paradas cada una, la 3 repasa la parada 5 y la 4 junta todo con Allison. No hay palabras nuevas ni ilustraciones nuevas: usa las de A1, A2 y las paradas 1 a 5 de B1. Narra la secuencia vuelve sobre una historia ya vista y le suma una opinión. La Entrevista pregunta por datos de Allison ya vistos, uno por parada. Al final, la estampilla "Repaso 1" y se abre la parada 6.',
  portada: "toronto",
  lecciones: [
    {
      numero: 1,
      titulo: "Lo que has vivido y lo que hacías antes (paradas 1 y 2)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam has never been to Colombia, but he has tried arepas. When he was a kid, he used to fish with his grandpa every summer. Last weekend, he caught a really big fish!" (no está escrito). Pregunta: ¿qué hizo Liam el fin de semana pasado? Elige entre tres tarjetas dibujadas por la app: He caught a big fish. / He made arepas. / He went to Colombia.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam has never been to Colombia, but he has tried arepas.",
            "When he was a kid, he used to fish with his grandpa every summer.",
            "Last weekend, he caught a really big fish!",
          ],
          traduccion: [],
          pregunta: "¿Qué hizo Liam el fin de semana pasado?",
          opciones: [
            { texto: "He made arepas.", descripcion: "He made arepas." },
            { texto: "He went to Colombia.", descripcion: "He went to Colombia." },
            { texto: "He caught a big fish.", descripcion: "He caught a big fish." },
          ],
          correcta: 2,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Nunca he ido a un partido de hockey, pero de niño solía verlo en la televisión." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "I\'ve never went": "With have, use been: I\'ve never been." Si dice "I use to watch": "In the past: used to, with d." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Nunca he ido a un partido de hockey, pero de niño solía verlo en la televisión.",
          respuesta: "I've never been to a hockey game, but when I was a kid, I used to watch hockey on TV.",
          aceptadas: ["I have never been to a hockey game, but when I was little, I used to watch hockey on TV."],
          palabras: [],
          partes: ["I've never been to a hockey game,", "but when I was a kid, I used to watch hockey on TV."],
          explicaciones: [
            {
              siDice: "I've never went",
              explicacion: "With have, use been: I've never been.",
              es: "Con have, usa been: I've never been.",
            },
            {
              siDice: "I use to watch",
              explicacion: "In the past: used to, with d.",
              es: "Para el pasado: used to, con d.",
            },
          ],
          porRevisar: ["explicaciones.es: traducciones"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: Have you ever lost something on a trip? What did you use to do on Sundays when you were little? Have you finished your homework yet? Did you use to have a pet? What's the best place you've ever visited?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("Not yet."); Allison pide el detalle: "Tell me more!"',
          preguntas: [
            { pregunta: "Have you ever lost something on a trip?", modelo: "Yes, I have. I lost my jacket in Cartagena." },
            { pregunta: "What did you use to do on Sundays when you were little?", modelo: "I used to visit my grandma." },
            { pregunta: "Have you finished your homework yet?", modelo: "Not yet. I'm going to do it tonight." },
            { pregunta: "Did you use to have a pet?", modelo: "Yes, I did. I used to have a cat." },
            { pregunta: "What's the best place you've ever visited?", modelo: "The best place I've ever visited is Santa Marta." },
          ],
          aceptadas: ["Not yet."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 2,
      titulo: "Lo que ya había pasado y lo que opinas (paradas 3 y 4)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe and her mom went to a hockey game downtown. They got there late. By the time they arrived, Toronto had already scored two goals! Zoe thinks it was the best game of the year." (no está escrito). Pregunta: ¿qué había pasado cuando llegaron? Elige entre tres tarjetas dibujadas por la app: Toronto had scored two goals. / The game had ended. / Toronto had lost.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe and her mom went to a hockey game downtown.",
            "They got there late.",
            "By the time they arrived, Toronto had already scored two goals!",
            "Zoe thinks it was the best game of the year.",
          ],
          traduccion: [],
          pregunta: "¿Qué había pasado cuando llegaron?",
          opciones: [
            { texto: "The game had ended.", descripcion: "The game had ended." },
            { texto: "Toronto had scored two goals.", descripcion: "Toronto had scored two goals." },
            { texto: "Toronto had lost.", descripcion: "Toronto had lost." },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Los cuatro dibujos del robo de la bicicleta de la parada 3 (f-robo-1 a f-robo-4). Allison: "Tell me the story again. Then tell me what you think: what should the girl do next time?" Debajo: first, then, after that, when, in my opinion.',
          siRespondeMal:
            'Si dice "When the police arrived, the thief left": "He left first: the thief had already left." Si no da su opinión, Allison pregunta: "And what do you think?" Si cuenta menos de 3 dibujos: "What happened next?"',
          tambienSeAcepta: "La historia con 3 dibujos o más y cualquier opinión con I think, In my opinion o should",
          imagenes: ["f-robo-1", "f-robo-2", "f-robo-3", "f-robo-4"],
          dibujos: [
            "4:00, una muchacha deja su bicicleta roja con canasta en el parqueadero de bicicletas y entra al café",
            "un muchacho de buzo verde y gorra negra abre el candado",
            "se va en la bicicleta",
            "4:20, llega la policía y la muchacha señala el lugar vacío",
          ],
          pregunta: "Tell me the story again. Then tell me what you think: what should the girl do next time?",
          debajo: ["first", "then", "after that", "when", "in my opinion"],
          modelo:
            "At four o'clock, a girl left her red bike outside a café. Then a young man opened the lock and rode away on it. When the police arrived, the thief had already left. In my opinion, she should use a better lock next time.",
          verbos: ["left", "opened", "rode away", "had already left"],
          gramatica:
            "past simple and past perfect (had already + past participle) with time connectors (then, when), plus an opinion with I think, In my opinion or should",
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
            'dibujos: el repaso no los describe; salen de "Qué aparece" de la parada 3 (lección 3, paso 2)',
            "verbos: salen del modelo",
            "gramatica: escrita para el evaluador a partir de las paradas 3 y 4",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about a time you changed your opinion about something." Tres preguntas guía: What did you use to think? What happened? What do you think now? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "I am agree that reading is fun" → Better: I agree that reading is fun. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Tell me about a time you changed your opinion about something.",
          guias: ["What did you use to think?", "What happened?", "What do you think now?"],
          modelo:
            "I used to think that reading was boring. Then last year my cousin gave me a book about soccer. I read it every night, and by the end of the month I had finished it! Now I think reading is great, because I learn a lot. In my opinion, you just need the right book.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Desde cuándo (parada 5)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam has been volunteering at the library since January. He has been reading stories to little kids every Wednesday. Last week, the kids drew a picture for him!" (no está escrito). Pregunta: ¿qué hicieron los niños la semana pasada? Elige entre tres tarjetas dibujadas por la app: They drew a picture for him. / They read a book to him. / They sang a song for him.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam has been volunteering at the library since January.",
            "He has been reading stories to little kids every Wednesday.",
            "Last week, the kids drew a picture for him!",
          ],
          traduccion: [],
          pregunta: "¿Qué hicieron los niños la semana pasada?",
          opciones: [
            { texto: "They drew a picture for him.", descripcion: "They drew a picture for him." },
            { texto: "They read a book to him.", descripcion: "They read a book to him." },
            { texto: "They sang a song for him.", descripcion: "They sang a song for him." },
          ],
          correcta: 0,
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'El dibujo de la muchacha paseando un perro (f-pasear-perro, de la parada 5). Allison: "Zoe started walking her neighbor\'s dog in September. How long has she been doing it?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: She\'s been…". Sin pista, Allison dice "She\'s been walking the dog since September" y el alumno la repite. Si dice "She walks the dog since September": "From then until now: she\'s been walking."',
          imagen: "f-pasear-perro",
          pregunta: "Zoe started walking her neighbor's dog in September. How long has she been doing it?",
          respuesta: "She's been walking the dog since September.",
          aceptadas: ["She has been walking her neighbor's dog since September.", "She's been doing it since September."],
          pistas: ["Start with: She's been…"],
          explicaciones: [
            {
              siDice: "She walks the dog since September",
              explicacion: "From then until now: she's been walking.",
              es: "Desde entonces hasta ahora: she's been walking.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece: 'Frase en español: "Llevo dos horas estudiando, así que estoy cansado." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "I\'m studying for two hours": "From then until now: I\'ve been studying." Si dice "since two hours": "For a period of time, use for: for two hours." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Llevo dos horas estudiando, así que estoy cansado.",
          respuesta: "I've been studying for two hours, so I'm tired.",
          aceptadas: ["I have been studying for two hours, so I'm very tired."],
          palabras: [],
          partes: ["I've been studying for two hours,", "so I'm tired."],
          explicaciones: [
            {
              siDice: "I'm studying for two hours",
              explicacion: "From then until now: I've been studying.",
              es: "Desde entonces hasta ahora: I've been studying.",
            },
            {
              siDice: "since two hours",
              explicacion: "For a period of time, use for: for two hours.",
              es: "Para un período de tiempo, usa for: for two hours.",
            },
          ],
          porRevisar: ["explicaciones.es: traducciones"],
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
            'Allison cuenta: "When I was a kid, I used to play soccer in the park with my sister Emily. Now I visit her every Saturday. Last Saturday, we made arepas together!" (no está escrito). Pregunta: ¿qué hicieron Allison y Emily el sábado pasado? Elige entre unas arepas (a2/f-arepas), una pizza (a1/f-pizza) y un cine (a2/f-cine).',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "When I was a kid, I used to play soccer in the park with my sister Emily.",
            "Now I visit her every Saturday.",
            "Last Saturday, we made arepas together!",
          ],
          traduccion: [],
          pregunta: "¿Qué hicieron Allison y Emily el sábado pasado?",
          opciones: [
            { imagen: "a1/f-pizza", descripcion: "Una pizza" },
            { imagen: "a2/f-cine", descripcion: "Un cine" },
            { imagen: "a2/f-arepas", descripcion: "Unas arepas" },
          ],
          correcta: 2,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos, una de cada parada: What have you done this week? What did you use to watch on TV when you were little? By the time you got to class today, what had you already done? What do you think about homework? How long have you been studying English?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("Three years."); Allison pide la frase completa',
          preguntas: [
            { pregunta: "What have you done this week?", modelo: "I've finished a big science project." },
            { pregunta: "What did you use to watch on TV when you were little?", modelo: "I used to watch cartoons every morning." },
            {
              pregunta: "By the time you got to class today, what had you already done?",
              modelo: "I had already eaten lunch and finished my homework.",
            },
            { pregunta: "What do you think about homework?", modelo: "I think it's useful, because we practice." },
            { pregunta: "How long have you been studying English?", modelo: "I've been studying English for three years." },
          ],
          aceptadas: ["Three years."],
          segundos: 20,
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            '¿Cuánto recuerdas de Allison? Ficha con cinco datos ya vistos, uno por parada, tapados: si ha estado en Cartagena, a qué jugaba de niña, qué ya había hecho hoy antes de trabajar, qué opina de los taxis de Nueva York y desde cuándo tiene a Luna. Arma cada pregunta sin palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            'Una sola pista en inglés: "Ask me about Cartagena! Start with: Have you ever…?" Hay un botón de ayuda con la pregunta escrita.',
          tambienSeAcepta:
            'Cualquier pregunta que se entienda: "You been to Cartagena?", "What you played as a kid?", "Luna, how long?"',
          ficha: "Allison (datos ya vistos, uno por parada)",
          // Respuestas de Allison del documento: salen de su ficha y de lo
          // aprobado en las paradas 2 y 4; el repaso no agrega datos suyos.
          datos: [
            {
              dato: "Si ha estado en Cartagena (parada 1)",
              pregunta: "Have you ever been to Cartagena?",
              respuesta: "No, I've never been there, but I really want to go!",
            },
            {
              dato: "A qué jugaba de niña (parada 2)",
              pregunta: "What did you use to play when you were a kid?",
              respuesta: "I used to play soccer in the park with Emily every weekend.",
            },
            {
              dato: "Qué ya había hecho hoy antes de trabajar (parada 3)",
              pregunta: "By the time you got to work today, what had you already done?",
              respuesta: "I had already had my coffee! I always drink coffee in the morning.",
            },
            {
              dato: "Qué opina de los taxis de Nueva York (parada 4)",
              pregunta: "What do you think about taxis in New York?",
              respuesta: "I think they're very expensive. The subway and the ferry are better!",
            },
            {
              dato: "Desde cuándo tiene a Luna (parada 5)",
              pregunta: "How long have you had Luna?",
              respuesta: "I've had her for three years. She's three years old!",
            },
          ],
          aceptadas: ["You been to Cartagena?", "What you played as a kid?", "Luna, how long?"],
          ayuda:
            'Una sola pista en inglés: "Ask me about Cartagena! Start with: Have you ever…?" Hay un botón de ayuda con la pregunta escrita.',
          minimoIntervenciones: 10,
          pistas: [
            "Ask me about Cartagena! Start with: Have you ever…?",
            "Ask me about when I was a kid! Start with: What did you use to…?",
            "Ask me about this morning! Start with: By the time you got to work…?",
            "Ask me about taxis in New York! Start with: What do you think…?",
            "Ask me about Luna! Start with: How long have you…?",
          ],
          porRevisar: [
            "pistas: solo la primera está en el documento; las otras cuatro siguen el mismo patrón",
            'dato: sale de la lista de "Qué aparece", con la parada de la tabla',
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "El malentendido con la bicicleta de Zoe",
    imagen: "toronto",
    contexto:
      "Pasas una semana en Toronto con la familia de Zoe. Esta mañana tomaste la bicicleta azul del garaje para dar una vuelta por el lago. Cuando vuelves, Mrs. Walker, la mamá de Zoe (Allison en su papel), te espera en la puerta: esa bicicleta era la nueva de Zoe, la que compró con sus ahorros.",
    personaje: "Mrs. Walker, la mamá de Zoe, tu familia anfitriona en Toronto",
    objetivo:
      "Resolver un malentendido usando todo lo de las paradas 1 a 5: decir qué ha estado haciendo, contar qué pasó, explicar por qué lo hizo, proponer una solución y disculparse",
    tareas: [
      "Saluda y di qué has estado haciendo esta mañana y desde cuándo.",
      "Di qué bicicleta tomaste y cuándo.",
      "Explica por qué creíste que podías usarla.",
      "Propón una solución para Zoe.",
      "Discúlpate y di qué vas a hacer la próxima vez.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Mrs. Walker ve que la llanta de atrás está pinchada, y Zoe necesita la bicicleta para ir al hockey en media hora. Ahí aparece la tarea 4: "Propón una solución para Zoe."',
      linea: "I understand. Oh, wait. Look at the back tire. It's flat! And Zoe needs the bike for hockey practice in half an hour!",
    },
    // La columna "Tarea que cumple" dice además de qué parada es cada tarea
    // (no hay campo para eso): 1 → parada 5; 2 → parada 1; 3 → paradas 3 y 2;
    // 4 → parada 4; 5 → parada 4. Es la parada que Allison propone repasar si
    // se atasca en esa tarea.
    dialogo: [
      { quien: "personaje", dice: "There you are! Where have you been? We've been looking for you!" },
      { quien: "alumno", dice: "Hi, Mrs. Walker! I've been riding a bike around the lake since nine.", tarea: 1 },
      { quien: "personaje", dice: "A bike? Which bike?" },
      { quien: "alumno", dice: "The blue bike in the garage. I took it this morning, after breakfast.", tarea: 2 },
      { quien: "personaje", dice: "Oh no. That's Zoe's new bike! She bought it yesterday with her savings." },
      { quien: "alumno", dice: "Really? I'm so sorry! I didn't know that." },
      { quien: "personaje", dice: "Didn't Zoe tell you?" },
      {
        quien: "alumno",
        dice: "No. When I woke up, she had already gone to her friend's house, and nobody had told me about the new bike.",
        tarea: 3,
      },
      { quien: "personaje", dice: "I see. But why did you think you could take it?" },
      { quien: "alumno", dice: "In Colombia, I used to ride my cousin's bike all the time. In my family, we always share bikes.", tarea: 3 },
      {
        quien: "personaje",
        dice: "I understand. Oh, wait. Look at the back tire. It's flat! And Zoe needs the bike for hockey practice in half an hour!",
      },
      { quien: "alumno", dice: "Oh no! I'm really sorry. I think I should fix it. There's a bike shop near the lake.", tarea: 4 },
      { quien: "personaje", dice: "Zoe doesn't have time for that." },
      {
        quien: "alumno",
        dice: "You're right. Then I can go with her on the bus to her practice, and I'll fix the tire this afternoon.",
        tarea: 4,
      },
      { quien: "personaje", dice: "That's a good idea. Do you know the way?" },
      { quien: "alumno", dice: "Yes, I do. I've been to the arena with Zoe before." },
      { quien: "personaje", dice: "Perfect. She'll be happy." },
      { quien: "alumno", dice: "I'm really sorry, Mrs. Walker. In my opinion, I should always ask first.", tarea: 5 },
      { quien: "personaje", dice: "I agree. And Zoe should tell you about her new things too!" },
      { quien: "alumno", dice: "That's true. Next time, I'll ask before I borrow anything.", tarea: 5 },
      { quien: "personaje", dice: "Thank you. You're a great guest. Zoe is on her way home now." },
      { quien: "alumno", dice: "Great. I'll wait for her here and explain everything." },
      { quien: "personaje", dice: "Thank you for being honest." },
      { quien: "alumno", dice: "Thank you for understanding, Mrs. Walker!" },
    ],
    ayudas: [
      "Say what you've been doing and since when.",
      "Say which bike you took and when.",
      "Explain why you thought you could use it.",
      "Offer a solution for Zoe.",
      "Say sorry and what you'll do next time.",
    ],
    resumen: "¡Lo lograste! Resolviste en inglés un malentendido usando todo lo de las paradas 1 a 5.",
    recompensa:
      'Tres estrellas si no usó la ayuda, la estampilla "Repaso 1" en el pasaporte y se abre la parada 6. El resumen muestra en qué parada tuvo más errores y le sugiere repasarla.',
    siSeAtasca: [],
    siSeAtascaTexto:
      "Igual que en las paradas de B1 (pregunta más simple, la ayuda con la idea en inglés al segundo fallo, en inglés si habla en español, sin correcciones durante la conversación y cierre amable a las 24 intervenciones). La única diferencia: si se atasca en una tarea, Allison propone repasar la parada de esa tarea, no una lección.",
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  notas: [
    'Nota para la docente: "have" de tener no va con -ing, así que la pregunta de la parada 5 es "How long have you had Luna?" y nunca "have you been having".',
    "Dato nuevo (aprobado el 17 de octubre de 2026). Mrs. Walker: la mamá de Zoe. La familia Walker hospeda al alumno en Toronto durante el repaso.",
    "Dato nuevo (aprobado el 17 de octubre de 2026). Zoe: ya compró su bicicleta nueva con lo que ahorró (cierra lo de la parada 5). Entrena hockey en una pista que el alumno ya conoce.",
    "Dato nuevo (aprobado el 17 de octubre de 2026). Liam: el fin de semana pasado pescó un pez muy grande. Los niños de la biblioteca le hicieron un dibujo.",
    "Datos nuevos (aprobados el 17 de octubre de 2026). Allison: nada nuevo; todo lo suyo sale de su ficha y de lo aprobado en las paradas 2 y 4.",
  ],
};
