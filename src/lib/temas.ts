/**
 * Temas pedagógicos: la lista cerrada con la que se agrupan los errores.
 *
 * Sin esto el alumno ve frases sueltas ("more tall → taller") que no le
 * dicen qué estudiar. Agrupadas por tema ve un diagnóstico: "el
 * comparativo se te atraviesa, 6 veces".
 *
 * La lista es CERRADA a propósito. Si el modelo inventara etiquetas,
 * el mismo error saldría con cinco nombres distintos y no agruparía.
 */
export const TEMAS = {
  pasado: {
    titulo: "El pasado de los verbos",
    pista: "En pasado los verbos cambian: go → went, have → had, see → saw.",
    ejemplo: "Yesterday I went to the park",
  },
  edad: {
    titulo: "Decir la edad",
    pista: "En inglés la edad se dice con to be, no con tener.",
    ejemplo: "I am 25 years old",
  },
  comparar: {
    titulo: "Comparar cosas",
    pista: "Adjetivo corto lleva -er; el largo lleva more delante.",
    ejemplo: "She is taller than me",
  },
  sujeto: {
    titulo: "El sujeto repetido",
    pista: "En inglés no se repite el sujeto con un pronombre.",
    ejemplo: "My sister is tall",
  },
  negacion: {
    titulo: "Las negaciones",
    pista: "Para negar se usa don't o doesn't, no solo no.",
    ejemplo: "I don't have money",
  },
  tercera_persona: {
    titulo: "La tercera persona",
    pista: "Con he, she o it el verbo lleva -s.",
    ejemplo: "She has a car",
  },
  preposiciones: {
    titulo: "Las preposiciones",
    pista: "in, on, at y to no se traducen directo del español.",
    ejemplo: "I arrive at school on Monday",
  },
  articulos: {
    titulo: "Los artículos",
    pista: "a, an y the no se usan igual que en español.",
    ejemplo: "I am a teacher",
  },
  plurales: {
    titulo: "Los plurales",
    pista: "people, children y money no se usan como en español.",
    ejemplo: "The people are happy",
  },
  orden: {
    titulo: "El orden de las palabras",
    pista: "En inglés el orden es más fijo que en español.",
    ejemplo: "I always drink coffee",
  },
  pronunciacion: {
    titulo: "La pronunciación",
    pista: "Sonidos que en español no existen y cambian el significado.",
    ejemplo: "sheep (oveja) no suena como ship (barco)",
  },
  vocabulario: {
    titulo: "La palabra exacta",
    pista: "Palabras que existen pero no son las que un nativo usaría.",
    ejemplo: "I made a mistake, no I did a mistake",
  },
  naturalidad: {
    titulo: "Sonar natural",
    pista: "Está bien dicho, pero un nativo lo diría de otra forma.",
    ejemplo: "What do you do? en vez de What is your work?",
  },
} as const;

export type ClaveTema = keyof typeof TEMAS;

export const CLAVES_TEMA = Object.keys(TEMAS) as ClaveTema[];

export function tema(clave: string) {
  return TEMAS[clave as ClaveTema] ?? TEMAS.naturalidad;
}
