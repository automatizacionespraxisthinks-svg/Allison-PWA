"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { NIVELES, type Nivel } from "@/lib/tipos";

export default function PaginaRegistro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [acceso, setAcceso] = useState("");
  const [password, setPassword] = useState("");
  const [nivel, setNivel] = useState<Nivel>("A1");
  const [aceptaLegal, setAceptaLegal] = useState(false);
  const [declaraEdad, setDeclaraEdad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function crearCuenta(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const respuesta = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre, email, acceso, password, nivel, aceptaLegal, declaraEdad,
      }),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      setError(datos.error ?? "No pudimos crear la cuenta.");
      setEnviando(false);
      return;
    }

    // Entrar directo: pedirle que inicie sesión después de registrarse
    // es un paso extra donde se pierde gente sin ninguna razón.
    const entrada = await signIn("acceso", {
      identificador: acceso || email,
      password,
      redirect: false,
    });
    if (entrada?.error) {
      router.push("/entrar");
      return;
    }
    router.push("/practicar");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative size-20 overflow-hidden rounded-full border-4 border-borde bg-primario-suave">
          <Image src="/allison.png" alt="Allison" fill sizes="80px" className="object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-texto-suave">
            Te regalamos 20 mensajes para que pruebes. Sin tarjeta.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!aceptaLegal || !declaraEdad) {
            setError(
              "Marca las dos casillas de abajo antes de continuar con Google."
            );
            return;
          }
          void signIn("google", { callbackUrl: "/practicar" });
        }}
        className="flex items-center justify-center gap-3 rounded-xl border border-borde bg-superficie px-4 py-3 font-medium transition hover:bg-superficie-2"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h6a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-7.9Z" />
          <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.2 1-3.6 1-2.8 0-5.2-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M6 14.3a6.6 6.6 0 0 1 0-4.2V7.3H2.3a11 11 0 0 0 0 9.8L6 14.3Z" />
          <path fill="#EA4335" d="M12 4.8c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.3 7.3L6 10.1c.8-2.5 3.2-4.4 6-4.4Z" />
        </svg>
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 text-sm text-texto-suave">
        <span className="h-px flex-1 bg-borde" />o crea tu cuenta<span className="h-px flex-1 bg-borde" />
      </div>

      <form onSubmit={crearCuenta} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tu nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoComplete="name"
            className="rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            className="rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario"
          />
          <span className="text-xs text-texto-suave">
            Lo pedimos para devolverte el acceso si olvidas la contraseña.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Celular o usuario{" "}
            <span className="font-normal text-texto-suave">(opcional)</span>
          </span>
          <input
            value={acceso}
            onChange={(e) => setAcceso(e.target.value)}
            autoComplete="off"
            placeholder="3001234567  ·  tu.usuario"
            className="rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario"
          />
          <span className="text-xs text-texto-suave">
            Para entrar sin escribir el correo cada vez.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario"
          />
          <span className="text-xs text-texto-suave">Mínimo 8 caracteres</span>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">¿Cómo está tu inglés?</legend>
          <div className="grid grid-cols-3 gap-2">
            {NIVELES.map((n) => (
              <button
                key={n.nivel}
                type="button"
                onClick={() => setNivel(n.nivel)}
                aria-pressed={nivel === n.nivel}
                className={`rounded-xl border px-2 py-2.5 text-center transition ${
                  nivel === n.nivel
                    ? "border-primario bg-primario-suave"
                    : "border-borde bg-superficie hover:bg-superficie-2"
                }`}
              >
                <span className="block text-sm font-semibold">{n.nivel}</span>
                <span className="block text-[11px] leading-tight text-texto-suave">
                  {n.etiqueta}
                </span>
              </button>
            ))}
          </div>
          <span className="text-xs text-texto-suave">
            Lo puedes cambiar cuando quieras. Si dudas, empieza en A1.
          </span>
        </fieldset>

        {/*
          Las casillas van SIN marcar. Un consentimiento marcado de
          antemano no es válido: la ley exige que sea expreso.
        */}
        <div className="flex flex-col gap-3 rounded-xl border border-borde bg-superficie p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={aceptaLegal}
              onChange={(e) => setAceptaLegal(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primario)]"
            />
            <span className="leading-snug">
              Acepto los{" "}
              <Link href="/legal/terminos" target="_blank" className="text-primario underline">
                términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/legal/privacidad" target="_blank" className="text-primario underline">
                política de datos
              </Link>
              . Autorizo que se grabe mi voz para corregirme y que mis datos se
              procesen en Estados Unidos.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={declaraEdad}
              onChange={(e) => setDeclaraEdad(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primario)]"
            />
            <span className="leading-snug">
              Soy mayor de edad, o mi padre, madre o acudiente autoriza mi registro.
            </span>
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando || !aceptaLegal || !declaraEdad}
          className="rounded-xl bg-primario px-4 py-3.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {enviando ? "Creando…" : "Crear cuenta y empezar"}
        </button>
      </form>

      <p className="text-center text-sm text-texto-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="font-medium text-primario underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
