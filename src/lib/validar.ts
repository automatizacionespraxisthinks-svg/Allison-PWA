import { z } from "zod";

/**
 * Ayudas de validación compartidas.
 *
 * Existen porque el mismo fallo apareció dos veces: cuando falta un
 * campo, la librería devuelve su mensaje técnico en inglés ("expected
 * string, received undefined") y eso termina en la pantalla del
 * usuario. Convertir la entrada primero permite dar un mensaje propio.
 */

/** Cualquier cosa que llegue se vuelve texto, para poder validar el vacío. */
export const aTexto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Texto obligatorio con mensaje en español. */
export function textoRequerido(mensaje: string, min = 1, max = 500) {
  return z.preprocess(aTexto, z.string().min(min, mensaje).max(max, mensaje));
}
