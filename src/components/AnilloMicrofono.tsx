"use client";

import { sonar } from "@/lib/sonidos";

/**
 * El anillo alrededor del micrófono (opción A, elegida el 28 de octubre
 * de 2026): mientras el micrófono se abre, se llena en azul; cuando de
 * verdad empieza a grabar, se completa en verde y suena un "tic" con una
 * vibración corta.
 *
 * Abrir el micrófono tarda entre 0,3 y más de un segundo en el celular, y
 * el alumno empezaba a hablar apenas tocaba: lo que decía en ese tiempo
 * no quedaba grabado y la transcripción salía sin el comienzo. El anillo
 * no adivina cuánto falta: avanza hasta casi lleno y se completa solo
 * cuando la grabación arranca (globals.css: anillo-prepara, anillo-listo).
 */
export function AnilloMicrofono({
  estado,
  colores,
}: {
  estado: "preparando" | "grabando" | null;
  /** Los de la pantalla, si no son el azul y el verde (Hablar: verde y rojo). */
  colores?: { preparando: string; grabando: string };
}) {
  if (!estado) return null;
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-2 -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--borde)" strokeWidth="5" />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="100"
        className={estado === "preparando" ? "anillo-prepara" : "anillo-listo"}
        style={colores ? { stroke: estado === "preparando" ? colores.preparando : colores.grabando } : undefined}
      />
    </svg>
  );
}

/** Ya graba: el "tic" (si los sonidos están activos) y una vibración corta donde se pueda. */
export function avisarMicrofonoListo() {
  sonar("listo");
  try {
    navigator.vibrate?.(30);
  } catch {
    // Sin vibración (iPhone, computador): basta el anillo y el tic.
  }
}
