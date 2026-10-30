import type { Parada } from "../tipos.ts";

/** Parada 3 · Nueva York. Documento "Contenido A1", aprobada el 14 de octubre de 2026. */
export const PARADA_03: Parada = {
  numero: 3,
  ciudad: "Nueva York",
  titulo: "Conoce gente nueva",
  gramatica: "Preguntas con what, where, who y how",
  objetivo:
    'Al terminar, el alumno hace preguntas para conocer a alguien. Gramática: preguntas con what, where, who y how. Usa lo de las paradas 1 y 2. "Where do you live?" y "How do you spell…?" se enseñan como frases fijas; el presente simple se explica en la parada 5.',
  fraseMeta: "What's your name? How do you spell it? Where do you live?",
  portada: "nueva-york",
  vocabulario: [
    {
      grupo: "Preguntas",
      ingles: "What, where, who, how",
      nota: '"What\'s your name?", "Where are you from?" y "How old are you?" ya se conocen de la parada 1; aquí se nombran como palabras de pregunta',
    },
    { grupo: "Escuela", ingles: "teacher, classmate, best friend, board, desk, backpack", nota: "" },
    {
      grupo: "Gustos",
      ingles: "favorite, sport, food, music; soccer, basketball, baseball",
      nota: 'Inglés de Estados Unidos: "favorite" y "soccer", nunca "favourite" ni "football" para el fútbol',
    },
    { grupo: "Deletrear", ingles: "El alfabeto: A, B, C…", nota: 'Se practica con nombres. "Last name" para el apellido, no "surname"' },
    {
      grupo: "Frases fijas",
      ingles: "How do you spell it? Where do you live? I live in Tunja.",
      nota: "Se enseñan como bloque; el presente simple llega en la parada 5",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Quién es quién en la escuela",
      objetivo: "Preguntar y decir quién es alguien.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: A boy asks: "Who is she?" A girl says: "She\'s my teacher. Her name is Ms. Lee." Pregunta: ¿quién es Ms. Lee? Elige entre tres imágenes: la profesora (a-profesor), Emma (f-nina) y el señor mayor (f-senor-mayor). Al acertar aparece el diálogo con su traducción.',
          siRespondeMal: "Se repite el diálogo y elige otra vez.",
          quienHabla: "Allison",
          audio: ['A boy asks: "Who is she?"', 'A girl says: "She\'s my teacher. Her name is Ms. Lee."'],
          traduccion: ['Un muchacho pregunta: "¿Quién es ella?"', 'Una muchacha dice: "Es mi profesora. Se llama Ms. Lee."'],
          pregunta: "¿Quién es Ms. Lee?",
          opciones: [
            { imagen: "a-profesor", descripcion: "La profesora", etiqueta: "A teacher", etiquetaEs: "Una profesora" },
            { imagen: "f-nina", descripcion: "Emma (una niña)", etiqueta: "A girl", etiquetaEs: "Una niña" },
            { imagen: "f-senor-mayor", descripcion: "El señor mayor", etiqueta: "An older man", etiquetaEs: "Un señor mayor" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", "quienHabla: el documento no dice quiénes hablan en el pasillo"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Imagen de la profesora. Tom dice: "This is Ms. Lee. She is my…"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "She is at school." → "She is with the students." → "It starts with t." Sin pistas, Allison dice "teacher" y el alumno la repite.',
          imagen: "a-profesor",
          pregunta: "This is Ms. Lee. She is my…",
          contexto: "Tom te presenta a Ms. Lee. ¿Quién es ella para Tom? Completa la frase.",
          respuesta: "teacher",
          aceptadas: ["my teacher", "she is my teacher"],
          pistas: ["She is at school.", "She is with the students.", "It starts with t."],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "Who is he? He is my classmate."',
          siRespondeMal: 'Si dice "gu" en "who": Escucha: who. La h suena como una j suave. Say it: who. Luego la frase completa.',
          frase: "Who is he? He is my classmate.",
          palabraDificil: "who",
          consejo: "La h suena como una j suave.",
        },
      ],
    },
    {
      // Nota del documento después de esta lección: "Las letras que más confunden a un
      // hispanohablante (A, E, I, G, J, H, Y) tienen su propio audio en la tarjeta de ayuda."
      numero: 2,
      titulo: "¿Cómo se escribe tu nombre?",
      objetivo: "Deletrear su nombre y pedir que otro lo deletree.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: A girl says: "My name is Amy. A-M-Y." (la frase no está escrita). Elige entre tres tarjetas con nombres: AMY, ANA y ANNIE. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio, letra por letra, y elige otra vez.",
          quienHabla: "Allison",
          audio: ['A girl says: "My name is Amy. A-M-Y."'],
          traduccion: ['Una muchacha dice: "Me llamo Amy. A-M-Y."'],
          opciones: [
            { texto: "AMY", descripcion: "La tarjeta con el nombre AMY", etiqueta: "Amy. A-M-Y.", etiquetaEs: "Amy. A-M-Y." },
            { texto: "ANA", descripcion: "La tarjeta con el nombre ANA", etiqueta: "Ana. A-N-A.", etiquetaEs: "Ana. A-N-A." },
            { texto: "ANNIE", descripcion: "La tarjeta con el nombre ANNIE", etiqueta: "Annie. A-N-N-I-E.", etiquetaEs: "Annie. A-N-N-I-E." },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: el nombre y su deletreo, que Allison dice al elegir la tarjeta (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "tu-turno",
          queAparece:
            'Sarah: "Hi! What\'s your name?" → el alumno dice su nombre. Sarah: "How do you spell it?" En pantalla: el nombre del alumno con un espacio por letra.',
          siRespondeMal: "No se califica. Puede oír el modelo y grabar otra vez. Si no sabe una letra, toca la letra y la oye.",
          dialogo: [
            { quien: "Sarah", dice: "Hi! What's your name?" },
            { quien: "Sarah", dice: "How do you spell it?" },
          ],
          plantilla: "My name is ___. ___",
          modelo: "My name is Diego. D-I-E-G-O.",
          aceptadas: [],
          tambienSeAcepta: "Solo el nombre. Cualquier nombre deletreado.",
          porRevisar: [
            "plantilla: el documento no la escribe; dice que en pantalla va el nombre del alumno con un espacio por letra",
            "dialogo: en el documento el alumno dice su nombre entre las dos líneas de Sarah; aquí quedan seguidas y el modelo responde las dos",
          ],
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece: 'Frase en español: "¿Cómo se escribe tu apellido?" Dibujo de una tarjeta de registro en blanco.',
          siRespondeMal: "Se marca la primera palabra que falla. Al segundo fallo Allison dice la frase completa y el alumno la repite.",
          espanol: "¿Cómo se escribe tu apellido?",
          imagen: "f-tarjeta-registro",
          respuesta: "How do you spell your last name?",
          aceptadas: ["How do you spell it?"],
          palabras: ["How", "do", "you", "spell", "your", "last", "name?"],
        },
      ],
    },
    {
      numero: 3,
      titulo: "Dónde vives y qué te gusta",
      objetivo: "Preguntar y responder dónde vive y cuál es su favorito.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: A boy asks: "Where do you live?" A girl says: "I live in Chicago." (no está escrito). Elige entre tres portadas: Chicago, Miami y Nueva York. Al acertar aparece el diálogo con su traducción.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['A boy asks: "Where do you live?"', 'A girl says: "I live in Chicago."'],
          traduccion: ['Un muchacho pregunta: "¿Dónde vives?"', 'Una muchacha dice: "Vivo en Chicago."'],
          opciones: [
            { imagen: "chicago", descripcion: "La portada de Chicago", etiqueta: "Chicago", etiquetaEs: "Chicago" },
            { imagen: "miami", descripcion: "La portada de Miami", etiqueta: "Miami", etiquetaEs: "Miami" },
            { imagen: "nueva-york", descripcion: "La portada de Nueva York", etiqueta: "New York", etiquetaEs: "Nueva York" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", "quienHabla: el documento no dice quiénes hablan"],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Dibujo de un salón de clase: un tablero, un pupitre con una mochila, una profesora y un alumno. Allison: "Tell me 3 things." Debajo: "I see a ___." y las palabras board, desk, backpack.',
          siRespondeMal:
            'Si nombra menos de 3, Allison señala la mochila y pregunta "What is this?". Lo que no sepa, se lo dice y el alumno lo repite.',
          imagen: "f-salon-clase",
          pregunta: "Tell me 3 things.",
          plantillas: ["I see a ___."],
          palabrasAyuda: ["board", "desk", "backpack"],
          modelo: ["I see a board.", "I see a desk.", "I see a backpack."],
          aceptadas: ["I see a teacher.", "I see a student."],
          cosas: ["board", "desk", "backpack", "teacher", "student"],
          minimo: 3,
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con diez segundos: What's your name? How do you spell it? Where do you live? What's your favorite sport? Who is your best friend?",
          siRespondeMal:
            'Se muestra una respuesta modelo y la pregunta vuelve al final. Si dice "football" para el fútbol, se acepta y el resumen dice: En Estados Unidos se dice soccer.',
          preguntas: [
            { pregunta: "What's your name?", modelo: "Diego." },
            { pregunta: "How do you spell it?", modelo: "D-I-E-G-O." },
            { pregunta: "Where do you live?", modelo: "I live in Tunja." },
            { pregunta: "What's your favorite sport?", modelo: "Soccer." },
            { pregunta: "Who is your best friend?", modelo: "My best friend is Andrés." },
          ],
          aceptadas: ["Tunja.", "Andrés."],
          tambienSeAcepta: 'Respuestas cortas: "Tunja." "Andrés." Cualquier ciudad, deporte o nombre.',
          segundos: 10,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Conoce mejor a Allison",
      objetivo: "Hacer preguntas con what, where, who y how.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison dice: "My favorite sport is soccer." (no está escrito). Elige entre tres imágenes: un balón de fútbol, uno de baloncesto y un bate con una pelota de béisbol. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["My favorite sport is soccer."],
          traduccion: ["Mi deporte favorito es el fútbol."],
          opciones: [
            { imagen: "f-balon-futbol", descripcion: "Un balón de fútbol", etiqueta: "Soccer", etiquetaEs: "Fútbol" },
            { imagen: "f-balon-basquet", descripcion: "Un balón de baloncesto", etiqueta: "Basketball", etiquetaEs: "Baloncesto" },
            { imagen: "f-beisbol", descripcion: "Un bate con una pelota de béisbol", etiqueta: "Baseball", etiquetaEs: "Béisbol" },
          ],
          correcta: 0,
          porRevisar: ["traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Imagen del balón de fútbol. Allison pregunta: "What sport is this?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "It is a sport with a ball." → "It is Colombia\'s favorite sport." → "It starts with s." Si dice "football": En Estados Unidos se dice soccer. Say it: soccer. Sin pistas, Allison dice "soccer" y el alumno la repite.',
          imagen: "f-balon-futbol",
          pregunta: "What sport is this?",
          contexto: "¿Qué deporte se juega con este balón? Dilo en inglés.",
          respuesta: "soccer",
          aceptadas: ["it's soccer"],
          pistas: ["It is a sport with a ball.", "It is Colombia's favorite sport.", "It starts with s."],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha de Allison con cinco datos por descubrir: dónde vive, su comida favorita, su música favorita, quién es Luna y cómo se escribe su nombre. Arma cada pregunta con palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿Cómo se escribe mi nombre? Say: How do you spell your name? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "Allison",
          // Las respuestas sí están en el documento ("Respuestas de Allison (de su ficha)").
          datos: [
            { dato: "Dónde vive", pregunta: "Where do you live?", respuesta: "I live in New York." },
            {
              dato: "Su comida favorita",
              pregunta: "What's your favorite food?",
              respuesta: "Colombian food! My favorite is mute santandereano.",
            },
            { dato: "Su música favorita", pregunta: "What's your favorite music?", respuesta: "Pop music!" },
            { dato: "Quién es Luna", pregunta: "Who is Luna?", respuesta: "Luna is my cat!" },
            { dato: "Cómo se escribe su nombre", pregunta: "How do you spell your name?", respuesta: "A-L-L-I-S-O-N." },
          ],
          aceptadas: ["Your favorite food?", "Luna is who?"],
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "Your favorite food?", "Luna is who?"',
          ayuda: "¿Qué quieres saber? ¿Cómo se escribe mi nombre? Say: How do you spell your name?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Primer día en la escuela de idiomas",
    imagen: "e-nueva-york-salon",
    contexto:
      "Es tu primer día en una escuela de idiomas de Nueva York. Mia, una compañera de Brasil (Allison en su papel), se sienta a tu lado. Quieres conocerla.",
    personaje: "Mia, una compañera de Brasil en la escuela de idiomas",
    objetivo: "Hacer preguntas para conocer a alguien nuevo",
    tareas: [
      "Saluda y preséntate.",
      "Pregunta su nombre y cómo se escribe.",
      "Pregunta de dónde es y dónde vive.",
      "Pregunta por algo favorito.",
      "Despídete.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hi! I'm new here." },
      { quien: "alumno", dice: "Hi! I'm new too. I'm Diego.", tarea: 1 },
      { quien: "personaje", dice: "Nice to meet you, Diego!" },
      { quien: "alumno", dice: "Nice to meet you too. What's your name?", tarea: 2 },
      { quien: "personaje", dice: "My name is Mia." },
      { quien: "alumno", dice: "How do you spell it?", tarea: 2 },
      { quien: "personaje", dice: "M-I-A." },
      { quien: "alumno", dice: "Where are you from, Mia?", tarea: 3 },
      { quien: "personaje", dice: "I'm from Brazil. And you?" },
      { quien: "alumno", dice: "I'm from Colombia." },
      { quien: "personaje", dice: "Cool! Where do you live?" },
      { quien: "alumno", dice: "I live in Tunja. And you? Where do you live?", tarea: 3 },
      { quien: "personaje", dice: "I live in Rio." },
      { quien: "alumno", dice: "What's your favorite sport?", tarea: 4 },
      { quien: "personaje", dice: "Soccer! And volleyball." },
      { quien: "alumno", dice: "Me too! Soccer is my favorite sport." },
      { quien: "personaje", dice: "Who is your teacher?" },
      { quien: "alumno", dice: "My teacher is Ms. Lee." },
      { quien: "personaje", dice: "Oh, my teacher too! See you in class!" },
      { quien: "alumno", dice: "See you, Mia! Bye!", tarea: 5 },
    ],
    resumen: "¡Lo lograste! Conociste a una compañera nueva en inglés.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Nueva York en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y le da pie para la pregunta",
        ejemplo: 'El alumno no pregunta nada → Mia: "Ask me something!"',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina el botón de ayuda con la frase sugerida",
        ejemplo: 'Ayuda: "Where are you from?"',
      },
      {
        situacion: "Responde en español",
        accion: "Sale un momento del personaje, da la frase y vuelve a la escena",
        ejemplo: '"¿Cómo se escribe?" → En inglés: How do you spell it? Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you repeat that?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"Where you are from?" → la escena sigue; en el resumen: En la pregunta, are va antes de you: Where are you from?',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Allison cierra la escena con amabilidad y propone repasar la lección que faltó",
        ejemplo: "See you in class! Vamos a repasar las preguntas y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
  },
  ilustraciones: [
    { archivos: ["f-tarjeta-registro"], muestra: "Una tarjeta de registro en blanco con un lápiz, sin letras", uso: "Lección 2 (paso 3)" },
    { archivos: ["f-salon-clase"], muestra: "Salón con tablero, pupitre con mochila, la profesora y un alumno", uso: "Lección 3 (paso 2)" },
    { archivos: ["f-balon-futbol"], muestra: "Un balón de fútbol", uso: "Lección 4 (pasos 1 y 2)" },
    { archivos: ["f-balon-basquet"], muestra: "Un balón de baloncesto", uso: "Lección 4 (paso 1)" },
    { archivos: ["f-beisbol"], muestra: "Un bate y una pelota de béisbol", uso: "Lección 4 (paso 1)" },
  ],
};
