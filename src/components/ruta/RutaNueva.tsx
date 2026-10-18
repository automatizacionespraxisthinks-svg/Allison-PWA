"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Alumnos actuales (plan, sección 22): la primera vez que abren la
 * versión nueva no repiten la primera sesión. Allison les cuenta la
 * ruta nueva y dónde siguen, una sola vez.
 */
export function RutaNueva({ nombre, donde }: { nombre: string; donde: string | null }) {
  const [abierta, setAbierta] = useState(true);
  if (!abierta) return null;

  function cerrar() {
    setAbierta(false);
    void fetch("/api/ruta/inicio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "presentada" }),
    }).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="ruta-nueva">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-superficie p-6 text-center shadow-xl">
        <Image
          src="/allison.png"
          alt="Allison"
          width={96}
          height={96}
          className="respira size-24 rounded-full object-cover outline outline-[3px] outline-offset-[3px] outline-primario"
        />
        <h2 id="ruta-nueva" className="text-xl font-black text-balance">
          ¡Hola, {nombre.split(" ")[0]}! Tenemos una ruta nueva
        </h2>
        <p className="text-sm text-texto-suave">
          Ahora aprendes viajando: cada nivel es un país y cada parada una ciudad, con lecciones cortas, un escenario y su
          estampilla. Lo que ya hiciste quedó guardado: tu saldo, tu racha y tus conversaciones siguen igual, y las paradas que
          ya completaste aparecen como hechas.
        </p>
        {donde && <p className="rounded-2xl bg-primario-suave px-4 py-2 text-sm font-bold text-primario">Sigues en {donde}.</p>}
        <button
          type="button"
          autoFocus
          onClick={cerrar}
          className="degradado-primario sombra-accion w-full rounded-2xl px-6 py-3 font-extrabold text-white"
        >
          Ver mi ruta
        </button>
      </div>
    </div>
  );
}
