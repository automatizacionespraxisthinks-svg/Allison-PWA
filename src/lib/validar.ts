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
const aTexto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** ¿Es un identificador de la base (uuid)? Uno mal formado haría fallar la consulta con un 500. */
export function esUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Texto obligatorio con mensaje en español. */
export function textoRequerido(mensaje: string, min = 1, max = 500) {
  return z.preprocess(aTexto, z.string().min(min, mensaje).max(max, mensaje));
}
