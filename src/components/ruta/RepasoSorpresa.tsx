"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { sonar } from "@/lib/sonidos";
import type { PreguntaRepaso } from "@/lib/ruta/repaso";
import type { Nivel } from "@/lib/tipos";
import { Estrella, Icono } from "./Iconos";
import type { FinActividad } from "./leccion/api";
import { Dilo } from "./leccion/Dilo";
import { QueEsEsto } from "./leccion/QueEsEsto";
import { Repite } from "./leccion/Repite";
import { Responde } from "./leccion/Responde";

type Pregunta = PreguntaRepaso & { parada: string; leccion: number };

/**
 * Repaso sorpresa (pantalla 9, versión 9A): "Con lo que fallaste esta
 * semana", cinco preguntas como máximo, una a la vez, con las actividades
 * aprobadas. Cada una dice cuándo y dónde se falló. Al terminar gana 1
 * estrella. Solo gastan intervención las preguntas con evaluación corta.
 */
export function RepasoSorpresa({ id, preguntas, ctx }: { id: string; preguntas: Pregunta[]; ctx: { nivel: Nivel; nombre: string } }) {
  const [indice, setIndice] = useState(0);
  /** Cómo le fue en cada pregunta; null si no se calificó (Repite escrita). */
  const [bien, setBien] = useState<(boolean | null)[]>([]);
  const [sinSaldo, setSinSaldo] = useState(false);
  const [fin, setFin] = useState<{ racha: number; minutosHoy: number } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const desde = useRef(0);

  useEffect(() => {
    desde.current = Date.now();
  }, []);

  const total = preguntas.length;
  const p = preguntas[indice];

  async function guardar(resultados: (boolean | null)[]) {
    setGuardando(true);
    setError(null);
    try {
      const r = await fetch("/api/ruta/repaso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          // Lo que no se calificó no sale de la lista ni cuenta como fallo.
          resultados: resultados.flatMap((b, i) => (b === null ? [] : [{ n: preguntas[i].n, bien: b }])),
          segundos: Math.min(1800, (Date.now() - desde.current) / 1000),
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setFin({ racha: d.racha, minutosHoy: d.minutosHoy });
      window.scrollTo({ top: 0 });
    } catch {
      setError("No se guardó tu repaso. Revisa tu conexión e intenta otra vez.");
    } finally {
      setGuardando(false);
    }
  }

  function alTerminar(f: FinActividad) {
    const resultados = [...bien, f.calificadas === 0 ? null : f.fallos.length === 0];
    setBien(resultados);
    if (indice + 1 < total) {
      setIndice(indice + 1);
      window.scrollTo({ top: 0 });
    } else void guardar(resultados);
  }

  if (fin) {
    return <Final bien={bien.filter((b) => b === true).length} total={total} nombre={ctx.nombre} racha={fin.racha} />;
  }

  const contexto = { nivel: p.nivel, nombre: ctx.nombre, parada: p.parada, leccion: p.leccion, repaso: { id, n: p.n } };
  const comun = { ctx: contexto, onTerminar: alTerminar, onSinSaldo: () => setSinSaldo(true) };
  const a = p.actividad;
  const terminado = bien.length === total;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3.5 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/ruta" aria-label="Salir del repaso" className="grid size-10 flex-none place-items-center rounded-full border border-borde">
          <Icono nombre="atras" className="size-5" />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <small className="text-[11px] font-extrabold tracking-[0.08em] text-texto-suave uppercase">Con lo que fallaste esta semana</small>
          <h1 className="text-[22px] font-black">Repaso sorpresa</h1>
        </div>
        <span className="grid size-12 flex-none place-items-center rounded-2xl border-2 border-oro bg-gradient-to-br from-[#ffd36b] to-[#f5a623] text-white shadow-sm">
          <Icono nombre="regalo" className="size-6" />
        </span>
      </div>

      <div className="flex items-center gap-2" aria-label={`Pregunta ${indice + 1} de ${total}`}>
        <div className="flex flex-1 gap-1.5">
          {preguntas.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < bien.length ? "bg-menta" : i === indice ? "bg-primario" : "bg-superficie-2"}`}
            />
          ))}
        </div>
        <span className="text-[13px] font-extrabold text-texto-suave">
          {Math.min(indice + 1, total)} de {total}
        </span>
      </div>

      <span className="self-start rounded-full bg-oro-suave px-3 py-1 text-xs font-extrabold text-oro">{p.etiqueta}</span>

      <div className={guardando || terminado ? "pointer-events-none opacity-60" : ""}>
        {a.tipo === "que-es-esto" && <QueEsEsto key={indice} a={a} {...comun} />}
        {a.tipo === "dilo" && <Dilo key={indice} a={a} {...comun} />}
        {a.tipo === "repite" && <Repite key={indice} a={a} {...comun} />}
        {a.tipo === "responde" && <Responde key={indice} a={a} {...comun} />}
      </div>

      {error && (
        <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-oro-suave px-4 py-3 text-sm font-semibold text-oro">
          {error}
          <button
            type="button"
            onClick={() => void guardar(bien)}
            disabled={guardando}
            className="rounded-xl bg-oro px-4 py-2.5 font-extrabold text-superficie disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Reintentar"}
          </button>
        </div>
      )}
      {sinSaldo && (
        <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-oro-suave px-4 py-3 text-sm font-semibold text-oro">
          <b className="font-black">Te quedaste sin intervenciones</b>
          <span>
            Comprobar lo que dices con la voz usa intervenciones. Puedes recargar, o escribir tus respuestas: escritas no gastan
            (menos en Responde rápido).
          </span>
          <div className="flex gap-2">
            <Link href="/recargar" className="degradado-primario flex-1 rounded-xl px-4 py-2.5 text-center font-extrabold text-white">
              Recargar
            </Link>
            <button type="button" onClick={() => setSinSaldo(false)} className="flex-1 rounded-xl border border-borde px-4 py-2.5 font-extrabold">
              Seguir escribiendo
            </button>
          </div>
        </div>
      )}

      <p className="mt-auto flex items-center justify-center gap-1.5 text-[13px] font-extrabold text-oro">
        <Estrella llena className="size-4" />
        Termínalo y gana 1 estrella
      </p>
    </main>
  );
}

function Final({ bien, total, nombre, racha }: { bien: number; total: number; nombre: string; racha: number }) {
  useEffect(() => sonar("logro"), []);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="grid size-20 place-items-center rounded-3xl border-2 border-oro bg-gradient-to-br from-[#ffd36b] to-[#f5a623] text-white shadow">
        <Icono nombre="regalo" className="size-10" />
      </span>
      <Image src="/allison.png" alt="Allison" width={96} height={96} className="aro-allison bien size-24 rounded-full object-cover" />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-balance">¡Repaso completo, {nombre.split(" ")[0]}!</h1>
        <p className="text-texto-suave">
          Te {bien === 1 ? "salió bien 1" : `salieron bien ${bien}`} de {total}.{" "}
          {bien < total ? "Lo que se te escapó vuelve en otro repaso." : "¡Ya no se te escapa nada!"}
        </p>
      </div>
      <div className="flex gap-2 text-sm font-bold text-texto-suave">
        <span className="flex items-center gap-1.5 rounded-2xl bg-oro-suave px-4 py-2.5 text-oro">
          <Estrella llena className="size-5" />
          <b className="text-lg font-black">+1</b> estrella
        </span>
        <span className="flex items-center gap-1.5 rounded-2xl bg-primario-suave px-4 py-2.5 text-primario">
          <Icono nombre="racha" className="size-5" />
          <b className="text-lg font-black">{racha}</b> {racha === 1 ? "día" : "días"}
        </span>
      </div>
      <Link href="/ruta" className="degradado-primario sombra-accion w-full rounded-2xl px-5 py-4 font-extrabold text-white">
        Volver a mi ruta
      </Link>
    </main>
  );
}
