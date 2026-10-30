import type { Repaso } from "../tipos.ts";

/** Repaso 1 · Chicago. Documento "Contenido A1", aprobado el 14 de octubre de 2026. */
export const REPASO_1: Repaso = {
  nombre: "Repaso 1",
  despuesDeParada: 5,
  ciudad: "Chicago",
  titulo: "Un día en Chicago",
  objetivo:
    "Al terminar, el alumno se presenta, habla de su familia, pregunta, da horas y fechas y cuenta su rutina en una sola conversación. Repasa todo lo de las paradas 1 a 5 y no agrega gramática nueva.",
  comoEsDistinto:
    'Cada lección mezcla dos paradas, no hay palabras nuevas y no necesita ilustraciones nuevas: usa las que ya existen. Al final el alumno recibe la estampilla "Repaso 1" y se abre la parada 6.',
  portada: "chicago",
  lecciones: [
    {
      numero: 1,
      titulo: "Quién eres y tu familia (paradas 1 y 2)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'La foto de la familia de Sarah (f-familia-sarah). Allison cuenta: Sarah says: "This is my dad. His name is Mark. He is 45." Elige a la persona en la foto.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Sarah says: "This is my dad. His name is Mark. He is 45."'],
          traduccion: ['Sarah dice: "Este es mi papá. Se llama Mark. Tiene 45 años."'],
          opciones: [
            { imagen: "f-familia-sarah", descripcion: "El papá de la foto (Mark)", zona: { x: 48.5, y: 40, ancho: 17 }, etiqueta: "Dad", etiquetaEs: "Papá" },
            { imagen: "f-familia-sarah", descripcion: "El abuelo de la foto", zona: { x: 14, y: 44, ancho: 19 }, etiqueta: "Grandpa", etiquetaEs: "Abuelo" },
            { imagen: "f-familia-sarah", descripcion: "La mamá de la foto", zona: { x: 63.5, y: 42, ancho: 15 }, etiqueta: "Mom", etiquetaEs: "Mamá" },
          ],
          correcta: 0,
          porRevisar: ["opciones: zonas más cerradas, una sola persona por tarjeta; antes el papá también se veía en la tarjeta de la mamá (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'quienHabla: el documento solo dice "Oye:"; se puso Sarah porque es su foto y dice "my dad"',
            'opciones: el documento solo dice "elige a la persona en la foto"; el abuelo y la mamá como otras opciones son una propuesta',
          ],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece: 'Frase en español: "Tengo 15 años y tengo una hermana."',
          siRespondeMal:
            'Se marca la primera palabra que falla (por ejemplo "I have 15": Para la edad se usa am: I\'m 15.). Al segundo fallo Allison dice la frase y el alumno la repite.',
          espanol: "Tengo 15 años y tengo una hermana.",
          respuesta: "I'm 15 and I have a sister.",
          aceptadas: ["I am 15 years old and I have one sister."],
          palabras: ["I'm", "15", "and", "I", "have", "a", "sister."],
          explicaciones: [{ siDice: "I have 15", explicacion: "Para la edad se usa am: I'm 15." }],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "What's your name? How old are you? Where are you from? Do you have any brothers or sisters? What's your mom's name?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          // "Qué debe responder": "Respuestas cortas y con sentido". El documento no escribe respuestas en inglés.
          preguntas: [
            { pregunta: "What's your name?", modelo: "My name is Diego." },
            { pregunta: "How old are you?", modelo: "I'm 15." },
            { pregunta: "Where are you from?", modelo: "I'm from Colombia." },
            { pregunta: "Do you have any brothers or sisters?", modelo: "Yes, I have two brothers." },
            { pregunta: "What's your mom's name?", modelo: "Her name is Rosa." },
          ],
          aceptadas: [],
          tambienSeAcepta: "Frases completas o cortas",
          segundos: 10,
          porRevisar: ["preguntas.modelo: el documento no las escribe; salen de las paradas 2 a 4"],
        },
      ],
    },
    {
      numero: 2,
      titulo: "Preguntas, horas y fechas (paradas 3 y 4)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Oye: "The museum is on Saturday at eleven thirty." Elige entre tres tarjetas dibujadas por la app: SAT 11:30, SUN 11:30 y SAT 1:30.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["The museum is on Saturday at eleven thirty."],
          traduccion: ["El museo es el sábado a las once y media."],
          opciones: [
            { texto: "SAT 11:30", descripcion: "La tarjeta del sábado a las 11:30", etiqueta: "Saturday, eleven thirty", etiquetaEs: "Sábado, once y media" },
            { texto: "SUN 11:30", descripcion: "La tarjeta del domingo a las 11:30", etiqueta: "Sunday, eleven thirty", etiquetaEs: "Domingo, once y media" },
            { texto: "SAT 1:30", descripcion: "La tarjeta del sábado a la 1:30", etiqueta: "Saturday, one thirty", etiquetaEs: "Sábado, una y media" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: el día y la hora, que Allison dice al elegir la tarjeta (cambio del 30 de octubre de 2026)", "traduccion", 'quienHabla: el documento solo dice "Oye:"; se puso Allison'],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'La taquilla del museo (f-taquilla-museo). Allison: "Tell me 3 things." Sin palabras de ayuda.',
          siRespondeMal: 'Si nombra menos de 3, Allison pregunta "What time is it?" o "How many people?".',
          imagen: "f-taquilla-museo",
          pregunta: "Tell me 3 things.",
          plantillas: [],
          palabrasAyuda: [],
          modelo: ["It's ten o'clock.", "I see a calendar.", "I see three people."],
          aceptadas: [],
          tambienSeAcepta: "Cualquier frase correcta sobre la imagen",
          cosas: ["o'clock", "clock", "calendar", "people", "woman", "man", "girl", "backpack"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen de la imagen f-taquilla-museo"],
        },
        {
          paso: 3,
          tipo: "tu-turno",
          queAparece:
            'Mia: "Hi! What\'s your name? How do you spell it? When is your birthday?" Una pregunta a la vez.',
          siRespondeMal: "No se califica. Puede oír el modelo y grabar otra vez.",
          dialogo: [
            { quien: "Mia", dice: "Hi! What's your name?" },
            { quien: "Mia", dice: "How do you spell it?" },
            { quien: "Mia", dice: "When is your birthday?" },
          ],
          plantilla: "My name is ___. ___. My birthday is on ___.",
          modelo: "My name is Diego. D-I-E-G-O. My birthday is on March 3rd.",
          aceptadas: [],
          tambienSeAcepta: "Respuestas cortas",
          porRevisar: [
            'plantilla: el documento no la escribe; dice "Su nombre, deletreado, y su cumpleaños con on"',
            "modelo: el documento no lo escribe; sale de las paradas 3 y 4",
            "dialogo: Mia hace una pregunta a la vez; aquí quedan seguidas y el modelo responde las tres",
          ],
        },
      ],
    },
    {
      numero: 3,
      titulo: "Tu rutina (parada 5)",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Oye: "Leo always has breakfast at seven." Elige entre tres imágenes de Leo: se levanta, desayuna o sube al bus.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Leo always has breakfast at seven."],
          traduccion: ["Leo siempre desayuna a las siete."],
          opciones: [
            { imagen: "f-rutina-levantarse", descripcion: "Leo se levanta", etiqueta: "Gets up", etiquetaEs: "Se levanta" },
            { imagen: "f-rutina-desayuno", descripcion: "Leo desayuna", etiqueta: "Has breakfast", etiquetaEs: "Desayuna" },
            { imagen: "f-rutina-bus", descripcion: "Leo sube al bus", etiqueta: "Takes the bus", etiquetaEs: "Toma el bus" },
          ],
          correcta: 1,
          porRevisar: ["etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "traduccion", "quienHabla: el documento no dice quién habla; se puso Allison, porque la frase habla de Leo"],
        },
        {
          paso: 2,
          tipo: "repite",
          queAparece: 'Audio de Allison: "My sister usually watches TV after school."',
          siRespondeMal: 'Si no se entiende la -es de "watches": Escucha: watch-es. Luego la frase completa.',
          frase: "My sister usually watches TV after school.",
          palabraDificil: "watches",
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece: 'Frase en español: "Mi mamá nunca toma café."',
          siRespondeMal:
            'Si dice "drink": Con he y she el verbo lleva -s: drinks. Al segundo fallo Allison dice la frase y el alumno la repite.',
          espanol: "Mi mamá nunca toma café.",
          respuesta: "My mom never drinks coffee.",
          aceptadas: ["My mother never drinks coffee."],
          palabras: ["My", "mom", "never", "drinks", "coffee."],
          explicaciones: [{ siDice: "drink", explicacion: "Con he y she el verbo lleva -s: drinks." }],
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
            'Allison: "My cat is three. Her name is…" Elige entre la gata, el perro y el pájaro (f-gata-luna, f-perro, f-pajaro).',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["I have a cat. She's three. Her name is Luna."],
          traduccion: ["Tengo una gata. Tiene tres años. Se llama Luna."],
          pregunta: "¿Qué mascota tiene Allison?",
          opciones: [
            { imagen: "f-gata-luna", descripcion: "La gata", etiqueta: "A cat", etiquetaEs: "Una gata" },
            { imagen: "f-perro", descripcion: "El perro", etiqueta: "A dog", etiquetaEs: "Un perro" },
            { imagen: "f-pajaro", descripcion: "El pájaro", etiqueta: "A bird", etiquetaEs: "Un pájaro" },
          ],
          correcta: 0,
          porRevisar: ["audio: completo («I have a cat. She's three. Her name is Luna.», de la ficha) y con pregunta; antes terminaba en «Her name is…» (cambio del 30 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "responde",
          queAparece:
            "What time do you get up? How do you go to school? What's your favorite sport? When is your birthday? Who is your best friend?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          // "Qué debe responder": "Respuestas cortas y con sentido". El documento no escribe respuestas en inglés.
          preguntas: [
            { pregunta: "What time do you get up?", modelo: "I get up at six." },
            { pregunta: "How do you go to school?", modelo: "I take the bus." },
            { pregunta: "What's your favorite sport?", modelo: "Soccer." },
            { pregunta: "When is your birthday?", modelo: "It's on March 3rd." },
            { pregunta: "Who is your best friend?", modelo: "My best friend is Andrés." },
          ],
          aceptadas: [],
          tambienSeAcepta: "Frases completas o cortas",
          segundos: 10,
          porRevisar: ["preguntas.modelo: el documento no las escribe; salen de las paradas 3 a 5"],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            "¿Cuánto recuerdas de Allison? Ficha con cinco datos ya vistos, tapados: de dónde es, cómo se llama su hermana, su comida favorita, cuándo es su cumpleaños y cómo va al trabajo. Esta vez no hay palabras de ayuda. Mínimo 10 intervenciones.",
          siRespondeMal: "Allison: ¿Qué quieres saber? y entonces muestra las palabras de ayuda solo para esa pregunta.",
          ficha: "Allison (datos ya vistos)",
          datos: [
            { dato: "De dónde es", pregunta: "Where are you from?", respuesta: "I'm from New York." },
            { dato: "Cómo se llama su hermana", pregunta: "What's your sister's name?", respuesta: "Her name is Emily." },
            {
              dato: "Su comida favorita",
              pregunta: "What's your favorite food?",
              respuesta: "Colombian food! My favorite is mute santandereano.",
            },
            { dato: "Cuándo es su cumpleaños", pregunta: "When is your birthday?", respuesta: "It's on May 12th." },
            { dato: "Cómo va al trabajo", pregunta: "How do you go to work?", respuesta: "I take the subway." },
          ],
          aceptadas: [],
          tambienSeAcepta: "Cualquier pregunta que se entienda",
          ayuda: "¿Qué quieres saber?",
          minimoIntervenciones: 10,
          porRevisar: [
            "datos.respuesta: las respuestas de Allison salen de su ficha y de las paradas 2 a 5; el repaso no las escribe",
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "Un día en Chicago con Allison",
    imagen: "chicago",
    contexto:
      "Es tu último día en Chicago y Allison te acompaña. En la mañana planean el día juntos y hablan de todo un poco. Allison es ella misma.",
    personaje: "Allison, ella misma, que te acompaña en tu último día en Chicago",
    objetivo: "Usar en una sola conversación todo lo de las paradas 1 a 5",
    tareas: [
      "Saluda y di cómo estás.",
      "Di a qué hora te levantas normalmente (I usually get up at…).",
      "Elige un plan y di el día y la hora (on, at).",
      "Muestra una foto y presenta a alguien de tu familia.",
      "Hazle a Allison dos preguntas con palabras distintas (what, where, who, when, how).",
      "Despídete.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Good morning! How are you today?" },
      { quien: "alumno", dice: "Good morning, Allison! I'm great, thank you.", tarea: 1 },
      { quien: "personaje", dice: "Do you get up early here in Chicago?" },
      { quien: "alumno", dice: "Yes. I usually get up at six thirty.", tarea: 2 },
      { quien: "personaje", dice: "Me too! OK, we have two plans: a museum or a boat tour." },
      { quien: "alumno", dice: "The museum, please." },
      { quien: "personaje", dice: "Good choice! What day? Today or tomorrow?" },
      { quien: "alumno", dice: "Today, at ten o'clock.", tarea: 3 },
      { quien: "personaje", dice: "Perfect. Is that a photo of your family?" },
      { quien: "alumno", dice: "Yes! This is my brother. His name is Juan. He is 17.", tarea: 4 },
      { quien: "personaje", dice: "He looks nice! Does he speak English?" },
      { quien: "alumno", dice: "Yes, he does. He always watches movies in English." },
      { quien: "personaje", dice: "Great!" },
      // El documento marca dos líneas para la tarea 5 ("5. Primera pregunta" y
      // "5. Segunda pregunta"): las dos llevan el número y la Ayuda muestra ambas.
      { quien: "alumno", dice: "Allison, where is your sister now?", tarea: 5 },
      { quien: "personaje", dice: "She is in New York with her dog, Rocky." },
      { quien: "alumno", dice: "When is her birthday?", tarea: 5 },
      { quien: "personaje", dice: "On July 4th! OK, it's nine thirty. The museum is at ten!" },
      { quien: "alumno", dice: "OK! Thank you, Allison." },
      { quien: "personaje", dice: "Thank you! It's a great day with you." },
      { quien: "alumno", dice: "See you in New York!", tarea: 6 },
    ],
    resumen: "¡Lo lograste! Usaste todo lo de las paradas 1 a 5 en una conversación.",
    recompensa:
      'Tres estrellas si no usó la ayuda, la estampilla "Repaso 1" en el pasaporte y se abre la parada 6. El resumen muestra en qué parada tuvo más errores y le sugiere repasarla.',
    siSeAtasca: [],
    siSeAtascaTexto:
      "Igual que en las paradas (pregunta más simple, ayuda al segundo fallo, frase en inglés si habla en español, sin correcciones durante la conversación y cierre amable a las 18 intervenciones). La única diferencia: si se atasca en una tarea, Allison propone repasar la parada de esa tarea, no una lección.",
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
  },
  notas: [
    "Dato nuevo (aprobado el 14 de octubre de 2026). Mark, el papá de Sarah: tiene 45 años.",
    "Dato nuevo (aprobado el 14 de octubre de 2026). Hermano del alumno del ejemplo: Juan, 17 años (solo es el ejemplo; cada alumno habla de su familia real).",
  ],
};
