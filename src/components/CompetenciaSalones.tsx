"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CompetenciaDelColegio } from "@/lib/competencia";
import { ganadores, minutosEnTexto, type SalonEnTabla } from "@/lib/competencia/tabla";

/** "9A", "9A y 9B", "9A, 9B y 10A". */
function lista(cursos: string[]): string {
  return cursos.length < 2 ? (cursos[0] ?? "") : `${cursos.slice(0, -1).join(", ")} y ${cursos.at(-1)}`;
}

/** "13 de octubre": el lunes de una semana. */
function diaDe(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long" });
}

function Tabla({ tabla, ganadores: marcar }: { tabla: SalonEnTabla[]; ganadores: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-texto-suave">
            <th className="py-1.5 pr-2 font-semibold">Puesto</th>
            <th className="py-1.5 pr-2 font-semibold">Salón</th>
            <th className="py-1.5 pr-2 text-right font-semibold">Alumnos</th>
            <th className="py-1.5 text-right font-semibold">Minutos por alumno</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {tabla.map((s) => (
            <tr key={s.curso} className={`border-t border-borde ${marcar && s.puesto === 1 && s.minutos > 0 ? "font-bold" : ""}`}>
              <td className="py-1.5 pr-2">{s.puesto}.º</td>
              <td className="py-1.5 pr-2">{s.curso}</td>
              <td className="py-1.5 pr-2 text-right">{s.alumnos}</td>
              <td className="py-1.5 text-right">{s.minutos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * La competencia por salón en el panel del coordinador: la tabla de esta
 * semana, el ganador y la tabla de la anterior, y el interruptor para
 * apagarla en su colegio.
 */
export function CompetenciaSalones({ c }: { c: CompetenciaDelColegio }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cambiar(activa: boolean) {
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch("/api/colegio/competencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa }),
      });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No se pudo cambiar. Intenta otra vez.");
    } finally {
      setOcupado(false);
    }
  }

  const ganaron = ganadores(c.semanaAnterior.tabla);
  const hay = c.estaSemana.tabla.length > 0;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-4" aria-labelledby="competencia">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="competencia" className="font-semibold">
          Competencia de salones
        </h2>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void cambiar(!c.activa)}
          className="rounded-full border border-borde px-3 py-1 text-xs font-semibold disabled:opacity-50"
        >
          {ocupado ? "Guardando…" : c.activa ? "Apagar" : "Encender"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-acento">
          {error}
        </p>
      )}

      {!c.activa ? (
        <p className="text-sm text-texto-suave">
          Apagada: los alumnos no ven la competencia. Al encenderla, cada semana compiten los salones por los minutos de
          práctica por alumno.
        </p>
      ) : (
        <>
          {ganaron.length > 0 && (
            <p className="rounded-xl bg-exito/10 px-3 py-2 text-sm">
              {ganaron.length === 1 ? "Ganó" : "Empataron en el primer puesto"} la semana del {diaDe(c.lunesAnterior)}:{" "}
              <b>{lista(ganaron.map((s) => s.curso))}</b>, con {minutosEnTexto(ganaron[0].minutos)} por alumno.
            </p>
          )}

          {hay ? (
            <>
              <h3 className="text-sm font-semibold">Esta semana (desde el lunes {diaDe(c.lunes)})</h3>
              <Tabla tabla={c.estaSemana.tabla} ganadores={false} />
            </>
          ) : (
            <p className="text-sm text-texto-suave">
              Para competir hacen falta al menos dos salones con 5 alumnos o más, cada uno con su curso cargado.
            </p>
          )}

          {c.semanaAnterior.tabla.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold">Semana pasada</summary>
              <div className="pt-2">
                <Tabla tabla={c.semanaAnterior.tabla} ganadores />
              </div>
            </details>
          )}

          {(c.estaSemana.pequenos.length > 0 || c.sinCurso > 0) && (
            <p className="text-sm text-texto-suave">
              {c.estaSemana.pequenos.length > 0 &&
                `No compiten por tener menos de 5 alumnos: ${lista(c.estaSemana.pequenos)}. `}
              {c.sinCurso > 0 &&
                `${c.sinCurso === 1 ? "1 alumno no tiene" : `${c.sinCurso} alumnos no tienen`} curso: cárgalo en «Cargar alumnos».`}
            </p>
          )}

          <p className="text-xs text-texto-suave">
            Cuentan los minutos de práctica de cada alumno, hasta 30 al día, divididos entre todos los alumnos del salón
            (los que no practican suman cero). Los alumnos solo ven el puesto de su salón y los tres primeros, nunca
            cuánto practicó un compañero.
          </p>
        </>
      )}
    </section>
  );
}
