import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarioPractica } from "@/components/CalendarioPractica";
import { progresoDe } from "@/lib/progreso";
import { alumnoActual } from "@/lib/sesion";

/** Menos de un minuto se muestra en segundos: "0 minutos" parece un error. */
function tiempoHablado(segundos: number): { valor: string; etiqueta: string } {
  if (segundos < 60) return { valor: String(segundos), etiqueta: "segundos hablando" };
  if (segundos < 3600) {
    return { valor: String(Math.round(segundos / 60)), etiqueta: "minutos hablando" };
  }
  return { valor: (segundos / 3600).toFixed(1), etiqueta: "horas hablando" };
}

const ETIQUETA_TIPO: Record<string, string> = {
  pronunciacion: "Pronunciación",
  gramatica: "Gramática",
  vocabulario: "Vocabulario",
  naturalidad: "Naturalidad",
};

export default async function PaginaProgreso() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const p = await progresoDe(alumno.id);
  const sinDatos = p.totalMensajes === 0;
  const tiempo = tiempoHablado(p.totalSegundos);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tu progreso</h1>
        <Link
          href="/practicar"
          className="rounded-full bg-primario px-4 py-2 text-sm font-semibold text-white"
        >
          Practicar
        </Link>
      </header>

      {sinDatos ? (
        <div className="rounded-2xl border border-borde bg-superficie p-8 text-center">
          <p className="font-medium">Todavía no has practicado.</p>
          <p className="mt-1 text-sm text-texto-suave">
            Habla con Allison y aquí verás cómo vas avanzando.
          </p>
          <Link
            href="/practicar"
            className="mt-4 inline-block rounded-xl bg-primario px-6 py-2.5 font-semibold text-white"
          >
            Empezar
          </Link>
        </div>
      ) : (
        <>
          {/* Racha */}
          <section className="rounded-2xl border border-borde bg-superficie p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primario">
                  {p.rachaDias} {p.rachaDias === 1 ? "día" : "días"}
                </p>
                <p className="text-sm text-texto-suave">seguidos practicando</p>
              </div>
              <span className="text-4xl" aria-hidden>
                {p.practicoHoy ? "🔥" : "🌱"}
              </span>
            </div>
            {!p.practicoHoy && (
              <p className="mt-3 rounded-lg bg-acento/10 p-2.5 text-sm text-acento">
                Todavía no practicas hoy. Un mensaje mantiene la racha.
              </p>
            )}
          </section>

          {/* Cifras */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { valor: p.totalMensajes, etiqueta: "mensajes" },
              { valor: tiempo.valor, etiqueta: tiempo.etiqueta },
              { valor: p.erroresCorregidos, etiqueta: "correcciones" },
              { valor: p.diasPracticados, etiqueta: "días en total" },
            ].map((c) => (
              <div
                key={c.etiqueta}
                className="rounded-xl border border-borde bg-superficie p-4 text-center"
              >
                <p className="text-2xl font-semibold tabular-nums">{c.valor}</p>
                <p className="mt-0.5 text-xs text-texto-suave">{c.etiqueta}</p>
              </div>
            ))}
          </section>

          <CalendarioPractica dias={p.ultimos30} />

          {/* Errores que más repite */}
          {p.erroresFrecuentes.length > 0 && (
            <section className="rounded-2xl border border-borde bg-superficie p-5">
              <h2 className="font-semibold">Lo que más se te repite</h2>
              <p className="mt-1 text-sm text-texto-suave">
                Practica estos y vas a notar el salto más rápido.
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {p.erroresFrecuentes.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 border-t border-borde pt-3 first:border-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                        {ETIQUETA_TIPO[e.tipo] ?? e.tipo}
                      </span>
                      <p className="mt-0.5 break-words">
                        <span className="text-error line-through">{e.textoError}</span>
                        <span className="mx-1.5 text-texto-suave">→</span>
                        <span className="font-medium text-exito">{e.correccion}</span>
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-superficie-2 px-2.5 py-1 text-xs tabular-nums text-texto-suave">
                      {e.veces}×
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
