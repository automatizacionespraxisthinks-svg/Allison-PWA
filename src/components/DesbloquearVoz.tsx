"use client";

import { useEffect } from "react";
import { desbloquearVoz } from "@/lib/voz";

/**
 * Desbloquea la voz de Allison con el PRIMER toque del alumno en la app,
 * sea donde sea.
 *
 * El celular solo deja sonar audio que empezó con un gesto. Las
 * actividades que abren solas (la Entrevista, Adivina, Enséñale) y las
 * escenas, cuya primera línea llega segundos después del toque, salían
 * mudas: Allison no hablaba hasta que el alumno tocaba ▶ (prueba en
 * producción, octubre de 2026). Con esto, el toque que lo trajo hasta
 * ahí (el enlace del menú, "Empezar") ya deja el audio listo.
 *
 * Se escucha click, touchend y keydown: son los que el navegador cuenta
 * como gesto (pointerdown no, en Chrome con el dedo). desbloquearVoz()
 * no hace nada si ya está desbloqueada, así que no se quita.
 */
export function DesbloquearVoz() {
  useEffect(() => {
    const eventos = ["click", "touchend", "keydown"] as const;
    for (const e of eventos) window.addEventListener(e, desbloquearVoz, { capture: true, passive: true });
    return () => {
      for (const e of eventos) window.removeEventListener(e, desbloquearVoz, { capture: true });
    };
  }, []);

  return null;
}
