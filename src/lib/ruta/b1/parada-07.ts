import type { Parada } from "../tipos.ts";

/**
 * Parada 7 · Quebec (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; las de A1 o A2 que se reutilizan llevan su
 * carpeta delante.
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison: nada nuevo. No sabe mucho de vallenato, y lo demás ya está
 *     en su ficha: le gusta el pop y un poco el reguetón, y le encanta bailar.
 *   · Zoe: le gusta una banda que toca los viernes en un café de Toronto; la
 *     cantante va a su colegio. Su cantante favorita es una colombiana que
 *     canta en inglés y español, y por eso quiere aprender español.
 *   · Liam: vio una película de terror y durmió con la luz prendida. Está
 *     leyendo una novela de un muchacho que viaja en el tiempo.
 *   · Julie: solo en este escenario, una voluntaria del festival de cine de
 *     Quebec.
 */
export const PARADA_07: Parada = {
  numero: 7,
  ciudad: "Quebec",
  titulo: "Recomienda cine, música o libros",
  gramatica: "Adjetivos -ed/-ing y oraciones de relativo",
  objetivo:
    'Al terminar, el alumno recomienda una película, una canción o un libro y dice cómo lo hizo sentir: "It\'s a movie that everyone finds exciting." Gramática: adjetivos -ed y -ing (bored, boring) y oraciones de relativo (who, that, which, where). Usa todo lo anterior y nada de paradas posteriores (ni if + will, ni might, ni if + would).',
  fraseMeta: "It's a movie that everyone finds exciting.",
  portada: "quebec",
  vocabulario: [
    {
      grupo: "Adjetivos -ed y -ing",
      ingles:
        "bored/boring, excited/exciting, interested/interesting, tired/tiring, surprised/surprising, amazed/amazing, scared/scary",
      nota: '-ing para lo que causa la sensación ("The movie is boring"); -ed para cómo te sientes ("I\'m bored"). "I\'m boring" quiere decir "soy aburrido". Ojo: scared/scary (nunca "scaring")',
    },
    {
      grupo: "Oraciones de relativo",
      ingles:
        'who (personas), that (personas y cosas), which (cosas; en Estados Unidos casi siempre después de coma: "Encanto, which takes place in Colombia, is great."), where (lugares)',
      nota: '"It\'s a movie that everyone loves." "She\'s the actor who plays the doctor." "It\'s the theater where we met."',
    },
    {
      grupo: "Cine, música y libros",
      ingles: "movie, actor, director, plot, ending, soundtrack, band, singer, album, novel, review, sold out",
      nota: '"Movie" de Estados Unidos; "sold out" es agotado',
    },
    {
      grupo: "Frases",
      ingles: "You should watch… It's a movie that… It's about a girl who… The ending is surprising. I was really excited.",
      nota: 'Para recomendar: "You should…" o "I recommend it because…"',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Bored o boring?",
      objetivo: "Decir cómo es algo y cómo te hace sentir, con -ing y -ed.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam watched a horror movie last night. He was so scared that he slept with the light on! He says the ending was really surprising." (no está escrito). Pregunta: ¿cómo se sintió Liam? Elige entre tres tarjetas dibujadas por la app: He was scared. / He was bored. / He was tired.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam watched a horror movie last night.",
            "He was so scared that he slept with the light on!",
            "He says the ending was really surprising.",
          ],
          traduccion: [],
          pregunta: "¿Cómo se sintió Liam?",
          opciones: [
            { texto: "He was tired.", descripcion: "He was tired." },
            { texto: "He was bored.", descripcion: "He was bored." },
            { texto: "He was scared.", descripcion: "He was scared." },
          ],
          correcta: 2,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de un muchacho bostezando en el cine. Allison: "How does he feel? And how is the movie?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: He\'s bored…". Sin pista, Allison dice "He\'s bored, because the movie is boring" y el alumno la repite. Si dice "He\'s boring": "He isn\'t boring! He feels bored: he\'s bored."',
          imagen: "f-cine-aburrido",
          pregunta: "How does he feel? And how is the movie?",
          respuesta: "He's bored, because the movie is boring.",
          aceptadas: ["He's bored.", "The movie is boring.", "He feels bored."],
          pistas: ["Start with: He's bored…"],
          explicaciones: [
            {
              siDice: "He's boring",
              explicacion: "He isn't boring! He feels bored: he's bored.",
              es: "¡Él no es aburrido! Se siente aburrido: he's bored.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece:
            'Audio de Allison: "I was bored, then surprised, and then really excited." Se practica la -ed: en bored y surprised suena d; en excited suena id.',
          siRespondeMal:
            'Si dice "bor-ed": "Listen: bored and surprised end with a d sound; excited ends with id. Say it: I was bored, then surprised, and then really excited."',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "I was bored, then surprised, and then really excited.",
          palabraDificil: "bored",
          consejo: "Listen: bored and surprised end with a d sound; excited ends with id.",
          consejoEs: "Escucha: bored y surprised terminan con sonido de d; excited termina con id.",
          porRevisar: [
            "consejoEs: traducción",
            "palabraDificil: el documento practica tres palabras (bored, surprised y excited); va bored, la del error previsto (\"bor-ed\")",
          ],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Recomienda algo",
      objetivo: "Recomendar algo y explicar de qué se trata, con who, that, which y where.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe loves a band that plays at a small café in Toronto every Friday. The singer is a girl who goes to her school! Zoe says their songs are amazing." (no está escrito). Pregunta: ¿dónde toca la banda? Elige entre tres tarjetas dibujadas por la app: At a small café / At her school / At a stadium.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe loves a band that plays at a small café in Toronto every Friday.",
            "The singer is a girl who goes to her school!",
            "Zoe says their songs are amazing.",
          ],
          traduccion: [],
          pregunta: "¿Dónde toca la banda?",
          opciones: [
            { texto: "At her school", descripcion: "At her school" },
            { texto: "At a small café", descripcion: "At a small café" },
            { texto: "At a stadium", descripcion: "At a stadium" },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Es una película que todos encuentran emocionante, porque el final es muy sorprendente." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "everyone find": "Everyone finds, with s." Si dice "excited": "The movie causes the feeling: exciting." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Es una película que todos encuentran emocionante, porque el final es muy sorprendente.",
          respuesta: "It's a movie that everyone finds exciting, because the ending is very surprising.",
          aceptadas: ["It's a movie which everyone finds exciting, because the ending is really surprising."],
          palabras: [],
          partes: ["It's a movie that everyone finds exciting,", "because the ending is very surprising."],
          explicaciones: [
            {
              siDice: "everyone find",
              explicacion: "Everyone finds, with s.",
              es: "Everyone finds, con s.",
            },
            {
              siDice: "excited",
              explicacion: "The movie causes the feeling: exciting.",
              es: "La película causa la sensación: exciting.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Recommend a movie, a series or a book to me." Tres preguntas guía: What\'s it about? Who is in it? Why should I watch it? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "The movie was very excited" → Better: The movie was very exciting. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Recommend a movie, a series or a book to me.",
          guias: ["What's it about?", "Who is in it?", "Why should I watch it?"],
          modelo:
            "You should watch Encanto. It's a movie that takes place in Colombia. It's about a girl who lives with her family in a magic house. The music is amazing, and the ending is really surprising. I was so excited when I watched it. I think everyone who loves music will like it.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "La noche de cine",
      objetivo: "Contar una experiencia y cómo se sintió cada momento.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam is reading a novel about a boy who travels in time. The beginning was a little boring, but now he can\'t stop reading. He thinks it\'s the most interesting book he\'s ever read!" (no está escrito). Pregunta: ¿qué piensa Liam ahora del libro? Elige entre tres tarjetas dibujadas por la app: It\'s very interesting. / It\'s funny. / It\'s too long.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam is reading a novel about a boy who travels in time.",
            "The beginning was a little boring, but now he can't stop reading.",
            "He thinks it's the most interesting book he's ever read!",
          ],
          traduccion: [],
          pregunta: "¿Qué piensa Liam ahora del libro?",
          opciones: [
            { texto: "It's very interesting.", descripcion: "It's very interesting." },
            { texto: "It's funny.", descripcion: "It's funny." },
            { texto: "It's too long.", descripcion: "It's too long." },
          ],
          correcta: 0,
          porRevisar: ["opciones: «It's funny.» en vez de «It's boring.»: el libro fue aburrido solo al comienzo (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden de la noche de cine de Zoe: (1) Zoe y sus amigos compran boletas para una película de miedo; (2) al empezar están emocionados y comen crispetas; (3) en una escena de miedo todos gritan; (4) al final salen del cine riendo. Allison: "Tell me about Zoe\'s movie night. How did they feel?" Debajo: first, then, after that, in the end.',
          siRespondeMal:
            'Si dice "they were exciting": "They felt it: they were excited." Allison repite bien la frase y el alumno la dice. Si cuenta menos de 3 dibujos, Allison señala el que falta: "What happened next?"',
          tambienSeAcepta: "Narraciones con un adjetivo -ed o -ing y una oración de relativo, aunque cambien las palabras",
          imagenes: ["f-noche-cine-1", "f-noche-cine-2", "f-noche-cine-3", "f-noche-cine-4"],
          dibujos: [
            "Zoe y sus amigos compran boletas para una película de miedo",
            "Al empezar están emocionados y comen crispetas",
            "En una escena de miedo todos gritan",
            "Al final salen del cine riendo",
          ],
          pregunta: "Tell me about Zoe's movie night. How did they feel?",
          debajo: ["first", "then", "after that", "in the end"],
          modelo:
            "First, Zoe and her friends bought tickets for a movie that everyone says is scary. At the beginning, they were excited and ate popcorn. Then there was a scary scene, and everyone screamed. In the end, they left the theater laughing. Zoe thinks it's the most exciting movie she's ever seen.",
          verbos: ["bought", "were excited", "screamed", "left"],
          gramatica:
            "-ed and -ing adjectives (excited, scary, exciting) and relative clauses (who, that, which, where), in the past simple",
          explicaciones: [
            {
              siDice: "they were exciting",
              explicacion: "They felt it: they were excited.",
              es: "Ellos lo sintieron: they were excited.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            "verbos: salen del modelo",
            "gramatica: escrita para el evaluador",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: What's the most exciting movie you've ever seen? Who is a singer that you love? What's a book that you found boring? What's a place where you like to watch movies? What makes you bored?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("Karol G."); Allison pide la frase completa',
          preguntas: [
            {
              pregunta: "What's the most exciting movie you've ever seen?",
              modelo: "The most exciting movie I've ever seen is Spider-Man.",
            },
            { pregunta: "Who is a singer that you love?", modelo: "Karol G is a singer that I love." },
            { pregunta: "What's a book that you found boring?", modelo: "A book that I found boring was my history book." },
            {
              pregunta: "What's a place where you like to watch movies?",
              modelo: "My living room is the place where I like to watch movies.",
            },
            { pregunta: "What makes you bored?", modelo: "Long car trips make me bored." },
          ],
          aceptadas: ["Karol G."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Enséñale a Allison",
      objetivo: "Explicarle a Allison qué es el vallenato y recomendarle una canción.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe\'s favorite singer is a woman who sings in English and Spanish. Zoe was really surprised when she found out that the singer is from Colombia. Now she wants to learn Spanish!" (no está escrito). Pregunta: ¿por qué se sorprendió Zoe? Elige entre tres tarjetas dibujadas por la app: The singer is from Colombia. / The singer is her neighbor. / The singer is sixteen.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe's favorite singer is a woman who sings in English and Spanish.",
            "Zoe was really surprised when she found out that the singer is from Colombia.",
            "Now she wants to learn Spanish!",
          ],
          traduccion: [],
          pregunta: "¿Por qué se sorprendió Zoe?",
          opciones: [
            { texto: "The singer is her neighbor.", descripcion: "The singer is her neighbor." },
            { texto: "The singer is from Colombia.", descripcion: "The singer is from Colombia." },
            { texto: "The singer is sixteen.", descripcion: "The singer is sixteen." },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "La cantante que más me gusta es de Colombia, pero canta en inglés." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "The singer which": "For people, use who or that." Si dice "she sing": "She sings, with s." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "La cantante que más me gusta es de Colombia, pero canta en inglés.",
          respuesta: "The singer who I like the most is from Colombia, but she sings in English.",
          aceptadas: ["The singer that I like most is from Colombia, but she sings in English."],
          palabras: [],
          partes: ["The singer who I like the most is from Colombia,", "but she sings in English."],
          explicaciones: [
            {
              siDice: "The singer which",
              explicacion: "For people, use who or that.",
              es: "Para personas, usa who o that.",
            },
            {
              siDice: "she sing",
              explicacion: "She sings, with s.",
              es: "She sings, con s.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "ensenale",
          queAparece:
            'Allison: "I love music, but I don\'t know much about vallenato! Teach me about it." Cuatro preguntas en orden, de la lista de abajo. Dibujo de un acordeón, una caja y una guacharaca.',
          siRespondeMal:
            'Si responde con una palabra: "Tell me more!" y repite la pregunta. Si habla en español: "In English, please!" y la pregunta más simple. Si no conoce el vallenato: "Tell me about a kind of music from your city!" y sigue la lista con esa música.',
          tambienSeAcepta: "Respuestas que se entienden aunque tengan errores",
          tema: "el vallenato",
          apertura: "I love music, but I don't know much about vallenato! Teach me about it.",
          imagen: "f-vallenato",
          preguntas: [
            {
              pregunta: "What instruments are used in vallenato?",
              simple: "What instruments do they play?",
              modelo: "It's played with an accordion, a small drum called a caja, and a guacharaca.",
            },
            {
              pregunta: "Who is a singer that I should listen to?",
              simple: "Who is a good singer?",
              modelo: "You should listen to Carlos Vives. He's a singer who mixes vallenato and pop.",
            },
            {
              pregunta: "What's a song that you love?",
              simple: "What's your favorite song?",
              modelo: "A song that I love is La gota fría.",
            },
            {
              pregunta: "How do you feel when you listen to it?",
              simple: "How does it make you feel?",
              modelo: "When I listen to it, I feel happy and excited!",
            },
          ],
          reacciones: ["That sounds amazing!", "I love that!", "I'm so interested now!", "I want to listen to it!"],
          cierre: "Thank you! Now I'm really excited to listen to vallenato!",
          minimoRespuestas: 3,
          respuestasDeAllison: [
            { siPregunta: "qué música le gusta", respuesta: "I love pop, and I like reggaeton a little. They're great for dancing!" },
          ],
          otraPregunta: "Good question! But today you're the teacher. Tell me more!",
          porRevisar: ["preguntas.simple: las cuatro versiones simples no están en el documento"],
        },
      ],
    },
  ],
  // Escenario: todo sale del documento; no hay textos por revisar.
  escenario: {
    titulo: "El festival de cine",
    imagen: "e-quebec-festival",
    contexto:
      "Estás en el festival de cine de Quebec. En la fila, Julie, una voluntaria del festival (Allison en su papel), te pregunta qué películas te gustan y te pide que le recomiendes una. Las películas de la escena son inventadas.",
    personaje: "Julie, una voluntaria del festival de cine de Quebec",
    objetivo:
      "Decir qué películas le gustan y cómo lo hacen sentir, recomendar una película explicando de qué trata y por qué, y resolver cuando está agotada",
    tareas: [
      "Saluda y di qué películas te gustan y cómo te hacen sentir.",
      "Recomiéndale una película y di de qué trata.",
      "Explica por qué la recomiendas.",
      "Está agotada: recomiéndale otra película y di de qué trata.",
      "Pídele una recomendación, agradece y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Julie revisa: la función que recomendaste está agotada hoy y mañana. Ahí aparece la tarea 4: "Está agotada: recomiéndale otra película y di de qué trata."',
      linea: "OK, you convinced me! Let me check… Oh no. It's sold out tonight and tomorrow.",
    },
    dialogo: [
      { quien: "personaje", dice: "Hi! Welcome to the Quebec City Film Festival! Are you excited?" },
      { quien: "alumno", dice: "Hi! Yes, I'm really excited. It's my first film festival!", tarea: 1 },
      { quien: "personaje", dice: "What kind of movies do you like?" },
      {
        quien: "alumno",
        dice: "I love movies that are scary, because I feel so excited when I watch them. I think romantic movies are boring.",
        tarea: 1,
      },
      { quien: "personaje", dice: "Ha! I'm the opposite. Can you recommend a movie for me?" },
      { quien: "alumno", dice: "Sure. You should watch The Night Bus. It's a movie that everyone finds exciting.", tarea: 2 },
      { quien: "personaje", dice: "What's it about?" },
      { quien: "alumno", dice: "It's about a girl who takes the last bus of the night, and the bus never stops.", tarea: 2 },
      { quien: "personaje", dice: "That sounds scary! Why do you like it?" },
      { quien: "alumno", dice: "Because the ending is really surprising. I was so shocked!", tarea: 3 },
      { quien: "personaje", dice: "OK, you convinced me! Let me check… Oh no. It's sold out tonight and tomorrow." },
      { quien: "alumno", dice: "Oh no! Then you should see Blue River. It's a movie that was made here in Quebec.", tarea: 4 },
      { quien: "personaje", dice: "Is it scary too?" },
      { quien: "alumno", dice: "No, it isn't. It's about a boy who loves hockey. It's funny and very interesting.", tarea: 4 },
      { quien: "personaje", dice: "That sounds perfect for me. Thanks for the recommendation!" },
      { quien: "alumno", dice: "You're welcome. Can you recommend a movie for me?", tarea: 5 },
      { quien: "personaje", dice: "Sure! The Last Lighthouse. It's a story that will keep you awake all night!" },
      { quien: "alumno", dice: "That sounds amazing. Where is it playing?" },
      { quien: "personaje", dice: "Right here, in the theater where we are now! It starts at nine." },
      { quien: "alumno", dice: "Great! I'll go tonight." },
      { quien: "personaje", dice: "Enjoy it! It was nice to meet you." },
      { quien: "alumno", dice: "Nice to meet you too, Julie. Thank you!" },
      { quien: "personaje", dice: "Have a great time in Quebec City!" },
      { quien: "alumno", dice: "Thanks! Bye!", tarea: 5 },
    ],
    ayudas: [
      "Say what movies you like and how they make you feel.",
      "Recommend a movie and say what it's about.",
      "Say why you recommend it.",
      "Recommend another movie and say what it's about.",
      "Ask for a recommendation and say goodbye.",
    ],
    resumen: "¡Lo lograste! Recomendaste películas en inglés, dijiste de qué tratan y cómo te hicieron sentir.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Quebec en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like popcorn" → Me too! And what kind of movies do you like?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Recommend a movie and say what it\'s about."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Es de miedo" → Sorry, in English, please! What\'s it about?',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo: '"I was very boring" → la escena sigue; en el resumen: You felt it: I was very bored.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Julie: "Enjoy the festival!" En pantalla: Vamos a repasar los adjetivos -ed y -ing y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["quebec"],
      muestra: "Portada de la ciudad: el castillo Frontenac, la muralla antigua y el río San Lorenzo",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-quebec-festival"],
      muestra: "El vestíbulo de un teatro antiguo durante el festival, con afiches sin letras y una taquilla",
      uso: "Escenario",
    },
    { archivos: ["f-cine-aburrido"], muestra: "Un muchacho bostezando en el cine", uso: "Lección 1 (paso 2)" },
    {
      archivos: ["f-noche-cine-1", "f-noche-cine-2", "f-noche-cine-3", "f-noche-cine-4"],
      muestra:
        "Los cuatro dibujos de la noche de cine de Zoe: compran boletas, comen crispetas emocionados, gritan en una escena de miedo, salen riendo",
      uso: "Lección 3 (paso 2)",
    },
    { archivos: ["f-vallenato"], muestra: "Un acordeón, una caja y una guacharaca", uso: "Lección 4 (paso 3)" },
  ],
};
