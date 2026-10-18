"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** "30 segundos", "1 minuto". */
function duracionEnTexto(segundos: number): string {
  if (segundos % 60) return `${segundos} segundos`;
  return segundos === 60 ? "1 minuto" : `${segundos / 60} minutos`;
}
/** Un silencio así de largo mientras graba: se ilumina la pregunta guía siguiente. */
const SILENCIO_MS = 3_500;
const UMBRAL_SILENCIO = 0.03;

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

  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);
  /** Milisegundos grabados antes del tramo actual (se puede pausar). */
  const antes = useRef(0);
  const desde = useRef(0);
  const ultimoSonido = useRef(0);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const transcurrido = () => antes.current + (grabadora.current?.state === "recording" ? Date.now() - desde.current : 0);

  const soltar = useCallback(() => {
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
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
    const r = await evaluar(ctx, a.paso, e);
    if (!vivo.current) return;
    if (r.sinSaldo) {
      setFase("listo");
      return onSinSaldo();
    }
    if (r.error || r.sinVoz) {
      setFase("listo");
      setAviso(r.error ?? "No te oí. Revisa el micrófono e inténtalo otra vez, o escribe.");
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

  /** Termina y envía. En pausa, lo grabado ya está sumado. */
  function terminarGrabacion() {
    const mr = grabadora.current;
    if (!mr || mr.state === "inactive") return;
    if (mr.state === "recording") antes.current += Date.now() - desde.current;
    mr.stop();
  }

  const empezar = useCallback(async () => {
    if (grabadora.current) return;
    setAviso(null);
    setGuia(null);
    desbloquearVoz();
    detenerVoz();
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (!vivo.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      trozos.current = [];
      antes.current = 0;
      mr.ondataavailable = (ev) => ev.data.size > 0 && trozos.current.push(ev.data);
      mr.onstop = () => {
        const duracion = Math.min(a.segundos, Math.round(antes.current / 1000));
        const audio = new Blob(trozos.current, { type: mr.mimeType || "audio/webm" });
        soltar();
        grabadora.current = null;
        if (!vivo.current) return;
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
      mr.start(250);
      setMs(0);
      setFase("grabando");
      reloj.current = setInterval(() => {
        if (mr.state !== "recording") return;
        analizador.getByteTimeDomainData(muestras);
        let suma = 0;
        for (const v of muestras) suma += (v - 128) ** 2;
        const nivel = Math.sqrt(suma / muestras.length) / 128;
        fijarVolumen(Math.min(1, nivel * 6));
        const ahora = Date.now();
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.guias.length, a.segundos, limite, soltar]);

  /** "Terminar": antes de 10 segundos, pausa y Allison lo anima a seguir. */
  function tocarTerminar() {
    const mr = grabadora.current;
    if (!mr) return;
    if (transcurrido() < minimoParaEnviar(a.segundos) && mr.state === "recording") {
      antes.current += Date.now() - desde.current;
      mr.pause();
      fijarVolumen(null);
      const g = ((guia ?? -1) + 1) % a.guias.length;
      setGuia(g);
      setFase("pausa");
      void decir(`Keep going! ${a.guias[g]}`);
      return;
    }
    terminarGrabacion();
  }

  function seguir() {
    const mr = grabadora.current;
    if (!mr || mr.state !== "paused") return;
    detenerVoz();
    ultimoSonido.current = Date.now();
    desde.current = Date.now();
    mr.resume();
    setFase("grabando");
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
          <Reloj fraccion={ms / limite} activo={fase === "grabando"}>
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
                  : "Toca y empieza a contar"}
            </span>
          )}

          {fase === "listo" && (
            <button
              type="button"
              onClick={() => setEscribiendo(true)}
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
    </div>
  );
}

/** El reloj de 30 segundos alrededor del micrófono. */
export function Reloj({ fraccion, activo, children }: { fraccion: number; activo: boolean; children: React.ReactNode }) {
  const r = 46;
  const largo = 2 * Math.PI * r;
  return (
    <span className="relative grid size-28 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--superficie-2)" strokeWidth="6" />
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
              Hablaste {segundosHablados} segundos
            </span>
          )}
          <span className={faltanFrases ? "text-oro" : "text-menta"}>
            {frases === 1 ? "1 frase" : `${frases} frases`} que se entienden
          </span>
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
        {!logrado && <span>Prueba con: {a.guias[0]}</span>}
        {quedan > 0 && (
          <button type="button" onClick={onOtraVez} className="self-start font-extrabold underline">
            Intentarlo una vez más
          </button>
        )}
      </Hoja>
    </div>
  );
}
