"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { sonar } from "@/lib/sonidos";
import { fijarVolumen, useVolumenGrabacion } from "@/lib/volumen";
import { estimarSegundos } from "@/lib/habla";
import { desbloquearVoz, detenerVoz, hablarEspanol, hablarIngles } from "@/lib/voz";
import { srcIlustracion } from "@/lib/ruta/ilustracion";
import type { Zona } from "@/lib/ruta/tipos";
import type { Nivel } from "@/lib/tipos";
import { Icono } from "../Iconos";

/**
 * Las piezas que comparten todas las actividades de una lección: la foto
 * de Allison con su aro, el botón de oír, la hoja de abajo con el
 * resultado y el micrófono con su teclado al lado.
 */

/** El estado del aro (plan, sección 5): nunca rojo ni "incorrecto". */
export type Aro = "pregunta" | "bien" | "pista" | "ensena";

export function AllisonAro({ aro = "pregunta", tam = 72, hablando = false }: { aro?: Aro; tam?: number; hablando?: boolean }) {
  // Escuchando (opción B del avatar): el borde verde y un anillo que crece
  // con el volumen real del micrófono del alumno.
  const volumen = useVolumenGrabacion();
  const escuchando = volumen !== null;
  return (
    <span className="relative inline-grid place-items-center self-center">
      {hablando && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primario-claro"
          style={{ animation: "pulso-voz 1.4s ease-in-out infinite" }}
        />
      )}
      {/* Hablando, la foto se mueve como alguien que conversa: vaivén afuera,
          el ritmo de las sílabas adentro (globals.css). */}
      <span className={`relative inline-grid rounded-full ${hablando ? "habla-vaiven" : ""}`}>
        <Image
          src="/allison.png"
          alt="Allison"
          width={tam}
          height={tam}
          style={{
            width: tam,
            height: tam,
            ...(escuchando ? { boxShadow: `0 0 0 ${4 + volumen * Math.round(tam / 5)}px color-mix(in srgb, var(--menta) 35%, transparent)` } : {}),
          }}
          className={`aro-allison relative rounded-full object-cover ${escuchando || aro === "bien" ? "bien" : aro === "pista" ? "pista" : ""} ${
            hablando ? "habla-ritmo" : escuchando ? "" : "respira"
          }`}
        />
      </span>
    </span>
  );
}

/**
 * Dice un texto con la voz de Allison. Con marcadores [es]/[en-US]
 * cambia de idioma solo.
 *
 * Dos cuidados: "hablando" lo apaga solo la última frase pedida (si una
 * corta a otra, la cortada no lo apaga mientras suena la nueva), y un
 * vigilante: un audio que se queda colgado con datos móviles, o una voz
 * del navegador que nunca avisa que terminó, no puede dejar al alumno
 * esperando con el micrófono apagado.
 */
export function useVoz(nivel: Nivel) {
  const [hablando, setHablando] = useState(false);
  const turno = useRef(0);
  const decir = useCallback(
    async (texto: string, opciones: { lento?: boolean; espanol?: boolean } = {}) => {
      const mio = ++turno.current;
      setHablando(true);
      try {
        const habla = opciones.espanol ? hablarEspanol(texto) : hablarIngles(texto, nivel, opciones.lento ? 0.7 : 1);
        const limite = 8000 + estimarSegundos(texto) * 2500;
        let vencio = false;
        await Promise.race([habla, new Promise((r) => setTimeout(() => ((vencio = true), r(null)), limite))]);
        if (vencio && mio === turno.current) detenerVoz();
      } finally {
        if (mio === turno.current) setHablando(false);
      }
    },
    [nivel]
  );
  useEffect(() => () => detenerVoz(), []);
  return { decir, hablando };
}

export function BotonOir({
  onClick,
  texto,
  lento = false,
  tam = "normal",
  className = "",
}: {
  onClick: () => void;
  texto?: string;
  lento?: boolean;
  tam?: "normal" | "chico" | "grande";
  className?: string;
}) {
  // Cada toque de "oír" desbloquea la voz (iOS solo deja sonar audio que
  // empezó con un gesto del alumno).
  const tocar = () => {
    desbloquearVoz();
    onClick();
  };
  if (texto) {
    return (
      <button
        type="button"
        onClick={tocar}
        className={`inline-flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-3.5 py-2 text-[13px] font-extrabold transition hover:bg-superficie-2 ${className}`}
      >
        <Icono nombre={lento ? "lento" : "play"} className="size-4" />
        {texto}
      </button>
    );
  }
  const medida = tam === "grande" ? "size-14" : tam === "chico" ? "size-9" : "size-11";
  return (
    <button
      type="button"
      onClick={tocar}
      aria-label={lento ? "Oír más despacio" : "Oír"}
      className={`grid ${medida} flex-none place-items-center rounded-full bg-primario text-white transition hover:brightness-110 active:scale-95 ${className}`}
    >
      <Icono nombre={lento ? "lento" : "play"} className={tam === "chico" ? "size-4" : "size-6"} />
    </button>
  );
}

/** La hoja de abajo con el resultado: verde al acertar, dorada con pista, azul al enseñar. */
export function Hoja({
  tono,
  titulo,
  children,
  boton,
  onBoton,
}: {
  tono: "bien" | "pista" | "ensena";
  titulo: string;
  children?: React.ReactNode;
  boton?: string;
  onBoton?: () => void;
}) {
  // El sonido de acierto, corto (se apaga en Ajustes).
  useEffect(() => {
    if (tono === "bien") sonar("acierto");
  }, [tono]);
  const colores =
    tono === "bien" ? "bg-menta-suave text-menta" : tono === "pista" ? "bg-oro-suave text-oro" : "bg-primario-suave text-primario";
  const fondoBoton = tono === "bien" ? "bg-menta" : tono === "pista" ? "bg-oro" : "bg-primario";
  return (
    <div className={`flex flex-col gap-2 rounded-3xl px-4 py-3.5 ${colores}`} role="status">
      <b className="text-lg font-black">{titulo}</b>
      {children && <div className="flex flex-col gap-2 text-sm font-semibold">{children}</div>}
      {boton && (
        <button
          type="button"
          onClick={onBoton}
          className={`mt-1 rounded-2xl px-4 py-3 text-[15px] font-extrabold text-superficie ${fondoBoton}`}
        >
          {boton}
        </button>
      )}
    </div>
  );
}

/**
 * Lo que explica Allison. Desde B1 sale en inglés sencillo y un toque en
 * «En español» lo muestra traducido: una cosa o la otra, nunca las dos
 * (Contenido B1, "Español de Allison"). Sin traducción, solo el texto.
 */
export function Explicado({ en, es, className = "" }: { en: string; es?: string; className?: string }) {
  const [espanol, setEspanol] = useState(false);
  return (
    <span className={`flex flex-col items-center gap-1 ${className}`}>
      <span lang={espanol && es ? "es" : "en"}>{espanol && es ? es : en}</span>
      {es && (
        <button
          type="button"
          onClick={() => setEspanol((v) => !v)}
          className="text-[12px] font-extrabold underline opacity-80"
        >
          {espanol ? "In English" : "En español"}
        </button>
      )}
    </span>
  );
}

/** La explicación prevista para lo que dijo el alumno, si la hay. */
export function explicacionPara<T extends { siDice: string }>(lista: T[] | undefined, dicho: string): T | undefined {
  const d = dicho.toLowerCase();
  return lista?.find((x) => d.includes(x.siDice.toLowerCase()));
}

/** Lo que entrega el micrófono o el teclado. */
export type Entrada = { audio: Blob; duracion: number; url: string } | { texto: string };

const UMBRAL_SILENCIO = 0.015;

/**
 * El micrófono (un toque empieza, otro termina) con el teclado al lado,
 * por si el micrófono falla (plan, sección 22: "Micrófono y teclado"). En
 * el computador el campo de texto está siempre a la vista, con Enter para
 * enviar y la barra espaciadora para hablar (pantalla 11).
 *
 * Mide el volumen: si no entró sonido no se envía nada (y no se cobra).
 */
export function Grabador({
  onEntrada,
  ayuda,
  ocupado = false,
  deshabilitado = false,
  soloVoz = false,
  alGrabar,
  alEmpezar,
  izquierda,
}: {
  onEntrada: (e: Entrada) => void;
  /** El texto de abajo: "Toca y di la palabra en inglés". */
  ayuda: string;
  ocupado?: boolean;
  deshabilitado?: boolean;
  /** Sin teclado (la prueba del micrófono de la primera sesión). */
  soloVoz?: boolean;
  /** Avisa el volumen mientras graba (0 a 1). */
  alGrabar?: (volumen: number | null) => void;
  /** Se llama al tocar el micrófono, antes de grabar (Responde rápido para el reloj ahí). */
  alEmpezar?: () => void;
  /** Un botón a la izquierda del micrófono (la idea en Viajes y Escenarios). */
  izquierda?: React.ReactNode;
}) {
  const [grabando, setGrabando] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);
  const inicio = useRef(0);
  const pico = useRef(0);
  const ctx = useRef<AudioContext | null>(null);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Ya se está abriendo el micrófono: un segundo toque no abre otro. */
  const arrancando = useRef(false);
  /** El componente sigue en pantalla: lo grabado después de salir no se envía. */
  const vivo = useRef(true);
  const avisar = useRef(alGrabar);
  const entregar = useRef(onEntrada);
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    avisar.current = alGrabar;
    entregar.current = onEntrada;
  });

  const limpiar = useCallback(() => {
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
    grabadora.current?.stream.getTracks().forEach((t) => t.stop());
    grabadora.current = null;
    void ctx.current?.close().catch(() => {});
    ctx.current = null;
    avisar.current?.(null);
    fijarVolumen(null);
  }, []);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      if (grabadora.current) grabadora.current.onstop = null;
      limpiar();
    };
  }, [limpiar]);

  const empezar = useCallback(async () => {
    if (arrancando.current || grabadora.current) return;
    arrancando.current = true;
    setAviso(null);
    desbloquearVoz();
    detenerVoz();
    alEmpezar?.();
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
      pico.current = 0;
      mr.ondataavailable = (e) => e.data.size > 0 && trozos.current.push(e.data);
      // Si el analizador no puede correr (contexto suspendido), no se puede
      // saber el volumen: se envía igual en vez de decir "no te oí" siempre.
      let midiendo = false;
      mr.onstop = () => {
        const duracion = Math.min(30, (Date.now() - inicio.current) / 1000);
        const audio = new Blob(trozos.current, { type: mr.mimeType || "audio/webm" });
        const volumen = pico.current;
        limpiar();
        if (!vivo.current) return;
        setGrabando(false);
        if (duracion < 0.6) {
          setAviso("Mantén el micrófono un poco más: toca, habla y vuelve a tocar.");
          return;
        }
        if (midiendo && volumen < UMBRAL_SILENCIO) {
          setAviso("No te oí. Revisa que el micrófono no esté silenciado, o usa el teclado.");
          return;
        }
        entregar.current({ audio, duracion: Math.round(duracion), url: URL.createObjectURL(audio) });
      };
      const c = new AudioContext();
      const analizador = c.createAnalyser();
      analizador.fftSize = 512;
      c.createMediaStreamSource(stream).connect(analizador);
      void c.resume().catch(() => {});
      ctx.current = c;
      const muestras = new Uint8Array(analizador.fftSize);
      grabadora.current = mr;
      inicio.current = Date.now();
      mr.start();
      setGrabando(true);
      reloj.current = setInterval(() => {
        if (c.state === "running") midiendo = true;
        analizador.getByteTimeDomainData(muestras);
        let suma = 0;
        for (const v of muestras) suma += (v - 128) ** 2;
        const nivel = Math.sqrt(suma / muestras.length) / 128;
        pico.current = Math.max(pico.current, nivel);
        const v = Math.min(1, nivel * 6);
        avisar.current?.(v);
        fijarVolumen(v);
        // Una respuesta corta no pasa de 30 segundos.
        if (Date.now() - inicio.current > 30_000 && mr.state === "recording") mr.stop();
      }, 100);
    } catch {
      stream?.getTracks().forEach((t) => t.stop());
      limpiar();
      setGrabando(false);
      setAviso("No pudimos usar el micrófono. Revisa los permisos, o usa el teclado.");
      setEscribiendo(true);
    } finally {
      arrancando.current = false;
    }
  }, [alEmpezar, limpiar]);

  const detener = () => grabadora.current?.state === "recording" && grabadora.current.stop();

  // El campo de texto está siempre montado (en el computador se ve
  // siempre): al cambiar al teclado en el celular, el foco va ahí.
  useEffect(() => {
    if (escribiendo) campo.current?.focus();
  }, [escribiendo]);

  // Computador: mantener la barra espaciadora para hablar (pantalla 11).
  useEffect(() => {
    if (soloVoz && escribiendo) return;
    const abajo = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || deshabilitado || ocupado) return;
      if ((e.target as HTMLElement)?.closest("input,textarea,button,select")) return;
      e.preventDefault();
      void empezar();
    };
    const arriba = (e: KeyboardEvent) => {
      if (e.code === "Space" && grabadora.current?.state === "recording") detener();
    };
    window.addEventListener("keydown", abajo);
    window.addEventListener("keyup", arriba);
    return () => {
      window.removeEventListener("keydown", abajo);
      window.removeEventListener("keyup", arriba);
    };
  }, [deshabilitado, empezar, escribiendo, ocupado, soloVoz]);

  function enviarTexto(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || deshabilitado || ocupado) return;
    desbloquearVoz();
    setTexto("");
    onEntrada({ texto: t });
  }

  const formulario = (
    <form
      onSubmit={enviarTexto}
      className={`w-full max-w-md items-center gap-2 ${escribiendo ? "flex" : "hidden lg:flex"}`}
    >
      {izquierda && <span className="flex-none lg:hidden">{izquierda}</span>}
      <input
        ref={campo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={deshabilitado || ocupado}
        placeholder="Escribe tu respuesta…"
        aria-label="Tu respuesta"
        maxLength={300}
        className="min-w-0 flex-1 rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
      />
      <button
        type="submit"
        disabled={deshabilitado || ocupado || !texto.trim()}
        aria-label="Enviar"
        className="grid size-12 flex-none place-items-center rounded-full bg-primario text-white disabled:opacity-40"
      >
        <Icono nombre="enviar" className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => setEscribiendo(false)}
        aria-label="Usar el micrófono"
        className="grid size-11 flex-none place-items-center rounded-full border border-borde lg:hidden"
      >
        <Icono nombre="mic" className="size-5" />
      </button>
    </form>
  );

  return (
    <div className="flex flex-col items-center gap-2 text-[13px] font-bold text-texto-suave">
      {aviso && (
        <p role="alert" className="max-w-xs text-center text-sm font-semibold text-oro">
          {aviso}
        </p>
      )}
      <div className={`grid w-full grid-cols-[1fr_auto_1fr] items-center justify-items-center ${escribiendo && !soloVoz ? "hidden lg:grid" : ""}`}>
        {izquierda ? <span className="mr-4 justify-self-end">{izquierda}</span> : <span />}
        <button
          type="button"
          onClick={grabando ? detener : empezar}
          disabled={deshabilitado || ocupado}
          aria-label={grabando ? "Terminar y enviar" : "Hablar"}
          className={`relative grid size-16 place-items-center rounded-full text-white transition disabled:opacity-40 ${
            grabando ? "bg-menta" : "bg-primario shadow-[0_0_0_6px_var(--primario-suave)] hover:brightness-110 active:scale-95"
          }`}
        >
          {grabando && (
            <span aria-hidden className="absolute inset-0 rounded-full bg-menta" style={{ animation: "onda-grabacion 1.5s ease-out infinite" }} />
          )}
          {ocupado ? (
            <span className="relative flex gap-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-white"
                  style={{ animation: "pulso-voz 1s ease-in-out infinite", animationDelay: `${i * 0.16}s` }}
                />
              ))}
            </span>
          ) : grabando ? (
            <svg viewBox="0 0 24 24" className="relative size-6" fill="currentColor" aria-hidden>
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <Icono nombre="mic" className="relative size-7" />
          )}
        </button>
        {!soloVoz ? (
          <button
            type="button"
            onClick={() => setEscribiendo(true)}
            aria-label="Escribir"
            title="Escribir"
            className="ml-4 grid size-11 place-items-center justify-self-start rounded-full border border-borde text-texto-suave lg:hidden"
          >
            <Icono nombre="teclado" className="size-5" />
          </button>
        ) : (
          <span />
        )}
      </div>
      {!soloVoz && formulario}
      <span aria-live="polite">{ocupado ? "Allison está escuchando lo que dijiste…" : grabando ? "Toca para terminar" : ayuda}</span>
      {!soloVoz && (
        <span className="hidden text-[11.5px] font-semibold lg:block">Espacio: mantener para hablar · Enter: enviar lo escrito</span>
      )}
    </div>
  );
}

/**
 * Lo que entendió el micrófono, con "¿No dijiste eso?": si entendió mal,
 * el intento no cuenta (plan, sección 5). Escrito, solo lo muestra.
 */
export function NoDijeEso({ oido, escrito, onClick }: { oido: string; escrito: boolean; onClick: () => void }) {
  return (
    <p className="text-center text-[13px] font-semibold text-texto-suave">
      {escrito ? "Escribiste" : "Oí"}: &ldquo;{oido}&rdquo;
      {!escrito && (
        <>
          {" · "}
          <button type="button" onClick={onClick} className="font-extrabold text-primario underline">
            ¿No dijiste eso?
          </button>
        </>
      )}
    </p>
  );
}

/** Mezcla una lista (las palabras de apoyo, desordenadas) de forma estable para cada frase. */
export function desordenar<T>(lista: T[], semilla: string): T[] {
  let h = 0;
  for (const c of semilla) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  // Que no quede en el orden correcto.
  if (copia.length > 1 && copia.every((x, i) => x === lista[i])) copia.push(copia.shift()!);
  return copia;
}

/** Reproduce una grabación del propio alumno ("Oír mi voz"). */
export function oirGrabacion(url: string) {
  detenerVoz();
  void new Audio(url).play().catch(() => {});
}

/**
 * Una ilustración completa, sin recortar, sobre su mismo color de fondo
 * (plan, sección 22: "en los recuadros anchos se muestran completas"):
 * detrás va la misma imagen ampliada y desenfocada.
 */
export function IlustracionCompleta({
  nombre,
  alt,
  alto = "h-48",
  nivel = "A1",
  flecha,
}: {
  nombre: string;
  alt: string;
  alto?: string;
  nivel?: Nivel;
  /** Si la foto tiene varias cosas, una flecha baja hasta este punto (la punta). */
  flecha?: Zona;
}) {
  const src = srcIlustracion(nombre, nivel);
  // Una ilustración que todavía no se ha producido (las de A2 y B1 se
  // hacen aparte): no se muestra un recuadro roto, solo se omite.
  const [falta, setFalta] = useState(false);
  // El tamaño real del dibujo: la flecha se dibuja en sus coordenadas.
  const [tam, setTam] = useState<{ w: number; h: number } | null>(null);
  if (falta) return null;
  return (
    <span className={`relative block ${alto} overflow-hidden rounded-3xl bg-superficie-2`}>
      <Image src={src} alt="" aria-hidden fill sizes="64px" className="scale-125 object-cover opacity-80 blur-2xl" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, 512px"
        className="object-contain"
        onLoad={(e) => setTam({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        onError={() => setFalta(true)}
      />
      {flecha && tam && <FlechaSobreFoto punta={flecha} ancho={tam.w} alto={tam.h} />}
    </span>
  );
}

/**
 * La flecha que señala una cosa de la foto. El SVG usa las coordenadas del
 * dibujo y "meet", igual que object-contain, así que la punta cae en el
 * mismo punto aunque la foto quede con bordes a los lados.
 */
function FlechaSobreFoto({ punta, ancho, alto }: { punta: Zona; ancho: number; alto: number }) {
  const x = (punta.x / 100) * ancho;
  const y = (punta.y / 100) * alto;
  const largo = alto * 0.17;
  const cabeza = largo * 0.48;
  const ala = largo * 0.34;
  const asta = largo * 0.13;
  const puntos = [
    [x, y],
    [x + ala, y - cabeza],
    [x + asta, y - cabeza],
    [x + asta, y - largo],
    [x - asta, y - largo],
    [x - asta, y - cabeza],
    [x - ala, y - cabeza],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <polygon
        className="flecha-foto"
        points={puntos}
        fill="#ff6b4a"
        stroke="#141c37"
        strokeWidth={largo * 0.05}
        strokeLinejoin="round"
      />
    </svg>
  );
}
