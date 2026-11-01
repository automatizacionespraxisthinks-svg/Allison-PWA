import { normalizar } from "../normalizar.ts";

/**
 * La explicación prevista para lo que dijo el alumno, si la hay. Busca
 * palabras enteras y sin signos ("drink" no está en "drinks", "Do you
 * have thirst?" sí está aunque no haya dicho el signo), y "…" vale por
 * lo que sea ("although… but"). Si lo previsto es parte de la respuesta
 * buena ("Is a lamp" en "There is a lamp…") y dijo la forma buena, no es
 * el error. Antes "My mom never drinks coffee" recibía "lleva -s: drinks"
 * (auditoría, 28 de octubre de 2026). Compara como la evaluación, con las
 * contracciones abiertas: «He is boring» encuentra lo previsto para «He's
 * boring» (30 de octubre de 2026).
 */
export function explicacionPara<T extends { siDice: string }>(lista: T[] | undefined, dicho: string, correcta?: string): T | undefined {
  const d = normalizar(dicho);
  const buena = correcta ? normalizar(correcta) : "";
  return lista?.find((x) => {
    const partes = x.siDice.split(/…|\.\.\./).map((p) => normalizar(p).trim()).filter(Boolean);
    let desde = 0;
    for (const p of partes) {
      const i = d.indexOf(` ${p} `, desde);
      if (i < 0) return false;
      desde = i + p.length + 1;
    }
    if (partes.length !== 1 || !buena) return true;
    // Con la palabra de antes en la respuesta buena ("there is a lamp"): si eso dijo, está bien.
    const i = buena.indexOf(` ${partes[0]} `);
    if (i < 0) return true;
    const antes = buena.slice(0, i).trim().split(" ").pop();
    return !antes || !d.includes(` ${antes} ${partes[0]} `);
  });
}

/**
 * Cuéntame: la corrección de ejemplo del documento, tal cual viene en «Si
 * responde mal» ('"I going to visit my grandma" → Para planes: I'm going to
 * visit my grandma'). Va al modelo para que explique la gramática de la
 * parada: sin ella explicaba otra regla ("presente progresivo" para going
 * to; "unreal past" para If I had…; 1 de noviembre de 2026). null si no la trae.
 */
export function ejemploDeCorreccion(siRespondeMal: string): string | null {
  return siRespondeMal.match(/Ejemplo: ("[^"]+" → .+?)\. Si habló/)?.[1] ?? null;
}
