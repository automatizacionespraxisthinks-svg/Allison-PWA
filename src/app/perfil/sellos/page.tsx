import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { PAIS_DE_NIVEL } from "@/components/ruta/Encabezado";
import { Estampilla, type LugarSello } from "@/components/ruta/Estampilla";
import { Estrellas, Icono } from "@/components/ruta/Iconos";
import { estadoRutaDe } from "@/lib/ruta/avance";
import { pasaporteDeViajes } from "@/lib/ruta/pasaporteViajes";
import { selloDe } from "@/lib/ruta/sellos";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mis sellos · Allison" };

/**
 * Mis sellos (el detalle del mosaico del Perfil, pantalla 6): las
 * estampillas de las ciudades de Mi ruta y las de los países de Viajes,
 * ganadas a color con sus estrellas y las demás en gris.
 */
export default async function PaginaSellos() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const [ruta, viajes] = await Promise.all([estadoRutaDe(alumno.id, alumno.nivel), pasaporteDeViajes(alumno.id, alumno.nivel)]);

  const ciudades = (ruta?.paradas ?? [])
    .map((p) => ({ clave: p.clave, lugar: selloDe(p), numero: p.numeroSello, nombre: p.tipo === "parada" ? p.ciudad : p.nombre, ganado: p.sello, estrellas: p.escenario.estrellas }))
    .filter((c): c is typeof c & { lugar: string } => !!c.lugar);
  const ganadas = ciudades.filter((c) => c.ganado).length + viajes.ganados;
  const total = ciudades.length + viajes.viajes.length;

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pt-5 pb-6">
        <header className="flex items-center gap-3">
          <Link href="/perfil" aria-label="Volver al perfil" className="grid size-10 flex-none place-items-center rounded-full border border-borde">
            <Icono nombre="atras" className="size-5" />
          </Link>
          <h1 className="flex-1 text-[24px] font-black">Mis sellos</h1>
          <span className="rounded-full bg-oro-suave px-3 py-1 text-[13px] font-extrabold text-oro">
            {ganadas} de {total}
          </span>
        </header>

        {ciudades.length > 0 && (
          <section className="flex flex-col gap-3 rounded-3xl border border-borde p-4">
            <div className="flex items-baseline justify-between gap-2">
              <b className="text-[13px] font-black tracking-[0.08em] text-primario uppercase">Mi ruta · {PAIS_DE_NIVEL[alumno.nivel]}</b>
              <Link href="/ruta" className="text-xs font-extrabold text-primario underline">
                Ir a mi ruta
              </Link>
            </div>
            <ol className="grid grid-cols-4 gap-x-2 gap-y-3">
              {ciudades.map((c) => (
                <li key={c.clave} className="flex min-w-0 flex-col items-center gap-1 text-center">
                  <Estampilla lugar={c.lugar as LugarSello} numero={c.numero} apagada={!c.ganado} className="block w-full" />
                  <b className={`text-[11px] leading-tight font-black ${c.ganado ? "" : "text-texto-suave"}`}>{c.nombre}</b>
                  {c.ganado ? <Estrellas n={c.estrellas} className="size-2.5" /> : <Icono nombre="candado" className="size-3 text-texto-suave" />}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="flex flex-col gap-3 rounded-3xl bg-oro-suave p-4">
          <div className="flex items-baseline justify-between gap-2">
            <b className="text-[13px] font-black tracking-[0.08em] text-oro uppercase">Pasaporte de viajes</b>
            <Link href="/viajes" className="text-xs font-extrabold text-oro underline">
              Ir a Viajes
            </Link>
          </div>
          <ol className="grid grid-cols-5 gap-x-2 gap-y-3">
            {viajes.viajes.map((v) => (
              <li key={v.numero} className="flex min-w-0 flex-col items-center gap-1 text-center">
                <Estampilla lugar={v.clave as LugarSello} numero={v.numero} apagada={!v.ganado} className="block w-full" />
                <b className={`text-[10.5px] leading-tight font-black ${v.ganado ? "" : "text-texto-suave"}`}>{v.pais}</b>
                {v.ganado ? (
                  <Estrellas n={v.estrellas} className="size-2.5" />
                ) : v.motivo === "nivel" ? (
                  <small className="text-[9.5px] font-bold text-texto-suave">Desde {v.nivelMinimo}</small>
                ) : (
                  <Icono nombre="candado" className="size-3 text-texto-suave" />
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </ConNavegacion>
  );
}
