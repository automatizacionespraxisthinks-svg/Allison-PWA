"use client";

import { useState } from "react";
import { BotonOir } from "@/components/ruta/leccion/comun";
import { pedir } from "@/lib/pedir";

interface Informe {
  resumen: string;
  fortalezas: string[];
  frases: { dijo: string; mejor: string; porque: string }[];
  modelo: { pregunta: string; respuesta: string } | null;
  consejo: string;
}

/**
 * El informe de la entrevista de trabajo, al final del resumen (18 de
 * noviembre de 2026). No se pide solo: usa la IA y cuesta una
 * intervención, así que el alumno lo decide con el botón, que lo dice.
 * Una vez hecho queda guardado con la escena.
 */
export function InformeEntrevista({ conversacion, decir }: { conversacion: string; decir: (t: string) => Promise<unknown> }) {
  const [informe, setInforme] = useState<Informe | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedirInforme() {
    if (cargando) return;
    setCargando(true);
    setError(null);
    const r = await pedir("/api/escenarios/entrevista/informe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversacion }),
    });
    const datos = r ? await r.json().catch(() => ({})) : {};
    setCargando(false);
    if (!r?.ok || !datos.informe) {
      setError(datos.mensaje ?? "No pudimos hacer tu informe. Intenta otra vez.");
      return;
    }
    setInforme(datos.informe as Informe);
  }

  if (!informe) {
    return (
      <div className="flex flex-col gap-2 rounded-3xl border-2 border-primario/30 bg-primario-suave px-4 py-3.5">
        <b className="text-[15px] font-black text-primario">Tu informe de la entrevista</b>
        <span className="text-sm font-semibold text-texto-suave">
          Allison revisa toda la entrevista: lo que hiciste bien, tus frases dichas mejor y cómo responder la pregunta más difícil.
        </span>
        <button
          type="button"
          onClick={() => void pedirInforme()}
          disabled={cargando}
          className="degradado-primario sombra-accion mt-1 rounded-2xl px-5 py-3 text-center font-extrabold text-white disabled:opacity-60"
        >
          {cargando ? "Allison está revisando tu entrevista…" : "Ver mi informe · usa 1 intervención"}
        </button>
        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border-2 border-primario/30 px-4 py-4" aria-label="Informe de la entrevista">
      <b className="text-[17px] font-black">Tu informe de la entrevista</b>
      <p className="text-sm leading-relaxed font-semibold">{informe.resumen}</p>

      {informe.fortalezas.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-menta-suave px-3.5 py-3 text-menta">
          <b className="text-[14px] font-black">Lo que hiciste bien</b>
          <ul className="flex flex-col gap-1">
            {informe.fortalezas.map((f, i) => (
              <li key={i} className="text-sm font-semibold">
                · {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {informe.frases.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-oro-suave px-3.5 py-3 text-oro">
          <b className="text-[14px] font-black">Tus frases, dichas mejor</b>
          {informe.frases.map((f, i) => (
            <div key={i} className={`flex flex-col gap-1 ${i ? "border-t border-oro/20 pt-2.5" : ""}`}>
              <span className="text-sm font-semibold">Dijiste: &ldquo;{f.dijo}&rdquo;</span>
              <span className="text-sm font-extrabold text-texto">Mejor: &ldquo;{f.mejor}&rdquo;</span>
              {f.porque && <span className="text-[13px] font-semibold">{f.porque}</span>}
              <span>
                <BotonOir onClick={() => void decir(f.mejor)} texto="Oír" />
              </span>
            </div>
          ))}
        </div>
      )}

      {informe.modelo && (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-primario-suave px-3.5 py-3">
          <b className="text-[14px] font-black text-primario">Una respuesta de ejemplo</b>
          <span className="text-sm font-semibold text-texto-suave">Ms. Carter: &ldquo;{informe.modelo.pregunta}&rdquo;</span>
          <span className="text-sm font-extrabold">&ldquo;{informe.modelo.respuesta}&rdquo;</span>
          <span>
            <BotonOir onClick={() => void decir(informe.modelo!.respuesta)} texto="Oír" />
          </span>
        </div>
      )}

      {informe.consejo && (
        <p className="rounded-2xl bg-superficie-2 px-3.5 py-3 text-sm font-semibold">
          <b className="font-black">Para la próxima: </b>
          {informe.consejo}
        </p>
      )}
    </section>
  );
}
