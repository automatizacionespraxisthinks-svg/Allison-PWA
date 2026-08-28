"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_MAX_SEGUNDOS, type EstadoConversacion } from "@/lib/tipos";

interface Props {
  estado: EstadoConversacion;
  onIniciar: () => void;
  onAudioListo: (audio: Blob, duracionSeg: number) => void;
  deshabilitado?: boolean;
}

/**
 * Botón de grabar. Un toque empieza, otro toque termina.
 *
 * Se corta solo a los 60 segundos: un mensaje es un turno, y sin tope
 * un alumno podría mandar audios de cinco minutos que cuestan lo mismo
 * que uno de diez segundos.
 */
export function BotonGrabar({ estado, onIniciar, onAudioListo, deshabilitado }: Props) {
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);

  const grabando = estado === "grabando";

  const limpiar = useCallback(() => {
    if (intervalo.current) {
      clearInterval(intervalo.current);
      intervalo.current = null;
    }
    grabadora.current?.stream.getTracks().forEach((t) => t.stop());
    grabadora.current = null;
  }, []);

  const detener = useCallback(() => {
    if (grabadora.current?.state === "recording") {
      grabadora.current.stop();
    }
  }, []);

  const empezar = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      // Opus dentro de WebM: buena calidad de voz en archivos pequeños,
      // que es lo que importa desde un celular con datos móviles.
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);

      trozos.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) trozos.current.push(e.data);
      };
      mr.onstop = () => {
        const audio = new Blob(trozos.current, { type: mr.mimeType || "audio/webm" });
        const duracion = segundosRef.current;
        limpiar();
        setSegundos(0);
        if (duracion >= 1) onAudioListo(audio, duracion);
      };

      grabadora.current = mr;
      mr.start();
      onIniciar();

      setSegundos(0);
      intervalo.current = setInterval(() => {
        setSegundos((s) => {
          const siguiente = s + 1;
          if (siguiente >= AUDIO_MAX_SEGUNDOS) detener();
          return siguiente;
        });
      }, 1000);
    } catch {
      setError("No pudimos usar el micrófono. Revisa los permisos del navegador.");
    }
  }, [detener, limpiar, onIniciar, onAudioListo]);

  // Espejo del contador para leerlo dentro de onstop sin recrear la grabadora
  const segundosRef = useRef(0);
  useEffect(() => {
    segundosRef.current = segundos;
  }, [segundos]);

  useEffect(() => limpiar, [limpiar]);

  const restantes = AUDIO_MAX_SEGUNDOS - segundos;
  const porAcabarse = restantes <= 10;

  return (
    <div className="flex flex-col items-center gap-3">
      {error && (
        <p role="alert" className="max-w-xs text-center text-sm text-error">
          {error}
        </p>
      )}

      {grabando && (
        <p
          className={`font-mono text-sm tabular-nums ${
            porAcabarse ? "text-acento" : "text-texto-suave"
          }`}
        >
          {String(Math.floor(segundos / 60)).padStart(2, "0")}:
          {String(segundos % 60).padStart(2, "0")}
          {porAcabarse && ` · quedan ${restantes}s`}
        </p>
      )}

      <button
        type="button"
        onClick={grabando ? detener : empezar}
        disabled={deshabilitado || estado === "procesando" || estado === "hablando"}
        aria-label={grabando ? "Detener y enviar" : "Hablar con Allison"}
        className={`relative flex size-20 items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
          grabando
            ? "bg-error text-white shadow-lg"
            : "bg-primario text-white shadow-md hover:brightness-110 active:scale-95"
        }`}
      >
        {grabando && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-error"
            style={{ animation: "onda-grabacion 1.5s ease-out infinite" }}
          />
        )}

        <span className="relative">
          {grabando ? (
            <svg viewBox="0 0 24 24" className="size-7" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
              <path d="M18 11a1 1 0 1 0-2 0 4 4 0 0 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.91V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.09A6 6 0 0 0 18 11Z" />
            </svg>
          )}
        </span>
      </button>

      <p className="text-sm text-texto-suave">
        {estado === "grabando" && "Toca para enviar"}
        {estado === "procesando" && "Allison está pensando…"}
        {estado === "hablando" && "Allison está hablando"}
        {estado === "inactivo" && "Toca y habla en inglés"}
      </p>
    </div>
  );
}
