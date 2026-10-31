"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { pedir } from "@/lib/pedir";

interface Colegio {
  id: string;
  nombre: string;
  alumnos: number;
  cursos: { curso: string; alumnos: number }[];
}

/**
 * Asignar saldo a un colegio o a uno o varios de sus cursos (plan,
 * sección 12; boceto 4). Antes de confirmar dice a cuántos alumnos
 * activos les llega y el total; los otros cursos no cambian.
 */
export function AsignarSaldo({ colegios }: { colegios: Colegio[] }) {
  const router = useRouter();
  const [colegioId, setColegioId] = useState(colegios[0]?.id ?? "");
  const [porAlumno, setPorAlumno] = useState("200");
  const [motivo, setMotivo] = useState("");
  /** null: todo el colegio. */
  const [cursos, setCursos] = useState<string[] | null>(null);
  /**
   * El total calculado, con los datos con que se calculó (si algo cambia,
   * ya no vale) y el id de la operación, creado al ver el total. El
   * servidor no asigna dos veces el mismo id: si la respuesta se pierde y
   * se reintenta, ningún alumno recibe doble (auditoría, 30 de octubre de 2026).
   */
  const [calculado, setCalculado] = useState<{ alumnos: number; total: number; para: string; operacion: string } | null>(null);
  /** Una asignación cuya respuesta se perdió: si se vuelve a calcular
   *  igual, conserva su id y repetirla no suma otra vez. */
  const [incierta, setIncierta] = useState<{ para: string; operacion: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const colegio = colegios.find((c) => c.id === colegioId);
  const cantidad = Math.floor(Number(porAlumno) || 0);

  // Cualquier cambio obliga a volver a ver el total antes de confirmar.
  const para = JSON.stringify([colegioId, cantidad, motivo, cursos]);
  const vista = calculado?.para === para ? calculado : null;

  function alternar(curso: string) {
    setCursos((actual) => {
      const lista = actual ?? [];
      const nueva = lista.includes(curso) ? lista.filter((c) => c !== curso) : [...lista, curso];
      return nueva.length ? nueva : null;
    });
  }

  async function enviar(confirmar: boolean) {
    const operacion = confirmar ? vista?.operacion : undefined;
    setOcupado(true);
    setError(null);
    setAviso(null);
    const r = await pedir("/api/admin/colegios/asignar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institucionId: colegioId, cursos, porAlumno: cantidad, motivo, confirmar, operacion }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(false);
    // Al confirmar, sin respuesta (o con un 5xx del proxy) no se sabe si
    // se asignó: el botón no queda listo para repetir y la lista de
    // asignaciones se refresca para revisarla.
    if (confirmar && operacion && (!r || r.status >= 500)) {
      setIncierta({ para, operacion });
      setCalculado(null);
      setError("No sabemos si quedó: revisa el historial antes de repetir.");
      router.refresh();
      return;
    }
    if (!r?.ok) return setError(d.error ?? "No se pudo asignar.");
    if (confirmar) {
      setAviso(
        d.repetida
          ? `Esa asignación ya estaba hecha: ${d.total.toLocaleString("es-CO")} intervenciones entre ${d.alumnos} alumnos. No se sumó otra vez.`
          : `Listo: ${d.total.toLocaleString("es-CO")} intervenciones repartidas entre ${d.alumnos} alumnos.`
      );
      setMotivo("");
      setCalculado(null);
      setIncierta(null);
      router.refresh();
    } else {
      setCalculado({
        alumnos: d.alumnos,
        total: d.total,
        para,
        operacion: incierta?.para === para ? incierta.operacion : crypto.randomUUID(),
      });
    }
  }

  if (!colegios.length) {
    return <p className="rounded-2xl border border-borde bg-superficie p-5 text-sm text-texto-suave">Todavía no hay colegios. Créalos en Convenios.</p>;
  }

  const destino = cursos === null ? "a todo el colegio" : cursos.length === 1 ? `al curso ${cursos[0]}` : `a los cursos ${cursos.join(", ")}`;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-5">
      <h2 className="font-bold">Asignar saldo a un colegio o a un curso</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Colegio</span>
          <select
            value={colegioId}
            onChange={(e) => {
              setColegioId(e.target.value);
              setCursos(null);
            }}
            className="h-10 rounded-xl border border-borde bg-superficie px-3"
          >
            {colegios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {c.alumnos} alumnos
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Intervenciones por alumno</span>
          <input
            type="number"
            min={1}
            max={5000}
            value={porAlumno}
            onChange={(e) => setPorAlumno(e.target.value)}
            className="h-10 rounded-xl border border-borde bg-superficie px-3"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Motivo</span>
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={200}
          placeholder="Ej.: Pago octubre 2026"
          className="h-10 rounded-xl border border-borde bg-superficie px-3"
        />
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium">Elige uno o varios cursos</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCursos(null)}
            aria-pressed={cursos === null}
            className={`rounded-full border px-3 py-1.5 font-medium ${cursos === null ? "border-primario bg-primario text-white" : "border-borde"}`}
          >
            Todos · {colegio?.alumnos ?? 0}
          </button>
          {colegio?.cursos.map((c) => {
            const on = cursos?.includes(c.curso) ?? false;
            return (
              <button
                key={c.curso}
                type="button"
                onClick={() => alternar(c.curso)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 font-medium ${on ? "border-primario bg-primario text-white" : "border-borde"}`}
              >
                {c.curso === "(sin curso)" ? "Sin curso" : c.curso} · {c.alumnos}
              </button>
            );
          })}
        </div>
      </div>

      {vista ? (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-primario/30 bg-primario-suave/40 p-4">
          <p className="text-[15px]">
            Se sumarán <b>{vista.total.toLocaleString("es-CO")} intervenciones</b> {destino}: {vista.alumnos} alumnos activos × {cantidad} cada uno.
            {cursos !== null && " Los otros cursos del colegio no cambian."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void enviar(true)}
              disabled={ocupado}
              className="rounded-xl bg-primario px-5 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {ocupado ? "Asignando…" : "Confirmar asignación"}
            </button>
            <button type="button" onClick={() => setCalculado(null)} className="rounded-xl border border-borde px-5 py-2.5 font-semibold">
              Cambiar algo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void enviar(false)}
          disabled={ocupado || cantidad < 1 || motivo.trim().length < 3}
          className="self-start rounded-xl bg-texto px-5 py-2.5 font-semibold text-fondo disabled:opacity-40"
        >
          {ocupado ? "Calculando…" : "Ver el total antes de asignar"}
        </button>
      )}

      {aviso && <p className="text-sm font-semibold text-exito">{aviso}</p>}
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <p className="text-xs text-texto-suave">
        El saldo queda en cada alumno, sin renovación automática: se vuelve a asignar cuando el colegio paga. Cada asignación aparece en el
        historial de cada alumno con el motivo y quién la hizo. Los alumnos inactivos no reciben.
      </p>
    </section>
  );
}
