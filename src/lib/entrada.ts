"use client";

import { useSyncExternalStore } from "react";

/**
 * Modo de entrada: voz o teclado.
 *
 * El teclado existe para el alumno con el micrófono dañado — en el
 * celular o en el computador. Se persiste en el dispositivo: quien lo
 * necesita lo necesita SIEMPRE en ese aparato, y obligarlo a activarlo
 * en cada visita sería recordarle el defecto cada día.
 *
 * useSyncExternalStore por lo mismo de siempre: localStorage no existe
 * en el servidor y cambiar estado en un efecto repinta en cascada.
 */
const CLAVE = "allison:modo-texto";

const oyentes = new Set<() => void>();

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

function leer(): boolean {
  try {
    return localStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

export function fijarModoTexto(activo: boolean): void {
  try {
    if (activo) localStorage.setItem(CLAVE, "1");
    else localStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento vale solo esta visita. No es grave.
  }
  for (const avisar of oyentes) avisar();
}

/** ¿Está en modo teclado? En el servidor siempre false (voz). */
export function useModoTexto(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}
