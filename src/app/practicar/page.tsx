"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarAllison } from "@/components/AvatarAllison";
import { BotonGrabar } from "@/components/BotonGrabar";
import { Transcripcion } from "@/components/Transcripcion";
import type { EstadoConversacion, Mensaje, Nivel } from "@/lib/tipos";

export default function PaginaPracticar() {
  const [estado, setEstado] = useState<EstadoConversacion>("inactivo");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [verTranscripcion, setVerTranscripcion] = useState(false);
  const [mensajesRestantes, setMensajesRestantes] = useState(20);

  // Vendrán de la sesión del alumno cuando exista la base de datos
  const nivel: Nivel = "A2";

  const finRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, verTranscripcion]);

  async function manejarAudio(audio: Blob, duracionSeg: number) {
    setEstado("procesando");

    // TODO: aquí va la llamada real a /api/conversar, que envía el audio a
    // Gemini y devuelve la transcripción literal + la respuesta de Allison.
    // Por ahora simulamos para poder ver y ajustar la pantalla.
    await new Promise((r) => setTimeout(r, 1200));

    const ahora = new Date().toISOString();
    setMensajes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        rol: "alumno",
        texto: "Yesterday I go to the park with my family.",
        duracionSeg,
        correcciones: [
          {
            tipo: "gramatica",
            original: "I go",
            correccion: "I went",
            explicacion: "En pasado, 'go' se convierte en 'went'.",
            prioridad: "alta",
          },
        ],
        creadoEn: ahora,
      },
      {
        id: crypto.randomUUID(),
        rol: "allison",
        texto:
          "Oh, you went to the park! That sounds nice. Who did you go with?",
        correcciones: [],
        creadoEn: ahora,
      },
    ]);

    setMensajesRestantes((n) => Math.max(0, n - 1));
    setEstado("hablando");
    await new Promise((r) => setTimeout(r, 2500));
    setEstado("inactivo");

    void audio; // se subirá a R2 cuando exista el backend
  }

  const sinMensajes = mensajesRestantes === 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-6">
      {/* Encabezado */}
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primario-suave px-2.5 py-1 text-xs font-semibold text-primario">
            Nivel {nivel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-sm tabular-nums ${
              mensajesRestantes <= 10 ? "text-acento" : "text-texto-suave"
            }`}
          >
            {mensajesRestantes} mensajes
          </span>
          <button
            type="button"
            onClick={() => setVerTranscripcion((v) => !v)}
            aria-pressed={verTranscripcion}
            className="rounded-full border border-borde px-3 py-1.5 text-xs font-medium text-texto-suave transition-colors hover:bg-superficie-2"
          >
            {verTranscripcion ? "Ocultar texto" : "Ver texto"}
          </button>
        </div>
      </header>

      {/* Zona central */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
        <AvatarAllison estado={estado} />

        {mensajes.length === 0 && (
          <div className="max-w-sm text-center">
            <h1 className="text-2xl font-semibold">Hi! I&apos;m Allison</h1>
            <p className="mt-2 text-texto-suave">
              Toca el botón y háblame en inglés. Habla tranquilo: si te
              equivocas, te corrijo y seguimos.
            </p>
          </div>
        )}

        {verTranscripcion && mensajes.length > 0 && (
          <Transcripcion mensajes={mensajes} />
        )}
        <div ref={finRef} />
      </div>

      {/* Aviso de saldo */}
      {sinMensajes && (
        <div className="mb-4 rounded-xl border border-acento/30 bg-acento/10 p-4 text-center">
          <p className="text-sm font-medium">Se te acabaron los mensajes.</p>
          <p className="mt-1 text-sm text-texto-suave">
            Recarga desde $4.000 y sigue practicando.
          </p>
          <button className="mt-3 rounded-lg bg-acento px-4 py-2 text-sm font-semibold text-white">
            Recargar
          </button>
        </div>
      )}

      {/* Controles */}
      <div className="sticky bottom-0 flex justify-center bg-fondo pb-2 pt-4">
        <BotonGrabar
          estado={estado}
          onIniciar={() => setEstado("grabando")}
          onAudioListo={manejarAudio}
          deshabilitado={sinMensajes}
        />
      </div>
    </main>
  );
}
