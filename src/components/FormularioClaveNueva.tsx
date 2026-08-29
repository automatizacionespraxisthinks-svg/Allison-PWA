"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FormularioClaveNueva({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== repetir) {
      setError("Las dos contraseñas no son iguales.");
      return;
    }

    setOcupado(true);
    const r = await fetch("/api/recuperar/cambiar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setOcupado(false);

    if (!r.ok) {
      setError((await r.json()).error ?? "No pudimos cambiar la contraseña.");
      return;
    }
    setListo(true);
    setTimeout(() => router.push("/entrar"), 1800);
  }

  if (listo) {
    return (
      <div className="rounded-2xl border-2 border-exito/40 bg-exito/5 p-6 text-center">
        <p className="text-4xl" aria-hidden>
          ✅
        </p>
        <h2 className="mt-2 text-lg font-bold">Contraseña cambiada</h2>
        <p className="mt-1 text-sm text-texto-suave">
          Te llevamos a la pantalla de entrada…
        </p>
      </div>
    );
  }

  const campo =
    "rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario";

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Contraseña nueva</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className={campo}
        />
        <span className="text-xs text-texto-suave">Mínimo 8 caracteres</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Repítela</span>
        <input
          type="password"
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className={campo}
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
        {ocupado ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
