"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { pedir } from "@/lib/pedir";

const NIVELES = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * Lo que el administrador hace desde la ficha de un alumno: cambiar el
 * nivel (sube y baja a voluntad; la primera vez en un nivel empieza de
 * cero y si vuelve a uno anterior sigue donde iba), cambiar el curso y
 * ajustar el saldo con motivo (queda en el historial con quién lo hizo).
 */
export function AccionesAlumno({
  userId,
  nombre,
  nivel,
  curso,
  deColegio,
  planVence,
}: {
  userId: string;
  nombre: string;
  nivel: string;
  curso: string | null;
  deColegio: boolean;
  /** El fin del mes de su plan activo (DD/MM/AAAA), o null si no tiene plan. */
  planVence: string | null;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nuevoCurso, setNuevoCurso] = useState(curso ?? "");
  const [ajustando, setAjustando] = useState(false);
  /**
   * El id del ajuste abierto, creado al abrirlo. El servidor no aplica
   * dos veces el mismo: un reintento tras una respuesta perdida no suma
   * doble (auditoría, 30 de octubre de 2026). Si no se supo si quedó, se
   * conserva para la próxima vez que se abra.
   */
  const [operacion, setOperacion] = useState<string | null>(null);
  const [incierta, setIncierta] = useState(false);

  async function enviar(url: string, cuerpo: object, exito: (d: Record<string, unknown>) => string) {
    setOcupado(true);
    setError(null);
    setAviso(null);
    const r = await pedir(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(false);
    if (!r?.ok) {
      setError(d.error ?? "No se pudo guardar.");
      return false;
    }
    setAviso(exito(d));
    router.refresh();
    return true;
  }

  function abrirAjuste() {
    if (!ajustando && (!incierta || !operacion)) setOperacion(crypto.randomUUID());
    setAjustando((a) => !a);
  }

  async function ajustar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!operacion) return;
    const f = new FormData(e.currentTarget);
    setOcupado(true);
    setError(null);
    setAviso(null);
    const r = await pedir("/api/admin/saldo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cantidad: f.get("cantidad"), bolsa: f.get("bolsa"), nota: f.get("nota"), operacion }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(false);
    // Sin respuesta (o un 5xx del proxy) no se sabe si se aplicó: el
    // formulario se cierra en vez de quedar listo para repetir, y la
    // ficha se refresca para revisar el historial.
    if (!r || r.status >= 500) {
      setIncierta(true);
      setAjustando(false);
      setError("No sabemos si quedó: revisa el historial antes de repetir.");
      router.refresh();
      return;
    }
    if (!r.ok) return setError(d.error ?? "No se pudo guardar.");
    setAviso(
      d.repetida
        ? `Ese ajuste ya estaba hecho: ${nombre} tiene ${d.saldo} intervenciones. No se aplicó otra vez.`
        : `${nombre} queda con ${d.saldo} intervenciones.`
    );
    setIncierta(false);
    setOperacion(null);
    setAjustando(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-texto-suave">
          Nivel
          <select
            defaultValue={nivel}
            disabled={ocupado}
            onChange={(e) => void enviar("/api/admin/nivel", { userId, nivel: e.target.value }, () => `Nivel cambiado a ${e.target.value}.`)}
            className="h-10 rounded-xl border border-borde bg-superficie px-3 text-sm text-texto"
          >
            {NIVELES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {deColegio && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enviar("/api/admin/alumno", { userId, curso: nuevoCurso }, (d) => (d.curso ? `Curso cambiado a ${d.curso}.` : "Quedó sin curso."));
            }}
            className="flex items-end gap-2"
          >
            <label className="flex flex-col gap-1 text-xs text-texto-suave">
              Curso
              <input
                value={nuevoCurso}
                onChange={(e) => setNuevoCurso(e.target.value)}
                maxLength={12}
                placeholder="9A"
                className="h-10 w-24 rounded-xl border border-borde bg-superficie px-3 text-sm text-texto"
              />
            </label>
            <button
              type="submit"
              disabled={ocupado || nuevoCurso.trim() === (curso ?? "")}
              className="h-10 rounded-xl border border-borde px-3 text-sm font-semibold disabled:opacity-40"
            >
              Guardar
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={abrirAjuste}
          className="h-10 rounded-xl bg-primario px-4 text-sm font-semibold text-white"
          aria-expanded={ajustando}
        >
          Ajustar saldo
        </button>
      </div>

      {ajustando && (
        <form onSubmit={ajustar} className="grid gap-2 rounded-xl border border-borde bg-superficie-2/50 p-3 sm:grid-cols-[110px_190px_1fr_auto]">
          <input
            name="cantidad"
            type="number"
            required
            placeholder="+100 o -20"
            className="h-10 rounded-xl border border-borde bg-superficie px-3 text-sm"
            aria-label="Cantidad"
          />
          {/* La bolsa del plan vence al cerrar el mes del plan del alumno
              (que puede ser mañana); sin plan activo no vencería nunca, y el
              servidor solo deja quitar de ella (auditoría, 30 de octubre de 2026). */}
          <select name="bolsa" defaultValue="recarga" className="h-10 rounded-xl border border-borde bg-superficie px-2 text-sm" aria-label="Bolsa">
            <option value="recarga">Recarga (no vence)</option>
            <option value="plan">{planVence ? `Plan (vence el ${planVence})` : "Plan (sin plan activo: solo quitar)"}</option>
          </select>
          <input
            name="nota"
            required
            minLength={3}
            maxLength={300}
            placeholder="Motivo: compensación por falla…"
            className="h-10 rounded-xl border border-borde bg-superficie px-3 text-sm"
            aria-label="Motivo"
          />
          <button type="submit" disabled={ocupado} className="h-10 rounded-xl bg-texto px-4 text-sm font-semibold text-fondo disabled:opacity-40">
            Aplicar
          </button>
        </form>
      )}
      {aviso && <p className="text-sm text-exito">{aviso}</p>}
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
