import type { Parada } from "../tipos.ts";

/** Parada 2 · Orlando. Documento "Contenido A1", aprobada el 14 de octubre de 2026. */
export const PARADA_02: Parada = {
  numero: 2,
  ciudad: "Orlando",
  titulo: "Presenta a tu familia",
  gramatica: "Posesivos y have / has",
  objetivo:
    "Al terminar, el alumno presenta a su familia y pregunta por la de otros. Gramática: posesivos (my, your, his, her) y have / has. Usa lo de la parada 1 (to be, saludos, nombre, edad y origen) y nada de paradas posteriores.",
  fraseMeta: "This is my mom. Her name is Rosa. I have two brothers.",
  portada: "orlando",
  vocabulario: [
    {
      grupo: "Familia",
      ingles: "mom, dad, brother, sister, grandma, grandpa, parents, family",
      nota: '"Mom" y "dad" de Estados Unidos, nunca "mum". "Mother" y "father" se entienden, pero no se enseñan como principales',
    },
    { grupo: "Mascotas", ingles: "dog, cat", nota: "Allison tiene una gata, Luna" },
    { grupo: "Posesivos", ingles: "my, your, his, her y la 's (Sarah's mom)", nota: '"Our" y "their" quedan para A2' },
    {
      grupo: "Have / has",
      ingles: "I have, you have, he has, she has, Do you have…?",
      nota: '"I don\'t have…" se acepta si el alumno lo dice. No se enseña "have got"',
    },
    {
      grupo: "Frases",
      ingles: "This is my mom. Her name is Rosa. I have two brothers. She has a cat. Do you have any brothers or sisters?",
      nota: "Los números del 1 al 10 se usan sin explicarlos, como la edad de la parada 1. Las horas y fechas llegan en la parada 4",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Conoce a la familia de Sarah",
      objetivo: "Reconocer y decir las palabras de la familia.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison muestra la foto de la familia de Sarah y cuenta: Sarah says: "This is my grandma." (la frase no está escrita). Elige entre tres personas de la foto: una señora mayor, una mujer joven y una niña. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Sarah says: "This is my grandma."'],
          traduccion: ['Sarah dice: "Esta es mi abuela."'],
          opciones: [
            { imagen: "f-familia-sarah", descripcion: "La señora mayor de la foto (la abuela)", zona: { x: 32, y: 47, ancho: 30 }, etiqueta: "Grandma", etiquetaEs: "Abuela" },
            { imagen: "f-familia-sarah", descripcion: "La mujer joven de la foto (la mamá)", zona: { x: 63, y: 47, ancho: 30 }, etiqueta: "Mom", etiquetaEs: "Mamá" },
            { imagen: "f-familia-sarah", descripcion: "La niña de la foto (la hermanita)", zona: { x: 89, y: 61, ancho: 24 }, etiqueta: "Little sister", etiquetaEs: "Hermanita" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'La foto de la familia de Sarah con una flecha sobre su mamá. Sarah dice: "This is my…" y debajo hay tres rayas.',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "She is a woman." → "She is not old." → "It starts with m." Sin pistas, Allison dice "mom" y el alumno la repite.',
          imagen: "f-familia-sarah",
          pregunta: "This is my…",
          contexto: "Sarah te muestra la foto de su familia. ¿Quién es la persona de la flecha? Completa la frase.",
          respuesta: "mom",
          aceptadas: ["mother", "my mom", "this is my mom"],
          pistas: ["She is a woman.", "She is not old.", "It starts with m."],
          flecha: { x: 63, y: 31 },
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "This is my mom, and this is my dad."',
          siRespondeMal:
            'Si no se entiende "this": Escucha: this. La lengua sale un poquito entre los dientes. Say it: this. Luego la frase completa.',
          frase: "This is my mom, and this is my dad.",
          palabraDificil: "this",
          consejo: "La lengua sale un poquito entre los dientes.",
        },
      ],
    },
    {
      numero: 2,
      titulo: "Esta es mi familia",
      objetivo: "Presentar a alguien de su familia y decir su nombre con his o her.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Tom says: "This is my sister. Her name is Emma." Pregunta: ¿quién es Emma? Elige entre tres imágenes: una niña, un niño y un señor mayor. Al acertar aparece el diálogo con su traducción.',
          siRespondeMal: "Se repite el diálogo y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Tom says: "This is my sister. Her name is Emma."'],
          traduccion: ['Tom dice: "Esta es mi hermana. Se llama Emma."'],
          pregunta: "¿Quién es Emma?",
          opciones: [
            { imagen: "f-nina", descripcion: "Una niña", etiqueta: "Girl", etiquetaEs: "Niña" },
            { imagen: "f-nino", descripcion: "Un niño", etiqueta: "Boy", etiquetaEs: "Niño" },
            { imagen: "f-senor-mayor", descripcion: "Un señor mayor", etiqueta: "Older man", etiquetaEs: "Señor mayor" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "tu-turno",
          queAparece:
            'Sarah: "This is my dad. His name is Mark. Is this your mom?" En pantalla: "Yes, this is my mom. Her name is ___."',
          siRespondeMal: "No se califica. Puede oír el modelo y grabar otra vez.",
          dialogo: [{ quien: "Sarah", dice: "This is my dad. His name is Mark. Is this your mom?" }],
          plantilla: "Yes, this is my mom. Her name is ___.",
          modelo: "Yes, this is my mom. Her name is Rosa.",
          aceptadas: ["Yes. Her name is Rosa."],
          tambienSeAcepta: "Yes. Her name is Rosa. Cualquier nombre.",
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece: 'Frase en español: "Este es mi hermano. Se llama Juan." Dibujo de un muchacho.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "Her name", Allison explica: Para un hombre es his; para una mujer, her. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Este es mi hermano. Se llama Juan.",
          imagen: "f-nino",
          respuesta: "This is my brother. His name is Juan.",
          aceptadas: ["He is my brother. His name's Juan."],
          palabras: ["This", "is", "my", "brother.", "His", "name", "is", "Juan."],
          explicaciones: [{ siDice: "Her name", explicacion: "Para un hombre es his; para una mujer, her." }],
        },
      ],
    },
    {
      numero: 3,
      titulo: "Hermanos y mascotas",
      objetivo: "Decir qué tiene con have y has, y responder sobre su familia.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: A boy says: "I have two sisters and a dog." (la frase no está escrita). Elige entre tres fotos de familia: dos niñas y un perro; dos niños y un gato; una niña y un perro. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['A boy says: "I have two sisters and a dog."'],
          traduccion: ['Un muchacho dice: "Tengo dos hermanas y un perro."'],
          opciones: [
            { imagen: "f-dos-ninas-perro", descripcion: "Dos niñas y un perro", etiqueta: "Two girls and a dog", etiquetaEs: "Dos niñas y un perro" },
            { imagen: "f-dos-ninos-gato", descripcion: "Dos niños y un gato", etiqueta: "Two boys and a cat", etiquetaEs: "Dos niños y un gato" },
            { imagen: "f-nina-perro", descripcion: "Una niña y un perro", etiqueta: "A girl and a dog", etiquetaEs: "Una niña y un perro" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Dibujo de una sala: una niña con un gato, un niño con un perro y un abuelo con una bicicleta. Allison: "Tell me 3 things." Debajo: "She has a ___." / "He has a ___." y las palabras cat, dog, bike.',
          siRespondeMal:
            'Si dice "She have", Allison repite bien la frase (She has a cat.) y el alumno la dice. Si nombra menos de 3, Allison señala la bicicleta y pregunta "What is this?".',
          imagen: "f-sala-mascotas",
          pregunta: "Tell me 3 things.",
          plantillas: ["She has a ___.", "He has a ___."],
          palabrasAyuda: ["cat", "dog", "bike"],
          modelo: ["She has a cat.", "He has a dog.", "He has a bike."],
          aceptadas: ["The girl has a cat.", "Grandpa has a bike."],
          cosas: ["cat", "dog", "bike"],
          minimo: 3,
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con diez segundos: Do you have any brothers or sisters? Do you have a pet? What's your mom's name? What's your dad's name? Where is your family from?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          preguntas: [
            { pregunta: "Do you have any brothers or sisters?", modelo: "Yes, I have two brothers." },
            { pregunta: "Do you have a pet?", modelo: "No, I don't." },
            { pregunta: "What's your mom's name?", modelo: "Her name is Rosa." },
            { pregunta: "What's your dad's name?", modelo: "His name is Carlos." },
            { pregunta: "Where is your family from?", modelo: "Colombia." },
          ],
          aceptadas: ["Yes, two brothers.", "Rosa.", "A dog."],
          tambienSeAcepta: 'Frases completas o cortas: "Yes, two brothers." "Rosa." "A dog."',
          segundos: 10,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Pregúntale a Allison por su familia",
      objetivo: "Hacer preguntas sobre la familia de otra persona.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison muestra una foto y dice: "This is my cat. Her name is Luna." (la frase no está escrita). Elige entre tres imágenes: un gato, un perro y un pájaro. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["This is my cat. Her name is Luna."],
          traduccion: ["Esta es mi gata. Se llama Luna."],
          opciones: [
            { imagen: "f-gata-luna", descripcion: "Un gato", etiqueta: "Cat", etiquetaEs: "Gata" },
            { imagen: "f-perro", descripcion: "Un perro", etiqueta: "Dog", etiquetaEs: "Perro" },
            { imagen: "f-pajaro", descripcion: "Un pájaro", etiqueta: "Bird", etiquetaEs: "Pájaro" },
          ],
          correcta: 0,
          porRevisar: ["traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'La foto de la familia de Sarah con una flecha sobre su abuelo. Sarah dice: "This is my…"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "He is old." → "He is my mom\'s dad." → "It starts with g." Sin pistas, Allison dice "grandpa" y el alumno la repite.',
          imagen: "f-familia-sarah",
          pregunta: "This is my…",
          contexto: "Sarah te muestra la foto de su familia. ¿Quién es la persona de la flecha? Completa la frase.",
          respuesta: "grandpa",
          aceptadas: ["grandfather", "my grandpa"],
          pistas: ["He is old.", "He is my mom's dad.", "It starts with g."],
          flecha: { x: 16, y: 30 },
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha de la familia de Allison con cinco datos por descubrir: si tiene hermanos, cómo se llama su hermana, cuántos años tiene, si su hermana tiene mascota y cómo se llama su mamá. Arma cada pregunta con palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿Cómo se llama mi mamá? Say: What's your mom's name? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "la familia de Allison",
          datos: [
            { dato: "Si tiene hermanos", pregunta: "Do you have any brothers or sisters?", respuesta: "Yes, I have a sister." },
            { dato: "Cómo se llama su hermana", pregunta: "What's her name?", respuesta: "Her name is Emily." },
            { dato: "Cuántos años tiene su hermana", pregunta: "How old is she?", respuesta: "She is 31." },
            { dato: "Si su hermana tiene mascota", pregunta: "Does she have a pet?", respuesta: "Yes, she has a dog. His name is Rocky." },
            { dato: "Cómo se llama su mamá", pregunta: "What's your mom's name?", respuesta: "Her name is Susan." },
          ],
          aceptadas: ["Do you have a sister?", "Her name?", "Your sister has a pet?"],
          tambienSeAcepta:
            'Cualquier pregunta que se entienda: "Do you have a sister?", "Her name?", "Your sister has a pet?"',
          ayuda: "¿Qué quieres saber? ¿Cómo se llama mi mamá? Say: What's your mom's name?",
          minimoIntervenciones: 10,
          porRevisar: ["datos.respuesta: las respuestas de Allison salen de su ficha, no estaban escritas"],
        },
      ],
    },
  ],
  escenario: {
    titulo: "Tu familia anfitriona en Orlando",
    imagen: "e-orlando-sala",
    contexto:
      "Llegas a la casa de tu familia anfitriona. Linda Miller (Allison en su papel) te recibe con su hijo Jake, de 12 años, y su perro Max. Les muestras fotos de tu familia.",
    personaje: "Linda Miller, la mamá de tu familia anfitriona",
    objetivo: "Presentar a su familia y preguntar por la de Linda",
    tareas: [
      "Saluda y di tu nombre.",
      "Presenta a tu mamá o a tu papá con la foto.",
      "Di si tienes hermanos o mascota.",
      "Pregúntale algo a Linda sobre su familia.",
      "Da las gracias.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hi! Welcome to Orlando! I'm Linda." },
      { quien: "alumno", dice: "Hi, Linda! I'm Diego. Nice to meet you.", tarea: 1 },
      { quien: "personaje", dice: "Nice to meet you, Diego! This is Jake. He is 12." },
      { quien: "alumno", dice: "Hi, Jake!" },
      { quien: "personaje", dice: "Do you have a photo of your family?" },
      { quien: "alumno", dice: "Yes! This is my mom.", tarea: 2 },
      { quien: "personaje", dice: "Oh, nice! What's her name?" },
      { quien: "alumno", dice: "Her name is Rosa." },
      { quien: "personaje", dice: "And this man? Is he your dad?" },
      { quien: "alumno", dice: "Yes, this is my dad. His name is Carlos." },
      { quien: "personaje", dice: "Do you have any brothers or sisters?" },
      { quien: "alumno", dice: "Yes, I have two brothers.", tarea: 3 },
      { quien: "personaje", dice: "Cool! Do you have a pet?" },
      { quien: "alumno", dice: "Yes, I have a dog." },
      { quien: "personaje", dice: "Jake has a dog too. His name is Max!" },
      { quien: "alumno", dice: "How old is Max?", tarea: 4 },
      { quien: "personaje", dice: "He is 5. Max is a good dog." },
      { quien: "alumno", dice: "Do you have a cat?" },
      { quien: "personaje", dice: "No, only Max! OK, Diego, welcome to the family!" },
      { quien: "alumno", dice: "Thank you, Linda!", tarea: 5 },
    ],
    resumen: "¡Lo lograste! Presentaste a tu familia en inglés.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Orlando en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y repite la pregunta más simple",
        ejemplo: '"I am fine" → Good! Is this your mom?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina el botón de ayuda con la frase sugerida",
        ejemplo: 'Ayuda: "This is my ___. Her name is ___."',
      },
      {
        situacion: "Responde en español",
        accion: "Sale un momento del personaje, da la frase y vuelve a la escena",
        ejemplo: '"Tengo dos hermanos" → En inglés: I have two brothers. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you repeat that?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"His name is Rosa" o "She have a cat" → la escena sigue; en el resumen: Para una mujer se dice her.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Allison cierra la escena con amabilidad y propone repasar la lección que faltó",
        ejemplo: "Welcome to the family! Vamos a repasar cómo presentar a tu familia y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
  },
  ilustraciones: [
    {
      archivos: ["f-familia-sarah"],
      muestra: "Foto de la familia de Sarah: Sarah, su mamá, su papá Mark, su hermanita, su abuela y su abuelo",
      uso: "Lección 1 (pasos 1 y 2) y lección 4 (paso 2); la app pone la flecha",
    },
    { archivos: ["f-nina", "f-nino", "f-senor-mayor"], muestra: "Una niña, un muchacho y un señor mayor, cada uno solo", uso: "Lección 2 (pasos 1 y 3)" },
    { archivos: ["f-dos-ninas-perro", "f-dos-ninos-gato", "f-nina-perro"], muestra: "Tres fotos de familia para elegir", uso: "Lección 3 (paso 1)" },
    {
      archivos: ["f-sala-mascotas"],
      muestra: "Sala con una niña y su gato, un niño y su perro, y un abuelo con una bicicleta",
      uso: "Lección 3 (paso 2)",
    },
    { archivos: ["f-gata-luna", "f-perro", "f-pajaro"], muestra: "La gata Luna de Allison, un perro y un pájaro", uso: "Lección 4 (paso 1)" },
  ],
};
