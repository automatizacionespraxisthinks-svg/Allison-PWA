import type { Repaso } from "../tipos.ts";

/** Repaso final · Nueva York. Documento "Contenido A1", aprobado el 15 de octubre de 2026. */
export const REPASO_FINAL: Repaso = {
  nombre: "Repaso final",
  despuesDeParada: 10,
  ciudad: "Nueva York",
  titulo: "Tu viaje por Estados Unidos",
  objetivo:
    "Al terminar, el alumno se desenvuelve solo en un día de viaje: llega, se registra, pide comida y pregunta cómo llegar, usando todo A1. No agrega gramática nueva.",
  comoEsDistinto:
    'Las lecciones mezclan las paradas 6 a 10 y luego todo A1, no hay palabras nuevas y no necesita ilustraciones nuevas. El escenario es más largo: cuatro momentos seguidos con Allison, que es ella misma y recibe al alumno en su ciudad. Al final gana el sello "A1 completo" y se abre A2, siempre que tenga completas todas las actividades de A1, también las de las paradas que saltó. Este repaso lo revisa además un profesor nativo de Estados Unidos.',
  portada: "nueva-york",
  lecciones: [
    {
      numero: 1,
      titulo: "Lo que sabes hacer y lo que quieres comer (paradas 6 y 7)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Leo says: "I can\'t cook, but I\'d like some soup." Pregunta: ¿qué quiere Leo? Elige entre sopa, pizza y ensalada (f-sopa, f-pizza, f-ensalada).',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Leo says: "I can\'t cook, but I\'d like some soup."'],
          traduccion: ['Leo dice: "No sé cocinar, pero me gustaría una sopa."'],
          pregunta: "¿Qué quiere Leo?",
          opciones: [
            { imagen: "f-sopa", descripcion: "La sopa", etiqueta: "Some soup", etiquetaEs: "Una sopa" },
            { imagen: "f-pizza", descripcion: "La pizza", etiqueta: "A pizza", etiquetaEs: "Una pizza" },
            { imagen: "f-ensalada", descripcion: "La ensalada", etiqueta: "A salad", etiquetaEs: "Una ensalada" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'quienHabla: el documento solo dice "Oye:"; no se puso Allison porque ella sí sabe cocinar (su ficha)',
          ],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece: 'Frase en español: "Sé nadar y me gustaría una limonada."',
          siRespondeMal: "Se marca la primera palabra que falla. Al segundo fallo Allison dice la frase y el alumno la repite.",
          espanol: "Sé nadar y me gustaría una limonada.",
          respuesta: "I can swim and I'd like a lemonade.",
          aceptadas: ["I can swim, and I'd like some lemonade."],
          palabras: ["I", "can", "swim", "and", "I'd", "like", "a", "lemonade."],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Can you dance? What would you like to drink? Do you like pizza? Can your dad cook? Would you like some ice cream?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          // "Qué debe responder": "Respuestas cortas y con sentido". El documento no escribe respuestas en inglés.
          preguntas: [
            { pregunta: "Can you dance?", modelo: "Yes, I can." },
            { pregunta: "What would you like to drink?", modelo: "I'd like some juice." },
            { pregunta: "Do you like pizza?", modelo: "Yes, I do." },
            { pregunta: "Can your dad cook?", modelo: "Yes, he can." },
            { pregunta: "Would you like some ice cream?", modelo: "Yes, please." },
          ],
          aceptadas: [],
          tambienSeAcepta: "Frases completas o cortas",
          segundos: 10,
          porRevisar: ["preguntas.modelo: el documento no las escribe; salen de las paradas 6 y 7"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Dónde estás y qué está pasando (paradas 8 y 9)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece: 'Oye: "The cat is next to the bed." Elige entre las tres imágenes del gato y la cama.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["The cat is next to the bed."],
          traduccion: ["El gato está al lado de la cama."],
          opciones: [
            { imagen: "f-gato-debajo", descripcion: "El gato debajo de la cama", etiqueta: "Under the bed", etiquetaEs: "Debajo de la cama" },
            { imagen: "f-gato-encima", descripcion: "El gato encima de la cama", etiqueta: "On the bed", etiquetaEs: "Encima de la cama" },
            { imagen: "f-gato-alado", descripcion: "El gato al lado de la cama", etiqueta: "Next to the bed", etiquetaEs: "Al lado de la cama" },
          ],
          correcta: 2,
          porRevisar: ["opciones: el dibujo del gato al lado de la cama es nuevo (f-gato-alado): la cama tiene el mismo estilo y ángulo que en los otros dos, y el gato está en el piso a su lado; antes estaba delante de la cama, que se leía como in front of (cambio del 30 de octubre de 2026)", "traduccion", 'quienHabla: el documento solo dice "Oye:"; se puso Allison'],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'La escena del mercado de Seattle (f-mercado-escena). Allison: "Tell me 3 things." Sin palabras de ayuda.',
          siRespondeMal: 'Si nombra menos de 3, Allison pregunta "What is the boy doing?" o "Is there a guitar?".',
          imagen: "f-mercado-escena",
          pregunta: "Tell me 3 things.",
          plantillas: [],
          palabrasAyuda: [],
          modelo: ["There are two people.", "They're dancing.", "A man is selling fish."],
          aceptadas: [],
          tambienSeAcepta: "Cualquier frase correcta sobre la imagen",
          cosas: ["man", "woman", "boy", "people", "fish", "flower", "ice cream", "guitar", "dance"],
          minimo: 3,
          porRevisar: [
            'modelo: el documento pide tres frases y da dos de ejemplo ("There are two people. They\'re dancing."); la tercera ("A man is selling fish.") sale de la parada 9, con la misma imagen',
            'cosas: el documento no las nombra; salen de la imagen f-mercado-escena. "dance" desde el 28 de octubre de 2026: la frase modelo "They\'re dancing." no contaba',
          ],
        },
        {
          paso: 3,
          tipo: "tu-turno",
          queAparece:
            'Sarah, en videollamada: "Where are you? What are you wearing? Is there a park near you?" Una pregunta a la vez.',
          siRespondeMal: "No se califica. Puede oír el modelo y grabar otra vez.",
          dialogo: [
            { quien: "Sarah", dice: "Where are you?" },
            { quien: "Sarah", dice: "What are you wearing?" },
            { quien: "Sarah", dice: "Is there a park near you?" },
          ],
          plantilla: "I'm at ___. I'm wearing ___. Yes, there is. / No, there isn't.",
          modelo: "I'm at home. I'm wearing jeans. Yes, there is.",
          aceptadas: [],
          tambienSeAcepta: "Respuestas cortas",
          porRevisar: [
            'plantilla: el documento no la escribe; dice "Respuestas sobre su lugar y su ropa"',
            "modelo: el documento no lo escribe; sale de las paradas 8 y 9",
            "dialogo: Sarah hace una pregunta a la vez; aquí quedan seguidas y el modelo responde las tres",
          ],
        },
      ],
    },
    {
      numero: 3,
      titulo: "Muévete y repasa todo (parada 10 y todo A1)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Mapa sencillo de la app. Oye: "Go straight one block and turn right. The hotel is across from the park." Toca el edificio.',
          siRespondeMal: "Se repite la indicación despacio y el camino se dibuja paso a paso.",
          quienHabla: "Allison",
          audio: ["Go straight one block and turn right. The hotel is across from the park."],
          traduccion: ["Sigue derecho una cuadra y gira a la derecha. El hotel está frente al parque."],
          pregunta: "¿Dónde está el hotel? Toca el edificio.",
          opciones: [
            {
              dibujo: { edificio: { cuadras: 1, gira: "derecha", lado: "derecha" } },
              descripcion: "El edificio frente al parque después de seguir derecho una cuadra y girar a la derecha (el hotel)",
              etiqueta: "Turn right. Across from the park.",
              etiquetaEs: "Gira a la derecha. Frente al parque.",
            },
            {
              dibujo: { edificio: { cuadras: 1, gira: "derecha", lado: "izquierda", lote: 2 } },
              descripcion: "El edificio al lado del parque después de seguir derecho una cuadra y girar a la derecha",
              etiqueta: "Turn right. Next to the park.",
              etiquetaEs: "Gira a la derecha. Al lado del parque.",
            },
            {
              dibujo: { edificio: { cuadras: 1, gira: "izquierda", lado: "izquierda" } },
              descripcion: "El edificio frente al parque después de seguir derecho una cuadra y girar a la izquierda",
              etiqueta: "Turn left. Across from the park.",
              etiquetaEs: "Gira a la izquierda. Frente al parque.",
            },
          ],
          correcta: 0,
          // El parque al final de la calle: el hotel y el de la izquierda quedan
          // frente a él; el otro, a su lado.
          parque: 1,
          porRevisar: [
            "con pregunta, y cada edificio dice su camino al tocarlo (cambio del 30 de octubre de 2026)",
            "traduccion",
            'quienHabla: el documento solo dice "Oye:"; se puso Allison',
            "opciones: el documento no dice dónde están los edificios del mapa; las posiciones de los dos incorrectos son una propuesta",
          ],
        },
        {
          paso: 2,
          tipo: "repite",
          queAparece: 'Audio de Allison: "Excuse me, how do I get to the museum? Is it far?"',
          siRespondeMal: "Señala la palabra que no se entendió y la dice despacio.",
          frase: "Excuse me, how do I get to the museum? Is it far?",
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "What's your name? How do you spell it? When is your birthday? What time do you get up? What are you doing now?",
          siRespondeMal:
            "Se muestra una respuesta modelo y la pregunta vuelve al final. Mezcla a propósito las paradas 1, 3, 4, 5 y 9.",
          // "Qué debe responder": "Respuestas cortas y con sentido". El documento no escribe respuestas en inglés.
          preguntas: [
            { pregunta: "What's your name?", modelo: "My name is Diego." },
            { pregunta: "How do you spell it?", modelo: "D-I-E-G-O." },
            { pregunta: "When is your birthday?", modelo: "It's on March 3rd." },
            { pregunta: "What time do you get up?", modelo: "I get up at six." },
            { pregunta: "What are you doing now?", modelo: "I'm studying English." },
          ],
          aceptadas: [],
          tambienSeAcepta: "Frases completas o cortas",
          segundos: 10,
          porRevisar: ["preguntas.modelo: el documento no las escribe; salen de las paradas 3, 4, 5 y 9"],
        },
      ],
    },
    {
      numero: 4,
      titulo: "¿Cuánto sabes de Allison?",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison: "Take the subway. Don\'t take a taxi!" Elige entre metro, taxi y tranvía (f-metro, f-taxi, f-tranvia).',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Take the subway. Don't take a taxi!"],
          traduccion: ["Toma el metro. ¡No tomes taxi!"],
          pregunta: "¿Qué recomienda Allison?",
          opciones: [
            { imagen: "f-metro", descripcion: "El metro", etiqueta: "The subway", etiquetaEs: "El metro" },
            { imagen: "f-taxi", descripcion: "El taxi", etiqueta: "A taxi", etiquetaEs: "Un taxi" },
            { imagen: "f-tranvia", descripcion: "El tranvía", etiqueta: "A cable car", etiquetaEs: "Un tranvía" },
          ],
          correcta: 0,
          porRevisar: ["con pregunta (antes salía «¿Qué dice Allison?» y Allison nombra el metro y el taxi); el tranvía es «cable car», como en la parada 10 (cambio del 30 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'La gata Luna (f-gata-luna). Allison pregunta: "Who is she? Tell me 3 things about her."',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "She is my pet." → "She is gray." → "Her name starts with L."',
          imagen: "f-gata-luna",
          pregunta: "Who is she? Tell me 3 things about her.",
          contexto: "¿Quién es ella? Di tres cosas de ella en inglés: cómo se llama, de quién es y cuántos años tiene.",
          respuesta: "She's Luna. She's Allison's cat. She's three.",
          aceptadas: ["Her name is Luna.", "She sleeps next to the window."],
          pistas: ["She is my pet.", "She is gray.", "Her name starts with L."],
          porRevisar: [
            "respuesta: la actividad pide 3 cosas, pero ¿Qué es esto? evalúa una sola frase: con las aceptadas tal cual, basta con decir una de ellas",
          ],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            "Ficha final con cinco datos tapados, uno de cada parte del viaje: qué sabe hacer, qué le gusta comer, cómo es su apartamento, qué está haciendo ahora y cómo llegar a su casa. Sin palabras de ayuda. Mínimo 10 intervenciones.",
          siRespondeMal: "Allison: ¿Qué quieres saber? y muestra las palabras de ayuda solo para esa pregunta.",
          ficha: "Allison (ficha final)",
          datos: [
            { dato: "Qué sabe hacer", pregunta: "Can you sing?", respuesta: "No, I can't. I can't sing at all!" },
            {
              dato: "Qué le gusta comer",
              pregunta: "What's your favorite food?",
              respuesta: "Colombian food! My favorite is mute santandereano.",
            },
            {
              dato: "Cómo es su apartamento",
              pregunta: "How many bedrooms are there in your apartment?",
              respuesta: "There is one bedroom. It's small!",
            },
            { dato: "Qué está haciendo ahora", pregunta: "What are you doing now?", respuesta: "I'm talking with you!" },
            {
              dato: "Cómo llegar a su casa",
              pregunta: "How do I get to your apartment?",
              respuesta: "Take the subway to Brooklyn. My building is on the corner, next to a café.",
            },
          ],
          aceptadas: [],
          tambienSeAcepta: "Cualquier pregunta que se entienda",
          ayuda: "¿Qué quieres saber?",
          minimoIntervenciones: 10,
          porRevisar: [
            "datos.respuesta: las respuestas de Allison salen de su ficha y de las paradas 3, 6, 8, 9 y 10; el repaso no las escribe",
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "Un día en Nueva York",
    imagen: "e-nueva-york-dia",
    contexto:
      "Llegas a Nueva York, la ciudad de Allison, para cerrar el viaje. Allison es ella misma: te recibe en el aeropuerto y pasa el día contigo.",
    personaje: "Allison, ella misma, que te recibe en Nueva York, su ciudad; en el hotel hace de recepcionista",
    objetivo: "Desenvolverse solo en un día de viaje usando todo A1",
    tareas: [
      "Saluda y cuenta cómo fue el viaje con lo que sabes (I'm tired, I'm happy).",
      "Di tu nombre, deletréalo y di cuántas noches (for three nights).",
      "Pregunta qué hay en la habitación o cerca.",
      "Pide comida y bebida.",
      "Di qué te gusta y qué sabes hacer.",
      "Pregunta cómo llegar a un lugar.",
      "Cuenta qué está pasando a tu alrededor.",
      "Despídete de Allison.",
    ],
    // El documento anuncia "16 intervenciones del alumno", pero la tabla trae 12.
    dialogo: [
      { momento: "Aeropuerto", quien: "personaje", dice: "Welcome to New York! How are you?" },
      { momento: "Aeropuerto", quien: "alumno", dice: "Hi, Allison! I'm tired, but I'm very happy!", tarea: 1 },
      { momento: "Aeropuerto", quien: "personaje", dice: "Let's go to the hotel. Do you have your bag?" },
      { momento: "Aeropuerto", quien: "alumno", dice: "Yes, I have my bag and my backpack." },
      { momento: "Hotel", quien: "personaje", dice: "Good afternoon! What's your name?" },
      // El documento marca dos líneas para la tarea 2: las dos llevan el número.
      { momento: "Hotel", quien: "alumno", dice: "My name is Diego Rojas. R-O-J-A-S.", tarea: 2 },
      { momento: "Hotel", quien: "personaje", dice: "How many nights?" },
      { momento: "Hotel", quien: "alumno", dice: "Three nights, please.", tarea: 2 },
      { momento: "Hotel", quien: "personaje", dice: "Here's your key. Room 405." },
      { momento: "Hotel", quien: "alumno", dice: "Is there a supermarket near the hotel?", tarea: 3 },
      { momento: "Hotel", quien: "personaje", dice: "Yes, there's one across the street." },
      { momento: "Restaurante", quien: "personaje", dice: "I'm hungry! What would you like?" },
      { momento: "Restaurante", quien: "alumno", dice: "I'd like a burger and some fries. And a soda, please.", tarea: 4 },
      { momento: "Restaurante", quien: "personaje", dice: "Good choice! Do you like New York food?" },
      { momento: "Restaurante", quien: "alumno", dice: "Yes, I like pizza. And I can cook arepas!", tarea: 5 },
      { momento: "Restaurante", quien: "personaje", dice: "Really? Can you cook for me one day?" },
      { momento: "Restaurante", quien: "alumno", dice: "Yes, I can!" },
      { momento: "Calle", quien: "personaje", dice: "So, where would you like to go now?" },
      { momento: "Calle", quien: "alumno", dice: "How do I get to the Statue of Liberty?", tarea: 6 },
      {
        momento: "Calle",
        quien: "personaje",
        dice: "Go straight to the water and take the ferry. Look! What's happening there?",
      },
      { momento: "Calle", quien: "alumno", dice: "A man is playing the guitar and people are dancing.", tarea: 7 },
      { momento: "Calle", quien: "personaje", dice: "It's New York! So, are you ready for the next trip?" },
      { momento: "Calle", quien: "alumno", dice: "Yes! Thank you for everything, Allison." },
      { momento: "Calle", quien: "personaje", dice: "See you in the UK!" },
      { momento: "Calle", quien: "alumno", dice: "See you! Bye!", tarea: 8 },
    ],
    // "La app cambia el fondo en cada momento con las imágenes ya existentes del
    // aeropuerto, el hotel, el restaurante y la calle." Las calles que existen son
    // de San Francisco (e-san-francisco-calle, f-calle-sf); para la calle se usa el
    // fondo general, e-nueva-york-dia, que ya es una calle de Nueva York.
    momentos: [
      { nombre: "Aeropuerto", tareas: [1], imagen: "e-miami-aeropuerto" },
      { nombre: "Hotel", tareas: [2, 3], imagen: "c-hotel", repasar: "paradas 3 y 4" },
      { nombre: "Restaurante", tareas: [4, 5], imagen: "c-restaurante", repasar: "parada 7" },
      { nombre: "Calle", tareas: [6, 7, 8], imagen: "e-nueva-york-dia", repasar: "parada 10" },
    ],
    resumen: "¡Terminaste A1! Viajaste por Estados Unidos en inglés.",
    recompensa:
      'El resumen muestra lo que el alumno ya sabe decir (una frase por parada) y en qué parada tuvo más errores. Gana el sello "A1 completo" en el pasaporte y se abre A2 en el Reino Unido.',
    siSeAtasca: [],
    siSeAtascaTexto:
      "Igual que en las paradas. Si se atasca en un momento, Allison propone repasar la parada de ese momento (hotel, parada 3 y 4; restaurante, parada 7; calle, parada 10) y luego seguir donde iba, sin empezar de cero.",
    // Duración: "Mínimo 10 intervenciones en total (unas 2 o 3 por momento); al
    // cumplirlas, la app avisa que la meta se cumplió. Como son cuatro momentos, lo
    // normal es que el alumno llegue a 16 o 20".
    minimoIntervenciones: 10,
    // Las paradas cierran a las 18; aquí se aprobó subir a 24 porque "lo normal es
    // que el alumno llegue a 16 o 20".
    maximoIntervenciones: 24,
  },
  notas: [
    'Nota de nivel: "I\'m tired" y "I\'m hungry" son adjetivos con to be (parada 1). "For three nights" es una frase fija del hotel. "Was" o "were" no aparecen: el pasado es de A2.',
  ],
};
