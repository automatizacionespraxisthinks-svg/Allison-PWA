"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UsuarioAdmin } from "@/lib/admin";
import { pesos } from "@/lib/precios";

const campo =
  "rounded-xl border border-borde bg-superficie px-3 py-2.5 text-sm outline-none focus:border-primario";

/** Fuera del componente: leer el reloj durante el render hace que el
 *  resultado cambie entre repintados sin que nada haya pasado. */
function cuando(iso: string | null): string {
  if (!iso) return "nunca";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

export function BuscadorUsuarios({
  consulta,
  usuarios,
}: {
  consulta: string;
  usuarios: UsuarioAdmin[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(consulta);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ajustar(e: React.FormEvent<HTMLFormElement>, u: UsuarioAdmin) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    setOcupado(true);

    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/saldo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: u.id,
        cantidad: f.get("cantidad"),
        bolsa: f.get("bolsa"),
        nota: f.get("nota"),
      }),
    });
    const d = await r.json();
    setOcupado(false);

    if (!r.ok) {
      setError(d.error ?? "No pudimos ajustar el saldo.");
      return;
    }
    setAviso(`${u.nombre} queda con ${d.saldo} mensajes.`);
    setAbierto(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Usuarios</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/admin/usuarios?q=${encodeURIComponent(q)}`);
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, correo, celular o usuario"
          className={`${campo} flex-1`}
        />
        <button
          type="submit"
          className="rounded-xl bg-primario px-5 py-2.5 text-sm font-semibold text-white"
        >
          Buscar
        </button>
      </form>

      {aviso && (
        <p className="rounded-lg bg-exito/10 p-3 text-sm text-exito">{aviso}</p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-error/10 p-3 text-sm text-error">
          {error}
        </p>
      )}

      {consulta && usuarios.length === 0 && (
        <p className="rounded-2xl border border-borde bg-superficie p-8 text-center text-texto-suave">
          Nadie coincide con «{consulta}».
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {usuarios.map((u) => (
          <li key={u.id} className="rounded-2xl border border-borde bg-superficie p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">
                  {u.nombre}
                  {u.rol !== "estudiante" && (
                    <span className="ml-2 rounded-full bg-texto px-2 py-0.5 text-[11px] font-bold uppercase text-fondo">
                      {u.rol}
                    </span>
                  )}
                  {!u.activo && (
                    <span className="ml-2 rounded-full bg-error/15 px-2 py-0.5 text-[11px] font-bold uppercase text-error">
                      Inactivo
                    </span>
                  )}
                </h2>
                <p className="mt-0.5 text-sm text-texto-suave">
                  {[u.email, u.telefono, u.username].filter(Boolean).join(" · ")}
                  {u.colegio && ` · ${u.colegio}`}
                </p>
                <p className="mt-1.5 text-sm">
                  Nivel {u.nivel} · <strong>{u.saldo}</strong> mensajes de saldo ·{" "}
                  {u.mensajes} hablados · practicó {cuando(u.ultimaPractica)}
                </p>
                {u.pagado > 0 && (
                  <p className="mt-0.5 text-sm text-exito">
                    Ha pagado {pesos(u.pagado)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAbierto(abierto === u.id ? null : u.id)}
                className="shrink-0 rounded-xl border border-borde px-3 py-2 text-sm font-medium transition hover:bg-superficie-2"
              >
                Ajustar saldo
              </button>
            </div>

            {abierto === u.id && (
              <form
                onSubmit={(e) => ajustar(e, u)}
                className="mt-4 grid gap-3 rounded-xl bg-superficie-2 p-4 sm:grid-cols-3"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Mensajes</span>
                  <input
                    name="cantidad"
                    type="number"
                    required
                    placeholder="50 o -20"
                    className={campo}
                  />
                  <span className="text-xs text-texto-suave">
                    En negativo para quitar
                  </span>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Bolsa</span>
                  <select name="bolsa" defaultValue="recarga" className={campo}>
                    <option value="recarga">Recarga (no caduca)</option>
                    <option value="plan">Plan (caduca al mes)</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Motivo</span>
                  <input
                    name="nota"
                    required
                    minLength={3}
                    placeholder="Compensación por fallo"
                    className={campo}
                  />
                </label>

                <p className="text-xs text-texto-suave sm:col-span-3">
                  El motivo queda guardado en el libro de movimientos junto con tu
                  nombre. Un ajuste sin explicación es indefendible el día que
                  alguien pregunte de dónde salieron esos mensajes.
                </p>

                <button
                  type="submit"
                  disabled={ocupado}
                  className="rounded-xl bg-primario px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-3"
                >
                  {ocupado ? "Ajustando…" : "Aplicar ajuste"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
