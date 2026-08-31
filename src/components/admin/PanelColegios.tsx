"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ColegioAdmin } from "@/lib/admin";
import { pesos } from "@/lib/precios";
import { pedir } from "@/lib/pedir";

const campo =
  "w-full rounded-xl border border-borde bg-superficie px-3 py-2.5 text-sm outline-none focus:border-primario";

/**
 * Muestra una fecha "2026-11-30" sin pasar por Date.
 *
 * new Date("2026-11-30") se interpreta como medianoche UTC, y en
 * Colombia (UTC-5) el navegador la pinta como el día anterior. Para una
 * fecha sin hora, lo correcto es no convertirla a instante.
 */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** ¿Ya pasó esa fecha? Se compara texto con texto, por el mismo motivo. */
function yaVencio(iso: string): boolean {
  const hoy = new Date();
  const local = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  return iso < local;
}

export function PanelColegios({ colegios }: { colegios: ColegioAdmin[] }) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOcupado(true);
    const f = new FormData(e.currentTarget);
    const r = await pedir("/api/admin/colegios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(f)),
    });
    setOcupado(false);
    if (!r?.ok) {
      const d = r ? await r.json().catch(() => ({})) : {};
      setError(d.error ?? "No pudimos crear el colegio.");
      return;
    }
    setCreando(false);
    router.refresh();
  }

  async function actualizar(id: string, cambios: Record<string, unknown>) {
    setError(null);
    setOcupado(true);
    const r = await pedir("/api/admin/colegios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...cambios }),
    });
    setOcupado(false);
    if (!r?.ok) {
      const d = r ? await r.json().catch(() => ({})) : {};
      setError(d.error ?? "No pudimos guardar el cambio.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Colegios</h1>
        <button
          type="button"
          onClick={() => setCreando(!creando)}
          className="rounded-full bg-primario px-4 py-2 text-sm font-semibold text-white"
        >
          {creando ? "Cancelar" : "Nuevo colegio"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">
          {error}
        </p>
      )}

      {creando && (
        <form
          onSubmit={crear}
          className="grid gap-3 rounded-2xl border border-borde bg-superficie p-5 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Nombre del colegio</span>
            <input name="nombre" required className={campo} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">NIT</span>
            <input name="nit" className={campo} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Código de acceso</span>
            <input
              name="codigoAcceso"
              required
              placeholder="COLEGIO2026"
              className={`${campo} font-mono uppercase`}
            />
            <span className="text-xs text-texto-suave">
              Es lo que teclean los alumnos para entrar
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Correo de contacto</span>
            <input name="contactoEmail" type="email" className={campo} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Teléfono</span>
            <input name="contactoTelefono" className={campo} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Cupo de alumnos</span>
            <input name="cupoAlumnos" type="number" required defaultValue={100} className={campo} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Tarifa por alumno (COP)</span>
            <input name="tarifaPorAlumno" type="number" required defaultValue={0} className={campo} />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Notas del convenio</span>
            <textarea name="notas" rows={2} className={campo} />
          </label>

          <button
            type="submit"
            disabled={ocupado}
            className="rounded-xl bg-primario px-4 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2"
          >
            {ocupado ? "Creando…" : "Crear colegio"}
          </button>
        </form>
      )}

      {colegios.length === 0 && !creando && (
        <p className="rounded-2xl border border-borde bg-superficie p-8 text-center text-texto-suave">
          Todavía no hay colegios.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {colegios.map((c) => {
          const cupoLleno = c.cupoAlumnos !== null && c.alumnos >= c.cupoAlumnos;
          const vencido = c.pagadoHasta !== null && yaVencio(c.pagadoHasta);

          return (
            <li key={c.id} className="rounded-2xl border border-borde bg-superficie p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold">{c.nombre}</h2>
                  <p className="mt-0.5 text-sm text-texto-suave">
                    <span className="font-mono tracking-wider">{c.codigoAcceso}</span>
                    {c.nit && <> · NIT {c.nit}</>}
                  </p>
                  <p className="mt-1.5 text-sm">
                    <strong>{c.alumnos}</strong>
                    {c.cupoAlumnos !== null && <> de {c.cupoAlumnos}</>} alumnos ·{" "}
                    {c.activosSemana} activos esta semana
                  </p>
                  {c.tarifaPorAlumno ? (
                    <p className="mt-0.5 text-sm text-texto-suave">
                      {pesos(c.tarifaPorAlumno)} por alumno ·{" "}
                      {pesos(c.tarifaPorAlumno * c.alumnos)} en total
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      c.estado === "activa"
                        ? "bg-exito/15 text-exito"
                        : "bg-error/15 text-error"
                    }`}
                  >
                    {c.estado === "activa" ? "Activo" : "Suspendido"}
                  </span>
                  {cupoLleno && (
                    <span className="rounded-full bg-acento/15 px-2.5 py-1 text-xs font-semibold text-acento">
                      Cupo lleno
                    </span>
                  )}
                  {vencido && (
                    <span className="rounded-full bg-error/15 px-2.5 py-1 text-xs font-semibold text-error">
                      Pago vencido
                    </span>
                  )}
                </div>
              </div>

              {c.pagadoHasta && (
                <p className="mt-3 text-sm text-texto-suave">
                  Pagado hasta {fechaCorta(c.pagadoHasta)}
                  {c.ultimoPagoCop ? ` · último pago ${pesos(c.ultimoPagoCop)}` : ""}
                </p>
              )}
              {c.notas && (
                <p className="mt-2 rounded-lg bg-superficie-2 p-3 text-sm">{c.notas}</p>
              )}

              <button
                type="button"
                onClick={() => setAbierto(abierto === c.id ? null : c.id)}
                className="mt-3 text-sm font-medium text-primario underline"
              >
                {abierto === c.id ? "Cerrar" : "Registrar pago o cambiar cupo"}
              </button>

              {abierto === c.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const cambios: Record<string, unknown> = {};
                    for (const k of ["pagoCop", "pagadoHasta", "cupoAlumnos", "tarifaPorAlumno"]) {
                      const v = f.get(k);
                      if (v) cambios[k] = v;
                    }
                    if (Object.keys(cambios).length > 0) void actualizar(c.id, cambios);
                  }}
                  className="mt-3 grid gap-3 rounded-xl bg-superficie-2 p-4 sm:grid-cols-2"
                >
                  <p className="text-sm text-texto-suave sm:col-span-2">
                    El convenio se paga en efectivo por fuera de la plataforma.
                    Aquí solo se deja constancia de que la plata entró.
                  </p>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Pago recibido (COP)</span>
                    <input name="pagoCop" type="number" className={campo} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Cubre hasta</span>
                    <input name="pagadoHasta" type="date" className={campo} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Cupo de alumnos</span>
                    <input
                      name="cupoAlumnos"
                      type="number"
                      defaultValue={c.cupoAlumnos ?? undefined}
                      className={campo}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Tarifa por alumno</span>
                    <input
                      name="tarifaPorAlumno"
                      type="number"
                      defaultValue={c.tarifaPorAlumno ?? undefined}
                      className={campo}
                    />
                  </label>

                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      disabled={ocupado}
                      className="flex-1 rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() =>
                        actualizar(c.id, {
                          estado: c.estado === "activa" ? "suspendida" : "activa",
                        })
                      }
                      className="rounded-xl border border-borde px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                      {c.estado === "activa" ? "Suspender" : "Reactivar"}
                    </button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
