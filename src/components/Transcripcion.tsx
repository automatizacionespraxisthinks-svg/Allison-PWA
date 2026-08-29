"use client";

import { useEffect, useState } from "react";
import type { Mensaje, Nivel, TipoCorreccion } from "@/lib/tipos";
import { fijarVelocidad, useVelocidad, VELOCIDADES } from "@/lib/velocidad";

const ETIQUETA: Record<TipoCorreccion, string> = {
  pronunciacion: "Pronunciación",
  gramatica: "Gramática",
  vocabulario: "Vocabulario",
  naturalidad: "Naturalidad",
};

/** Alturas fijas de la onda decorativa: siempre la misma, sin azar. */
const ONDA = [7, 12, 9, 15, 11, 16, 8, 13, 10];

/**
 * El chat con Allison.
 *
 * El texto del alumno se muestra TAL COMO LO DIJO, con sus errores
 * intactos — corregirlo aquí escondería justo lo que tiene que aprender
 * a ver. Cada mensaje de Allison lleva UNA fila de controles: audio,
 * onda, velocidad y traducción. Nada de tres pisos de botones por
 * mensaje: el lujo es la contención.
 */
export function Transcripcion({
  mensajes,
  nivel = "B1",
}: {
  mensajes: Mensaje[];
  nivel?: Nivel;
}) {
  const velocidad = useVelocidad();
  const [sonando, setSonando] = useState<string | null>(null);
  const [traducciones, setTraducciones] = useState<Record<string, string>>({});
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});
  const [traduciendo, setTraduciendo] = useState<string | null>(null);

  // Si el alumno se va de la pantalla, la voz no sigue hablando sola
  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  function reproducir(m: Mensaje) {
    if (!window.speechSynthesis) return;

    if (sonando === m.id) {
      window.speechSynthesis.cancel();
      setSonando(null);
      return;
    }

    const voz = new SpeechSynthesisUtterance(m.texto);
    voz.lang = "en-US";
    const base = nivel === "A1" ? 0.8 : nivel === "A2" ? 0.9 : 1;
    voz.rate = base * velocidad;
    voz.onend = () => setSonando(null);
    voz.onerror = () => setSonando(null);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(voz);
    setSonando(m.id);
  }

  function cambiarVelocidad() {
    const i = VELOCIDADES.findIndex((v) => v.valor === velocidad);
    fijarVelocidad(VELOCIDADES[(i + 1) % VELOCIDADES.length].valor);
  }

  async function traducir(m: Mensaje) {
    if (abiertas[m.id]) {
      setAbiertas((a) => ({ ...a, [m.id]: false }));
      return;
    }
    if (traducciones[m.id]) {
      setAbiertas((a) => ({ ...a, [m.id]: true }));
      return;
    }

    setTraduciendo(m.id);
    try {
      const r = await fetch("/api/ayuda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: m.texto, nivel }),
      });
      if (r.ok) {
        const d = await r.json();
        setTraducciones((t) => ({ ...t, [m.id]: d.traduccion || "—" }));
        setAbiertas((a) => ({ ...a, [m.id]: true }));
      }
    } finally {
      setTraduciendo(null);
    }
  }

  return (
    <div className="w-full space-y-3">
      {mensajes.map((m) =>
        m.rol === "allison" ? (
          <div key={m.id} className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-borde bg-superficie px-4 py-3">
              <p className="text-[15px] leading-relaxed">{m.texto}</p>

              {/* Una sola fila: audio · onda · velocidad · traducción */}
              <div className="mt-2.5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => reproducir(m)}
                  aria-label={sonando === m.id ? "Detener el audio" : "Escuchar"}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primario text-white transition hover:brightness-110"
                >
                  {sonando === m.id ? (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <span className="flex h-5 items-center gap-[3px]" aria-hidden>
                  {ONDA.map((alto, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-primario/40"
                      style={{
                        height: alto,
                        transformOrigin: "center",
                        animation:
                          sonando === m.id
                            ? `barra-sonando 0.9s ease-in-out ${i * 0.08}s infinite`
                            : undefined,
                      }}
                    />
                  ))}
                </span>

                <button
                  type="button"
                  onClick={cambiarVelocidad}
                  aria-label={`Velocidad del audio: ${velocidad}×. Tocar para cambiar`}
                  title="Cambiar la velocidad"
                  className="shrink-0 rounded-full border border-borde px-2 py-0.5 font-mono text-[11px] font-semibold text-texto-suave transition hover:bg-superficie-2"
                >
                  {velocidad}×
                </button>

                <span className="flex-1" />

                <button
                  type="button"
                  onClick={() => traducir(m)}
                  disabled={traduciendo === m.id}
                  aria-expanded={Boolean(abiertas[m.id])}
                  className="shrink-0 text-xs font-semibold text-primario transition hover:opacity-75 disabled:opacity-40"
                >
                  {traduciendo === m.id
                    ? "Traduciendo…"
                    : abiertas[m.id]
                      ? "Ocultar"
                      : "Traducción"}
                </button>
              </div>

              {abiertas[m.id] && traducciones[m.id] && (
                <p className="mt-2 border-t border-borde pt-2 text-sm text-texto-suave">
                  {traducciones[m.id]}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primario-suave px-4 py-3 text-texto">
              <p className="text-[15px] leading-relaxed">{m.texto}</p>

              {m.correcciones.length > 0 && (
                <ul className="mt-3 space-y-2.5 border-t border-primario/15 pt-3">
                  {m.correcciones.map((c, i) => (
                    <li key={i} className="text-sm">
                      <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-texto-suave">
                        {ETIQUETA[c.tipo]}
                      </span>
                      <span className="text-error line-through">{c.original}</span>
                      <span className="mx-1.5 text-texto-suave">→</span>
                      <span className="font-medium text-exito">{c.correccion}</span>
                      <span className="mt-0.5 block text-texto">{c.explicacion}</span>
                      {c.explicacionEs && (
                        <span className="mt-0.5 block text-texto-suave">
                          {c.explicacionEs}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
