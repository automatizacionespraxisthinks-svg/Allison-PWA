import type { Nivel } from "../tipos.ts";
import type { Zona } from "./tipos.ts";

/**
 * La ruta pública de una ilustración de la ruta. Cada nivel tiene su
 * carpeta (public/ilustraciones/a1, a2…); una ilustración de otro nivel
 * que se reutiliza lleva la carpeta delante: "a1/f-tenis".
 */
export function srcIlustracion(nombre: string, nivel: Nivel = "A1"): string {
  return nombre.includes("/") ? `/ilustraciones/${nombre}.webp` : `/ilustraciones/${nivel.toLowerCase()}/${nombre}.webp`;
}

/** Cuánto de una ilustración cuadrada se ve en una tarjeta con zona, si la zona no lo dice. */
const ANCHO_ZONA = 42;

/** Cuántas veces se amplía la ilustración en una tarjeta con zona (para pedir la imagen del tamaño justo). */
export const escalaZona = (zona: Zona) => 100 / (zona.ancho ?? ANCHO_ZONA);

/**
 * Dónde va una ilustración cuadrada ampliada dentro de una tarjeta
 * cuadrada para que se vea solo la parte de la zona, con la zona en el
 * centro sin salirse de los bordes del dibujo. Se usa en un elemento
 * absoluto que envuelve la imagen (la tarjeta lleva overflow-hidden).
 */
export function encuadreZona(zona: Zona) {
  const escala = escalaZona(zona);
  const ventana = 100 / escala;
  const borde = (centro: number) => Math.min(Math.max(centro - ventana / 2, 0), 100 - ventana);
  return {
    width: `${escala * 100}%`,
    height: `${escala * 100}%`,
    left: `${-borde(zona.x) * escala}%`,
    top: `${-borde(zona.y) * escala}%`,
  };
}
