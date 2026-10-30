import type { Parada } from "../tipos.ts";

/**
 * Parada 4 · Washington. Documento "Contenido A1", aprobada el 14 de octubre de 2026.
 *
 * Los relojes, las tarjetas de los días y las hojas de calendario los dibuja
 * la app (llevan números o letras y así se ven exactos): por eso esas
 * opciones van con `texto` y no con imagen.
 */
export const PARADA_04: Parada = {
  numero: 4,
  ciudad: "Washington",
  titulo: "Di números, horas y fechas",
  gramatica: "In, on y at para el tiempo",
  objetivo:
    'Al terminar, el alumno dice horas, días y fechas. Gramática: in, on y at para el tiempo. Usa lo de las paradas 1 a 3. No usa presente simple ("The tour starts…" llega en la parada 5); se dice "The tour is at 10".',
  fraseMeta: "The tour is on Monday at 10. Three people, please.",
  portada: "washington",
  vocabulario: [
    {
      grupo: "Números",
      ingles: "1 a 100; el teléfono dígito por dígito",
      nota: 'En Estados Unidos el 0 de un teléfono se dice "zero" u "oh"; se aceptan los dos',
    },
    {
      grupo: "La hora",
      ingles: "What time is it? It's ten o'clock. It's nine thirty. It's seven fifteen. in the morning, in the afternoon, at night",
      nota: 'Se enseña la forma digital de Estados Unidos ("nine thirty"); "half past" no se enseña',
    },
    {
      grupo: "Días y meses",
      ingles: "Monday a Sunday; January a December; today, tomorrow, birthday",
      nota: "Siempre con mayúscula inicial",
    },
    {
      grupo: "Fechas",
      ingles: "October 14th. My birthday is on May 12th.",
      nota: "Formato de Estados Unidos: primero el mes y luego el día (10/14)",
    },
    { grupo: "In, on, at", ingles: "at 10, at night; on Monday, on May 12th; in May, in the morning", nota: "Es la gramática de la parada" },
    { grupo: "Pregunta nueva", ingles: "When is your birthday?", nota: "Se suma a what, where, who y how de la parada 3" },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Qué hora es?",
      objetivo: "Entender y decir la hora.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Oye: "It\'s seven thirty." (no está escrito). Elige entre tres relojes de manecillas: 7:30, 3:30 y 7:00. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["It's seven thirty."],
          traduccion: ["Son las siete y media."],
          opciones: [
            { texto: "7:30", descripcion: "Un reloj de manecillas que marca las 7:30", etiqueta: "Seven thirty", etiquetaEs: "Las siete y media" },
            { texto: "3:30", descripcion: "Un reloj de manecillas que marca las 3:30", etiqueta: "Three thirty", etiquetaEs: "Las tres y media" },
            { texto: "7:00", descripcion: "Un reloj de manecillas que marca las 7:00", etiqueta: "Seven o'clock", etiquetaEs: "Las siete" },
          ],
          correcta: 0,
          porRevisar: ["relojes: la hora va también en números debajo y cada reloj tiene su etiqueta, que suena al elegirlo (cambio del 30 de octubre de 2026)", "traduccion", "quienHabla: el documento solo dice \"Oye:\"; se puso Allison"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Un reloj que marca las 10:00. Allison pregunta: "What time is it?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "It\'s after nine." → "It\'s before eleven." → "It\'s ten…" Sin pistas, Allison dice "It\'s ten o\'clock" y el alumno la repite.',
          texto: "10:00",
          pregunta: "What time is it?",
          contexto: "Mira el reloj. ¿Qué hora es? Responde en inglés.",
          respuesta: "It's ten o'clock.",
          aceptadas: ["Ten.", "Ten o'clock.", "It's ten."],
          pistas: ["It's after nine.", "It's before eleven.", "It's ten…"],
          porRevisar: ["el reloj muestra la hora en números, como en Escucha y elige; pistas que llevan a la hora («It's in the morning.» no se veía en el reloj) (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "It\'s nine thirty in the morning."',
          siRespondeMal:
            'Si no se entiende "thirty": Escucha: thir-ty. La lengua sale un poquito entre los dientes, como en this. Luego la frase completa.',
          frase: "It's nine thirty in the morning.",
          palabraDificil: "thirty",
          consejo: "La lengua sale un poquito entre los dientes, como en this.",
        },
      ],
    },
    {
      numero: 2,
      titulo: "Días y meses",
      objetivo: "Decir cuándo pasa algo con on, in y at.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "The party is on Saturday." (no está escrito). Elige entre tres tarjetas: MONDAY, SATURDAY y SUNDAY. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["The party is on Saturday."],
          traduccion: ["La fiesta es el sábado."],
          opciones: [
            { texto: "MONDAY", descripcion: "La tarjeta del lunes", etiqueta: "Monday", etiquetaEs: "Lunes" },
            { texto: "SATURDAY", descripcion: "La tarjeta del sábado", etiqueta: "Saturday", etiquetaEs: "Sábado" },
            { texto: "SUNDAY", descripcion: "La tarjeta del domingo", etiqueta: "Sunday", etiquetaEs: "Domingo" },
          ],
          correcta: 1,
          porRevisar: ["etiquetas: el día, que Allison dice al elegir la tarjeta (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "tu-turno",
          queAparece: 'Sarah: "When is your birthday?" En pantalla: "My birthday is on ___." con un selector de mes y día.',
          siRespondeMal: "No se califica. Puede oír el modelo y grabar otra vez.",
          dialogo: [{ quien: "Sarah", dice: "When is your birthday?" }],
          plantilla: "My birthday is on ___.",
          modelo: "My birthday is on March 3rd.",
          aceptadas: ["It's in March.", "March 3rd."],
          tambienSeAcepta: "It's in March. March 3rd. Cualquier fecha.",
        },
        {
          paso: 3,
          tipo: "dilo",
          queAparece:
            'Frase en español: "El examen es el lunes a las ocho." Dibujo de la tarjeta de registro con el lápiz (f-tarjeta-registro).',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "in Monday": Con los días se usa on. Al segundo fallo Allison dice la frase completa y el alumno la repite.',
          espanol: "El examen es el lunes a las ocho.",
          imagen: "f-tarjeta-registro",
          respuesta: "The test is on Monday at eight.",
          aceptadas: ["The test is on Monday at eight o'clock.", "The exam is on Monday at eight."],
          palabras: ["The", "test", "is", "on", "Monday", "at", "eight."],
          explicaciones: [
            { siDice: "in Monday", explicacion: "Con los días se usa on." },
            { siDice: "the Monday", explicacion: "Con los días se usa on, sin the: on Monday." },
            { siDice: "the eight", explicacion: "Con la hora se usa at, sin the: at eight." },
          ],
          porRevisar: ["explicaciones para «the Monday» y «at the eight» (de «el lunes» y «a las ocho») (cambio del 30 de octubre de 2026)"],
        },
      ],
    },
    {
      numero: 3,
      titulo: "Fechas al estilo de Estados Unidos",
      objetivo: "Decir fechas con el mes primero y dar su teléfono.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Oye: "The concert is on July 4th." (no está escrito). Elige entre tres hojas de calendario: JUL 4, APR 7 y JUN 4. Al acertar aparece la frase con su traducción y una nota: En Estados Unidos, 7/4 es el 4 de julio: primero va el mes.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["The concert is on July 4th."],
          traduccion: ["El concierto es el 4 de julio."],
          opciones: [
            { texto: "JULY 4", descripcion: "La hoja de calendario del 4 de julio", etiqueta: "July fourth", etiquetaEs: "4 de julio" },
            { texto: "APRIL 7", descripcion: "La hoja de calendario del 7 de abril", etiqueta: "April seventh", etiquetaEs: "7 de abril" },
            { texto: "MAY 4", descripcion: "La hoja de calendario del 4 de mayo", etiqueta: "May fourth", etiquetaEs: "4 de mayo" },
          ],
          correcta: 0,
          porRevisar: ["opciones: el mes completo (JULY 4, APRIL 7) y MAY 4 en vez de JUN 4, que se veía y sonaba casi igual a JUL 4; cada tarjeta suena al elegirla (cambio del 30 de octubre de 2026)", "traduccion", "quienHabla: el documento solo dice \"Oye:\"; se puso Allison"],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'La taquilla de un museo: un reloj que marca las 10:00, un calendario con un día marcado en rojo y tres personas en la fila. Allison: "Tell me 3 things." Debajo: "I see ___." y las palabras a clock, a calendar, three people.',
          siRespondeMal:
            'Si nombra menos de 3, Allison señala el reloj y pregunta "What time is it?". Lo que no sepa, se lo dice y el alumno lo repite.',
          imagen: "f-taquilla-museo",
          pregunta: "Tell me 3 things.",
          plantillas: ["I see ___."],
          palabrasAyuda: ["a clock", "a calendar", "three people"],
          modelo: ["I see a clock.", "I see a calendar.", "I see three people."],
          aceptadas: ["It's ten o'clock.", "Three people."],
          cosas: ["clock", "calendar", "people"],
          minimo: 3,
        },
        // Nota del documento debajo de la tabla: "El teléfono que dice el alumno no se guarda ni se
        // envía a nadie; solo se evalúa que diga los números."
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con diez segundos: What time is it? (con un reloj en pantalla) What day is today? When is your birthday? What's your phone number? How old are you?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          preguntas: [
            { pregunta: "What time is it?", modelo: "It's three o'clock." },
            { pregunta: "What day is today?", modelo: "It's Tuesday." },
            { pregunta: "When is your birthday?", modelo: "It's on March 3rd." },
            { pregunta: "What's your phone number?", modelo: "310 555 0198." },
            { pregunta: "How old are you?", modelo: "I'm 15." },
          ],
          aceptadas: ["Three.", "Tuesday.", "March 3rd."],
          tambienSeAcepta: 'Respuestas cortas: "Three." "Tuesday." "March 3rd." Cualquier teléfono (no se guarda).',
          segundos: 10,
        },
      ],
    },
    {
      numero: 4,
      titulo: "La agenda de Allison",
      objetivo: "Preguntar fechas y horas a otra persona.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison dice: "My English class is at four o\'clock." (no está escrito). Elige entre tres relojes: 4:00, 2:00 y 4:30. Al acertar aparece la frase con su traducción.',
          siRespondeMal: "Se repite la frase despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["My English class is at four o'clock."],
          traduccion: ["Mi clase de inglés es a las cuatro."],
          opciones: [
            { texto: "4:00", descripcion: "Un reloj que marca las 4:00", etiqueta: "Four o'clock", etiquetaEs: "Las cuatro" },
            { texto: "2:00", descripcion: "Un reloj que marca las 2:00", etiqueta: "Two o'clock", etiquetaEs: "Las dos" },
            { texto: "4:30", descripcion: "Un reloj que marca las 4:30", etiqueta: "Four thirty", etiquetaEs: "Las cuatro y media" },
          ],
          correcta: 0,
          porRevisar: ["relojes: la hora va también en números debajo y cada reloj tiene su etiqueta, que suena al elegirlo (cambio del 30 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Un árbol de Navidad en una calle con nieve. Allison pregunta: "What month is it?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Christmas is in this month." → "It\'s the last month of the year." → "It starts with D." Sin pistas, Allison dice "December" y el alumno la repite.',
          imagen: "f-navidad-nieve",
          pregunta: "What month is it?",
          contexto: "Hay nieve y un árbol de Navidad. ¿En qué mes estamos? Dilo en inglés.",
          respuesta: "December",
          aceptadas: ["It's December."],
          pistas: ["Christmas is in this month.", "It's the last month of the year.", "It starts with D."],
          porRevisar: ["pistas: primero la Navidad y el último mes del año; «It's cold in New York.» no llevaba al mes (cambio del 30 de octubre de 2026)"],
        },
        // Las respuestas de Allison están escritas en el documento, en el párrafo debajo de la
        // tabla ("Respuestas de Allison: …"), y coinciden con su ficha (FICHA_ALLISON).
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha de Allison con cinco datos por descubrir: su cumpleaños, su día favorito, su mes favorito, la edad de Luna y el cumpleaños de Emily. Arma cada pregunta con palabras de ayuda. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿Cuándo es mi cumpleaños? Say: When is your birthday? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "Allison",
          datos: [
            { dato: "Su cumpleaños", pregunta: "When is your birthday?", respuesta: "It's on May 12th." },
            { dato: "Su día favorito", pregunta: "What's your favorite day?", respuesta: "Saturday! It's my day with my sister." },
            {
              dato: "Su mes favorito",
              pregunta: "What's your favorite month?",
              respuesta: "December. New York is beautiful in December!",
            },
            { dato: "La edad de Luna", pregunta: "How old is Luna?", respuesta: "She is three." },
            { dato: "El cumpleaños de Emily", pregunta: "When is Emily's birthday?", respuesta: "It's on July 4th, Independence Day!" },
          ],
          aceptadas: ["Your birthday?", "Luna is how old?"],
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "Your birthday?", "Luna is how old?"',
          ayuda: "¿Qué quieres saber? ¿Cuándo es mi cumpleaños? Say: When is your birthday?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Reserva un tour por teléfono",
    imagen: "e-washington-oficina",
    contexto:
      "Quieres hacer un tour por Washington con dos amigos. Llamas a la oficina de tours. Kate (Allison en su papel) te contesta.",
    personaje: "Kate, la empleada de la oficina de tours de Washington",
    objetivo: "Reservar un tour diciendo el día, la hora, cuántas personas son y sus datos",
    tareas: [
      "Saluda y pide un tour.",
      "Di qué día.",
      "Di a qué hora.",
      "Di cuántas personas son.",
      "Deletrea tu nombre y di tu teléfono.",
      "Despídete.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Good morning! Washington Tours, this is Kate." },
      { quien: "alumno", dice: "Good morning! A tour, please.", tarea: 1 },
      { quien: "personaje", dice: "Sure! What day?" },
      { quien: "alumno", dice: "On Monday.", tarea: 2 },
      { quien: "personaje", dice: "Monday is October 19th. What time? At ten or at two?" },
      { quien: "alumno", dice: "At ten, please.", tarea: 3 },
      { quien: "personaje", dice: "OK, at ten o'clock in the morning. How many people?" },
      { quien: "alumno", dice: "Three people, please.", tarea: 4 },
      { quien: "personaje", dice: "Three people. Perfect! What's your name?" },
      { quien: "alumno", dice: "My name is Diego Rojas." },
      { quien: "personaje", dice: "How do you spell your last name?" },
      { quien: "alumno", dice: "R-O-J-A-S.", tarea: 5 },
      { quien: "personaje", dice: "Thank you. And what's your phone number?" },
      { quien: "alumno", dice: "It's 310 555 0198.", tarea: 5 },
      { quien: "personaje", dice: "Great. So, the tour is on Monday, October 19th, at ten." },
      { quien: "alumno", dice: "Yes, on Monday at ten." },
      { quien: "personaje", dice: "Is this your first time in Washington?" },
      { quien: "alumno", dice: "Yes, it is!" },
      { quien: "personaje", dice: "Welcome! See you on Monday!" },
      { quien: "alumno", dice: "Thank you, Kate. Goodbye!", tarea: 6 },
    ],
    resumen: "¡Lo lograste! Reservaste un tour en inglés.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Washington en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y repite la pregunta más simple, con opciones",
        ejemplo: '"Yes" → Monday or Tuesday?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina el botón de ayuda con la frase sugerida",
        ejemplo: 'Ayuda: "At ___ o\'clock."',
      },
      {
        situacion: "Responde en español",
        accion: "Sale un momento del personaje, da la frase y vuelve a la escena",
        ejemplo: '"Somos tres" → En inglés: Three people, please. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you repeat that?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"In Monday" → la escena sigue; en el resumen: Con los días se usa on: on Monday.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Allison cierra la escena con amabilidad y propone repasar la lección que faltó",
        ejemplo: "Thank you for calling! Vamos a repasar las horas y los días y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
  },
  ilustraciones: [
    {
      archivos: ["f-taquilla-museo"],
      muestra:
        "La taquilla de un museo con un reloj de manecillas a las 10:00 sin números, un calendario sin letras con un día marcado en rojo y tres personas en la fila",
      uso: "Lección 3 (paso 2)",
    },
    { archivos: ["f-navidad-nieve"], muestra: "Un árbol de Navidad en una calle de ciudad con nieve", uso: "Lección 4 (paso 2)" },
  ],
};
