/**
 * La parte que Narra pide además de la historia: "dos ideas con could o
 * might" (B1 parada 9), "cualquier opinión con I think, In my opinion o
 * should" (Repaso 1), "cualquier idea con could, might o may" (Repaso
 * final). Sale de los datos aprobados: la regla de "También se acepta" y
 * la pregunta de "Si responde mal" ("Si no da ideas, Allison pregunta:
 * 'What could they do now?'"). Antes esas narraciones salían correctas
 * sin la parte y Allison no preguntaba nada (auditoría, 28 de octubre de
 * 2026; hecho en la tanda 1, 29 de octubre de 2026).
 *
 * Puro, sin la IA: lo usa la ruta de evaluar y lo prueba probar-ruta.
 */

export interface Seguimiento {
  /** Lo que pregunta Allison si falta ("What could they do now?"). */
  pregunta: string;
  /** Las palabras con que se reconoce la parte (could, might; I think, should). */
  marcadores: string[];
  /** Cuántas hacen falta ("dos ideas": 2). */
  cuantas: number;
  /** Lo que faltó, en español, para la pantalla ("dos ideas con could o might"). */
  falta: string;
}

const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function seguimientoDeNarra(a: { siRespondeMal: string; tambienSeAcepta?: string }): Seguimiento | null {
  const pide = /Si no da ([^,]+?),\s*Allison pregunta:\s*["“]([^"”]+)["”]/i.exec(a.siRespondeMal);
  const regla = /\b(dos|una|cualquier)\s+(ideas?|opini[oó]n)\s+con\s+(.+?)(?:,\s*aunque\b|$)/i.exec(a.tambienSeAcepta ?? "");
  if (!pide || !regla) return null;
  const marcadores = regla[3]
    .split(/\s*,\s*|\s+o\s+/)
    .map((m) => m.trim())
    .filter(Boolean);
  if (!marcadores.length) return null;
  const cuantas = regla[1].toLowerCase() === "dos" ? 2 : 1;
  const que = /opini/i.test(regla[2]) ? "tu opinión" : cuantas === 2 ? "dos ideas" : "una idea";
  const lista = marcadores.length > 1 ? `${marcadores.slice(0, -1).join(", ")} o ${marcadores[marcadores.length - 1]}` : marcadores[0];
  return { pregunta: pide[2].trim(), marcadores, cuantas, falta: `${que} con ${lista}` };
}

/**
 * ¿Lo dicho trae la parte? Cada vez que aparece un marcador cuenta una
 * ("they could buy a new cake, or they might eat ice cream": dos); con
 * uno solo, un "or" después también cuenta otra ("they could buy a cake
 * or eat ice cream").
 */
export function traeLaParte(texto: string, s: Seguimiento): boolean {
  const alternativas = s.marcadores.map((m) => `${escapar(m)}(?:n't)?`).join("|");
  const veces = texto.match(new RegExp(`\\b(?:${alternativas})(?![a-z])`, "gi"))?.length ?? 0;
  const conOr = veces === 1 && s.cuantas > 1 && new RegExp(`\\b(?:${alternativas})(?![a-z])[^.!?]*\\bor\\b`, "i").test(texto) ? 1 : 0;
  return veces + conOr >= s.cuantas;
}
