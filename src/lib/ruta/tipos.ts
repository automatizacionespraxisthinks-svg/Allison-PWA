/**
 * El contenido de "Mi ruta": paradas, lecciones, actividades y
 * escenarios. Los datos salen del documento aprobado "Contenido A1"
 * (y la parada 1, de la sección 7 del Plan de mejoras); aquí solo se
 * pasan a una forma que las pantallas puedan usar.
 *
 * Cada actividad guarda dos cosas:
 *   · los campos que la pantalla y la evaluación corta necesitan (la
 *     frase que se oye, las opciones, la respuesta y lo que también vale);
 *   · el texto original del documento ("queAparece", "siRespondeMal"),
 *     tal cual, para que nada de lo aprobado se pierda al estructurarlo.
 *
 * Todo el inglés es de Estados Unidos. Las traducciones al español que
 * no estaban escritas en el documento van marcadas en `porRevisar`.
 */

/**
 * Nombre de una ilustración, sin extensión. Vive en la carpeta de su
 * nivel (public/ilustraciones/a1/<nombre>.webp); una de otro nivel que se
 * reutiliza lleva la carpeta delante ("a1/f-tenis"). Ver srcIlustracion.
 */
export type Ilustracion = string;

/**
 * Un punto dentro de una ilustración, en porcentaje del ancho y del alto
 * (0 a 100): dónde va la flecha o qué persona de una foto se toca.
 * `undefined` mientras no se haya marcado sobre la imagen.
 */
export interface Zona {
  x: number;
  y: number;
  /**
   * Solo en las tarjetas que muestran una parte de la foto: cuánto se ve,
   * en porcentaje del ancho (más chico = más ampliado). Por omisión, 42.
   */
  ancho?: number;
}

export type TipoActividad =
  | "escucha-elige"
  | "que-es-esto"
  | "repite"
  | "tu-turno"
  | "dilo"
  | "describe"
  | "responde"
  | "entrevista"
  | "adivina"
  | "cuentame"
  | "narra"
  | "ensenale";

/**
 * Lo que Allison explica cuando el alumno dice algo previsto. En A1 y A2
 * `explicacion` va en español. Desde B1 va en inglés sencillo y `es` es
 * su traducción: un toque en «En español» la muestra en lugar del inglés,
 * nunca las dos a la vez (Contenido B1, "Español de Allison").
 */
export interface Explicacion {
  siDice: string;
  explicacion: string;
  es?: string;
}

interface ActividadBase {
  /** 1, 2 o 3 dentro de la lección. */
  paso: number;
  tipo: TipoActividad;
  /** "Qué aparece", tal cual del documento. */
  queAparece: string;
  /** "Si responde mal", tal cual del documento. */
  siRespondeMal: string;
  /**
   * "También se acepta", tal cual del documento, cuando es una regla y no
   * una lista ("Cualquier nombre deletreado", "Cualquier ciudad"). Las
   * formas concretas van en `aceptadas`.
   */
  tambienSeAcepta?: string;
  /** Textos que no estaban escritos en el documento y que hay que revisar. */
  porRevisar?: string[];
}

/** Oye una frase (sin verla escrita) y elige la imagen. Gratis: no usa IA. */
export interface EscuchaElige extends ActividadBase {
  tipo: "escucha-elige";
  /** Quién habla: "Sarah", "Tom", "Allison", "un muchacho"... */
  quienHabla: string;
  /** Lo que se oye, línea por línea. */
  audio: string[];
  /** La traducción de cada línea, que aparece al acertar. */
  traduccion: string[];
  /** Pregunta en español, si la hay ("¿Quién es Tom?"). */
  pregunta?: string;
  /**
   * Tres opciones. Si son personas de una misma foto, la misma imagen con
   * su zona. Si la app las dibuja (tarjetas con una hora, un mapa), no
   * llevan imagen sino `texto`.
   */
  opciones: { imagen?: Ilustracion; texto?: string; descripcion: string; zona?: Zona }[];
  /** Índice de la opción correcta. */
  correcta: number;
}

/** Ve una imagen y dice la palabra. Evaluación corta. */
export interface QueEsEsto extends ActividadBase {
  tipo: "que-es-esto";
  /** La ilustración. Si la app la dibuja (un reloj), va `texto` en su lugar. */
  imagen?: Ilustracion;
  /** Lo que la app dibuja cuando no hay ilustración ("un reloj que marca las 10:00"). */
  texto?: string;
  /** Dónde va la flecha, si la imagen tiene varias cosas. */
  flecha?: Zona;
  /** Lo que se le pregunta o se le deja a medias ("What is this?", "This is my…"). */
  pregunta: string;
  /** La respuesta esperada ("mom"). Las rayas en pantalla salen de aquí. */
  respuesta: string;
  /** Otras formas que valen ("mother", "my mom"). */
  aceptadas: string[];
  /** Pistas en inglés, una a la vez (máximo tres; desde B1, una sola). */
  pistas: string[];
  /** Errores previstos y lo que Allison explica (B1). */
  explicaciones?: Explicacion[];
}

/** Oye una frase de Allison y la repite. Evaluación corta palabra por palabra. */
export interface Repite extends ActividadBase {
  tipo: "repite";
  frase: string;
  /** La palabra que más cuesta, si el documento la nombra ("this"). */
  palabraDificil?: string;
  /**
   * El consejo para esa palabra. En A1 y A2, en español ("La lengua sale un
   * poquito entre los dientes."); desde B1, en inglés, con `consejoEs`.
   */
  consejo?: string;
  consejoEs?: string;
}

/** Dice su línea dentro de un diálogo. No se califica. Gratis. */
export interface TuTurno extends ActividadBase {
  tipo: "tu-turno";
  /** Las líneas que se oyen antes de la suya. */
  dialogo: { quien: string; dice: string }[];
  /** Su línea en pantalla, con ___ donde va lo suyo. */
  plantilla: string;
  /** La línea de ejemplo ("Yes, this is my mom. Her name is Rosa."). */
  modelo: string;
  aceptadas: string[];
  /** Las palabras de apoyo que aparecen debajo de su línea, si el documento las trae. */
  palabras?: string[];
}

/** Ve una frase en español y la dice en inglés. Evaluación corta. */
export interface Dilo extends ActividadBase {
  tipo: "dilo";
  espanol: string;
  imagen?: Ilustracion;
  respuesta: string;
  aceptadas: string[];
  /** Las palabras en inglés, desordenadas, que aparecen de apoyo. Desde B1 no hay: []. */
  palabras: string[];
  /**
   * B1: las dos partes de la frase, unidas por because, but, when, so o
   * although; juntas (con un espacio) son `respuesta`. Al primer fallo
   * Allison da solo la primera palabra de la parte que falló.
   */
  partes?: string[];
  /** Errores previstos y lo que Allison explica (en español en A1 y A2; desde B1, en inglés con `es`). */
  explicaciones?: Explicacion[];
}

/** Ve un dibujo y dice tres cosas. Evaluación corta. */
export interface Describe extends ActividadBase {
  tipo: "describe";
  imagen: Ilustracion;
  /** Lo que dice Allison ("Tell me 3 things."). */
  pregunta: string;
  /** Las frases para completar ("She has a ___."). */
  plantillas: string[];
  /** Las palabras de ayuda debajo de la imagen. */
  palabrasAyuda: string[];
  /** Las frases modelo. */
  modelo: string[];
  aceptadas: string[];
  /** Las cosas del dibujo que cuentan, en inglés, para la evaluación. */
  cosas: string[];
  /** Cuántas cosas tiene que nombrar (3). */
  minimo: number;
}

/** Cinco preguntas con diez segundos cada una. Evaluación corta. */
export interface Responde extends ActividadBase {
  tipo: "responde";
  preguntas: { pregunta: string; modelo: string }[];
  /** Ejemplos de respuestas cortas que también valen. */
  aceptadas: string[];
  /** Segundos por pregunta. */
  segundos: number;
}

/** Arma preguntas para descubrir datos de Allison. Conversación con Allison. */
export interface Entrevista extends ActividadBase {
  tipo: "entrevista";
  /** De qué es la ficha ("la familia de Allison"). */
  ficha: string;
  /** Los cinco datos por descubrir. La respuesta sale de la ficha aprobada de Allison. */
  datos: { dato: string; pregunta: string; respuesta: string }[];
  aceptadas: string[];
  /** Lo que dice Allison si la pregunta no se entiende (en español) y la pregunta para repetir. */
  ayuda: string;
  minimoIntervenciones: number;
  /**
   * B1: la pista en inglés de cada dato, en el orden de `datos` ("Ask me
   * about Cartagena! Start with: Have you ever…?"). Desde B1 no hay
   * palabras de ayuda: si la pregunta no se entiende, Allison da la pista.
   */
  pistas?: string[];
}

/**
 * Adivina (A2, "Actividades nuevas" de Contenido A2): el alumno hace
 * preguntas de sí o no hasta descubrir en qué piensa Allison, entre seis
 * tarjetas. Como en la Entrevista, el modelo solo reconoce qué preguntó;
 * la respuesta sale de la tabla aprobada (`preguntas`), así Allison nunca
 * responde mal. Dos rondas seguidas.
 */
export interface Adivina extends ActividadBase {
  tipo: "adivina";
  /** Lo que dice Allison al empezar ("I have a job. Ask me yes or no questions and guess!"). */
  apertura: string;
  /**
   * Las seis tarjetas. `nombre` es como se dice en inglés ("police officer").
   * Si son personas de una misma ilustración, `zona` es dónde está cada una:
   * la tarjeta muestra esa parte ampliada.
   */
  opciones: { nombre: string; imagen: Ilustracion; zona?: Zona }[];
  /** En qué piensa Allison en cada ronda (nombres de `opciones`); el orden se baraja al empezar. */
  rondas: string[];
  /**
   * La tabla de respuestas: cada pregunta que se reconoce y las opciones
   * para las que la respuesta es sí. Para las demás es no.
   */
  preguntas: { pregunta: string; si: string[] }[];
  /** Cómo se adivina, con {x} donde va la opción ("Are you a {x}?"). */
  adivinar: string;
  /** Lo que dice Allison si la pregunta no es de sí o no ("That's a secret! Ask me: Do you…?"). */
  secreto: string;
  /**
   * Lo que dice Allison al adivinar una tarjeta en especial, en vez del
   * "Yes!" de siempre (Bath: socks → "Yes! I bought five pairs!").
   */
  alAdivinar?: Record<string, string>;
  aceptadas: string[];
}

/**
 * Cuéntame (A2): habla sin interrupciones hasta 30 segundos sobre un
 * tema, con tres preguntas guía en pantalla. Se transcribe a ciegas y
 * Allison muestra una cosa que hizo bien y una sola por mejorar.
 */
export interface Cuentame extends ActividadBase {
  tipo: "cuentame";
  /** Lo que pide Allison ("Tell me about your school day."). */
  tema: string;
  /** Las tres preguntas guía. */
  guias: string[];
  /** El relato modelo. */
  modelo: string;
  /** El reloj (30). */
  segundos: number;
  /** Desde cuántos segundos hablados es un acierto (20). Escrito no cuenta el tiempo. */
  minimoSegundos: number;
  /** Cuántas frases que se entienden hacen falta (3). */
  minimoFrases: number;
}

/**
 * Narra la secuencia (B1, "Actividades nuevas" de Contenido B1): cuenta
 * una historia de cuatro dibujos en orden, con la gramática de la parada
 * y palabras para ordenar. Se transcribe a ciegas; es un acierto si cuenta
 * al menos 3 de los 4 dibujos en orden. Allison repite bien una sola
 * frase que falló y, si falta un dibujo, lo señala.
 */
export interface Narra extends ActividadBase {
  tipo: "narra";
  /** Los cuatro dibujos, en orden. */
  imagenes: Ilustracion[];
  /** Qué muestra cada dibujo, en español: el texto alternativo y lo que se le da al modelo para saber qué contó. */
  dibujos: string[];
  /** Lo que pide Allison ("Tell me Zoe's story."). */
  pregunta: string;
  /** Las palabras de "Debajo:" para ordenar (first, then, after that, now). */
  debajo: string[];
  /** La narración modelo. */
  modelo: string;
  /** La ayuda: el verbo de cada dibujo (checked, flew, waited, hasn't arrived). Apaga una estrella. */
  verbos: string[];
  /** La gramática que se pide, en inglés, para la evaluación ("past simple and present perfect"). */
  gramatica: string;
  /** Errores previstos y lo que Allison dice (en inglés, con su traducción). */
  explicaciones?: Explicacion[];
  /** Cuántos dibujos tiene que contar en orden (3). */
  minimoDibujos: number;
  /** Escrito: cuántas frases hacen falta (4). */
  minimoFrases: number;
  /** El reloj (60). */
  segundos: number;
}

/**
 * Enséñale a Allison (B1): el alumno le explica algo de Colombia que ella
 * no conoce. Es como la Entrevista al revés: pregunta Allison, con una
 * lista fija de cuatro preguntas, y reacciona corto. Nunca afirma datos
 * del tema. El modelo solo reconoce si la respuesta sirve; lo que dice
 * Allison sale de aquí.
 */
export interface Ensenale extends ActividadBase {
  tipo: "ensenale";
  /** De qué le enseña, en español ("el Día de las Velitas"). */
  tema: string;
  /** Lo que dice Allison al empezar ("I've never celebrated Velitas! Teach me about it."). */
  apertura: string;
  /** El dibujo que acompaña, si lo hay. */
  imagen?: Ilustracion;
  /**
   * Las cuatro preguntas de Allison, en orden. `simple` es la versión más
   * simple, para cuando responde en español o no se entiende; `modelo`, una
   * respuesta que serviría.
   */
  preguntas: { pregunta: string; simple: string; modelo: string }[];
  /** Reacciones cortas después de una buena respuesta ("Wow, that sounds amazing!"). */
  reacciones: string[];
  /** La despedida después de la cuarta pregunta ("Thank you! Now I really want to go!"). */
  cierre: string;
  /**
   * Si el alumno le pregunta algo de su ficha: lo que pregunta (en español,
   * como en el documento: "qué música le gusta") y lo que contesta Allison,
   * tal cual. Sale de su ficha aprobada.
   */
  respuestasDeAllison?: { siPregunta: string; respuesta: string }[];
  /** Lo que dice si le hace otra pregunta ("Good question! But today you're the teacher. Tell me more!"). */
  otraPregunta?: string;
  /** Cuántas preguntas tiene que responder con frases que se entienden (3). */
  minimoRespuestas: number;
}

export type Actividad =
  | EscuchaElige
  | QueEsEsto
  | Repite
  | TuTurno
  | Dilo
  | Describe
  | Responde
  | Entrevista
  | Adivina
  | Cuentame
  | Narra
  | Ensenale;

export interface Leccion {
  numero: number;
  titulo: string;
  /** En los repasos no hay: el título dice qué paradas mezcla. */
  objetivo?: string;
  actividades: Actividad[];
}

/** Un momento de un escenario largo (el Repaso final tiene cuatro). */
export interface Momento {
  nombre: string;
  /** Los números de las tareas de este momento. */
  tareas: number[];
  /** El fondo de este momento, si cambia. */
  imagen?: Ilustracion;
  /** La parada que Allison propone repasar si se atasca aquí. */
  repasar?: string;
}

/** El escenario de cierre de una parada (sección 8 del plan). */
export interface Escenario {
  titulo: string;
  imagen: Ilustracion;
  contexto: string;
  /** Quién es Allison en su papel ("Linda Miller, la mamá de tu familia anfitriona"). */
  personaje: string;
  objetivo: string;
  tareas: string[];
  /**
   * El diálogo de ejemplo. `tarea` es el número de la tarea que cumple esa
   * línea; una tarea puede cumplirse con dos líneas. La frase del botón
   * Ayuda de cada tarea sale de aquí (ayudasDe, en src/lib/ruta/index.ts).
   */
  dialogo: { quien: "personaje" | "alumno"; dice: string; tarea?: number; momento?: string }[];
  /** Los momentos, si el escenario tiene varios (Repaso final). */
  momentos?: Momento[];
  /**
   * A2 en adelante: lo que da el botón Ayuda en cada tarea, en el orden de
   * `tareas`: el comienzo de la frase ("I usually ___"), no la frase entera.
   * Sin esto, la ayuda da la frase del diálogo de ejemplo (A1).
   */
  ayudas?: string[];
  /** El botón Ayuda aparece solo desde el segundo fallo en una tarea (Repaso final de A2: "con poca ayuda"). */
  ayudaDesdeSegundoFallo?: boolean;
  /**
   * B1: el imprevisto. Pasa justo después de cumplir la tarea
   * `despuesDeTarea` y trae la tarea `tarea`, que antes no se ve (en
   * pantalla, ni para el modelo). `texto` es la celda "Imprevisto" del
   * documento, en español. `linea` es la línea del personaje que lo trae
   * en el diálogo de ejemplo (la marcada "(imprevisto)"): Allison la dice
   * tal cual, así el imprevisto llega siempre y como se aprobó.
   */
  imprevisto?: { despuesDeTarea: number; tarea: number; texto: string; linea: string };
  /** El mensaje de cierre en español. */
  resumen: string;
  /** Lo que gana y lo que se abre al terminar (estrellas, estampilla, siguiente parada). */
  recompensa: string;
  /**
   * Qué hace Allison si se atasca: la tabla de las paradas. En los repasos
   * el documento lo escribe como un párrafo: va en `siSeAtascaTexto`.
   */
  siSeAtasca: { situacion: string; accion: string; ejemplo: string }[];
  siSeAtascaTexto?: string;
  minimoIntervenciones: number;
  /** Desde aquí Allison cierra la escena con amabilidad. */
  maximoIntervenciones: number;
}

export interface Parada {
  numero: number;
  ciudad: string;
  /** El nombre de la parada ("Presenta a tu familia"). */
  titulo: string;
  gramatica: string;
  /** El párrafo de objetivo del documento. */
  objetivo: string;
  /** Lo que el alumno puede decir al terminar. */
  fraseMeta: string;
  /** La ilustración de la ciudad. */
  portada: Ilustracion;
  vocabulario: { grupo: string; ingles: string; nota: string }[];
  lecciones: Leccion[];
  escenario: Escenario;
  /** La tabla de ilustraciones del documento. */
  ilustraciones: { archivos: Ilustracion[]; muestra: string; uso: string }[];
}

/**
 * Un repaso (después de la parada 5 y al final de A1): cada lección
 * mezcla paradas anteriores, no hay palabras nuevas ni ilustraciones
 * nuevas, y cierra con un escenario.
 */
export interface Repaso {
  /** "Repaso 1", "Repaso final". */
  nombre: string;
  /** Después de qué parada aparece en la ruta. */
  despuesDeParada: number;
  ciudad: string;
  titulo: string;
  objetivo: string;
  /** El párrafo "Cómo es distinto" del documento. */
  comoEsDistinto: string;
  portada: Ilustracion;
  lecciones: Leccion[];
  escenario: Escenario;
  /** Notas que el documento agrega (nota de nivel, datos nuevos). */
  notas?: string[];
}

/** Un viaje de la sección Viajes: una ficha cultural para conversar con Allison de guía. */
export interface Viaje {
  numero: number;
  pais: string;
  /** El lugar del viaje ("Chichén Itzá, en la península de Yucatán, México"). */
  lugar: string;
  /** Desde qué nivel aparece. */
  nivelMinimo: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  /** El papel de Allison ("Tu guía en Chichén Itzá"). */
  papel: string;
  /** La primera frase de Allison. */
  inicio: string;
  /** Las tres tareas del viaje. */
  tareas: string[];
  estampilla: string;
  /** Preguntas para comparar con Colombia (Allison pregunta, no afirma). */
  puentes: string[];
  palabrasPorNivel: { nivel: string; palabras: string }[];
  /** Temas que Allison evita. */
  evita: string;
  /** Los únicos datos que Allison puede usar, con su fuente. */
  datos: { texto: string; fuente: { titulo: string; url: string } }[];
  minimoIntervenciones: number;
}
