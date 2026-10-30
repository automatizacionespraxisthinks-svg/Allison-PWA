import type { Parada } from "../tipos.ts";

/**
 * Parada 1 · Toronto (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; las de A1 que se reutilizan llevan "a1/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026). Zoe y
 * Liam vuelven en las paradas siguientes, como Priya y Ben en A2:
 *   · Zoe: 16 años, de Toronto. Le encanta viajar con su familia: ha
 *     estado dos veces en Vancouver (la última en julio; vieron ballenas).
 *     Este año ha perdido el celular dos veces.
 *   · Liam: 16 años, de Montreal. Nunca ha estado en Colombia, pero el mes
 *     pasado probó las arepas en un restaurante colombiano de Montreal y
 *     quiere aprender a hacerlas. Sus abuelos viven en Montreal (parada 2).
 *   · Ms. Patel: solo en este escenario; agente de equipaje de la
 *     aerolínea en el aeropuerto de Toronto.
 *   · Allison: nada nuevo. En Enséñale a Allison usa lo que ya dice su
 *     ficha: ha estado en Bogotá y Boyacá, nunca en Cartagena, y quiere ir.
 */
export const PARADA_01: Parada = {
  numero: 1,
  ciudad: "Toronto",
  titulo: "Cuenta una experiencia",
  gramatica: "Presente perfecto contra pasado simple",
  objetivo:
    'Al terminar, el alumno cuenta lo que ha vivido y cuándo pasó: "My bag hasn\'t arrived. I checked it in Bogotá this morning." Gramática: presente perfecto contra pasado simple. Usa A1 y A2 y nada de paradas posteriores de B1 (ni used to, ni pasado perfecto, ni voz pasiva).',
  fraseMeta: "My bag hasn't arrived. I checked it in Bogotá this morning.",
  portada: "toronto",
  vocabulario: [
    {
      grupo: "Experiencias (presente perfecto)",
      ingles: "ever, never, already, yet, just, so far, twice, three times",
      nota: 'Sin fecha: "I\'ve been to Cartagena twice." Con fecha va el pasado: "I went there last December."',
    },
    {
      grupo: "Cuándo (pasado simple)",
      ingles: "yesterday, last summer, two days ago, in 2024, this morning, when I was ten",
      nota: '"This morning" ya terminado va con pasado: "I checked my bag this morning."',
    },
    {
      grupo: "En el aeropuerto",
      ingles: "flight, airline, check in, checked bag, carry-on, baggage claim, gate, boarding pass, delayed, suitcase",
      nota: '"Baggage claim" y "carry-on" de Estados Unidos',
    },
    {
      grupo: "Frases",
      ingles:
        "Have you ever been to…? Yes, I have. I went there last year. I've just arrived. My bag hasn't arrived yet. I've already checked in.",
      nota: '"Been to" es haber ido y volver: "I\'ve been to Toronto." "Gone to" es que allá sigue: "She\'s gone to Toronto." En Estados Unidos también se oye "Did you eat yet?": la app enseña "Have you eaten yet?" y acepta las dos',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Alguna vez…?",
      objetivo:
        "Decir lo que has vivido alguna vez y cuándo pasó. Las explicaciones salen en inglés sencillo; «En español» las muestra traducidas.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe has been to Vancouver twice. The last time, she went in July with her family. They saw whales!" (no está escrito). Pregunta: ¿en qué mes fue Zoe a Vancouver la última vez? Elige entre tres tarjetas dibujadas por la app: July, March y January.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Zoe has been to Vancouver twice.", "The last time, she went in July with her family.", "They saw whales!"],
          traduccion: [],
          pregunta: "¿En qué mes fue Zoe a Vancouver la última vez?",
          opciones: [
            { texto: "March", descripcion: "March" },
            { texto: "July", descripcion: "July" },
            { texto: "January", descripcion: "January" },
          ],
          correcta: 1,
          porRevisar: ["opciones: March en vez de June, que sonaba y se veía casi igual a July; la pregunta dice que es el mes de Vancouver (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "He estado en Cartagena dos veces. La última vez fui en diciembre." Dibujo de las murallas de Cartagena. Sin palabras de apoyo.',
          siRespondeMal:
            'Se marca la primera palabra que falla y Allison da solo la primera palabra de esa parte ("I\'ve…", "The last time, I…"). Si dice "I have went": "With have, use been: I\'ve been." Si dice "I\'ve gone there in December": "With a date, use the past: I went in December." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "He estado en Cartagena dos veces. La última vez fui en diciembre.",
          imagen: "f-cartagena-murallas",
          respuesta: "I've been to Cartagena twice. The last time, I went in December.",
          aceptadas: ["I have been to Cartagena two times. The last time I went there in December."],
          palabras: [],
          partes: ["I've been to Cartagena twice.", "The last time, I went in December."],
          explicaciones: [
            {
              siDice: "I have went",
              explicacion: "With have, use been: I've been.",
              es: "Con have, se usa been: I've been.",
            },
            {
              siDice: "I've gone there in December",
              explicacion: "With a date, use the past: I went in December.",
              es: "Con una fecha, se usa el pasado: I went in December.",
            },
          ],
          porRevisar: [
            "explicaciones.es: traducciones",
            'partes: la frase no lleva because, but, when ni so; se parte en el punto, como las partes que da el documento ("I\'ve…", "The last time, I…")',
          ],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "I\'ve never been to Canada." Se practica que se oiga la v de I\'ve.',
          siRespondeMal:
            'Si no se oye la v ("I never been"): "Listen: I\'ve. Your top teeth touch your lip. Say it: I\'ve never been to Canada."',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "I've never been to Canada.",
          palabraDificil: "I've",
          consejo: "Listen: I've. Your top teeth touch your lip.",
          consejoEs: "Escucha: I've. Los dientes de arriba tocan el labio.",
          porRevisar: ["consejoEs: traducción"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "En el aeropuerto",
      objetivo: "Decir lo que ya pasó, lo que todavía no y lo que acaba de pasar (already, yet, just).",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam has just arrived in Toronto. He was very hungry, so he has already bought a sandwich. His flight to Montreal leaves in an hour." (no está escrito). Pregunta: ¿qué ya hizo Liam en el aeropuerto? Elige entre tres imágenes de Liam: comprando un sándwich, en la puerta de embarque y en la fila del check-in.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam has just arrived in Toronto.",
            "He was very hungry, so he has already bought a sandwich.",
            "His flight to Montreal leaves in an hour.",
          ],
          traduccion: [],
          pregunta: "¿Qué ya hizo Liam en el aeropuerto?",
          opciones: [
            { imagen: "f-liam-puerta", descripcion: "Liam en la puerta de embarque", dice: "Liam at his gate" },
            { imagen: "f-liam-checkin", descripcion: "Liam en la fila del check-in", dice: "Liam in the check-in line" },
            { imagen: "f-liam-sandwich", descripcion: "Liam comprando un sándwich", dice: "Liam buying a sandwich" },
          ],
          correcta: 2,
          porRevisar: ["audio y pregunta en positivo («He was very hungry, so he has already bought a sandwich», ¿qué ya hizo?); antes «hasn't bought a sandwich yet» con el dibujo de Liam comprándolo, y el check-in también era algo que no había hecho. El yet sigue en el ¿Qué es esto? siguiente. Cada dibujo suena al elegirlo (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de la zona de equipaje: la banda está vacía y un muchacho espera preocupado. Allison: "His bag isn\'t here. What does he say to the airline?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: My bag…". Sin pista, Allison dice "My bag hasn\'t arrived yet" y el alumno la repite. Si dice "My bag no arrive": "Use hasn\'t: My bag hasn\'t arrived."',
          imagen: "f-banda-vacia",
          pregunta: "His bag isn't here. What does he say to the airline?",
          respuesta: "My bag hasn't arrived.",
          aceptadas: ["My bag hasn't arrived yet.", "My bag didn't arrive.", "I can't find my bag."],
          pistas: ["Start with: My bag…"],
          explicaciones: [
            {
              siDice: "My bag no arrive",
              explicacion: "Use hasn't: My bag hasn't arrived.",
              es: "Usa hasn't: My bag hasn't arrived.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about a trip you\'ve taken." Tres preguntas guía en pantalla: Where have you been? When did you go? What did you do there? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "I have been there last year" → Better: I went there last year. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Tell me about a trip you've taken.",
          guias: ["Where have you been?", "When did you go?", "What did you do there?"],
          modelo:
            "I've been to Cartagena twice. The last time, I went in December with my family. We stayed near the beach. We walked in the old city and we ate a lot of fish. It was very hot! It's the most beautiful city I've ever visited.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Cuenta lo que pasó",
      objetivo:
        "Contar una historia que ya pasó con el pasado y decir cómo está todo ahora con el presente perfecto.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe has lost her phone twice this year. The first time, she left it on the bus. The second time, she looked everywhere, and then she found it in her backpack!" (no está escrito). Pregunta: ¿dónde estaba el celular la segunda vez? Elige entre tres imágenes: un celular en una mochila, en el asiento de un bus y en un pupitre.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe has lost her phone twice this year.",
            "The first time, she left it on the bus.",
            "The second time, she looked everywhere, and then she found it in her backpack!",
          ],
          traduccion: [],
          pregunta: "¿Dónde estaba el celular la segunda vez?",
          opciones: [
            { imagen: "f-celular-mochila", descripcion: "Un celular en una mochila", dice: "A phone in a backpack" },
            { imagen: "f-celular-bus", descripcion: "Un celular en el asiento de un bus", dice: "A phone on a bus seat" },
            { imagen: "f-celular-pupitre", descripcion: "Un celular en un pupitre", dice: "A phone on a school desk" },
          ],
          correcta: 0,
          porRevisar: ["opciones: cada dibujo dice su nombre en inglés al elegirlo (dice), sin texto a la vista (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden del viaje de Zoe: (1) esta mañana entrega su maleta en el aeropuerto de Toronto; (2) vuela a Vancouver; (3) espera una hora en la banda de equipaje; (4) en el mostrador de la aerolínea, sin maleta. Allison: "Tell me Zoe\'s story." Debajo: first, then, after that, now.',
          siRespondeMal:
            'Si dice "She has flown to Vancouver this morning", Allison repite bien la frase ("It\'s finished, with a time: she flew to Vancouver.") y el alumno la dice. Si cuenta menos de 3 dibujos, Allison señala el que falta: "What happened next?"',
          tambienSeAcepta:
            "Zoe checked in her bag. She took a plane to Vancouver. She waited for her bag for one hour. Her bag hasn't arrived yet. Her bag is lost.",
          imagenes: ["f-zoe-viaje-1", "f-zoe-viaje-2", "f-zoe-viaje-3", "f-zoe-viaje-4"],
          dibujos: [
            "Esta mañana Zoe entrega su maleta en el aeropuerto de Toronto",
            "Zoe vuela a Vancouver",
            "Zoe espera una hora en la banda de equipaje",
            "Zoe en el mostrador de la aerolínea, sin maleta",
          ],
          pregunta: "Tell me Zoe's story.",
          debajo: ["first", "then", "after that", "now"],
          modelo:
            "This morning Zoe checked her bag in Toronto. Then she flew to Vancouver. After that, she waited at baggage claim for an hour. Now she's at the airline desk: her bag hasn't arrived.",
          verbos: ["checked", "flew", "waited", "hasn't arrived"],
          gramatica:
            "past simple for what happened (checked, flew, waited) and present perfect for how things are now (hasn't arrived)",
          explicaciones: [
            {
              siDice: "She has flown to Vancouver this morning",
              explicacion: "It's finished, with a time: she flew to Vancouver.",
              es: "Ya terminó y dice cuándo: she flew to Vancouver.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            'dibujos: salen de "Qué aparece"; se agregó "Zoe" para que cada uno se entienda solo',
            "verbos: salen del modelo (son los mismos de la pestaña principal)",
            "gramatica: escrita para el evaluador",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: Have you ever been to another country? What did you do last weekend? Have you ever lost something important? When did you last take a trip? Have you finished your homework yet?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta:
            'Respuestas cortas que responden bien ("No, I haven\'t."); Allison pide el detalle: "Tell me more!"',
          preguntas: [
            { pregunta: "Have you ever been to another country?", modelo: "No, I haven't, but I've been to Cartagena." },
            { pregunta: "What did you do last weekend?", modelo: "I visited my grandma and we cooked." },
            { pregunta: "Have you ever lost something important?", modelo: "Yes, I have. I lost my phone last year." },
            { pregunta: "When did you last take a trip?", modelo: "I went to Medellín in June." },
            { pregunta: "Have you finished your homework yet?", modelo: "Not yet. I'm doing it now!" },
          ],
          aceptadas: ["No, I haven't."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Enséñale a Allison",
      objetivo: "Contarle a Allison un lugar de Colombia donde has estado: cuántas veces, cuándo fuiste y qué hiciste.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam has never been to Colombia, but he has tried arepas. He ate them last month at a Colombian restaurant in Montreal. Now he wants to learn how to make them!" (no está escrito). Pregunta: ¿dónde comió arepas Liam? Elige entre un restaurante colombiano en Montreal con nieve afuera, una cocina de casa y una playa.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam has never been to Colombia, but he has tried arepas.",
            "He ate them last month at a Colombian restaurant in Montreal.",
            "Now he wants to learn how to make them!",
          ],
          traduccion: [],
          pregunta: "¿Dónde comió arepas Liam?",
          opciones: [
            { imagen: "a1/f-cocina-casa", descripcion: "Una cocina de casa", dice: "A kitchen at home" },
            { imagen: "f-restaurante-montreal", descripcion: "Un restaurante colombiano en Montreal con nieve afuera", dice: "A Colombian restaurant" },
            { imagen: "a1/f-playa-la", descripcion: "Una playa", dice: "A beach" },
          ],
          correcta: 1,
          porRevisar: ["opciones: cada dibujo dice su nombre en inglés al elegirlo (dice), sin texto a la vista (cambio del 30 de octubre de 2026)", "opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Ya hice el check-in, pero todavía no he encontrado mi puerta." Dibujo de Liam en la puerta de embarque. Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da la primera palabra de la parte que falló ("…but I…"). Si dice "I haven\'t found yet my gate": "Yet goes at the end: I haven\'t found my gate yet." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Ya hice el check-in, pero todavía no he encontrado mi puerta.",
          imagen: "f-liam-puerta",
          respuesta: "I've already checked in, but I haven't found my gate yet.",
          aceptadas: [
            "I have already checked in, but I haven't found my gate.",
            "I already checked in, but I didn't find my gate yet.",
          ],
          palabras: [],
          partes: ["I've already checked in,", "but I haven't found my gate yet."],
          explicaciones: [
            {
              siDice: "I haven't found yet my gate",
              explicacion: "Yet goes at the end: I haven't found my gate yet.",
              es: "Yet va al final: I haven't found my gate yet.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "ensenale",
          queAparece:
            'Allison: "I\'ve never been to Cartagena, but I really want to go! Tell me about a place in Colombia you\'ve been to." Cuatro preguntas en orden, de la lista de abajo.',
          siRespondeMal:
            'Si responde con una palabra: "Tell me more!" y repite la pregunta. Si habla en español: "In English, please!" y la pregunta más simple. Si nunca ha viajado: "Tell me about your city!" y sigue la lista con su ciudad.',
          tambienSeAcepta:
            "Cualquier lugar de Colombia, también su ciudad; respuestas que se entienden aunque tengan errores",
          tema: "un lugar de Colombia donde has estado",
          apertura: "I've never been to Cartagena, but I really want to go! Tell me about a place in Colombia you've been to.",
          preguntas: [
            {
              pregunta: "Have you been there more than once?",
              simple: "Did you go there many times?",
              modelo: "I've been to Santa Marta three times.",
            },
            { pregunta: "When did you go the last time?", simple: "When did you go?", modelo: "I went last December." },
            {
              pregunta: "What did you do there?",
              simple: "What did you do?",
              modelo: "I swam in the sea and I visited Tayrona Park.",
            },
            {
              pregunta: "What's the best thing you've eaten there?",
              simple: "What food did you eat there?",
              modelo: "The best thing I've eaten there is fried fish.",
            },
          ],
          reacciones: ["Wow, that sounds amazing!", "I want to go there too!", "That sounds delicious!", "I didn't know that!"],
          cierre: "Thank you! Now I really want to go back to Colombia!",
          respuestasDeAllison: [
            {
              siPregunta: "si ha estado en Colombia",
              respuesta: "Yes! I've been to Bogotá and Boyacá. But I've never been to Cartagena.",
            },
          ],
          otraPregunta: "Good question! But today you're the teacher. Tell me more!",
          minimoRespuestas: 3,
          porRevisar: ["preguntas.simple: las cuatro versiones simples"],
        },
      ],
    },
  ],
  // Escenario: nada inventado. La tarea 4 es la que trae el imprevisto (el
  // texto entre comillas de la celda Imprevisto); el título va con
  // mayúscula inicial.
  escenario: {
    titulo: "La aerolínea perdió tu maleta",
    imagen: "e-toronto-equipaje",
    contexto:
      "Acabas de llegar a Toronto desde Bogotá para un curso de verano. Esperaste tu maleta una hora y no salió. Vas al mostrador de la aerolínea, donde te atiende Ms. Patel (Allison en su papel).",
    personaje: "Ms. Patel, la agente de equipaje de la aerolínea en el aeropuerto de Toronto",
    objetivo: "Explicar qué pasó con la maleta y cuándo, describirla y resolver qué hacer mientras llega",
    tareas: [
      "Saluda y di qué pasó.",
      "Di de dónde volaste y cuándo entregaste la maleta.",
      "Describe tu maleta.",
      "La maleta llega mañana: pide lo que necesitas para esta noche.",
      "Da la dirección donde te quedas y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Ms. Patel revisa el sistema: la maleta se quedó en Bogotá y llega mañana en la noche. Ahí aparece la tarea 4: "La maleta llega mañana: pide lo que necesitas para esta noche."',
      linea: "Welcome to Canada! Let me check… OK, I've found it. Your bag is still in Bogotá. It will arrive tomorrow night.",
    },
    dialogo: [
      { quien: "personaje", dice: "Hi there! How can I help you?" },
      { quien: "alumno", dice: "Hi! My bag hasn't arrived. I've waited for an hour.", tarea: 1 },
      { quien: "personaje", dice: "Oh no, I'm sorry. Where did you fly from?" },
      { quien: "alumno", dice: "I flew from Bogotá. I checked my bag there this morning.", tarea: 2 },
      { quien: "personaje", dice: "OK. Can I see your boarding pass?" },
      { quien: "alumno", dice: "Sure. Here it is." },
      { quien: "personaje", dice: "Thank you. What does your bag look like?" },
      { quien: "alumno", dice: "It's a big red suitcase. It has a yellow tag.", tarea: 3 },
      { quien: "personaje", dice: "Have you ever lost a bag before?" },
      { quien: "alumno", dice: "No, I haven't. It's my first time in Canada!" },
      {
        quien: "personaje",
        dice: "Welcome to Canada! Let me check… OK, I've found it. Your bag is still in Bogotá. It will arrive tomorrow night.",
      },
      { quien: "alumno", dice: "Tomorrow night? But I don't have any clothes!" },
      { quien: "personaje", dice: "I'm so sorry. What do you need for tonight?" },
      { quien: "alumno", dice: "I need a toothbrush and a T-shirt. Can you help me?", tarea: 4 },
      { quien: "personaje", dice: "Of course. Here's a travel kit with a toothbrush and a T-shirt." },
      { quien: "alumno", dice: "Thank you! That's very kind." },
      { quien: "personaje", dice: "Where are you staying in Toronto?" },
      { quien: "alumno", dice: "I'm staying with a host family. The address is 25 King Street.", tarea: 5 },
      { quien: "personaje", dice: "Perfect. We'll send your bag there tomorrow night." },
      { quien: "alumno", dice: "Great. Thank you very much!" },
      { quien: "personaje", dice: "You're welcome. Have you been to Toronto before?" },
      { quien: "alumno", dice: "No, I've never been here. I'm very excited!" },
      { quien: "personaje", dice: "You'll love it! Have a great summer!" },
      { quien: "alumno", dice: "Thanks! Goodbye!", tarea: 5 },
    ],
    ayudas: [
      "Say what happened to your bag.",
      "Say where you flew from and when.",
      "Say its color and size.",
      "Ask for what you need tonight.",
      "Give your address and say goodbye.",
    ],
    resumen: "¡Lo lograste! Explicaste en inglés qué pasó con tu maleta y resolviste qué hacer esta noche.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Toronto en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I\'m tired" → I understand! Where did you fly from?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Say its color and size."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Mi maleta es roja" → Sorry, in English, please! What color is your bag?',
      },
      {
        situacion: "Pregunta en español cómo se dice algo",
        accion: "Usa la palabra en inglés dentro de su frase, sin salir de la escena",
        ejemplo: '"¿Cómo se dice cepillo de dientes?" → A toothbrush? Sure, here\'s a toothbrush.',
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
          '"I have arrived yesterday" → la escena sigue; en el resumen: With a time, use the past: I arrived yesterday.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Ms. Patel: "We\'ll find your bag! Have a good night." En pantalla: Vamos a repasar el presente perfecto y el pasado y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["toronto"],
      muestra: "Portada de la ciudad: la CN Tower, los rascacielos y el lago Ontario",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-toronto-equipaje"],
      muestra: "El mostrador de equipaje perdido con una banda vacía al lado",
      uso: "Escenario",
    },
    {
      archivos: ["referencia-zoe", "referencia-liam"],
      muestra: "Las fichas de Zoe y Liam (no salen en la app)",
      uso: "Para dibujarlos siempre iguales",
    },
    { archivos: ["f-cartagena-murallas"], muestra: "Las murallas de Cartagena con el mar detrás", uso: "Lección 1 (paso 2)" },
    {
      archivos: ["f-liam-sandwich", "f-liam-puerta", "f-liam-checkin"],
      muestra: "Liam comprando un sándwich, en la puerta de embarque y en la fila del check-in",
      uso: "Lección 2 (paso 1); la de la puerta también en la lección 4 (paso 2)",
    },
    {
      archivos: ["f-banda-vacia"],
      muestra: "La banda de equipaje vacía y un muchacho preocupado",
      uso: "Lección 2 (paso 2)",
    },
    {
      archivos: ["f-celular-mochila", "f-celular-bus", "f-celular-pupitre"],
      muestra: "Un celular en una mochila, en el asiento de un bus y en un pupitre",
      uso: "Lección 3 (paso 1)",
    },
    {
      archivos: ["f-zoe-viaje-1", "f-zoe-viaje-2", "f-zoe-viaje-3", "f-zoe-viaje-4"],
      muestra:
        "Los cuatro dibujos del viaje de Zoe, con el mismo fondo de aeropuerto: entrega la maleta, vuela, espera en la banda, en el mostrador sin maleta",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["f-restaurante-montreal"],
      muestra: "Un restaurante colombiano en Montreal, con nieve afuera",
      uso: "Lección 4 (paso 1)",
    },
    {
      archivos: ["a1/f-cocina-casa", "a1/f-playa-la"],
      muestra: "Una cocina de casa; una playa (de A1)",
      uso: "Lección 4 (paso 1)",
    },
  ],
};
