"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

type Modo = "correo" | "colegio";

export default function PaginaEntrar() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("correo");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const resultado =
      modo === "correo"
        ? await signIn("correo", { email, password, redirect: false })
        : await signIn("colegio", { codigo, username, pin, redirect: false });

    if (resultado?.error) {
      setError(
        modo === "correo"
          ? "Correo o contraseña incorrectos."
          : "Revisa el código del colegio, tu usuario y tu PIN."
      );
      setEnviando(false);
      return;
    }

    router.push("/practicar");
    router.refresh();
  }

  const campo =
    "rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative size-20 overflow-hidden rounded-full border-4 border-borde bg-primario-suave">
          <Image src="/allison.png" alt="Allison" fill sizes="80px" className="object-cover" />
        </div>
        <h1 className="text-2xl font-semibold">Hola de nuevo</h1>
      </div>

      {/* Dos formas de entrar: correo o código de colegio */}
      <div className="flex rounded-xl bg-superficie-2 p-1">
        {(["correo", "colegio"] as Modo[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setModo(m);
              setError(null);
            }}
            aria-pressed={modo === m}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              modo === m ? "bg-superficie shadow-sm" : "text-texto-suave"
            }`}
          >
            {m === "correo" ? "Con mi correo" : "Con código de colegio"}
          </button>
        ))}
      </div>

      {modo === "correo" && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/practicar" })}
          className="flex items-center justify-center gap-3 rounded-xl border border-borde bg-superficie px-4 py-3 font-medium transition hover:bg-superficie-2"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h6a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-7.9Z" />
            <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.2 1-3.6 1-2.8 0-5.2-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M6 14.3a6.6 6.6 0 0 1 0-4.2V7.3H2.3a11 11 0 0 0 0 9.8L6 14.3Z" />
            <path fill="#EA4335" d="M12 4.8c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.3 7.3L6 10.1c.8-2.5 3.2-4.4 6-4.4Z" />
          </svg>
          Entrar con Google
        </button>
      )}

      <form onSubmit={entrar} className="flex flex-col gap-4">
        {modo === "correo" ? (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Correo</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     required autoComplete="email" className={campo} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Contraseña</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                     required autoComplete="current-password" className={campo} />
            </label>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Código del colegio</span>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                     required placeholder="COLEGIO2026"
                     className={`${campo} font-mono tracking-wider`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Tu usuario</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                     required autoComplete="username" className={campo} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Tu PIN</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                required
                inputMode="numeric"
                autoComplete="off"
                placeholder="0000"
                className={`${campo} text-center font-mono text-2xl tracking-[0.5em]`}
              />
              <span className="text-xs text-texto-suave">
                Si lo olvidaste, pídele al coordinador de tu colegio que te lo reinicie.
              </span>
            </label>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-xl bg-primario px-4 py-3.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>

      {modo === "correo" && (
        <p className="text-center text-sm text-texto-suave">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-primario underline">
            Crear una
          </Link>
        </p>
      )}
    </main>
  );
}
