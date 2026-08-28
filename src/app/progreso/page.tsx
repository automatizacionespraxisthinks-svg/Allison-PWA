import Link from "next/link";
import { redirect } from "next/navigation";
import { SemanaPractica } from "@/components/SemanaPractica";
import { progresoDe } from "@/lib/progreso";
import { alumnoActual } from "@/lib/sesion";

/** Menos de un minuto se muestra en segundos: "0 minutos" parece un error. */
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

  if (p.totalMensajes === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-6xl" aria-hidden>
          🌱
        </span>
        <h1 className="text-2xl font-semibold">Aquí verás cómo vas</h1>
        <p className="text-texto-suave">
          Habla con Allison y esta pantalla se llena sola: tu racha, lo que
          mejoras y lo que se te atraviesa.
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

  const mision = p.temas[0];

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

      {/* La racha, en grande y sin explicación necesaria */}
      <section className="rounded-3xl bg-primario p-6 text-white">
        <div className="flex items-center gap-4">
          <span className="text-5xl leading-none" aria-hidden>
            {p.practicoHoy ? "🔥" : "🌙"}
          </span>
          <div>
            <p className="text-4xl font-bold leading-none tabular-nums">
              {p.rachaDias}
            </p>
            <p className="text-white/80">
              {p.rachaDias === 1 ? "día seguido" : "días seguidos"}
            </p>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-white/90">
          {p.practicoHoy
            ? `Hoy hablaste ${p.mensajesHoy} ${
                p.mensajesHoy === 1 ? "vez" : "veces"
              }. Vuelve mañana y la racha sigue creciendo.`
            : "Todavía no practicas hoy. Con un solo mensaje mantienes la racha."}
        </p>
      </section>

      <SemanaPractica dias={p.semana} />

      {/* Una sola cosa que practicar. Cinco cosas es ninguna. */}
      {mision && (
        <section className="rounded-3xl border-2 border-acento/40 bg-acento/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-acento">
            Tu misión
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight">{mision.titulo}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-texto-suave">
            Se te ha pasado{" "}
            <strong className="text-texto">
              {mision.veces} {mision.veces === 1 ? "vez" : "veces"}
            </strong>
            . {mision.pista}
          </p>

          <div className="mt-4 rounded-2xl bg-superficie p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
              Así se dice
            </p>
            <p className="mt-1 text-lg font-medium text-exito">{mision.ejemplo}</p>
          </div>

          <Link
            href="/practicar"
            className="mt-4 flex items-center justify-center rounded-2xl bg-acento px-6 py-3.5 font-semibold text-white"
          >
            Practicar esto ahora
          </Link>
        </section>
      )}

      {/* Tres cifras, no ocho */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { valor: String(p.totalMensajes), etiqueta: "mensajes" },
          { valor: tiempoHablado(p.totalSegundos), etiqueta: "hablando" },
          { valor: String(p.turnosLimpios), etiqueta: "sin errores" },
        ].map((c) => (
          <div
            key={c.etiqueta}
            className="rounded-2xl border border-borde bg-superficie px-2 py-4 text-center"
          >
            <p className="text-2xl font-bold tabular-nums">{c.valor}</p>
            <p className="mt-0.5 text-xs text-texto-suave">{c.etiqueta}</p>
          </div>
        ))}
      </section>

      {p.temas.length > 1 && (
        <section className="rounded-3xl border border-borde bg-superficie p-6">
          <h2 className="text-lg font-semibold">En qué más fallas</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {p.temas.slice(1).map((t) => {
              const proporcion = Math.max(
                8,
                Math.round((t.veces / p.temas[0].veces) * 100)
              );
              return (
                <li key={t.clave}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{t.titulo}</span>
                    <span className="shrink-0 text-sm tabular-nums text-texto-suave">
                      {t.veces}×
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-superficie-2">
                    <div
                      className="h-full rounded-full bg-primario/60"
                      style={{ width: `${proporcion}%` }}
                    />
                  </div>
                  {t.ejemplos[0] && (
                    <p className="mt-1.5 text-sm text-texto-suave">
                      <span className="line-through">{t.ejemplos[0].error}</span>
                      <span className="mx-1.5">→</span>
                      <span className="text-exito">{t.ejemplos[0].correccion}</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
