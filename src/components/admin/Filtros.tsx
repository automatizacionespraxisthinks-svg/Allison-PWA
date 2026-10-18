"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export interface CampoFiltro {
  nombre: string;
  etiqueta: string;
  /** Sin opciones: un campo de texto (buscar) o de fecha. */
  opciones?: { valor: string; texto: string }[];
  tipo?: "texto" | "fecha";
  /** Al cambiarlo se borran estos otros (el curso, al cambiar de colegio). */
  borra?: string[];
}

/**
 * Los filtros de una sección del panel. Viven en la dirección (se puede
 * compartir, volver atrás funciona y la página se arma en el servidor);
 * cambiar uno vuelve a la página 1.
 */
export function Filtros({ campos }: { campos: CampoFiltro[] }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [cargando, empezar] = useTransition();
  const [texto, setTexto] = useState<Record<string, string>>(() =>
    Object.fromEntries(campos.filter((c) => c.tipo === "texto").map((c) => [c.nombre, params.get(c.nombre) ?? ""]))
  );

  function poner(cambios: Record<string, string>, borra: string[] = []) {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    for (const b of borra) q.delete(b);
    q.delete("pagina");
    empezar(() => router.replace(`${ruta}?${q.toString()}`));
  }

  // El buscador espera a que se deje de escribir.
  useEffect(() => {
    const t = setTimeout(() => {
      const cambios = Object.fromEntries(Object.entries(texto).filter(([k, v]) => (params.get(k) ?? "") !== v));
      if (Object.keys(cambios).length) poner(cambios);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className={`flex flex-wrap items-end gap-2 ${cargando ? "opacity-60" : ""}`}>
      {campos.map((c) => (
        <label key={c.nombre} className="flex flex-col gap-1 text-xs text-texto-suave">
          {c.etiqueta}
          {c.opciones ? (
            <select
              value={params.get(c.nombre) ?? c.opciones[0]?.valor ?? ""}
              onChange={(e) => poner({ [c.nombre]: e.target.value }, c.borra)}
              className="h-10 min-w-36 rounded-xl border border-borde bg-superficie px-3 text-sm text-texto"
            >
              {c.opciones.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.texto}
                </option>
              ))}
            </select>
          ) : c.tipo === "fecha" ? (
            <input
              type="date"
              value={params.get(c.nombre) ?? ""}
              onChange={(e) => poner({ [c.nombre]: e.target.value })}
              className="h-10 rounded-xl border border-borde bg-superficie px-3 text-sm text-texto"
            />
          ) : (
            <input
              type="search"
              value={texto[c.nombre] ?? ""}
              onChange={(e) => setTexto((t) => ({ ...t, [c.nombre]: e.target.value }))}
              placeholder="Buscar alumno…"
              className="h-10 w-56 rounded-xl border border-borde bg-superficie px-3 text-sm text-texto"
            />
          )}
        </label>
      ))}
    </div>
  );
}
