"use client";

import { useState } from "react";
import { pedir } from "@/lib/pedir";
import type { AvisoReporte } from "@/lib/reportes";

/**
 * El aviso de la decisión sobre una corrección que el alumno reportó.
 *
 * Si Allison se equivocó: se le devolvió la intervención y se le dan
 * las gracias. Si la corrección era buena: se le muestra por qué, que
 * también es aprender. Al cerrarlo no vuelve a salir.
 */
export function AvisoReportes({ avisos }: { avisos: AvisoReporte[] }) {
  const [visibles, setVisibles] = useState(avisos);
  if (visibles.length === 0) return null;

  function cerrar() {
    const ids = visibles.map((a) => a.id);
    setVisibles([]);
    void pedir("/api/reportes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  return (
    <div role="status" className="mb-2 shrink-0 space-y-2 rounded-xl border border-borde bg-superficie px-3 py-2.5 text-sm">
      {visibles.map((a) =>
        a.decision === "allison_se_equivoco" ? (
          <p key={a.id} className="leading-snug">
            <span className="font-semibold text-exito">Tenías razón:</span> revisamos tu reporte
            sobre &ldquo;{a.original}&rdquo; y te devolvimos la intervención. ¡Gracias por ayudarnos
            a mejorar a Allison!
          </p>
        ) : (
          <p key={a.id} className="leading-snug">
            <span className="font-semibold">Revisamos tu reporte:</span> la corrección de
            &ldquo;{a.original}&rdquo; a &ldquo;{a.correccion}&rdquo; estaba bien.
            {a.explicacion && <span className="text-texto-suave"> {a.explicacion}</span>}
          </p>
        )
      )}
      <button type="button" onClick={cerrar} className="text-xs font-semibold text-primario">
        Entendido
      </button>
    </div>
  );
}
