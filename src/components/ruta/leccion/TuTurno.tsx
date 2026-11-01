"use client";

import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { letraParaVoz } from "@/lib/habla";
import { mapaDe, trazarMapa } from "@/lib/ruta/indicaciones";
import type { TuTurno as Datos, TurnoDeTuTurno } from "@/lib/ruta/tipos";
import { detenerVoz, reproducirGrabacionEntera } from "@/lib/voz";
import { Icono } from "../Iconos";
import { MapaCiudad } from "../MapaCiudad";
import type { Contexto, FinActividad } from "./api";
import { AllisonAro, BotonOir, Grabador, Hoja, oirGrabacion, useVoz, type Entrada } from "./comun";

const MESES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DIAS_DEL_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Una letra como suena en el abecedario, dos veces: "B, B." (la A va como "eh": letraParaVoz). */
const oirLetra = (l: string) => `${letraParaVoz(l)}, ${letraParaVoz(l)}.`;

/**
 * El primer nombre del alumno, para la línea del deletreo ("en pantalla:
 * el nombre del alumno con un espacio por letra", A1 P3) y los ejemplos:
 * "Diego" en el contenido es el nombre del alumno. Sin tildes ni eñe al
 * deletrear (José: J-O-S-E). null si no sirve (vacío, con números o muy
 * largo): quedan la plantilla y el ejemplo del contenido.
 */
function nombreDelAlumno(nombre: string): { visto: string; letras: string[] } | null {
  const primero = nombre.trim().split(/\s+/)[0] ?? "";
  const letras = primero.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().split("");
  if (letras.length < 2 || letras.length > 20 || !letras.every((l) => LETRAS.includes(l))) return null;
  return { visto: primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase(), letras };
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th", 22 → "22nd": como se dice una fecha en EE. UU. */
function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/**
 * "Con un selector de mes y día" (A1 P4): arma la fecha de su línea
 * ("My birthday is on March 3rd.") y la dice. Antes solo estaba "___" y
 * el ordinal quedaba por su cuenta (1 de noviembre de 2026).
 */
function SelectorFecha({ plantilla, decir }: { plantilla: string; decir: (texto: string) => Promise<boolean> }) {
  const [mes, setMes] = useState(2);
  const [dia, setDia] = useState(3);
  const frase = plantilla.replace("___", `${MESES[mes]} ${ordinal(dia)}`);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <select
          aria-label="Mes"
          value={mes}
          onChange={(e) => {
            const m = Number(e.target.value);
            setMes(m);
            setDia((d) => Math.min(d, DIAS_DEL_MES[m]));
          }}
          className="rounded-xl border border-borde bg-superficie px-3 py-2 font-bold"
        >
          {MESES.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <select
          aria-label="Día"
          value={dia}
          onChange={(e) => setDia(Number(e.target.value))}
          className="rounded-xl border border-borde bg-superficie px-3 py-2 font-bold"
        >
          {Array.from({ length: DIAS_DEL_MES[mes] }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {ordinal(d)}
            </option>
          ))}
        </select>
      </div>
      <span className="flex items-center gap-2 text-[15px] font-extrabold">
        <BotonOir tam="chico" onClick={() => void decir(frase)} />
        {frase}
      </span>
    </div>
  );
}

/**
 * "Si no sabe una letra, toca la letra y la oye" (A1 P3): el abecedario
 * en botones. La letra va dos veces y con coma, como los deletreos que la
 * voz lee letra por letra ("B, B."), siempre en inglés ("Y, Y." sonaba en
 * español) y la A como "eh, eh." (letraParaVoz: "A" sonaba como el artículo).
 */
function Abecedario({ decir }: { decir: (texto: string, opciones?: { soloIngles?: boolean }) => Promise<boolean> }) {
  return (
    <div className="flex flex-col gap-1.5">
      <small className="text-center text-xs font-bold text-texto-suave">Toca una letra para oírla</small>
      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
        {LETRAS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => void decir(oirLetra(l), { soloIngles: true })}
            aria-label={`Oír la letra ${l}`}
            className="rounded-lg bg-superficie-2 py-1.5 text-[15px] font-black"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Tu turno en el diálogo (pantalla 5): un diálogo que se ve como un
 * chat y se detiene en la línea del alumno. La dice y el diálogo sigue,
 * una pregunta a la vez si hay varias (`siguientes`). No se califica:
 * basta con hablar. Gratis (no pasa por un prompt).
 */
export function TuTurno({ a, ctx, onTerminar }: { a: Datos; ctx: Contexto; onTerminar: (f: FinActividad) => void }) {
  const { decir, hablando } = useVoz(ctx.nivel);
  const suNombre = useMemo(() => nombreDelAlumno(ctx.nombre), [ctx.nombre]);
  /** El primer turno y los que siguen, con los ejemplos en su nombre ("My name is Diego." → el suyo, deletreado). */
  const turnos: TurnoDeTuTurno[] = useMemo(
    () =>
      [
        { dialogo: a.dialogo, plantilla: a.plantilla, modelo: a.modelo, palabras: a.palabras, deletrear: a.deletrear, fecha: a.fecha },
        ...(a.siguientes ?? []),
      ].map((t) =>
        suNombre
          ? {
              ...t,
              // El deletreo ya letra por letra ("M, eh, R, I, eh."): deletreoParaVoz no toca los de dos letras ("B-O").
              modelo: t.deletrear ? `${suNombre.letras.map(letraParaVoz).join(", ")}.` : t.modelo.replace(/\bDiego\b/g, suNombre.visto),
            }
          : t
      ),
    [a, suNombre]
  );
  const [paso, setPaso] = useState(0);
  /** Las líneas del turno actual que ya se ven. */
  const [visibles, setVisibles] = useState(0);
  /** Lo que dijo en cada turno. */
  const [dichas, setDichas] = useState<{ texto: string; url?: string }[]>([]);
  /** "Ver todo": corta la lectura (por ejemplo, si la voz no suena). */
  const cortado = useRef(false);
  const turno = turnos[paso];
  const fin = dichas.length >= turnos.length;
  const suTurno = !fin && visibles >= turno.dialogo.length;

  // Las líneas del turno suenan una tras otra, como una conversación.
  useEffect(() => {
    let vivo = true;
    cortado.current = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 400));
      const lineas = turnos[paso]?.dialogo ?? [];
      for (let i = 0; i < lineas.length && vivo && !cortado.current; i++) {
        setVisibles(i + 1);
        await decir(lineas[i].dice);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [paso, turnos, decir]);

  function verTodo() {
    cortado.current = true;
    detenerVoz();
    setVisibles(turno.dialogo.length);
  }

  function responder(e: Entrada) {
    // Lo grabado no se transcribe (es gratis): la burbuja no puede decir
    // qué dijo. Antes mostraba la frase modelo como si fuera suya.
    const dicha = "texto" in e ? { texto: e.texto } : { texto: "Tu grabación", url: e.url };
    setDichas((d) => [...d.slice(0, paso), dicha]);
    if (paso + 1 < turnos.length) {
      setVisibles(0);
      setPaso(paso + 1);
    } else void decir("Great job!");
  }

  async function oirTodo() {
    // Si se corta (Continuar, otro audio), el resto del diálogo no sigue
    // sonando en la actividad siguiente.
    for (let k = 0; k < turnos.length; k++) {
      for (const l of turnos[k].dialogo) if (!(await decir(l.dice))) return;
      const d = dichas[k];
      if (d?.url ? !(await reproducirGrabacionEntera(d.url)) : d && !(await decir(d.texto))) return;
    }
  }

  const inicial = (quien: string) => quien.trim().charAt(0).toUpperCase() || "?";
  // El mapa de la app (A1 P10): lo que hay que decir se ve en él.
  const trazo = useMemo(() => (a.mapa ? trazarMapa(mapaDe(a.mapa.indicaciones ?? [], a.mapa.meta), a.mapa) : null), [a.mapa]);

  return (
    <div className="flex flex-col gap-3">
      {trazo && (
        <MapaCiudad
          trazo={trazo}
          conCamino={false}
          etiqueta="Mapa: tú estás abajo, en la calle que sube. Arriba están los lugares con su nombre."
          className="mx-auto w-full max-w-sm"
        />
      )}
      <div className="flex flex-col gap-2.5">
        {turnos.slice(0, paso + 1).map((t, k) => (
          <Fragment key={k}>
            {(k < paso ? t.dialogo : t.dialogo.slice(0, visibles)).map((l, i) => (
              <div key={i} className="flex items-end gap-2.5">
                {l.quien === "Allison" ? (
                  <Image src="/allison.png" alt="" width={40} height={40} title="Allison" className="size-10 flex-none rounded-full object-cover" />
                ) : (
                  <span className="grid size-10 flex-none place-items-center rounded-full bg-oro-suave font-black text-oro" title={l.quien}>
                    {inicial(l.quien)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void decir(l.dice)}
                  className="min-w-0 rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2.5 text-left text-base font-extrabold"
                >
                  {l.dice}
                  <small className="block text-xs font-semibold text-texto-suave">{l.quien} · toca para oírla otra vez</small>
                </button>
              </div>
            ))}
            {dichas[k] ? (
              <button
                type="button"
                onClick={() => (dichas[k].url ? oirGrabacion(dichas[k].url!) : void decir(dichas[k].texto))}
                className="flex items-center gap-2 self-end rounded-[18px_18px_4px_18px] bg-primario px-4 py-2.5 text-left font-extrabold text-white"
              >
                <Icono nombre="play" className="size-4" />
                {dichas[k].texto}
              </button>
            ) : (
              k === paso &&
              suTurno && (
                <div className="self-end rounded-[18px_18px_4px_18px] border-[1.5px] border-dashed border-primario bg-primario-suave px-4 py-2.5 text-primario">
                  {t.deletrear && suNombre ? (
                    // Su nombre, letra por letra: lo que tiene que decir. Cada letra suena al tocarla.
                    <span className="flex flex-wrap gap-1.5" aria-label={`Deletrea ${suNombre.visto}`}>
                      {suNombre.letras.map((l, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => void decir(oirLetra(l), { soloIngles: true })}
                          aria-label={`Oír la letra ${l}`}
                          className="grid h-10 min-w-9 place-items-center rounded-lg bg-superficie px-2 text-xl font-black"
                        >
                          {l}
                        </button>
                      ))}
                    </span>
                  ) : (
                    <b className="text-lg font-black">{t.plantilla}</b>
                  )}
                  <small className="mt-1 block text-xs font-semibold text-texto-suave">
                    {t.deletrear && suNombre
                      ? `Tu turno: deletrea ${suNombre.visto}, letra por letra. Toca una letra para oírla.`
                      : "Tu turno: dilo con tus datos"}
                  </small>
                </div>
              )
            )}
          </Fragment>
        ))}
      </div>

      {suTurno && turno.palabras && turno.palabras.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {turno.palabras.map((p) => (
            <span key={p} className="rounded-xl bg-superficie-2 px-3 py-1.5 text-[15px] font-extrabold">
              {p}
            </span>
          ))}
        </div>
      )}
      {suTurno && turno.fecha && <SelectorFecha plantilla={turno.plantilla} decir={decir} />}
      {suTurno && turno.deletrear && <Abecedario decir={decir} />}

      {!fin && visibles < turno.dialogo.length && (
        <button type="button" onClick={verTodo} className="self-center text-[13px] font-extrabold text-texto-suave underline">
          Ver todo el diálogo
        </button>
      )}

      <div className="flex items-center gap-2.5 text-[13px] font-bold text-texto-suave">
        <AllisonAro tam={30} hablando={hablando} />
        {fin ? 'Allison: "Great job!"' : 'Allison: "Your turn!" Di tu línea.'}
      </div>

      {fin ? (
        <Hoja tono="bien" titulo="¡Muy bien!" boton="Continuar" onBoton={() => onTerminar({ calificadas: 0, aciertos: 0, fallos: [] })}>
          <div className="flex flex-wrap gap-2">
            <BotonOir onClick={() => void oirTodo()} texto="Oír el diálogo completo" />
            <BotonOir onClick={() => setDichas((d) => d.slice(0, -1))} texto="Grabarla otra vez" />
          </div>
        </Hoja>
      ) : (
        suTurno && (
          <>
            <div className="flex justify-center">
              {/* Un deletreo, solo en inglés: letras como "Y, O" se tomarían por español. */}
              <BotonOir onClick={() => void decir(turno.modelo, { soloIngles: !!turno.deletrear })} texto="Oír un ejemplo" />
            </div>
            <Grabador key={paso} onEntrada={responder} ayuda="Toca y di tu línea" />
          </>
        )
      )}
    </div>
  );
}
