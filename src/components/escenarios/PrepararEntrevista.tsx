"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Estrellas, Icono } from "@/components/ruta/Iconos";
import { AllisonAro, BotonOir, useVoz } from "@/components/ruta/leccion/comun";
import { CARGO_MAX, escenarioDeEntrevista, limpiarCargo, preparacionDe, rutaDeCargo, type Cargo } from "@/lib/escenarios/entrevista";
import type { Nivel } from "@/lib/tipos";

/**
 * Antes de la entrevista de trabajo (18 de noviembre de 2026): el alumno
 * elige el cargo -- uno de la lista o el que escriba -- y se prepara: qué
 * le van a pedir, las frases que le sirven (con su audio) y dos o tres
 * consejos. Todo esto es gratis: las intervenciones empiezan a contar
 * cuando entra a hablar con Ms. Carter.
 */
export function PrepararEntrevista({
  cargos,
  nivel,
  estrellas,
  veces,
}: {
  cargos: Cargo[];
  nivel: Nivel;
  estrellas: number;
  veces: number;
}) {
  const router = useRouter();
  const { decir } = useVoz(nivel);
  const [elegido, setElegido] = useState<Cargo | null>(null);
  const [propio, setPropio] = useState("");
  const [entrando, setEntrando] = useState(false);

  const cargoPropio = limpiarCargo(propio);
  const cargo: Cargo | null = elegido ?? (cargoPropio.length >= 3 ? { clave: "otro", es: cargoPropio } : null);
  const prep = preparacionDe(nivel);
  // Lo que le van a pedir, sin la tarea del imprevisto (es una sorpresa).
  const escena = escenarioDeEntrevista(nivel, cargo ?? cargos[0]);
  const tareas = escena.tareas.filter((_, i) => i + 1 !== escena.imprevisto?.tarea);
  const conImprevisto = !!escena.imprevisto;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-8 lg:max-w-2xl">
      <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
        <Link href="/escenarios" aria-label="Volver a Escenarios" className="grid size-9 place-items-center rounded-full hover:bg-superficie-2">
          <Icono nombre="cerrar" className="size-5" />
        </Link>
        <span className="flex-1">Escenarios · Trabajo</span>
        {veces > 0 && <Estrellas n={estrellas} className="size-[18px]" />}
      </div>

      <header className="cat-trabajo flex items-center gap-3.5 rounded-3xl bg-[var(--kf)] p-4">
        <AllisonAro tam={64} />
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-black">Entrevista de trabajo</h1>
          <p className="mt-0.5 text-sm font-semibold text-texto-suave">
            Allison es Ms. Carter, la entrevistadora. Te hace las preguntas de una entrevista de verdad, a tu nivel ({nivel}).
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[16px] font-black">1. ¿Para qué te presentas?</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cargo">
          {cargos.map((c) => {
            const on = elegido?.clave === c.clave;
            return (
              <button
                key={c.clave}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setElegido(on ? null : c);
                  setPropio("");
                }}
                className={`rounded-full border px-3.5 py-2 text-[13.5px] font-extrabold transition ${
                  on ? "border-primario bg-primario text-white" : "border-borde bg-superficie hover:bg-superficie-2"
                }`}
              >
                {c.es}
              </button>
            );
          })}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-texto-suave">O escribe el cargo al que aspiras:</span>
          <input
            value={propio}
            onChange={(e) => {
              setPropio(e.target.value.slice(0, CARGO_MAX));
              setElegido(null);
            }}
            maxLength={CARGO_MAX}
            placeholder="Diseñador gráfico, enfermera, programador…"
            className="rounded-2xl border border-borde bg-superficie px-4 py-3 text-base outline-none focus:border-primario"
          />
        </label>
      </section>

      {cargo && (
        <>
          <section className="flex flex-col gap-2.5 rounded-3xl border border-borde p-4">
            <h2 className="text-[16px] font-black">2. Prepárate</h2>
            <p className="text-sm font-semibold text-texto-suave">
              Te presentas para: <b className="text-texto">{cargo.es}</b>. Esto es lo que te van a pedir:
            </p>
            <ol className="flex flex-col gap-1.5">
              {tareas.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm font-semibold">
                  <span className="grid size-5 flex-none place-items-center rounded-full bg-primario-suave text-[11px] font-black text-primario">{i + 1}</span>
                  <span>{t.replace(/\.$/, "")}</span>
                </li>
              ))}
            </ol>
            {conImprevisto && <p className="text-[13px] font-bold text-oro">Y una pregunta que no esperas. Respira y responde con calma.</p>}
          </section>

          <section className="flex flex-col gap-2.5 rounded-3xl border border-borde p-4">
            <h2 className="text-[16px] font-black">Frases que te van a servir</h2>
            <ul className="flex flex-col gap-2">
              {prep.frases.map((f) => (
                <li key={f.en} className="flex items-center gap-2.5">
                  <BotonOir tam="chico" onClick={() => void decir(f.en)} />
                  <span className="min-w-0">
                    <b className="block text-[14.5px] leading-tight font-extrabold">{f.en}</b>
                    <small className="block text-[12.5px] font-semibold text-texto-suave">{f.es}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2 rounded-3xl bg-oro-suave p-4 text-oro">
            <h2 className="text-[15px] font-black">Consejos de Allison</h2>
            <ul className="flex flex-col gap-1.5">
              {prep.consejos.map((c) => (
                <li key={c} className="text-sm font-semibold">
                  · {c}
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            disabled={entrando}
            onClick={() => {
              setEntrando(true);
              router.push(`/escenarios/entrevista/${encodeURIComponent(rutaDeCargo(cargo))}`);
            }}
            className="degradado-primario sombra-accion rounded-2xl px-5 py-3.5 text-center font-extrabold text-white disabled:opacity-60"
          >
            {entrando ? "Abriendo…" : "Empezar la entrevista"}
          </button>
          <p className="-mt-2 text-center text-[12.5px] font-semibold text-texto-suave">
            Cada respuesta tuya usa una intervención. El informe final, una más.
          </p>
        </>
      )}
    </main>
  );
}
