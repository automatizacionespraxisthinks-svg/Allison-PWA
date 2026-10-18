"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Ajustes } from "@/lib/ajustes";
import { pedir } from "@/lib/pedir";

type Numerico = Exclude<keyof Ajustes, "recordatorioCorreo" | "recordatorioCelular" | "fechaVersionNueva">;

const CAMPOS: { clave: Numerico; titulo: string; unidad: string; nota?: string; min: number; max: number }[] = [
  { clave: "dolarCop", titulo: "Valor del dólar para calcular costos", unidad: "pesos", nota: "Antes fijo en $4.000.", min: 1000, max: 20000 },
  { clave: "diasDescansoRacha", titulo: "Días de descanso de la racha", unidad: "días", nota: "Saltarse estos días no la reinicia.", min: 0, max: 7 },
  { clave: "alertaInactivoDias", titulo: "Alerta de alumno inactivo", unidad: "días sin actividad", min: 1, max: 90 },
  { clave: "alertaSaldoColegioPct", titulo: "Alerta de saldo bajo de un colegio o curso", unidad: "% del último saldo asignado", min: 1, max: 100 },
  { clave: "alertaReporteDias", titulo: "Alerta de reporte sin revisar", unidad: "días", min: 1, max: 60 },
  { clave: "alertaParadaIntervenciones", titulo: "Alerta de parada que gasta de más", unidad: "intervenciones", min: 10, max: 500 },
];

/** Ajustes del panel (plan, sección 21; boceto 8). */
export function FormAjustes({ inicial, cambiados }: { inicial: Ajustes; cambiados: Record<string, string> }) {
  const router = useRouter();
  const [v, setV] = useState(inicial);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setAviso(null);
    setError(null);
    const r = await pedir("/api/admin/ajustes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(false);
    if (!r?.ok) return setError(d.error ?? "No se pudieron guardar.");
    setAviso("Ajustes guardados.");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <section className="divide-y divide-borde rounded-2xl border border-borde bg-superficie">
        {CAMPOS.map((c) => (
          <label key={c.clave} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <span className="min-w-0">
              <b className="block text-sm">{c.titulo}</b>
              {(c.nota || cambiados[c.clave]) && (
                <span className="text-xs text-texto-suave">{[c.nota, cambiados[c.clave]].filter(Boolean).join(" ")}</span>
              )}
            </span>
            <span className="flex items-center gap-2 text-sm text-texto-suave">
              <input
                type="number"
                min={c.min}
                max={c.max}
                required
                value={v[c.clave]}
                onChange={(e) => setV((x) => ({ ...x, [c.clave]: Number(e.target.value) }))}
                className="h-10 w-28 rounded-xl border border-borde bg-superficie px-3 text-right text-texto"
              />
              {c.unidad}
            </span>
          </label>
        ))}
        <label className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <span className="min-w-0">
            <b className="block text-sm">Recordatorio por correo</b>
            <span className="text-xs text-texto-suave">
              Cuando la racha está por perderse; la hora la elige cada alumno en su Perfil. {cambiados.recordatorioCorreo ?? ""}
            </span>
          </span>
          <span className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.recordatorioCorreo}
              onChange={(e) => setV((x) => ({ ...x, recordatorioCorreo: e.target.checked }))}
              className="size-5 accent-[var(--primario)]"
            />
            {v.recordatorioCorreo ? "Activado" : "Apagado"}
          </span>
        </label>
        <label className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <span className="min-w-0">
            <b className="block text-sm">Recordatorio en el celular</b>
            <span className="text-xs text-texto-suave">
              El mismo aviso, como notificación, para quien la activó en su celular; ese día no le llega el correo. Es el único
              recordatorio de los alumnos de colegio, que no tienen correo. {cambiados.recordatorioCelular ?? ""}
            </span>
          </span>
          <span className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.recordatorioCelular}
              onChange={(e) => setV((x) => ({ ...x, recordatorioCelular: e.target.checked }))}
              className="size-5 accent-[var(--primario)]"
            />
            {v.recordatorioCelular ? "Activado" : "Apagado"}
          </span>
        </label>
        <label className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <span className="min-w-0">
            <b className="block text-sm">Fecha de la versión nueva</b>
            <span className="text-xs text-texto-suave">
              El día que Mi ruta salió a producción: parte la retención del Resumen en «antes» y «después de los cambios».{" "}
              {cambiados.fechaVersionNueva ?? ""}
            </span>
          </span>
          <input
            type="date"
            value={v.fechaVersionNueva ?? ""}
            onChange={(e) => setV((x) => ({ ...x, fechaVersionNueva: e.target.value || null }))}
            className="h-10 rounded-xl border border-borde bg-superficie px-3 text-sm"
          />
        </label>
      </section>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={ocupado} className="rounded-xl bg-primario px-6 py-2.5 font-semibold text-white disabled:opacity-50">
          {ocupado ? "Guardando…" : "Guardar ajustes"}
        </button>
        {aviso && <span className="text-sm font-semibold text-exito">{aviso}</span>}
        {error && (
          <span role="alert" className="text-sm text-error">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
