"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PagoPorRevisar } from "@/lib/panel/recargas";
import { pedir } from "@/lib/pedir";
import { pesos } from "@/lib/precios";

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Qué pasó y qué hacer, según la alerta. */
function explicacion(p: PagoPorRevisar): string {
  if (p.alerta === "anulada") {
    return p.estado === "aprobada"
      ? `La pasarela devolvió el dinero (reembolso o contracargo). Se le habían acreditado ${p.intervenciones} intervenciones y siguen ahí: si corresponde, descuéntalas con un ajuste negativo desde su ficha.`
      : "La pasarela devolvió el dinero (reembolso o contracargo). Esta orden no le acreditó nada: no hay que descontar.";
  }
  if (p.alerta === "monto_distinto") {
    return "La pasarela informó un monto distinto al de la orden y no se acreditó. Confirma en el panel de la pasarela cuánto entró y, si el alumno pagó, acredítale a mano con un ajuste.";
  }
  return `Alerta «${p.alerta}»: revisa la orden en el panel de la pasarela.`;
}

/**
 * Pagos por revisar (auditoría, 30 de octubre de 2026): los montos que no
 * cuadran y los pagos que la pasarela anuló. Nada se descuenta ni se
 * acredita solo; el administrador lo decide y, al terminar, marca el pago
 * como revisado para sacarlo de la lista.
 */
export function PagosPorRevisar({ pagos }: { pagos: PagoPorRevisar[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revisado(id: string) {
    setOcupado(id);
    setError(null);
    const r = await pedir("/api/admin/pagos/revisar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaccionId: id }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(null);
    // Marcarlo dos veces no hace daño: ante cualquier fallo se refresca.
    if (!r?.ok) setError(d.error ?? "No se pudo marcar. Revisa la lista e intenta otra vez.");
    router.refresh();
  }

  if (!pagos.length) return null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border-2 border-acento/40 bg-acento/5 p-5">
      <div>
        <h2 className="font-bold">Pagos por revisar ({pagos.length})</h2>
        <p className="text-xs text-texto-suave">
          Montos que no cuadran y pagos anulados por la pasarela. El saldo no se tocó: lo que haya que descontar o acreditar se hace a mano,
          con un ajuste con motivo desde la ficha del alumno.
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-borde">
        {pagos.map((p) => (
          <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p>
                <Link href={`/admin/usuarios/${p.alumnoId}`} className="font-semibold hover:underline">
                  {p.alumno}
                </Link>{" "}
                · {p.tipo === "plan" ? "Plan" : "Recarga"} de {pesos(p.montoCop)} · {p.alerta === "anulada" ? "Anulado" : "Monto distinto"} ·{" "}
                {fecha(p.fecha)}
              </p>
              <p className="mt-0.5 text-texto-suave">{explicacion(p)}</p>
              <p className="mt-0.5 font-mono text-[11px] text-texto-suave">
                {p.pasarela} · {p.referencia} · orden {p.estado}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void revisado(p.id)}
              disabled={ocupado === p.id}
              className="rounded-xl border border-borde bg-superficie px-3 py-2 font-semibold disabled:opacity-50"
            >
              {ocupado === p.id ? "Guardando…" : "Ya lo revisé"}
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
