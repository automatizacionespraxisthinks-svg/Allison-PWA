"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { COLA_GRABACION_MS, avisarMicrofonoListo } from "@/components/AnilloMicrofono";
import { fijarVolumen } from "@/lib/volumen";
import { desbloquearVoz, detenerVoz } from "@/lib/voz";
import { srcIlustracion } from "@/lib/ruta/ilustracion";
import type { Narra as Datos, Explicacion } from "@/lib/ruta/tipos";
import type { Nivel } from "@/lib/tipos";
import { Icono } from "../Iconos";
import { evaluar, type Contexto, type FinActividad, type ResultadoEvaluacion } from "./api";
import { AllisonAro, BotonOir, Explicado, Grabador, Hoja, explicacionPara, oirGrabacion, useVoz, type Entrada } from "./comun";
import { BotonEnviarOtraVez, Reloj, SIN_VOZ, UMBRAL_VOZ, formatoReloj, frasesQueSeEntienden } from "./Cuentame";

type Fase = "listo" | "grabando" | "pausa" | "enviando" | "resultado";

/** Antes de esto, "Terminar" no envía: Allison anima a seguir con el dibujo que sigue. */
const MINIMO_PARA_ENVIAR = 20_000;

/**
 * Lo que pregunta Allison cuando falta un dibujo: la del documento ("Si
 * cuenta menos de 3 dibujos: 'And then what will happen?'"), o la de
 * siempre. Si falta el primero, "next" no tiene sentido: "What happened
 * next?" pasa a "What happened first?", y las otras preguntan por el
 * comienzo (auditoría, 28 de octubre de 2026).
 */
export function preguntaDelFaltante(siRespondeMal: string, faltante: number | null = null): string {
  const pregunta = /menos de 3 dibujos[^"“]*["“]([^"”]+)["”]/i.exec(siRespondeMal)?.[1]?.trim() ?? "What happened next?";
  if (faltante !== 1) return pregunta;
  return /\bnext\b/i.test(pregunta) ? pregunta.replace(/\bnext\b/i, "first") : "How does the story start?";
}

/**
 * La explicación prevista de la frase que se corrige, si la hay: lo que
 * corrige contiene el error previsto, o es un pedazo de él. Antes se
 * buscaba en todo lo dicho y salía debajo de otra corrección (auditoría,
 * 28 de octubre de 2026).
 */
function previstaDe(lista: Explicacion[] | undefined, dijo: string): Explicacion | undefined {
  const pedazo = dijo.trim().split(/\s+/).length >= 3;
  return explicacionPara(lista, dijo) ?? (pedazo ? lista?.find((x) => explicacionPara([{ siDice: dijo }], x.siDice)) : undefined);
}

/**
 * Narra la secuencia (B1, "Actividades nuevas" de Contenido B1): cuenta la
 * historia de cuatro dibujos en orden, con la gramática de la parada y
 * las palabras de "Debajo" para ordenar. Termina al tocar Terminar o al
 * minuto; si para antes de 20 segundos, Allison lo anima a seguir.
 *
 * Se transcribe a ciegas; después el modelo dice qué dibujos contó. Es un
 * acierto si contó al menos 3 de los 4 en orden (escrito: además, 4
 * frases). Allison repite bien una sola frase que falló y el alumno la
 * dice; si falta un dibujo, lo señala. La ayuda muestra el verbo de cada
 * dibujo y apaga una estrella. Cada intento es una intervención, también
 * escrito; puede intentarlo una vez más.
 */
export function Narra({
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
  const [resultado, setResultado] = useState<(ResultadoEvaluacion & { url?: string }) | null>(null);
  const [intentos, setIntentos] = useState(0);
  const [logrado, setLogrado] = useState(false);
  /** Vio los verbos de cada dibujo: apaga una estrella. */
  const [conAyuda, setConAyuda] = useState(false);
  const [verModelo, setVerModelo] = useState(false);
  /** La frase mejor, dicha por el alumno: su grabación, para oírse y compararla con la de Allison. */
  const [repetida, setRepetida] = useState<Entrada | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Lo grabado que no se pudo enviar (red, IA, tiempo): se envía otra vez sin grabar de nuevo. */
  const [pendiente, setPendiente] = useState<Entrada | null>(null);

  const grabadora = useRef<MediaRecorder | null>(null);
  /** El micrófono se está abriendo: todavía no graba (el anillo se llena en azul). */
  const [preparando, setPreparando] = useState(false);
  /** Un segundo toque mientras se abre no abre otro micrófono. */
  const abriendo = useRef(false);
  const trozos = useRef<Blob[]>([]);
  const antes = useRef(0);
  const desde = useRef(0);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Allison pide la historia al entrar.
  useEffect(() => {
    if (empezo.current) return;
    empezo.current = true;
    void decir(a.pregunta);
  }, [a.pregunta, decir]);

  // Lo que se graba de más al terminar o al pausar no cuenta como tiempo.
  const transcurrido = () =>
    antes.current + (grabadora.current?.state === "recording" && !cola.current && !pausando.current ? Date.now() - desde.current : 0);

  const soltar = useCallback(() => {
    if (intervalo.current) clearInterval(intervalo.current);
    intervalo.current = null;
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
    // pierde (auditoría, 28 de octubre de 2026).
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
    if (!r.espanol) {
      setIntentos((n) => n + 1);
      if (r.correcto) setLogrado(true);
    }
    setRepetida(null);
    setResultado({ ...r, url: "url" in e ? e.url : undefined });
    setFase("resultado");
    const faltante = r.relato?.faltante ?? null;
    void decir(
      r.espanol
        ? "Tell me the story in English!"
        : r.correcto
          ? faltante
            ? `Great story! ${preguntaDelFaltante(a.siRespondeMal, faltante)}`
            : "Great story!"
          : preguntaDelFaltante(a.siRespondeMal, faltante)
    );
  }

  function terminarGrabacion() {
    const mr = grabadora.current;
    if (!mr || mr.state === "inactive" || cola.current) return;
    // En pausa (o mientras se pausa), lo grabado ya está sumado.
    const yaSumado = mr.state !== "recording" || !!pausando.current;
    if (pausando.current) clearTimeout(pausando.current);
    pausando.current = null;
    // En pausa no hay cola que agregar.
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
        // Sin voz (el micrófono silenciado) no se envía ni se cobra.
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
      const inicio = Date.now();
      mr.start(250);
      setMs(0);
      setFase("grabando");
      setPreparando(false);
      avisarMicrofonoListo();
      intervalo.current = setInterval(() => {
        if (c.state === "running") midiendo = true;
        // Lo que se graba de más al terminar o al pausar no mueve el volumen.
        if (mr.state !== "recording" || cola.current || pausando.current) return;
        analizador.getByteTimeDomainData(muestras);
        let suma = 0;
        for (const v of muestras) suma += (v - 128) ** 2;
        const nivel = Math.sqrt(suma / muestras.length) / 128;
        fijarVolumen(Math.min(1, nivel * 6));
        // El "tic" del principio no cuenta como voz.
        if (Date.now() - inicio > 250) pico.current = Math.max(pico.current, nivel);
        const t = transcurrido();
        setMs(t);
        if (t >= limite) terminarGrabacion();
      }, 100);
    } catch {
      stream?.getTracks().forEach((t) => t.stop());
      soltar();
      grabadora.current = null;
      setAviso("No pudimos usar el micrófono. Revisa los permisos, o escribe tu historia.");
      setEscribiendo(true);
    } finally {
      abriendo.current = false;
      setPreparando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.segundos, limite, soltar]);

  /** "Terminar": antes de 20 segundos, pausa y Allison lo anima a seguir. */
  function tocarTerminar() {
    const mr = grabadora.current;
    if (!mr || cola.current || pausando.current) return;
    if (transcurrido() < MINIMO_PARA_ENVIAR && mr.state === "recording") {
      antes.current += Date.now() - desde.current;
      fijarVolumen(null);
      setFase("pausa");
      // Pausa un momento después del toque, como al terminar
      // (COLA_GRABACION_MS): pausaba en el mismo toque y la última palabra
      // se cortaba. Allison habla ya en pausa, para no quedar grabada.
      pausando.current = setTimeout(() => {
        pausando.current = null;
        if (mr.state === "recording") mr.pause();
        void decir("Keep going! What happened next?");
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
    setRepetida(null);
    setMs(0);
    setFase("listo");
  }

  const r = resultado;
  const contados = r?.relato?.dibujos ?? [];
  const faltante = r && !r.espanol ? (r.relato?.faltante ?? null) : null;
  const quedan = 2 - intentos;
  const segundos = Math.min(a.segundos, Math.floor(ms / 1000));
  const mejora = r?.relato?.mejora;
  const prevista = mejora ? previstaDe(a.explicaciones, mejora.dijo) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2 text-center">
        <AllisonAro tam={60} aro={r?.correcto ? "bien" : r ? "pista" : "pregunta"} hablando={hablando} />
        <h2 className="flex items-center gap-2 text-[21px] leading-tight font-black text-balance">
          <BotonOir tam="chico" onClick={() => void decir(a.pregunta)} />
          {a.pregunta}
        </h2>
        <p className="text-sm font-semibold text-texto-suave">Cuenta la historia de los cuatro dibujos, en orden.</p>
      </div>

      <ol className="grid grid-cols-2 gap-2" aria-label="Los cuatro dibujos, en orden">
        {a.imagenes.map((img, i) => (
          <Vineta
            key={img}
            imagen={img}
            numero={i + 1}
            descripcion={a.dibujos[i] ?? ""}
            nivel={ctx.nivel}
            verbo={conAyuda ? a.verbos[i] : undefined}
            estado={contados.includes(i + 1) ? "contado" : faltante === i + 1 ? "falta" : ""}
          />
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {a.debajo.map((w) => (
          <span key={w} className="rounded-xl bg-superficie-2 px-3 py-1 text-[15px] font-extrabold">
            {w}
          </span>
        ))}
        {!conAyuda && fase !== "resultado" && (
          <button
            type="button"
            onClick={() => setConAyuda(true)}
            className="inline-flex items-center gap-1 rounded-full border border-borde px-3 py-1 text-[13px] font-extrabold text-texto-suave"
          >
            <Icono nombre="ayuda" className="size-4" />
            Ayuda
          </button>
        )}
      </div>
      {conAyuda && fase !== "resultado" && (
        <p className="text-center text-[12.5px] font-bold text-oro">Debajo de cada dibujo está su verbo. Usar la ayuda apaga una estrella.</p>
      )}

      {fase === "resultado" && r ? (
        <Resultado
          r={r}
          a={a}
          contados={contados.length}
          faltante={faltante}
          logrado={logrado}
          quedan={quedan}
          prevista={prevista}
          verModelo={verModelo}
          repetida={repetida}
          onRepetida={setRepetida}
          onVerModelo={() => setVerModelo(true)}
          onOir={(t) => void decir(t)}
          onOtraVez={otraVez}
          onContinuar={() => onTerminar({ calificadas: 1, aciertos: logrado && !conAyuda ? 1 : 0, fallos: [] })}
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
            placeholder={`Escribe la historia en inglés: ${a.minimoFrases} frases o más…`}
            aria-label="Tu historia"
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
              aria-label={fase === "grabando" ? "Terminar" : "Empezar a contar"}
              className="absolute inset-0 rounded-full"
            />
          </Reloj>
          <span className="text-lg font-black text-texto tabular-nums" aria-live="polite">
            {formatoReloj(segundos)} / {formatoReloj(a.segundos)}
          </span>

          {fase === "pausa" ? (
            <div className="flex w-full flex-col items-center gap-2">
              <p className="rounded-2xl bg-oro-suave px-4 py-2 text-center text-[15px] font-extrabold text-oro">Keep going! What happened next?</p>
              <div className="flex gap-2">
                <button type="button" onClick={seguir} className="degradado-primario rounded-2xl px-5 py-2.5 font-extrabold text-white">
                  Seguir contando
                </button>
                <button type="button" onClick={terminarGrabacion} className="rounded-2xl border border-borde px-5 py-2.5 font-extrabold text-texto">
                  Enviar así
                </button>
              </div>
            </div>
          ) : (
            <span aria-live="polite">
              {fase === "enviando"
                ? "Allison está escuchando tu historia…"
                : fase === "grabando"
                  ? "Cuenta los cuatro dibujos. Toca para terminar."
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

/** Un dibujo de la secuencia con su número; al terminar, verde si lo contó y dorado el que faltó. */
function Vineta({
  imagen,
  numero,
  descripcion,
  nivel,
  verbo,
  estado,
}: {
  imagen: string;
  numero: number;
  descripcion: string;
  nivel: Nivel;
  verbo?: string;
  estado: "contado" | "falta" | "";
}) {
  const [sinImagen, setSinImagen] = useState(false);
  const borde = estado === "contado" ? "border-menta" : estado === "falta" ? "border-oro" : "border-transparent";
  return (
    <li className="flex min-w-0 flex-col gap-1">
      <span className={`relative block aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-superficie-2 ${borde}`}>
        {sinImagen ? (
          <span className="grid h-full place-items-center px-2 text-center text-[12px] leading-tight font-extrabold text-texto-suave">
            {descripcion}
          </span>
        ) : (
          <Image
            src={srcIlustracion(imagen, nivel)}
            alt={descripcion}
            fill
            sizes="(max-width: 640px) 50vw, 250px"
            className="object-cover"
            onError={() => setSinImagen(true)}
          />
        )}
        <span
          className={`absolute top-1.5 left-1.5 grid size-7 place-items-center rounded-full text-[13px] font-black text-white ${
            estado === "contado" ? "bg-menta" : estado === "falta" ? "bg-oro" : "bg-primario"
          }`}
        >
          {estado === "contado" ? <Icono nombre="check" className="size-4 stroke-[3]" /> : numero}
        </span>
      </span>
      {verbo && <b className="text-center text-[14px] font-black text-oro">{verbo}</b>}
    </li>
  );
}

/** Lo que entendió Allison, los dibujos que contó, la frase que repite bien y lo que sigue. */
function Resultado({
  r,
  a,
  contados,
  faltante,
  logrado,
  quedan,
  prevista,
  verModelo,
  repetida,
  onRepetida,
  onVerModelo,
  onOir,
  onOtraVez,
  onContinuar,
}: {
  r: ResultadoEvaluacion & { url?: string };
  a: Datos;
  contados: number;
  faltante: number | null;
  logrado: boolean;
  quedan: number;
  prevista?: { siDice: string; explicacion: string; es?: string };
  verModelo: boolean;
  repetida: Entrada | null;
  onRepetida: (e: Entrada) => void;
  onVerModelo: () => void;
  onOir: (t: string) => void;
  onOtraVez: () => void;
  onContinuar: () => void;
}) {
  if (r.espanol) {
    const inicio = a.modelo.match(/^[^.!?]+[.!?]/)?.[0] ?? a.modelo;
    return (
      <Hoja tono="pista" titulo="Así no cuenta: cuéntala en inglés" boton="Intentar otra vez" onBoton={onOtraVez}>
        <span>Empieza así:</span>
        <span className="flex items-center gap-2 text-base font-black">
          <BotonOir tam="chico" onClick={() => onOir(inicio)} />
          {inicio}
        </span>
      </Hoja>
    );
  }
  const mejora = r.relato?.mejora;
  const escrito = r.relato?.segundos === null;
  const frases = r.relato?.frases ?? 0;
  const enOrden = r.relato?.enOrden ?? contados;
  const faltanFrases = escrito && frases < a.minimoFrases;
  // El motivo de verdad: escrito, con los dibujos en orden pero pocas
  // frases, decía "cuenta al menos 3 de los 4 dibujos" (auditoría, 28 de
  // octubre de 2026).
  const titulo = logrado
    ? "¡Muy bien contado!"
    : enOrden >= a.minimoDibujos && faltanFrases
      ? `Casi: escribe ${a.minimoFrases} frases o más`
      : `Casi: cuenta al menos ${a.minimoDibujos} de los 4 dibujos, en orden`;
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
          <span className={enOrden >= a.minimoDibujos ? "text-menta" : "text-oro"}>
            Contaste {contados} de {a.imagenes.length} dibujos{enOrden < contados ? ` (${enOrden} en orden)` : ""}
          </span>
          {escrito && <span className={faltanFrases ? "text-oro" : "text-menta"}>{frasesQueSeEntienden(frases)}</span>}
        </div>
      </div>

      {faltante && (
        <p className="flex items-center gap-2 rounded-3xl bg-oro-suave px-4 py-3 text-[15px] font-extrabold text-oro">
          <BotonOir tam="chico" onClick={() => onOir(preguntaDelFaltante(a.siRespondeMal, faltante))} className="!bg-oro" />
          Dibujo {faltante}: {preguntaDelFaltante(a.siRespondeMal, faltante)}
        </p>
      )}

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

      {mejora && (
        <div className="flex flex-col gap-1.5 rounded-3xl bg-primario-suave px-4 py-3 text-primario">
          <small className="text-[11px] font-extrabold tracking-[0.06em] uppercase">Allison lo dice así</small>
          <span className="text-sm font-semibold line-through opacity-70">{mejora.dijo}</span>
          <b className="flex items-center gap-2 text-[15px] font-black">
            <BotonOir tam="chico" onClick={() => onOir(mejora.mejor)} />
            {mejora.mejor}
          </b>
          {(prevista || mejora.porque) && (
            <span className="text-sm font-semibold">
              {prevista ? (
                <Explicado en={prevista.explicacion} es={prevista.es} className="!items-start" />
              ) : (
                <Explicado en={mejora.porque} es={mejora.porqueEs} className="!items-start" />
              )}
            </span>
          )}
          {/* Lo que dijo no se comprueba (no pasa por la IA): no se afirma que
              estuvo bien, se compara de oído. Antes decía "¡Bien! Así se dice."
              con cualquier cosa (auditoría, 28 de octubre de 2026). */}
          {repetida ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-extrabold text-menta">
              <Icono nombre="check" className="size-4 stroke-[3]" />
              {"url" in repetida ? "Listo. Oye tu voz y compárala con la de Allison." : "Listo. Compárala con la de Allison."}
              {"url" in repetida && (
                <button type="button" onClick={() => oirGrabacion(repetida.url)} className="inline-flex items-center gap-1 text-primario">
                  <Icono nombre="play" className="size-4" />
                  Oír mi voz
                </button>
              )}
            </span>
          ) : (
            <div className="mt-1">
              <Grabador onEntrada={onRepetida} ayuda="Dila tú: toca y repite la frase" />
            </div>
          )}
        </div>
      )}

      {verModelo ? (
        <div className="flex flex-col gap-1 rounded-3xl border border-borde px-4 py-3">
          <small className="text-[11px] font-extrabold tracking-[0.06em] text-texto-suave uppercase">Así la contaría Allison</small>
          <p className="flex items-start gap-2 text-[15px] font-semibold">
            <BotonOir tam="chico" onClick={() => onOir(a.modelo)} />
            {a.modelo}
          </p>
        </div>
      ) : (
        <button type="button" onClick={onVerModelo} className="self-center text-sm font-extrabold text-primario">
          Ver cómo la contaría Allison
        </button>
      )}

      <Hoja tono={logrado ? "bien" : "pista"} titulo={titulo} boton="Continuar" onBoton={onContinuar}>
        {quedan > 0 && !logrado && (
          <button type="button" onClick={onOtraVez} className="self-start font-extrabold underline">
            Intentarlo una vez más
          </button>
        )}
      </Hoja>
    </div>
  );
}
