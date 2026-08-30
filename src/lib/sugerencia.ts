"use client";

import { useSyncExternalStore } from "react";

/**
 * El "ahora no" de la sugerencia de nivel.
 *
 * Si el alumno la descarta, no se le repite en este dispositivo
 * mientras siga en ese nivel: insistir cada visita convierte una
 * felicitación en una molestia. Va en localStorage y no en la base a
 * propósito — es una preferencia de pantalla, y si el navegador la
 * pierde, volver a ver una sugerencia merecida no hace daño.
 *
 * useSyncExternalStore por lo de siempre: localStorage no existe en el
 * servidor, y en el servidor la sugerencia arranca OCULTA para que no
 * parpadee al hidratar.
 */
const clave = (nivel: string) => `allison:ascenso-visto-${nivel}`;

const oyentes = new Set<() => void>();

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

export function descartarAscenso(nivel: string): void {
  try {
    localStorage.setItem(clave(nivel), "1");
  } catch {
    // Sin almacenamiento la verá otra vez. No es grave.
  }
  for (const avisar of oyentes) avisar();
}

/** ¿Ya descartó la sugerencia estando en este nivel? */
export function useAscensoDescartado(nivel: string): boolean {
  return useSyncExternalStore(
    suscribir,
    () => {
      try {
        return localStorage.getItem(clave(nivel)) !== null;
      } catch {
        return false;
      }
    },
    () => true
  );
}
