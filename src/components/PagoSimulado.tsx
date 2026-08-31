"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { pedir } from "@/lib/pedir";

/**
 * Botones de la pasarela simulada.
 *
 * Existen para probar los dos desenlaces reales — aprobado y rechazado —
 * sin depender del trámite con la pasarela. Desaparecen solos cuando
 * PASARELA deja de ser "simulada".
 */
export function PagoSimulado({ transaccionId }: { transaccionId: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<"si" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simular(aprobar: boolean) {
    setError(null);
    setOcupado(aprobar ? "si" : "no");

    const r = await pedir("/api/pagos/simular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaccionId, aprobar }),
    });

    if (!r?.ok) {
      setError("La simulación falló.");
      setOcupado(null);
      return;
    }

    if (aprobar) {
      router.refresh();
    } else {
      setError("El pago fue rechazado. No te cobramos nada.");
      setOcupado(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-xl border border-acento/40 bg-acento/10 p-3 text-center text-sm text-acento">
        <strong>Modo de prueba.</strong> No se cobra dinero real.
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 p-3 text-center text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => simular(true)}
        disabled={ocupado !== null}
        className="rounded-2xl bg-exito px-6 py-4 text-lg font-semibold text-white disabled:opacity-50"
      >
        {ocupado === "si" ? "Procesando…" : "Simular pago aprobado"}
      </button>

      <button
        type="button"
        onClick={() => simular(false)}
        disabled={ocupado !== null}
        className="rounded-2xl border border-borde px-6 py-3 font-medium text-texto-suave disabled:opacity-50"
      >
        Simular pago rechazado
      </button>
    </div>
  );
}
