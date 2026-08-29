"use client";

import { useEffect, useState } from "react";
import type { Mensaje, Nivel, TipoCorreccion } from "@/lib/tipos";
import { useVelocidad } from "@/lib/velocidad";

const ETIQUETA: Record<TipoCorreccion, string> = {
  pronunciacion: "Pronunciación",
  gramatica: "Gramática",
  vocabulario: "Vocabulario",
  naturalidad: "Naturalidad",
};

/**
 * La transcripción, visible solo cuando el alumno la pide.
 *
 * El texto del alumno se muestra TAL COMO LO DIJO, con sus errores
 * intactos. Corregirlo aquí escondería justo lo que tiene que aprender
 * a ver.
 *
 * Cada mensaje de Allison lleva un botón para volver a oírlo: antes
 * solo se podía repetir el último, y una frase de hace cinco turnos
 * quedaba muda para siempre. Respeta el nivel y la velocidad elegida.
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

  return (
    <div className="w-full space-y-4">
      {mensajes.map((m) => (
        <div
          key={m.id}
          className={m.rol === "alumno" ? "flex justify-end" : "flex justify-start"}
        >
          <div
            className={`relative max-w-[85%] rounded-2xl px-4 py-3 ${
              m.rol === "alumno"
                ? "bg-superficie-2 text-texto"
                : "bg-primario text-white"
            }`}
          >
            {m.rol === "allison" ? (
              <div className="flex items-start gap-2.5">
                <p className="min-w-0 text-[15px] leading-relaxed">{m.texto}</p>
                <button
                  type="button"
                  onClick={() => reproducir(m)}
                  aria-label={
                    sonando === m.id ? "Detener el audio" : "Volver a escuchar"
                  }
                  title={sonando === m.id ? "Detener" : "Volver a escuchar"}
                  className="mt-0.5 shrink-0 rounded-full bg-white/15 p-1.5 transition hover:bg-white/30"
                >
                  {sonando === m.id ? (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed">{m.texto}</p>
            )}

            {m.correcciones.length > 0 && (
              <ul className="mt-3 space-y-2.5 border-t border-borde pt-3">
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
      ))}
    </div>
  );
}
