import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * El pase de "¿No dijiste eso?" de la conversación libre.
 *
 * Cuando Allison oye mal lo que el alumno dijo, el turno ya se cobró y
 * la respuesta contesta a otra cosa. En producción (17 de noviembre de
 * 2026) el alumno tenía que reclamar hablando, y eso le gastaba otro
 * turno. Con el pase, toca "¿No dijiste eso?" bajo su mensaje: el turno
 * se borra y la intervención vuelve a la bolsa de la que salió.
 *
 * El pase va firmado y viaja con la respuesta de ese turno. Así el
 * servidor sabe de qué bolsa se cobró (plan o recarga) sin guardarlo en
 * la base: la tabla de mensajes no lo tiene, y deducirlo después del
 * saldo puede devolver a la bolsa equivocada. Vale diez minutos y solo
 * para el alumno al que se le dio.
 */
export const MINUTOS_PARA_RECLAMAR = 10;

/** Cuántas veces al día se puede usar: es para un mal oído, no para hablar gratis. */
export const RECLAMOS_POR_DIA = 3;

export type Bolsa = "plan" | "recarga";

const firma = (carga: string, secreto: string) => createHmac("sha256", secreto).update(`turno:${carga}`).digest("base64url");

/** El pase del turno, o null si no hay con qué firmarlo. */
export function firmarTurno(
  datos: { mensajeId: string; userId: string; bolsa: Bolsa },
  ahora = Date.now(),
  secreto = process.env.AUTH_SECRET
): string | null {
  if (!secreto) return null;
  const carga = Buffer.from(
    JSON.stringify({ m: datos.mensajeId, u: datos.userId, b: datos.bolsa, v: ahora + MINUTOS_PARA_RECLAMAR * 60_000 })
  ).toString("base64url");
  return `${carga}.${firma(carga, secreto)}`;
}

/** Lo que dice un pase, si es auténtico, de este alumno y no venció. */
export function leerTurno(
  pase: unknown,
  userId: string,
  ahora = Date.now(),
  secreto = process.env.AUTH_SECRET
): { mensajeId: string; bolsa: Bolsa } | null {
  if (!secreto || typeof pase !== "string" || pase.length > 600) return null;
  const [carga, dada, ...sobra] = pase.split(".");
  if (!carga || !dada || sobra.length) return null;
  const esperada = Buffer.from(firma(carga, secreto));
  const recibida = Buffer.from(dada);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  try {
    const d = JSON.parse(Buffer.from(carga, "base64url").toString("utf8")) as { m?: unknown; u?: unknown; b?: unknown; v?: unknown };
    if (typeof d.m !== "string" || d.u !== userId || (d.b !== "plan" && d.b !== "recarga")) return null;
    if (typeof d.v !== "number" || d.v < ahora) return null;
    return { mensajeId: d.m, bolsa: d.b };
  } catch {
    return null;
  }
}
