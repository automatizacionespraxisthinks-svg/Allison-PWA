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
