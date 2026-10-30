import type { Parada } from "../tipos.ts";

/**
 * Parada 1 · Londres (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/".
 */
export const PARADA_01: Parada = {
  numero: 1,
  ciudad: "Londres",
  titulo: "Habla de tu trabajo o estudio",
  gramatica: "Presente simple contra presente continuo",
  objetivo:
    'Al terminar, el alumno cuenta qué hace siempre y qué está haciendo estos días: "I study at school. This month I\'m learning to code." Gramática: presente simple contra presente continuo. Usa todo A1 y nada de paradas posteriores de A2 (ni pasado, ni will, ni must).',
  fraseMeta: "I study at school. This month I'm learning to code.",
  portada: "londres",
  vocabulario: [
    {
      grupo: "Estudio",
      ingles: "school, class, subject, math, science, history, art, PE, homework, project, test",
      nota: '"Math" de Estados Unidos, nunca "maths". PE = educación física',
    },
    {
      grupo: "Trabajo",
      ingles: "job, office, intern, teacher, nurse, chef, farmer, pilot, police officer",
      nota: '"Intern" es el practicante. "Police officer", no "policeman"',
    },
    {
      grupo: "Siempre (presente simple)",
      ingles: "every day, usually, always, sometimes, on Mondays, after school",
      nota: 'La frecuencia va antes del verbo: "I usually study after school."',
    },
    {
      grupo: "Ahora y estos días (presente continuo)",
      ingles: "now, right now, today, this week, this month, these days",
      nota: '"This month I\'m taking a guitar class."',
    },
    {
      grupo: "Frases",
      ingles:
        "What do you do? I'm a student. I go to school by bus. What are you doing these days? I'm learning to code. Right now I'm working on a project.",
      nota: '"What do you do?" pregunta por el trabajo o el estudio, no por lo de ahora. Los verbos like, love, know y want no van con -ing: "I like math", nunca "I\'m liking"',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Cada día y ahora mismo",
      objetivo: "Distinguir lo que alguien hace siempre de lo que está haciendo ahora.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Priya usually studies in the library after school. But today she\'s studying at home." (la frase no está escrita). Elige entre tres imágenes de Priya: en una biblioteca, en su cuarto con sus libros y en un parque. La traducción queda a un toque.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Priya usually studies in the library after school.", "But today she's studying at home."],
          traduccion: ["Priya normalmente estudia en la biblioteca después del colegio.", "Pero hoy está estudiando en casa."],
          pregunta: "¿Dónde estudia Priya HOY?",
          opciones: [
            { imagen: "f-priya-biblioteca", descripcion: "Priya en una biblioteca", etiqueta: "At the library", etiquetaEs: "En la biblioteca" },
            { imagen: "f-priya-cuarto", descripcion: "Priya en su cuarto con sus libros", etiqueta: "At home", etiquetaEs: "En casa" },
            { imagen: "f-priya-parque", descripcion: "Priya en un parque", etiqueta: "At the park", etiquetaEs: "En el parque" },
          ],
          correcta: 1,
          porRevisar: ["etiquetas: como suenan en la frase (la correcta, «At home»); la pregunta resalta HOY, porque el audio también nombra la biblioteca de siempre (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Priya en su cuarto"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de Ben frente a su computador. Allison: "What is Ben doing?" Debajo: "He\'s ___ on his computer."',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "He has a computer." → "It starts with w." Sin pistas, Allison dice "He\'s working on his computer" y el alumno la repite. Si dice "He work": Lo de ahora mismo va con is y -ing: he\'s working.',
          imagen: "f-ben-computador",
          pregunta: "What is Ben doing?",
          contexto: "¿Qué está haciendo Ben en este momento? Responde con una frase en inglés.",
          respuesta: "He's working.",
          aceptadas: ["is working", "is studying", "is typing", "is writing", "is using", "is doing homework", "is doing his homework"],
          pistas: ["He has a computer.", "It starts with w."],
          explicaciones: [
            { siDice: "He work", explicacion: "Lo de ahora mismo va con is y -ing: he's working." },
          ],
          porRevisar: ["aceptadas: con is y -ing, también «Ben is working», «He's doing his homework» y «He's typing»; explicaciones: la del documento (Si dice…), que no estaba en los datos (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "I usually study in the morning." Se practica la palabra usually.',
          siRespondeMal:
            'Si no se entiende usually: Escucha: usually. Suena "iú-shua-li", con una sh suave. Say it: usually. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "I usually study in the morning.",
          palabraDificil: "usually",
          consejo: 'Suena "iú-shua-li", con una sh suave.',
        },
      ],
    },
    {
      numero: 2,
      titulo: "Tu colegio y tu trabajo",
      objetivo: "Decir qué haces, dónde y cuándo, con el presente simple.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Ben\'s mom is a nurse. She works at a hospital. She works at night." (no está escrito). Elige entre tres imágenes: una enfermera en un hospital de noche, una profesora en un salón y una chef en una cocina.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Ben's mom is a nurse.", "She works at a hospital.", "She works at night."],
          traduccion: ["La mamá de Ben es enfermera.", "Trabaja en un hospital.", "Trabaja de noche."],
          pregunta: "¿Qué hace la mamá de Ben?",
          opciones: [
            { imagen: "f-enfermera-noche", descripcion: "Una enfermera en un hospital de noche", etiqueta: "A nurse", etiquetaEs: "Una enfermera" },
            { imagen: "a1/f-salon-clase", descripcion: "Una profesora frente al tablero de su salón", etiqueta: "A teacher", etiquetaEs: "Una profesora" },
            { imagen: "f-chef-cocina", descripcion: "Una persona que cocina en un restaurante", etiqueta: "A chef", etiquetaEs: "Un chef" },
          ],
          correcta: 0,
          porRevisar: ["opciones: la profesora es la del salón de clase (a1/f-salon-clase); a1/a-profesor era una mujer leyendo un libro, no enseñando. Etiquetas como suenan (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'pregunta: el documento no la escribe; sale de "Toca a la enfermera"',
            'opciones: el documento dice "una profesora" y "una chef"; los dibujos de la tabla son un profesor (de A1) y un chef',
          ],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Voy al colegio en bus. Mi materia favorita es ciencias." Dibujo de un bus escolar. Las palabras de apoyo aparecen después del primer fallo: go, to, school, by, bus, My, favorite, subject, is, science.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "go to the school": Al colegio, sin the: go to school. Si dice "subject are": Es una materia: is. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Voy al colegio en bus. Mi materia favorita es ciencias.",
          imagen: "f-bus-escolar",
          respuesta: "I go to school by bus. My favorite subject is science.",
          aceptadas: ["I take the bus to school. My favorite subject is science.", "I go to school on the bus. My favorite subject is science."],
          palabras: ["I", "go", "to", "school", "by", "bus.", "My", "favorite", "subject", "is", "science."],
          explicaciones: [
            { siDice: "go to the school", explicacion: "Al colegio, sin the: go to school." },
            { siDice: "subject are", explicacion: "Es una materia: is." },
            { siDice: "in bus", explicacion: "En bus se dice by bus: I go to school by bus." },
            { siDice: "in the bus", explicacion: "En bus se dice by bus: I go to school by bus." },
            { siDice: "college", explicacion: "Colegio es school; college es la universidad: I go to school." },
          ],
          porRevisar: ["aceptadas: también «on the bus»; explicaciones para «in bus» y «college» (colegio es school) (cambio del 30 de octubre de 2026)", 'palabras: el documento no trae "I"; sin ella no se arma la frase'],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about your school day." Tres preguntas guía en pantalla: What time do you go to school? What do you study? What do you do after school? Un reloj de 30 segundos.',
          siRespondeMal:
            'Allison dice una cosa que hizo bien y una por mejorar, con su frase y la mejor. Ejemplo: "I study in the school" → Mejor: I study at school. Si habló menos de 20 segundos, lo anima con una pregunta guía y puede intentarlo otra vez.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about your school day.",
          guias: ["What time do you go to school?", "What do you study?", "What do you do after school?"],
          modelo:
            "I go to school at six thirty. I study math, science and English. My favorite subject is art. After school I do my homework and I play soccer.",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Lo que estás haciendo estos días",
      objetivo: "Hablar de lo que pasa estos días con el presente continuo, y responder sobre la rutina.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "This month Priya is taking a guitar class. It\'s fun!" (no está escrito). Elige entre tres imágenes: una clase de guitarra, una de natación y una de cocina.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["This month Priya is taking a guitar class.", "It's fun!"],
          traduccion: ["Este mes Priya está tomando una clase de guitarra.", "¡Es divertido!"],
          pregunta: "¿Qué clase está tomando Priya?",
          opciones: [
            { imagen: "f-priya-guitarra", descripcion: "Priya tocando guitarra en una clase", etiqueta: "A guitar class", etiquetaEs: "Una clase de guitarra" },
            { imagen: "a1/f-nadar", descripcion: "Una clase de natación", etiqueta: "A swimming class", etiquetaEs: "Una clase de natación" },
            { imagen: "f-priya-cocinando", descripcion: "Priya cocinando", etiqueta: "A cooking class", etiquetaEs: "Una clase de cocina" },
          ],
          correcta: 0,
          porRevisar: ["opciones: la clase de guitarra es un dibujo nuevo de Priya con su profesora (f-priya-guitarra); antes era un muchacho tocando guitarra. La clase de cocina es Priya cocinando (f-priya-cocinando); a1/f-cocina-casa era una cocina vacía. Etiquetas como suenan (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'pregunta: el documento no la escribe; sale de "Toca la clase de guitarra"',
            "opciones: los dibujos de A1 están por confirmar (lo dice la tabla de ilustraciones)",
          ],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Dibujo de una oficina en Londres: una mujer habla por teléfono, un hombre toma café y una muchacha escribe en un computador. Allison: "Tell me 3 things people are doing." Debajo: "She\'s ___ing." / "He\'s ___ing." y talking on the phone, drinking coffee, working on a computer.',
          siRespondeMal:
            'Si dice "He drink coffee", Allison repite bien la frase (He\'s drinking coffee.) y el alumno la dice. Si nombra menos de 3, Allison señala el café y pregunta "What is he doing?".',
          imagen: "f-oficina-londres",
          pregunta: "Tell me 3 things people are doing.",
          plantillas: ["She's ___ing.", "He's ___ing."],
          palabrasAyuda: ["talking on the phone", "drinking coffee", "working on a computer"],
          modelo: ["She's talking on the phone.", "He's drinking coffee.", "She's working on a computer."],
          aceptadas: ["The woman is talking on the phone.", "The man is drinking coffee.", "The girl is typing.", "The girl is using a computer."],
          cosas: ["phone", "coffee", "computer", "talking", "drinking", "typing"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen del dibujo y de las frases modelo"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: What do you do after school? What are you learning these days? Do you have a job? What are you doing right now? How do you go to school?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "What do you do after school?", modelo: "I do my homework." },
            { pregunta: "What are you learning these days?", modelo: "I'm learning English." },
            { pregunta: "Do you have a job?", modelo: "No, I'm a student." },
            { pregunta: "What are you doing right now?", modelo: "I'm talking to you!" },
            { pregunta: "How do you go to school?", modelo: "I go by bus." },
          ],
          aceptadas: ["Homework.", "English.", "No.", "By bus."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "Adivina el trabajo",
      objetivo: "Preguntar con Do you…? y Are you…? por el trabajo de alguien.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Ben\'s dad is a police officer. He works in the city. Right now he\'s driving to work." (no está escrito). Elige entre tres imágenes: un policía en una patrulla, un granjero con vacas y un piloto en un avión.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Ben's dad is a police officer.", "He works in the city.", "Right now he's driving to work."],
          traduccion: ["El papá de Ben es policía.", "Trabaja en la ciudad.", "Ahora mismo va manejando al trabajo."],
          pregunta: "¿Qué hace el papá de Ben?",
          opciones: [
            { imagen: "f-policia-patrulla", descripcion: "Un policía en una patrulla", etiqueta: "A police officer", etiquetaEs: "Un policía" },
            { imagen: "f-granjero-vacas", descripcion: "Una granjera con vacas", etiqueta: "A farmer", etiquetaEs: "Una granjera" },
            { imagen: "f-piloto-avion", descripcion: "Una piloto junto a un avión", etiqueta: "A pilot", etiquetaEs: "Una piloto" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: como suenan; la granjera y la piloto de los dibujos son mujeres (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca al policía"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de un chef en la cocina de un restaurante. Allison: "What does he do?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "He works in a restaurant." → "He cooks food." Sin pistas, Allison dice "He\'s a chef" y el alumno la repite. Si dice "He chef": Para decir el trabajo: he\'s a chef.',
          imagen: "f-chef-cocina",
          pregunta: "What does he do?",
          contexto: "¿En qué trabaja él? Responde con una frase en inglés.",
          respuesta: "He's a chef.",
          aceptadas: ["He is a chef.", "A chef.", "He's a cook.", "A cook."],
          pistas: ["He works in a restaurant.", "He cooks food."],
          explicaciones: [
            { siDice: "He chef", explicacion: "Para decir el trabajo: he's a chef." },
          ],
          porRevisar: ["explicaciones: la del documento (Si dice…), que no estaba en los datos (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 3,
          tipo: "adivina",
          queAparece:
            'Seis tarjetas con dibujo: chef, nurse, police officer, teacher, farmer y pilot. Allison: "I have a job. Ask me yes or no questions and guess!" Dos rondas (pilot y nurse, en orden al azar).',
          siRespondeMal:
            'Si no es de sí o no ("What do you do?"): Allison, "That\'s a secret! Ask me: Do you…?". Al segundo intento fallido se ilumina la ayuda con una pregunta de ejemplo. Si adivina mal: "No! Ask me more."',
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "You work outside?", "Uniform?", "Pilot?"',
          apertura: "I have a job. Ask me yes or no questions and guess!",
          opciones: [
            { nombre: "chef", imagen: "f-chef-cocina" },
            { nombre: "nurse", imagen: "f-enfermera-noche" },
            { nombre: "police officer", imagen: "f-policia-patrulla" },
            { nombre: "teacher", imagen: "a1/a-profesor" },
            { nombre: "farmer", imagen: "f-granjero-vacas" },
            { nombre: "pilot", imagen: "f-piloto-avion" },
          ],
          rondas: ["pilot", "nurse"],
          preguntas: [
            { pregunta: "Do you work in a hospital?", si: ["nurse"] },
            { pregunta: "Do you help sick people?", si: ["nurse"] },
            { pregunta: "Do you work outside?", si: ["police officer", "farmer"] },
            { pregunta: "Do you wear a uniform?", si: ["chef", "nurse", "police officer", "pilot"] },
            { pregunta: "Do you cook?", si: ["chef"] },
            { pregunta: "Do you work with animals?", si: ["farmer"] },
            { pregunta: "Do you work in a school?", si: ["teacher"] },
            { pregunta: "Do you travel a lot?", si: ["pilot"] },
            { pregunta: "Do you drive a car at work?", si: ["police officer"] },
          ],
          adivinar: "Are you a {x}?",
          secreto: "That's a secret! Ask me: Do you…?",
          aceptadas: ["You work outside?", "Uniform?", "Pilot?"],
        },
      ],
    },
  ],
  escenario: {
    titulo: "Tu primer día de práctica en Londres",
    imagen: "e-londres-oficina",
    contexto:
      "Empiezas una práctica de una semana en una oficina de diseño en Londres. Laura Bennett, la coordinadora (Allison en su papel), te recibe y te hace preguntas.",
    personaje: "Laura Bennett, la coordinadora de una oficina de diseño en Londres",
    objetivo: "Contar quién es, qué hace siempre y qué está aprendiendo estos días, y preguntar por el trabajo de Laura",
    tareas: [
      "Preséntate.",
      "Cuenta qué estudias y dónde.",
      "Cuenta qué haces en un día normal.",
      "Cuenta qué estás aprendiendo estos días.",
      "Pregúntale a Laura por su trabajo.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Good morning! Are you the new intern? I'm Laura, the office manager." },
      { quien: "alumno", dice: "Good morning! Yes, I'm Diego. Nice to meet you.", tarea: 1 },
      { quien: "personaje", dice: "Nice to meet you, Diego! Do you like London?" },
      { quien: "alumno", dice: "Yes, I love it! It's very big." },
      { quien: "personaje", dice: "Are you a college student?" },
      { quien: "alumno", dice: "No, I'm in high school. I study at a school in Bogotá.", tarea: 2 },
      { quien: "personaje", dice: "Great! What's your favorite subject?" },
      { quien: "alumno", dice: "My favorite subject is art. I love design." },
      { quien: "personaje", dice: "Perfect for a design office! What do you do on a normal school day?" },
      { quien: "alumno", dice: "I usually go to school at seven. After school I do my homework.", tarea: 3 },
      { quien: "personaje", dice: "And how do you go to school?" },
      { quien: "alumno", dice: "I take the bus. It's very slow!" },
      { quien: "personaje", dice: "The buses here are slow too! What are you learning these days?" },
      { quien: "alumno", dice: "These days I'm learning to use a design program.", tarea: 4 },
      { quien: "personaje", dice: "That's very useful! Do you have any questions for me?" },
      { quien: "alumno", dice: "Yes. What do you do every day?", tarea: 5 },
      { quien: "personaje", dice: "I plan the projects and I talk to clients. Right now I'm working on a website for a café." },
      { quien: "alumno", dice: "Cool! Can I help you with the website?" },
      { quien: "personaje", dice: "Of course! That's your first project. Welcome to the team, Diego!" },
      { quien: "alumno", dice: "Thank you, Laura!" },
    ],
    resumen: "¡Lo lograste! Contaste en inglés qué haces siempre y qué estás aprendiendo ahora.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Londres en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like London" → Me too! And what do you study?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "I usually ___"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"Estudio diseño" → En inglés: I study design. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"I am study art" → la escena sigue; en el resumen: Para lo de siempre: I study art.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "See you tomorrow, Diego! Vamos a repasar el presente simple y el continuo y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    // El documento da cuatro comienzos para cinco tareas; el de "Preséntate"
    // sale de la línea del alumno en el diálogo de ejemplo (por revisar).
    ayudas: ["Hi! I'm ___", "I study at ___", "I usually ___", "These days I'm learning ___", "What do you ___?"],
  },
  ilustraciones: [
    { archivos: ["londres"], muestra: "Portada de la ciudad: el Big Ben, un bus rojo y el río", uso: "Portada de la parada" },
    { archivos: ["e-londres-oficina"], muestra: "La recepción de una oficina de diseño con ventanas a la calle", uso: "Escenario" },
    {
      archivos: ["f-priya-biblioteca", "f-priya-cuarto", "f-priya-parque"],
      muestra: "Priya estudiando en una biblioteca, en su cuarto y en un parque",
      uso: "Lección 1 (paso 1)",
    },
    { archivos: ["f-ben-computador"], muestra: "Ben frente a su computador", uso: "Lección 1 (paso 2)" },
    {
      archivos: ["f-enfermera-noche", "f-chef-cocina"],
      muestra: "Una enfermera en un hospital de noche; un chef en la cocina de un restaurante",
      uso: "Lección 2 (paso 1), lección 4 (paso 2) y las tarjetas de Adivina",
    },
    { archivos: ["a1/a-profesor"], muestra: "La profesora Ms. Lee junto al tablero (de A1; desde el 30 de octubre de 2026, antes con un libro)", uso: "Adivina" },
    { archivos: ["a1/f-salon-clase"], muestra: "Una profesora frente al tablero de su salón (de A1; desde el 30 de octubre de 2026)", uso: "Lección 2 (paso 1)" },
    { archivos: ["f-bus-escolar"], muestra: "Un bus escolar", uso: "Lección 2 (paso 2)" },
    {
      archivos: ["f-priya-guitarra", "a1/f-nadar", "f-priya-cocinando"],
      muestra: "Priya en su clase de guitarra (nueva, 30 de octubre de 2026), nadar (de A1) y Priya cocinando",
      uso: "Lección 3 (paso 1)",
    },
    {
      archivos: ["f-oficina-londres"],
      muestra: "Una oficina: una mujer habla por teléfono, un hombre toma café y una muchacha escribe en un computador",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["f-policia-patrulla", "f-granjero-vacas", "f-piloto-avion"],
      muestra: "Un policía en una patrulla, un granjero con vacas y un piloto en un avión",
      uso: "Lección 4 (paso 1) y las tarjetas de Adivina",
    },
  ],
};
