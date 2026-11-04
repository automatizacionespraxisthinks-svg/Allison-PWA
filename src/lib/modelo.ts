/**
 * El modelo de Gemini de toda la app: la conversación, las lecciones, las
 * escenas, la ayuda, los escenarios propios y el control de audios largos.
 * Uno solo, aquí, para que nunca quede una parte con otro.
 *
 * gemini-3.5-flash-lite desde el 3 de noviembre de 2026 (decisión del
 * usuario: "se están cometiendo muchos errores"). Con las mismas pruebas
 * que 2.5-flash-lite: 0 de 51 correcciones equivocadas (antes 1 de 40),
 * 99 % de las palabras con voz clara y 88 % con acento hispano marcado,
 * 75 % de los errores conservados para corregir con ese acento (antes
 * 29 %), y más rápido (1,8 s por turno, antes 2,1). Un turno de Hablar
 * cuesta de 7,4 a 9,4 COP (antes ~2,6); una evaluación de lección, 0,48
 * (docs/ARQUITECTURA.md, "Costo real por mensaje"). En producción desde
 * el 4 de noviembre, cuando se cambió GEMINI_MODEL (CAMBIO_DE_MODELO en
 * src/lib/uso.ts).
 *
 * Al cambiar, la batería en vivo encontró un error que ya traía el prompt
 * y que 3.5 repetía más: "My brother have twenty years" se corregía a
 * "has twenty years". Se arregló en el prompt (CASO_2 de A1 y A2) y en el
 * filtro de correcciones de allison.ts.
 *
 * GEMINI_MODEL lo cambia sin tocar el código (para probar otro). Ojo: si
 * el servidor lo tiene fijado, manda sobre este valor.
 */
export const MODELO_POR_DEFECTO = "gemini-3.5-flash-lite";

export const modeloIA = (): string => process.env.GEMINI_MODEL?.trim() || MODELO_POR_DEFECTO;

/**
 * Los tokens que se cobran como salida: la respuesta y, si el modelo
 * razonó antes de responder, también ese razonamiento (Gemini lo factura
 * como salida y no viene en candidatesTokenCount). Con 3.5-flash-lite no
 * razona por defecto, pero si alguna vez lo hace, el costo no se pierde.
 */
export function tokensDeSalida(uso?: { candidatesTokenCount?: number; thoughtsTokenCount?: number }): number {
  return (uso?.candidatesTokenCount ?? 0) + (uso?.thoughtsTokenCount ?? 0);
}
