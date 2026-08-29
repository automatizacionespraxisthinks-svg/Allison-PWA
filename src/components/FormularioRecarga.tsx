"use client";

import { useMemo, useState } from "react";
import { calcularRecarga, pesos, tiempoEquivalente, type ConfigPrecios } from "@/lib/precios";

const ATAJOS = [4_000, 10_000, 20_000, 50_000];

export function FormularioRecarga({ cfg }: { cfg: ConfigPrecios }) {
  const [monto, setMonto] = useState(10_000);
  const [texto, setTexto] = useState("10.000");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculo = useMemo(() => calcularRecarga(monto, cfg), [monto, cfg]);
  const insuficiente = monto < cfg.minima;

  function escribir(valor: string) {
    const limpio = valor.replace(/\D/g, "").slice(0, 7);
    const n = Number(limpio || 0);
    setMonto(n);
    setTexto(n ? n.toLocaleString("es-CO") : "");
    setError(null);
  }

  async function pagar() {
    setError(null);
    setEnviando(true);
    const r = await fetch("/api/pagos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "recarga", monto }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "No pudimos abrir el pago.");
      setEnviando(false);
      return;
    }
    window.location.href = d.urlPago;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {ATAJOS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => escribir(String(a))}
            aria-pressed={monto === a}
            className={`flex-1 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
              monto === a
                ? "border-primario bg-primario-suave text-primario"
                : "border-borde bg-superficie hover:bg-superficie-2"
            }`}
          >
            {pesos(a)}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">O escribe el monto que quieras</span>
        <div className="flex items-center rounded-2xl border border-borde bg-superficie px-4 focus-within:border-primario">
          <span className="text-2xl font-semibold text-texto-suave">$</span>
          <input
            value={texto}
            onChange={(e) => escribir(e.target.value)}
            inputMode="numeric"
            aria-label="Monto a recargar en pesos"
            className="w-full bg-transparent px-2 py-4 text-2xl font-semibold tabular-nums outline-none"
          />
        </div>
        <span className="text-xs text-texto-suave">
          Desde {pesos(cfg.minima)}. Lo que compras no caduca nunca.
        </span>
      </label>

      {/* Lo que recibe, en grande: es la decisión que está tomando */}
      <div className="rounded-2xl bg-primario p-5 text-white">
        <p className="text-sm text-white/80">Recibes</p>
        <p className="text-4xl font-bold tabular-nums">
          {calculo.total.toLocaleString("es-CO")}
          <span className="ml-2 text-lg font-medium text-white/80">
            intervenciones
          </span>
        </p>
        <p className="mt-1 text-sm text-white/80">{tiempoEquivalente(calculo.total)}</p>

        {calculo.bono > 0 && (
          <p className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
            {calculo.base.toLocaleString("es-CO")} + {calculo.bono.toLocaleString("es-CO")} de
            regalo ({Math.round(calculo.porcentajeBono * 100)}%)
          </p>
        )}
      </div>

      {calculo.siguienteEscalon && !insuficiente && (
        <p className="rounded-xl bg-acento/10 p-3 text-center text-sm text-acento">
          Agrega {pesos(calculo.siguienteEscalon.faltan)} más y te regalamos{" "}
          {Math.round(calculo.siguienteEscalon.bono * 100)}% más.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={pagar}
        disabled={insuficiente || enviando}
        className="rounded-2xl bg-primario px-6 py-4 text-lg font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
      >
        {insuficiente
          ? `Mínimo ${pesos(cfg.minima)}`
          : enviando
            ? "Abriendo el pago…"
            : `Pagar ${pesos(monto)}`}
      </button>
    </div>
  );
}
