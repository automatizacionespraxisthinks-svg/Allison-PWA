"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AvatarAllison } from "@/components/AvatarAllison";
import { BotonGrabar } from "@/components/BotonGrabar";
import { Bienvenida } from "@/components/Bienvenida";
import { AvisoVerificar } from "@/components/AvisoVerificar";
import { BotonInstalar } from "@/components/InstalarApp";
import { SelectorNivel } from "@/components/SelectorNivel";
import { FinDePrueba, type LogroPrueba } from "@/components/FinDePrueba";
import { Transcripcion } from "@/components/Transcripcion";
import type { EstadoConversacion, Mensaje, Nivel } from "@/lib/tipos";
import { fijarModoTexto, useModoTexto } from "@/lib/entrada";
import { useVelocidad } from "@/lib/velocidad";
import { desbloquearVoz, hablarIngles } from "@/lib/voz";
import { descartarAscenso, useAscensoDescartado } from "@/lib/sugerencia";
import { pedir } from "@/lib/pedir";
import { pesos } from "@/lib/precios";

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
  /** La recarga mínima, por la misma razón. */
  recargaMinima: number;
  esCoordinador: boolean;
  esAdmin: boolean;
  racha: number;
  logro?: LogroPrueba;
  /** Presente cuando este hilo es una lección del currículo. */
  leccion?: {
    clave: string;
    titulo: string;
    gramatica: string;
    logros: number;
    meta: number;
    completada: boolean;
  };
  /** Presente cuando el desempeño amerita proponer el siguiente nivel. */
  sugerenciaNivel?: {
    siguiente: Nivel;
    razon: string;
  };
}

const ESTADO_LINEA: Record<EstadoConversacion, string> = {
  inactivo: "en línea",
  grabando: "escuchándote…",
  procesando: "pensando…",
  hablando: "hablando…",
};

/**
 * La conversación como un chat de verdad.
 *
 * Allison vive en el encabezado — foto, nombre y estado, siempre
 * visibles — y la charla ocupa toda la pantalla, como cualquier chat
 * que el alumno ya sabe usar. Cada mensaje trae sus propios controles;
 * abajo solo quedan el micrófono y la idea de rescate.
 */
export function Conversacion({
  nombre,
  nivel,
  mensajesIniciales,
  conversacionId: idInicial,
  historial,
  enPrueba,
  faltaVerificar,
  mensajesPorVerificar,
  recargaMinima,
  esCoordinador,
  esAdmin,
  racha,
  logro,
  leccion: leccionInicial,
  sugerenciaNivel,
}: Props) {
  const [estado, setEstado] = useState<EstadoConversacion>("inactivo");
  const [leccion, setLeccion] = useState(leccionInicial ?? null);
  /** true solo el turno en que la unidad se acaba de completar. */
  const [festejo, setFestejo] = useState(false);
  const ascensoDescartado = useAscensoDescartado(nivel);
  const [subiendo, setSubiendo] = useState(false);
  // El refresh tras subir no navega: la transición es la única señal
  // de que la página fresca (con el nivel nuevo) ya llegó.
  const [refrescandoNivel, empezarTransicion] = useTransition();
  const [mensajes, setMensajes] = useState<Mensaje[]>(historial);
  const [mensajesRestantes, setMensajesRestantes] = useState(mensajesIniciales);
  const [error, setError] = useState<string | null>(null);
  /** Lo que el alumno acaba de decir, mostrado apenas llega. */
  const [dichoAhora, setDichoAhora] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const modoTexto = useModoTexto();
  const [borrador, setBorrador] = useState("");

  /** La idea de rescate: qué podría responder el alumno. */
  const [idea, setIdea] = useState<{ en: string; es: string } | null>(null);
  const [ideaVisible, setIdeaVisible] = useState(false);
  const [ideaCargando, setIdeaCargando] = useState(false);

  const conversacionId = useRef<string | null>(idInicial);
  const velocidad = useVelocidad();
  const finRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /** Aceptar el ascenso: el mismo endpoint libre del selector. */
  async function subirDeNivel() {
    if (!sugerenciaNivel || subiendo) return;
    setSubiendo(true);
    const r = await pedir("/api/nivel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nivel: sugerenciaNivel.siguiente }),
    });
    setSubiendo(false);
    if (r?.ok) {
      // Que no reaparezca si algún día vuelve a este nivel
      descartarAscenso(nivel);
      empezarTransicion(() => router.refresh());
    }
  }

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, dichoAhora, ideaVisible]);

  /**
   * La voz vive en lib/voz.ts, que tapa los fallos reales del motor
   * del navegador (el primer audio que no sonaba solo, entre ellos).
   * La base del nivel por la preferencia del alumno: un A1 en
   * "rápida" oye 1,0 — más ágil que su base, nunca la de un C1.
   */
  function hablar(texto: string): Promise<boolean> {
    return hablarIngles(texto, nivel, velocidad);
  }

  function manejarAudio(audio: Blob, duracionSeg: number) {
    const cuerpo = new FormData();
    cuerpo.append("audio", audio);
    cuerpo.append("duracion", String(duracionSeg));
    void enviarTurno(cuerpo);
  }

  /** El turno escrito, para cuando el micrófono no da. */
  function enviarTexto() {
    const texto = borrador.trim();
    if (!texto || estado !== "inactivo" || sinMensajes) return;
    // El clic de enviar es un gesto real: desbloquea la voz para que
    // la respuesta pueda sonar sola segundos después.
    desbloquearVoz();
    setBorrador("");
    const cuerpo = new FormData();
    cuerpo.append("texto", texto);
    cuerpo.append("duracion", "0");
    // El alumno ve su mensaje de inmediato: escribirlo ya es tenerlo
    setDichoAhora(texto);
    void enviarTurno(cuerpo, true);
  }

  async function enviarTurno(cuerpo: FormData, conservarDicho = false) {
    setEstado("procesando");
    setError(null);
    if (!conservarDicho) setDichoAhora(null);
    setIdea(null);
    setIdeaVisible(false);

    try {
      if (conversacionId.current) {
        cuerpo.append("conversacion", conversacionId.current);
      }

      const respuesta = await fetch("/api/conversar", { method: "POST", body: cuerpo });

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
      let hablando: Promise<boolean> | null = null;

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
            setDichoAhora(parte.texto);
          }

          if (parte.tipo === "respuesta") {
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
            setDichoAhora(null);
            if (parte.leccion) {
              setLeccion((prev) =>
                prev && prev.clave === parte.leccion.clave
                  ? {
                      ...prev,
                      logros: parte.leccion.logros,
                      completada: parte.leccion.completada,
                    }
                  : prev
              );
              if (parte.leccion.recien) setFestejo(true);
            }
          }
        }
      }

      await hablando;
      setEstado("inactivo");
    } catch {
      setError("No pudimos conectar. Revisa tu internet e intenta de nuevo.");
      setEstado("inactivo");
    }
  }

  async function pedirIdea() {
    if (ideaVisible) {
      setIdeaVisible(false);
      return;
    }
    if (idea) {
      setIdeaVisible(true);
      return;
    }
    const ultimo = mensajes[mensajes.length - 1];
    if (!ultimo || ultimo.rol !== "allison") return;

    setIdeaCargando(true);
    try {
      const r = await pedir("/api/ayuda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: ultimo.texto, nivel }),
      });
      if (r?.ok) {
        const d = await r.json().catch(() => null);
        if (!d) return;
        setIdea({ en: d.sugerencia, es: d.sugerenciaEs });
        setIdeaVisible(true);
      }
    } finally {
      setIdeaCargando(false);
    }
  }

  const sinMensajes = mensajesRestantes === 0;
  const hayUltimoDeAllison =
    mensajes.length > 0 && mensajes[mensajes.length - 1].rol === "allison";

  const enlaceMenu =
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-superficie-2";

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col px-4">
      <Bienvenida nombre={nombre} />

      {/* ---- Identidad: Allison siempre presente ---- */}
      <header className="flex shrink-0 items-center gap-3 py-3">
        <AvatarAllison estado={estado} compacto />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-tight">Allison</p>
          <p className="flex items-center gap-1.5 text-xs text-texto-suave">
            <span
              aria-hidden
              className={`size-1.5 rounded-full ${
                estado === "inactivo" ? "bg-exito" : "bg-primario"
              }`}
              style={
                estado !== "inactivo"
                  ? { animation: "pulso-voz 1.2s ease-in-out infinite" }
                  : undefined
              }
            />
            Tu profesora de inglés · {ESTADO_LINEA[estado]}
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-expanded={menuAbierto}
            aria-label="Menú"
            className="rounded-full border border-borde bg-superficie p-2 text-texto-suave transition hover:bg-superficie-2 hover:text-texto"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>

          {menuAbierto && (
            <>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setMenuAbierto(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <nav className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-borde bg-superficie p-2 shadow-lg">
                <Link href="/recargar" className={enlaceMenu}>
                  <svg viewBox="0 0 24 24" className="size-4 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  Recargar
                </Link>
                <Link href="/temas" className={enlaceMenu}>
                  <svg viewBox="0 0 24 24" className="size-4 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.5" /></svg>
                  Temas de tu nivel
                </Link>
                <Link href="/progreso" className={enlaceMenu}>
                  <svg viewBox="0 0 24 24" className="size-4 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 15l4-4 3 3 5-6" /></svg>
                  Tu progreso
                </Link>
                <Link href="/conversaciones" className={enlaceMenu}>
                  <svg viewBox="0 0 24 24" className="size-4 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  Tus conversaciones
                </Link>
                {esCoordinador && (
                  <Link href="/colegio" className={enlaceMenu}>
                    <svg viewBox="0 0 24 24" className="size-4 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg>
                    Panel del colegio
                  </Link>
                )}
                {esAdmin && (
                  <Link href="/admin" className={enlaceMenu}>
                    <svg viewBox="0 0 24 24" className="size-4 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" /></svg>
                    Administración
                  </Link>
                )}
                <div className="my-1 border-t border-borde" />
                {/* El uso principal es desde el celular: la instalación
                    vive en el menú, siempre disponible, y no en un
                    aviso que aparece una vez y no vuelve. */}
                <BotonInstalar className={`${enlaceMenu} w-full text-left text-texto-suave`} />
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={`${enlaceMenu} w-full text-left`}
                >
                  <svg viewBox="0 0 24 24" className="size-4 text-texto-suave" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                  Cerrar sesión
                </button>
              </nav>
            </>
          )}
        </div>
      </header>

      {/* ---- Las cifras que importan, cada una lleva a su sitio ---- */}
      <div className="flex shrink-0 flex-wrap gap-2 pb-2">
        <SelectorNivel nivel={nivel} />
        <Link
          href="/temas"
          className="flex items-center gap-1 rounded-full bg-superficie-2 px-2.5 py-1 text-xs font-semibold text-texto transition hover:brightness-95"
          title="Temas de tu nivel"
        >
          <span aria-hidden>🎯</span> Temas
        </Link>
        {/* Siempre a la vista mientras no esté instalada: el uso
            principal es desde el celular, y un acceso escondido en un
            menú cerrado no es "siempre disponible". Desaparece solo
            cuando la app ya está instalada. */}
        <BotonInstalar
          texto="Instalar"
          tamanoIcono="size-3.5"
          className="flex items-center gap-1 rounded-full bg-primario-suave px-2.5 py-1 text-xs font-semibold text-primario transition hover:brightness-95"
        />
        <Link
          href="/progreso"
          className="flex items-center gap-1 rounded-full bg-superficie-2 px-2.5 py-1 text-xs font-semibold text-texto transition hover:brightness-95"
          title="Tu racha"
        >
          <span aria-hidden>🔥</span> {racha}
        </Link>
        <Link
          href="/recargar"
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:brightness-95 ${
            mensajesRestantes <= 10
              ? "bg-acento/15 text-acento"
              : "bg-superficie-2 text-texto"
          }`}
          title="Recargar"
        >
          {mensajesRestantes} {enPrueba ? "de prueba" : "disponibles"}
        </Link>
      </div>

      {/* ---- El objetivo de la lección, siempre a la vista ---- */}
      {leccion && (
        <div className="mb-2 flex shrink-0 items-center gap-2.5 rounded-xl bg-primario-suave px-3 py-2 text-sm">
          <span aria-hidden className="shrink-0 text-base">🎯</span>
          <p className="min-w-0 flex-1 truncate leading-snug">
            <span className="font-semibold">{leccion.titulo}</span>
            <span className="text-texto-suave"> · {leccion.gramatica}</span>
          </p>
          {leccion.completada ? (
            <span className="shrink-0 text-xs font-semibold text-exito">
              Completado ✓
            </span>
          ) : (
            <span
              className="shrink-0 font-mono text-xs font-semibold text-primario"
              title={`${Math.min(leccion.logros, leccion.meta)} de ${leccion.meta} logros`}
            >
              {Math.min(leccion.logros, leccion.meta)}/{leccion.meta}
            </span>
          )}
          <Link
            href="/temas"
            aria-label="Cambiar de tema"
            title="Cambiar de tema"
            className="shrink-0 rounded-full p-1 text-texto-suave transition hover:bg-superficie hover:text-texto"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </Link>
        </div>
      )}

      {/* ---- La unidad se acaba de completar: se celebra UNA vez ---- */}
      {festejo && (
        <div className="mb-2 flex shrink-0 items-center gap-2.5 rounded-xl border border-exito/30 bg-exito/10 px-3 py-2.5 text-sm">
          <span aria-hidden className="shrink-0 text-base">🎉</span>
          <p className="min-w-0 flex-1 leading-snug">
            <span className="font-semibold text-exito">¡Tema completado!</span>{" "}
            Usaste bien la estructura {leccion?.meta ?? 6} veces.
          </p>
          <Link
            href="/temas"
            className="shrink-0 rounded-full bg-exito px-3 py-1 text-xs font-semibold text-white transition hover:brightness-110"
          >
            Elegir el siguiente
          </Link>
          <button
            type="button"
            onClick={() => setFestejo(false)}
            aria-label="Cerrar el aviso"
            className="shrink-0 rounded-full p-1 text-texto-suave transition hover:bg-superficie"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ---- El ascenso se PROPONE, nunca se fuerza ---- */}
      {sugerenciaNivel && !ascensoDescartado && !festejo && (
        <div className="mb-2 flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-2 rounded-xl border border-primario/30 bg-primario/5 px-3 py-2.5 text-sm">
          <span aria-hidden className="shrink-0 text-base">🚀</span>
          <p className="min-w-0 flex-1 basis-40 leading-snug">
            <span className="font-semibold">
              ¿Pasamos al nivel {sugerenciaNivel.siguiente}?
            </span>{" "}
            {sugerenciaNivel.razon}. Tú decides — puedes volver cuando
            quieras.
          </p>
          <span className="flex shrink-0 items-center gap-2">
            {/* Altura táctil real: en el celular esto se toca con el
                dedo, y un botón de 24px se falla más de lo que se
                acierta. */}
            <button
              type="button"
              onClick={subirDeNivel}
              disabled={subiendo || refrescandoNivel}
              className="min-h-10 rounded-full bg-primario px-4 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {subiendo || refrescandoNivel
                ? "Cambiando…"
                : `Subir a ${sugerenciaNivel.siguiente}`}
            </button>
            <button
              type="button"
              onClick={() => descartarAscenso(nivel)}
              className="min-h-10 rounded-full px-3 text-xs font-semibold text-texto-suave transition hover:bg-superficie-2"
            >
              Ahora no
            </button>
          </span>
        </div>
      )}

      {faltaVerificar && <AvisoVerificar mensajes={mensajesPorVerificar} />}

      {/* ---- El chat ---- */}
      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        {mensajes.length === 0 && !dichoAhora ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <AvatarAllison estado={estado} />
            <div className="max-w-sm">
              <h1 className="text-2xl font-semibold">Hi! I&apos;m Allison</h1>
              <p className="mt-2 text-texto-suave">
                {leccion
                  ? `Toca el botón y salúdame: empezamos "${leccion.titulo}". Si te equivocas, te corrijo y seguimos.`
                  : "Toca el botón y háblame en inglés. Habla tranquilo: si te equivocas, te corrijo y seguimos."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <Transcripcion mensajes={mensajes} nivel={nivel} />

            {dichoAhora && (
              <div className="mt-4 flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primario-suave px-4 py-3 text-[15px] leading-relaxed text-texto opacity-80">
                  {dichoAhora}
                </p>
              </div>
            )}
          </>
        )}
        <div ref={finRef} />
      </div>

      {/* ---- Avisos ---- */}
      {error && (
        <p role="alert" className="mb-2 shrink-0 rounded-xl bg-error/10 p-3 text-center text-sm text-error">
          {error}
        </p>
      )}

      {sinMensajes &&
        (enPrueba && logro ? (
          <div className="mb-2 max-h-[50dvh] shrink-0 overflow-y-auto">
            <FinDePrueba logro={logro} recargaMinima={recargaMinima} />
          </div>
        ) : (
          <div className="mb-2 shrink-0 rounded-xl border border-acento/30 bg-acento/10 p-3 text-center text-sm">
            <span className="font-medium">Se te acabaron las intervenciones. </span>
            <Link href="/recargar" className="font-semibold text-acento underline">
              Recarga desde {pesos(recargaMinima)}
            </Link>
          </div>
        ))}

      {enPrueba && mensajesRestantes > 0 && mensajesRestantes <= 5 && (
        <p className="mb-2 shrink-0 rounded-xl bg-acento/10 p-2.5 text-center text-sm text-acento">
          Te quedan {mensajesRestantes} de prueba.{" "}
          <Link href="/recargar" className="font-semibold underline">
            Recarga desde {pesos(recargaMinima)}
          </Link>
        </p>
      )}

      {/* ---- La idea de rescate, sobre el dock ---- */}
      {ideaVisible && idea && (
        <div className="mb-2 flex shrink-0 items-start gap-2.5 rounded-2xl border border-primario/30 bg-primario/5 px-4 py-3">
          <span aria-hidden className="mt-0.5 text-base">💡</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug">{idea.en}</p>
            <p className="mt-0.5 text-sm text-texto-suave">{idea.es}</p>
            <p className="mt-1 text-xs text-texto-suave">
              Dilo en voz alta con el micrófono. No lo copies: dilo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIdeaVisible(false)}
            aria-label="Cerrar la sugerencia"
            className="shrink-0 rounded-full p-1 text-texto-suave transition hover:bg-superficie-2"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ---- El dock: voz por defecto; teclado para el micrófono dañado ---- */}
      {modoTexto ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviarTexto();
          }}
          className="flex shrink-0 items-center gap-2 pb-4 pt-1"
        >
          <button
            type="button"
            onClick={() => fijarModoTexto(false)}
            aria-label="Volver a hablar por voz"
            title="Volver a la voz"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-borde bg-superficie text-texto-suave transition hover:bg-superficie-2 hover:text-texto"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z" />
              <path d="M18 11a1 1 0 1 0-2 0 4 4 0 0 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.91V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.09A6 6 0 0 0 18 11Z" />
            </svg>
          </button>

          <input
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            maxLength={600}
            placeholder="Escribe en inglés…"
            aria-label="Escribe tu mensaje en inglés"
            disabled={sinMensajes || estado === "procesando" || estado === "hablando"}
            className="h-11 min-w-0 flex-1 rounded-full border border-borde bg-superficie px-4 text-[15px] outline-none transition focus:border-primario disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={
              !borrador.trim() ||
              sinMensajes ||
              estado === "procesando" ||
              estado === "hablando"
            }
            aria-label="Enviar"
            className="degradado-primario sombra-accion flex size-11 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-110 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      ) : (
      <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center pb-3 pt-1">
        <div className="flex justify-end pr-5">
          <button
            type="button"
            onClick={pedirIdea}
            disabled={ideaCargando || !hayUltimoDeAllison || estado === "grabando"}
            aria-label="No sé qué decir: dame una idea"
            aria-expanded={ideaVisible}
            title="No sé qué decir"
            className="flex size-12 flex-col items-center justify-center rounded-full border border-borde bg-superficie text-texto-suave transition hover:bg-superficie-2 hover:text-texto disabled:opacity-40"
          >
            {ideaCargando ? (
              <span className="font-mono text-sm">…</span>
            ) : (
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
              </svg>
            )}
          </button>
        </div>

        <BotonGrabar
          estado={estado}
          onIniciar={() => {
            // El toque de grabar es el gesto que desbloquea la voz:
            // sin esto, el primer audio de Allison sale mudo en iOS
            // y algunos Android.
            desbloquearVoz();
            setEstado("grabando");
          }}
          onAudioListo={manejarAudio}
          onDescartar={() => setEstado("inactivo")}
          deshabilitado={sinMensajes}
        />

        <div className="flex justify-start pl-5">
          <button
            type="button"
            onClick={() => fijarModoTexto(true)}
            aria-label="Escribir en vez de hablar"
            title="¿Micrófono dañado? Escribe"
            className="flex size-12 items-center justify-center rounded-full border border-borde bg-superficie text-texto-suave transition hover:bg-superficie-2 hover:text-texto"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
            </svg>
          </button>
        </div>
      </div>
      )}
    </main>
  );
}
