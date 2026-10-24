import type { Viaje } from "./tipos.ts";

/**
 * Viajes: las 10 fichas culturales. Documento "Contenido A1", pestaña Viajes,
 * aprobadas el 15 de octubre de 2026. Texto tal cual del documento, salvo:
 *   · "Desde A1" sale del lugar y pasa a `nivelMinimo`;
 *   · se quitan las notas de estado "(ya aprobada/s)" de tareas y estampilla;
 *   · cada puente conserva las comillas de la pregunta y su nota en español;
 *   · Brasil (la ficha muestra, escrita en párrafos) se pasa a los mismos campos;
 *   · 24 de octubre de 2026: de 3 a 6 tareas, para que el alumno hable más. Las 3
 *     del documento siguen tal cual; las agregadas solo usan los datos de la ficha
 *     y están en porRevisar, para la docente.
 * Cada viaje dura mínimo 10 intervenciones (introducción de la pestaña).
 */
export const VIAJES: Viaje[] = [
  {
    numero: 1,
    pais: "México",
    lugar: "Chichén Itzá, en la península de Yucatán, México",
    nivelMinimo: "A1",
    papel: "Tu guía en Chichén Itzá",
    inicio: "Welcome to Mexico! Look at this big pyramid. It's El Castillo!",
    tareas: [
      "Di qué te parece la pirámide",
      "Pregunta quién construyó Chichén Itzá",
      "Pide unos tacos y di qué les pones",
      "Pregunta por el Día de Muertos",
      "Compara una comida con Colombia",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Di qué te parece la pirámide. Pregunta quién construyó Chichén Itzá. Da las gracias y despídete."],
    estampilla: "México, con Chichén Itzá",
    puentes: [
      '"Do you eat corn in Colombia?" (arepas y tortillas)',
      '"Do you have a special day for your family in Colombia?"',
    ],
    palabrasPorNivel: [
      { nivel: "A1", palabras: "pyramid, big, old, tacos, corn, flowers, I'd like…" },
      { nivel: "A2", palabras: "ancient, celebrate, It was built…" },
      { nivel: "B1 en adelante", palabras: "tradition, compared to, history" },
    ],
    evita: 'Violencia y narcotráfico, migración y política, estereotipos (el sombrero, "todos comen picante")',
    datos: [
      {
        texto: "La capital es Ciudad de México. Se habla español, y 68 lenguas indígenas también son oficiales",
        fuente: { titulo: "Mexico", url: "https://en.wikipedia.org/wiki/Mexico" },
      },
      {
        texto: "Chichén Itzá es una ciudad construida por los mayas. Es Patrimonio de la Humanidad desde 1988",
        fuente: { titulo: "Chichen Itza", url: "https://en.wikipedia.org/wiki/Chichen_Itza" },
      },
      {
        texto:
          "El Castillo (templo de Kukulcán) mide unos 30 m. En los equinoccios, la sombra de la tarde forma una serpiente en su escalera",
        fuente: { titulo: "Chichen Itza", url: "https://en.wikipedia.org/wiki/Chichen_Itza" },
      },
      {
        texto:
          "El Día de Muertos es el 1 y 2 de noviembre: las familias hacen altares con la comida favorita de sus difuntos, flores de cempasúchil y calaveras de azúcar. Es patrimonio de la UNESCO desde 2008",
        fuente: { titulo: "Day of the Dead", url: "https://en.wikipedia.org/wiki/Day_of_the_Dead" },
      },
      {
        texto:
          "Las tortillas de maíz acompañan casi todas las comidas; un taco es una tortilla con relleno. La cocina tradicional mexicana es patrimonio de la UNESCO desde 2010",
        fuente: { titulo: "Mexican cuisine", url: "https://en.wikipedia.org/wiki/Mexican_cuisine" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 2,
    pais: "Perú",
    lugar: "Machu Picchu, cerca de Cusco, Perú",
    nivelMinimo: "A1",
    papel: "Tu guía en Machu Picchu",
    inicio: "Welcome to Peru! We are very high in the mountains. Look, that's Machu Picchu!",
    tareas: [
      "Pregunta qué tan alto está Machu Picchu",
      "Pregunta quién construyó Machu Picchu",
      "Pregunta qué idiomas se hablan en Perú",
      "Pide un plato típico",
      "Compara una costumbre con Colombia",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Pregunta qué tan alto está Machu Picchu. Pregunta qué idiomas se hablan en Perú. Da las gracias y despídete."],
    estampilla: "Perú, con Machu Picchu",
    puentes: ['"Do you have mountains in Colombia?" (los Andes)', '"Do you eat fish in Colombia?"'],
    palabrasPorNivel: [
      { nivel: "A1", palabras: "mountain, high, old, fish, lime, I'd like…" },
      { nivel: "A2", palabras: "ancient, built, It was…" },
      { nivel: "B1 en adelante", palabras: "civilization, heritage, compared to" },
    ],
    evita: "Política, estereotipos, comparar qué país tiene mejor comida",
    datos: [
      {
        texto: "La capital es Lima. El idioma oficial es el español, y el quechua y el aimara también son oficiales",
        fuente: { titulo: "Peru", url: "https://en.wikipedia.org/wiki/Peru" },
      },
      {
        texto: "Machu Picchu es una ciudadela inca del siglo XV, a 2.430 m sobre el nivel del mar, cerca de Cusco",
        fuente: { titulo: "Machu Picchu", url: "https://en.wikipedia.org/wiki/Machu_Picchu" },
      },
      {
        texto: "Es Patrimonio de la Humanidad desde 1983",
        fuente: { titulo: "Machu Picchu", url: "https://en.wikipedia.org/wiki/Machu_Picchu" },
      },
      {
        texto:
          "El ceviche es pescado crudo marinado en jugo de cítricos; en Perú se sirve con camote y maíz. Sus prácticas son patrimonio de la UNESCO desde 2023",
        fuente: { titulo: "UNESCO", url: "https://ich.unesco.org/en/RL/01952" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 3,
    pais: "Brasil",
    lugar: "Río de Janeiro, Brasil",
    nivelMinimo: "A1",
    // El documento añade: ("Tu guía en Río", pantalla 8), una nota para el diseño.
    papel: 'Tu guía en Río. Habla en inglés y adapta su inglés al nivel del alumno',
    inicio: "Welcome to Rio de Janeiro! I'm your guide today. Look, that's Sugarloaf Mountain!",
    tareas: [
      "Pregunta cómo se sube al Pan de Azúcar",
      "Pregunta qué idioma se habla en Brasil",
      "Pide una comida típica",
      "Pregunta por el Carnaval",
      "Compara una costumbre con Colombia",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Pregunta cómo se sube al Pan de Azúcar. Pregunta qué idioma se habla en Brasil. Da las gracias y despídete."],
    estampilla: "Brasil, con el Pan de Azúcar",
    puentes: [
      '"Do you have a carnival in Colombia?" para que el alumno hable del Carnaval de Barranquilla',
      '"Do you eat beans in Colombia?" para que compare la feijoada con los frijoles colombianos',
    ],
    palabrasPorNivel: [
      { nivel: "A1", palabras: "beach, mountain, food, music, dance, big, beautiful, I'd like…, There is…, Can I…?" },
      { nivel: "A2", palabras: "traditional, festival, costume, It was…, I went…" },
      { nivel: "B1", palabras: "celebrate, tradition, compared to, similar to, different from" },
      {
        nivel: "B2 en adelante",
        palabras: "Conversación libre sobre historia y cultura, siempre con los datos de esta ficha",
      },
    ],
    evita:
      'Estereotipos ("todos bailan samba"), temas de violencia o seguridad del país, política y religión; el Cristo Redentor lo presenta solo como monumento. Tampoco dice que un país sea mejor que el otro: compara con curiosidad.',
    datos: [
      {
        texto: "En Brasil se habla portugués, no español. La capital es Brasília, no Río",
        fuente: { titulo: "Brazil", url: "https://en.wikipedia.org/wiki/Brazil" },
      },
      {
        texto: "Es el país más grande de Sudamérica",
        fuente: { titulo: "Brazil", url: "https://en.wikipedia.org/wiki/Brazil" },
      },
      {
        texto:
          "El Pan de Azúcar mide 396 m sobre la bahía de Guanabara. Se sube en teleférico en dos tramos, con una parada en el Morro da Urca",
        fuente: { titulo: "Sugarloaf Mountain", url: "https://en.wikipedia.org/wiki/Sugarloaf_Mountain" },
      },
      {
        texto: "El Cristo Redentor está en el cerro Corcovado. Mide 30 m sin el pedestal y se inauguró en 1931",
        fuente: { titulo: "Christ the Redeemer", url: "https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)" },
      },
      {
        texto:
          "El Carnaval de Río empieza el viernes antes de la Cuaresma y termina el Miércoles de Ceniza. Las escuelas de samba desfilan en el Sambódromo, que tiene puestos para 72.500 personas",
        fuente: { titulo: "Rio Carnival", url: "https://en.wikipedia.org/wiki/Rio_Carnival" },
      },
      {
        texto: "La feijoada es un guiso de frijoles con carne de cerdo y de res, y se sirve con arroz",
        fuente: { titulo: "Feijoada", url: "https://en.wikipedia.org/wiki/Feijoada" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 4,
    pais: "España",
    lugar: "Barcelona, España",
    nivelMinimo: "A2",
    papel: "Tu guía en Barcelona. Aunque allí se habla español, la conversación es en inglés",
    inicio: "Welcome to Barcelona! Look up. That church is the Sagrada Família, and it isn't finished!",
    tareas: [
      "Pregunta por la Sagrada Familia",
      "Pregunta qué idiomas se hablan en España",
      "Pide un plato típico",
      "Pregunta por el flamenco",
      "Cuenta un viaje que hiciste (pasado)",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Pregunta qué idiomas se hablan en España. Pregunta por el flamenco. Da las gracias y despídete."],
    estampilla: "España, con las torres de la Sagrada Familia",
    puentes: ['"Do you have a typical rice dish in Colombia?"', '"What music do people dance to in Colombia?"'],
    palabrasPorNivel: [
      { nivel: "A2", palabras: "church, tower, rice, I visited…, It was…" },
      { nivel: "B1", palabras: "architect, still, since 1882" },
      { nivel: "B2 en adelante", palabras: "conversación libre con los datos de la ficha" },
    ],
    evita: "Corridas de toros, la independencia de Cataluña, juicios sobre la Conquista",
    datos: [
      {
        texto:
          "La capital es Madrid. El español es oficial en todo el país y el catalán, el vasco y el gallego lo son en sus regiones",
        fuente: { titulo: "Spain", url: "https://en.wikipedia.org/wiki/Spain" },
      },
      {
        texto:
          "La Sagrada Familia, de Antoni Gaudí, se empezó en 1882 y todavía está en construcción; su torre central quedó terminada en estructura en febrero de 2026",
        fuente: { titulo: "Sagrada Família", url: "https://en.wikipedia.org/wiki/Sagrada_Fam%C3%ADlia" },
      },
      {
        texto: "La paella es un plato de arroz de Valencia, con azafrán; su nombre viene de la sartén en que se cocina",
        fuente: { titulo: "Paella", url: "https://en.wikipedia.org/wiki/Paella" },
      },
      {
        texto: "El flamenco nació en Andalucía y une canto, guitarra y baile. Es patrimonio de la UNESCO desde 2010",
        fuente: { titulo: "Flamenco", url: "https://en.wikipedia.org/wiki/Flamenco" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 5,
    pais: "Francia",
    lugar: "París, Francia",
    nivelMinimo: "A2",
    papel: "Pasa la tarde contigo en París y hablan de la cultura francesa",
    inicio: "Bonjour! That's French for hello. Welcome to Paris! Can you see the Eiffel Tower?",
    tareas: [
      "Pregunta por la torre Eiffel",
      "Habla de arte y museos",
      "Opina sobre su comida",
      "Di qué te gusta hacer cuando viajas",
      "Planea un día en la ciudad",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Pregunta por la torre Eiffel. Di qué te gusta hacer cuando viajas. Da las gracias y despídete."],
    estampilla: "Francia, con la torre Eiffel",
    puentes: ['"Is there a famous museum in Colombia?"', '"What bread do you eat in Colombia?"'],
    palabrasPorNivel: [
      { nivel: "A2", palabras: "museum, painting, bread, I'd like to visit…" },
      { nivel: "B1", palabras: "I think…, in my opinion, famous for" },
      { nivel: "B2 en adelante", palabras: "conversación libre con los datos de la ficha" },
    ],
    evita: 'Estereotipos ("los franceses son groseros"), política',
    datos: [
      {
        texto:
          "La capital es París y el idioma es el francés. Es el país que más turistas recibe en el mundo, unos 102 millones en 2025",
        fuente: { titulo: "France", url: "https://en.wikipedia.org/wiki/France" },
      },
      {
        texto:
          "La torre Eiffel se terminó en 1889 para la Exposición Universal. Mide 330 m y lleva el nombre del ingeniero Gustave Eiffel",
        fuente: { titulo: "Eiffel Tower", url: "https://en.wikipedia.org/wiki/Eiffel_Tower" },
      },
      {
        texto: "El Louvre es el museo más visitado del mundo; allí está la Mona Lisa",
        fuente: { titulo: "Louvre", url: "https://en.wikipedia.org/wiki/Louvre" },
      },
      {
        texto:
          "La baguette es un pan largo y delgado de corteza crujiente. Su saber artesanal es patrimonio de la UNESCO desde 2022",
        fuente: { titulo: "Baguette", url: "https://en.wikipedia.org/wiki/Baguette" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 6,
    pais: "Italia",
    lugar: "Roma, Italia",
    nivelMinimo: "A2",
    papel: "Tu guía en Roma",
    inicio: "Welcome to Rome! This is the Colosseum. It's almost 2,000 years old!",
    tareas: [
      "Pregunta qué pasaba en el Coliseo",
      "Pregunta cuántas personas cabían en el Coliseo",
      "Pregunta qué es el Vaticano",
      "Pide una pizza o una pasta",
      "Cuenta qué hiciste el fin de semana (pasado)",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Pregunta cuántas personas cabían en el Coliseo. Pregunta qué es el Vaticano. Da las gracias y despídete."],
    estampilla: "Italia, con el Coliseo",
    puentes: ['"Is there a very old building in your city?"', '"What\'s your favorite pizza?"'],
    palabrasPorNivel: [
      { nivel: "A2", palabras: "old, stadium, cheese, I ate…, It was…" },
      { nivel: "B1", palabras: "ancient, used to, people watched" },
      { nivel: "B2 en adelante", palabras: "conversación libre con los datos de la ficha" },
    ],
    evita: "Mafia, estereotipos, religión (el Vaticano se menciona solo como lugar)",
    datos: [
      {
        texto: "La capital es Roma y el idioma es el italiano. El Vaticano es un país pequeño dentro de Roma",
        fuente: { titulo: "Italy", url: "https://en.wikipedia.org/wiki/Italy" },
      },
      {
        texto:
          "El Coliseo se terminó en el año 80. Cabían entre 50.000 y 80.000 personas y allí había luchas de gladiadores",
        fuente: { titulo: "Colosseum", url: "https://en.wikipedia.org/wiki/Colosseum" },
      },
      {
        texto:
          "La pizza nació en Nápoles. La margarita lleva tomate, mozzarella y albahaca. El arte del pizzero napolitano es patrimonio de la UNESCO desde 2017",
        fuente: { titulo: "Pizza", url: "https://en.wikipedia.org/wiki/Pizza" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 7,
    pais: "Egipto",
    lugar: "Las pirámides de Giza, Egipto",
    nivelMinimo: "B1",
    papel: "Está contigo frente a las pirámides y hablan de la cultura egipcia",
    inicio: "Here we are in Giza! The Great Pyramid is more than 4,000 years old. What do you think?",
    tareas: [
      "Describe lo que ves",
      "Pregunta quién las construyó",
      "Pregunta para qué se construyeron",
      "Di qué te sorprende",
      "Pregunta por una comida típica de la calle",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Pregunta para qué se construyeron. Pregunta por una comida típica de la calle. Da las gracias y despídete."],
    estampilla: "Egipto, con Giza",
    puentes: [
      '"Are there ancient places in Colombia?" (Ciudad Perdida, San Agustín, sin que Allison dé datos de ellos)',
      '"What\'s a popular street food in Colombia?"',
    ],
    palabrasPorNivel: [
      { nivel: "B1", palabras: "built for, it took, I'm surprised that…" },
      { nivel: "B2", palabras: "was built by, it is believed that…" },
      { nivel: "C1 en adelante", palabras: "conversación libre con los datos de la ficha" },
    ],
    evita: "Política, religión, conflictos de la región, teorías sin base sobre quién construyó las pirámides",
    datos: [
      {
        texto: "La capital es El Cairo y el idioma oficial es el árabe. Su historia antigua nació junto al río Nilo",
        fuente: { titulo: "Egypt", url: "https://en.wikipedia.org/wiki/Egypt" },
      },
      {
        texto:
          "La Gran Pirámide se construyó para el faraón Keops hacia el 2600 a. C. Medía unos 146 m y fue la construcción más alta del mundo durante más de 3.700 años",
        fuente: { titulo: "Great Pyramid of Giza", url: "https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza" },
      },
      {
        texto: "Es la única de las Siete Maravillas del Mundo Antiguo que sigue casi intacta",
        fuente: { titulo: "Great Pyramid of Giza", url: "https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza" },
      },
      {
        texto:
          "El koshari mezcla arroz, lentejas, pasta, garbanzos, salsa de tomate y cebolla frita. Es el plato nacional y comida callejera muy popular; es patrimonio de la UNESCO desde 2025",
        fuente: { titulo: "Koshary", url: "https://en.wikipedia.org/wiki/Koshary" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 8,
    pais: "India",
    lugar: "El Taj Mahal, en Agra, India",
    nivelMinimo: "B1",
    papel: "Tu guía en Agra",
    inicio: "Welcome to Agra! This white building is the Taj Mahal. Do you know why it was built?",
    tareas: [
      "Pregunta por la historia del Taj Mahal",
      "Di qué te parece el Taj Mahal",
      "Pregunta qué se come en la India",
      "Pregunta por el Diwali",
      "Compara una celebración con Colombia",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Di qué te parece el Taj Mahal. Pregunta qué se come en la India. Da las gracias y despídete."],
    estampilla: "India, con la cúpula del Taj Mahal",
    puentes: [
      '"Do you light candles at a celebration in Colombia?" (el Día de las Velitas, sin que Allison dé datos de él)',
      '"Do you like spicy food?"',
    ],
    palabrasPorNivel: [
      { nivel: "B1", palabras: "was built for, in memory of, festival of lights" },
      { nivel: "B2", palabras: "it is said that…, symbol of" },
      { nivel: "C1 en adelante", palabras: "conversación libre con los datos de la ficha" },
    ],
    evita: "Religión más allá de describir la fiesta, castas, pobreza y estereotipos, política",
    datos: [
      {
        texto:
          "La capital es Nueva Delhi; el hindi y el inglés son los idiomas del gobierno. Es el país más poblado del mundo",
        fuente: { titulo: "India", url: "https://en.wikipedia.org/wiki/India" },
      },
      {
        texto:
          "El emperador Shah Jahan construyó el Taj Mahal en memoria de su esposa Mumtaz Mahal, en mármol blanco; el mausoleo se terminó en 1648. Es Patrimonio de la Humanidad desde 1983",
        fuente: { titulo: "Taj Mahal", url: "https://en.wikipedia.org/wiki/Taj_Mahal" },
      },
      {
        texto:
          "El Diwali es la fiesta de las luces, entre mediados de octubre y mediados de noviembre: se encienden lámparas, se decoran los pisos con rangoli y se comparten dulces",
        fuente: { titulo: "Diwali", url: "https://en.wikipedia.org/wiki/Diwali" },
      },
      {
        texto:
          "La cocina india usa muchas especias; mucha gente es vegetariana. Se come arroz, pan plano (roti) y lentejas (dal)",
        fuente: { titulo: "Indian cuisine", url: "https://en.wikipedia.org/wiki/Indian_cuisine" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 9,
    pais: "China",
    lugar: "Pekín y la Gran Muralla, China",
    nivelMinimo: "B1",
    papel: "Acabas de llegar a Pekín y hablan de la cultura china",
    inicio: "Welcome to Beijing! Tomorrow we're visiting the Great Wall. Have you heard about it?",
    tareas: [
      "Pregunta por la Gran Muralla",
      "Pregunta si la muralla se ve desde la Luna",
      "Di qué comida quieres probar",
      "Pregunta por una fiesta tradicional",
      "Compara una costumbre con Colombia",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Pregunta por la Gran Muralla. Pregunta si la muralla se ve desde la Luna. Da las gracias y despídete."],
    estampilla: "China, con la Gran Muralla",
    puentes: [
      '"What do families eat together at New Year in Colombia?"',
      '"Do people give gifts at celebrations in Colombia?"',
    ],
    palabrasPorNivel: [
      { nivel: "B1", palabras: "I'd like to try, dumplings, celebrate with" },
      { nivel: "B2", palabras: "it is believed to bring…" },
      { nivel: "C1 en adelante", palabras: "conversación libre con los datos de la ficha" },
    ],
    evita: "Política y gobierno, Taiwán, derechos humanos, estereotipos",
    datos: [
      {
        texto: "La capital es Pekín y el idioma oficial es el chino estándar",
        fuente: { titulo: "China", url: "https://en.wikipedia.org/wiki/China" },
      },
      {
        texto:
          "La Gran Muralla mide en total unos 21.196 km y se construyó para defenderse de pueblos nómadas. Las partes más conocidas cerca de Pekín son Badaling y Mutianyu",
        fuente: { titulo: "Great Wall of China", url: "https://en.wikipedia.org/wiki/Great_Wall_of_China" },
      },
      {
        texto: "Que la muralla se vea desde la Luna es un mito",
        fuente: { titulo: "Great Wall of China", url: "https://en.wikipedia.org/wiki/Great_Wall_of_China" },
      },
      {
        texto:
          "El Año Nuevo chino o Fiesta de la Primavera cae entre el 21 de enero y el 20 de febrero: cena familiar, sobres rojos con dinero y empanadillas (jiaozi). Es patrimonio de la UNESCO desde 2024",
        fuente: { titulo: "Chinese New Year", url: "https://en.wikipedia.org/wiki/Chinese_New_Year" },
      },
    ],
    minimoIntervenciones: 10,
  },
  {
    numero: 10,
    pais: "Japón",
    lugar: "Tokio, con vista al monte Fuji, Japón",
    nivelMinimo: "B1",
    papel: "Pasea contigo por Tokio y hablan de la cultura japonesa",
    inicio: "Welcome to Tokyo! On a clear day, you can see Mount Fuji from here.",
    tareas: [
      "Pregunta por el monte Fuji",
      "Pide un plato típico",
      "Pregunta por las costumbres al saludar",
      "Di cómo se saluda en Colombia",
      "Cuenta qué te gustaría visitar",
      "Da las gracias y despídete",
    ],
    porRevisar: ["Tareas agregadas para que el alumno hable más (de 3 a 6, con los datos de la ficha; cambio del 24 de octubre de 2026): Pregunta por el monte Fuji. Di cómo se saluda en Colombia. Da las gracias y despídete."],
    estampilla: "Japón, con el monte Fuji",
    puentes: ['"How do people greet each other in Colombia?"', '"Is there a famous mountain or volcano in Colombia?"'],
    palabrasPorNivel: [
      { nivel: "B1", palabras: "bow, polite, I'd love to visit…" },
      { nivel: "B2", palabras: "the deeper you bow, the more…" },
      { nivel: "C1 en adelante", palabras: "conversación libre con los datos de la ficha" },
    ],
    evita: "La Segunda Guerra Mundial, estereotipos, política",
    datos: [
      {
        texto: "La capital es Tokio y el idioma es el japonés",
        fuente: { titulo: "Japan", url: "https://en.wikipedia.org/wiki/Japan" },
      },
      {
        texto:
          "El monte Fuji mide 3.776 m y es la montaña más alta de Japón. Es un volcán activo; su última erupción fue en 1707 y 1708. Es Patrimonio de la Humanidad desde 2013",
        fuente: { titulo: "Mount Fuji", url: "https://en.wikipedia.org/wiki/Mount_Fuji" },
      },
      {
        texto: "Para saludar se hace una reverencia (ojigi): cuanto más profunda, más respeto",
        fuente: { titulo: "Bowing in Japan", url: "https://en.wikipedia.org/wiki/Bowing_in_Japan" },
      },
      {
        texto:
          "La cocina tradicional japonesa (washoku) es patrimonio de la UNESCO desde 2013. El sushi nació como una forma de conservar pescado en arroz; el ramen llegó de China",
        fuente: { titulo: "Washoku", url: "https://en.wikipedia.org/wiki/Washoku" },
      },
    ],
    minimoIntervenciones: 10,
  },
];
