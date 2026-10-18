import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { Estampilla, type LugarSello } from "@/components/ruta/Estampilla";
import { Estrellas, Icono } from "@/components/ruta/Iconos";
import { pasaporteDeViajes } from "@/lib/ruta/pasaporteViajes";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Viajes · Allison" };

/** Los colores de las 3 tareas de un viaje (pantalla 3: íconos de color). */
const COLORES = ["bg-[#ff8a3d]", "bg-[#ec4899]", "bg-[#12b5a5]"];

/**
 * Viajes (pantalla 3, aprobada el 14 de octubre de 2026): Allison saluda
 * y anima; la portada del próximo destino con su estampilla "Por ganar",
 * sus 3 tareas y el botón para empezar; debajo, el pasaporte con los 10
 * países en orden: ganados a color, el siguiente con marco azul y los
 * demás en gris con candado y su nivel mínimo.
 */
export default async function PaginaViajes() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const p = await pasaporteDeViajes(alumno.id, alumno.nivel);
  const destino = p.viajes.find((v) => v.numero === p.siguiente) ?? null;
  const bloqueadoPorNivel = !destino ? p.viajes.find((v) => !v.ganado && v.motivo === "nivel") : null;
  const primerNombre = alumno.nombre.split(" ")[0];

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-5 pb-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] leading-tight font-black">Viajes</h1>
            <p className="text-[13px] font-semibold text-texto-suave">Tu vuelta al mundo hablando de cada cultura</p>
          </div>
          <span className="rounded-full bg-oro-suave px-3 py-1 text-[13px] font-extrabold whitespace-nowrap text-oro">
            {p.ganados} de {p.viajes.length} sellos
          </span>
        </header>

        <div className="flex items-end gap-2.5">
          <Image src="/allison.png" alt="Allison" width={44} height={44} className="respira size-11 rounded-full object-cover" />
          <p className="rounded-[18px_18px_18px_4px] bg-gradient-to-br from-[#4a5be6] to-[#7c4dd8] px-4 py-2.5 text-sm font-bold text-white">
            {destino
              ? `¡Hola, ${primerNombre}! ¿Listo para conocer ${destino.pais}? Te espero allá.`
              : bloqueadoPorNivel
                ? `¡Muy bien, ${primerNombre}! El próximo viaje, ${bloqueadoPorNivel.pais}, se abre desde ${bloqueadoPorNivel.nivelMinimo}.`
                : `¡Recorriste todos los países, ${primerNombre}! Puedes repetir cualquier viaje.`}
          </p>
        </div>

        {destino && (
          <section className="overflow-hidden rounded-3xl border border-borde">
            <div className="relative h-36 bg-superficie-2">
              <Image src={`/ilustraciones/a1/${destino.clave}.webp`} alt={`Ilustración de ${destino.pais}`} fill sizes="512px" className="object-cover" />
              <span className="absolute top-3 right-3 flex flex-col items-center gap-0.5">
                <Estampilla lugar={destino.clave as LugarSello} numero={destino.numero} className="block w-14 rotate-[4deg] drop-shadow-md" />
                <i className="rounded-full bg-oro-suave px-2 text-[10.5px] font-black text-oro not-italic">Por ganar</i>
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <small className="text-[11px] font-extrabold tracking-[0.06em] text-primario uppercase">
                Próximo destino · Viaje {destino.numero} de {p.viajes.length}
              </small>
              <b className="text-2xl leading-tight font-black">{destino.pais}</b>
              <ul className="flex flex-col gap-1.5">
                {destino.tareas.map((t, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[14px] font-extrabold">
                    <span className={`grid size-7 flex-none place-items-center rounded-full text-xs font-black text-white ${COLORES[i % 3]}`}>
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <span className="flex items-center justify-between text-[12.5px] font-bold text-texto-suave">
                Unos 8 minutos · mínimo 10 intervenciones
                <span className="text-oro">Usa intervenciones</span>
              </span>
              <Link
                href={`/viajes/${destino.numero}`}
                className="degradado-primario sombra-accion mt-1 flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-extrabold text-white"
              >
                <Icono nombre="viajes" className="size-5" />
                Empezar el viaje
              </Link>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3 rounded-3xl bg-oro-suave p-4">
          <div className="flex items-baseline justify-between gap-2">
            <b className="text-[13px] font-black tracking-[0.08em] text-oro uppercase">Pasaporte de viajes</b>
            <span className="truncate text-sm font-black">{alumno.nombre}</span>
          </div>
          <ol className="grid grid-cols-5 gap-x-2 gap-y-3">
            {p.viajes.map((v) => {
              const siguiente = v.numero === p.siguiente;
              const contenido = (
                <>
                  <span className={`block w-full rounded-lg ${siguiente ? "outline outline-[2.5px] outline-offset-2 outline-primario" : ""}`}>
                    <Estampilla lugar={v.clave as LugarSello} numero={v.numero} apagada={!v.ganado} className="block w-full" />
                  </span>
                  <b className="text-[10.5px] leading-tight font-black">{v.pais}</b>
                  <small className={`text-[9.5px] leading-tight font-bold ${siguiente ? "text-primario" : "text-texto-suave"}`}>
                    {v.ganado ? (
                      <Estrellas n={v.estrellas} className="size-2.5" />
                    ) : siguiente ? (
                      "Tu próximo sello"
                    ) : v.motivo === "nivel" ? (
                      `Desde ${v.nivelMinimo}`
                    ) : (
                      <Icono nombre="candado" className="mx-auto size-3" />
                    )}
                  </small>
                </>
              );
              return (
                <li key={v.numero} className="flex min-w-0 flex-col items-center gap-1 text-center">
                  {v.abierto ? (
                    <Link href={`/viajes/${v.numero}`} className="flex w-full flex-col items-center gap-1" aria-label={`Viaje ${v.numero}: ${v.pais}`}>
                      {contenido}
                    </Link>
                  ) : (
                    contenido
                  )}
                </li>
              );
            })}
          </ol>
          <p className="text-center text-xs font-bold text-oro">Cada viaje se abre al terminar el anterior</p>
        </section>
      </main>
    </ConNavegacion>
  );
}
