"use client";

import { useState } from "react";

/**
 * Aviso para confirmar el correo — una sola línea, arriba del todo.
 *
 * Antes era un bloque entre las ayudas y el micrófono: interrumpía
 * justo el camino del dedo hacia el botón de hablar. Arriba informa
 * sin estorbar, y el premio va primero: "+15" es lo que convence.
 */
export function AvisoVerificar({ mensajes }: { mensajes: number }) {
  const [estado, setEstado] = useState<"listo" | "enviando" | "enviado" | "error">(
    "listo"
  );

  async function reenviar() {
    setEstado("enviando");
    const r = await fetch("/api/verificar/reenviar", { method: "POST" });
    setEstado(r.ok ? "enviado" : "error");
  }

  return (
    <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-primario/25 bg-primario/5 px-3 py-2 text-sm">
      <svg
        viewBox="0 0 24 24"
        className="size-4 shrink-0 text-primario"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>

      <p className="min-w-0 flex-1 leading-snug">
        <strong className="text-primario">+{mensajes}</strong> al confirmar tu
        correo
        {estado === "enviado" && (
          <span className="text-texto-suave"> — enviado, revisa tu bandeja</span>
        )}
        {estado === "error" && (
          <span className="text-error"> — no pudimos enviarlo</span>
        )}
      </p>

      {estado !== "enviado" && (
        <button
          type="button"
          onClick={reenviar}
          disabled={estado === "enviando"}
          className="shrink-0 font-semibold text-primario underline disabled:opacity-50"
        >
          {estado === "enviando" ? "Enviando…" : "Reenviar"}
        </button>
      )}
    </div>
  );
}
