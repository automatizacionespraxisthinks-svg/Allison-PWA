import Link from "next/link";
import { redirect } from "next/navigation";
import { MapaDominio } from "@/components/MapaDominio";
import { SemanaPractica } from "@/components/SemanaPractica";
import { progresoDe } from "@/lib/progreso";
import { alumnoActual } from "@/lib/sesion";
import { CLAVES_TEMA } from "@/lib/temas";

function tiempoHablado(segundos: number): string {
  if (segundos < 60) return `${segundos} seg`;
  if (segundos < 3600) return `${Math.round(segundos / 60)} min`;
  return `${(segundos / 3600).toFixed(1)} h`;
}

export default async function PaginaProgreso() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const p = await progresoDe(alumno.id);
  const nombreCorto = alumno.nombre.split(" ")[0];
  const total = CLAVES_TEMA.length;

  if (p.totalMensajes === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-6xl" aria-hidden>
          🗺️
        </span>
        <h1 className="text-2xl font-semibold">Tu mapa está en blanco</h1>
        <p className="text-texto-suave">
          Cada vez que hables con Allison se destapa un pedazo. Aquí vas a ver
          qué ya dominas y qué te falta.
        </p>
        <Link
          href="/practicar"
          className="rounded-2xl bg-primario px-8 py-4 text-lg font-semibold text-white"
        >
          Hablar con Allison
        </Link>
      </main>
    );
  }

  // Anillo de avance: el porcentaje del mapa ya conquistado
  const porcentaje = Math.round((p.dominados / total) * 100);
  const circunferencia = 2 * Math.PI * 52;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 py-5">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Hola, {nombreCorto}</h1>
        <Link
          href="/practicar"
          className="rounded-full bg-primario px-5 py-2.5 text-sm font-semibold text-white"
        >
          Practicar
        </Link>
      </header>

      {/* ---- El mapa, en una sola cifra ---- */}
      <section className="flex items-center gap-5 rounded-3xl border border-borde bg-superficie p-6">
        <div className="relative shrink-0">
          <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
            <circle
              cx="60" cy="60" r="52" fill="none"
              className="stroke-superficie-2" strokeWidth="12"
            />
            <circle
              cx="60" cy="60" r="52" fill="none"
              className="stroke-exito" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={circunferencia * (1 - porcentaje / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold leading-none tabular-nums">
              {p.dominados}
            </span>
            <span className="text-xs text-texto-suave">de {total}</span>
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-tight">
            {p.dominados === 0
              ? "Empezaste el mapa"
              : p.dominados === total
                ? "Mapa completo"
                : `Dominas ${p.dominados} ${p.dominados === 1 ? "tema" : "temas"}`}
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-texto-suave">
            {p.dominados === 0
              ? "Un tema queda dominado cuando llevas 10 turnos seguidos sin equivocarte en él."
              : `Te quedan ${total - p.dominados} por conquistar. Cada turno sin repetir un error te acerca.`}
          </p>
        </div>
      </section>

      {/* ---- Racha y semana, en una línea ---- */}
      <section className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-borde bg-superficie px-4 py-3">
          <span className="text-2xl leading-none" aria-hidden>
            {p.practicoHoy ? "🔥" : "🌙"}
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold leading-none tabular-nums">
              {p.rachaDias}
            </p>
            <p className="truncate text-xs text-texto-suave">
              {p.rachaDias === 1 ? "día seguido" : "días seguidos"}
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col rounded-2xl border border-borde bg-superficie px-4 py-3">
          <p className="text-xl font-bold leading-none tabular-nums">
            {tiempoHablado(p.totalSegundos)}
          </p>
          <p className="text-xs text-texto-suave">hablando en total</p>
        </div>
      </section>

      <SemanaPractica dias={p.semana} />

      {/* ---- Una sola misión ---- */}
      {p.mision && (
        <section
          className={`rounded-3xl border-2 p-6 ${
            p.mision.estado === "atraviesa"
              ? "border-acento/40 bg-acento/5"
              : "border-primario/40 bg-primario/5"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-widest ${
              p.mision.estado === "atraviesa" ? "text-acento" : "text-primario"
            }`}
          >
            {p.mision.estado === "atraviesa" ? "Ataca esto hoy" : "Casi lo dominas"}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight">
            {p.mision.titulo}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-texto-suave">
            {p.mision.estado === "mejorando"
              ? `Llevas ${p.mision.turnosLimpios} de 10 turnos limpios. Unos cuantos más y queda dominado. `
              : ""}
            {p.mision.pista}
          </p>

          <div className="mt-4 rounded-2xl bg-superficie p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
              Así se dice
            </p>
            <p className="mt-1 text-lg font-medium text-exito">
              {p.mision.ejemplo}
            </p>
          </div>

          <Link
            href="/practicar"
            className={`mt-4 flex items-center justify-center rounded-2xl px-6 py-3.5 font-semibold text-white ${
              p.mision.estado === "atraviesa" ? "bg-acento" : "bg-primario"
            }`}
          >
            Practicar esto ahora
          </Link>
        </section>
      )}

      <div>
        <h2 className="mb-3 px-1 text-lg font-semibold">Tu mapa</h2>
        <MapaDominio temas={p.temas} />
      </div>
    </main>
  );
}
