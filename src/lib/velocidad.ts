"use client";

import { useSyncExternalStore } from "react";

/**
 * Velocidad de la voz de Allison, elegida por el alumno.
 *
 * Se multiplica sobre la velocidad base del nivel: un A1 en "rápida"
 * oye 0,8 × 1,25 = 1,0 — más ágil que su base, pero nunca la velocidad
 * de un C1, que no entendería.
 *
 * Vive en localStorage porque es una preferencia del dispositivo, como
 * el volumen: no hay razón para guardarla en la base de datos ni para
 * que se pierda al recargar la página.
 *
 * Se lee con useSyncExternalStore y no con un efecto: localStorage no
 * existe en el servidor, y cambiar estado justo después de pintar
 * provoca un repintado en cascada (regla react-hooks/set-state-in-effect).
 */
const CLAVE = "allison:velocidad";

export const VELOCIDADES = [
  { valor: 0.75, etiqueta: "Lenta" },
  { valor: 1, etiqueta: "Normal" },
  { valor: 1.25, etiqueta: "Rápida" },
] as const;

const oyentes = new Set<() => void>();

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

function leer(): number {
  try {
    const v = Number(localStorage.getItem(CLAVE));
    return VELOCIDADES.some((x) => x.valor === v) ? v : 1;
  } catch {
    return 1;
  }
}

export function fijarVelocidad(valor: number): void {
  try {
    localStorage.setItem(CLAVE, String(valor));
  } catch {
    // Sin almacenamiento, vale solo para esta visita. No es grave.
  }
  for (const avisar of oyentes) avisar();
}

/** La velocidad elegida. En el servidor siempre 1 (Normal). */
export function useVelocidad(): number {
  return useSyncExternalStore(suscribir, leer, () => 1);
}
