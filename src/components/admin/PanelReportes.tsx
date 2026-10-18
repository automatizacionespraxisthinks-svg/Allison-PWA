"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pedir } from "@/lib/pedir";
import type { DecisionReporte, Reporte } from "@/lib/reportes";

/** Días que puede esperar un reporte antes de la alerta (Ajustes, punto 16). */
const DIAS_ALERTA = 3;

const TIPO: Record<string, string> = {
  pronunciacion: "Pronunciación",
  gramatica: "Gramática",
  vocabulario: "Vocabulario",
  naturalidad: "Naturalidad",
};

export function PanelReportes({
  abiertos,
  resueltos,
}: {
  abiertos: Reporte[];
  resueltos: Reporte[];
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decidir(id: string, decision: DecisionReporte) {
    setTrabajando(id);
    setError(null);
    const r = await pedir("/api/admin/reportes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    setTrabajando(null);
    if (!r?.ok) {
      const d = await r?.json().catch(() => null);
      setError(d?.error ?? "No se pudo guardar la decisión.");
    }
    router.refresh();
  }

  const atrasados = abiertos.filter((r) => r.dias > DIAS_ALERTA).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Reportes de correcciones</h1>
        <p className="mt-1 text-sm text-texto-suave">
          Si Allison se equivocó, se le devuelve 1 intervención al alumno y recibe un aviso. Si la
          corrección era buena, no se devuelve nada y el alumno ve la explicación.
        </p>
      </div>

      {atrasados > 0 && (
        <p className="rounded-xl bg-acento/10 px-3 py-2 text-sm font-semibold text-acento">
          {atrasados} {atrasados === 1 ? "reporte lleva" : "reportes llevan"} más de {DIAS_ALERTA}{" "}
          días sin revisar.
        </p>
      )}
      {error && <p className="text-sm font-semibold text-error">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-texto-suave">
          Por revisar ({abiertos.length})
        </h2>
        {abiertos.length === 0 && (
          <p className="rounded-xl border border-borde px-4 py-6 text-center text-sm text-texto-suave">
            No hay reportes abiertos.
          </p>
        )}
        {abiertos.map((r) => (
          <article key={r.id} className="space-y-2 rounded-xl border border-borde bg-superficie p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-texto-suave">
              <span>
                <b className="text-texto">{r.alumno}</b>
                {r.nivel && ` · ${r.nivel}`} · {TIPO[r.tipo] ?? r.tipo}
              </span>
              <span className={r.dias > DIAS_ALERTA ? "font-semibold text-acento" : ""}>
                hace {r.dias === 0 ? "menos de un día" : `${r.dias} ${r.dias === 1 ? "día" : "días"}`}
              </span>
            </div>
            <p className="text-sm">
              <span className="text-texto-suave">El alumno dijo: </span>
              &ldquo;{r.textoAlumno}&rdquo;
            </p>
            <p className="text-sm">
              <span className="text-error line-through">{r.original}</span>
              <span className="mx-1.5 text-texto-suave">→</span>
              <span className="font-medium text-exito">{r.correccion}</span>
              {r.explicacion && <span className="block text-texto-suave">{r.explicacion}</span>}
            </p>
            {r.respuestaAllison && (
              <p className="text-sm">
                <span className="text-texto-suave">Allison respondió: </span>
                &ldquo;{r.respuestaAllison}&rdquo;
              </p>
            )}
            {r.comentario && (
              <p className="text-sm">
                <span className="text-texto-suave">Comentario: </span>
                {r.comentario}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={trabajando === r.id}
                onClick={() => decidir(r.id, "allison_se_equivoco")}
                className="rounded-lg bg-primario px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Allison se equivocó · devolver 1 intervención
              </button>
              <button
                type="button"
                disabled={trabajando === r.id}
                onClick={() => decidir(r.id, "correccion_buena")}
                className="rounded-lg border border-borde px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
              >
                La corrección era buena
              </button>
            </div>
          </article>
        ))}
      </section>

      {resueltos.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-texto-suave">
            Últimos resueltos
          </h2>
          <div className="overflow-x-auto rounded-xl border border-borde">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-superficie-2 text-xs text-texto-suave">
                <tr>
                  <th className="px-3 py-2">Alumno</th>
                  <th className="px-3 py-2">Corrección</th>
                  <th className="px-3 py-2">Decisión</th>
                </tr>
              </thead>
              <tbody>
                {resueltos.map((r) => (
                  <tr key={r.id} className="border-t border-borde">
                    <td className="px-3 py-2">{r.alumno}</td>
                    <td className="px-3 py-2">
                      {r.original} → {r.correccion}
                    </td>
                    <td className="px-3 py-2">
                      {r.estado === "allison_se_equivoco"
                        ? "Allison se equivocó · devuelta"
                        : "Corrección buena"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
