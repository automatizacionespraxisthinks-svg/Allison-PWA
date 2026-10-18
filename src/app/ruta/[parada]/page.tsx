import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { PortadaCiudad } from "@/components/ruta/PortadaCiudad";
import { Estrellas, Icono, IconoActividad } from "@/components/ruta/Iconos";
import { estadoRutaDe } from "@/lib/ruta/avance";
import { NOMBRE_ACTIVIDAD, usaIntervenciones } from "@/lib/ruta/estado";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Lección · Allison" };

/**
 * Pantalla 2: se abre al tocar una lección en Mi ruta. Arriba la ciudad
 * como portada; abajo la lección con sus 3 actividades como un pequeño
 * camino, el botón Continuar y la Guía de frases. No se repite ningún
 * dato (boceto aprobado el 14 de octubre de 2026).
 */
export default async function PaginaParada({
  params,
  searchParams,
}: {
  params: Promise<{ parada: string }>;
  searchParams: Promise<{ leccion?: string }>;
}) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const { parada: clave } = await params;
  const { leccion: pedida } = await searchParams;

  const estado = await estadoRutaDe(alumno.id, alumno.nivel);
  const p = estado?.paradas.find((x) => x.clave === clave);
  if (!estado || !p) notFound();

  // La lección pedida, o la que sigue en esta parada, o la primera.
  const numero =
    Number(pedida) ||
    p.lecciones.find((l) => l.estado === "actual")?.numero ||
    p.lecciones.find((l) => l.estado !== "hecha" && l.estado !== "bloqueada")?.numero ||
    1;
  const l = p.lecciones.find((x) => x.numero === numero);
  if (!l) notFound();
  const titulo = l.titulo;

  const bloqueada = l.estado === "bloqueada";
  const hecha = l.estado === "hecha";
  const total = p.lecciones.length;
  // El repaso final: sus lecciones ya están, pero el escenario espera a
  // que se terminen las de las paradas saltadas.
  const pendientes = estado.leccionesPendientes;
  const finalCerrado = p.escenario.estado === "bloqueado" && p.lecciones.every((x) => x.estado === "hecha") && pendientes > 0;
  const primeraPendiente = estado.paradas
    .flatMap((x) => x.lecciones.filter((y) => y.estado !== "hecha").map((y) => ({ parada: x, leccion: y.numero })))
    .find((x) => x.parada.clave !== clave);

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-6">
        <PortadaCiudad
          portada={p.portada}
          ciudad={p.ciudad}
          rotulo={`${p.nombre} · ${p.titulo}`}
          sello={{ tipo: p.tipo, nombre: p.nombre, ciudad: p.ciudad, clave: p.clave, numero: p.numeroSello, ganado: p.sello }}
          volver="/ruta"
        />

        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" role="img" aria-label={`Lección ${numero} de ${total}`}>
            {p.lecciones.map((x) => (
              <Link
                key={x.numero}
                href={`/ruta/${clave}?leccion=${x.numero}`}
                aria-label={`Lección ${x.numero}`}
                className={`h-2 flex-1 rounded-full ${
                  x.numero === numero ? "bg-primario" : x.estado === "hecha" ? "bg-menta" : "bg-superficie-2"
                }`}
              />
            ))}
            <span className={`h-2 flex-[0.7] rounded-full border-[1.5px] border-oro ${p.sello ? "bg-oro" : "bg-oro-suave"}`} />
          </div>
          <span className="text-[13px] font-extrabold whitespace-nowrap text-primario">
            Lección {numero} de {total}
          </span>
        </div>

        <div className="flex flex-col gap-1 leading-tight">
          <h1 className="text-xl font-black text-balance">{titulo}</h1>
          <span className="flex items-center gap-2 text-[13px] font-semibold text-texto-suave">
            {hecha ? (
              <>
                <Estrellas n={l.estrellas} /> Tu mejor nota
              </>
            ) : (
              "Unos 5 minutos · hasta 3 estrellas"
            )}
          </span>
        </div>

        <ol className="relative flex flex-col gap-2.5">
          <span
            aria-hidden
            className="absolute top-6 bottom-6 left-[29px] w-1 rounded-full"
            style={{
              background: `linear-gradient(var(--menta) 0 ${(l.paso / l.actividades.length) * 100}%, var(--borde) ${(l.paso / l.actividades.length) * 100}%)`,
            }}
          />
          {l.actividades.map((tipo, i) => {
            const ok = hecha || i < l.paso;
            const on = !hecha && !bloqueada && i === l.paso;
            return (
              <li
                key={i}
                className={`relative flex items-center gap-3 rounded-2xl py-1.5 pr-3 pl-2 ${on ? "bg-primario-suave" : ""}`}
              >
                <span className={`stk act-${tipo} ${on ? "actual" : ok ? "" : "apagada"}`}>
                  <IconoActividad tipo={tipo} />
                  {ok && (
                    <span className="absolute -right-2 -bottom-1.5 grid size-[22px] place-items-center rounded-full border-[3px] border-superficie bg-[#1fae7a] text-white">
                      <Icono nombre="check" className="size-3 stroke-[3.4]" />
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <b className={`text-[15px] font-black ${on ? "text-primario" : ok ? "text-texto-suave" : "text-texto-suave"}`}>
                    {NOMBRE_ACTIVIDAD[tipo]}
                  </b>
                  {usaIntervenciones(tipo) && <small className="text-[11.5px] font-extrabold text-oro">Usa intervenciones</small>}
                </span>
              </li>
            );
          })}
        </ol>

        {bloqueada ? (
          <p className="rounded-2xl bg-superficie-2 px-4 py-3 text-center text-sm font-bold text-texto-suave">
            Se abre al terminar la lección anterior.
          </p>
        ) : (
          <Link
            href={`/ruta/${clave}/leccion/${numero}`}
            className="degradado-primario sombra-accion rounded-2xl px-6 py-3 text-center font-extrabold text-white"
          >
            {hecha ? "Repetir para subir estrellas" : l.paso > 0 ? "Continuar" : "Empezar"}
          </Link>
        )}

        {finalCerrado && (
          <div className="flex flex-col gap-1.5 rounded-2xl bg-oro-suave px-4 py-3 text-sm font-semibold text-oro">
            <b className="font-black">El escenario final se abre al terminar todo {estado.nivel}</b>
            <span>
              Te {pendientes === 1 ? "falta 1 lección" : `faltan ${pendientes} lecciones`} de las paradas que saltaste.
            </span>
            {primeraPendiente && (
              <Link
                href={`/ruta/${primeraPendiente.parada.clave}?leccion=${primeraPendiente.leccion}`}
                className="font-extrabold underline"
              >
                Ir a la siguiente: {primeraPendiente.parada.nombre}, lección {primeraPendiente.leccion}
              </Link>
            )}
          </div>
        )}

        <Link
          href={`/ruta/${clave}/guia?leccion=${numero}`}
          className="flex items-center justify-center gap-1.5 text-sm font-extrabold text-primario"
        >
          <Icono nombre="libro" className="size-4" />
          Guía de frases de {p.ciudad}
        </Link>
      </main>
    </ConNavegacion>
  );
}
