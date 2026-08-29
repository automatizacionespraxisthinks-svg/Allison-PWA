"use client";

import { useState } from "react";
import { fijarVelocidad, useVelocidad, VELOCIDADES } from "@/lib/velocidad";
import type { Nivel } from "@/lib/tipos";

interface Ayuda {
  traduccion: string;
  sugerencia: string;
  sugerenciaEs: string;
}

/**
 * Rescate cuando el alumno se queda bloqueado.
 *
 * Tres botones bajo lo último que dijo Allison: volver a oírlo, ver qué
 * significa, y ver qué podría responder.
 *
 * El bloqueo es el momento en que la gente cierra la app. Sin una salida
 * a mano, el alumno que no entendió simplemente se va — y no vuelve.
 * Por eso esta ayuda NO cuesta un mensaje: cobrarle por no haber
 * entendido sería castigarlo justo cuando más necesita seguir.
 */
export function AyudaTurno({
  texto,
  nivel,
  onRepetir,
  puedeRepetir,
}: {
  texto: string;
  nivel: Nivel;
  onRepetir: () => void;
  puedeRepetir: boolean;
}) {
  const [ayuda, setAyuda] = useState<Ayuda | null>(null);
  const [mostrando, setMostrando] = useState<"traduccion" | "sugerencia" | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);
  const velocidad = useVelocidad();

  async function pedir(que: "traduccion" | "sugerencia") {
    if (mostrando === que) {
      setMostrando(null);
      return;
    }
    if (ayuda) {
      setMostrando(que);
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
    setMostrando(que);
  }

  const boton =
    "flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1.5 text-sm text-texto-suave transition hover:bg-superficie-2 disabled:opacity-40";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRepetir}
          disabled={!puedeRepetir}
          className={boton}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5 6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          Repetir
        </button>

        <button
          type="button"
          onClick={() => {
            const i = VELOCIDADES.findIndex((v) => v.valor === velocidad);
            fijarVelocidad(VELOCIDADES[(i + 1) % VELOCIDADES.length].valor);
          }}
          title="Velocidad de la voz"
          className={boton}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 19V5l9 7-9 7zM2 19V5l9 7-9 7z" />
          </svg>
          {VELOCIDADES.find((v) => v.valor === velocidad)?.etiqueta}
        </button>

        <button
          type="button"
          onClick={() => pedir("traduccion")}
          disabled={cargando}
          aria-pressed={mostrando === "traduccion"}
          className={boton}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 8h9M9 4v4c0 4-2 6-5 7M12 20l4-9 4 9M13.5 17h5" />
          </svg>
          {cargando && mostrando === null ? "…" : "¿Qué dijo?"}
        </button>

        <button
          type="button"
          onClick={() => pedir("sugerencia")}
          disabled={cargando}
          aria-pressed={mostrando === "sugerencia"}
          className={boton}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
          </svg>
          No sé qué decir
        </button>
      </div>

      {error && (
        <p className="text-sm text-error">No pudimos traerlo. Intenta otra vez.</p>
      )}

      {mostrando === "traduccion" && ayuda && (
        <div className="w-full rounded-2xl bg-superficie-2 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            Te dijo
          </p>
          <p className="mt-1 text-[15px] leading-relaxed">{ayuda.traduccion}</p>
        </div>
      )}

      {mostrando === "sugerencia" && ayuda && (
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
