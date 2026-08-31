"use client";

import { useEffect, useState } from "react";

/**
 * Estado de instalación de la PWA.
 *
 * Tres caminos distintos, porque los navegadores no se ponen de
 * acuerdo:
 *
 * - Android/Chrome/Edge: avisan con "beforeinstallprompt" y dejan
 *   lanzar el diálogo del sistema. Es el camino bueno.
 * - iPhone/Safari: NO existe ese evento. La única forma es que la
 *   persona use Compartir → "Añadir a inicio". Sin instrucciones, el
 *   usuario de iPhone simplemente no instala nunca.
 * - Ya instalada: no se muestra nada.
 *
 * El evento llega UNA vez y hay que guardarlo: si no se retiene, para
 * cuando el alumno toca el botón ya no hay nada que lanzar.
 */

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type ModoInstalacion = "listo" | "ios" | "instalada" | "no_disponible";

let guardado: EventoInstalacion | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

/** ¿Ya está corriendo instalada, fuera del navegador? */
function yaInstalada(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari en iOS usa su propia bandera, no display-mode.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function esIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // El iPad moderno se anuncia como Mac: se distingue por el táctil.
  const iPadNuevo = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadNuevo;
}

export function useInstalacion(): {
  modo: ModoInstalacion;
  instalar: () => Promise<boolean>;
} {
  // Arranca en "no_disponible" para que el servidor y el navegador
  // pinten lo mismo: decidir antes de hidratar provoca un parpadeo.
  const [modo, setModo] = useState<ModoInstalacion>("no_disponible");

  useEffect(() => {
    const revisar = () => {
      if (yaInstalada()) return setModo("instalada");
      if (guardado) return setModo("listo");
      if (esIOS()) return setModo("ios");
      setModo("no_disponible");
    };

    const alPoder = (e: Event) => {
      // Sin esto, Chrome muestra su propia barra y perdemos el control
      // de cuándo y cómo se ofrece la instalación.
      e.preventDefault();
      guardado = e as EventoInstalacion;
      avisar();
    };

    const alInstalar = () => {
      guardado = null;
      avisar();
    };

    oyentes.add(revisar);
    window.addEventListener("beforeinstallprompt", alPoder);
    window.addEventListener("appinstalled", alInstalar);
    revisar();

    return () => {
      oyentes.delete(revisar);
      window.removeEventListener("beforeinstallprompt", alPoder);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  async function instalar(): Promise<boolean> {
    if (!guardado) return false;
    const evento = guardado;
    // Se suelta ANTES de esperar la respuesta: el evento sirve una sola
    // vez, y retenerlo dejaría un botón que no hace nada.
    guardado = null;
    try {
      await evento.prompt();
      const { outcome } = await evento.userChoice;
      avisar();
      return outcome === "accepted";
    } catch {
      avisar();
      return false;
    }
  }

  return { modo, instalar };
}
