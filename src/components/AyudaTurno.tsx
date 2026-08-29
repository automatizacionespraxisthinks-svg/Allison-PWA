"use client";

import { useState } from "react";
import type { Nivel } from "@/lib/tipos";

interface Ayuda {
  traduccion: string;
  sugerencia: string;
  sugerenciaEs: string;
}

/**
 * "No sé qué decir": la salida cuando el alumno se queda en blanco.
 *
 * Quedó como único botón de esta fila: el audio y su velocidad viven
 * ahora en cada mensaje, y la traducción se abre tocando el texto.
 * Este es distinto — no pregunta por lo que Allison dijo, sino por lo
 * que el alumno podría responder.
 *
 * No cuesta un mensaje: cobrarle por no saber qué decir sería
 * castigarlo justo cuando más necesita seguir.
 */
export function AyudaTurno({
  texto,
  nivel,
}: {
  texto: string;
  nivel: Nivel;
}) {
  const [ayuda, setAyuda] = useState<Ayuda | null>(null);
  const [abierta, setAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  async function pedir() {
    if (abierta) {
      setAbierta(false);
      return;
    }
    if (ayuda) {
      setAbierta(true);
      return;
    }

    setError(false);
    setCargando(true);
    const r = await fetch("/api/ayuda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, nivel }),
    });
    setCargando(false);

    if (!r.ok) {
      setError(true);
      return;
    }
    setAyuda(await r.json());
    setAbierta(true);
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <button
        type="button"
        onClick={pedir}
        disabled={cargando}
        aria-expanded={abierta}
        className="flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-4 py-2 text-sm font-medium text-texto-suave transition hover:bg-superficie-2 disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
        </svg>
        {cargando ? "Pensando…" : "No sé qué decir"}
      </button>

      {error && (
        <p className="text-sm text-error">No pudimos traerlo. Intenta otra vez.</p>
      )}

      {abierta && ayuda && (
        <div className="w-full rounded-2xl border border-primario/30 bg-primario/5 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primario">
            Podrías decir
          </p>
          <p className="mt-1 text-lg font-medium">{ayuda.sugerencia}</p>
          <p className="mt-1 text-sm text-texto-suave">{ayuda.sugerenciaEs}</p>
          <p className="mt-2 text-xs text-texto-suave">
            Léelo en voz alta con el botón de grabar. No lo copies: dilo.
          </p>
        </div>
      )}
    </div>
  );
}
