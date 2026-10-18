import { pasoDe } from "../ruta/estado";
import { rutaDe } from "../ruta/index";
import type { Nivel } from "../tipos";

/**
 * Los nombres que el panel muestra para las claves de la ruta: "a1-p03"
 * → "Parada 3 · Nueva York", "a1-r1" → "Repaso 1", "a2-p04" → "Parada 4"
 * (los niveles con ruta provisional no tienen ciudad escrita en la ruta).
 */
export function nombreDeParada(clave: string): string {
  const u = pasoDe(clave);
  if (u) return u.paso.tipo === "parada" ? `Parada ${u.paso.parada.numero} · ${u.paso.parada.ciudad}` : u.paso.repaso.nombre;
  const m = /^[a-c][12]-(p(\d+)|r1|rf)$/.exec(clave);
  if (!m) return clave;
  return m[2] ? `Parada ${Number(m[2])}` : m[1] === "r1" ? "Repaso 1" : "Repaso final";
}

/** "A1 · Parada 3", "A2 · ruta provisional", "A1 · sin empezar". */
export function vaEn(nivel: Nivel, ultimaParada: string | null): string {
  if (!rutaDe(nivel)) return `${nivel} · ruta provisional`;
  if (!ultimaParada || !ultimaParada.startsWith(nivel.toLowerCase())) return `${nivel} · sin empezar`;
  return `${nivel} · ${nombreDeParada(ultimaParada).split(" · ")[0]}`;
}

/** Las partes de la app en que se cuentan las intervenciones (plan, sección 16). */
export const PARTES = [
  { clave: "ruta", nombre: "Lecciones de la ruta", color: "#12b5a5" },
  { clave: "escenario", nombre: "Escenarios de cierre", color: "#4a5be6" },
  { clave: "hablar", nombre: "Hablar", color: "#f5a623" },
  { clave: "viajes", nombre: "Viajes", color: "#ec4899" },
  { clave: "escenarios", nombre: "Escenarios", color: "#7c4dd8" },
] as const;
