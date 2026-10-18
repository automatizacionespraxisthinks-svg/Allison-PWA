import Image from "next/image";
import Link from "next/link";
import { srcIlustracion } from "@/lib/ruta/ilustracion";
import { selloDe } from "@/lib/ruta/sellos";
import type { Nivel } from "@/lib/tipos";
import { Estampilla, type LugarSello } from "./Estampilla";
import { Icono } from "./Iconos";

/**
 * La ciudad como portada (pantallas 2, 7 y 10): la ilustración, el
 * nombre grande abajo a la izquierda y la estampilla arriba a la
 * derecha, "Por ganar" o ganada. Lo importante de cada ilustración va en
 * la franja del medio, así que se recorta ancho sin perder nada.
 */
export function PortadaCiudad({
  portada,
  ciudad,
  rotulo,
  sello,
  volver,
  alto = "h-44",
}: {
  portada: string;
  ciudad: string;
  rotulo: string;
  sello: { tipo: "parada" | "repaso"; nombre: string; ciudad: string; clave?: string; numero: number; ganado: boolean };
  volver?: string;
  alto?: string;
}) {
  const lugar = selloDe(sello) as LugarSello | null;
  return (
    <div className={`relative ${alto} overflow-hidden rounded-3xl bg-superficie-2`}>
      <Image
        // El nivel sale de la clave del paso ("a2-p03"); las portadas de A1 no la necesitan.
        src={srcIlustracion(portada, (sello.clave?.slice(0, 2).toUpperCase() as Nivel | undefined) ?? "A1")}
        alt={`Ilustración de ${ciudad}`}
        fill
        sizes="(max-width: 640px) 100vw, 512px"
        className="object-cover"
        priority
      />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[rgba(12,18,48,0.78)]" />
      {volver && (
        <Link
          href={volver}
          aria-label="Volver a la ruta"
          className="absolute top-2.5 left-2.5 z-[2] grid size-9 place-items-center rounded-full bg-superficie shadow-md"
        >
          <Icono nombre="atras" className="size-5" />
        </Link>
      )}
      {lugar && (
        <span className="absolute top-3 right-3 z-[1] flex flex-col items-center gap-0.5">
          <Estampilla
            lugar={lugar}
            numero={sello.numero}
            className={`block w-[50px] rotate-[4deg] drop-shadow-[0_3px_4px_rgba(90,60,10,0.3)] ${sello.ganado ? "" : "opacity-80"}`}
          />
          <i className="rounded-full bg-oro-suave px-2 text-[10.5px] font-black text-oro not-italic">
            {sello.ganado ? "Ganada" : "Por ganar"}
          </i>
        </span>
      )}
      <span className="absolute bottom-3 left-4 z-[1] flex flex-col leading-tight text-white">
        <small className="text-[11px] font-extrabold tracking-[0.08em] uppercase opacity-90">{rotulo}</small>
        <b className="text-[28px] font-black tracking-tight">{ciudad}</b>
      </span>
    </div>
  );
}
