"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { CampoContrasena } from "@/components/CampoContrasena";
import { EMPRESA } from "@/lib/legal";
import { pedir } from "@/lib/pedir";
import type { Perfil } from "@/lib/perfil";
import type { Nivel } from "@/lib/tipos";

const campo =
  "rounded-xl border border-borde bg-superficie px-4 py-3 outline-none focus:border-primario";

type Aviso = { tipo: "ok" | "error"; texto: string } | null;

/** El resultado de guardar, en su tarjeta: verde si salió, rojo si no. */
function AvisoDe({ aviso }: { aviso: Aviso }) {
  if (!aviso) return null;
  return (
    <p
      role={aviso.tipo === "error" ? "alert" : "status"}
      className={`rounded-lg p-3 text-sm ${
        aviso.tipo === "error" ? "bg-error/10 text-error" : "bg-exito/10 text-exito"
      }`}
    >
      {aviso.texto}
    </p>
  );
}

/**
 * El perfil del alumno: lo que dio al registrarse, a la vista y
 * editable.
 *
 * Tres tarjetas: los datos, la contraseña y la cuenta. Cada una se
 * guarda por su lado, con su propio aviso: cambiar el nombre no debería
 * exigir teclear la contraseña, ni al revés.
 *
 * Un alumno de colegio ve su usuario y su colegio pero no los edita: se
 * los administra el colegio, y su PIN lo reinicia el coordinador.
 */
export function FormularioPerfil({ perfil }: { perfil: Perfil }) {
  const router = useRouter();
  const deColegio = perfil.tipoAcceso === "institucional";
  const [refrescando, empezarTransicion] = useTransition();

  // ---- Datos ----
  const [nombre, setNombre] = useState(perfil.nombre);
  const [email, setEmail] = useState(perfil.email ?? "");
  const [telefono, setTelefono] = useState(perfil.telefono ?? "");
  const [username, setUsername] = useState(perfil.username ?? "");
  const nivel: Nivel = perfil.nivel;
  const [guardando, setGuardando] = useState(false);
  const [avisoDatos, setAvisoDatos] = useState<Aviso>(null);

  const hayCambios =
    nombre.trim() !== perfil.nombre ||
    nivel !== perfil.nivel ||
    (!deColegio &&
      (email.trim().toLowerCase() !== (perfil.email ?? "") ||
        telefono.trim() !== (perfil.telefono ?? "") ||
        username.trim() !== (perfil.username ?? "")));

  async function guardarDatos(e: React.FormEvent) {
    e.preventDefault();
    setAvisoDatos(null);
    setGuardando(true);

    const r = await pedir("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, telefono, username, nivel }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setGuardando(false);

    if (!r?.ok) {
      setAvisoDatos({ tipo: "error", texto: d.error ?? "No pudimos guardar los cambios." });
      return;
    }
    // Lo normalizado por el servidor (celular a 10 dígitos, correo en
    // minúsculas) vuelve a la pantalla tal como quedó guardado.
    if (d.datos) {
      setNombre(d.datos.nombre);
      setEmail(d.datos.email ?? "");
      setTelefono(d.datos.telefono ?? "");
      setUsername(d.datos.username ?? "");
    }
    setAvisoDatos({ tipo: "ok", texto: "Cambios guardados." });
    empezarTransicion(() => router.refresh());
  }

  // ---- Contraseña ----
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [avisoClave, setAvisoClave] = useState<Aviso>(null);

  async function cambiarContrasena(e: React.FormEvent) {
    e.preventDefault();
    setAvisoClave(null);
    if (nueva !== repetida) {
      setAvisoClave({ tipo: "error", texto: "Las dos contraseñas nuevas no coinciden." });
      return;
    }
    setCambiando(true);

    const r = await pedir("/api/perfil/contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual: perfil.conContrasena ? actual : undefined, nueva }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};

    if (!r?.ok) {
      setCambiando(false);
      setAvisoClave({ tipo: "error", texto: d.error ?? "No pudimos cambiar la contraseña." });
      return;
    }

    // Cambiarla cerró todas las sesiones, incluida esta. Se vuelve a
    // entrar aquí mismo con la nueva, sin que el alumno lo note; si
    // por lo que sea no se puede, se le pide entrar de nuevo.
    const entrada = await signIn("acceso", {
      identificador: perfil.email ?? "",
      password: nueva,
      redirect: false,
    });
    if (entrada?.error) {
      router.push("/entrar");
      return;
    }
    setCambiando(false);
    setActual("");
    setNueva("");
    setRepetida("");
    setAvisoClave({
      tipo: "ok",
      texto: perfil.conContrasena
        ? "Contraseña cambiada. Si tenías la sesión abierta en otro aparato, ahí se cerró."
        : "Contraseña creada. Ya puedes entrar también con tu correo y contraseña.",
    });
    empezarTransicion(() => router.refresh());
  }

  const fecha = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
      : "—";

  return (
    <div className="flex flex-col gap-5">
      {/* ---- Tus datos ---- */}
      <form
        onSubmit={guardarDatos}
        className="flex flex-col gap-4 rounded-3xl border border-borde bg-superficie p-5"
      >
        <h2 className="text-lg font-semibold">Tus datos</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tu nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={80}
            autoComplete="name"
            className={campo}
          />
        </label>

        {deColegio ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-superficie-2 px-3 py-2.5">
                <p className="text-xs text-texto-suave">Colegio</p>
                <p className="font-medium">{perfil.colegio ?? "—"}</p>
              </div>
              <div className="rounded-xl bg-superficie-2 px-3 py-2.5">
                <p className="text-xs text-texto-suave">Tu usuario</p>
                <p className="font-mono font-medium">{perfil.username ?? "—"}</p>
              </div>
            </div>
            <p className="text-xs text-texto-suave">
              Tu usuario y tu PIN los administra tu colegio. Si olvidaste el PIN, pídele
              al coordinador que te lo reinicie.
            </p>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Correo</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={campo}
              />
              <span className="text-xs text-texto-suave">
                Revísalo bien: es adonde te enviamos el enlace si olvidas la contraseña.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Celular <span className="font-normal text-texto-suave">(opcional)</span>
              </span>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="3001234567"
                className={campo}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Usuario <span className="font-normal text-texto-suave">(opcional)</span>
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="tu.usuario"
                className={campo}
              />
              <span className="text-xs text-texto-suave">
                Con el celular o el usuario entras sin escribir el correo cada vez.
              </span>
            </label>
          </>
        )}

        {/* El nivel se cambia con su regla (solo bajar; para subir, completar
            el nivel) en el selector de Ajustes, no aquí. */}
        <AvisoDe aviso={avisoDatos} />

        <button
          type="submit"
          disabled={guardando || refrescando || !hayCambios}
          className="rounded-xl bg-primario px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      {/* ---- Contraseña ---- */}
      {!deColegio && (
        <form
          onSubmit={cambiarContrasena}
          className="flex flex-col gap-4 rounded-3xl border border-borde bg-superficie p-5"
        >
          <div>
            <h2 className="text-lg font-semibold">
              {perfil.conContrasena ? "Cambiar la contraseña" : "Crear una contraseña"}
            </h2>
            {!perfil.conContrasena && (
              <p className="mt-1 text-sm text-texto-suave">
                Entras con Google. Con una contraseña podrás entrar también con tu correo.
              </p>
            )}
          </div>

          {perfil.conContrasena && (
            <CampoContrasena
              etiqueta="Contraseña actual"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              required
              autoComplete="current-password"
              className={campo}
            />
          )}
          <CampoContrasena
            etiqueta="Contraseña nueva"
            ayuda="Mínimo 8 caracteres"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={campo}
          />
          <CampoContrasena
            etiqueta="Repite la contraseña nueva"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={campo}
          />

          <AvisoDe aviso={avisoClave} />

          <button
            type="submit"
            disabled={cambiando || !nueva || !repetida || (perfil.conContrasena && !actual)}
            className="rounded-xl border border-primario px-4 py-3 font-semibold text-primario transition hover:bg-primario-suave disabled:opacity-50"
          >
            {cambiando
              ? "Cambiando…"
              : perfil.conContrasena
                ? "Cambiar contraseña"
                : "Crear contraseña"}
          </button>
        </form>
      )}

      {/* ---- Tu cuenta ---- */}
      <section className="flex flex-col gap-3 rounded-3xl border border-borde bg-superficie p-5 text-sm">
        <h2 className="text-lg font-semibold">Tu cuenta</h2>
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Cuenta creada</dt>
            <dd className="text-right font-medium">{fecha(perfil.creadoEn)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Cómo entras</dt>
            <dd className="text-right font-medium">
              {deColegio
                ? "Con el código de tu colegio"
                : perfil.conGoogle && perfil.conContrasena
                  ? "Con Google o con tu contraseña"
                  : perfil.conGoogle
                    ? "Con Google"
                    : "Con tu correo y contraseña"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-texto-suave">Términos aceptados</dt>
            <dd className="text-right font-medium">
              {fecha(perfil.aceptoTerminosEn)}
              {perfil.versionLegal && (
                <span className="block text-xs font-normal text-texto-suave">
                  versión {perfil.versionLegal}
                </span>
              )}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-texto-suave">
          <Link href="/legal/terminos" className="underline">Términos</Link> ·{" "}
          <Link href="/legal/privacidad" className="underline">Política de datos</Link>.
          Para borrar tu cuenta o pedir tus datos, escríbenos a{" "}
          <strong>{EMPRESA.correo}</strong>.
        </p>
      </section>
    </div>
  );
}
