"use client";

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
export function AvatarAllison({ estado }: { estado: EstadoConversacion }) {
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

      {/*
        Usamos imagen de fondo y no <Image>: si el archivo todavía no está,
        se ve un degradado limpio en vez de un ícono roto. Cuando llegue la
        foto definitiva basta con dejarla en public/allison.jpg.
      */}
      <div
        role="img"
        aria-label="Allison, tu profesora de inglés"
        className={`relative size-40 rounded-full border-4 bg-primario-suave bg-cover bg-center transition-colors duration-300 sm:size-52 ${
          hablando ? "border-primario" : "border-borde"
        }`}
        style={{ backgroundImage: "url('/allison.jpg')" }}
      />

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
