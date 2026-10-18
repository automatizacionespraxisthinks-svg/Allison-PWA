"use client";

import Link from "next/link";
import { useState } from "react";
import type { Nivel } from "@/lib/tipos";
import { Icono } from "./Iconos";
import { Repite } from "./leccion/Repite";

/**
 * "Practicarla" en el resumen de una escena: la frase mejor se repite
 * con la misma actividad de Repite (pronunciación palabra por palabra).
 * El servidor toma la frase de la escena del alumno, no del navegador.
 */
export function Practicarla({ conversacion, frase, nivel, nombre }: { conversacion: string; frase: string; nivel: Nivel; nombre: string }) {
  const [abierta, setAbierta] = useState(false);
  const [hecha, setHecha] = useState(false);
  const [sinSaldo, setSinSaldo] = useState(false);

  if (hecha) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-extrabold text-menta">
        <Icono nombre="check" className="size-4 stroke-[3]" />
        ¡Practicada!
      </span>
    );
  }
  if (!abierta) {
    return (
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="inline-flex items-center gap-1.5 self-start rounded-full bg-oro px-3.5 py-2 text-[13px] font-extrabold text-superficie"
      >
        <Icono nombre="mic" className="size-4" />
        Practicarla
      </button>
    );
  }
  return (
    <div className="mt-1 rounded-2xl bg-superficie p-3 text-texto">
      <Repite
        a={{ tipo: "repite", paso: 0, frase, queAparece: "", siRespondeMal: "" }}
        ctx={{ parada: "", leccion: 0, nivel, nombre, escena: conversacion }}
        onTerminar={() => setHecha(true)}
        onSinSaldo={() => setSinSaldo(true)}
      />
      {sinSaldo && (
        <p role="alert" className="mt-2 text-center text-sm font-bold text-oro">
          Te quedaste sin intervenciones.{" "}
          <Link href="/recargar" className="underline">
            Recargar
          </Link>
        </p>
      )}
    </div>
  );
}
