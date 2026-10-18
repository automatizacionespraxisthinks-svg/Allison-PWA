"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { minutosEnTexto } from "@/lib/competencia/tabla";
import { sonar } from "@/lib/sonidos";
import { Icono } from "./Iconos";

/**
 * Si el salón del alumno ganó la semana pasada, una celebración con
 * Allison la primera vez que abre Mi ruta en la semana nueva, una sola
 * vez en este aparato. Solo reconocimiento, como los hitos de racha.
 */
export function CelebracionSalon({
  curso,
  gano,
}: {
  curso: string;
  gano: { /** El lunes de la semana que ganó, "AAAA-MM-DD". */ lunes: string; minutos: number };
}) {
  const [ver, setVer] = useState(false);
  const clave = `allison-salon-gano-${gano.lunes}`;

  useEffect(() => {
    // Se marca al mostrarla, no antes: si el efecto corre dos veces
    // (modo estricto), la primera no la gasta sin que se vea.
    const t = setTimeout(() => {
      try {
        if (localStorage.getItem(clave)) return;
        localStorage.setItem(clave, "1");
      } catch {
        return;
      }
      setVer(true);
      sonar("logro");
    }, 0);
    return () => clearTimeout(t);
  }, [clave]);

  if (!ver) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="salon-gano">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-superficie p-6 text-center shadow-xl">
        <span className="flex items-center gap-1.5 rounded-full bg-oro-suave px-4 py-1.5 text-oro">
          <Icono nombre="trofeo" className="size-6" />
          <b className="text-xl font-black">{curso}</b>
        </span>
        <Image src="/allison.png" alt="Allison" width={96} height={96} className="aro-allison bien size-24 rounded-full object-cover" />
        <h2 id="salon-gano" className="text-xl font-black text-balance">
          ¡Tu salón ganó la semana!
        </h2>
        <p className="text-sm text-texto-suave">
          El {curso} practicó {minutosEnTexto(gano.minutos)} por alumno: el mejor promedio del colegio. Felicitaciones a todos,
          lo lograron juntos.
        </p>
        <button type="button" autoFocus onClick={() => setVer(false)} className="degradado-primario w-full rounded-2xl px-5 py-3 font-extrabold text-white">
          ¡Genial!
        </button>
      </div>
    </div>
  );
}
