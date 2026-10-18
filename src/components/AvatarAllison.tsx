"use client";

import Image from "next/image";
import type { EstadoConversacion } from "@/lib/tipos";

/**
 * El avatar de Allison.
 *
 * Deliberadamente NO hacemos sincronía labial sobre la foto: con
 * herramientas de bajo costo la boca queda fuera de tiempo sobre una cara
 * quieta, y el resultado se siente inquietante. Una foto bien presentada
 * se ve mucho mejor que una foto mal animada.
 *
 * Opción B del avatar (aprobada el 15 de octubre de 2026): la misma foto
 * con cuatro estados y sin mover la boca. En reposo respira muy suave;
 * escuchando, el borde se pone verde y un anillo verde crece y baja con
 * el volumen real del micrófono del alumno; pensando, tres puntos;
 * hablando, el borde azul y el halo que late. Con "reducir movimiento",
 * todo se queda quieto (globals.css y la consulta de abajo).
 *
 * Los tres videos cortos quedan para una segunda etapa: se reemplaza la
 * <Image> por un <video> que cambia de fuente según el estado.
 */
export function AvatarAllison({
  estado,
  compacto = false,
  volumen = null,
}: {
  estado: EstadoConversacion;
  /**
   * Versión pequeña para cuando la transcripción está abierta: la foto
   * se queda siempre en pantalla, pero le cede el espacio al texto.
   */
  compacto?: boolean;
  /** El volumen del micrófono mientras el alumno habla (0 a 1). */
  volumen?: number | null;
}) {
  const hablando = estado === "hablando";
  const procesando = estado === "procesando";
  const escuchando = estado === "grabando";
  const quieto =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const anillo = escuchando && volumen !== null && !quieto ? volumen : 0;

  return (
    <div className="relative flex items-center justify-center">
      {/* Halo que late mientras Allison habla */}
      {hablando && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primario-claro"
          style={{ animation: "pulso-voz 1.4s ease-in-out infinite" }}
        />
      )}

      {/* El anillo verde que sigue la voz del alumno */}
      {escuchando && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full transition-[box-shadow] duration-100"
          style={{ boxShadow: `0 0 0 ${(compacto ? 3 : 6) + anillo * (compacto ? 12 : 26)}px color-mix(in srgb, var(--menta) 35%, transparent)` }}
        />
      )}
      <div
        className={`relative overflow-hidden rounded-full bg-primario-suave transition-all duration-300 ${
          compacto ? "size-14 border-2" : "size-40 border-4 sm:size-52"
        } ${hablando ? "border-primario" : escuchando ? "border-menta" : "border-borde"} ${
          estado === "inactivo" ? "respira" : ""
        }`}
      >
        <Image
          src="/allison.png"
          alt="Allison, tu profesora de inglés"
          fill
          sizes="(max-width: 640px) 160px, 208px"
          className="object-cover"
          priority
        />
      </div>

      {/* Tres puntos mientras piensa */}
      {procesando && (
        <div className="absolute -bottom-2 flex gap-1.5 rounded-full bg-superficie px-3 py-2 shadow-sm ring-1 ring-borde">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-texto-suave"
              style={{
                animation: "pulso-voz 1s ease-in-out infinite",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
