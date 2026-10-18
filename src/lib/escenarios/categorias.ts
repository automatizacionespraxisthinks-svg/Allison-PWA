/**
 * Las categorías de Escenarios (pantalla 5), con su color y su ícono.
 * Sin base de datos: la pantalla (cliente) también las usa.
 */

export type Categoria = "Míos" | "Viajes" | "Compras" | "Comida" | "Salud" | "Ciudad";

export const CATEGORIAS: Categoria[] = ["Míos", "Viajes", "Compras", "Comida", "Salud", "Ciudad"];

/** La clase de color (globals.css) y el ícono de cada categoría. */
export const ESTILO_CATEGORIA: Record<Categoria, { clase: string; icono: string }> = {
  Míos: { clase: "cat-mios", icono: "chispa" },
  Viajes: { clase: "cat-viajes", icono: "viajes" },
  Compras: { clase: "cat-compras", icono: "bolsa" },
  Comida: { clase: "cat-comida", icono: "comida" },
  Salud: { clase: "cat-salud", icono: "salud" },
  Ciudad: { clase: "cat-ciudad", icono: "ciudad" },
};

/** Una tarjeta del catálogo, como la ve el alumno. */
export interface TarjetaEscenario {
  clave: string;
  /** Para la dirección: "libreria" o "propio-<id>". */
  ruta: string;
  titulo: string;
  lugar: string;
  categoria: Categoria;
  /** La ilustración ("c-libreria"), o vacío en los propios. */
  imagen: string;
  papelCorto: string;
  tareas: number;
  nivelMinimo: string;
  abierto: boolean;
  estrellas: number;
  veces: number;
}

/** "cat:libreria" → "libreria"; "propio:<id>" → "propio-<id>". */
export function rutaDeEscenario(clave: string): string {
  return clave.startsWith("cat:") ? clave.slice(4) : clave.replace(/^propio:/, "propio-");
}

export function claveDeRuta(ruta: string): string {
  return ruta.startsWith("propio-") ? `propio:${ruta.slice(7)}` : `cat:${ruta}`;
}
