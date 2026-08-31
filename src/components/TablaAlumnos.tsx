"use client";

import { useMemo, useState } from "react";
import type { AlumnoDelColegio } from "@/lib/colegio";
import { pedir } from "@/lib/pedir";

/**
 * La lista de alumnos, ordenada por quién necesita atención.
 *
 * No es un volcado de datos: los que llevan más días sin practicar van
 * arriba, porque eso es lo único sobre lo que el coordinador puede
 * actuar. Los que van bien no necesitan que nadie los mire.
 */
export function TablaAlumnos({ alumnos }: { alumnos: AlumnoDelColegio[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [pinNuevo, setPinNuevo] = useState<{ id: string; pin: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrados = q
      ? alumnos.filter(
          (a) =>
            a.nombre.toLowerCase().includes(q) ||
            a.username.toLowerCase().includes(q)
        )
      : alumnos;

    // Nunca entró primero, luego más días sin practicar
    return [...filtrados].sort((a, b) => {
      const da = a.diasSinPracticar ?? 9999;
      const db = b.diasSinPracticar ?? 9999;
      return db - da || a.nombre.localeCompare(b.nombre);
    });
  }, [alumnos, busqueda]);

  async function reiniciarPin(a: AlumnoDelColegio) {
    setError(null);
    setOcupado(a.id);
    const r = await pedir("/api/colegio/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumnoId: a.id }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(null);
    if (!r?.ok) {
      setError(d.error ?? "No se pudo reiniciar el PIN.");
      return;
    }
    setPinNuevo({ id: a.id, pin: d.pin });
  }

  const estado = (a: AlumnoDelColegio) => {
    if (a.diasSinPracticar === null) {
      return { texto: "Nunca ha entrado", clase: "text-error" };
    }
    if (a.mensajesSemana > 0) {
      return { texto: `${a.mensajesSemana} esta semana`, clase: "text-exito" };
    }
    return { texto: `${a.diasSinPracticar} días sin practicar`, clase: "text-acento" };
  };

  return (
    <section className="flex flex-col gap-3">
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar un alumno"
        aria-label="Buscar un alumno"
        className="rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario"
      />

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">
          {error}
        </p>
      )}

      {visibles.length === 0 && (
        <p className="rounded-2xl border border-borde bg-superficie p-6 text-center text-texto-suave">
          Ningún alumno coincide con la búsqueda.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {visibles.map((a) => {
          const e = estado(a);
          const mostrandoPin = pinNuevo?.id === a.id;

          return (
            <li
              key={a.id}
              className="rounded-2xl border border-borde bg-superficie p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{a.nombre}</p>
                  <p className="mt-0.5 text-sm text-texto-suave">
                    <span className="font-mono">{a.username}</span>
                    <span className="mx-1.5">·</span>
                    Nivel {a.nivel}
                    {a.rachaDias > 0 && (
                      <>
                        <span className="mx-1.5">·</span>
                        {a.rachaDias} {a.rachaDias === 1 ? "día" : "días"} de racha
                      </>
                    )}
                  </p>
                  <p className={`mt-1 text-sm font-medium ${e.clase}`}>{e.texto}</p>
                </div>

                <button
                  type="button"
                  onClick={() => reiniciarPin(a)}
                  disabled={ocupado === a.id}
                  className="shrink-0 rounded-xl border border-borde px-3 py-2 text-sm font-medium transition hover:bg-superficie-2 disabled:opacity-50"
                >
                  {ocupado === a.id ? "…" : "Reiniciar PIN"}
                </button>
              </div>

              {mostrandoPin && (
                <div className="mt-3 rounded-xl bg-primario-suave p-3 text-center">
                  <p className="text-sm text-primario">
                    PIN nuevo de {a.nombre.split(" ")[0]}:
                  </p>
                  <p className="font-mono text-3xl font-bold tracking-[0.4em] text-primario">
                    {pinNuevo.pin}
                  </p>
                  <p className="mt-1 text-xs text-texto-suave">
                    Anótalo ahora: no lo volvemos a mostrar.
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
