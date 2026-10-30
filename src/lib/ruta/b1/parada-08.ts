import type { Parada } from "../tipos.ts";

/**
 * Parada 8 · Banff (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; las opciones de Escucha y elige son tarjetas
 * que dibuja la app.
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Zoe: su colegio empezó un proyecto de reciclaje. El sábado limpia la
 *     playa con sus amigos y lleva guantes y bolsas para todos.
 *   · Liam: su familia quiere ir a acampar a Banff el próximo verano.
 *   · Ranger Moore: solo en este escenario, la guardaparques en Banff.
 *   · Allison: nada nuevo; todo lo que responde en la Entrevista ya está en
 *     su ficha.
 */
export const PARADA_08: Parada = {
  numero: 8,
  ciudad: "Banff",
  titulo: "Habla del medio ambiente",
  gramatica: "Condicional 1: if + will",
  objetivo:
    'Al terminar, el alumno dice qué pasará si hacemos o no hacemos algo: "If we don\'t recycle, the river will get worse." Gramática: condicional 1 (if + presente, will + verbo). Usa todo lo anterior y nada de paradas posteriores (ni might ni could para posibilidad, ni if + would).',
  fraseMeta: "If we don't recycle, the river will get worse.",
  portada: "banff",
  vocabulario: [
    {
      grupo: "Condicional 1",
      ingles: "If + presente, will + verbo: If it rains, we'll stay inside. If we don't recycle, the river will get worse.",
      nota: 'Después de if va el presente, nunca will: "If it rains", nunca "If it will rain"',
    },
    {
      grupo: "El medio ambiente",
      ingles: "recycle, trash, plastic, pollution, wildfire, smoke, protect, save water, waste, wildlife",
      nota: '"Trash" y "garbage" de Estados Unidos, nunca "rubbish". "Wildfire" es el incendio forestal',
    },
    {
      grupo: "El parque",
      ingles: "trail, ranger, bear, elk, campsite, hiking, closed, safe, map",
      nota: '"Ranger" es el guardaparques',
    },
    {
      grupo: "Frases",
      ingles: "What will happen if…? If you see a bear, stay calm. If we take our trash with us, the park will stay clean.",
      nota: 'Con una orden también vale: "If you see a bear, don\'t run."',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Si pasa esto…",
      objetivo: "Decir qué pasará si pasa algo, con if + presente y will.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe\'s school is starting a recycling project. If every student brings one plastic bottle a week, the school will recycle thousands of bottles this year. The class that recycles the most will win a pizza party!" (no está escrito). Pregunta: ¿qué ganará el salón que más recicle? Elige entre tres tarjetas dibujadas por la app: A pizza party / A trip / New books.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe's school is starting a recycling project.",
            "If every student brings one plastic bottle a week, the school will recycle thousands of bottles this year.",
            "The class that recycles the most will win a pizza party!",
          ],
          traduccion: [],
          pregunta: "¿Qué ganará el salón que más recicle?",
          opciones: [
            { texto: "A trip", descripcion: "A trip" },
            { texto: "A pizza party", descripcion: "A pizza party" },
            { texto: "New books", descripcion: "New books" },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de un muchacho cepillándose los dientes con la llave del agua abierta. Allison: "He leaves the water on. What will happen if everyone does that?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: If everyone does that, we\'ll…". Sin pista, Allison dice la frase y el alumno la repite. Si dice "If everyone will do that": "After if, no will: If everyone does that."',
          imagen: "f-llave-abierta",
          pregunta: "He leaves the water on. What will happen if everyone does that?",
          respuesta: "If everyone does that, we'll waste a lot of water.",
          aceptadas: ["will waste", "are going to waste", "will run out of water", "will not have water", "will not have any water", "will not have enough water", "will be no water", "will not be any water", "will not be enough water"],
          pistas: ["Start with: If everyone does that, we'll…"],
          explicaciones: [
            { siDice: "If everyone will do that", explicacion: "After if, no will: If everyone does that.", es: "Después de if no va will: If everyone does that." },
            { siDice: "we waste", explicacion: "It's in the future: we'll waste a lot of water.", es: "Es en el futuro: we'll waste a lot of water." },
          ],
          porRevisar: ["aceptadas: también «We'll waste water», «We'll run out of water» y «There won't be any water»; explicación para «We waste a lot of water» (sin will) (cambio del 30 de octubre de 2026)", "explicaciones.es: la traducción no estaba en el documento"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "If it rains, we\'ll stay inside." Se practica que se oiga la l de we\'ll.',
          siRespondeMal:
            'Si dice "we stay" sin la l: "Listen: we\'ll, with a soft l at the end. Say it: If it rains, we\'ll stay inside."',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "If it rains, we'll stay inside.",
          palabraDificil: "we'll",
          consejo: "Listen: we'll, with a soft l at the end.",
          consejoEs: "Escucha: we'll, con una l suave al final.",
          porRevisar: ["consejoEs: la traducción no estaba en el documento"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "¿Qué pasará?",
      objetivo: "Hablar de las consecuencias de lo que hacemos con el medio ambiente.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "There\'s a lot of smoke in Banff today because of a wildfire far away. If the wind changes tonight, the smoke will go away. Until then, the park says people should stay inside." (no está escrito). Pregunta: ¿qué pasará si cambia el viento? Elige entre tres tarjetas dibujadas por la app: The smoke will go away. / The park will close. / It will rain.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "There's a lot of smoke in Banff today because of a wildfire far away.",
            "If the wind changes tonight, the smoke will go away.",
            "Until then, the park says people should stay inside.",
          ],
          traduccion: [],
          pregunta: "¿Qué pasará si cambia el viento?",
          opciones: [
            { texto: "The park will close.", descripcion: "The park will close." },
            { texto: "It will rain.", descripcion: "It will rain." },
            { texto: "The smoke will go away.", descripcion: "The smoke will go away." },
          ],
          correcta: 2,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Si no reciclamos, el río se pondrá peor, así que tenemos que hacer algo." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "If we won\'t recycle": "After if, no will: If we don\'t recycle." Si dice "the river get worse": "Use will: the river will get worse." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Si no reciclamos, el río se pondrá peor, así que tenemos que hacer algo.",
          respuesta: "If we don't recycle, the river will get worse, so we have to do something.",
          aceptadas: ["If we don't recycle, the river is going to get worse, so we need to do something."],
          palabras: [],
          partes: ["If we don't recycle, the river will get worse,", "so we have to do something."],
          explicaciones: [
            {
              siDice: "If we won't recycle",
              explicacion: "After if, no will: If we don't recycle.",
              es: "Después de if no va will: If we don't recycle.",
            },
            {
              siDice: "the river get worse",
              explicacion: "Use will: the river will get worse.",
              es: "Usa will: the river will get worse.",
            },
          ],
          porRevisar: [
            "partes: la frase empieza con if y además lleva so; se parte justo antes de so, la palabra que une",
            "explicaciones.es: la traducción no estaba en el documento",
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "What will happen to your city if people don\'t take care of it?" Tres preguntas guía: What\'s a problem in your city? What will happen if nobody does anything? What will you do? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "If it will rain, the streets will flood" → Better: If it rains, the streets will flood. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "What will happen to your city if people don't take care of it?",
          guias: ["What's a problem in your city?", "What will happen if nobody does anything?", "What will you do?"],
          modelo:
            "In my city, there's a lot of trash in the river. If people keep throwing plastic in the water, the fish will die. If it rains a lot, the streets will flood. I think we need more recycling bins. This year I'll recycle at home, and if my friends help me, we'll clean the park near my school.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Una cosa lleva a la otra",
      objetivo: "Encadenar consecuencias con if + will.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam\'s family wants to go camping in Banff next summer. If they go in July, they\'ll see a lot of wildflowers. But if there\'s a wildfire, the campsite will be closed." (no está escrito). Pregunta: ¿qué verán si van en julio? Elige entre tres tarjetas dibujadas por la app: A lot of wildflowers / A lot of snow / A lot of bears.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam's family wants to go camping in Banff next summer.",
            "If they go in July, they'll see a lot of wildflowers.",
            "But if there's a wildfire, the campsite will be closed.",
          ],
          traduccion: [],
          pregunta: "¿Qué verán si van en julio?",
          opciones: [
            { texto: "A lot of wildflowers", descripcion: "A lot of wildflowers" },
            { texto: "A lot of snow", descripcion: "A lot of snow" },
            { texto: "A lot of bears", descripcion: "A lot of bears" },
          ],
          correcta: 0,
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden en un campamento de Banff: (1) una familia deja basura y comida en el campamento; (2) un oso huele la comida; (3) el oso llega al campamento; (4) la guardaparques cierra el campamento. Allison: "Tell me what will happen. Use if in each part." Debajo: first, then, after that, so.',
          siRespondeMal:
            'Si dice "If the bear will smell the food": "After if, no will: If the bear smells the food." Allison repite bien la frase y el alumno la dice. Si cuenta menos de 3 dibujos: "And then what will happen?"',
          tambienSeAcepta: "Cualquier cadena con if y will, aunque cambien las palabras",
          imagenes: ["f-oso-1", "f-oso-2", "f-oso-3", "f-oso-4"],
          dibujos: [
            "una familia deja basura y comida en el campamento",
            "un oso huele la comida",
            "el oso llega al campamento",
            "la guardaparques cierra el campamento",
          ],
          pregunta: "Tell me what will happen. Use if in each part.",
          debajo: ["first", "then", "after that", "so"],
          modelo:
            "First, if people leave food at the campsite, a bear will smell it. Then, if the bear smells the food, it will come to the campsite. After that, if the bear comes to the campsite, the ranger will close it. So if we take our trash with us, the campsite will stay open!",
          verbos: ["leave", "will smell", "will come", "will close"],
          gramatica: "first conditional: if + present, will + verb (an if in each part)",
          explicaciones: [
            {
              siDice: "If the bear will smell the food",
              explicacion: "After if, no will: If the bear smells the food.",
              es: "Después de if no va will: If the bear smells the food.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            "verbos: salen del modelo",
            "gramatica: escrita para el evaluador; no está en el documento",
            "explicaciones.es: la traducción no estaba en el documento",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: What will you do if it rains this weekend? What will happen if you don't study for your next test? What will you do if you see a bear? What will you do if you have a free afternoon tomorrow? How will you help the planet this year?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("Watch movies."); Allison pide la frase completa',
          preguntas: [
            { pregunta: "What will you do if it rains this weekend?", modelo: "If it rains, I'll watch movies at home." },
            { pregunta: "What will happen if you don't study for your next test?", modelo: "If I don't study, I'll get a bad grade." },
            { pregunta: "What will you do if you see a bear?", modelo: "If I see a bear, I'll stay calm and walk away slowly." },
            {
              pregunta: "What will you do if you have a free afternoon tomorrow?",
              modelo: "If I have a free afternoon, I'll play soccer.",
            },
            { pregunta: "How will you help the planet this year?", modelo: "I'll use less plastic and recycle at home." },
          ],
          aceptadas: ["Watch movies."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Entrevista a Allison",
      objetivo: "Preguntarle a alguien qué hará si pasa algo, con What will you do if…?",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe and her friends are cleaning the beach on Saturday. If more than twenty students come, they\'ll clean the whole beach in two hours. Zoe is bringing gloves and trash bags for everyone." (no está escrito). Pregunta: ¿qué lleva Zoe? Elige entre tres tarjetas dibujadas por la app: Gloves and trash bags / Sandwiches / A map.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe and her friends are cleaning the beach on Saturday.",
            "If more than twenty students come, they'll clean the whole beach in two hours.",
            "Zoe is bringing gloves and trash bags for everyone.",
          ],
          traduccion: [],
          pregunta: "¿Qué lleva Zoe?",
          opciones: [
            { texto: "Sandwiches", descripcion: "Sandwiches" },
            { texto: "Gloves and trash bags", descripcion: "Gloves and trash bags" },
            { texto: "A map", descripcion: "A map" },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece: 'Frase en español: "Si ves un oso, no corras, porque te va a seguir." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "If you will see a bear": "After if, no will: If you see a bear." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Si ves un oso, no corras, porque te va a seguir.",
          respuesta: "If you see a bear, don't run, because it will follow you.",
          aceptadas: ["If you see a bear, don't run, because it's going to follow you."],
          palabras: [],
          partes: ["If you see a bear, don't run,", "because it will follow you."],
          explicaciones: [
            {
              siDice: "If you will see a bear",
              explicacion: "After if, no will: If you see a bear.",
              es: "Después de if no va will: If you see a bear.",
            },
          ],
          porRevisar: [
            "partes: la frase empieza con if y además lleva because; se parte justo antes de because, la palabra que une",
            "explicaciones.es: la traducción no estaba en el documento",
          ],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Los planes de Allison: ficha con cinco datos por descubrir: qué hará si hace sol el domingo, si llueve el fin de semana, si le da gripa, si Emily la visita y si tiene una tarde libre. Arma cada pregunta sin palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            'Una sola pista en inglés: "Ask me about Sunday! Start with: What will you do if…?" Hay un botón de ayuda con la pregunta escrita.',
          tambienSeAcepta:
            'Cualquier pregunta que se entienda: "If sunny, what you do?", "And if it rains?", "Emily visits, what you will do?"',
          ficha: "los planes de Allison",
          datos: [
            {
              dato: "Si hace sol el domingo",
              pregunta: "What will you do if it's sunny on Sunday?",
              respuesta: "If it's sunny, I'll walk in the park. It's my favorite place in New York!",
            },
            {
              dato: "Si llueve el fin de semana",
              pregunta: "What will you do if it rains this weekend?",
              respuesta: "If it rains, I'll stay home and watch a movie.",
            },
            {
              dato: "Si le da gripa",
              pregunta: "What will you do if you get a cold?",
              respuesta: "If I get a cold, I'll drink hot tea with honey and rest a lot.",
            },
            {
              dato: "Si Emily la visita",
              pregunta: "What will you do if Emily visits you?",
              respuesta: "If Emily visits me, we'll make arepas!",
            },
            {
              dato: "Si tiene una tarde libre",
              pregunta: "What will you do if you have a free afternoon?",
              respuesta: "If I have a free afternoon, I'll cook something Colombian.",
            },
          ],
          aceptadas: ["If sunny, what you do?", "And if it rains?", "Emily visits, what you will do?"],
          ayuda:
            'Una sola pista en inglés: "Ask me about Sunday! Start with: What will you do if…?" Hay un botón de ayuda con la pregunta escrita.',
          minimoIntervenciones: 10,
          pistas: [
            "Ask me about Sunday! Start with: What will you do if…?",
            "Ask me about a rainy weekend! Start with: What will you do if…?",
            "Ask me about a cold! Start with: What will you do if…?",
            "Ask me about Emily! Start with: What will you do if…?",
            "Ask me about a free afternoon! Start with: What will you do if…?",
          ],
          porRevisar: ["pistas: solo la primera (Sunday) está en el documento; las otras cuatro siguen su patrón"],
        },
      ],
    },
  ],
  // Escenario: nada escrito de nuevo; solo el título lleva mayúscula inicial
  // ("Escenario: el sendero cerrado" en el documento).
  escenario: {
    titulo: "El sendero cerrado",
    imagen: "e-banff-sendero",
    contexto:
      "Estás en el Parque Nacional Banff con tu familia anfitriona. Antes de empezar la caminata al lago, Ranger Moore, la guardaparques (Allison en su papel), habla contigo en la entrada del sendero.",
    personaje: "Ranger Moore, la guardaparques en Banff",
    objetivo:
      "Decir qué caminata quiere hacer, preguntar qué pasará si ve un animal, decir qué hará para cuidar el parque y escoger otra opción cuando cierran el sendero",
    tareas: [
      "Saluda y di qué sendero quieres hacer y cuándo.",
      "Pregunta qué pasará si ves un animal.",
      "Di qué harás para cuidar el parque.",
      "El sendero está cerrado: pregunta qué opciones hay y escoge una.",
      "Agradece y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Ranger Moore recibe una llamada por radio: hay un incendio cerca del lago y cierran el sendero por hoy. Ahí aparece la tarea 4: "El sendero está cerrado: pregunta qué opciones hay y escoge una."',
      linea:
        "Exactly! Thank you. Oh, wait. I'm getting a radio call… There's a wildfire near the lake. The trail is closed for today.",
    },
    dialogo: [
      { quien: "personaje", dice: "Good morning! Are you going on a hike today?" },
      { quien: "alumno", dice: "Good morning! Yes, I want to hike the lake trail this morning.", tarea: 1 },
      { quien: "personaje", dice: "Great choice. Have you hiked here before?" },
      { quien: "alumno", dice: "No, I haven't. It's my first time in Banff." },
      { quien: "personaje", dice: "Welcome! Do you have any questions before you go?" },
      { quien: "alumno", dice: "Yes. What will happen if I see a bear?", tarea: 2 },
      {
        quien: "personaje",
        dice: "If you see a bear, stay calm and don't run. If you make noise while you walk, the bears will usually stay away.",
      },
      { quien: "alumno", dice: "OK. And what will happen if I see an elk?", tarea: 2 },
      { quien: "personaje", dice: "Just keep your distance. They're very big! And what will you do to protect the park?" },
      { quien: "alumno", dice: "I'll take all my trash with me. If I leave food on the trail, the animals will eat it.", tarea: 3 },
      {
        quien: "personaje",
        dice: "Exactly! Thank you. Oh, wait. I'm getting a radio call… There's a wildfire near the lake. The trail is closed for today.",
      },
      { quien: "alumno", dice: "Oh no! What are my options?", tarea: 4 },
      { quien: "personaje", dice: "You can hike the river trail. It's safe, and it's open today." },
      { quien: "alumno", dice: "Is it far? If it's too long, my host family will be tired." },
      { quien: "personaje", dice: "It's about two hours. If you start now, you'll be back for lunch." },
      { quien: "alumno", dice: "Perfect. I think we'll take the river trail.", tarea: 4 },
      { quien: "personaje", dice: "Good choice. Here's a map." },
      { quien: "alumno", dice: "Thank you. Will the lake trail be open tomorrow?" },
      { quien: "personaje", dice: "If it rains tonight, it will probably open tomorrow. Check our website." },
      { quien: "alumno", dice: "OK. I hope it rains!" },
      { quien: "personaje", dice: "Me too! Have a great hike!" },
      { quien: "alumno", dice: "Thanks for your help, Ranger Moore." },
      { quien: "personaje", dice: "You're welcome. Be safe out there!" },
      { quien: "alumno", dice: "We will. Goodbye!", tarea: 5 },
    ],
    ayudas: [
      "Say which trail you want to hike and when.",
      "Ask what will happen if you see an animal.",
      "Say what you'll do to protect the park.",
      "Ask about other options and choose one.",
      "Thank her and say goodbye.",
    ],
    resumen:
      "¡Lo lograste! Hablaste en inglés de lo que pasará si haces o no haces algo, y escogiste otro plan cuando cerraron el sendero.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Banff en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"The mountains are beautiful" → They are! Which trail do you want to hike?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Ask what will happen if you see an animal."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"¿Y si veo un oso?" → Sorry, in English, please! What\'s your question?',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo: '"If I will see a bear" → la escena sigue; en el resumen: After if, no will: If I see a bear.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Ranger Moore: "Enjoy the park, and be safe!" En pantalla: Vamos a repasar el condicional con if y will y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["banff"],
      muestra: "Portada de la ciudad: el pueblo de Banff entre montañas con nieve, el río Bow y un lago turquesa",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-banff-sendero"],
      muestra: "La entrada de un sendero con un tablero de mapas, montañas y un lago turquesa al fondo",
      uso: "Escenario",
    },
    {
      archivos: ["f-llave-abierta"],
      muestra: "Un muchacho cepillándose los dientes con la llave del agua abierta",
      uso: "Lección 1 (paso 2)",
    },
    {
      archivos: ["f-oso-1", "f-oso-2", "f-oso-3", "f-oso-4"],
      muestra:
        "Los cuatro dibujos de la cadena en el campamento, con el mismo fondo: la basura y la comida, el oso huele, el oso llega, la guardaparques cierra el campamento",
      uso: "Lección 3 (paso 2)",
    },
  ],
};
