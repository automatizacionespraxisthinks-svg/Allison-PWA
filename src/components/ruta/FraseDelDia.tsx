"use client";

import Image from "next/image";
import { useState } from "react";
import type { Expresion } from "@/lib/expresiones";
import type { Nivel } from "@/lib/tipos";
import { Icono } from "./Iconos";
import { BotonOir, useVoz } from "./leccion/comun";

/**
 * La frase del día (plan, sección 10): en el globo de Allison en Mi
 * ruta, con su audio y gratis. Es una expresión de los nativos que no se
 * traduce palabra por palabra (src/lib/expresiones.ts): al tocarla se ve
 * lo que significa, lo que NO significa y un ejemplo para oír.
 */
export function FraseDelDia({ frase, nivel }: { frase: Expresion; nivel: Nivel }) {
  const { decir, hablando } = useVoz(nivel);
  const [ver, setVer] = useState(false);
  return (
    <div className="flex items-end gap-2.5">
      <Image
        src="/allison.png"
        alt=""
        width={36}
        height={36}
        className={`size-9 flex-none rounded-full object-cover ${hablando ? "aro-allison habla-ritmo" : ""}`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-[18px_18px_18px_4px] bg-superficie-2 py-2 pr-2 pl-3.5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setVer((v) => !v)} className="min-w-0 flex-1 text-left leading-tight" aria-expanded={ver}>
            <small className="block text-[10.5px] font-extrabold tracking-[0.08em] text-primario uppercase">Expresión del día</small>
            <b className="block text-[15px] font-black">{frase.en}</b>
            {!ver && <span className="text-[12px] font-semibold text-texto-suave">Toca para ver qué significa</span>}
          </button>
          <button
            type="button"
            onClick={() => void decir(frase.en)}
            aria-label="Oír la expresión del día"
            className="grid size-9 flex-none place-items-center rounded-full bg-primario text-white"
          >
            <Icono nombre="play" className="size-4" />
          </button>
        </div>
        {ver && (
          <div className="flex flex-col gap-1.5 pr-1 text-[13px] leading-snug">
            <p>
              <b className="font-extrabold">Significa:</b> <span className="font-semibold">{frase.significa}</span>
            </p>
            <p className="text-texto-suave">
              <b className="font-extrabold">No es</b> «{frase.literal}»: no se traduce palabra por palabra.
            </p>
            <p className="flex items-center gap-2">
              <BotonOir tam="chico" onClick={() => void decir(frase.ejemplo)} />
              <span className="min-w-0 font-bold">{frase.ejemplo}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
