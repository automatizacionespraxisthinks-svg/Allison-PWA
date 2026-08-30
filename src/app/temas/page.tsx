import Link from "next/link";
import { redirect } from "next/navigation";
import { META_LOGROS, unidadesDe } from "@/lib/curriculo";
import { progresoLecciones } from "@/lib/progreso";
import { alumnoActual } from "@/lib/sesion";

/**
 * La pantalla de temas: el currículo del nivel del alumno.
 *
 * Cada unidad esconde su gramática detrás de un contexto real — la
 * tarjeta dice "El fin de semana pasado", no "Pasado simple" — y la
 * conversación libre está SIEMPRE al final: lo de hoy no desaparece,
 * se vuelve una opción más.
 */
export default async function PaginaTemas() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const unidades = unidadesDe(alumno.nivel);
  const avance = await progresoLecciones(alumno.id);
  const completadas = unidades.filter(
    (u) => avance[u.clave]?.completada
  ).length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/practicar"
          aria-label="Volver a la conversación"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-borde bg-superficie text-texto-suave transition hover:bg-superficie-2 hover:text-texto"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold leading-tight">
            Temas de tu nivel
          </h1>
          <p className="text-sm text-texto-suave">
            Nivel {alumno.nivel} · {completadas} de {unidades.length}{" "}
            completados
          </p>
        </div>
      </header>

      <ul className="space-y-2.5">
        {unidades.map((u) => {
          const a = avance[u.clave];
          const completada = a?.completada ?? false;
          const logros = Math.min(a?.logros ?? 0, META_LOGROS);
          const enCurso = !completada && logros > 0;

          return (
            <li key={u.clave}>
              <Link
                href={`/practicar?leccion=${u.clave}`}
                className={`flex items-center gap-3.5 rounded-2xl border bg-superficie px-4 py-3.5 transition hover:border-primario/50 ${
                  enCurso ? "border-primario" : "border-borde"
                }`}
              >
                {completada ? (
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-exito/15 text-exito"
                  >
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold ${
                      enCurso
                        ? "bg-primario text-white"
                        : "bg-superficie-2 text-texto-suave"
                    }`}
                  >
                    {u.orden}
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">
                    {u.titulo}
                  </span>
                  <span className="block truncate text-xs text-texto-suave">
                    {u.gramatica}
                    {enCurso && ` · ${logros} de ${META_LOGROS} logros`}
                  </span>
                </span>

                {completada ? (
                  <span className="shrink-0 text-xs font-semibold text-exito">
                    Completado
                  </span>
                ) : enCurso ? (
                  <span className="shrink-0 rounded-full bg-primario-suave px-2.5 py-1 text-xs font-semibold text-primario">
                    Continuar
                  </span>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="size-4 shrink-0 text-texto-suave"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                )}
              </Link>
            </li>
          );
        })}

        <li>
          <Link
            href="/practicar?libre=1"
            className="flex items-center gap-3.5 rounded-2xl border border-dashed border-borde bg-superficie-2/60 px-4 py-3.5 transition hover:border-primario/50"
          >
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primario-suave text-primario"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">
                Conversación libre
              </span>
              <span className="block text-xs text-texto-suave">
                de lo que quieras, sin objetivo
              </span>
            </span>
          </Link>
        </li>
      </ul>

      <p className="mt-5 text-center text-xs text-texto-suave">
        Un logro es usar bien la estructura del tema por tu cuenta. Con{" "}
        {META_LOGROS} logros, el tema queda completado. Si cambias de
        nivel, verás los temas de ese nivel.
      </p>
    </main>
  );
}
