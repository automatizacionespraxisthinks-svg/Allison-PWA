"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { pedir } from "@/lib/pedir";
import { calcularRecarga, pesos, type ConfigPrecios } from "@/lib/precios";

interface Alumno {
  id: string;
  nombre: string;
  identificador: string;
  colegio: string | null;
  curso: string | null;
  saldo: number;
}

const RAPIDOS = [10_000, 20_000, 50_000];

/**
 * La recarga manual (plan, sección 21; boceto 7): para el alumno que
 * pagó en efectivo o por transferencia. Los mismos precios de la recarga
 * en línea, o el plan mensual. Se confirma antes de sumar y queda en el
 * historial del alumno y en el cuadre del día, con quién la hizo.
 */
export function RecargaManual({ cfg, plan }: { cfg: ConfigPrecios; plan: { precio: number; mensajes: number } | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Alumno[]>([]);
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [tipo, setTipo] = useState<"recarga" | "plan">("recarga");
  const [monto, setMonto] = useState("20000");
  const [medio, setMedio] = useState<"efectivo" | "transferencia">("efectivo");
  const [recibido, setRecibido] = useState("");
  const [recibo, setRecibo] = useState("");
  /** Lo que se revisó para confirmar: si algo cambia, hay que revisar otra vez. */
  const [revisado, setRevisado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // El buscador espera a que se deje de escribir.
  useEffect(() => {
    if (q.trim().length < 2 || alumno) return;
    const t = setTimeout(async () => {
      const r = await pedir(`/api/admin/alumno?q=${encodeURIComponent(q.trim())}`);
      const d = r?.ok ? await r.json().catch(() => ({ alumnos: [] })) : { alumnos: [] };
      setResultados(d.alumnos ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [q, alumno]);


  const valor = tipo === "plan" ? (plan?.precio ?? 0) : Math.floor(Number(monto) || 0);
  const calculo = tipo === "recarga" ? calcularRecarga(valor, cfg) : null;
  const intervenciones = tipo === "plan" ? (plan?.mensajes ?? 0) : (calculo?.total ?? 0);
  const valido = !!alumno && (tipo === "plan" ? !!plan : valor >= cfg.minima && valor <= cfg.maxima);
  const valorRecibido = Number(recibido) || valor;
  const datos = JSON.stringify([alumno?.id, tipo, valor, medio, valorRecibido, recibo]);
  const confirmando = revisado === datos;

  async function recargar() {
    if (!alumno) return;
    setOcupado(true);
    setError(null);
    const r = await pedir("/api/admin/efectivo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: alumno.id, tipo, montoCop: valor, medio, recibo, valorRecibido }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(false);
    if (!r?.ok) return setError(d.error ?? "No se pudo registrar la recarga.");
    setAviso(`${alumno.nombre} recibió ${d.mensajes} intervenciones y quedó con ${d.saldo}.`);
    setAlumno(null);
    setQ("");
    setRecibo("");
    setRecibido("");
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-5">
      <h2 className="font-bold">Recarga manual</h2>

      <label className="relative flex flex-col gap-1 text-sm">
        <span className="font-medium">Alumno</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAlumno(null);
          }}
          placeholder="Nombre, correo o usuario…"
          className="h-10 rounded-xl border border-borde bg-superficie px-3"
          aria-label="Buscar alumno"
        />
        {resultados.length > 0 && !alumno && q.trim().length >= 2 && (
          <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-borde bg-superficie shadow-lg">
            {resultados.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setAlumno(a);
                    setQ(a.nombre);
                    setResultados([]);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-superficie-2"
                >
                  <b>{a.nombre}</b>
                  <span className="block text-xs text-texto-suave">
                    {[a.identificador, a.colegio ?? "Particular", a.curso].filter(Boolean).join(" · ")} · saldo {a.saldo}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium">Monto</span>
        <div className="flex flex-wrap gap-2">
          {RAPIDOS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setTipo("recarga");
                setMonto(String(v));
              }}
              className={`rounded-full border px-3 py-1.5 font-medium ${
                tipo === "recarga" && valor === v ? "border-primario bg-primario text-white" : "border-borde"
              }`}
            >
              {pesos(v)} · {calcularRecarga(v, cfg).total}
            </button>
          ))}
          {plan && (
            <button
              type="button"
              onClick={() => setTipo("plan")}
              className={`rounded-full border px-3 py-1.5 font-medium ${tipo === "plan" ? "border-primario bg-primario text-white" : "border-borde"}`}
            >
              Plan mensual {pesos(plan.precio)} · {plan.mensajes} al mes
            </button>
          )}
        </div>
        {tipo === "recarga" && (
          <input
            type="number"
            min={cfg.minima}
            max={cfg.maxima}
            step={1000}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="h-10 w-48 rounded-xl border border-borde bg-superficie px-3"
            aria-label="Monto en pesos"
          />
        )}
        <span className="text-xs text-texto-suave">
          {tipo === "plan"
            ? `${plan?.mensajes} intervenciones al mes, como el plan en línea.`
            : calculo
              ? `${calculo.total} intervenciones (${calculo.base}${calculo.bono ? ` + ${calculo.bono} de bono` : ""}). Mínimo ${pesos(cfg.minima)}.`
              : ""}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Medio de pago</span>
          <select
            value={medio}
            onChange={(e) => setMedio(e.target.value as "efectivo" | "transferencia")}
            className="h-10 rounded-xl border border-borde bg-superficie px-3"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Valor recibido</span>
          <input
            type="number"
            min={0}
            value={recibido}
            onChange={(e) => setRecibido(e.target.value)}
            placeholder={String(valor)}
            className="h-10 rounded-xl border border-borde bg-superficie px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nota o número de recibo</span>
          <input
            value={recibo}
            onChange={(e) => setRecibo(e.target.value)}
            maxLength={80}
            placeholder="Recibo 0045 · pagó en el colegio"
            className="h-10 rounded-xl border border-borde bg-superficie px-3"
          />
        </label>
      </div>

      {confirmando && alumno ? (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-primario/30 bg-primario-suave/40 p-4">
          <p className="text-[15px]">
            <b>{alumno.nombre}</b> pasa de {alumno.saldo} a <b>{alumno.saldo + intervenciones}</b> intervenciones. Queda en su historial como «
            {medio === "efectivo" ? "Recarga en efectivo" : "Recarga por transferencia"} · {pesos(valor)}
            {recibo ? ` · ${recibo}` : ""}».
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void recargar()}
              disabled={ocupado}
              className="rounded-xl bg-primario px-5 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {ocupado ? "Registrando…" : "Confirmar recarga"}
            </button>
            <button type="button" onClick={() => setRevisado(null)} className="rounded-xl border border-borde px-5 py-2.5 font-semibold">
              Cambiar algo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevisado(datos)}
          disabled={!valido}
          className="self-start rounded-xl bg-texto px-5 py-2.5 font-semibold text-fondo disabled:opacity-40"
        >
          Revisar antes de recargar
        </button>
      )}
      {aviso && <p className="text-sm font-semibold text-exito">{aviso}</p>}
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
