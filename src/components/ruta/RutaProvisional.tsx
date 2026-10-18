import Image from "next/image";
import Link from "next/link";
import type { RutaProvisional as Ruta } from "@/lib/ruta/provisional";
import { EncabezadoRuta } from "./Encabezado";
import { Icono } from "./Iconos";
import { TarjetaSalon } from "./TarjetaSalon";
import type { SalonDelAlumno } from "@/lib/competencia/tabla";

/**
 * Mi ruta en un nivel que todavía no tiene sus lecciones escritas: las
 * diez ciudades del viaje, cada una con la conversación del tema que ya
 * existe en la app (plan, sección 22, "Niveles sin ruta").
 */
export function RutaProvisional({
  ruta,
  nombre,
  racha,
  minutosHoy,
  metaMin,
  salon = null,
}: {
  ruta: Ruta;
  nombre: string;
  racha: number;
  minutosHoy: number;
  metaMin: number;
  salon?: SalonDelAlumno | null;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 pt-4 pb-6">
      <EncabezadoRuta nombre={nombre} nivel={ruta.nivel} racha={racha} minutosHoy={minutosHoy} metaMin={metaMin} />
      {salon && <TarjetaSalon salon={salon} />}

      <p className="rounded-2xl bg-superficie-2 px-4 py-3 text-sm text-texto-suave">
        Tu viaje por <b className="text-texto">{ruta.pais}</b>: en cada ciudad conversas con Allison sobre un tema. Al
        completarlo ganas su estampilla. Las lecciones de este nivel llegan pronto y no perderás nada de lo que hagas.
        <span className="mt-1 block font-bold text-oro">
          {ruta.sellos} de {ruta.paradas.length} estampillas
        </span>
      </p>

      <ol className="relative flex flex-col gap-3 before:absolute before:top-6 before:bottom-6 before:left-[27px] before:w-1 before:rounded-full before:bg-camino">
        {ruta.paradas.map((p) => {
          const actual = p.estado === "actual";
          const hecha = p.estado === "hecha";
          const tarjeta = (
            <>
              <span
                className={`relative grid size-14 flex-none place-items-center rounded-full border-4 text-lg font-black ${
                  hecha
                    ? "border-oro bg-oro-suave text-oro"
                    : actual
                      ? "border-primario bg-superficie text-primario shadow-[0_0_0_6px_var(--primario-suave)]"
                      : "border-borde bg-superficie text-texto-suave"
                }`}
              >
                {hecha ? <Icono nombre="check" className="size-6 stroke-[3]" /> : p.numero}
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <small className={`text-[11px] font-black tracking-[0.06em] uppercase ${hecha ? "text-oro" : "text-texto-suave"}`}>
                  Parada {p.numero} · {p.ciudad}
                </small>
                <b className={`text-[15px] font-black ${p.estado === "bloqueada" ? "text-texto-suave" : ""}`}>{p.nombre}</b>
                {actual && (
                  <span className="mt-1 text-xs font-bold text-texto-suave">
                    {p.logros} de {p.meta} logros · usa intervenciones
                  </span>
                )}
              </span>
              {actual && <span className="rounded-xl bg-primario px-3 py-2 text-sm font-extrabold text-white">Continuar</span>}
              {p.estado === "bloqueada" && <Icono nombre="candado" className="size-5 text-texto-suave" />}
            </>
          );
          return (
            <li key={p.clave} className="relative z-[1]">
              {p.estado === "bloqueada" ? (
                <div className="flex items-center gap-3 rounded-2xl px-2 py-2 opacity-70">{tarjeta}</div>
              ) : (
                <Link
                  href={`/practicar?leccion=${p.clave}`}
                  className={`flex items-center gap-3 rounded-2xl px-2 py-2 ${actual ? "bg-primario-suave" : "hover:bg-superficie-2"}`}
                >
                  {tarjeta}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3 rounded-2xl border border-borde px-3 py-3">
        <Image src="/allison.png" alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
        <p className="text-sm text-texto-suave">
          ¿Quieres repasar lo básico? Puedes bajar de nivel desde tu{" "}
          <Link href="/perfil/ajustes#nivel" className="font-bold text-primario underline">
            perfil
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
