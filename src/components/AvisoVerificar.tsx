"use client";

import { useState } from "react";

/**
 * Aviso para confirmar el correo.
 *
 * Va con el número de mensajes que gana al hacerlo: "confirma tu correo"
 * a secas es una tarea; "confirma y recibe 15 mensajes" es un premio, y
 * lo hace mucha más gente.
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
    <div className="mb-3 rounded-xl border border-primario/30 bg-primario/5 p-3 text-center text-sm">
      <p>
        Confirma tu correo y te damos{" "}
        <strong className="text-primario">{mensajes} mensajes más</strong>.
      </p>

      {estado === "enviado" ? (
        <p className="mt-1 text-texto-suave">
          Te mandamos el enlace. Revisa tu correo, y el correo no deseado.
        </p>
      ) : (
        <button
          type="button"
          onClick={reenviar}
          disabled={estado === "enviando"}
          className="mt-1 font-semibold text-primario underline disabled:opacity-50"
        >
          {estado === "enviando" ? "Enviando…" : "Reenviar el enlace"}
        </button>
      )}

      {estado === "error" && (
        <p className="mt-1 text-error">No pudimos enviarlo. Intenta más tarde.</p>
      )}
    </div>
  );
}
