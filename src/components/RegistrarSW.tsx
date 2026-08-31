"use client";

import { useEffect } from "react";

/**
 * Registra el service worker.
 *
 * Sin él, el navegador no ofrece instalar la aplicación: es requisito,
 * no adorno. Se registra después de "load" para no competir por la red
 * con lo que el alumno está esperando ver.
 *
 * Se registra TAMBIÉN en desarrollo, a propósito: si no, la
 * instalación no se puede probar en un celular real contra el servidor
 * de desarrollo, que es justo donde hay que probarla. Es seguro porque
 * el service worker no cachea páginas, código ni respuestas de la API
 * — solo tres imágenes que no cambian.
 */
export function RegistrarSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Si falla, la app funciona igual: solo se pierde la
        // instalación y la pantalla de sin conexión.
      });
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });

    return () => window.removeEventListener("load", registrar);
  }, []);

  return null;
}
