import type { Nivel } from "./tipos";

/**
 * El currículo de Allison: 60 unidades, 10 por nivel.
 *
 * Sale del análisis contra el Marco Común Europeo — en concreto del
 * Core Inventory for General English (British Council/EAQUALS) y del
 * English Grammar Profile de Cambridge, que son los inventarios que
 * dicen qué gramática es OBLIGATORIA en cada nivel. El razonamiento
 * completo está en docs/CURRICULO.md, sección 4.
 *
 * Vive en el código y no en la base de datos a propósito: es contenido
 * pedagógico que se revisa como código, se versiona con la app y se
 * prueba sin base (scripts/probar-curriculo.mjs). La base guarda solo
 * el AVANCE del alumno (progreso_lecciones), que sí es suyo y sí muta.
 *
 * Cada unidad esconde la gramática detrás de un contexto real: la
 * unidad no se llama "Pasado simple", se llama "El fin de semana
 * pasado". La gramática es el medio, nunca el título.
 */

export interface Unidad {
  /** Identificador estable, con el nivel de prefijo: "a2-finde". */
  clave: string;
  nivel: Nivel;
  orden: number;
  /** Lo que ve el alumno. */
  titulo: string;
  objetivo: string;
  gramatica: string;
  /** Lo que ve Allison (el prompt trabaja en inglés). */
  metaEn: string;
  estructuraEn: string;
  vocabulario: string[];
  /** La primera frase de Allison al abrir la lección. */
  apertura: string;
}

/** Veces que el alumno debe usar bien la estructura para completar. */
export const META_LOGROS = 6;

export const UNIDADES: Unidad[] = [
  // ------------------------------------------------------------------
  //  A1 — Sobrevivir: presentarse y manejar situaciones básicas
  // ------------------------------------------------------------------
  {
    clave: "a1-saludos",
    nivel: "A1",
    orden: 1,
    titulo: "Saludos y presentarse",
    objetivo: "Decir quién eres y de dónde vienes",
    gramatica: "verbo to be y pronombres",
    metaEn: "introduce themselves: name, age and where they are from",
    estructuraEn:
      "the verb TO BE in the present (I am, you are, she is) with subject pronouns",
    vocabulario: ["hello", "my name is", "years old", "I am from", "nice to meet you", "Colombia"],
    apertura: "Hi! What's your name?",
  },
  {
    clave: "a1-familia",
    nivel: "A1",
    orden: 2,
    titulo: "Mi familia",
    objetivo: "Hablar de las personas cercanas",
    gramatica: "posesivos y have got",
    metaEn: "talk about their family and close people",
    estructuraEn:
      "possessive adjectives (my, your, his, her) and HAVE GOT to describe family",
    vocabulario: ["mother", "father", "brother", "sister", "son", "daughter"],
    apertura: "Tell me about your family.",
  },
  {
    clave: "a1-preguntas",
    nivel: "A1",
    orden: 3,
    titulo: "Preguntar y conocer gente",
    objetivo: "Hacer preguntas básicas para conocer a alguien",
    gramatica: "preguntas con what, where, who, how",
    metaEn: "ask basic questions to get to know a person",
    estructuraEn:
      "WH- questions with correct word order (What is your...? Where do you...?)",
    vocabulario: ["what", "where", "who", "how", "favorite", "live"],
    apertura: "Ask me three questions about me!",
  },
  {
    clave: "a1-numeros",
    nivel: "A1",
    orden: 4,
    titulo: "Números, hora y fecha",
    objetivo: "Manejar cifras, decir la hora y la fecha",
    gramatica: "preposiciones de tiempo: in, on, at",
    metaEn: "handle numbers, tell the time and say dates",
    estructuraEn:
      "numbers, telling the time, and the prepositions IN, ON, AT for time expressions",
    vocabulario: ["o'clock", "half past", "Monday", "January", "today", "birthday"],
    apertura: "What time do you wake up?",
  },
  {
    clave: "a1-rutina",
    nivel: "A1",
    orden: 5,
    titulo: "Mi rutina diaria",
    objetivo: "Contar qué haces todos los días",
    gramatica: "presente simple y adverbios de frecuencia",
    metaEn: "describe their daily routine and habits",
    estructuraEn:
      "the present simple with adverbs of frequency (always, usually, sometimes, never), including the third-person -s",
    vocabulario: ["wake up", "go to work", "study", "always", "usually", "never"],
    apertura: "What do you do every morning?",
  },
  {
    clave: "a1-habilidades",
    nivel: "A1",
    orden: 6,
    titulo: "Lo que sé hacer",
    objetivo: "Decir qué sabes y qué no sabes hacer",
    gramatica: "can y can't",
    metaEn: "talk about abilities and ask for permission",
    estructuraEn: "CAN and CAN'T for ability and permission",
    vocabulario: ["can", "swim", "cook", "dance", "drive", "play the guitar"],
    apertura: "Can you cook? What can you cook?",
  },
  {
    clave: "a1-comida",
    nivel: "A1",
    orden: 7,
    titulo: "Comida y bebida",
    objetivo: "Pedir comida y hablar de gustos",
    gramatica: "like, would like, contables e incontables",
    metaEn: "order food and talk about likes and dislikes",
    estructuraEn:
      "LIKE / DON'T LIKE, WOULD LIKE for ordering, and SOME / ANY with countable and uncountable nouns",
    vocabulario: ["breakfast", "rice", "chicken", "water", "delicious", "I would like"],
    apertura: "What food do you like?",
  },
  {
    clave: "a1-casa",
    nivel: "A1",
    orden: 8,
    titulo: "Mi casa y mi barrio",
    objetivo: "Describir dónde vives",
    gramatica: "there is, there are y preposiciones de lugar",
    metaEn: "describe their home and neighborhood",
    estructuraEn:
      "THERE IS / THERE ARE and prepositions of place (in, on, under, next to, behind)",
    vocabulario: ["bedroom", "kitchen", "table", "next to", "behind", "neighborhood"],
    apertura: "Tell me about your house.",
  },
  {
    clave: "a1-ahora",
    nivel: "A1",
    orden: 9,
    titulo: "¿Qué está pasando?",
    objetivo: "Describir lo que pasa en este momento y la ropa",
    gramatica: "presente continuo",
    metaEn: "describe what is happening right now, including clothes people are wearing",
    estructuraEn:
      "the present continuous for actions happening now (I am wearing, she is watching)",
    vocabulario: ["wearing", "watching", "listening", "right now", "shirt", "shoes"],
    apertura: "What are you wearing today?",
  },
  {
    clave: "a1-ciudad",
    nivel: "A1",
    orden: 10,
    titulo: "Moverse por la ciudad",
    objetivo: "Pedir y dar direcciones",
    gramatica: "imperativos y direcciones",
    metaEn: "ask for and give simple directions",
    estructuraEn:
      "imperatives for directions (go straight, turn left) and asking WHERE IS...?",
    vocabulario: ["turn left", "turn right", "go straight", "near", "far", "bus station"],
    apertura: "Help me: where is the park?",
  },

  // ------------------------------------------------------------------
  //  A2 — Contar: el pasado, los planes y las transacciones diarias
  // ------------------------------------------------------------------
  {
    clave: "a2-ocupacion",
    nivel: "A2",
    orden: 1,
    titulo: "Mi trabajo o mi estudio",
    objetivo: "Describir tu ocupación y tu día a día",
    gramatica: "presente simple contra presente continuo",
    metaEn: "describe their job or studies, both routine and current projects",
    estructuraEn:
      "the contrast between present simple (routines) and present continuous (now / temporary situations)",
    vocabulario: ["job", "company", "subject", "project", "these days", "at the moment"],
    apertura: "What do you do, and what are you working on these days?",
  },
  {
    clave: "a2-finde",
    nivel: "A2",
    orden: 2,
    titulo: "El fin de semana pasado",
    objetivo: "Narrar hechos del pasado",
    gramatica: "pasado simple",
    metaEn: "narrate past events in order",
    estructuraEn:
      "the past simple: regular (-ed) and irregular verbs (went, saw, had), negatives and questions with DID",
    vocabulario: ["went", "saw", "visited", "stayed", "last weekend", "yesterday"],
    apertura: "Tell me about your last weekend. What did you do?",
  },
  {
    clave: "a2-historia",
    nivel: "A2",
    orden: 3,
    titulo: "Una historia inesperada",
    objetivo: "Contar qué estaba pasando cuando algo ocurrió",
    gramatica: "pasado continuo con when y while",
    metaEn: "set the scene of a story: what was going on when something happened",
    estructuraEn:
      "the past continuous with WHEN and WHILE (I was walking when it started to rain)",
    vocabulario: ["while", "suddenly", "was walking", "was raining", "happened", "scared"],
    apertura: "What were you doing yesterday at eight at night?",
  },
  {
    clave: "a2-experiencias",
    nivel: "A2",
    orden: 4,
    titulo: "¿Alguna vez…?",
    objetivo: "Hablar de experiencias de tu vida",
    gramatica: "presente perfecto con ever y never",
    metaEn: "talk about life experiences without saying exactly when",
    estructuraEn:
      "the present perfect with EVER and NEVER for life experiences (Have you ever been...? I have never tried...)",
    vocabulario: ["ever", "never", "been", "tried", "seen", "amazing"],
    apertura: "Have you ever traveled to another city? Tell me!",
  },
  {
    clave: "a2-planes",
    nivel: "A2",
    orden: 5,
    titulo: "Planes y futuro",
    objetivo: "Hablar de lo que vas a hacer",
    gramatica: "going to y will",
    metaEn: "talk about plans, predictions and spontaneous decisions",
    estructuraEn:
      "GOING TO for plans and WILL for promises, predictions and decisions made on the spot",
    vocabulario: ["tomorrow", "next month", "plan", "probably", "I will", "going to"],
    apertura: "What are you going to do this weekend?",
  },
  {
    clave: "a2-viajes",
    nivel: "A2",
    orden: 6,
    titulo: "Viajes y transporte",
    objetivo: "Planear un viaje y moverte",
    gramatica: "presente continuo para planes cerrados",
    metaEn: "plan a trip: fixed arrangements, tickets and transport",
    estructuraEn:
      "the present continuous for fixed arrangements (I'm flying on Monday) and prepositions of movement",
    vocabulario: ["ticket", "trip", "flight", "arrive", "leave", "by bus"],
    apertura: "Imagine we are planning a trip together. Where are we going?",
  },
  {
    clave: "a2-invitaciones",
    nivel: "A2",
    orden: 7,
    titulo: "Invitar y sugerir",
    objetivo: "Invitar, sugerir planes y responder",
    gramatica: "would you like, let's, shall we",
    metaEn: "invite people, make suggestions, and accept or decline politely",
    estructuraEn:
      "invitations and suggestions: WOULD YOU LIKE TO...?, LET'S..., SHALL WE...?, WHY DON'T WE...?",
    vocabulario: ["would you like", "let's", "how about", "sounds good", "sorry", "another day"],
    apertura: "Let's plan something fun. Invite me to do something!",
  },
  {
    clave: "a2-salud",
    nivel: "A2",
    orden: 8,
    titulo: "Salud y el cuerpo",
    objetivo: "Explicar cómo te sientes y dar consejos",
    gramatica: "should, have to y must",
    metaEn: "explain how they feel and give simple advice",
    estructuraEn:
      "SHOULD for advice and HAVE TO / MUST for obligation, with health vocabulary",
    vocabulario: ["headache", "sick", "doctor", "medicine", "should", "have to"],
    apertura: "I have a headache. What should I do?",
  },
  {
    clave: "a2-compras",
    nivel: "A2",
    orden: 9,
    titulo: "Compras y precios",
    objetivo: "Comprar, preguntar precios y cantidades",
    gramatica: "cuantificadores: much, many, some, any",
    metaEn: "shop: ask about prices, sizes and quantities",
    estructuraEn:
      "quantifiers (HOW MUCH / HOW MANY, SOME, ANY, A LOT OF) and shopping language",
    vocabulario: ["how much", "expensive", "cheap", "size", "pay", "discount"],
    apertura: "Welcome to my store! What do you need today?",
  },
  {
    clave: "a2-comparar",
    nivel: "A2",
    orden: 10,
    titulo: "Personas y comparaciones",
    objetivo: "Describir y comparar personas y cosas",
    gramatica: "comparativos y superlativos",
    metaEn: "describe people and compare people, places and things",
    estructuraEn:
      "comparatives (-er / more) and superlatives (the -est / the most), with adjectives for appearance and character",
    vocabulario: ["taller", "funnier", "more interesting", "the best", "friendly", "smart"],
    apertura: "Who is the funniest person in your family? Why?",
  },

  // ------------------------------------------------------------------
  //  B1 — Defenderse solo: narrar con matices y sostener opiniones
  // ------------------------------------------------------------------
  {
    clave: "b1-experiencia",
    nivel: "B1",
    orden: 1,
    titulo: "Contar una experiencia",
    objetivo: "Narrar algo que te pasó y cuándo",
    gramatica: "presente perfecto contra pasado simple",
    metaEn: "tell experiences, choosing correctly between finished and open time",
    estructuraEn:
      "present perfect vs past simple, with FOR, SINCE, JUST, ALREADY and YET",
    vocabulario: ["I've lived", "since", "for", "just", "already", "yet"],
    apertura:
      "Have you ever had a really surprising day? Tell me what happened and when.",
  },
  {
    clave: "b1-ninez",
    nivel: "B1",
    orden: 2,
    titulo: "Cuando era niño",
    objetivo: "Hablar de hábitos y costumbres que ya cambiaron",
    gramatica: "used to",
    metaEn: "talk about past habits and states that are no longer true",
    estructuraEn: "USED TO for past habits and states that are no longer true",
    vocabulario: ["used to", "childhood", "toys", "neighborhood", "back then", "anymore"],
    apertura: "What did you use to do as a child that you don't do anymore?",
  },
  {
    clave: "b1-secuencia",
    nivel: "B1",
    orden: 3,
    titulo: "Una historia bien contada",
    objetivo: "Ordenar una historia: qué pasó antes y después",
    gramatica: "pasado perfecto y conectores de tiempo",
    metaEn: "sequence a story clearly: what had happened before the main event",
    estructuraEn:
      "the past perfect (had + participle) with BEFORE, AFTER, WHEN and BY THE TIME",
    vocabulario: ["had already", "by the time", "before", "after", "realized", "in the end"],
    apertura: "Tell me a story about a time when a plan went completely wrong.",
  },
  {
    clave: "b1-opinar",
    nivel: "B1",
    orden: 4,
    titulo: "Opinar y estar de acuerdo",
    objetivo: "Dar tu opinión y reaccionar a la de otros",
    gramatica: "expresiones de opinión y conectores",
    metaEn: "give opinions, agree and disagree politely, and justify their view",
    estructuraEn:
      "opinion language (I think, in my opinion, I agree / I disagree because...) with connectors like HOWEVER and ALTHOUGH",
    vocabulario: ["in my opinion", "I agree", "however", "although", "point of view", "it depends"],
    apertura:
      "Some people say social media does more harm than good. What do you think?",
  },
  {
    clave: "b1-entrevista",
    nivel: "B1",
    orden: 5,
    titulo: "Trabajo y entrevista",
    objetivo: "Responder una entrevista y hablar de tu experiencia",
    gramatica: "presente perfecto continuo",
    metaEn: "perform in a job interview and describe their experience",
    estructuraEn:
      "the present perfect continuous (I have been working...) for duration up to now",
    vocabulario: ["experience", "skills", "position", "I've been working", "strengths", "goals"],
    apertura:
      "Welcome to the interview! Tell me about yourself and what you've been doing lately.",
  },
  {
    clave: "b1-tecnologia",
    nivel: "B1",
    orden: 6,
    titulo: "Tecnología y redes",
    objetivo: "Hablar del mundo digital y cómo se usa",
    gramatica: "la voz pasiva",
    metaEn: "discuss technology and how things are made and used",
    estructuraEn: "the passive voice in present and past (is used, was created)",
    vocabulario: ["device", "app", "is used", "was invented", "screen time", "online"],
    apertura:
      "How is your phone used in your daily life? What would change without it?",
  },
  {
    clave: "b1-cultura",
    nivel: "B1",
    orden: 7,
    titulo: "Cine, música y cultura",
    objetivo: "Recomendar y reseñar lo que te gusta",
    gramatica: "adjetivos -ed/-ing y oraciones de relativo",
    metaEn: "recommend and review movies, music and books",
    estructuraEn:
      "adjectives in -ED vs -ING (bored / boring) and defining relative clauses (a movie that..., a singer who...)",
    vocabulario: ["exciting", "disappointed", "plot", "catchy", "that", "who"],
    apertura: "Recommend me a movie or a song that you love. Why is it special?",
  },
  {
    clave: "b1-ambiente",
    nivel: "B1",
    orden: 8,
    titulo: "Medio ambiente",
    objetivo: "Discutir problemas y consecuencias reales",
    gramatica: "condicional 1: if + will",
    metaEn: "discuss environmental problems, consequences and solutions",
    estructuraEn:
      "the first conditional (If we..., ... will...) and SHOULD / MUST for solutions",
    vocabulario: ["pollution", "recycle", "climate", "if we", "will happen", "reduce"],
    apertura: "If we don't take care of water, what will happen in your city?",
  },
  {
    clave: "b1-problemas",
    nivel: "B1",
    orden: 9,
    titulo: "Problemas y soluciones",
    objetivo: "Explicar un problema y proponer salidas",
    gramatica: "modales de posibilidad: might, may, could",
    metaEn: "explain a problem and weigh possible solutions",
    estructuraEn:
      "modals of possibility (might, may, could) to weigh options and propose solutions",
    vocabulario: ["might", "could", "option", "solve", "instead", "worth trying"],
    apertura:
      "Think of a small problem in your daily life. Let's find solutions together.",
  },
  {
    clave: "b1-irreal",
    nivel: "B1",
    orden: 10,
    titulo: "Si pudiera…",
    objetivo: "Imaginar situaciones irreales",
    gramatica: "condicional 2: if + would",
    metaEn: "imagine unreal situations and their consequences",
    estructuraEn:
      "the second conditional (If I had..., I would...) for unreal situations",
    vocabulario: ["if I were", "I would", "a million", "imagine", "change", "dream"],
    apertura:
      "If you could live anywhere in the world for one year, where would you go?",
  },

  // ------------------------------------------------------------------
  //  B2 — Argumentar: debatir, matizar y manejar lo hipotético
  // ------------------------------------------------------------------
  {
    clave: "b2-debate",
    nivel: "B2",
    orden: 1,
    titulo: "Debatir un tema polémico",
    objetivo: "Defender una postura con argumentos",
    gramatica: "conectores de contraste",
    metaEn: "defend a position with structured arguments",
    estructuraEn:
      "contrast connectors (however, although, despite, whereas, on the other hand) to build an argument",
    vocabulario: ["whereas", "despite", "nevertheless", "strongly believe", "argument", "counterpoint"],
    apertura:
      "Here's a hot topic: should phones be banned in schools? Take a side and convince me.",
  },
  {
    clave: "b2-noticias",
    nivel: "B2",
    orden: 2,
    titulo: "Noticias y actualidad",
    objetivo: "Contar qué dijo alguien y comentar hechos",
    gramatica: "estilo indirecto",
    metaEn: "report what people said and comment on current events",
    estructuraEn:
      "reported speech (she said that..., they told me..., he asked whether...) with tense backshift",
    vocabulario: ["claimed", "according to", "reported", "denied", "headline", "source"],
    apertura:
      "Tell me about a piece of news you heard recently. What did people say about it?",
  },
  {
    clave: "b2-negociar",
    nivel: "B2",
    orden: 3,
    titulo: "Negociar y persuadir",
    objetivo: "Convencer, deducir y llegar a acuerdos",
    gramatica: "modales de deducción",
    metaEn: "negotiate, make deductions and reach agreements",
    estructuraEn:
      "modals of deduction (must be, can't be, might have been) and persuasive language",
    vocabulario: ["it must be", "can't be", "deal", "compromise", "convince", "fair"],
    apertura:
      "Let's negotiate: you want a raise and I'm your boss. Convince me you deserve it.",
  },
  {
    clave: "b2-educacion",
    nivel: "B2",
    orden: 4,
    titulo: "Educación y futuro",
    objetivo: "Discutir cómo será el mundo más adelante",
    gramatica: "futuro perfecto y futuro continuo",
    metaEn: "speculate about the future in detail",
    estructuraEn:
      "the future perfect (will have done) and future continuous (will be doing)",
    vocabulario: ["by 2040", "will have changed", "will be studying", "degree", "career", "skills"],
    apertura:
      "By the time you're sixty, how will education have changed? What will students be doing?",
  },
  {
    clave: "b2-choque",
    nivel: "B2",
    orden: 5,
    titulo: "Cultura y choque cultural",
    objetivo: "Comparar costumbres de aquí y de afuera",
    gramatica: "would para hábitos del pasado",
    metaEn: "compare cultures and describe how things used to be done",
    estructuraEn:
      "WOULD for repeated past habits (my grandmother would always...) and language for comparing cultures",
    vocabulario: ["custom", "tradition", "polite", "would always", "culture shock", "abroad"],
    apertura:
      "What Colombian custom would surprise a foreigner the most? And how did your grandparents do things?",
  },
  {
    clave: "b2-presentacion",
    nivel: "B2",
    orden: 6,
    titulo: "Hacer una presentación",
    objetivo: "Exponer un tema con estructura",
    gramatica: "oraciones de relativo explicativas",
    metaEn: "present a topic with clear structure and signposting",
    estructuraEn:
      "non-defining relative clauses (my city, which is...) and signposting language (first of all, moving on, to sum up)",
    vocabulario: ["first of all", "moving on", "which is", "to sum up", "audience", "key point"],
    apertura:
      "Give me a two-minute presentation about your city, which I've never visited. Then I'll ask questions.",
  },
  {
    clave: "b2-hipotesis",
    nivel: "B2",
    orden: 7,
    titulo: "Hipótesis y arrepentimientos",
    objetivo: "Hablar de lo que pudo ser y no fue",
    gramatica: "condicional 3, wish e if only",
    metaEn: "talk about hypothetical pasts and regrets",
    estructuraEn:
      "the third conditional (If I had known, I would have...) and regrets with WISH / IF ONLY + past perfect",
    vocabulario: ["if I had known", "I would have", "I wish", "if only", "regret", "opportunity"],
    apertura:
      "Tell me about a decision you'd change if you could. What would have happened differently?",
  },
  {
    clave: "b2-servicios",
    nivel: "B2",
    orden: 8,
    titulo: "Trámites y servicios",
    objetivo: "Hablar de lo que mandas a hacer",
    gramatica: "causativo: have/get something done",
    metaEn: "talk about services and things they have done for them",
    estructuraEn:
      "the causative HAVE / GET something done (I had my car repaired, I'm getting my hair cut)",
    vocabulario: ["get it fixed", "have it delivered", "appointment", "service", "repair", "paperwork"],
    apertura:
      "What things do you do yourself, and what do you have done by someone else? Why?",
  },
  {
    clave: "b2-matices",
    nivel: "B2",
    orden: 9,
    titulo: "Matices del verbo",
    objetivo: "Precisar el sentido: dejar de hacer o parar para hacer",
    gramatica: "gerundio contra infinitivo",
    metaEn: "use verb patterns precisely where the meaning changes",
    estructuraEn:
      "verbs that change meaning with gerund or infinitive (stop doing / stop to do, remember doing / remember to do, try doing / try to do)",
    vocabulario: ["stopped doing", "remember to", "tried learning", "gave up", "kept working", "meant to"],
    apertura:
      "What's something you tried doing to relax that didn't work? And what do you keep doing anyway?",
  },
  {
    clave: "b2-humor",
    nivel: "B2",
    orden: 10,
    titulo: "Humor e ironía",
    objetivo: "Captar y usar el doble sentido",
    gramatica: "entonación y colocaciones",
    metaEn: "understand and produce irony and humor",
    estructuraEn:
      "irony, understatement and strong collocations; saying one thing while meaning another",
    vocabulario: ["kidding", "sarcastic", "hilarious", "get the joke", "punchline", "deadpan"],
    apertura:
      "Tell me something 'terrible' that happened to you... that was actually funny. Let's play with irony.",
  },

  // ------------------------------------------------------------------
  //  C1 — Precisión: registro, énfasis y matiz en cualquier contexto
  // ------------------------------------------------------------------
  {
    clave: "c1-argumento",
    nivel: "C1",
    orden: 1,
    titulo: "Argumentación compleja",
    objetivo: "Construir un argumento de varias capas",
    gramatica: "conectores avanzados y concesión",
    metaEn: "build multi-layered arguments with concession and rebuttal",
    estructuraEn:
      "advanced connectors (admittedly, granted, that said, notwithstanding) and concession-rebuttal structure",
    vocabulario: ["admittedly", "granted", "that said", "compelling", "flawed", "premise"],
    apertura:
      "Take a position you personally disagree with, and argue for it as convincingly as you can. Then tell me where your own argument is weakest.",
  },
  {
    clave: "c1-academico",
    nivel: "C1",
    orden: 2,
    titulo: "Lenguaje académico",
    objetivo: "Manejar el registro formal hablado y escrito",
    gramatica: "nominalización y pasiva impersonal",
    metaEn: "handle formal academic register in speech",
    estructuraEn:
      "academic register: nominalisation (the implementation of, a reduction in) and impersonal passives (it is argued that, it has been suggested)",
    vocabulario: ["it is argued that", "findings", "significant", "methodology", "implications", "furthermore"],
    apertura:
      "Summarise for me, in formal academic style, a topic you know well — as if you were opening a lecture on it.",
  },
  {
    clave: "c1-registro",
    nivel: "C1",
    orden: 3,
    titulo: "Formal e informal",
    objetivo: "Cambiar de registro según con quién hables",
    gramatica: "elipsis y cambio de registro",
    metaEn: "switch register deliberately depending on the audience",
    estructuraEn:
      "register switching: contractions, ellipsis and phrasal verbs vs their formal equivalents (put off / postpone, find out / ascertain)",
    vocabulario: ["postpone", "put off", "ascertain", "find out", "request", "ask for"],
    apertura:
      "Explain the same piece of news twice: first to your best friend over coffee, then to a board of directors. Make me feel the difference.",
  },
  {
    clave: "c1-idiomatismos",
    nivel: "C1",
    orden: 4,
    titulo: "Idiomatismos y expresiones",
    objetivo: "Usar lenguaje figurado con naturalidad",
    gramatica: "modismos y phrasal verbs avanzados",
    metaEn: "use idioms and figurative language accurately in context",
    estructuraEn:
      "idioms used accurately in context (the last straw, off the top of my head, a blessing in disguise, bite the bullet)",
    vocabulario: ["the last straw", "a blessing in disguise", "off the top of my head", "cut corners", "on the fence", "bite the bullet"],
    apertura:
      "Tell me about a stressful week you survived — and try to slip in at least three idioms without me noticing.",
  },
  {
    clave: "c1-matizar",
    nivel: "C1",
    orden: 5,
    titulo: "Matizar y suavizar",
    objetivo: "Decir sin comprometerte del todo",
    gramatica: "hedging",
    metaEn: "hedge claims and soften statements like a careful speaker",
    estructuraEn:
      "hedging: softening claims with would, might, tend to, arguably, to some extent, it seems to me",
    vocabulario: ["arguably", "tend to", "to some extent", "it would seem", "somewhat", "broadly speaking"],
    apertura:
      "Give me your honest opinion of your country's education system — but hedge every claim like a careful diplomat would.",
  },
  {
    clave: "c1-enfasis",
    nivel: "C1",
    orden: 6,
    titulo: "Dar énfasis",
    objetivo: "Resaltar exactamente lo que importa",
    gramatica: "cleft sentences e inversión",
    metaEn: "emphasise the key element of a message",
    estructuraEn:
      "emphasis with cleft sentences (What I love is..., It was X that...) and negative inversion (Never have I..., Not only did...)",
    vocabulario: ["what I love is", "it was then that", "never have I", "not only", "rarely do", "the thing is"],
    apertura:
      "Tell me about a moment that changed your mind about something important. Emphasise exactly what did it — make the key detail impossible to miss.",
  },
  {
    clave: "c1-pudo-ser",
    nivel: "C1",
    orden: 7,
    titulo: "Lo que pudo ser",
    objetivo: "Mezclar tiempos en lo hipotético",
    gramatica: "condicionales mixtos y pasado irreal",
    metaEn: "handle mixed hypotheticals connecting past choices to present results",
    estructuraEn:
      "mixed conditionals (If I had studied X, I would now be...) and unreal past forms (it's time we, I'd rather you, suppose you had)",
    vocabulario: ["if I had", "I would now be", "it's high time", "I'd rather", "suppose", "otherwise"],
    apertura:
      "If you had made one different choice ten years ago, how would your life look today? Walk me through the chain of consequences.",
  },
  {
    clave: "c1-historias",
    nivel: "C1",
    orden: 8,
    titulo: "Contar historias",
    objetivo: "Narrar con ritmo y efecto",
    gramatica: "cláusulas de participio",
    metaEn: "narrate with pacing, suspense and vivid detail",
    estructuraEn:
      "narrative craft: participle clauses (Having finished..., Exhausted by...), dramatic pacing and vivid detail",
    vocabulario: ["having finished", "exhausted by", "out of nowhere", "at that very moment", "little did I know", "in hindsight"],
    apertura:
      "Tell me the best story you have — the one you always tell at dinners. I want pacing, suspense and a proper ending.",
  },
  {
    clave: "c1-abstracto",
    nivel: "C1",
    orden: 9,
    titulo: "Temas abstractos",
    objetivo: "Discutir ética, sociedad y filosofía",
    gramatica: "especulación avanzada",
    metaEn: "discuss abstract questions with precise speculation",
    estructuraEn:
      "abstract discussion: speculation (may well, could conceivably), generalisation and precise abstract vocabulary",
    vocabulario: ["dilemma", "morally", "may well", "conceivably", "trade-off", "principle"],
    apertura:
      "Here's a dilemma: a self-driving car must choose between two bad outcomes. Who should decide how it's programmed, and why?",
  },
  {
    clave: "c1-alta-presion",
    nivel: "C1",
    orden: 10,
    titulo: "Entrevista de alto nivel",
    objetivo: "Desempeñarte bajo presión",
    gramatica: "todo lo anterior, bajo presión",
    metaEn: "perform under pressure with structured, precise answers",
    estructuraEn:
      "high-stakes interview performance: precise answers under pressure, buying time elegantly (that's a fair question...), structured responses",
    vocabulario: ["that's a fair question", "to put it briefly", "track record", "added value", "challenge", "outcome"],
    apertura:
      "This is the final interview for your dream job, and I'm a tough interviewer. Ready? Why should we choose you over someone with more experience?",
  },

  // ------------------------------------------------------------------
  //  C2 — Maestría: funcionar como un hablante nativo culto
  // ------------------------------------------------------------------
  {
    clave: "c2-precision",
    nivel: "C2",
    orden: 1,
    titulo: "Precisión léxica",
    objetivo: "Elegir la palabra exacta, no la aproximada",
    gramatica: "connotación y matiz",
    metaEn: "choose the exact word, never the approximate one",
    estructuraEn:
      "lexical precision: near-synonyms and connotation (slim / skinny, assertive / pushy, frugal / stingy)",
    vocabulario: ["connotation", "nuance", "assertive", "pushy", "frugal", "stingy"],
    apertura:
      "Describe someone you admire and someone who irritates you — using words so precise that I could never confuse the two feelings.",
  },
  {
    clave: "c2-persuasion",
    nivel: "C2",
    orden: 2,
    titulo: "Discurso persuasivo",
    objetivo: "Estructurar el convencimiento",
    gramatica: "retórica: tricolon, anáfora, contraste",
    metaEn: "persuade with deliberate rhetoric",
    estructuraEn:
      "rhetoric: the rule of three, anaphora, rhetorical questions and contrast, deployed naturally in speech",
    vocabulario: ["let me be clear", "not X but Y", "imagine", "how long must we", "the truth is", "rule of three"],
    apertura:
      "You have ninety seconds to convince a skeptical city council to fund your idea. The floor is yours.",
  },
  {
    clave: "c2-subtexto",
    nivel: "C2",
    orden: 3,
    titulo: "Ironía, sarcasmo y subtexto",
    objetivo: "Decir una cosa y significar otra",
    gramatica: "subtexto e implicatura",
    metaEn: "mean more than they say, and read what others don't say",
    estructuraEn:
      "irony, sarcasm and implicature: meaning more than you say, and reading between the lines",
    vocabulario: ["dry wit", "implication", "tongue-in-cheek", "understatement", "reading between the lines", "loaded"],
    apertura:
      "I'll say some perfectly polite sentences that mean the opposite of what they say — and you do the same. Shall we begin? What a delightful idea.",
  },
  {
    clave: "c2-variedades",
    nivel: "C2",
    orden: 4,
    titulo: "Variedades del inglés",
    objetivo: "Reconocer acentos y regionalismos",
    gramatica: "británico, americano y otros",
    metaEn: "navigate the differences between world Englishes",
    estructuraEn:
      "varieties of English: British vs American vs other Englishes — vocabulary, register and pragmatic differences",
    vocabulario: ["lift", "elevator", "flat", "apartment", "cheers", "y'all"],
    apertura:
      "A Londoner, a Texan and an Australian walk into your office. How does each one greet you, and how do you adjust to each?",
  },
  {
    clave: "c2-mediar",
    nivel: "C2",
    orden: 5,
    titulo: "Mediar entre dos idiomas",
    objetivo: "Resumir, interpretar y explicar de un idioma a otro",
    gramatica: "mediación",
    metaEn: "mediate: summarise, relay and interpret between Spanish and English speakers, keeping tone and intent",
    estructuraEn:
      "mediation: relaying and paraphrasing between parties (in other words, what she means is, roughly translates as)",
    vocabulario: ["in other words", "what she means is", "to paraphrase", "roughly translates as", "the gist", "culturally speaking"],
    apertura:
      "Your boss speaks only English; your client, only Spanish — and they disagree politely. Relay the client's complaint to me, the boss, without losing the diplomacy.",
  },
  {
    clave: "c2-profesion",
    nivel: "C2",
    orden: 6,
    titulo: "El inglés de tu profesión",
    objetivo: "Manejar el vocabulario técnico de tu campo",
    gramatica: "vocabulario especializado",
    metaEn: "master the technical vocabulary and discourse of their own field — ask what they do and go deep",
    estructuraEn:
      "field-specific technical vocabulary and the discourse conventions of the student's profession",
    vocabulario: ["jargon", "stakeholder", "deliverable", "state of the art", "best practice", "layman's terms"],
    apertura:
      "What's your field? Explain your current work to me twice: once for a colleague, once for a curious twelve-year-old.",
  },
  {
    clave: "c2-debate-nativo",
    nivel: "C2",
    orden: 7,
    titulo: "Debate a nivel nativo",
    objetivo: "Sostener el ritmo de una discusión real",
    gramatica: "interrupciones y turnos de habla",
    metaEn: "hold their own in a fast native-speed debate",
    estructuraEn:
      "native-speed debate: holding the floor, interrupting politely (if I may jump in), conceding points strategically",
    vocabulario: ["if I may jump in", "hold on", "fair point, but", "let me finish", "that's precisely why", "moving the goalposts"],
    apertura:
      "Pick any opinion you hold strongly. I'm going to disagree with everything, at full speed. Last one standing wins — go.",
  },
  {
    clave: "c2-oralidad",
    nivel: "C2",
    orden: 8,
    titulo: "Oralidad culta",
    objetivo: "Hablar con la estructura de un buen texto",
    gramatica: "discurso estructurado",
    metaEn: "speak with the structure of good writing: thesis, development, landing",
    estructuraEn:
      "spoken discourse with written structure: a clear thesis, signposted development and a deliberate ending — no rambling",
    vocabulario: ["my central point", "which brings me to", "to return to", "in closing", "digression", "thread"],
    apertura:
      "Speak for two minutes on any subject you love, with the structure of a great essay: a thesis, three movements and a landing.",
  },
  {
    clave: "c2-referencias",
    nivel: "C2",
    orden: 9,
    titulo: "Referencias culturales y humor",
    objetivo: "Captar cultura pop, modismos vivos y humor actual",
    gramatica: "lenguaje vivo",
    metaEn: "handle living English: current expressions, cultural references and humour — and when NOT to use them",
    estructuraEn:
      "current informal expressions and cultural references (that ship has sailed, plot twist, low-key), used with judgment",
    vocabulario: ["that ship has sailed", "spoiler alert", "plot twist", "low-key", "it aged well", "inside joke"],
    apertura:
      "Plot twist: today YOU teach ME. What's something from Colombian culture I'd completely misunderstand, and what's its closest English equivalent?",
  },
  {
    clave: "c2-libre-total",
    nivel: "C2",
    orden: 10,
    titulo: "Conversación libre total",
    objetivo: "Sin tema, sin red, como con un nativo culto",
    gramatica: "todo el idioma",
    metaEn: "sustain a cultured native-level conversation with no topic and no scaffolding",
    estructuraEn:
      "everything at once: no topic, no scaffolding — the conversation goes wherever it goes",
    vocabulario: ["come to think of it", "speaking of which", "that reminds me", "tangent", "anyway", "where was I"],
    apertura:
      "No plan today. Start anywhere — a thought, a memory, a complaint — and let's see where the conversation takes us.",
  },
];

/** Las unidades de un nivel, en su orden. */
export function unidadesDe(nivel: Nivel): Unidad[] {
  return UNIDADES.filter((u) => u.nivel === nivel);
}

/** Una unidad por su clave. Null si no existe (clave vieja o inventada). */
export function unidad(clave: string): Unidad | null {
  return UNIDADES.find((u) => u.clave === clave) ?? null;
}
