import { useSyncExternalStore } from "react";

/**
 * El volumen del micrófono mientras el alumno habla, para el anillo verde
 * de Allison (avatar, opción B). Vive fuera de React: así solo se vuelve
 * a pintar la foto de Allison, no toda la pantalla diez veces por segundo.
 */
let volumenActual: number | null = null;
const oyentes = new Set<() => void>();

/** Lo avisa el micrófono (0 a 1); null cuando deja de grabar. */
export function fijarVolumen(v: number | null) {
  if (v === volumenActual) return;
  volumenActual = v;
  oyentes.forEach((o) => o());
}

export function useVolumenGrabacion(): number | null {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => volumenActual,
    () => null
  );
}
