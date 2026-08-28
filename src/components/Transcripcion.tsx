"use client";

import type { Mensaje, TipoCorreccion } from "@/lib/tipos";

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
 */
export function Transcripcion({ mensajes }: { mensajes: Mensaje[] }) {
  return (
    <div className="w-full space-y-4">
      {mensajes.map((m) => (
        <div
          key={m.id}
          className={m.rol === "alumno" ? "flex justify-end" : "flex justify-start"}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              m.rol === "alumno"
                ? "bg-superficie-2 text-texto"
                : "bg-primario text-white"
            }`}
          >
            <p className="text-[15px] leading-relaxed">{m.texto}</p>

            {m.correcciones.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-borde pt-3">
                {m.correcciones.map((c, i) => (
                  <li key={i} className="text-sm">
                    <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-texto-suave">
                      {ETIQUETA[c.tipo]}
                    </span>
                    <span className="text-error line-through">{c.original}</span>
                    <span className="mx-1.5 text-texto-suave">→</span>
                    <span className="font-medium text-exito">{c.correccion}</span>
                    <span className="mt-0.5 block text-texto-suave">
                      {c.explicacion}
                    </span>
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
