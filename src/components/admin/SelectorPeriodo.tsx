"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * El periodo que mira el panel.
 *
 * Los atajos son enlaces de verdad y no botones con estado: así el
 * periodo vive en la dirección, se puede compartir, volver atrás
 * funciona, y la página se arma en el servidor sin traerse los datos
 * de todos los periodos por si acaso.
 */
const ATAJOS = [
  { clave: "hoy", texto: "Hoy" },
  { clave: "semana", texto: "7 días" },
  { clave: "mes", texto: "Este mes" },
  { clave: "anio", texto: "Este año" },
] as const;

export function SelectorPeriodo({
  activo,
  desde,
  hasta,
}: {
  activo: string;
  desde: string;
  hasta: string;
}) {
  const router = useRouter();
  const [d, setD] = useState(desde);
  const [h, setH] = useState(hasta);
  const [cargando, empezar] = useTransition();

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    if (!d || !h || d > h) return;
    empezar(() => router.push(`/admin/uso?periodo=rango&desde=${d}&hasta=${h}`));
  }

  const chip =
    "rounded-full px-3 py-1.5 text-sm font-medium transition border";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-4">
      <div className="flex flex-wrap gap-2">
        {ATAJOS.map((a) => (
          <Link
            key={a.clave}
            href={`/admin/uso?periodo=${a.clave}`}
            className={`${chip} ${
              activo === a.clave
                ? "border-primario bg-primario text-white"
                : "border-borde text-texto-suave hover:bg-superficie-2"
            }`}
          >
            {a.texto}
          </Link>
        ))}
      </div>

      <form onSubmit={aplicar} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-texto-suave">
          Desde
          <input
            type="date"
            value={d}
            max={h}
            onChange={(e) => setD(e.target.value)}
            className="h-10 rounded-xl border border-borde bg-fondo px-3 text-sm text-texto outline-none focus:border-primario"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-texto-suave">
          Hasta
          <input
            type="date"
            value={h}
            min={d}
            onChange={(e) => setH(e.target.value)}
            className="h-10 rounded-xl border border-borde bg-fondo px-3 text-sm text-texto outline-none focus:border-primario"
          />
        </label>
        <button
          type="submit"
          disabled={cargando || !d || !h || d > h}
          className={`${chip} h-10 border-primario bg-primario text-white disabled:opacity-40`}
        >
          {cargando ? "Cargando…" : "Ver rango"}
        </button>
      </form>
    </div>
  );
}
