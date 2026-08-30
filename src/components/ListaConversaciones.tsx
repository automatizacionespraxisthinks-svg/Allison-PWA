"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ResumenConversacion } from "@/lib/conversaciones";

function cuando(iso: string): string {
  const fecha = new Date(iso);
  const dias = Math.floor((Date.now() - fecha.getTime()) / 86_400_000);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "long" });
}

export function ListaConversaciones({
  conversaciones,
}: {
  conversaciones: ResumenConversacion[];
}) {
  const router = useRouter();
  const [borrando, setBorrando] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [confirmarTodo, setConfirmarTodo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function borrar(id: string) {
    setError(null);
    setBorrando(id);
    const r = await fetch(`/api/conversaciones/${id}`, { method: "DELETE" });
    setBorrando(null);
    setConfirmar(null);
    if (!r.ok) {
      setError("No pudimos borrarla. Intenta de nuevo.");
      return;
    }
    router.refresh();
  }

  async function borrarTodas() {
    setError(null);
    setBorrando("todas");
    const r = await fetch("/api/conversaciones", { method: "DELETE" });
    setBorrando(null);
    setConfirmarTodo(false);
    if (!r.ok) {
      setError("No pudimos borrarlas. Intenta de nuevo.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2.5">
        {conversaciones.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border border-borde bg-superficie p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <Link href={`/conversaciones/${c.id}`} className="min-w-0 flex-1">
                <p className="text-sm text-texto-suave">
                  {cuando(c.ultimaActividad)} · Nivel {c.nivel}
                </p>
                {c.leccion && (
                  <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primario-suave px-2 py-0.5 text-xs font-semibold text-primario">
                    <span aria-hidden>🎯</span> {c.leccion}
                  </p>
                )}
                {c.primeraFrase && (
                  <p className="mt-1 line-clamp-2 text-[15px] leading-snug">
                    {c.primeraFrase}
                  </p>
                )}
                <p className="mt-1.5 text-sm text-texto-suave">
                  {c.mensajes} {c.mensajes === 1 ? "mensaje" : "mensajes"}
                  {c.correcciones > 0 && (
                    <>
                      <span className="mx-1.5">·</span>
                      {c.correcciones}{" "}
                      {c.correcciones === 1 ? "corrección" : "correcciones"}
                    </>
                  )}
                </p>
              </Link>

              <button
                type="button"
                onClick={() => setConfirmar(confirmar === c.id ? null : c.id)}
                aria-label="Borrar conversación"
                className="shrink-0 rounded-full border border-borde p-2 text-texto-suave transition hover:bg-superficie-2"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>

            {confirmar === c.id && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-error/10 p-3">
                <p className="text-sm text-error">
                  ¿Borrar esta conversación? No se puede deshacer.
                </p>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmar(null)}
                    className="rounded-lg px-3 py-1.5 text-sm text-texto-suave"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => borrar(c.id)}
                    disabled={borrando === c.id}
                    className="rounded-lg bg-error px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {borrando === c.id ? "…" : "Borrar"}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-2 rounded-2xl border border-borde bg-superficie p-4">
        {confirmarTodo ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Se borran las <strong>{conversaciones.length}</strong>{" "}
              conversaciones. <strong>Tu progreso no se toca</strong>: la racha,
              los temas y las correcciones se quedan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmarTodo(false)}
                className="flex-1 rounded-xl border border-borde px-4 py-2.5 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={borrarTodas}
                disabled={borrando === "todas"}
                className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {borrando === "todas" ? "Borrando…" : "Borrar todas"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmarTodo(true)}
            className="w-full text-sm text-texto-suave underline"
          >
            Borrar todas mis conversaciones
          </button>
        )}
      </div>
    </div>
  );
}
