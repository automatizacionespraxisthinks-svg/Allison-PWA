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
 * Cuando estén listos los tres bucles de video (reposo, escuchando,
 * hablando), se reemplaza la <Image> por un <video> que cambia de fuente
 * según el estado. La estructura ya queda preparada para eso.
 */
export function AvatarAllison({
  estado,
  compacto = false,
}: {
  estado: EstadoConversacion;
  /**
   * Versión pequeña para cuando la transcripción está abierta: la foto
   * se queda siempre en pantalla, pero le cede el espacio al texto.
   */
  compacto?: boolean;
}) {
  const hablando = estado === "hablando";
  const procesando = estado === "procesando";

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

      <div
        className={`relative overflow-hidden rounded-full bg-primario-suave transition-all duration-300 ${
          compacto ? "size-14 border-2" : "size-40 border-4 sm:size-52"
        } ${hablando ? "border-primario" : "border-borde"}`}
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
