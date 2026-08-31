"use client";

import { useEffect, useState } from "react";
import { useInstalacion } from "@/lib/instalar";

/**
 * Instalar Allison en el celular.
 *
 * El uso principal es desde el teléfono, así que el acceso a instalar
 * tiene que estar SIEMPRE a mano — no escondido tras un aviso que
 * aparece una vez y no vuelve nunca.
 *
 * Dos piezas con la misma cara:
 * - `BotonInstalar`: una línea más del menú, idéntica a las demás.
 * - El modal: mismo azul, mismos bordes redondeados y misma foto de
 *   Allison que la bienvenida, para que se sienta parte de la app y no
 *   un cartel pegado encima.
 *
 * En iPhone no existe la instalación automática: ahí el modal explica
 * el camino de Compartir → Añadir a inicio, que es la única forma.
 */
export function BotonInstalar({
  className,
  texto = "Instalar en el celular",
  tamanoIcono = "size-4",
}: {
  className?: string;
  /** Corto para el chip de la barra, largo para el menú. */
  texto?: string;
  tamanoIcono?: string;
}) {
  const { modo } = useInstalacion();
  const [abierto, setAbierto] = useState(false);

  // Ya instalada, o un navegador que no la soporta: no se ofrece nada.
  if (modo === "instalada" || modo === "no_disponible") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={className}
        title="Instalar Allison en tu dispositivo"
      >
        <svg
          viewBox="0 0 24 24"
          className={tamanoIcono}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <path d="M12 7v7m0 0 3-3m-3 3-3-3" />
        </svg>
        {texto}
      </button>

      {abierto && <ModalInstalar alCerrar={() => setAbierto(false)} />}
    </>
  );
}

function ModalInstalar({ alCerrar }: { alCerrar: () => void }) {
  const { modo, instalar } = useInstalacion();
  const [ocupado, setOcupado] = useState(false);

  // Escape cierra: en escritorio es lo que la gente intenta primero.
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [alCerrar]);

  async function pedirInstalacion() {
    setOcupado(true);
    const aceptada = await instalar();
    setOcupado(false);
    if (aceptada) alCerrar();
  }

  const VENTAJAS: [string, string][] = [
    ["📱", "Se abre desde tu pantalla de inicio, como cualquier app"],
    ["⚡", "Entra más rápido y sin la barra del navegador"],
    ["🎤", "El micrófono queda listo para hablar de una vez"],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-instalar"
    >
      {/* El fondo cierra al tocarlo: en el celular es el gesto natural */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={alCerrar}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative w-full max-w-md rounded-3xl bg-superficie p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div
            role="img"
            aria-label="Allison"
            className="size-20 rounded-full border-4 border-primario bg-primario-suave bg-cover bg-center"
            style={{ backgroundImage: "url('/allison.png')" }}
          />
          <h2 id="titulo-instalar" className="mt-4 text-xl font-bold">
            Ten a Allison en tu celular
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-texto-suave">
            Instálala y practica tu inglés en un toque, sin buscar la
            página cada vez.
          </p>
        </div>

        <ul className="mt-5 flex flex-col gap-2.5 text-sm">
          {VENTAJAS.map(([icono, texto]) => (
            <li key={texto} className="flex items-start gap-2.5">
              <span aria-hidden className="text-base leading-tight">
                {icono}
              </span>
              <span className="leading-snug">{texto}</span>
            </li>
          ))}
        </ul>

        {modo === "ios" ? (
          <div className="mt-5 rounded-2xl border border-primario/25 bg-primario/5 p-4">
            <p className="text-sm font-semibold">Desde tu iPhone o iPad:</p>
            <ol className="mt-2.5 flex flex-col gap-2 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primario text-[11px] font-bold text-white">
                  1
                </span>
                <span className="leading-snug">
                  Toca{" "}
                  <span className="inline-flex items-center gap-1 font-medium">
                    Compartir
                    <svg viewBox="0 0 24 24" className="inline size-4 text-primario" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M12 16V3m0 0L8 7m4-4 4 4" />
                      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                    </svg>
                  </span>{" "}
                  en la barra de Safari
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primario text-[11px] font-bold text-white">
                  2
                </span>
                <span className="leading-snug">
                  Baja y elige <strong>Añadir a pantalla de inicio</strong>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primario text-[11px] font-bold text-white">
                  3
                </span>
                <span className="leading-snug">
                  Confirma con <strong>Añadir</strong>. ¡Listo!
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <button
            type="button"
            onClick={pedirInstalacion}
            disabled={ocupado}
            className="degradado-primario sombra-accion mt-5 w-full rounded-2xl px-6 py-4 text-lg font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {ocupado ? "Instalando…" : "Instalar Allison"}
          </button>
        )}

        <button
          type="button"
          onClick={alCerrar}
          className="mt-3 w-full rounded-2xl border border-borde px-6 py-3 font-medium transition hover:bg-superficie-2"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
