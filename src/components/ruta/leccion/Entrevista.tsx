"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Entrevista as Datos } from "@/lib/ruta/tipos";
import { desdeB1 } from "@/lib/tipos";
import { Icono } from "../Iconos";
import { iniciarEscena, turnoEscena } from "../escenaApi";
import type { Contexto, FinActividad } from "./api";
import { AllisonAro, BotonOir, Grabador, Hoja, desordenar, oirGrabacion, useVoz, type Entrada } from "./comun";

/**
 * Entrevista a Allison (pantalla 9): la ficha de Allison, tipo carné, con
 * cinco datos por descubrir. El alumno arma cada pregunta con palabras de
 * ayuda y la dice; al acertar el dato se llena, Allison responde con su
 * ficha aprobada y le devuelve la pregunta ("And you?"). Dura como mínimo
 * 10 intervenciones. Si la pregunta no se entiende, Allison pregunta en
 * español qué quiere saber y le da la pregunta para repetir. Desde A2 las
 * palabras de ayuda de cada pregunta aparecen solo después de un intento
 * que no sirvió (Contenido A2). Desde B1 no hay palabras de ayuda: si no
 * se entiende, Allison da su pista en inglés (Contenido B1).
 */
export function Entrevista({
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
  const [descubiertos, setDescubiertos] = useState<number[]>([]);
  const [intervenciones, setIntervenciones] = useState(0);
  /** Las veces que Allison tuvo que darle la pregunta (las cuenta el servidor). */
  const [ayudas, setAyudas] = useState(0);
  /** Las veces que tocó "Ayuda" para ver la pregunta escrita. */
  const [ayudasBoton, setAyudasBoton] = useState(0);
  const [verAyuda, setVerAyuda] = useState(false);
  /** Intentos que no sirvieron en la pregunta de ahora (desde A2 abren las palabras de ayuda). */
  const [fallosDato, setFallosDato] = useState(0);
  const [ultimo, setUltimo] = useState<{ yo: string; url?: string; allison: string } | null>(null);
  const [meta, setMeta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const empezo = useRef(false);
  const [sinAbrir, setSinAbrir] = useState(false);

  const abrir = useCallback(async () => {
    setSinAbrir(false);
    setMensaje(null);
    const r = await iniciarEscena({ parada: ctx.parada, actividad: "entrevista", leccion: ctx.leccion, paso: a.paso });
    if ("error" in r) {
      setSinAbrir(true);
      setMensaje("No pudimos abrir la entrevista. Revisa tu conexión.");
      return;
    }
    setConversacion(r.conversacionId);
    void decir(r.apertura);
  }, [a.paso, ctx.leccion, ctx.parada, decir]);

  useEffect(() => {
    if (empezo.current) return;
    empezo.current = true;
    void abrir();
  }, [abrir]);

  const siguiente = a.datos.findIndex((_, i) => !descubiertos.includes(i + 1));
  const chips = useMemo(
    () => (siguiente >= 0 ? desordenar(a.datos[siguiente].pregunta.replace(/[?!.]/g, "").split(/\s+/), a.datos[siguiente].pregunta) : []),
    [a.datos, siguiente]
  );

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
    if (r.estado.cumplidas.length > descubiertos.length) setFallosDato(0);
    else if (r.estado.ayudas > ayudas) setFallosDato((n) => n + 1);
    setDescubiertos(r.estado.cumplidas);
    setIntervenciones(r.estado.intervenciones);
    setAyudas(r.estado.ayudas);
    setUltimo({ yo: r.transcripcion, url: "url" in e ? e.url : undefined, allison: r.respuesta });
    setMeta(r.metaCumplida || r.cerrada);
    void decir(r.respuestaVoz);
  }

  const total = a.datos.length;
  const completa = descubiertos.length >= total;
  const b1 = desdeB1(ctx.nivel);
  const conPalabras = !b1 && (ctx.nivel === "A1" || fallosDato > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <h2 className="text-[21px] font-black">Ask me {total} questions</h2>
        <p className="text-sm font-semibold text-texto-suave">Hazme {total} preguntas para conocerme</p>
      </div>

      <div className="flex items-center gap-3 rounded-3xl bg-superficie-2 p-3">
        <span className="flex flex-none flex-col items-center gap-1.5">
          <AllisonAro tam={72} aro={meta ? "bien" : "pregunta"} hablando={hablando} />
          <small className="text-[11px] font-extrabold tracking-[0.06em] text-primario uppercase">Mi ficha</small>
        </span>
        <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
          {a.datos.map((d, i) => {
            const ok = descubiertos.includes(i + 1);
            const act = i === siguiente;
            return (
              <li
                key={i}
                className={`flex flex-col rounded-xl bg-superficie px-3 py-1.5 text-[13.5px] font-extrabold ${
                  act ? "outline-2 outline-primario outline-dashed" : ""
                } ${ok ? "text-texto" : act ? "text-primario" : "text-texto-suave"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  {d.dato}
                  {ok ? <Icono nombre="check" className="size-4 stroke-[3] text-menta" /> : <i className="not-italic">¿?</i>}
                </span>
                {ok && <b className="text-[13px] font-bold text-menta">{d.respuesta}</b>}
              </li>
            );
          })}
        </ul>
      </div>

      {ultimo && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => (ultimo.url ? oirGrabacion(ultimo.url) : undefined)}
            className="flex items-center gap-2 self-end rounded-[18px_18px_4px_18px] bg-primario px-4 py-2 text-left font-extrabold text-white"
          >
            {ultimo.url && <Icono nombre="play" className="size-4" />}
            {ultimo.yo}
          </button>
          <div className="flex items-end gap-2.5">
            <Image src="/allison.png" alt="Allison" width={40} height={40} className="size-10 rounded-full object-cover" />
            <div className="min-w-0 rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2 font-extrabold">{ultimo.allison}</div>
          </div>
        </div>
      )}

      {!completa && siguiente >= 0 && (
        <>
          {conPalabras ? (
            <>
              <span className="text-center text-xs font-extrabold tracking-[0.08em] text-texto-suave uppercase">Palabras de ayuda</span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {chips.map((w, i) => (
                  <span key={i} className="rounded-xl bg-superficie-2 px-3 py-1.5 text-[17px] font-extrabold">
                    {w}
                  </span>
                ))}
                <span className="px-1 py-1.5 text-[17px] font-extrabold">?</span>
              </div>
            </>
          ) : (
            <p className="text-center text-[13px] font-bold text-texto-suave">
              {b1 ? "Arma tu pregunta sin palabras de ayuda." : "Arma tu pregunta. Si no te sale, aparecen las palabras."}
            </p>
          )}
          {verAyuda ? (
            <p className="flex items-center justify-center gap-2 text-center text-lg font-black text-primario">
              <BotonOir tam="chico" onClick={() => void decir(a.datos[siguiente].pregunta)} />
              {a.datos[siguiente].pregunta}
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
          )}
        </>
      )}

      <div className="flex items-center justify-center gap-2.5 text-[13px] font-extrabold text-texto-suave">
        <span className="flex gap-1.5">
          {a.datos.map((_, i) => (
            <i key={i} className={`size-2.5 rounded-full ${descubiertos.includes(i + 1) ? "bg-menta" : i === siguiente ? "bg-primario" : "bg-borde"}`} />
          ))}
        </span>
        {completa ? `Ficha completa · ${Math.min(intervenciones, a.minimoIntervenciones)} de ${a.minimoIntervenciones} intervenciones` : `Pregunta ${descubiertos.length + 1} de ${total}`}
      </div>

      {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}
      {sinAbrir && (
        <button type="button" onClick={() => void abrir()} className="self-center rounded-full border border-borde px-4 py-2 text-sm font-extrabold">
          Intentar de nuevo
        </button>
      )}

      {meta ? (
        <Hoja
          tono="bien"
          titulo="¡Ficha completa! Ya conoces a Allison."
          boton="Continuar"
          onBoton={() => onTerminar({ calificadas: total, aciertos: Math.max(0, total - ayudas - ayudasBoton), fallos: [] })}
        />
      ) : (
        <Grabador
          onEntrada={responder}
          ocupado={ocupado}
          deshabilitado={!conversacion}
          ayuda={
            ultimo && /And you\?$/.test(ultimo.allison)
              ? "Toca y respóndele"
              : completa
                ? "Sigue hablando con Allison"
                : "Toca y hazle tu pregunta"
          }
        />
      )}
    </div>
  );
}
