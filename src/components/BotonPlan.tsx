"use client";

import { useState } from "react";

export function BotonPlan({ codigo, nombre }: { codigo: string; nombre: string }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function comprar() {
    setError(null);
    setEnviando(true);
    const r = await fetch("/api/pagos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "plan", plan: codigo }),
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
    <>
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
      <button
        type="button"
        onClick={comprar}
        disabled={enviando}
        className="degradado-primario sombra-accion mt-4 w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {enviando ? "Abriendo…" : `Elegir ${nombre}`}
      </button>
    </>
  );
}
