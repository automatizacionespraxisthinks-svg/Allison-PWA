import { normalizar, palabraNormalizada } from "../normalizar.ts";

/**
 * Dilo en inglés: cuántas palabras de la frase dijo en orden desde el
 * principio; se pintan de verde en la línea a medida que las dice
 * (pantalla 6). Compara como la evaluación, con las contracciones
 * abiertas y los números en cifras: antes «I am» no era «I'm» ni
 * «fifteen» era «15», y se marcaba como error una palabra bien dicha
 * (30 de octubre de 2026).
 */
export function palabrasEnOrden(frase: string[], dicho: string): number {
  const oidas = normalizar(dicho).trim().split(" ").filter(Boolean);
  let desde = 0;
  for (let k = 0; k < frase.length; k++) {
    const partes = palabraNormalizada(frase[k], frase[k + 1]);
    let en = -1;
    for (let s = desde; s + partes.length <= oidas.length; s++) {
      if (partes.every((p, t) => oidas[s + t] === p)) {
        en = s;
        break;
      }
    }
    if (en < 0) return k;
    desde = en + partes.length;
  }
  return frase.length;
}

/**
 * B1: la primera palabra de la parte que falló: la primera que no está
 * entera en lo dicho. Antes contaba las palabras en orden desde el
 * principio, y con otra forma buena al comienzo («I have been» por
 * «I've been») señalaba la primera parte aunque la que falló era la
 * segunda (30 de octubre de 2026). Si todas están, la que tiene la
 * primera palabra que no dijo en orden.
 */
export function primeraDeLaParte(partes: string[], dicho: string): string {
  const d = normalizar(dicho);
  const falta = partes.find((p) => !d.includes(normalizar(p)));
  if (falta) return falta.split(/\s+/)[0].replace(/[,.!?;:]+$/, "");
  const frase = partes.join(" ").split(/\s+/);
  const k = palabrasEnOrden(frase, dicho);
  let desde = 0;
  for (const p of partes) {
    const n = p.split(/\s+/).length;
    if (k < desde + n) return p.split(/\s+/)[0].replace(/[,.!?;:]+$/, "");
    desde += n;
  }
  return partes[partes.length - 1].split(/\s+/)[0].replace(/[,.!?;:]+$/, "");
}
