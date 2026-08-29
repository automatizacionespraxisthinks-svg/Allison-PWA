"use client";

import { useState } from "react";
import type { Nivel } from "@/lib/tipos";

/**
 * Un texto de Allison que se traduce al tocarlo.
 *
 * La traducción vive en el mensaje, no en un botón aparte al fondo de
 * la pantalla: el alumno toca LO QUE no entendió, donde lo está viendo.
 * Se pide una sola vez y queda guardada; volver a tocar la oculta.
 */
export function TextoTraducible({
  texto,
  nivel,
  className,
  classNameTraduccion,
}: {
  texto: string;
  nivel: Nivel;
  className?: string;
  classNameTraduccion?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const [traduccion, setTraduccion] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function alternar() {
    if (abierta) {
      setAbierta(false);
      return;
    }
    if (traduccion) {
      setAbierta(true);
      return;
    }

    setCargando(true);
    try {
      const r = await fetch("/api/ayuda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, nivel }),
      });
      if (r.ok) {
        const d = await r.json();
        setTraduccion(d.traduccion || "No pudimos traducirlo.");
        setAbierta(true);
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierta}
        title={abierta ? "Ocultar la traducción" : "Toca para ver la traducción"}
        className={`min-w-0 cursor-pointer text-left ${className ?? ""} ${
          cargando ? "opacity-60" : ""
        }`}
      >
        {texto}
      </button>
      {abierta && traduccion && (
        <p className={classNameTraduccion ?? "mt-1.5 text-sm opacity-80"}>
          {traduccion}
        </p>
      )}
    </>
  );
}
