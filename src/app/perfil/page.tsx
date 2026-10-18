import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { Estampilla, type LugarSello } from "@/components/ruta/Estampilla";
import { Icono } from "@/components/ruta/Iconos";
import { cuantoLeAlcanza, pasaporteDe } from "@/lib/ruta/pasaporte";
import { perfilDe } from "@/lib/perfil";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Perfil · Allison" };

/**
 * Perfil (pantalla 6, mosaicos): arriba quién es, con el engrane de los
 * ajustes; Allison anima con un dato útil; la recarga es lo más
 * destacado; y abajo los mosaicos de racha, estrellas, palabras
 * guardadas y sellos. Cada mosaico abre su detalle.
 */
export default async function PaginaPerfil() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const [perfil, p] = await Promise.all([perfilDe(alumno.id), pasaporteDe(alumno.id, alumno.nivel)]);
  if (!perfil) redirect("/entrar");

  const saldo = alumno.mensajesPlan + alumno.mensajesRecarga;
  const pocas = !alumno.enPrueba && saldo <= 10;
  const alcanza = cuantoLeAlcanza(saldo, p.porDia);
  const iniciales = alumno.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x.charAt(0).toUpperCase())
    .join("");

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-5 pb-6">
        <header className="flex items-center gap-3">
          <span className="grid size-14 flex-none place-items-center rounded-full bg-primario-suave text-xl font-black text-primario">
            {iniciales}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="truncate text-xl font-black">{alumno.nombre}</h1>
            <span className="text-[13px] font-bold text-texto-suave">
              {perfil.colegio ? `${perfil.colegio} · ` : ""}Nivel {alumno.nivel}
            </span>
          </div>
          <Link
            href="/perfil/ajustes"
            aria-label="Ajustes"
            className="grid size-10 flex-none place-items-center rounded-full border border-borde text-texto-suave hover:bg-superficie-2"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
            </svg>
          </Link>
        </header>

        {p.animo && (
          <div className="flex items-end gap-2.5">
            <Image src="/allison.png" alt="Allison" width={40} height={40} className="respira size-10 rounded-full object-cover" />
            <p className="rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2.5 text-sm font-bold">{p.animo}</p>
          </div>
        )}

        <section
          className={`flex flex-col gap-3 rounded-3xl p-4 text-white ${
            pocas ? "bg-gradient-to-br from-[#e8963a] to-[#b45309]" : "bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8]"
          }`}
        >
          <div className="flex items-end justify-between gap-3">
            <div className="leading-tight">
              <b className="text-4xl font-black">{saldo}</b>
              <span className="block text-sm font-bold opacity-90">
                {alumno.enPrueba ? "de prueba" : pocas ? "Te quedan pocas" : "intervenciones"}
              </span>
            </div>
            {alcanza && (
              <span className="text-right text-[13px] leading-tight font-bold opacity-90">
                Te alcanzan para
                <b className="block text-base font-black">{alcanza}</b>
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, saldo)}%` }} />
          </div>
          <Link href="/recargar" className="rounded-2xl bg-[#f5b82e] px-4 py-3 text-center font-extrabold text-[#3a2a05]">
            Recargar intervenciones
          </Link>
          <span className="text-center text-xs font-bold opacity-90">QR Bre-B · Efectivo en tu colegio</span>
        </section>

        <Link href="/progreso" className="flex flex-col gap-3 rounded-3xl border border-borde p-4 hover:bg-superficie-2">
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <Icono nombre="racha" className="size-7 text-oro" />
              <span className="leading-tight">
                <b className="block text-2xl font-black">{alumno.rachaDias}</b>
                <span className="text-xs font-bold text-texto-suave">{alumno.rachaDias === 1 ? "día seguido" : "días seguidos"}</span>
              </span>
            </span>
            <span className="leading-tight">
              <b className="block text-2xl font-black">{p.minutosSemana} min</b>
              <span className="text-xs font-bold text-texto-suave">esta semana</span>
            </span>
            <Icono nombre="atras" className="ml-auto size-5 rotate-180 text-texto-suave" />
          </span>
          <span className="flex justify-between gap-1">
            {p.semana.map((d) => (
              <span
                key={d.fecha}
                className={`grid aspect-square w-full max-w-10 place-items-center rounded-full text-xs font-black ${
                  d.practico ? "bg-oro text-superficie" : d.esHoy ? "border-2 border-dashed border-oro text-oro" : "bg-superficie-2 text-texto-suave"
                }`}
              >
                {d.letra}
              </span>
            ))}
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/ruta" className="flex flex-col gap-1 rounded-3xl border border-borde p-4 hover:bg-superficie-2">
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
              <path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z" fill="var(--estrella)" />
            </svg>
            <b className="text-2xl font-black">{p.estrellas}</b>
            <span className="text-xs font-bold text-texto-suave">estrellas</span>
          </Link>
          <Link href="/glosario" className="flex flex-col gap-1 rounded-3xl border border-borde p-4 hover:bg-superficie-2">
            <Icono nombre="guardar" className="size-7 text-primario" />
            <b className="text-2xl font-black">{p.palabras}</b>
            <span className="text-xs font-bold text-texto-suave">palabras guardadas</span>
          </Link>
        </div>

        <Link href="/perfil/sellos" className="flex flex-col gap-3 rounded-3xl border border-borde p-4 hover:bg-superficie-2">
          <span className="flex items-center justify-between">
            <b className="text-base font-black">Mis sellos</b>
            <span className="text-sm font-extrabold text-oro">
              {p.sellos.length} de {p.totalSellos}
            </span>
          </span>
          {p.sellos.length ? (
            <span className="grid grid-cols-5 gap-2">
              {p.sellos.slice(0, 10).map((s) => (
                <Estampilla key={s.lugar} lugar={s.lugar as LugarSello} numero={s.numero} className="block w-full" />
              ))}
            </span>
          ) : (
            <span className="text-sm font-semibold text-texto-suave">Gana tu primera estampilla pasando el escenario de tu primera parada.</span>
          )}
        </Link>
      </main>
    </ConNavegacion>
  );
}
