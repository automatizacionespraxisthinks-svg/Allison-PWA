"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_MAX_SEGUNDOS, type EstadoConversacion } from "@/lib/tipos";

/**
 * Volumen mínimo para dar el audio por válido.
 *
 * Una sala en silencio con el micrófono abierto ronda 0,005; hablar
 * bajito ya pasa de 0,03. El umbral distingue "no entró sonido" de
 * "habló flojito", sin castigar a quien habla en voz baja.
 */
const UMBRAL_SILENCIO = 0.015;

interface Props {
  estado: EstadoConversacion;
  onIniciar: () => void;
  onAudioListo: (audio: Blob, duracionSeg: number) => void;
  /** Se descartó la grabación: hay que volver el estado a inactivo o el
   *  botón se queda en rojo para siempre. */
  onDescartar: () => void;
  deshabilitado?: boolean;
}

/**
 * Botón de grabar. Un toque empieza, otro toque termina.
 *
 * Se corta solo a los 60 segundos: un mensaje es un turno, y sin tope
 * un alumno podría mandar audios de cinco minutos que cuestan lo mismo
 * que uno de diez segundos.
 *
 * La duración se calcula con la hora de inicio, no contando intervalos:
 * un setInterval se desvía si el navegador se ocupa o la pestaña pasa a
 * segundo plano, y esa duración es la que se cobra y se guarda.
 */
export function BotonGrabar({
  estado,
  onIniciar,
  onAudioListo,
  onDescartar,
  deshabilitado,
}: Props) {
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);
  const inicio = useRef<number>(0);
  const audioCtx = useRef<AudioContext | null>(null);
  const volumenMaximo = useRef<number>(0);

  const grabando = estado === "grabando";

  const limpiar = useCallback(() => {
    if (intervalo.current) {
      clearInterval(intervalo.current);
      intervalo.current = null;
    }
    grabadora.current?.stream.getTracks().forEach((t) => t.stop());
    grabadora.current = null;
    void audioCtx.current?.close();
    audioCtx.current = null;
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
        const duracion = Math.min(
          AUDIO_MAX_SEGUNDOS,
          Math.round((Date.now() - inicio.current) / 1000)
        );
        const audio = new Blob(trozos.current, { type: mr.mimeType || "audio/webm" });
        const pico = volumenMaximo.current;
        limpiar();
        setSegundos(0);

        if (duracion < 1) {
          onDescartar();
          return;
        }

        // Si no se oyó nada, no se manda. Con el micrófono mudo el
        // modelo no devuelve vacío: se INVENTA una conversación, y al
        // alumno le cobraríamos un mensaje por algo que nunca dijo -- y
        // le ensuciaríamos el mapa de progreso con errores ajenos.
        if (pico < UMBRAL_SILENCIO) {
          setError(
            "No te escuchamos. Revisa que el micrófono no esté silenciado."
          );
          onDescartar();
          return;
        }

        onAudioListo(audio, duracion);
      };

      // Medidor de volumen: sirve para saber si de verdad entró sonido
      const ctx = new AudioContext();
      const analizador = ctx.createAnalyser();
      analizador.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analizador);
      audioCtx.current = ctx;
      volumenMaximo.current = 0;
      const muestras = new Uint8Array(analizador.fftSize);

      grabadora.current = mr;
      inicio.current = Date.now();
      mr.start();
      onIniciar();

      setSegundos(0);
      intervalo.current = setInterval(() => {
        analizador.getByteTimeDomainData(muestras);
        let suma = 0;
        for (const v of muestras) suma += (v - 128) ** 2;
        const nivel = Math.sqrt(suma / muestras.length) / 128;
        volumenMaximo.current = Math.max(volumenMaximo.current, nivel);

        const transcurridos = Math.round((Date.now() - inicio.current) / 1000);
        setSegundos(transcurridos);
        if (transcurridos >= AUDIO_MAX_SEGUNDOS) detener();
      }, 250);
    } catch {
      setError("No pudimos usar el micrófono. Revisa los permisos del navegador.");
    }
  }, [detener, limpiar, onIniciar, onAudioListo, onDescartar]);

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
            : "degradado-primario sombra-accion text-white hover:brightness-110 active:scale-95"
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
