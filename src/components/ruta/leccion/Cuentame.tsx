"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COLA_GRABACION_MS, avisarMicrofonoListo } from "@/components/AnilloMicrofono";
import { fijarVolumen } from "@/lib/volumen";
import { desbloquearVoz, detenerVoz } from "@/lib/voz";
import type { Cuentame as Datos } from "@/lib/ruta/tipos";
import { Icono } from "../Iconos";
import { evaluar, type Contexto, type FinActividad, type ResultadoEvaluacion } from "./api";
import { AllisonAro, BotonOir, Explicado, Hoja, oirGrabacion, useVoz, type Entrada } from "./comun";

type Fase = "listo" | "grabando" | "pausa" | "enviando" | "resultado";

/**
 * Antes de esto, "Terminar" no envía: Allison anima con una pregunta guía.
 * 10 segundos en el Cuéntame de 30 (A2); 20 en el de un minuto (B1).
 */
const minimoParaEnviar = (segundos: number) => (segundos >= 60 ? 20_000 : 10_000);

/** "0:45", "1:00". */
export function formatoReloj(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

/** "1 frase que se entiende", "3 frases que se entienden". */
export function frasesQueSeEntienden(frases: number): string {
  return frases === 1 ? "1 frase que se entiende" : `${frases} frases que se entienden`;
}

/** "30 segundos", "1 minuto". */
function duracionEnTexto(segundos: number): string {
  if (segundos % 60) return `${segundos} segundos`;
  return segundos === 60 ? "1 minuto" : `${segundos / 60} minutos`;
}
/** Un silencio así de largo mientras graba: se ilumina la pregunta guía siguiente. */
const SILENCIO_MS = 3_500;
const UMBRAL_SILENCIO = 0.03;
/**
 * Si el volumen nunca pasó de aquí, no hubo voz (el micrófono silenciado):
 * no se envía ni se cobra. El mismo umbral del Grabador (comun.tsx).
 */
export const UMBRAL_VOZ = 0.015;
/** Lo que se dice cuando no entró voz. */
export const SIN_VOZ = "No te oí. Revisa que el micrófono no esté silenciado, o escribe.";

/**
 * Cuéntame (A2, "Actividades nuevas" de Contenido A2): habla sin
 * interrupciones hasta 30 segundos sobre un tema, con tres preguntas guía
 * en pantalla. Termina al tocar Terminar o a los 30 segundos; si para
 * antes de 10, Allison lo anima con una pregunta guía y puede seguir.
 *
 * El relato se transcribe a ciegas y Allison muestra lo que entendió, una
 * cosa que hizo bien y una sola por mejorar, con su frase y la mejor. Es
 * un acierto si habló 20 segundos o más con 3 frases que se entienden
 * (escrito: 3 frases, sin la nota de fluidez). Puede intentarlo una vez
 * más. Cada intento es una intervención, también escrito.
 */
export function Cuentame({
  a,
  ctx,
  onTerminar,
  onSinSaldo,
}: {
  a: Datos;
  ctx: Contexto;
  onTerminar: (f: FinActividad) => void;
  onSinSaldo: () => void;
}) {
  const { decir, hablando } = useVoz(ctx.nivel);
  const [fase, setFase] = useState<Fase>("listo");
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [ms, setMs] = useState(0);
  /** La pregunta guía iluminada (tras un silencio o al pausar). */
  const [guia, setGuia] = useState<number | null>(null);
  const [resultado, setResultado] = useState<(ResultadoEvaluacion & { url?: string }) | null>(null);
  const [intentos, setIntentos] = useState(0);
  const [logrado, setLogrado] = useState(false);
  const [verModelo, setVerModelo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Lo grabado que no se pudo enviar (red, IA, tiempo): se envía otra vez sin grabar de nuevo. */
  const [pendiente, setPendiente] = useState<Entrada | null>(null);

  const grabadora = useRef<MediaRecorder | null>(null);
  /** El micrófono se está abriendo: todavía no graba (el anillo se llena en azul). */
  const [preparando, setPreparando] = useState(false);
  /** Un segundo toque mientras se abre no abre otro micrófono. */
  const abriendo = useRef(false);
  const trozos = useRef<Blob[]>([]);
  /** Milisegundos grabados antes del tramo actual (se puede pausar). */
  const antes = useRef(0);
  const desde = useRef(0);
  const ultimoSonido = useRef(0);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Ya tocó "Terminar": graba un momento más (COLA_GRABACION_MS) y se envía. */
  const cola = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tocó "Terminar" antes del mínimo: graba un momento más (COLA_GRABACION_MS) y pausa. */
  const pausando = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** El volumen más alto de la grabación (sin el "tic" del principio). */
  const pico = useRef(0);
  /** Eligió escribir mientras se abría el micrófono: ya no se graba. */
  const eligioEscribir = useRef(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const vivo = useRef(true);
  const empezo = useRef(false);
  const limite = a.segundos * 1000;

  // Allison dice el tema al entrar.
  useEffect(() => {
    if (empezo.current) return;
    empezo.current = true;
    void decir(a.tema);
  }, [a.tema, decir]);

  // Lo que se graba de más al terminar o al pausar no cuenta como tiempo hablado.
  const transcurrido = () =>
    antes.current + (grabadora.current?.state === "recording" && !cola.current && !pausando.current ? Date.now() - desde.current : 0);

  const soltar = useCallback(() => {
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
    if (cola.current) clearTimeout(cola.current);
    cola.current = null;
    if (pausando.current) clearTimeout(pausando.current);
    pausando.current = null;
    grabadora.current?.stream.getTracks().forEach((t) => t.stop());
    void audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    fijarVolumen(null);
  }, []);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      if (grabadora.current) grabadora.current.onstop = null;
      soltar();
    };
  }, [soltar]);

  async function enviar(e: Entrada) {
    setFase("enviando");
    setAviso(null);
    setPendiente(null);
    const r = await evaluar(ctx, a.paso, e);
    if (!vivo.current) return;
    if (r.sinSaldo) {
      setFase("listo");
      return onSinSaldo();
    }
    // Falló el envío (red, IA, tiempo): no se cobró y lo grabado no se
    // pierde. Antes había que volver a contar todo (auditoría, 28 de
    // octubre de 2026).
    if (r.error) {
      setFase("listo");
      setPendiente(e);
      setAviso(r.error);
      return;
    }
    if (r.sinVoz) {
      setFase("listo");
      setAviso(SIN_VOZ);
      return;
    }
    // En español no cuenta como intento: se le da una frase para empezar.
    if (!r.espanol) {
      setIntentos((n) => n + 1);
      if (r.correcto) setLogrado(true);
    }
    setResultado({ ...r, url: "url" in e ? e.url : undefined });
    setFase("resultado");
    void decir(r.espanol ? "Tell me in English!" : r.correcto ? "Great story! I understood you." : "Good try!");
  }

  /** Termina y envía. En pausa (o mientras se pausa), lo grabado ya está sumado. */
  function terminarGrabacion() {
    const mr = grabadora.current;
    if (!mr || mr.state === "inactive" || cola.current) return;
    const yaSumado = mr.state !== "recording" || !!pausando.current;
    if (pausando.current) clearTimeout(pausando.current);
    pausando.current = null;
    if (mr.state !== "recording") {
      mr.stop();
      return;
    }
    if (!yaSumado) antes.current += Date.now() - desde.current;
    // Sigue grabando un momento: si el audio termina justo con la última
    // palabra, la transcripción la pierde (COLA_GRABACION_MS).
    setFase("enviando");
    fijarVolumen(null);
    cola.current = setTimeout(() => {
      cola.current = null;
      if (mr.state !== "inactive") mr.stop();
    }, COLA_GRABACION_MS);
  }

  const empezar = useCallback(async () => {
    if (grabadora.current || abriendo.current) return;
    abriendo.current = true;
    eligioEscribir.current = false;
    setPreparando(true);
    setAviso(null);
    setPendiente(null);
    setGuia(null);
    desbloquearVoz();
    detenerVoz();
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      // Se fue, o eligió escribir mientras se abría: no se graba.
      if (!vivo.current || eligioEscribir.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      trozos.current = [];
      antes.current = 0;
      pico.current = 0;
      mr.ondataavailable = (ev) => ev.data.size > 0 && trozos.current.push(ev.data);
      // Si el analizador no corre (contexto suspendido), no se sabe el
      // volumen: se envía igual, como en el Grabador.
      let midiendo = false;
      mr.onstop = () => {
        const duracion = Math.min(a.segundos, Math.round(antes.current / 1000));
        const audio = new Blob(trozos.current, { type: mr.mimeType || "audio/webm" });
        soltar();
        grabadora.current = null;
        if (!vivo.current) return;
        // Sin voz (el micrófono silenciado) no se envía: se cobraba un relato
        // en silencio (auditoría, 28 de octubre de 2026).
        if (midiendo && pico.current < UMBRAL_VOZ) {
          setFase("listo");
          setMs(0);
          setAviso(SIN_VOZ);
          return;
        }
        void enviar({ audio, duracion, url: URL.createObjectURL(audio) });
      };
      const c = new AudioContext();
      const analizador = c.createAnalyser();
      analizador.fftSize = 512;
      c.createMediaStreamSource(stream).connect(analizador);
      void c.resume().catch(() => {});
      audioCtx.current = c;
      const muestras = new Uint8Array(analizador.fftSize);

      grabadora.current = mr;
      desde.current = Date.now();
      ultimoSonido.current = Date.now();
      const inicio = Date.now();
      mr.start(250);
      setMs(0);
      setFase("grabando");
      setPreparando(false);
      avisarMicrofonoListo();
      reloj.current = setInterval(() => {
        if (c.state === "running") midiendo = true;
        // Lo que se graba de más al terminar o al pausar no mueve el volumen.
        if (mr.state !== "recording" || cola.current || pausando.current) return;
        analizador.getByteTimeDomainData(muestras);
        let suma = 0;
        for (const v of muestras) suma += (v - 128) ** 2;
        const nivel = Math.sqrt(suma / muestras.length) / 128;
        fijarVolumen(Math.min(1, nivel * 6));
        const ahora = Date.now();
        // El "tic" del principio no cuenta como voz.
        if (ahora - inicio > 250) pico.current = Math.max(pico.current, nivel);
        if (nivel > UMBRAL_SILENCIO) ultimoSonido.current = ahora;
        const t = transcurrido();
        setMs(t);
        // Se quedó callado: la pregunta guía siguiente le da de qué hablar.
        if (ahora - ultimoSonido.current > SILENCIO_MS && t > 2_000) {
          ultimoSonido.current = ahora;
          setGuia((g) => ((g ?? -1) + 1) % a.guias.length);
        }
        if (t >= limite) terminarGrabacion();
      }, 100);
    } catch {
      stream?.getTracks().forEach((t) => t.stop());
      soltar();
      grabadora.current = null;
      setAviso("No pudimos usar el micrófono. Revisa los permisos, o escribe tu relato.");
      setEscribiendo(true);
    } finally {
      abriendo.current = false;
      setPreparando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.guias.length, a.segundos, limite, soltar]);

  /** "Terminar": antes de 10 segundos, pausa y Allison lo anima a seguir. */
  function tocarTerminar() {
    const mr = grabadora.current;
    if (!mr || cola.current || pausando.current) return;
    if (transcurrido() < minimoParaEnviar(a.segundos) && mr.state === "recording") {
      antes.current += Date.now() - desde.current;
      fijarVolumen(null);
      const g = ((guia ?? -1) + 1) % a.guias.length;
      setGuia(g);
      setFase("pausa");
      // Pausa un momento después del toque, como al terminar
      // (COLA_GRABACION_MS): pausaba en el mismo toque y la última palabra
      // se cortaba. Allison habla ya en pausa, para no quedar grabada.
      pausando.current = setTimeout(() => {
        pausando.current = null;
        if (mr.state === "recording") mr.pause();
        void decir(`Keep going! ${a.guias[g]}`);
      }, COLA_GRABACION_MS);
      return;
    }
    terminarGrabacion();
  }

  function seguir() {
    const mr = grabadora.current;
    if (!mr) return;
    detenerVoz();
    // Todavía no había pausado: sigue la misma grabación.
    if (pausando.current) {
      clearTimeout(pausando.current);
      pausando.current = null;
    } else if (mr.state === "paused") mr.resume();
    else return;
    ultimoSonido.current = Date.now();
    desde.current = Date.now();
    setFase("grabando");
  }

  /** Escribir en vez de hablar: si el micrófono se está abriendo, ya no graba. */
  function elegirEscribir() {
    eligioEscribir.current = true;
    setEscribiendo(true);
  }

  function otraVez() {
    setResultado(null);
    setVerModelo(false);
    setMs(0);
    setGuia(null);
    setFase("listo");
  }

  const r = resultado;
  const frases = r?.relato?.frases ?? 0;
  const segundosHablados = r?.relato?.segundos ?? null;
  const inicio = a.modelo.match(/^[^.!?]+[.!?]/)?.[0] ?? a.modelo;
  const quedan = 2 - intentos;
  const segundos = Math.min(a.segundos, Math.floor(ms / 1000));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2 text-center">
        <AllisonAro tam={64} aro={r?.correcto ? "bien" : r ? "pista" : "pregunta"} hablando={hablando} />
        <h2 className="flex items-center gap-2 text-[21px] leading-tight font-black text-balance">
          <BotonOir tam="chico" onClick={() => void decir(a.tema)} />
          {a.tema}
        </h2>
        <p className="text-sm font-semibold text-texto-suave">
          Cuéntale a Allison hasta {duracionEnTexto(a.segundos)} sin parar. Estas preguntas te ayudan:
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {a.guias.map((g, i) => (
          <li
            key={g}
            className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-[15px] font-extrabold transition ${
              guia === i ? "bg-oro-suave text-oro" : "bg-superficie-2"
            }`}
          >
            <Icono nombre="ayuda" className="size-4 flex-none" />
            {g}
          </li>
        ))}
      </ul>

      {fase === "resultado" && r ? (
        <Resultado
          r={r}
          frases={frases}
          segundosHablados={segundosHablados}
          a={a}
          inicio={inicio}
          logrado={!!r.correcto}
          quedan={quedan}
          sugerencia={a.guias[guia ?? Math.max(0, intentos - 1) % a.guias.length]}
          verModelo={verModelo}
          onVerModelo={() => setVerModelo(true)}
          onOir={(t) => void decir(t)}
          onOtraVez={otraVez}
          onContinuar={() => onTerminar({ calificadas: 1, aciertos: logrado ? 1 : 0, fallos: [] })}
        />
      ) : escribiendo ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = texto.trim();
            if (!t || fase === "enviando") return;
            desbloquearVoz();
            void enviar({ texto: t });
          }}
          className="flex flex-col gap-2"
        >
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={fase === "enviando"}
            rows={5}
            maxLength={1200}
            placeholder={`Escribe tu relato en inglés: ${a.minimoFrases} frases o más…`}
            aria-label="Tu relato"
            className="rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEscribiendo(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-borde px-3.5 py-2 text-[13px] font-extrabold"
            >
              <Icono nombre="mic" className="size-4" />
              Hablar
            </button>
            <button
              type="submit"
              disabled={!texto.trim() || fase === "enviando"}
              className="degradado-primario ml-auto rounded-2xl px-5 py-2.5 font-extrabold text-white disabled:opacity-40"
            >
              {fase === "enviando" ? "Allison está leyendo…" : "Enviar"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-2 text-[13px] font-bold text-texto-suave">
          <Reloj fraccion={ms / limite} activo={fase === "grabando"} preparando={preparando}>
            {fase === "enviando" ? (
              <span className="relative flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-white"
                    style={{ animation: "pulso-voz 1s ease-in-out infinite", animationDelay: `${i * 0.16}s` }}
                  />
                ))}
              </span>
            ) : fase === "grabando" ? (
              <svg viewBox="0 0 24 24" className="size-7" fill="currentColor" aria-hidden>
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <Icono nombre="mic" className="size-8" />
            )}
            <button
              type="button"
              onClick={fase === "grabando" ? tocarTerminar : fase === "listo" ? () => void empezar() : undefined}
              disabled={fase === "enviando" || fase === "pausa"}
              aria-label={fase === "grabando" ? "Terminar" : "Empezar a hablar"}
              className="absolute inset-0 rounded-full"
            />
          </Reloj>
          <span className="text-lg font-black text-texto tabular-nums" aria-live="polite">
            {formatoReloj(segundos)} / {formatoReloj(a.segundos)}
          </span>

          {fase === "pausa" ? (
            <div className="flex w-full flex-col items-center gap-2">
              <p className="rounded-2xl bg-oro-suave px-4 py-2 text-center text-[15px] font-extrabold text-oro">
                Keep going! {guia !== null ? a.guias[guia] : ""}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={seguir} className="degradado-primario rounded-2xl px-5 py-2.5 font-extrabold text-white">
                  Seguir hablando
                </button>
                <button type="button" onClick={terminarGrabacion} className="rounded-2xl border border-borde px-5 py-2.5 font-extrabold text-texto">
                  Enviar así
                </button>
              </div>
            </div>
          ) : (
            <span aria-live="polite">
              {fase === "enviando"
                ? "Allison está escuchando tu relato…"
                : fase === "grabando"
                  ? "Habla sin parar. Toca para terminar."
                  : preparando
                    ? "Preparando el micrófono…"
                    : "Toca y empieza a contar"}
            </span>
          )}

          {/* Mientras se abre el micrófono no: escribir ahí dejaba grabando por detrás. */}
          {fase === "listo" && !preparando && (
            <button
              type="button"
              onClick={elegirEscribir}
              className="inline-flex items-center gap-1.5 rounded-full border border-borde px-3.5 py-2 text-[13px] font-extrabold text-texto"
            >
              <Icono nombre="teclado" className="size-4" />
              Escribir
            </button>
          )}
        </div>
      )}

      {aviso && (
        <p role="alert" className="text-center text-sm font-bold text-oro">
          {aviso}
        </p>
      )}
      {pendiente && "audio" in pendiente && fase === "listo" && !escribiendo && (
        <BotonEnviarOtraVez onClick={() => void enviar(pendiente)} />
      )}
    </div>
  );
}

/** Lo grabado no se pudo enviar (red, IA, tiempo): se envía otra vez, sin grabar de nuevo. */
export function BotonEnviarOtraVez({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        desbloquearVoz();
        onClick();
      }}
      className="degradado-primario self-center rounded-2xl px-5 py-2.5 font-extrabold text-white"
    >
      Enviar otra vez
    </button>
  );
}

/** El reloj de 30 segundos alrededor del micrófono. */
export function Reloj({
  fraccion,
  activo,
  preparando = false,
  children,
}: {
  fraccion: number;
  activo: boolean;
  /** El micrófono se está abriendo: el anillo se llena en azul (AnilloMicrofono). */
  preparando?: boolean;
  children: React.ReactNode;
}) {
  const r = 46;
  const largo = 2 * Math.PI * r;
  return (
    <span className="relative grid size-28 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--superficie-2)" strokeWidth="6" />
        {preparando ? (
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" strokeLinecap="round" pathLength={100} strokeDasharray="100" className="anillo-prepara" />
        ) : (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--menta)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={largo}
            strokeDashoffset={largo * (1 - Math.min(1, fraccion))}
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        )}
      </svg>
      <span
        className={`relative grid size-20 place-items-center rounded-full text-white ${
          activo ? "bg-menta" : "bg-primario shadow-[0_0_0_6px_var(--primario-suave)]"
        }`}
      >
        {children}
      </span>
    </span>
  );
}

/** Lo que entendió Allison, lo que salió bien y lo que puede mejorar. */
function Resultado({
  r,
  frases,
  segundosHablados,
  a,
  inicio,
  logrado,
  quedan,
  sugerencia,
  verModelo,
  onVerModelo,
  onOir,
  onOtraVez,
  onContinuar,
}: {
  r: ResultadoEvaluacion & { url?: string };
  frases: number;
  segundosHablados: number | null;
  a: Datos;
  inicio: string;
  logrado: boolean;
  quedan: number;
  /**
   * La pregunta guía para el próximo intento: la iluminada, o si no hubo,
   * una distinta en cada intento (antes siempre la primera).
   */
  sugerencia: string;
  verModelo: boolean;
  onVerModelo: () => void;
  onOir: (t: string) => void;
  onOtraVez: () => void;
  onContinuar: () => void;
}) {
  if (r.espanol) {
    return (
      <Hoja tono="pista" titulo="Así no cuenta: cuéntalo en inglés" boton="Intentar otra vez" onBoton={onOtraVez}>
        <span>Empieza así:</span>
        <span className="flex items-center gap-2 text-base font-black">
          <BotonOir tam="chico" onClick={() => onOir(inicio)} />
          {inicio}
        </span>
      </Hoja>
    );
  }
  const escrito = segundosHablados === null;
  const faltaTiempo = !escrito && segundosHablados < a.minimoSegundos;
  const faltanFrases = frases < a.minimoFrases;
  const titulo = logrado
    ? "¡Muy bien contado!"
    : escrito
      ? `Casi: escribe ${a.minimoFrases} frases o más`
      : `Casi: habla ${a.minimoSegundos} segundos o más, con ${a.minimoFrases} frases`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 rounded-3xl bg-superficie-2 px-4 py-3">
        <small className="text-[11px] font-extrabold tracking-[0.06em] text-texto-suave uppercase">Lo que entendió Allison</small>
        <p className="text-[15px] font-semibold">&ldquo;{r.transcripcion}&rdquo;</p>
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-extrabold text-texto-suave">
          {r.url && (
            <button type="button" onClick={() => oirGrabacion(r.url!)} className="inline-flex items-center gap-1 text-primario">
              <Icono nombre="play" className="size-4" />
              Oír mi voz
            </button>
          )}
          {!escrito && (
            <span className={faltaTiempo ? "text-oro" : "text-menta"}>
              Hablaste {segundosHablados} {segundosHablados === 1 ? "segundo" : "segundos"}
            </span>
          )}
          <span className={faltanFrases ? "text-oro" : "text-menta"}>{frasesQueSeEntienden(frases)}</span>
        </div>
      </div>

      {r.relato?.bien && (
        <div className="flex flex-col gap-1 rounded-3xl bg-menta-suave px-4 py-3 text-menta">
          <small className="text-[11px] font-extrabold tracking-[0.06em] uppercase">Lo que hiciste bien</small>
          <b className="text-[15px] font-black">&ldquo;{r.relato.bien.frase}&rdquo;</b>
          {r.relato.bien.porque && (
            <span className="text-sm font-semibold">
              <Explicado en={r.relato.bien.porque} es={r.relato.bien.porqueEs} className="!items-start" />
            </span>
          )}
        </div>
      )}

      {r.relato?.mejora && (
        <div className="flex flex-col gap-1 rounded-3xl bg-primario-suave px-4 py-3 text-primario">
          <small className="text-[11px] font-extrabold tracking-[0.06em] uppercase">Para mejorar</small>
          <span className="text-sm font-semibold line-through opacity-70">{r.relato.mejora.dijo}</span>
          <b className="flex items-center gap-2 text-[15px] font-black">
            <BotonOir tam="chico" onClick={() => onOir(r.relato!.mejora!.mejor)} />
            {r.relato.mejora.mejor}
          </b>
          {r.relato.mejora.porque && (
            <span className="text-sm font-semibold">
              <Explicado en={r.relato.mejora.porque} es={r.relato.mejora.porqueEs} className="!items-start" />
            </span>
          )}
        </div>
      )}

      {verModelo ? (
        <div className="flex flex-col gap-1 rounded-3xl border border-borde px-4 py-3">
          <small className="text-[11px] font-extrabold tracking-[0.06em] text-texto-suave uppercase">Así lo contaría Allison</small>
          <p className="flex items-start gap-2 text-[15px] font-semibold">
            <BotonOir tam="chico" onClick={() => onOir(a.modelo)} />
            {a.modelo}
          </p>
        </div>
      ) : (
        <button type="button" onClick={onVerModelo} className="self-center text-sm font-extrabold text-primario">
          Ver cómo lo contaría Allison
        </button>
      )}

      <Hoja tono={logrado ? "bien" : "pista"} titulo={titulo} boton="Continuar" onBoton={onContinuar}>
        {!logrado && <span>Prueba con: {sugerencia}</span>}
        {quedan > 0 && (
          <button type="button" onClick={onOtraVez} className="self-start font-extrabold underline">
            Intentarlo una vez más
          </button>
        )}
      </Hoja>
    </div>
  );
}
