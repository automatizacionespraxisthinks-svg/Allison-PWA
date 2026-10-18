"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Ensenale as Datos } from "@/lib/ruta/tipos";
import { Icono } from "../Iconos";
import { iniciarEscena, turnoEscena } from "../escenaApi";
import type { Contexto, FinActividad } from "./api";
import { AllisonAro, BotonOir, Grabador, Hoja, IlustracionCompleta, oirGrabacion, useVoz, type Entrada } from "./comun";

/**
 * Enséñale a Allison (B1, "Actividades nuevas" de Contenido B1): el
 * alumno le explica a Allison algo de Colombia que ella no conoce. Es la
 * Entrevista al revés: pregunta Allison, con su lista fija de cuatro
 * preguntas, y reacciona corto ("Wow, that sounds amazing!"). Nunca afirma
 * datos del tema: lo que dice sale de la actividad aprobada.
 *
 * Si responde con una o dos palabras, Allison pide más ("Tell me more!");
 * en español, la pide en inglés con la pregunta más simple. Termina
 * después de las cuatro preguntas; es un acierto responder al menos tres
 * con frases que se entienden. Cada respuesta es una intervención,
 * también escrita.
 */
export function Ensenale({
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
  const [apertura, setApertura] = useState<string>("");
  const [respondidas, setRespondidas] = useState<number[]>([]);
  const [actual, setActual] = useState(0);
  const [ultimo, setUltimo] = useState<{ yo: string; url?: string; allison: string } | null>(null);
  const [fin, setFin] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [sinAbrir, setSinAbrir] = useState(false);
  const empezo = useRef(false);

  const abrir = useCallback(async () => {
    setSinAbrir(false);
    setMensaje(null);
    const r = await iniciarEscena({ parada: ctx.parada, actividad: "ensenale", leccion: ctx.leccion, paso: a.paso });
    if ("error" in r) {
      setSinAbrir(true);
      setMensaje("No pudimos abrir la actividad. Revisa tu conexión.");
      return;
    }
    setConversacion(r.conversacionId);
    setApertura(r.apertura);
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
    setRespondidas(r.estado.cumplidas);
    setActual(r.estado.ensenale?.actual ?? actual);
    setUltimo({ yo: r.transcripcion, url: "url" in e ? e.url : undefined, allison: r.respuesta });
    setFin(r.metaCumplida || r.cerrada);
    void decir(r.respuestaVoz);
  }

  const total = a.preguntas.length;
  const logrado = respondidas.length >= a.minimoRespuestas;
  const dice = ultimo?.allison ?? apertura;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <h2 className="text-[21px] font-black">Teach me!</h2>
        <p className="text-sm font-semibold text-texto-suave">Enséñale a Allison {a.tema}</p>
      </div>

      {a.imagen && <IlustracionCompleta nombre={a.imagen} alt={`Dibujo: ${a.tema}`} alto="h-36" nivel={ctx.nivel} />}

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
        {dice && (
          <div className="flex items-end gap-2.5">
            <span className="flex-none">
              {ultimo ? (
                <Image src="/allison.png" alt="Allison" width={40} height={40} className="size-10 rounded-full object-cover" />
              ) : (
                <AllisonAro tam={48} aro="pregunta" hablando={hablando} />
              )}
            </span>
            <div className="flex min-w-0 items-start gap-2 rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2 font-extrabold">
              <BotonOir tam="chico" onClick={() => void decir(dice)} />
              <span className="pt-1.5">{dice}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2.5 text-[13px] font-extrabold text-texto-suave">
        <span className="flex gap-1.5">
          {a.preguntas.map((_, i) => (
            <i
              key={i}
              className={`size-2.5 rounded-full ${respondidas.includes(i + 1) ? "bg-menta" : i === actual && !fin ? "bg-primario" : "bg-borde"}`}
            />
          ))}
        </span>
        {fin ? `Respondiste ${respondidas.length} de ${total} preguntas` : `Pregunta ${Math.min(actual + 1, total)} de ${total}`}
      </div>

      {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}
      {sinAbrir && (
        <button type="button" onClick={() => void abrir()} className="self-center rounded-full border border-borde px-4 py-2 text-sm font-extrabold">
          Intentar de nuevo
        </button>
      )}

      {fin ? (
        <Hoja
          tono={logrado ? "bien" : "pista"}
          titulo={logrado ? `¡Le enseñaste a Allison ${a.tema}!` : `Casi: responde al menos ${a.minimoRespuestas} preguntas con frases completas`}
          boton="Continuar"
          onBoton={() => onTerminar({ calificadas: total, aciertos: respondidas.length, fallos: [] })}
        />
      ) : (
        <Grabador
          onEntrada={responder}
          ocupado={ocupado}
          deshabilitado={!conversacion}
          ayuda="Toca y respóndele con una frase completa"
        />
      )}
    </div>
  );
}
