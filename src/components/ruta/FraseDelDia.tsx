"use client";

import Image from "next/image";
import { useState } from "react";
import type { Nivel } from "@/lib/tipos";
import { Icono } from "./Iconos";
import { useVoz } from "./leccion/comun";

/**
 * La frase del día (plan, sección 10): en el globo de Allison en Mi
 * ruta, con su audio y gratis. Al tocarla se ve qué significa.
 */
export function FraseDelDia({ frase, nivel }: { frase: { en: string; es: string }; nivel: Nivel }) {
  const { decir, hablando } = useVoz(nivel);
  const [ver, setVer] = useState(false);
  return (
    <div className="flex items-end gap-2.5">
      <Image
        src="/allison.png"
        alt=""
        width={36}
        height={36}
        className={`size-9 flex-none rounded-full object-cover ${hablando ? "aro-allison" : ""}`}
      />
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[18px_18px_18px_4px] bg-superficie-2 py-2 pr-2 pl-3.5">
        <button type="button" onClick={() => setVer((v) => !v)} className="min-w-0 flex-1 text-left leading-tight" aria-expanded={ver}>
          <small className="block text-[10.5px] font-extrabold tracking-[0.08em] text-primario uppercase">Frase del día</small>
          <b className="block text-[15px] font-black">{frase.en}</b>
          {ver ? (
            <span className="text-[13px] font-semibold text-texto-suave">{frase.es}</span>
          ) : (
            <span className="text-[12px] font-semibold text-texto-suave">Toca para ver qué significa</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => void decir(frase.en)}
          aria-label="Oír la frase del día"
          className="grid size-9 flex-none place-items-center rounded-full bg-primario text-white"
        >
          <Icono nombre="play" className="size-4" />
        </button>
      </div>
    </div>
  );
}
