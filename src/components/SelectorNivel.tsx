"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { NIVELES, type Nivel } from "@/lib/tipos";
import { pedir, SESION_CERRADA } from "@/lib/pedir";

/**
 * Cambiar de nivel con la regla aprobada (plan, sección 22): bajar,
 * cuando quiera; subir, hasta el nivel más alto en el que ya estuvo. Los
 * de arriba se ven bloqueados con el aviso de completar su nivel, salvo
 * el siguiente cuando ya completó todas las actividades.
 */
export function SelectorNivel({
  nivel,
  maximo,
  siguienteAbierto,
}: {
  nivel: Nivel;
  maximo: Nivel;
  siguienteAbierto: Nivel | null;
}) {
  const orden = NIVELES.map((n) => n.nivel);
  const permitido = (n: Nivel) => orden.indexOf(n) <= orden.indexOf(maximo) || n === siguienteAbierto;
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El refresh no navega, así que loading.tsx no aplica: la transición
  // es lo único que sabe cuándo llegó de verdad la página fresca.
  const [refrescando, empezarTransicion] = useTransition();

  async function cambiar(nuevo: Nivel) {
    if (nuevo === nivel) {
      setAbierto(false);
      return;
    }
    setOcupado(true);
    setError(null);
    const r = await pedir("/api/nivel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nivel: nuevo }),
    });
    setOcupado(false);
    if (r?.ok) {
      setAbierto(false);
      empezarTransicion(() => router.refresh());
      return;
    }
    // Antes el menú se cerraba sin decir nada y el nivel seguía igual
    // (sin red, o un 403 "bloqueado"). Ahora queda abierto con el motivo,
    // como en "Pasar de nivel" de Mi ruta (auditoría, 30 de octubre de 2026).
    const d = r ? await r.json().catch(() => ({})) : {};
    setError(
      !r
        ? "Sin conexión. Revisa tu internet e intenta otra vez."
        : r.status === 401
          ? SESION_CERRADA
          : (d.mensaje ?? "No pudimos cambiar tu nivel. Intenta otra vez.")
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setAbierto(!abierto);
          setError(null);
        }}
        aria-expanded={abierto}
        className="flex items-center gap-1 rounded-full bg-primario-suave px-2.5 py-1 text-xs font-semibold text-primario transition hover:brightness-95"
      >
        {ocupado || refrescando ? "Cambiando…" : `Nivel ${nivel}`}
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-borde bg-superficie p-2 shadow-lg">
            <p className="px-2 py-1.5 text-xs text-texto-suave">
              Puedes bajar cuando quieras. Para subir, completa todas las actividades de tu nivel.
            </p>
            {error && (
              <p role="alert" className="mx-1 mb-1 rounded-xl bg-error/10 px-2 py-1.5 text-xs text-error">
                {error}
              </p>
            )}
            {NIVELES.map((n) => (
              <button
                key={n.nivel}
                type="button"
                disabled={ocupado || !permitido(n.nivel)}
                onClick={() => cambiar(n.nivel)}
                title={permitido(n.nivel) ? undefined : "Completa todas las actividades de tu nivel para subir"}
                className={`flex w-full items-baseline gap-2 rounded-xl px-3 py-2 text-left transition disabled:opacity-50 ${
                  n.nivel === nivel ? "bg-primario-suave" : "hover:bg-superficie-2"
                }`}
              >
                <span className="w-6 font-semibold">{n.nivel}</span>
                <span className="text-sm text-texto-suave">{n.etiqueta}</span>
                {!permitido(n.nivel) && (
                  <svg viewBox="0 0 24 24" className="ml-auto size-4 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Bloqueado">
                    <rect x="6" y="11" width="12" height="9" rx="2" />
                    <path d="M9 11V8a3 3 0 016 0v3" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
