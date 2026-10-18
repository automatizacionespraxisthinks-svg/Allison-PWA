import type { Parada } from "../tipos.ts";

/**
 * Parada 2 · Manchester (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026), que
 * pasan a la ficha de Allison:
 *   · El fin de semana de Allison: el sábado pasado visitó a su hermana
 *     Emily y hicieron arepas; ese día se levantó a las 8. El domingo
 *     caminó en el parque, que estaba soleado, y en la noche vio una
 *     película divertida. Sin contradecir la rutina (de lunes a viernes se
 *     levanta a las 6:30).
 *   · Sam: 16 años, compañera en el colegio de Manchester. Juega fútbol;
 *     su equipo ganó el sábado.
 *   · Ben y su papá: el sábado fueron al estadio y comieron hot dogs. Ben
 *     tuvo un examen y no fue a la fiesta.
 */
export const PARADA_02: Parada = {
  numero: 2,
  ciudad: "Manchester",
  titulo: "Cuenta tu fin de semana",
  gramatica: "Pasado simple",
  objetivo:
    'Al terminar, el alumno cuenta qué hizo: "Last Saturday I visited my aunt and we cooked." Gramática: pasado simple (verbos regulares e irregulares comunes, did y didn\'t). Usa todo A1 y la parada 1; nada de pasado continuo, presente perfecto, going to ni will.',
  fraseMeta: "Last Saturday I visited my aunt and we cooked.",
  portada: "manchester",
  vocabulario: [
    {
      grupo: "Verbos regulares",
      ingles: "visited, cooked, played, watched, walked, stayed, studied, called",
      nota: 'La -ed suena de tres formas: "watched" (t), "played" (d) y "visited" (id)',
    },
    {
      grupo: "Verbos irregulares",
      ingles: "went, had, ate, saw, did, made, got up, bought",
      nota: "Solo estos ocho en la parada; los demás se aceptan si el alumno los dice",
    },
    {
      grupo: "Cuándo",
      ingles: "yesterday, last night, last weekend, last Saturday, on Sunday",
      nota: '"Last weekend", nunca "the last weekend"',
    },
    {
      grupo: "Preguntas y negación",
      ingles: "What did you do? Did you…? Yes, I did. No, I didn't.",
      nota: 'Después de did el verbo va normal: "Did you go?", nunca "Did you went?"',
    },
    {
      grupo: "Ser y estar",
      ingles: "was, were: It was great. They were tired.",
      nota: "Solo para describir; el pasado continuo llega en la parada 3",
    },
    {
      grupo: "Frases",
      ingles: "How was your weekend? It was great! I went downtown. I visited my aunt and we cooked.",
      nota: '"Downtown" de Estados Unidos, no "the city centre"',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Lo que hiciste ayer",
      objetivo: "Reconocer y decir verbos regulares en pasado.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Yesterday Priya stayed home. She watched a movie and she cooked pasta." (no está escrito). Elige entre tres imágenes de Priya: en el sofá con un plato de pasta frente a la TV, en un estadio y en un museo. La traducción queda a un toque.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Yesterday Priya stayed home.", "She watched a movie and she cooked pasta."],
          traduccion: ["Ayer Priya se quedó en casa.", "Vio una película y cocinó pasta."],
          pregunta: "¿Qué hizo Priya ayer?",
          opciones: [
            { imagen: "f-priya-sofa-pasta", descripcion: "Priya en el sofá con un plato de pasta frente a la TV" },
            { imagen: "f-priya-estadio", descripcion: "Priya en un estadio" },
            { imagen: "f-priya-museo", descripcion: "Priya en un museo" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Priya en el sofá"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de Ben con un balón en el parque y un calendario que dice "Yesterday". Allison: "What did Ben do yesterday?" Debajo: "He ___ soccer."',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "He has a ball." → "It ends with -ed." Sin pistas, Allison dice "He played soccer" y el alumno la repite. Si dice "He play": Ya pasó: played.',
          imagen: "f-ben-balon-ayer",
          pregunta: "What did Ben do yesterday?",
          respuesta: "He played soccer.",
          aceptadas: ["He played soccer yesterday.", "Played soccer."],
          pistas: ["He has a ball.", "It ends with -ed."],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "Last night I watched a movie." Se practica la palabra watched.',
          siRespondeMal:
            'Si dice "wat-ched": Escucha: watched. Es una sola sílaba y la -ed suena t: "wacht". Say it: watched. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "Last night I watched a movie.",
          palabraDificil: "watched",
          consejo: 'Es una sola sílaba y la -ed suena t: "wacht".',
        },
      ],
    },
    {
      numero: 2,
      titulo: "Fui, comí, vi",
      objetivo: "Contar con los verbos irregulares más comunes.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "On Saturday Ben went to the stadium with his dad. They saw a great game and they ate hot dogs." (no está escrito). Elige entre tres imágenes: un estadio con hot dogs, un cine y una playa.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["On Saturday Ben went to the stadium with his dad.", "They saw a great game and they ate hot dogs."],
          traduccion: ["El sábado Ben fue al estadio con su papá.", "Vieron un gran partido y comieron perros calientes."],
          pregunta: "¿Adónde fue Ben el sábado?",
          opciones: [
            { imagen: "f-estadio-hotdogs", descripcion: "Un estadio con hot dogs" },
            { imagen: "f-cine", descripcion: "Un cine" },
            { imagen: "a1/f-playa-la", descripcion: "Una playa" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca el estadio"'],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "El domingo fui al parque y comí helado." Dibujo de un helado. Las palabras de apoyo aparecen después del primer fallo: On, Sunday, I, went, to, the, park, and, ate, ice, cream.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "goed": Go es irregular: went. Si dice "eated": Eat es irregular: ate. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "El domingo fui al parque y comí helado.",
          imagen: "a1/f-helado",
          respuesta: "On Sunday I went to the park and I ate ice cream.",
          aceptadas: ["On Sunday I went to the park and ate ice cream.", "I went to the park on Sunday and I ate ice cream."],
          palabras: ["On", "Sunday", "I", "went", "to", "the", "park", "and", "I", "ate", "ice", "cream."],
          explicaciones: [
            { siDice: "goed", explicacion: "Go es irregular: went." },
            { siDice: "eated", explicacion: "Eat es irregular: ate." },
          ],
          porRevisar: ['palabras: el documento trae "I" una sola vez; la respuesta la usa dos veces'],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about your last weekend." Preguntas guía: Where did you go? What did you eat? What did you do on Sunday?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I go to the park" → Ya pasó: I went to the park. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés y en pasado, con 3 frases o más que se entienden",
          tema: "Tell me about your last weekend.",
          guias: ["Where did you go?", "What did you eat?", "What did you do on Sunday?"],
          modelo:
            "Last Saturday I went to my grandma's house. We ate ajiaco. On Sunday I played soccer with my friends and I watched TV.",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Preguntas con did",
      objetivo: "Preguntar y responder con did y didn't.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya asks: "Did you go to the party, Ben?" Ben says: "No, I didn\'t. I studied for my test." (no está escrito). Elige entre tres imágenes de Ben: estudiando en su escritorio, bailando en una fiesta y durmiendo.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya asks: "Did you go to the party, Ben?"', 'Ben says: "No, I didn\'t. I studied for my test."'],
          traduccion: ['Priya pregunta: "¿Fuiste a la fiesta, Ben?"', 'Ben dice: "No, no fui. Estudié para mi examen."'],
          pregunta: "¿Qué hizo Ben?",
          opciones: [
            { imagen: "f-ben-estudiando", descripcion: "Ben estudiando en su escritorio" },
            { imagen: "a1/a-fiesta", descripcion: "Una fiesta" },
            { imagen: "f-ben-durmiendo", descripcion: "Ben durmiendo" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'pregunta: el documento no la escribe; sale de "Toca a Ben estudiando"',
            'opciones: el documento dice "Ben bailando en una fiesta"; el dibujo de la tabla es una fiesta (a-fiesta, de A1)',
          ],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Tres fotos del sábado de la familia de Ben: la mamá cocina el desayuno, el papá lava el carro y Ben juega videojuegos. Allison: "Tell me 3 things they did on Saturday." Debajo: "She ___ed." / "He ___ed." y cooked breakfast, washed the car, played video games.',
          siRespondeMal:
            'Si dice "He wash the car", Allison repite bien la frase (He washed the car.) y el alumno la dice. Si nombra menos de 3, Allison señala el carro y pregunta "What did he do?".',
          imagen: "f-sabado-familia-ben",
          pregunta: "Tell me 3 things they did on Saturday.",
          plantillas: ["She ___ed.", "He ___ed."],
          palabrasAyuda: ["cooked breakfast", "washed the car", "played video games"],
          modelo: ["She cooked breakfast.", "He washed the car.", "He played video games."],
          aceptadas: ["His mom cooked breakfast.", "The dad washed the car.", "Ben played video games."],
          cosas: ["breakfast", "car", "video game", "cooked", "washed", "played"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen del dibujo y de las frases modelo"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: What did you do yesterday? Did you watch TV last night? What did you eat for breakfast? Where did you go last weekend? What time did you get up today?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien: "Eggs." "Yes, I did." "At six." Allison sugiere la frase completa',
          preguntas: [
            { pregunta: "What did you do yesterday?", modelo: "I studied and I played soccer." },
            { pregunta: "Did you watch TV last night?", modelo: "Yes, I did." },
            { pregunta: "What did you eat for breakfast?", modelo: "I ate eggs and an arepa." },
            { pregunta: "Where did you go last weekend?", modelo: "I went to my grandma's house." },
            { pregunta: "What time did you get up today?", modelo: "I got up at six." },
          ],
          aceptadas: ["Eggs.", "Yes, I did.", "At six."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "El fin de semana de Allison",
      objetivo: "Hacer preguntas en pasado con did.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Last Saturday I visited my sister Emily. We cooked arepas!" (no está escrito). Elige entre tres comidas: arepas, pizza y sushi.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Last Saturday I visited my sister Emily.", "We cooked arepas!"],
          traduccion: ["El sábado pasado visité a mi hermana Emily.", "¡Cocinamos arepas!"],
          pregunta: "¿Qué cocinaron Allison y Emily?",
          opciones: [
            { imagen: "f-arepas", descripcion: "Arepas" },
            { imagen: "a1/f-pizza", descripcion: "Pizza" },
            { imagen: "f-sushi", descripcion: "Sushi" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca las arepas"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de un parque soleado. Allison: "This is my Sunday. What did I do?" Debajo: "You ___ in the park."',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "It was sunny. There are trees." → "It starts with w." Sin pistas, Allison dice "You walked in the park" y el alumno la repite. Si dice "You walk": Ya pasó: you walked.',
          imagen: "a1/f-mujer-parque",
          pregunta: "This is my Sunday. What did I do?",
          respuesta: "You walked in the park.",
          aceptadas: ["You went to the park.", "She walked in the park.", "Walked in the park."],
          pistas: ["It was sunny. There are trees.", "It starts with w."],
          porRevisar: ["imagen: f-mujer-parque es de A1 y la tabla de ilustraciones la deja por confirmar"],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha del fin de semana de Allison con cinco datos por descubrir: qué hizo el sábado, qué comieron, qué hizo el domingo, si vio una película y a qué hora se levantó el sábado. Arma cada pregunta; las palabras de ayuda aparecen después del primer fallo. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿A qué hora me levanté? Say: What time did you get up? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "el fin de semana de Allison",
          datos: [
            { dato: "Qué hizo el sábado", pregunta: "What did you do on Saturday?", respuesta: "I visited my sister Emily." },
            { dato: "Qué comieron", pregunta: "What did you eat?", respuesta: "We made arepas! They were delicious." },
            { dato: "Qué hizo el domingo", pregunta: "What did you do on Sunday?", respuesta: "I walked in the park. It was sunny!" },
            { dato: "Si vio una película", pregunta: "Did you watch a movie?", respuesta: "Yes, I watched a funny movie on Sunday night." },
            {
              dato: "A qué hora se levantó el sábado",
              pregunta: "What time did you get up on Saturday?",
              respuesta: "I got up at eight. On weekdays I get up at six thirty!",
            },
          ],
          aceptadas: ["You visited your sister?", "What you eat?", "A movie?"],
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "You visited your sister?", "What you eat?", "A movie?"',
          ayuda: "¿Qué quieres saber? ¿A qué hora me levanté? Say: What time did you get up?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Lunes en el colegio de Manchester",
    imagen: "e-manchester-colegio",
    contexto:
      "Estás de intercambio en un colegio de Manchester. Es lunes y Sam, tu compañera (Allison en su papel), te pregunta por tu fin de semana.",
    personaje: "Sam, tu compañera en un colegio de Manchester",
    objetivo: "Contar qué hizo el fin de semana y preguntarle a Sam por el suyo",
    tareas: [
      "Saluda a Sam.",
      "Cuenta adónde fuiste el fin de semana.",
      "Cuenta qué hiciste allá.",
      "Pregúntale a Sam por su fin de semana.",
      "Despídete.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hey, good morning! How are you?" },
      { quien: "alumno", dice: "Hi, Sam! I'm good, thanks. And you?", tarea: 1 },
      { quien: "personaje", dice: "I'm OK, but I'm a little tired! How was your weekend?" },
      { quien: "alumno", dice: "It was great! I went downtown on Saturday.", tarea: 2 },
      { quien: "personaje", dice: "Cool! What did you do there?" },
      { quien: "alumno", dice: "I visited a museum and I bought a T-shirt.", tarea: 3 },
      { quien: "personaje", dice: "Nice! Did you eat anything good?" },
      { quien: "alumno", dice: "Yes! I ate fish and chips. It was delicious." },
      { quien: "personaje", dice: "Ha! Very British! And on Sunday?" },
      { quien: "alumno", dice: "On Sunday I stayed home. I watched movies and I called my family." },
      { quien: "personaje", dice: "That sounds nice. What movie did you watch?" },
      { quien: "alumno", dice: "I watched a funny movie about a dog." },
      { quien: "personaje", dice: "I love movies about dogs!" },
      { quien: "alumno", dice: "What did you do this weekend?", tarea: 4 },
      { quien: "personaje", dice: "I played soccer on Saturday. My team won!" },
      { quien: "alumno", dice: "Congratulations! Did you score a goal?" },
      { quien: "personaje", dice: "No, I didn't. But I ran a lot! That's why I'm tired." },
      { quien: "alumno", dice: "Ha! Are you tired today?" },
      { quien: "personaje", dice: "Very tired! Oh, there's the bell. Class starts now." },
      { quien: "alumno", dice: "OK. See you in class, Sam!", tarea: 5 },
    ],
    resumen: "¡Lo lograste! Contaste tu fin de semana en inglés.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Manchester en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like Manchester" → Me too! Where did you go on Saturday?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "I went to ___"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"Fui al centro" → En inglés: I went downtown. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"I go to a museum" → la escena sigue; en el resumen: Ya pasó: I went to a museum.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "See you in class! Vamos a repasar el pasado simple y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    // El documento da cuatro comienzos para cinco tareas; el de "Saluda a
    // Sam" sale de la línea del alumno en el diálogo de ejemplo (por revisar).
    ayudas: ["Hi, Sam! I'm ___", "I went to ___", "I ___ed…", "What did you ___?", "See you ___"],
  },
  ilustraciones: [
    {
      archivos: ["manchester"],
      muestra: "Portada de la ciudad: edificios de ladrillo rojo, el tranvía amarillo y un estadio al fondo",
      uso: "Portada de la parada",
    },
    { archivos: ["e-manchester-colegio"], muestra: "El pasillo de un colegio con casilleros", uso: "Escenario" },
    {
      archivos: ["f-priya-sofa-pasta", "f-priya-estadio", "f-priya-museo"],
      muestra: "Priya en el sofá con pasta frente a la TV, en un estadio y en un museo",
      uso: "Lección 1 (paso 1)",
    },
    {
      archivos: ["f-ben-balon-ayer"],
      muestra: 'Ben con un balón en el parque y un calendario que dice "Yesterday"',
      uso: "Lección 1 (paso 2)",
    },
    {
      archivos: ["f-estadio-hotdogs", "f-cine", "a1/f-playa-la"],
      muestra: "Un estadio con hot dogs, un cine y una playa (la playa, de A1)",
      uso: "Lección 2 (paso 1)",
    },
    { archivos: ["a1/f-helado"], muestra: "Un helado (de A1)", uso: "Lección 2 (paso 2)" },
    {
      archivos: ["f-ben-estudiando", "f-ben-durmiendo", "a1/a-fiesta"],
      muestra: "Ben estudiando, Ben durmiendo y una fiesta (la fiesta, de A1)",
      uso: "Lección 3 (paso 1)",
    },
    {
      archivos: ["f-sabado-familia-ben"],
      muestra: "Tres fotos: la mamá cocina el desayuno, el papá lava el carro y Ben juega videojuegos",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["f-arepas", "f-sushi", "a1/f-pizza"],
      muestra: "Arepas, sushi y pizza (la pizza, de A1)",
      uso: "Lección 4 (paso 1)",
    },
    { archivos: ["a1/f-mujer-parque"], muestra: "Un parque soleado (de A1, por confirmar)", uso: "Lección 4 (paso 2)" },
  ],
};
