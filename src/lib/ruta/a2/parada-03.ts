import type { Parada } from "../tipos.ts";

/**
 * Parada 3 · Liverpool (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026), que
 * pasan a la ficha de Allison:
 *   · Hermano de Priya: Arjun, 12 años; juega videojuegos en las noches.
 *   · Ms. Hughes: empleada de la oficina de objetos perdidos de la
 *     estación de Liverpool.
 *   · Mersey Hotel: el hotel (inventado) donde se queda el alumno en
 *     Liverpool.
 *   · Personas de Adivina: Mr. Green, Lily, Mrs. Bell, Tim, Mr. Stone y
 *     Anna: solo aparecen en el dibujo del parque.
 *   · Ben: vio un zorro camino al colegio (en el Reino Unido hay zorros en
 *     las ciudades).
 */
export const PARADA_03: Parada = {
  numero: 3,
  ciudad: "Liverpool",
  titulo: "Cuenta lo que estaba pasando",
  gramatica: "Pasado continuo con when y while",
  objetivo:
    'Al terminar, el alumno cuenta qué estaba pasando cuando algo ocurrió: "I was waiting for the bus when it started to rain." Gramática: pasado continuo con when y while. Usa A1 y las paradas 1 y 2; nada de presente perfecto, going to ni will.',
  fraseMeta: "I was waiting for the bus when it started to rain.",
  portada: "liverpool",
  vocabulario: [
    {
      grupo: "Lo que estaba pasando",
      ingles: "I was reading. You were sleeping. It was raining. They were playing.",
      nota: "Was con I, he, she, it; were con you, we, they",
    },
    {
      grupo: "When y while",
      ingles: "I was waiting for the bus when it started to rain. While I was cooking, my brother was studying.",
      nota: "Lo largo va con -ing; lo que interrumpe va en pasado simple",
    },
    {
      grupo: "Preguntas",
      ingles: "What were you doing? Were you sleeping? Yes, I was. No, I wasn't.",
      nota: '"What were you doing at eight?" para una hora exacta',
    },
    {
      grupo: "Viaje y estación",
      ingles: "station, train, platform, suitcase, lost and found, ticket",
      nota: '"Suitcase" y "lost and found", de Estados Unidos (no "lost property")',
    },
    {
      grupo: "Describir una maleta",
      ingles: "big, small, blue, black, with wheels, with a red ribbon",
      nota: "Colores y tamaños de A1",
    },
    {
      grupo: "Frases",
      ingles: "I lost my suitcase. I was buying a coffee when I left it. It's big and blue.",
      nota: "",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "Lo que estaba pasando",
      objetivo: "Entender y decir qué estaba haciendo alguien a una hora del pasado.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "At eight o\'clock last night, Priya was reading in her room. Her little brother was playing video games." (no está escrito). Elige entre tres imágenes: Priya leyendo y su hermano jugando, Priya cocinando y Priya dormida.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["At eight o'clock last night, Priya was reading in her room.", "Her little brother was playing video games."],
          traduccion: ["Anoche a las ocho, Priya estaba leyendo en su cuarto.", "Su hermanito estaba jugando videojuegos."],
          pregunta: "¿Qué estaba haciendo Priya anoche a las ocho?",
          opciones: [
            { imagen: "f-priya-leyendo-hermano", descripcion: "Priya leyendo y su hermano jugando", etiqueta: "Leer" },
            { imagen: "f-priya-cocinando", descripcion: "Priya cocinando", etiqueta: "Cocinar" },
            { imagen: "f-priya-dormida", descripcion: "Priya dormida", etiqueta: "Dormir" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Priya leyendo"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de un hombre en una parada de bus bajo la lluvia; un reloj marca las 7:00. Allison: "What was he doing at seven?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "He was at the bus stop." → "It starts with w." Sin pistas, Allison dice "He was waiting for the bus" y el alumno la repite. Si dice "He waited": Lo que estaba pasando va con was y -ing: he was waiting.',
          imagen: "f-parada-lluvia",
          pregunta: "What was he doing at seven?",
          contexto: "¿Qué estaba haciendo él a las siete? Responde con una frase en inglés.",
          respuesta: "He was waiting for the bus.",
          aceptadas: ["He was waiting.", "Waiting for the bus."],
          pistas: ["He was at the bus stop.", "It starts with w."],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "We were walking in the rain." Se practica la palabra were.',
          siRespondeMal:
            'Si dice "we-re": Escucha: were. Es una sola sílaba, con la r al final: "wer". Say it: were. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "We were walking in the rain.",
          palabraDificil: "were",
          consejo: 'Es una sola sílaba, con la r al final: "wer".',
        },
      ],
    },
    {
      numero: 2,
      titulo: "Cuando y mientras",
      objetivo: "Unir lo que estaba pasando con lo que lo interrumpió, con when y while.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Ben was walking to school when he saw a fox!" (no está escrito). Elige entre tres animales: un zorro, un perro y un gato.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Ben was walking to school when he saw a fox!"],
          traduccion: ["¡Ben estaba caminando al colegio cuando vio un zorro!"],
          pregunta: "¿Qué animal vio Ben?",
          opciones: [
            { imagen: "f-zorro", descripcion: "Un zorro", etiqueta: "Zorro" },
            { imagen: "a1/f-perro", descripcion: "Un perro", etiqueta: "Perro" },
            { imagen: "a1/f-gato-debajo", descripcion: "Un gato", etiqueta: "Gato" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca el zorro"'],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Estaba cocinando cuando sonó el teléfono." Dibujo de una cocina con un teléfono que suena. Las palabras de apoyo aparecen después del primer fallo: I, was, cooking, when, the, phone, rang.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "I cooked when": Lo que estaba pasando va con was y -ing: I was cooking. Si dice "ringed": Ring es irregular: rang. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Estaba cocinando cuando sonó el teléfono.",
          imagen: "f-cocina-telefono",
          respuesta: "I was cooking when the phone rang.",
          aceptadas: ["I was cooking when my phone rang."],
          palabras: ["I", "was", "cooking", "when", "the", "phone", "rang."],
          explicaciones: [
            { siDice: "I cooked when", explicacion: "Lo que estaba pasando va con was y -ing: I was cooking." },
            { siDice: "ringed", explicacion: "Ring es irregular: rang." },
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about a funny moment." Preguntas guía: Where were you? What were you doing? What happened?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I was eat" → Mejor: I was eating. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta:
            "Cualquier relato de 20 segundos o más, en inglés y en pasado, con 3 frases o más que se entienden",
          tema: "Tell me about a funny moment.",
          guias: ["Where were you?", "What were you doing?", "What happened?"],
          modelo:
            "Last week I was eating lunch at school. My friend was telling a story. Suddenly my juice fell on the table and everybody laughed!",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "¿Qué estabas haciendo?",
      objetivo: "Preguntar y responder qué estaba haciendo alguien.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya asks: "What were you doing at nine on Saturday morning?" Ben says: "I was sleeping! It was the weekend." (no está escrito). Elige entre tres imágenes de Ben: durmiendo, corriendo y desayunando.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya asks: "What were you doing at nine on Saturday morning?"', 'Ben says: "I was sleeping! It was the weekend."'],
          traduccion: ['Priya pregunta: "¿Qué estabas haciendo el sábado a las nueve de la mañana?"', 'Ben dice: "¡Estaba durmiendo! Era el fin de semana."'],
          pregunta: "¿Qué estaba haciendo Ben el sábado a las nueve?",
          opciones: [
            { imagen: "f-ben-durmiendo", descripcion: "Ben durmiendo", etiqueta: "Dormir" },
            { imagen: "f-ben-corriendo", descripcion: "Ben corriendo", etiqueta: "Correr" },
            { imagen: "f-ben-desayunando", descripcion: "Ben desayunando", etiqueta: "Desayunar" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Ben durmiendo"'],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'Dibujo de un andén cuando llega el tren: una mujer lee un libro, un hombre se come un sándwich y dos niños juegan. Allison: "Tell me 3 things people were doing when the train arrived." Debajo: "She was ___ing." / "They were ___ing." y reading a book, eating a sandwich, playing.',
          siRespondeMal:
            'Si dice "They was playing", Allison repite bien la frase (They were playing.) y el alumno la dice. Si nombra menos de 3, Allison señala el sándwich y pregunta "What was he doing?".',
          imagen: "f-anden-tren",
          pregunta: "Tell me 3 things people were doing when the train arrived.",
          plantillas: ["She was ___ing.", "They were ___ing."],
          palabrasAyuda: ["reading a book", "eating a sandwich", "playing"],
          modelo: ["She was reading a book.", "He was eating a sandwich.", "They were playing."],
          aceptadas: ["The woman was reading.", "The man was eating.", "The kids were playing."],
          cosas: ["book", "sandwich", "reading", "eating", "playing"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen del dibujo y de las frases modelo"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: What were you doing at seven this morning? What were you doing last night at nine? Were you sleeping at midnight? What was your family doing last night? Was it raining yesterday?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: "Respuestas cortas que responden bien; Allison sugiere la frase completa",
          preguntas: [
            { pregunta: "What were you doing at seven this morning?", modelo: "I was having breakfast." },
            { pregunta: "What were you doing last night at nine?", modelo: "I was watching TV." },
            { pregunta: "Were you sleeping at midnight?", modelo: "Yes, I was." },
            { pregunta: "What was your family doing last night?", modelo: "My mom was cooking and my dad was reading." },
            { pregunta: "Was it raining yesterday?", modelo: "No, it wasn't." },
          ],
          aceptadas: ["Having breakfast.", "Yes, I was.", "No."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "¿Quién era?",
      objetivo: "Preguntar con Were you…? y responder con was y were.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Yesterday at five I was walking in the park. A man was running and a girl was riding a bike." (no está escrito). Elige entre tres dibujos de un parque: uno con un hombre corriendo y una niña en bicicleta, uno con niños jugando fútbol y uno con una familia en un picnic.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Yesterday at five I was walking in the park.", "A man was running and a girl was riding a bike."],
          traduccion: [
            "Ayer a las cinco estaba caminando en el parque.",
            "Un hombre estaba corriendo y una niña estaba montando en bicicleta.",
          ],
          pregunta: "¿Qué vio Allison en el parque?",
          opciones: [
            { imagen: "f-parque-corredor-bici", descripcion: "Un parque con un hombre corriendo y una niña en bicicleta", etiqueta: "Correr y bicicleta" },
            { imagen: "f-parque-futbol", descripcion: "Un parque con niños jugando fútbol", etiqueta: "Fútbol" },
            { imagen: "f-parque-picnic", descripcion: "Un parque con una familia en un picnic", etiqueta: "Picnic" },
          ],
          correcta: 0,
          porRevisar: [
            "traduccion",
            'pregunta: el documento no la escribe; sale de "Toca el parque con el hombre corriendo y la niña en bicicleta"',
          ],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de una mujer que pasea a su perro bajo la lluvia. Allison: "What was she doing?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "She has an animal." → "It starts with w." Sin pistas, Allison dice "She was walking her dog" y el alumno la repite. Si dice "She walked": Lo que estaba haciendo va con was y -ing: she was walking.',
          imagen: "f-mujer-perro-lluvia",
          pregunta: "What was she doing?",
          contexto: "¿Qué estaba haciendo ella? Responde con una frase en inglés.",
          respuesta: "She was walking her dog.",
          aceptadas: ["She was walking a dog.", "Walking the dog."],
          pistas: ["She has an animal.", "It starts with w."],
        },
        {
          paso: 3,
          tipo: "adivina",
          queAparece:
            'Un dibujo del parque ayer a las cinco, con seis personas y sus nombres: Mr. Green, Lily, Mrs. Bell, Tim, Mr. Stone y Anna. Allison: "I was in the park yesterday at five. Who was I? Ask me yes or no questions!" Dos rondas (Lily y Mrs. Bell, en orden al azar).',
          siRespondeMal:
            'Si no es de sí o no ("What were you doing?"): Allison, "That\'s a secret! Ask me: Were you…?". Al segundo intento fallido se ilumina la ayuda con una pregunta de ejemplo. Si adivina mal: "No! Ask me more."',
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "You were sitting?", "A hat?", "Lily?"',
          apertura: "I was in the park yesterday at five. Who was I? Ask me yes or no questions!",
          // Una sola ilustración: cada tarjeta muestra ampliada la zona de su persona.
          opciones: [
            { nombre: "Mr. Green", imagen: "f-parque-adivina", zona: { x: 22, y: 29 } }, // leía el periódico en una banca
            { nombre: "Lily", imagen: "f-parque-adivina", zona: { x: 50, y: 29 } }, // montaba en bicicleta
            { nombre: "Mrs. Bell", imagen: "f-parque-adivina", zona: { x: 78, y: 32 } }, // paseaba a su perro
            { nombre: "Tim", imagen: "f-parque-adivina", zona: { x: 20, y: 75 } }, // comía helado en una banca
            { nombre: "Mr. Stone", imagen: "f-parque-adivina", zona: { x: 52, y: 72 } }, // corría
            { nombre: "Anna", imagen: "f-parque-adivina", zona: { x: 82, y: 74 } }, // tomaba fotos
          ],
          // Allison solo hace papeles de mujer (una sola voz): la segunda ronda era Mr. Green.
          rondas: ["Lily", "Mrs. Bell"],
          // Respuestas del documento: "Yes, I was." / "No, I wasn't." para
          // Were you…?, y "Yes, I am." / "No, I'm not." para Are you…? Una
          // pregunta que no está en la tabla recibe "Hmm, I can't answer that
          // one. Ask me another question!"
          preguntas: [
            { pregunta: "Are you a man?", si: ["Mr. Green", "Mr. Stone"] },
            { pregunta: "Are you a woman?", si: ["Mrs. Bell"] },
            { pregunta: "Are you a boy?", si: ["Tim"] },
            { pregunta: "Are you a girl?", si: ["Lily", "Anna"] },
            { pregunta: "Were you sitting?", si: ["Mr. Green", "Tim"] },
            { pregunta: "Were you reading?", si: ["Mr. Green"] },
            { pregunta: "Were you eating?", si: ["Tim"] },
            { pregunta: "Were you running?", si: ["Mr. Stone"] },
            { pregunta: "Were you riding a bike?", si: ["Lily"] },
            { pregunta: "Were you walking a dog?", si: ["Mrs. Bell"] },
            { pregunta: "Were you taking photos?", si: ["Anna"] },
            { pregunta: "Were you wearing a hat?", si: ["Mr. Green", "Mrs. Bell", "Anna"] },
          ],
          adivinar: "Are you {x}?",
          secreto: "That's a secret! Ask me: Were you…?",
          aceptadas: ["You were sitting?", "A hat?", "Lily?"],
          porRevisar: [
            "opciones: las seis tarjetas usan f-parque-adivina y cada una muestra ampliada a su persona (puntos puestos el 18 de octubre de 2026 sobre la ilustración aprobada)",
            "rondas: Mrs. Bell en lugar de Mr. Green, porque Allison solo hace papeles de mujer (18 de octubre de 2026; también cambiado en el documento)",
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "Perdiste tu maleta en la estación de Liverpool",
    imagen: "e-liverpool-estacion",
    contexto:
      "Llegaste en tren a Liverpool y no tienes tu maleta. En la oficina de objetos perdidos, la empleada, Ms. Hughes (Allison en su papel), te hace preguntas.",
    personaje: "Ms. Hughes, la empleada de la oficina de objetos perdidos de la estación de Liverpool",
    objetivo: "Explicar qué pasó, qué estaba haciendo cuando perdió la maleta y cómo es",
    tareas: [
      "Explica que perdiste tu maleta.",
      "Cuenta qué estabas haciendo cuando la perdiste.",
      "Describe tu maleta.",
      "Di tu nombre y dónde te quedas.",
      "Da las gracias.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hello! Can I help you?" },
      { quien: "alumno", dice: "Hello. Yes, please. I lost my suitcase.", tarea: 1 },
      { quien: "personaje", dice: "Oh no! When did you lose it?" },
      { quien: "alumno", dice: "This morning, here at the station." },
      { quien: "personaje", dice: "What were you doing when you lost it?" },
      { quien: "alumno", dice: "I was buying a coffee. I left it next to the café.", tarea: 2 },
      { quien: "personaje", dice: "I see. Which train were you on?" },
      { quien: "alumno", dice: "The train from Manchester. It arrived at ten." },
      { quien: "personaje", dice: "OK. What does your suitcase look like?" },
      { quien: "alumno", dice: "It's big and blue. It has a red ribbon.", tarea: 3 },
      { quien: "personaje", dice: "Was there anything inside?" },
      { quien: "alumno", dice: "Yes, my clothes and my books." },
      { quien: "personaje", dice: "Let me look. Is this your suitcase? It's blue, but it's small." },
      { quien: "alumno", dice: "No, it isn't. My suitcase is very big." },
      { quien: "personaje", dice: "OK. What's your name, and where are you staying?" },
      { quien: "alumno", dice: "My name is Diego Rojas. I'm staying at the Mersey Hotel.", tarea: 4 },
      { quien: "personaje", dice: "Thank you, Diego. I have your information. Please come back this afternoon." },
      { quien: "alumno", dice: "OK. What time can I come back?" },
      { quien: "personaje", dice: "At four o'clock." },
      { quien: "alumno", dice: "Great. Thank you very much!", tarea: 5 },
    ],
    resumen: "¡Lo lograste! Contaste en inglés qué estaba pasando cuando perdiste tu maleta.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Liverpool en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like trains" → OK! But what were you doing at the station?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "I was ___ing when ___"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"Perdí mi maleta" → En inglés: I lost my suitcase. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"I was buy a coffee" → la escena sigue; en el resumen: Lo que estaba pasando: I was buying a coffee.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "Please come back later! Vamos a repasar el pasado continuo y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    // El documento da cuatro comienzos para cinco tareas; el de "Da las
    // gracias" sale de la línea del alumno en el diálogo de ejemplo
    // ("Great. Thank you very much!"), sin el "Great." (por revisar).
    ayudas: ["I lost ___", "I was ___ing when ___", "It's ___ and ___", "I'm staying at ___", "Thank you ___"],
  },
  ilustraciones: [
    { archivos: ["liverpool"], muestra: "Portada de la ciudad: el puerto, los edificios del muelle y el río", uso: "Portada de la parada" },
    {
      archivos: ["e-liverpool-estacion"],
      muestra: "La ventanilla de objetos perdidos de la estación, con maletas en estantes",
      uso: "Escenario",
    },
    {
      archivos: ["f-priya-leyendo-hermano", "f-priya-cocinando", "f-priya-dormida"],
      muestra: "Priya leyendo mientras su hermano juega videojuegos; Priya cocinando; Priya dormida",
      uso: "Lección 1 (paso 1)",
    },
    {
      archivos: ["f-parada-lluvia"],
      muestra: "Un hombre en una parada de bus bajo la lluvia, con un reloj a las 7:00",
      uso: "Lección 1 (paso 2)",
    },
    { archivos: ["f-zorro", "a1/f-perro", "a1/f-gato-debajo"], muestra: "Un zorro, un perro y un gato", uso: "Lección 2 (paso 1)" },
    {
      archivos: ["f-cocina-telefono"],
      muestra: "Una cocina con una olla en el fogón y un teléfono que suena",
      uso: "Lección 2 (paso 2)",
    },
    {
      archivos: ["f-ben-durmiendo", "f-ben-corriendo", "f-ben-desayunando"],
      muestra: "Ben durmiendo, corriendo y desayunando",
      uso: "Lección 3 (paso 1)",
    },
    {
      archivos: ["f-anden-tren"],
      muestra: "Un andén cuando llega el tren: una mujer lee, un hombre come un sándwich y dos niños juegan",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["f-parque-corredor-bici", "f-parque-futbol", "f-parque-picnic"],
      muestra: "Tres parques: un hombre corre y una niña monta en bicicleta; niños juegan fútbol; una familia en un picnic",
      uso: "Lección 4 (paso 1)",
    },
    { archivos: ["f-mujer-perro-lluvia"], muestra: "Una mujer pasea a su perro bajo la lluvia", uso: "Lección 4 (paso 2)" },
    {
      archivos: ["f-parque-adivina"],
      muestra: "El parque a las cinco con las seis personas de Adivina y sus nombres; la app recorta cada una para su tarjeta",
      uso: "Lección 4 (paso 3)",
    },
  ],
};
