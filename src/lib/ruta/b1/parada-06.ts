import type { Parada } from "../tipos.ts";

/**
 * Parada 6 · Victoria (B1). Documento "Contenido B1", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de B1 viven en
 * public/ilustraciones/b1; las de A1 o A2 que se reutilizan llevan su
 * carpeta delante.
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Zoe: su celular nuevo se diseñó en California, se hizo en Corea del
 *     Sur y se lo regalaron en su cumpleaños. El mes pasado se le borraron
 *     las fotos, pero estaban en la nube; ahora revisa su copia cada semana.
 *   · Liam: la semana pasada dejó el computador en el bus; lo encontró el
 *     conductor y lo llevó a objetos perdidos. Hace un proyecto del colegio
 *     sobre los teléfonos.
 *   · Ms. Lin: solo en este escenario, la técnica de una tienda de soporte
 *     en Victoria.
 *   · Allison: nada nuevo. La Entrevista son datos reales de Nueva York, y
 *     lo suyo (vive en Brooklyn y toma el metro) ya está en su ficha.
 */
export const PARADA_06: Parada = {
  numero: 6,
  ciudad: "Victoria",
  titulo: "Habla de tecnología",
  gramatica: "La voz pasiva",
  objetivo:
    'Al terminar, el alumno habla de cómo se hacen, se usan y se arreglan las cosas, sin decir quién: "My phone was stolen. The data is stored in the cloud." Gramática: la voz pasiva en presente y pasado (is made, was stolen). Usa todo lo anterior y nada de paradas posteriores (ni oraciones de relativo, ni if + will, ni might, ni if + would).',
  fraseMeta: "My phone was stolen. The data is stored in the cloud.",
  portada: "victoria",
  vocabulario: [
    {
      grupo: "La voz pasiva",
      ingles: "is made, are sold, was stolen, was broken, were sent, is stored",
      nota: 'Se forma con be + participio: "The photos are stored in the cloud." Para decir quién lo hizo va by: "It was made by a Canadian company."',
    },
    {
      grupo: "Tecnología",
      ingles: "phone, screen, battery, charger, app, password, the cloud, backup, update, Wi-Fi",
      nota: '"Phone" o "cell phone", nunca "mobile"',
    },
    {
      grupo: "Participios que más se usan",
      ingles: "made, sold, stolen, broken, sent, invented, designed, stored, fixed, repaired, delivered",
      nota: "Irregulares: make → made, sell → sold, steal → stolen, break → broken, send → sent",
    },
    {
      grupo: "Frases",
      ingles:
        "My phone was stolen. The screen is broken. Where is it made? It was sent yesterday. My photos are saved in the cloud.",
      nota: '"Stolen" es la cosa robada; "robbed" es la persona o el lugar: "I was robbed."',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Cómo se hacen las cosas",
      objetivo: "Decir dónde y cómo se hace algo, sin decir quién, con la pasiva en presente.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Zoe\'s new phone was designed in California, but it was made in South Korea. Phones like hers are sold all over the world. Zoe loves its camera!" (no está escrito). Pregunta: ¿dónde fue diseñado el celular de Zoe? Elige entre tres tarjetas dibujadas por la app: In California / In South Korea / In Toronto.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Zoe's new phone was designed in California, but it was made in South Korea.",
            "Phones like hers are sold all over the world.",
            "Zoe loves its camera!",
          ],
          traduccion: [],
          pregunta: "¿Dónde fue diseñado el celular de Zoe?",
          opciones: [
            { texto: "In South Korea", descripcion: "In South Korea" },
            { texto: "In California", descripcion: "In California" },
            { texto: "In Toronto", descripcion: "In Toronto" },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de unas arepas y una mazorca de maíz. Allison: "What are arepas made with?"',
          siRespondeMal:
            'Una sola pista en inglés: "Start with: They\'re made…". Sin pista, Allison dice "They\'re made with corn" y el alumno la repite. Si dice "They make with corn": "Use are made: They\'re made with corn."',
          imagen: "f-arepas-maiz",
          pregunta: "What are arepas made with?",
          respuesta: "They're made with corn.",
          aceptadas: ["are made with corn", "are made from corn", "are made of corn", "is made with corn", "is made from corn", "is made of corn"],
          pistas: ["Start with: They're made…"],
          explicaciones: [
            { siDice: "They make with corn", explicacion: "Use are made: They're made with corn.", es: "Usa are made: They're made with corn." },
            { siDice: "They made with corn", explicacion: "Use are made: They're made with corn.", es: "Usa are made: They're made with corn." },
            { siDice: "are make", explicacion: "Use made: They're made with corn.", es: "Usa made: They're made with corn." },
          ],
          porRevisar: ["aceptadas: también «made from corn», «made of corn» y «An arepa is made with corn»; explicaciones para «They made with corn» y «are make» (cambio del 30 de octubre de 2026)", "explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece:
            'Audio de Allison: "My phone was fixed, and my photos were saved." Se practica la -ed de fixed (suena t) y de saved (suena d).',
          siRespondeMal:
            'Si dice "fix-ed": "Listen: fixed ends with a t sound, and saved with a d sound. Say it: My phone was fixed, and my photos were saved."',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "My phone was fixed, and my photos were saved.",
          palabraDificil: "fixed",
          consejo: "Listen: fixed ends with a t sound, and saved with a d sound.",
          consejoEs: "Escucha: fixed termina con sonido de t, y saved con sonido de d.",
          porRevisar: [
            "consejoEs: traducción",
            "palabraDificil: el documento practica dos palabras (fixed y saved); va fixed, la del error previsto (\"fix-ed\")",
          ],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Lo que pasó",
      objetivo: "Contar lo que le pasó a una cosa con la pasiva en pasado.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Last week, Liam left his laptop on the bus. The next day, it was found by the driver and taken to the lost and found. Liam was so happy!" (no está escrito). Pregunta: ¿quién encontró el computador de Liam? Elige entre tres tarjetas dibujadas por la app: The bus driver / A police officer / His mom.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Last week, Liam left his laptop on the bus.",
            "The next day, it was found by the driver and taken to the lost and found.",
            "Liam was so happy!",
          ],
          traduccion: [],
          pregunta: "¿Quién encontró el computador de Liam?",
          opciones: [
            { texto: "A police officer", descripcion: "A police officer" },
            { texto: "His mom", descripcion: "His mom" },
            { texto: "The bus driver", descripcion: "The bus driver" },
          ],
          correcta: 2,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Ayer me robaron el celular, pero mis fotos están guardadas en la nube." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "My phone was steal": "After was, say stolen: My phone was stolen." Si dice "Someone stole my phone": "Good! Now start with My phone: My phone was stolen." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Ayer me robaron el celular, pero mis fotos están guardadas en la nube.",
          respuesta: "My phone was stolen yesterday, but my photos are saved in the cloud.",
          aceptadas: ["My phone was stolen yesterday, but my photos are stored in the cloud."],
          palabras: [],
          partes: ["My phone was stolen yesterday,", "but my photos are saved in the cloud."],
          explicaciones: [
            {
              siDice: "My phone was steal",
              explicacion: "After was, say stolen: My phone was stolen.",
              es: "Después de was, di stolen: My phone was stolen.",
            },
            {
              siDice: "Someone stole my phone",
              explicacion: "Good! Now start with My phone: My phone was stolen.",
              es: "¡Bien! Ahora empieza con My phone: My phone was stolen.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about your phone or your computer." Tres preguntas guía: Where was it made? What is it used for? Has anything happened to it? Un reloj de un minuto.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "My phone was make in China" → Better: My phone was made in China. Si habló menos de 40 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 40 segundos o más, en inglés, con 5 frases o más que se entienden",
          tema: "Tell me about your phone or your computer.",
          guias: ["Where was it made?", "What is it used for?", "Has anything happened to it?"],
          modelo:
            "My phone was made in China. It was a birthday present from my parents. It's used for everything: music, photos and homework. Last year I dropped it and the screen broke, but it was repaired in two days. All my photos are saved in the cloud, so I'm not worried.",
          segundos: 60,
          minimoSegundos: 40,
          minimoFrases: 5,
        },
      ],
    },
    {
      numero: 3,
      titulo: "El viaje de un celular",
      objetivo: "Contar en orden cómo se hizo y cómo llegó algo, con la pasiva.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Liam is doing a school project about phones. He learned that the first phone call was made in 1876. Today, billions of messages are sent every day!" (no está escrito). Pregunta: ¿en qué año se hizo la primera llamada telefónica? Elige entre tres tarjetas dibujadas por la app: 1876 / 1950 / 2010.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Liam is doing a school project about phones.",
            "He learned that the first phone call was made in 1876.",
            "Today, billions of messages are sent every day!",
          ],
          traduccion: [],
          pregunta: "¿En qué año se hizo la primera llamada telefónica?",
          opciones: [
            { texto: "1876", descripcion: "1876", dice: "In 1876" },
            { texto: "1950", descripcion: "1950", dice: "In 1950" },
            { texto: "2010", descripcion: "2010", dice: "In 2010" },
          ],
          correcta: 0,
          porRevisar: ["opciones: 1876, 1950 y 2010; antes 1976 y 1786 tenían los mismos números revueltos. La pregunta dice que es el año y cada tarjeta suena «In 1876», como en la historia (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 2,
          tipo: "narra",
          queAparece:
            'Cuatro dibujos en orden del viaje del celular de Zoe: (1) se hace en una fábrica; (2) lo meten en una caja y lo mandan en avión; (3) se vende en una tienda de Toronto; (4) se lo regalan a Zoe en su cumpleaños. Allison: "Tell me the story of Zoe\'s phone." Debajo: first, then, after that, finally.',
          siRespondeMal:
            'Si dice "Then they sent it by plane": "Good! Now start with it: it was sent by plane." Allison repite bien la frase y el alumno la dice. Si cuenta menos de 3 dibujos, Allison señala el que falta: "What happened next?"',
          tambienSeAcepta:
            "It was made in South Korea. It was sent by plane. It was bought in Toronto. Zoe got it for her birthday.",
          imagenes: ["f-celular-1", "f-celular-2", "f-celular-3", "f-celular-4"],
          dibujos: [
            "Se hace en una fábrica",
            "Lo meten en una caja y lo mandan en avión",
            "Se vende en una tienda de Toronto",
            "Se lo regalan a Zoe en su cumpleaños",
          ],
          pregunta: "Tell me the story of Zoe's phone.",
          debajo: ["first", "then", "after that", "finally"],
          modelo:
            "First, the phone was made in a factory. Then it was put in a box and sent to Canada by plane. After that, it was sold in a store in Toronto. Finally, it was given to Zoe for her birthday.",
          verbos: ["was made", "was sent", "was sold", "was given"],
          gramatica: "passive voice in the past simple: was/were + past participle (was made, was sent)",
          explicaciones: [
            {
              siDice: "Then they sent it by plane",
              explicacion: "Good! Now start with it: it was sent by plane.",
              es: "¡Bien! Ahora empieza con it: it was sent by plane.",
            },
          ],
          minimoDibujos: 3,
          minimoFrases: 4,
          segundos: 60,
          porRevisar: [
            'verbos: salen del modelo; en el dibujo 2 va "was sent" (el modelo dice "was put in a box and sent")',
            "gramatica: escrita para el evaluador",
            "explicaciones.es: traducción",
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con veinte segundos: Where was your phone made? What is your phone used for most? Has your phone ever been broken? When was your school built? Is your homework sent by email?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien ("In China."); Allison pide la frase completa',
          preguntas: [
            { pregunta: "Where was your phone made?", modelo: "It was made in China." },
            { pregunta: "What is your phone used for most?", modelo: "It's used for music and messages." },
            { pregunta: "Has your phone ever been broken?", modelo: "Yes, it has. The screen was broken last year." },
            { pregunta: "When was your school built?", modelo: "It was built in 1995, I think." },
            { pregunta: "Is your homework sent by email?", modelo: "Yes, it's sent by email every week." },
          ],
          aceptadas: ["In China."],
          segundos: 20,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Entrevista a Allison sobre Nueva York",
      objetivo: "Preguntar con la pasiva (When was…?, What is… made of?) por datos de una ciudad.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Last month, all of Zoe\'s photos were deleted by mistake. Luckily, they were saved in the cloud. Now she checks her backup every week!" (no está escrito). Pregunta: ¿dónde estaban guardadas las fotos? Elige entre tres tarjetas dibujadas por la app: In the cloud / On her computer / On her mom\'s phone.',
          siRespondeMal: "Se repite el audio despacio, una sola vez, y elige otra vez.",
          quienHabla: "Allison",
          audio: [
            "Last month, all of Zoe's photos were deleted by mistake.",
            "Luckily, they were saved in the cloud.",
            "Now she checks her backup every week!",
          ],
          traduccion: [],
          pregunta: "¿Dónde estaban guardadas las fotos?",
          opciones: [
            { texto: "On her computer", descripcion: "On her computer" },
            { texto: "In the cloud", descripcion: "In the cloud" },
            { texto: "On her mom's phone", descripcion: "On her mom's phone" },
          ],
          correcta: 1,
          porRevisar: ["opciones: orden cambiado para que la correcta no sea siempre la primera"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Este celular fue diseñado en Canadá, pero se fabrica en China." Sin palabras de apoyo.',
          siRespondeMal:
            'Allison da solo la primera palabra de la parte que falló. Si dice "it\'s make in China": "After it\'s, say made: it\'s made in China." Si dice "they make it in China": "Good! Now start with it: it\'s made in China." Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Este celular fue diseñado en Canadá, pero se fabrica en China.",
          respuesta: "This phone was designed in Canada, but it's made in China.",
          aceptadas: ["This phone was designed in Canada, but it is made in China."],
          palabras: [],
          partes: ["This phone was designed in Canada,", "but it's made in China."],
          explicaciones: [
            {
              siDice: "it's make in China",
              explicacion: "After it's, say made: it's made in China.",
              es: "Después de it's, di made: it's made in China.",
            },
            {
              siDice: "they make it in China",
              explicacion: "Good! Now start with it: it's made in China.",
              es: "¡Bien! Ahora empieza con it: it's made in China.",
            },
          ],
          porRevisar: ["explicaciones.es: traducción"],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Nueva York, la ciudad de Allison: ficha con cinco datos de la ciudad por descubrir, todos con la pasiva: cuándo se abrió el puente de Brooklyn, de qué está hecha la Estatua de la Libertad, dónde se hizo, cuándo se abrió la primera línea del metro y cómo le dicen a Nueva York. Arma cada pregunta sin palabras de ayuda. Al acertar, el dato se llena, Allison responde y le pregunta por su ciudad ("And your city?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            'Una sola pista en inglés: "Ask me about the bridge! Start with: When was…?" Hay un botón de ayuda con la pregunta escrita.',
          tambienSeAcepta:
            'Cualquier pregunta que se entienda: "When the bridge was opened?", "Statue made of what?", "New York\'s name?"',
          ficha: "Nueva York, la ciudad de Allison",
          // Lo que responde Allison sale de la tabla del documento: datos
          // reales de la ciudad; lo personal (vive en Brooklyn y toma el
          // metro) ya está en su ficha.
          datos: [
            {
              dato: "El puente de Brooklyn",
              pregunta: "When was the Brooklyn Bridge opened?",
              respuesta: "It was opened in 1883. It connects Manhattan and Brooklyn. I live in Brooklyn!",
            },
            {
              dato: "La Estatua de la Libertad",
              pregunta: "What is the Statue of Liberty made of?",
              respuesta: "It's made of copper. That's why it's green!",
            },
            {
              dato: "Dónde se hizo",
              pregunta: "Where was the Statue of Liberty made?",
              respuesta: "It was made in France and sent to New York in pieces!",
            },
            {
              dato: "El metro",
              pregunta: "When was the first subway line opened?",
              respuesta: "It was opened in 1904. And I take the subway to work every day!",
            },
            {
              dato: "El apodo",
              pregunta: "What else is New York called?",
              respuesta: "It's also called the Big Apple!",
            },
          ],
          aceptadas: ["When the bridge was opened?", "Statue made of what?", "New York's name?"],
          ayuda:
            'Una sola pista en inglés: "Ask me about the bridge! Start with: When was…?" Hay un botón de ayuda con la pregunta escrita.',
          minimoIntervenciones: 10,
          pistas: [
            "Ask me about the bridge! Start with: When was…?",
            "Ask me about the Statue of Liberty! Start with: What is…?",
            "Ask me about the Statue of Liberty! Start with: Where was…?",
            "Ask me about the subway! Start with: When was…?",
            "Ask me about New York's other name! Start with: What else…?",
          ],
          porRevisar: [
            "pistas: solo la primera está en el documento; las otras cuatro siguen su patrón",
          ],
        },
      ],
    },
  ],
  // Escenario: todo sale del documento; no hay textos por revisar.
  escenario: {
    titulo: "Tu celular dejó de funcionar",
    imagen: "e-victoria-soporte",
    contexto:
      "Estás de paseo en Victoria. Ayer se te cayó el celular en el puerto y hoy no prende. Vas a una tienda de soporte técnico, donde te atiende Ms. Lin, la técnica (Allison en su papel). El jueves sigues el viaje hacia Quebec.",
    personaje: "Ms. Lin, la técnica de una tienda de soporte en Victoria",
    objetivo:
      "Explicar qué le pasó al celular, preguntar si se puede arreglar y si las fotos están guardadas, y resolver un problema de tiempo",
    tareas: [
      "Saluda y di qué le pasa a tu celular.",
      "Cuenta qué pasó y cuándo.",
      "Pregunta si se puede arreglar y si tus fotos están guardadas.",
      "La pantalla llega el viernes y tú te vas el jueves: busca una solución.",
      "Agradece y despídete.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto:
        'Después de la tarea 3, Ms. Lin dice que la pantalla nueva hay que pedirla a Vancouver y llega el viernes, pero tú te vas el jueves. Ahí aparece la tarea 4: "La pantalla llega el viernes y tú te vas el jueves: busca una solución."',
      linea:
        "Great, then your photos are safe. But there's a problem. The new screen has to be ordered from Vancouver, and it will be delivered on Friday.",
    },
    dialogo: [
      { quien: "personaje", dice: "Hi! Welcome to Tech Help. How can I help you?" },
      { quien: "alumno", dice: "Hi! My phone doesn't work. The screen is completely black.", tarea: 1 },
      { quien: "personaje", dice: "Oh no. What happened to it?" },
      { quien: "alumno", dice: "I dropped it at the harbor yesterday. It fell in the water for a few seconds.", tarea: 2 },
      { quien: "personaje", dice: "I see. Have you charged it since then?" },
      { quien: "alumno", dice: "Yes, I have. It was plugged in all night, but it still doesn't turn on.", tarea: 2 },
      { quien: "personaje", dice: "Let me check it… OK, the battery is fine, but the screen is broken." },
      { quien: "alumno", dice: "Oh no! Can it be fixed?", tarea: 3 },
      { quien: "personaje", dice: "Yes, it can." },
      { quien: "alumno", dice: "And what about my photos? Are they lost?", tarea: 3 },
      { quien: "personaje", dice: "Do you have a backup?" },
      { quien: "alumno", dice: "Yes. I think they're stored in the cloud. My mom set it up." },
      {
        quien: "personaje",
        dice: "Great, then your photos are safe. But there's a problem. The new screen has to be ordered from Vancouver, and it will be delivered on Friday.",
      },
      { quien: "alumno", dice: "On Friday? But I'm leaving for Quebec City on Thursday!", tarea: 4 },
      { quien: "personaje", dice: "Hmm. That's a problem." },
      { quien: "alumno", dice: "Can the phone be sent to my hotel in Quebec City when it's ready?", tarea: 4 },
      { quien: "personaje", dice: "Yes, it can! It will be sent by express mail. Can you write the address here?" },
      { quien: "alumno", dice: "Sure. Here you go." },
      {
        quien: "personaje",
        dice: "Thank you. And you can use this phone until then. These phones are lent to visitors for free. When yours arrives, just send this one back in the same box.",
      },
      { quien: "alumno", dice: "Really? That's very kind. Thank you!" },
      { quien: "personaje", dice: "You're welcome. Your phone will be repaired on Friday and sent on Saturday." },
      { quien: "alumno", dice: "Great. When will it arrive in Quebec City?" },
      { quien: "personaje", dice: "On Monday morning." },
      { quien: "alumno", dice: "Perfect. Thank you for your help, Ms. Lin. Goodbye!", tarea: 5 },
    ],
    ayudas: [
      "Say what's wrong with your phone.",
      "Say what happened and when.",
      "Ask if it can be fixed and if your photos are saved.",
      "Find a solution: ask if it can be sent.",
      "Thank her and say goodbye.",
    ],
    resumen:
      "¡Lo lograste! Explicaste en inglés qué le pasó a tu celular y resolviste cómo recuperarlo.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Victoria en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like Victoria" → Me too! So, what happened to your phone?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con la idea de la tarea",
        ejemplo: 'Ayuda: "Ask if it can be fixed and if your photos are saved."',
      },
      {
        situacion: "Responde en español",
        accion: "Sigue en personaje, en inglés y más despacio, sin traducir",
        ejemplo: '"Se me cayó al agua" → Sorry, in English, please! What happened to it?',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto, con «En español» a un toque",
        ejemplo: '"Can it be fix?" → la escena sigue; en el resumen: After be, say fixed: Can it be fixed?',
      },
      {
        situacion: "Pasa de 24 intervenciones sin cumplir las tareas",
        accion: "Cierra con amabilidad; la app propone repasar",
        ejemplo: 'Ms. Lin: "Come back anytime. Good luck!" En pantalla: Vamos a repasar la voz pasiva y lo intentas de nuevo.',
      },
    ],
    minimoIntervenciones: 12,
    maximoIntervenciones: 24,
  },
  ilustraciones: [
    {
      archivos: ["victoria"],
      muestra: "Portada de la ciudad: el puerto interior con hidroaviones, el edificio del Parlamento y las montañas al fondo",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-victoria-soporte"],
      muestra: "El mostrador de una tienda de soporte técnico con herramientas y cargadores, y una ventana al puerto",
      uso: "Escenario",
    },
    { archivos: ["f-arepas-maiz"], muestra: "Unas arepas junto a una mazorca de maíz", uso: "Lección 1 (paso 2)" },
    {
      archivos: ["f-celular-1", "f-celular-2", "f-celular-3", "f-celular-4"],
      muestra:
        "Los cuatro dibujos del viaje del celular de Zoe: la fábrica, la caja en el avión, la tienda de Toronto, el regalo de cumpleaños",
      uso: "Lección 3 (paso 2)",
    },
  ],
};
