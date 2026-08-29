"use client";

import Link from "next/link";
import { useState } from "react";

export default function PaginaRecuperar() {
  const [identificador, setIdentificador] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOcupado(true);

    const r = await fetch("/api/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identificador }),
    });

    setOcupado(false);
    if (!r.ok) {
      setError((await r.json()).error ?? "No pudimos procesar la solicitud.");
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-6xl" aria-hidden>
          📬
        </span>
        <h1 className="text-2xl font-bold">Revisa tu correo</h1>
        <p className="text-texto-suave">
          Si esa cuenta existe, te mandamos un enlace para poner una contraseña
          nueva. Vence en una hora. Mira también el correo no deseado.
        </p>
        <Link href="/entrar" className="font-medium text-primario underline">
          Volver a entrar
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-texto-suave">
          Escribe con qué entras y te mandamos un enlace a tu correo.
        </p>
      </div>

      <form onSubmit={pedir} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Correo, celular o usuario</span>
          <input
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            required
            autoComplete="username"
            className="rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={ocupado}
          className="rounded-xl bg-primario px-4 py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {ocupado ? "Enviando…" : "Enviarme el enlace"}
        </button>
      </form>

      <p className="rounded-xl border border-borde bg-superficie p-4 text-sm text-texto-suave">
        ¿Eres alumno de un colegio y olvidaste tu PIN? Pídeselo al coordinador
        de tu colegio: él te lo reinicia.
      </p>

      <Link href="/entrar" className="text-center text-sm text-texto-suave underline">
        Volver
      </Link>
    </main>
  );
}
