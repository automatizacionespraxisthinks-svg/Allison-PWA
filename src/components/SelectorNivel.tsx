"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { NIVELES, type Nivel } from "@/lib/tipos";
import { pedir } from "@/lib/pedir";

/**
 * Cambiar de nivel, cuando el alumno quiera.
 *
 * Sin permisos ni exámenes: si le queda grande baja, si le aburre sube.
 * Un nivel que no se puede cambiar deja al alumno atrapado en un
 * producto que dejó de servirle, y esa es una razón perfectamente buena
 * para dejar de pagar.
 */
export function SelectorNivel({ nivel }: { nivel: Nivel }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function cambiar(nuevo: Nivel) {
    if (nuevo === nivel) {
      setAbierto(false);
      return;
    }
    setOcupado(true);
    const r = await pedir("/api/nivel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nivel: nuevo }),
    });
    setOcupado(false);
    setAbierto(false);
    if (r?.ok) router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="flex items-center gap-1 rounded-full bg-primario-suave px-2.5 py-1 text-xs font-semibold text-primario transition hover:brightness-95"
      >
        Nivel {nivel}
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-borde bg-superficie p-2 shadow-lg">
            <p className="px-2 py-1.5 text-xs text-texto-suave">
              Cámbialo cuando quieras. Allison se adapta al instante.
            </p>
            {NIVELES.map((n) => (
              <button
                key={n.nivel}
                type="button"
                disabled={ocupado}
                onClick={() => cambiar(n.nivel)}
                className={`flex w-full items-baseline gap-2 rounded-xl px-3 py-2 text-left transition disabled:opacity-50 ${
                  n.nivel === nivel ? "bg-primario-suave" : "hover:bg-superficie-2"
                }`}
              >
                <span className="w-6 font-semibold">{n.nivel}</span>
                <span className="text-sm text-texto-suave">{n.etiqueta}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
