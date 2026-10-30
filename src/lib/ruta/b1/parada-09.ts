import type { Parada } from "../tipos.ts";

/**
 * Parada 9 · Halifax (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; las opciones de Escucha y elige son tarjetas
 * que dibuja la app.
 *
 * Ajuste aprobado a la frase del mapa: decía "or you might give us a
 * refund"; queda "or maybe you could give us a refund" (ya cambiada en el
 * mapa).
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison (va a su ficha): nunca ha estado en Medellín. Lo demás ya
 *     está en su ficha: le encanta la comida colombiana y su favorita es
 *     el mute santandereano.
 *   · Zoe: al carro de su familia se le dañó algo; a su papá le gusta ver
 *     hockey. En su cumpleaños el perro tumbó la torta. Su familia estuvo
 *     en un hotel de Halifax.
 *   · Liam: quiere visitar Colombia el próximo año, tal vez en agosto para
 *     ver la Feria de las Flores.
 *   · Ms. Doyle: solo en este escenario, la recepcionista de un hotel en
 *     Halifax.
 */
export const PARADA_09: Parada = {
  numero: 9,
  ciudad: "Halifax",
  titulo: "Resuelve un problema",
  gramatica: "Might, may, could",
  objetivo:
    'Al terminar, el alumno dice qué podría estar pasando y propone soluciones: "We could change rooms, or maybe you could give us a refund." Gramática: might, may y could para posibilidad y para proponer. Usa todo lo anterior y nada de la parada 10 (ni if + would).',
  fraseMeta: "We could change rooms, or maybe you could give us a refund.",
  portada: "halifax",
  vocabulario: [
    {
      grupo: "Posibilidad",
      ingles: "might, may, could",
      nota: '"It might rain" es "tal vez llueva"; "may" es un poco más formal. Después van sin to: "might be", nunca "might to be"',
    },
    {
      grupo: "Proponer soluciones",
      ingles: "We could…, You could…, Maybe we could…, Another option is…",
      nota: '"Could" para proponer con amabilidad: "We could change rooms."',
    },
    {
      grupo: "El hotel",
      ingles: "reservation, check in, front desk, receptionist, room, single, double, available, refund, full",
      nota: '"Reservation" de Estados Unidos; "booking" también se entiende',
    },
    {
      grupo: "Frases",
      ingles: "There might be a mistake. It may be under my mom's name. We could try another hotel. Is there anything available?",
      nota: "",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Tal vez",
      objetivo: "Decir lo que es posible con might, may y could.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam can\'t find his phone. It might be in his backpack, or it could be in the kitchen. His mom thinks it may be under the sofa!" (no está escrito). Pregunta: ¿dónde cree la mamá de Liam que está el celular? Elige entre tres tarjetas dibujadas por la app: Under the sofa / In his backpack / In the kitchen.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam can't find his phone.",
            "It might be in his backpack, or it could be in the kitchen.",
            "His mom thinks it may be under the sofa!",
          ],
          traduccion: [],
          pregunta: "¿Dónde cree la mamá de Liam que está el celular?",
          opciones: [
            { texto: "In his backpack", descripcion: "In his backpack" },
            { texto: "In the kitchen", descripcion: "In the kitchen" },
            { texto: "Under the sofa", descripcion: "Under the sofa" },
          ],
          correcta: 2,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de un parque con nubes grises; la gente mira el cielo con los paraguas cerrados. Allison: "Look at the sky. What might happen?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: It might…". Sin pista, Allison dice "It might rain" y el alumno la repite. Si dice "It might to rain": "No to after might: It might rain."',
          imagen: "f-cielo-nublado",
          pregunta: "Look at the sky. What might happen?",
          respuesta: "It might rain.",
          aceptadas: ["may rain", "could rain", "might start raining", "might start to rain", "might be a storm", "might storm", "might get wet"],
          pistas: ["Start with: It might…"],
          explicaciones: [
            { siDice: "It might to rain", explicacion: "No to after might: It might rain.", es: "Después de might no va to: It might rain." },
            { siDice: "might rains", explicacion: "After might, no s: It might rain.", es: "Después de might no va s: It might rain." },
            { siDice: "going to rain", explicacion: "Maybe! We aren't sure, so use might: It might rain.", es: "¡Tal vez! No estamos seguros, así que usa might: It might rain." },
            { siDice: "will rain", explicacion: "Maybe! We aren't sure, so use might: It might rain.", es: "¡Tal vez! No estamos seguros, así que usa might: It might rain." },
          ],
          porRevisar: ["aceptadas: también «It could rain», «It might start raining» y «There might be a storm»; explicaciones para «It might rains», «It's going to rain» y «It will rain» (cambio del 30 de octubre de 2026)", "explicaciones.es: la traducción no estaba en el documento"],
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece: 'Frase en español: "Tal vez llegue tarde, porque el bus podría estar lleno." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "I might to be late": "No to after might: I might be late." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Tal vez llegue tarde, porque el bus podría estar lleno.",
          respuesta: "I might be late, because the bus could be full.",
          aceptadas: ["I may be late, because the bus might be full.", "I might be late, because the bus might be full.", "I may be late, because the bus could be full.", "I might arrive late, because the bus could be full.", "I might arrive late, because the bus might be full."],
          palabras: [],
          partes: ["I might be late,", "because the bus could be full."],
          explicaciones: [
            { siDice: "I might to be late", explicacion: "No to after might: I might be late.", es: "Después de might no va to: I might be late." },
            { siDice: "could to be", explicacion: "No to after could: could be full.", es: "Después de could no va to: could be full." },
            { siDice: "bus can be", explicacion: "For something possible, use could: the bus could be full.", es: "Para algo posible, usa could: the bus could be full." },
            { siDice: "maybe I will", explicacion: "Good! Now say it with might: I might be late.", es: "¡Bien! Ahora dilo con might: I might be late." },
          ],
          porRevisar: ["aceptadas: también «I might be late, because the bus might be full.» y «I may be late, because the bus could be full.» y otras; explicaciones para «could to be», «bus can be», «maybe I will» (cambio del 30 de octubre de 2026)", "explicaciones.es: la traducción no estaba en el documento"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Propón soluciones",
      objetivo: "Proponer soluciones con could y decir qué podría pasar.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe\'s family can\'t drive to the lake this weekend because their car broke down. Zoe says they could take the bus, or they might rent a car. Her dad prefers to stay home and watch hockey!" (no está escrito). Pregunta: ¿qué prefiere el papá de Zoe? Elige entre tres tarjetas dibujadas por la app: Stay home and watch hockey / Take the bus / Rent a car.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe's family can't drive to the lake this weekend because their car broke down.",
            "Zoe says they could take the bus, or they might rent a car.",
            "Her dad prefers to stay home and watch hockey!",
          ],
          traduccion: [],
          pregunta: "¿Qué prefiere el papá de Zoe?",
          opciones: [
            { texto: "Take the bus", descripcion: "Take the bus" },
            { texto: "Stay home and watch hockey", descripcion: "Stay home and watch hockey" },
            { texto: "Rent a car", descripcion: "Rent a car" },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "La habitación es muy ruidosa, así que podríamos cambiar de habitación o tal vez ustedes podrían devolvernos el dinero." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "We could to change": "No to after could: We could change rooms." Si dice "We can change rooms": "Good! To suggest politely: We could change rooms." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol:
            "La habitación es muy ruidosa, así que podríamos cambiar de habitación o tal vez ustedes podrían devolvernos el dinero.",
          respuesta: "The room is very noisy, so we could change rooms, or maybe you could give us a refund.",
          aceptadas: ["The room is very noisy, so we could change rooms, or you could give us a refund.", "The room is very noisy, so we could change rooms, or maybe you could give us our money back.", "The room is very noisy, so we could change rooms, or maybe you could give us the money back.", "The room is very noisy, so we could change rooms, or you could give us our money back."],
          palabras: [],
          partes: ["The room is very noisy,", "so we could change rooms, or maybe you could give us a refund."],
          explicaciones: [
            { siDice: "We could to change", explicacion: "No to after could: We could change rooms.", es: "Después de could no va to: We could change rooms." },
            { siDice: "change room", explicacion: "To move to another room, say: change rooms.", es: "Para pasarse a otra habitación, se dice: change rooms." },
            { siDice: "change the room", explicacion: "To move to another room, say: change rooms.", es: "Para pasarse a otra habitación, se dice: change rooms." },
            { siDice: "return us", explicacion: "Say: give us our money back.", es: "Di: give us our money back." },
            { siDice: "We can change rooms", explicacion: "Good! To suggest politely: We could change rooms.", es: "¡Bien! Para proponer con amabilidad: We could change rooms." },
          ],
          porRevisar: [
            "aceptadas: también «The room is very noisy, so we could change rooms, or maybe you could give us our money back.» y «The room is very noisy, so we could change rooms, or maybe you could give us the money back.» y otras; explicaciones para «change room», «change the room», «return us» (cambio del 30 de octubre de 2026)",
            "partes: la segunda parte lleva también or; se parte solo antes de so, la palabra que une",
            "explicaciones.es: la traducción no estaba en el documento",
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Your friend doesn\'t know what to do this weekend. Give them some ideas." Tres preguntas guía: What could they do? What might happen? Which is the best idea? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "You could to go to the park" → Better: You could go to the park. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Your friend doesn't know what to do this weekend. Give them some ideas.",
          guias: ["What could they do?", "What might happen?", "Which is the best idea?"],
          modelo:
            "You could go to the park, but it might rain, so take an umbrella. You could also go to the movies, or maybe you could visit the new museum downtown. Another option is to stay home and play video games with your friends. I think the museum is the best idea, because it's free on Sundays. You might even see a dinosaur there!",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
          porRevisar: ["modelo: tenía 4 frases y el acierto pide 5; se agregó \"You might even see a dinosaur there!\""],
        },
      ],
    },
    {
      numero: 3,
      titulo: "Un problema y dos salidas",
      objetivo: "Contar un problema y proponer qué se podría hacer ahora.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "The hotel where Zoe\'s family is staying in Halifax has a problem: the pool is closed. The receptionist says it may open tomorrow. If not, they could use the pool at the hotel next door." (no está escrito). Pregunta: ¿qué podrían hacer si la piscina no abre? Elige entre tres tarjetas dibujadas por la app: Use the pool next door / Go to the beach / Get a refund.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "The hotel where Zoe's family is staying in Halifax has a problem: the pool is closed.",
            "The receptionist says it may open tomorrow.",
            "If not, they could use the pool at the hotel next door.",
          ],
          traduccion: [],
          pregunta: "¿Qué podrían hacer si la piscina no abre?",
          opciones: [
            { texto: "Use the pool next door", descripcion: "Use the pool next door" },
            { texto: "Go to the beach", descripcion: "Go to the beach" },
            { texto: "Get a refund", descripcion: "Get a refund" },
          ],
          correcta: 0,
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden del cumpleaños de Zoe: (1) la mamá de Zoe hornea una torta; (2) el perro salta a la mesa; (3) la torta cae al piso; (4) todos miran la torta en el piso. Allison: "Tell me what happened. Then give two ideas: what could they do now?" Debajo: first, then, after that, now they could.',
          siRespondeMal:
            'Si dice "they could to buy": "No to after could: they could buy." Si no da ideas, Allison pregunta: "What could they do now?" Si cuenta menos de 3 dibujos: "What happened next?"',
          tambienSeAcepta: "La historia con 3 dibujos o más y dos ideas con could o might, aunque cambien las palabras",
          imagenes: ["f-torta-1", "f-torta-2", "f-torta-3", "f-torta-4"],
          dibujos: [
            "la mamá de Zoe hornea una torta",
            "el perro salta a la mesa",
            "la torta cae al piso",
            "todos miran la torta en el piso",
          ],
          pregunta: "Tell me what happened. Then give two ideas: what could they do now?",
          debajo: ["first", "then", "after that", "now they could"],
          modelo:
            "First, Zoe's mom baked a cake for Zoe's birthday. Then the dog jumped on the table. After that, the cake fell on the floor! Now they could buy a new cake, or they might eat ice cream instead.",
          verbos: ["baked", "jumped", "fell", "could buy"],
          gramatica: "past simple for the story; then could or might + verb (no to) for two ideas",
          explicaciones: [
            {
              siDice: "they could to buy",
              explicacion: "No to after could: they could buy.",
              es: "Después de could no va to: they could buy.",
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
            "Cinco preguntas con veinte segundos: What might you do this weekend? What could you do if you lose your phone? Where might you live in ten years? What could your school do to help the planet? What could you do to learn more English?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("The movies."); Allison pide la frase completa',
          preguntas: [
            { pregunta: "What might you do this weekend?", modelo: "I might go to the movies with my cousins." },
            { pregunta: "What could you do if you lose your phone?", modelo: "I could call it from a friend's phone." },
            { pregunta: "Where might you live in ten years?", modelo: "I might live in Medellín, or maybe in Canada!" },
            {
              pregunta: "What could your school do to help the planet?",
              modelo: "It could put recycling bins in every classroom.",
            },
            { pregunta: "What could you do to learn more English?", modelo: "I could watch movies in English." },
          ],
          aceptadas: ["The movies."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Enséñale a Allison",
      objetivo: "Explicarle a Allison la Feria de las Flores y decirle qué podría ver y comer.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam wants to visit Colombia next year. He might go in December, but flights are very expensive then. He could go in August and see the Flower Festival!" (no está escrito). Pregunta: ¿cuándo podría ir Liam para ver la Feria de las Flores? Elige entre tres tarjetas dibujadas por la app: In August / In December / In March.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam wants to visit Colombia next year.",
            "He might go in December, but flights are very expensive then.",
            "He could go in August and see the Flower Festival!",
          ],
          traduccion: [],
          pregunta: "¿Cuándo podría ir Liam para ver la Feria de las Flores?",
          opciones: [
            { texto: "In December", descripcion: "In December" },
            { texto: "In March", descripcion: "In March" },
            { texto: "In August", descripcion: "In August" },
          ],
          correcta: 2,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de una muchacha frente a la puerta cerrada de su casa; por la ventana se ven sus llaves adentro. Allison: "She can\'t open the door. Her keys are inside. What could she do?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: She could…". Sin pista, Allison dice "She could call her mom" y el alumno la repite. Si dice "She could to call": "No to after could: She could call her mom."',
          tambienSeAcepta: "Cualquier solución para entrar a la casa o conseguir las llaves, con could o might y el verbo sin to: \"She could ask a neighbor for help.\" \"She might wait for her family.\" No vale \"could to\" ni \"might to\".",
          imagen: "f-llaves-adentro",
          pregunta: "She can't open the door. Her keys are inside. What could she do?",
          respuesta: "She could call her mom.",
          aceptadas: ["She could ask a neighbor for help.", "She might wait for her family.", "could call", "could ask", "could wait", "might wait"],
          pistas: ["Start with: She could…"],
          explicaciones: [
            { siDice: "could to", explicacion: "No to after could: She could call her mom.", es: "Después de could no va to: She could call her mom." },
            { siDice: "might to", explicacion: "No to after might: She might wait for her family.", es: "Después de might no va to: She might wait for her family." },
          ],
          porRevisar: ["aceptadas: «She could call…», «She could ask…» y «She might wait…» valen sin pasar por el modelo; la regla dice que «could to» no vale (el modelo dejaba pasar los errores pequeños) (cambio del 30 de octubre de 2026)", "explicaciones.es: la traducción no estaba en el documento"],
        },
        {
          paso: 3,
          tipo: "ensenale",
          queAparece:
            'Allison: "I\'ve never been to Medellín! Teach me about the Flower Festival." Cuatro preguntas en orden, de la lista de abajo. Dibujo de un silletero con una silleta de flores en la espalda.',
          siRespondeMal:
            'Si responde con una palabra: "Tell me more!" y repite la pregunta. Si habla en español: "In English, please!" y la pregunta más simple. Si no la conoce: "Tell me about a festival in your region!" y sigue la lista con esa fiesta.',
          tambienSeAcepta: "Respuestas que se entienden aunque tengan errores",
          tema: "la Feria de las Flores",
          apertura: "I've never been to Medellín! Teach me about the Flower Festival.",
          imagen: "f-silletero",
          preguntas: [
            { pregunta: "When is it?", simple: "What month is it?", modelo: "It's in August, in Medellín." },
            {
              pregunta: "What's a silletero?",
              simple: "What does a silletero carry?",
              modelo: "A silletero is a farmer who carries a big flower arrangement on his back.",
            },
            {
              pregunta: "What might I see if I go?",
              simple: "What can I see there?",
              modelo: "You might see a big parade with flowers and old cars.",
            },
            {
              pregunta: "What could I eat there?",
              simple: "What food is there?",
              modelo: "You could eat a bandeja paisa. It's delicious!",
            },
          ],
          reacciones: ["That sounds beautiful!", "I love that!", "Wow, that's amazing!", "That sounds delicious!"],
          cierre: "Thank you! Now I really want to go to Medellín!",
          minimoRespuestas: 3,
          respuestasDeAllison: [
            { siPregunta: "por la comida colombiana", respuesta: "I love Colombian food! My favorite is mute santandereano." },
          ],
          otraPregunta: "Good question! But today you're the teacher. Tell me more!",
          // Las reacciones van "una después de cada respuesta, sin repetir".
          porRevisar: ["preguntas.simple: las cuatro versiones simples no estaban en el documento"],
        },
      ],
    },
  ],
  // Escenario: nada escrito de nuevo; solo el título lleva mayúscula inicial
  // ("Escenario: el hotel perdió tu reserva" en el documento).
  escenario: {
    titulo: "El hotel perdió tu reserva",
    imagen: "e-halifax-recepcion",
    contexto:
      "Llegas con tu mamá a Halifax tarde en la noche. Ella no habla inglés, así que tú hablas en la recepción. Ms. Doyle, la recepcionista (Allison en su papel), no encuentra la reserva.",
    personaje: "Ms. Doyle, la recepcionista de un hotel en Halifax",
    objetivo:
      "Explicar que tienen una reserva, decir cuál podría ser el problema, proponer soluciones y escoger una cuando el hotel está lleno",
    tareas: [
      "Saluda y di que tienen una reserva y por cuántas noches.",
      "Di cuál podría ser el problema con la reserva.",
      "Propón una solución.",
      "El hotel está lleno: escoge otra opción y pide algo a cambio.",
      "Agradece y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Ms. Doyle dice que el hotel está completamente lleno esta noche. Ahí aparece la tarea 4: "El hotel está lleno: escoge otra opción y pide algo a cambio."',
      linea: "I'm afraid not. We're completely full tonight.",
    },
    dialogo: [
      { quien: "personaje", dice: "Good evening! Welcome to the Harbor Hotel. How can I help you?" },
      { quien: "alumno", dice: "Good evening! We have a reservation for two nights.", tarea: 1 },
      { quien: "personaje", dice: "What's the name, please?" },
      { quien: "alumno", dice: "It might be under my mom's name. She made the reservation.", tarea: 2 },
      { quien: "personaje", dice: "OK. What's her last name?" },
      { quien: "alumno", dice: "Gómez. G-O-M-E-Z." },
      { quien: "personaje", dice: "Hmm, I'm sorry. I can't find a reservation with that name." },
      { quien: "alumno", dice: "There may be a mistake. We have the confirmation email. Here it is.", tarea: 2 },
      {
        quien: "personaje",
        dice: "Thank you. Oh, I see. Our system has it for next month, not for today. I'm so sorry, that's our mistake!",
      },
      { quien: "alumno", dice: "Oh no! Could we change the date to tonight?", tarea: 3 },
      { quien: "personaje", dice: "I'm afraid not. We're completely full tonight." },
      { quien: "alumno", dice: "Then we could stay at another hotel. Is there one near here?", tarea: 4 },
      {
        quien: "personaje",
        dice: "Our other hotel is across town. It has rooms available, but it's a little more expensive.",
      },
      { quien: "alumno", dice: "That's OK. But maybe you could give us a refund for this reservation?", tarea: 4 },
      { quien: "personaje", dice: "Yes, I can cancel it and give you a full refund." },
      { quien: "alumno", dice: "Great. Could you call the other hotel for us?" },
      { quien: "personaje", dice: "Of course… OK, they have a double room for you." },
      { quien: "alumno", dice: "Thank you so much! Is breakfast included?" },
      { quien: "personaje", dice: "Yes, it is. A taxi might be expensive, so I'll call the hotel shuttle for you." },
      { quien: "alumno", dice: "That's very kind. How long will it take?" },
      { quien: "personaje", dice: "About ten minutes. You can wait in the lobby." },
      { quien: "alumno", dice: "Perfect. Thank you for your help, Ms. Doyle." },
      { quien: "personaje", dice: "You're welcome. I'm sorry about the mix-up!" },
      { quien: "alumno", dice: "No problem. Good night!", tarea: 5 },
    ],
    ayudas: [
      "Say you have a reservation and for how many nights.",
      "Say what might be the problem.",
      "Suggest a solution.",
      "Choose another option and ask for something.",
      "Thank her and say goodbye.",
    ],
    resumen:
      "¡Lo lograste! Explicaste en inglés cuál podía ser el problema con la reserva y encontraste una solución.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Halifax en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"We\'re very tired" → I understand. Do you have a reservation?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Suggest a solution."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Tenemos una reserva" → Sorry, in English, please! Do you have a reservation?',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo: '"We could to change rooms" → la escena sigue; en el resumen: No to after could: We could change rooms.',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo:
          'Ms. Doyle: "Have a good night. I hope you find a room!" En pantalla: Vamos a repasar might, may y could y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["halifax"],
      muestra: "Portada de la ciudad: el puerto con barcos, un faro y casas de madera de colores",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-halifax-recepcion"],
      muestra: "La recepción de un hotel junto al puerto, con un mostrador, llaves colgadas y una ventana con barcos",
      uso: "Escenario",
    },
    {
      archivos: ["f-cielo-nublado"],
      muestra: "Un parque con nubes grises y gente mirando el cielo con los paraguas cerrados",
      uso: "Lección 1 (paso 2)",
    },
    {
      archivos: ["f-torta-1", "f-torta-2", "f-torta-3", "f-torta-4"],
      muestra:
        "Los cuatro dibujos del cumpleaños de Zoe, con la misma cocina: la mamá hornea, el perro salta a la mesa, la torta en el piso, todos mirando la torta",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["f-llaves-adentro"],
      muestra: "Una muchacha frente a la puerta cerrada de su casa, con las llaves adentro",
      uso: "Lección 4 (paso 2)",
    },
    {
      archivos: ["f-silletero"],
      muestra: "Un silletero con una silleta de flores en la espalda",
      uso: "Lección 4 (paso 3)",
    },
  ],
};
