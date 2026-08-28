"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { AvatarAllison } from "@/components/AvatarAllison";
import { BotonGrabar } from "@/components/BotonGrabar";
import { Transcripcion } from "@/components/Transcripcion";
import type { EstadoConversacion, Mensaje, Nivel } from "@/lib/tipos";

interface Props {
  nombre: string;
  nivel: Nivel;
  mensajesIniciales: number;
}

export function Conversacion({ nombre, nivel, mensajesIniciales }: Props) {
  const [estado, setEstado] = useState<EstadoConversacion>("inactivo");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [verTranscripcion, setVerTranscripcion] = useState(false);
  const [mensajesRestantes, setMensajesRestantes] = useState(mensajesIniciales);
  const [error, setError] = useState<string | null>(null);

  const conversacionId = useRef<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, verTranscripcion]);

  /**
   * PROVISIONAL — voz del navegador.
   * Se reemplaza por el TTS del VPS cuando esté conectado. Mientras
   * tanto permite probar la conversación completa: Allison responde
   * hablando, no solo escribiendo.
   */
  function hablar(texto: string): Promise<void> {
    return new Promise((resolver) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        return resolver();
      }
      const voz = new SpeechSynthesisUtterance(texto);
      voz.lang = "en-US";
      voz.rate = nivel === "A1" ? 0.8 : nivel === "A2" ? 0.9 : 1;
      voz.onend = () => resolver();
      voz.onerror = () => resolver();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(voz);
    });
  }

  async function manejarAudio(audio: Blob, duracionSeg: number) {
    setEstado("procesando");
    setError(null);

    try {
      const cuerpo = new FormData();
      cuerpo.append("audio", audio);
      cuerpo.append("duracion", String(duracionSeg));
      if (conversacionId.current) {
        cuerpo.append("conversacion", conversacionId.current);
      }

      const respuesta = await fetch("/api/conversar", { method: "POST", body: cuerpo });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.mensaje ?? "Algo salió mal. Intenta de nuevo.");
        if (datos.error === "sin_mensajes") setMensajesRestantes(0);
        setEstado("inactivo");
        return;
      }

      conversacionId.current = datos.conversacionId;
      setMensajes((prev) => [...prev, datos.alumno, datos.allison]);
      setMensajesRestantes(datos.mensajesRestantes);

      setEstado("hablando");
      await hablar(datos.allison.texto);
      setEstado("inactivo");
    } catch {
      setError("No pudimos conectar. Revisa tu internet e intenta de nuevo.");
      setEstado("inactivo");
    }
  }

  const sinMensajes = mensajesRestantes === 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-6">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primario-suave px-2.5 py-1 text-xs font-semibold text-primario">
            Nivel {nivel}
          </span>
          <span className="hidden text-sm text-texto-suave sm:inline">{nombre}</span>
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
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="rounded-full border border-borde p-1.5 text-texto-suave transition-colors hover:bg-superficie-2"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </header>

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

        {/* Lo último que dijo Allison, siempre visible aunque el texto esté oculto */}
        {!verTranscripcion && mensajes.length > 0 && (
          <p className="max-w-md text-center text-lg leading-relaxed">
            {mensajes[mensajes.length - 1].texto}
          </p>
        )}

        {verTranscripcion && mensajes.length > 0 && (
          <Transcripcion mensajes={mensajes} />
        )}
        <div ref={finRef} />
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-error/10 p-3 text-center text-sm text-error">
          {error}
        </p>
      )}

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
