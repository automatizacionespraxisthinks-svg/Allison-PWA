"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AvatarAllison } from "@/components/AvatarAllison";
import { BotonGrabar } from "@/components/BotonGrabar";
import { AyudaTurno } from "@/components/AyudaTurno";
import { Bienvenida } from "@/components/Bienvenida";
import { AvisoVerificar } from "@/components/AvisoVerificar";
import { SelectorNivel } from "@/components/SelectorNivel";
import { FinDePrueba, type LogroPrueba } from "@/components/FinDePrueba";
import { Transcripcion } from "@/components/Transcripcion";
import type { EstadoConversacion, Mensaje, Nivel } from "@/lib/tipos";

interface Props {
  nombre: string;
  nivel: Nivel;
  mensajesIniciales: number;
  /** El hilo que ya existía: el alumno vuelve a su conversación, no a
   *  una pantalla en blanco. */
  conversacionId: string;
  historial: Mensaje[];
  enPrueba: boolean;
  faltaVerificar: boolean;
  /** Viene del servidor: las variables sin NEXT_PUBLIC_ no existen aquí,
   *  y un número escrito a mano quedaría mintiendo si cambia el .env. */
  mensajesPorVerificar: number;
  esCoordinador: boolean;
  esAdmin: boolean;
  logro?: LogroPrueba;
}

export function Conversacion({
  nombre,
  nivel,
  mensajesIniciales,
  conversacionId: idInicial,
  historial,
  enPrueba,
  faltaVerificar,
  mensajesPorVerificar,
  esCoordinador,
  esAdmin,
  logro,
}: Props) {
  const [estado, setEstado] = useState<EstadoConversacion>("inactivo");
  const [mensajes, setMensajes] = useState<Mensaje[]>(historial);
  const [verTranscripcion, setVerTranscripcion] = useState(false);
  const [mensajesRestantes, setMensajesRestantes] = useState(mensajesIniciales);
  const [error, setError] = useState<string | null>(null);
  /** Lo que el alumno acaba de decir, mostrado apenas llega. */
  const [dichoAhora, setDichoAhora] = useState<string | null>(null);

  const conversacionId = useRef<string | null>(idInicial);
  const ultimoAudio = useRef<SpeechSynthesisUtterance | null>(null);
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
      ultimoAudio.current = voz;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(voz);
    });
  }

  async function manejarAudio(audio: Blob, duracionSeg: number) {
    setEstado("procesando");
    setError(null);
    setDichoAhora(null);

    try {
      const cuerpo = new FormData();
      cuerpo.append("audio", audio);
      cuerpo.append("duracion", String(duracionSeg));
      if (conversacionId.current) {
        cuerpo.append("conversacion", conversacionId.current);
      }

      const respuesta = await fetch("/api/conversar", { method: "POST", body: cuerpo });

      // Los errores previos al turno llegan como JSON normal
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        setError(datos.mensaje ?? "Algo salió mal. Intenta de nuevo.");
        if (datos.error === "sin_mensajes") setMensajesRestantes(0);
        setEstado("inactivo");
        return;
      }

      // La respuesta llega por partes, una línea de JSON cada vez.
      const lector = respuesta.body?.getReader();
      if (!lector) throw new Error("sin cuerpo");

      const decodificador = new TextDecoder();
      let resto = "";
      let hablando: Promise<void> | null = null;

      while (true) {
        const { done, value } = await lector.read();
        if (done) break;

        resto += decodificador.decode(value, { stream: true });
        const lineas = resto.split("\n");
        resto = lineas.pop() ?? "";

        for (const linea of lineas) {
          if (!linea.trim()) continue;
          const parte = JSON.parse(linea);

          if (parte.tipo === "transcripcion") {
            // Primera señal de vida: el alumno se ve a sí mismo
            setDichoAhora(parte.texto);
          }

          if (parte.tipo === "respuesta") {
            // Allison empieza a hablar sin esperar las correcciones
            setEstado("hablando");
            hablando = hablar(parte.texto);
          }

          if (parte.tipo === "error") {
            setError(parte.mensaje ?? "Algo salió mal.");
            if (parte.error === "sin_mensajes") setMensajesRestantes(0);
            setDichoAhora(null);
            setEstado("inactivo");
            return;
          }

          if (parte.tipo === "fin") {
            conversacionId.current = parte.conversacionId;
            setMensajes((prev) => [...prev, parte.alumno, parte.allison]);
            setMensajesRestantes(parte.mensajesRestantes);
          }
        }
      }

      await hablando;
      setDichoAhora(null);
      setEstado("inactivo");
    } catch {
      setError("No pudimos conectar. Revisa tu internet e intenta de nuevo.");
      setEstado("inactivo");
    }
  }

  /** Vuelve a decir lo último, sin gastar un mensaje. */
  function repetir() {
    const ultimo = mensajes[mensajes.length - 1];
    if (!ultimo || ultimo.rol !== "allison") return;
    setEstado("hablando");
    void hablar(ultimo.texto).then(() => setEstado("inactivo"));
  }

  const sinMensajes = mensajesRestantes === 0;
  const ultimoDeAllison =
    mensajes.length > 0 && mensajes[mensajes.length - 1].rol === "allison"
      ? mensajes[mensajes.length - 1]
      : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-6">
      <Bienvenida nombre={nombre} />

      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <SelectorNivel nivel={nivel} />
          <span className="hidden text-sm text-texto-suave sm:inline">{nombre}</span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-sm tabular-nums ${
              mensajesRestantes <= 10 ? "text-acento" : "text-texto-suave"
            }`}
          >
            {mensajesRestantes} {enPrueba ? "de prueba" : "mensajes"}
          </span>
          <Link
            href="/recargar"
            title="Recargar mensajes"
            aria-label="Recargar mensajes"
            className="rounded-full border border-borde p-1.5 text-texto-suave transition-colors hover:bg-superficie-2"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setVerTranscripcion((v) => !v)}
            aria-pressed={verTranscripcion}
            className="rounded-full border border-borde px-3 py-1.5 text-xs font-medium text-texto-suave transition-colors hover:bg-superficie-2"
          >
            {verTranscripcion ? "Ocultar texto" : "Ver texto"}
          </button>
          {esAdmin && (
            <Link
              href="/admin"
              title="Panel de administración"
              aria-label="Panel de administración"
              className="rounded-full border border-borde p-1.5 text-texto-suave transition-colors hover:bg-superficie-2"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14a1.7 1.7 0 0 0-1.5-1H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3 7.6a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 8 3.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </Link>
          )}
          {esCoordinador && (
            <Link
              href="/colegio"
              title="Panel del colegio"
              aria-label="Panel del colegio"
              className="rounded-full border border-borde p-1.5 text-texto-suave transition-colors hover:bg-superficie-2"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              </svg>
            </Link>
          )}
          <Link
            href="/conversaciones"
            title="Tus conversaciones"
            aria-label="Tus conversaciones"
            className="rounded-full border border-borde p-1.5 text-texto-suave transition-colors hover:bg-superficie-2"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Link>
          <Link
            href="/progreso"
            title="Tu progreso"
            aria-label="Tu progreso"
            className="rounded-full border border-borde p-1.5 text-texto-suave transition-colors hover:bg-superficie-2"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />
            </svg>
          </Link>
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

        {/* Lo que el alumno acaba de decir, apenas llega */}
        {dichoAhora && (
          <p className="max-w-md rounded-2xl bg-superficie-2 px-4 py-3 text-center text-[15px] text-texto-suave">
            {dichoAhora}
          </p>
        )}

        {/* Lo último que dijo Allison, siempre visible aunque el texto esté oculto */}
        {!verTranscripcion && !dichoAhora && mensajes.length > 0 && (
          <p className="max-w-md text-center text-lg leading-relaxed">
            {mensajes[mensajes.length - 1].texto}
          </p>
        )}

        {verTranscripcion && mensajes.length > 0 && (
          <Transcripcion mensajes={mensajes} />
        )}

        {ultimoDeAllison && estado !== "grabando" && (
          <AyudaTurno
            texto={ultimoDeAllison.texto}
            nivel={nivel}
            onRepetir={repetir}
            puedeRepetir={estado === "inactivo"}
          />
        )}
        <div ref={finRef} />
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-error/10 p-3 text-center text-sm text-error">
          {error}
        </p>
      )}

      {sinMensajes &&
        (enPrueba && logro ? (
          <div className="mb-4">
            <FinDePrueba logro={logro} />
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-acento/30 bg-acento/10 p-4 text-center">
            <p className="text-sm font-medium">Se te acabaron los mensajes.</p>
            <p className="mt-1 text-sm text-texto-suave">
              Recarga desde $4.000 y sigue practicando.
            </p>
            <Link
              href="/recargar"
              className="mt-3 inline-block rounded-lg bg-acento px-4 py-2 text-sm font-semibold text-white"
            >
              Recargar
            </Link>
          </div>
        ))}

      {faltaVerificar && <AvisoVerificar mensajes={mensajesPorVerificar} />}

      {/* Aviso antes de que se acabe, no cuando ya no puede hacer nada */}
      {enPrueba && mensajesRestantes > 0 && mensajesRestantes <= 5 && (
        <p className="mb-3 rounded-xl bg-acento/10 p-3 text-center text-sm text-acento">
          Te quedan {mensajesRestantes} de prueba.{" "}
          <Link href="/recargar" className="font-semibold underline">
            Recarga desde $4.000
          </Link>
        </p>
      )}

      <div className="sticky bottom-0 flex justify-center bg-fondo pb-2 pt-4">
        <BotonGrabar
          estado={estado}
          onIniciar={() => setEstado("grabando")}
          onAudioListo={manejarAudio}
          onDescartar={() => setEstado("inactivo")}
          deshabilitado={sinMensajes}
        />
      </div>
    </main>
  );
}
