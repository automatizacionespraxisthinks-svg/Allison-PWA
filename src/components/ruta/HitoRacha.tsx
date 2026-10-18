"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { sonar } from "@/lib/sonidos";
import { Icono } from "./Iconos";

const HITOS = [3, 7, 14, 30];

/**
 * Hitos de racha (plan, sección 10): una celebración con Allison los días
 * 3, 7, 14 y 30, una sola vez, al abrir Mi ruta ese día. Sin
 * intervenciones de regalo hasta ver los datos del piloto.
 */
export function HitoRacha({ racha, nombre, hoy }: { racha: number; nombre: string; /** "AAAA-MM-DD" en Bogotá. */ hoy: string }) {
  const [ver, setVer] = useState(false);
  const clave = `allison-hito-${racha}`;

  useEffect(() => {
    if (!HITOS.includes(racha)) return;
    try {
      // Se guarda el día en que se mostró. Con los días de descanso la
      // racha puede quedarse en el mismo número hasta 3 días; una racha
      // nueva que vuelva a llegar a él tarda más, y entonces se celebra otra vez.
      const antes = localStorage.getItem(clave);
      const dias = antes ? (Date.parse(hoy) - Date.parse(antes)) / 86_400_000 : Infinity;
      if (!(dias >= 3)) return;
      localStorage.setItem(clave, hoy);
    } catch {
      return;
    }
    const t = setTimeout(() => {
      setVer(true);
      sonar("logro");
    }, 0);
    return () => clearTimeout(t);
  }, [clave, hoy, racha]);

  if (!ver) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="hito">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-superficie p-6 text-center shadow-xl">
        <span className="flex items-center gap-1 rounded-full bg-oro-suave px-4 py-1.5 text-oro">
          <Icono nombre="racha" className="size-6" />
          <b className="text-2xl font-black">{racha}</b>
        </span>
        <Image src="/allison.png" alt="Allison" width={96} height={96} className="aro-allison bien size-24 rounded-full object-cover" />
        <h2 id="hito" className="text-xl font-black text-balance">
          ¡{racha} días seguidos, {nombre.split(" ")[0]}!
        </h2>
        <p className="text-sm text-texto-suave">Allison: &ldquo;Amazing! See you tomorrow!&rdquo; Sigue así: unos minutos al día bastan.</p>
        <button type="button" autoFocus onClick={() => setVer(false)} className="degradado-primario w-full rounded-2xl px-5 py-3 font-extrabold text-white">
          ¡Vamos!
        </button>
      </div>
    </div>
  );
}
