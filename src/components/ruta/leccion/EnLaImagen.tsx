"use client";

import Image from "next/image";
import { srcIlustracion } from "@/lib/ruta/ilustracion";
import type { EscuchaElige } from "@/lib/ruta/tipos";
import type { Nivel } from "@/lib/tipos";
import { Icono } from "../Iconos";

/**
 * Escucha y elige con `enLaImagen`: la imagen entera y las personas que
 * se tocan. Para comparar a la misma escala (A2, parada 10: "Noah is very
 * tall"): con una tarjeta por persona, cada dibujo traía su propia regla y
 * el bajo no se veía más bajo (30 de octubre de 2026). Elegir a una persona
 * la dice en voz alta, como en las tarjetas.
 */
export function EnLaImagen({
  opciones,
  nivel,
  elegida,
  fallidas,
  correcta,
  acierto,
  onElegir,
}: {
  opciones: EscuchaElige["opciones"];
  nivel: Nivel;
  elegida: number | null;
  fallidas: number[];
  correcta: number;
  acierto: boolean;
  onElegir: (i: number) => void;
}) {
  const imagen = opciones[0]?.imagen;
  if (!imagen) return null;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-superficie-2">
      <Image src={srcIlustracion(imagen, nivel)} alt="" fill sizes="(max-width: 640px) 92vw, 384px" className="object-cover" />
      {opciones.map((o, i) => {
        const z = o.zona;
        if (!z) return null;
        const ancho = z.ancho ?? 26;
        const alto = z.alto ?? 60;
        const ok = acierto && i === correcta;
        const sel = elegida === i;
        const descartada = fallidas.includes(i);
        return (
          <button
            key={i}
            type="button"
            disabled={acierto || descartada}
            onClick={() => onElegir(i)}
            aria-pressed={sel}
            aria-label={o.etiqueta ?? `Persona ${i + 1}`}
            className={`absolute rounded-2xl border-[3px] transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-default ${
              ok ? "border-menta bg-menta/10" : sel ? "border-primario bg-primario/10" : descartada ? "border-transparent bg-superficie/60" : "border-transparent"
            }`}
            style={{ left: `${z.x - ancho / 2}%`, top: `${z.y - alto / 2}%`, width: `${ancho}%`, height: `${alto}%` }}
          >
            {ok && (
              <span className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-menta text-white">
                <Icono nombre="check" className="size-4 stroke-[3]" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
