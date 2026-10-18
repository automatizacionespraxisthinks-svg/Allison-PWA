"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { preguntaDeEjemplo } from "@/lib/ruta/adivina";
import { encuadreZona, escalaZona, srcIlustracion } from "@/lib/ruta/ilustracion";
import type { Adivina as Datos, Zona } from "@/lib/ruta/tipos";
import type { Nivel } from "@/lib/tipos";
import { Icono } from "../Iconos";
import { iniciarEscena, turnoEscena, type EstadoEscena } from "../escenaApi";
import type { Contexto, FinActividad } from "./api";
import { AllisonAro, BotonOir, Grabador, Hoja, oirGrabacion, useVoz, type Entrada } from "./comun";

type Juego = NonNullable<EstadoEscena["adivina"]>;

/**
 * Adivina (A2, "Actividades nuevas" de Contenido A2): seis tarjetas con
 * dibujo; el alumno hace preguntas de sí o no hasta descubrir en qué
 * piensa Allison. Allison contesta con la tabla aprobada (el servidor
 * nunca le dice al navegador cuál es) y las tarjetas que ya no pueden ser
 * se apagan solas. Dos intentos seguidos que no sirven iluminan la ayuda
 * con una pregunta de ejemplo. Dos rondas seguidas; cada pregunta
 * entendida al primer intento es un acierto.
 */
export function Adivina({
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
  const [conversacion, setConversacion] = useState<string | null>(null);
  const [juego, setJuego] = useState<Juego | null>(null);
  const [ultimo, setUltimo] = useState<{ yo: string; url?: string; allison: string } | null>(null);
  /** Lo que acaba de adivinar, mientras se celebra antes de la ronda siguiente. */
  const [celebra, setCelebra] = useState<string | null>(null);
  const [fin, setFin] = useState<"gano" | "cerrada" | null>(null);
  /** Las veces que tocó "Ayuda" por su cuenta (bajan los aciertos). */
  const [ayudasBoton, setAyudasBoton] = useState(0);
  const [verAyuda, setVerAyuda] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [sinAbrir, setSinAbrir] = useState(false);
  const empezo = useRef(false);

  const abrir = useCallback(async () => {
    setSinAbrir(false);
    setMensaje(null);
    const r = await iniciarEscena({ parada: ctx.parada, actividad: "adivina", leccion: ctx.leccion, paso: a.paso });
    if ("error" in r || !r.estado?.adivina) {
      setSinAbrir(true);
      setMensaje("No pudimos abrir el juego. Revisa tu conexión.");
      return;
    }
    setConversacion(r.conversacionId);
    setJuego(r.estado.adivina);
    void decir(r.apertura);
  }, [a.paso, ctx.leccion, ctx.parada, decir]);

  useEffect(() => {
    if (empezo.current) return;
    empezo.current = true;
    void abrir();
  }, [abrir]);

  async function responder(e: Entrada) {
    if (!conversacion) return;
    setMensaje(null);
    setVerAyuda(false);
    setOcupado(true);
    const r = await turnoEscena(conversacion, e);
    setOcupado(false);
    if (r.sinSaldo) return onSinSaldo();
    if (r.error) return setMensaje(r.error);
    if (r.sinVoz) {
      setMensaje("No te oí. Inténtalo otra vez.");
      void decir(r.respuestaVoz);
      return;
    }
    const nuevo = r.estado.adivina ?? null;
    setJuego(nuevo);
    setUltimo({ yo: r.transcripcion, url: "url" in e ? e.url : undefined, allison: r.respuesta });
    // La tarjeta adivinada queda resaltada (también en la última ronda).
    if (r.nuevas.length && nuevo) setCelebra(nuevo.ganadas.at(-1) ?? null);
    if (r.metaCumplida) setFin("gano");
    else if (r.cerrada) setFin("cerrada");
    void decir(r.respuestaVoz);
  }

  const total = a.rondas.length;
  const ronda = Math.min(juego?.ronda ?? 0, total - 1);
  const descartadas = celebra ? a.opciones.map((o) => o.nombre).filter((n) => n !== celebra) : (juego?.descartadas ?? []);
  const iluminada = (juego?.fallosSeguidos ?? 0) >= 2;
  const ejemplo = juego ? preguntaDeEjemplo(a, juego.descartadas, juego.preguntadas) : "";

  function terminar() {
    const calificadas = Math.max(1, juego?.calificadas ?? 0);
    onTerminar({ calificadas, aciertos: Math.max(0, Math.min(calificadas, (juego?.aciertos ?? 0) - ayudasBoton)), fallos: [] });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <h2 className="text-[21px] font-black">Guess!</h2>
        <p className="text-sm font-semibold text-texto-suave">Hazle preguntas de sí o no y adivina en qué piensa Allison</p>
      </div>

      <div className="flex items-center justify-center gap-2.5 text-[13px] font-extrabold text-texto-suave">
        <span className="flex gap-1.5">
          {a.rondas.map((_, i) => (
            <i
              key={i}
              className={`size-2.5 rounded-full ${i < (juego?.ganadas.length ?? 0) ? "bg-menta" : i === ronda ? "bg-primario" : "bg-borde"}`}
            />
          ))}
        </span>
        Ronda {ronda + 1} de {total}
      </div>

      <ul className="grid grid-cols-3 gap-2" aria-label="Las tarjetas">
        {a.opciones.map((o) => (
          <Tarjeta key={o.nombre} nombre={o.nombre} imagen={o.imagen} zona={o.zona} nivel={ctx.nivel} apagada={descartadas.includes(o.nombre)} ganadora={celebra === o.nombre} />
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        {ultimo && (
          <button
            type="button"
            onClick={() => (ultimo.url ? oirGrabacion(ultimo.url) : undefined)}
            className="flex items-center gap-2 self-end rounded-[18px_18px_4px_18px] bg-primario px-4 py-2 text-left font-extrabold text-white"
          >
            {ultimo.url && <Icono nombre="play" className="size-4" />}
            {ultimo.yo}
          </button>
        )}
        <div className="flex items-end gap-2.5">
          <AllisonAro tam={44} aro={fin === "gano" || celebra ? "bien" : "pregunta"} hablando={hablando} />
          <div className="min-w-0 rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2 font-extrabold">{ultimo?.allison ?? a.apertura}</div>
        </div>
      </div>

      {!fin && !celebra && juego && (
        verAyuda || iluminada ? (
          <p
            className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center text-[17px] font-black ${
              iluminada && !verAyuda ? "bg-oro-suave text-oro" : "text-primario"
            }`}
          >
            <BotonOir tam="chico" onClick={() => void decir(ejemplo)} />
            {ejemplo}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setVerAyuda(true);
              setAyudasBoton((n) => n + 1);
            }}
            className="inline-flex items-center gap-1.5 self-center rounded-full border border-borde px-3.5 py-2 text-[13px] font-extrabold"
          >
            <Icono nombre="ayuda" className="size-4" />
            Ayuda
          </button>
        )
      )}

      {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}
      {sinAbrir && (
        <button type="button" onClick={() => void abrir()} className="self-center rounded-full border border-borde px-4 py-2 text-sm font-extrabold">
          Intentar de nuevo
        </button>
      )}

      {fin === "gano" ? (
        <Hoja tono="bien" titulo={total > 1 ? `¡Adivinaste las ${total}!` : "¡Adivinaste!"} boton="Continuar" onBoton={terminar} />
      ) : fin === "cerrada" ? (
        <Hoja tono="pista" titulo="¡Buen intento!" boton="Continuar" onBoton={terminar}>
          <span>Allison te dijo la respuesta. La próxima vez, pregunta primero lo que parte las tarjetas en dos.</span>
        </Hoja>
      ) : celebra ? (
        <Hoja tono="bien" titulo={`¡Adivinaste! Era ${celebra}.`} boton="Siguiente ronda" onBoton={() => setCelebra(null)}>
          <span>Allison ya piensa en otra tarjeta.</span>
        </Hoja>
      ) : (
        <Grabador onEntrada={responder} ocupado={ocupado} deshabilitado={!conversacion} ayuda="Toca y hazle una pregunta de sí o no" />
      )}
    </div>
  );
}

/** Una tarjeta: su dibujo (o la parte de la zona) y su nombre. Si el dibujo todavía no existe, solo el nombre. */
function Tarjeta({
  nombre,
  imagen,
  zona,
  nivel,
  apagada,
  ganadora,
}: {
  nombre: string;
  imagen: string;
  zona?: Zona;
  nivel: Nivel;
  apagada: boolean;
  ganadora: boolean;
}) {
  const [sinImagen, setSinImagen] = useState(false);
  const dibujo = (
    <Image
      src={srcIlustracion(imagen, nivel)}
      alt=""
      fill
      sizes={zona ? `(max-width: 640px) ${Math.round(33 * escalaZona(zona))}vw, ${Math.round(170 * escalaZona(zona))}px` : "(max-width: 640px) 33vw, 170px"}
      className="object-cover"
      onError={() => setSinImagen(true)}
    />
  );
  return (
    <li
      aria-label={apagada ? `${nombre} (descartada)` : nombre}
      className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-superficie transition ${
        ganadora ? "border-menta shadow-[0_0_0_4px_var(--menta-suave)]" : "border-borde"
      } ${apagada ? "opacity-35 grayscale" : ""}`}
    >
      <span className="relative block aspect-square overflow-hidden bg-superficie-2">
        {sinImagen ? (
          <span className="grid h-full place-items-center text-3xl font-black text-texto-suave uppercase" aria-hidden>
            {nombre.slice(0, 1)}
          </span>
        ) : zona ? (
          <span className="absolute" style={encuadreZona(zona)}>
            {dibujo}
          </span>
        ) : (
          dibujo
        )}
        {apagada && (
          <span className="absolute inset-0 grid place-items-center" aria-hidden>
            <Icono nombre="cerrar" className="size-10 stroke-[3] text-texto" />
          </span>
        )}
      </span>
      <b className={`px-1 py-1.5 text-center text-[13px] leading-tight font-extrabold ${apagada ? "line-through" : ""}`}>{nombre}</b>
    </li>
  );
}
