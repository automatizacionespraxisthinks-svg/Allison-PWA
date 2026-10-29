"use client";

import { useEffect, useRef, useState } from "react";
import type { TuTurno as Datos } from "@/lib/ruta/tipos";
import { detenerVoz } from "@/lib/voz";
import { Icono } from "../Iconos";
import type { Contexto, FinActividad } from "./api";
import { AllisonAro, BotonOir, Grabador, Hoja, oirGrabacion, useVoz, type Entrada } from "./comun";

/**
 * Tu turno en el diálogo (pantalla 5): un diálogo que se ve como un
 * chat y se detiene en la línea del alumno. La dice y el diálogo sigue.
 * No se califica: basta con hablar. Gratis (no pasa por un prompt).
 */
export function TuTurno({ a, ctx, onTerminar }: { a: Datos; ctx: Contexto; onTerminar: (f: FinActividad) => void }) {
  const { decir, hablando } = useVoz(ctx.nivel);
  const [visibles, setVisibles] = useState(0);
  const [dicha, setDicha] = useState<{ texto: string; url?: string } | null>(null);
  const reproduciendo = useRef(false);
  /** "Ver todo": corta la lectura (por ejemplo, si la voz no suena). */
  const cortado = useRef(false);

  // Las líneas de antes suenan una tras otra, como una conversación.
  useEffect(() => {
    let vivo = true;
    (async () => {
      reproduciendo.current = true;
      await new Promise((r) => setTimeout(r, 400));
      for (let i = 0; i < a.dialogo.length && vivo && !cortado.current; i++) {
        setVisibles(i + 1);
        await decir(a.dialogo[i].dice);
      }
      reproduciendo.current = false;
    })();
    return () => {
      vivo = false;
    };
  }, [a.dialogo, decir]);

  function verTodo() {
    cortado.current = true;
    detenerVoz();
    setVisibles(a.dialogo.length);
  }

  function responder(e: Entrada) {
    // Lo grabado no se transcribe (es gratis): la burbuja no puede decir
    // qué dijo. Antes mostraba la frase modelo como si fuera suya.
    if ("texto" in e) setDicha({ texto: e.texto });
    else setDicha({ texto: "Tu grabación", url: e.url });
    void decir("Great job!");
  }

  async function oirTodo() {
    // Si se corta (Continuar, otro audio), el resto del diálogo no sigue
    // sonando en la actividad siguiente.
    for (const l of a.dialogo) if (!(await decir(l.dice))) return;
    if (dicha?.url) oirGrabacion(dicha.url);
    else if (dicha) await decir(dicha.texto);
  }

  const inicial = (quien: string) => quien.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        {a.dialogo.slice(0, visibles).map((l, i) => (
          <div key={i} className="flex items-end gap-2.5">
            <span className="grid size-10 flex-none place-items-center rounded-full bg-oro-suave font-black text-oro" title={l.quien}>
              {inicial(l.quien)}
            </span>
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

        {visibles >= a.dialogo.length &&
          (dicha ? (
            <button
              type="button"
              onClick={() => (dicha.url ? oirGrabacion(dicha.url) : void decir(dicha.texto))}
              className="flex items-center gap-2 self-end rounded-[18px_18px_4px_18px] bg-primario px-4 py-2.5 text-left font-extrabold text-white"
            >
              <Icono nombre="play" className="size-4" />
              {dicha.texto}
            </button>
          ) : (
            <div className="self-end rounded-[18px_18px_4px_18px] border-[1.5px] border-dashed border-primario bg-primario-suave px-4 py-2.5 text-primario">
              <b className="text-lg font-black">{a.plantilla}</b>
              <small className="block text-xs font-semibold text-texto-suave">Tu turno: dilo con tus datos</small>
            </div>
          ))}
      </div>

      {visibles >= a.dialogo.length && !dicha && a.palabras && a.palabras.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {a.palabras.map((p) => (
            <span key={p} className="rounded-xl bg-superficie-2 px-3 py-1.5 text-[15px] font-extrabold">
              {p}
            </span>
          ))}
        </div>
      )}

      {visibles < a.dialogo.length && (
        <button type="button" onClick={verTodo} className="self-center text-[13px] font-extrabold text-texto-suave underline">
          Ver todo el diálogo
        </button>
      )}

      <div className="flex items-center gap-2.5 text-[13px] font-bold text-texto-suave">
        <AllisonAro tam={30} hablando={hablando} />
        {dicha ? 'Allison: "Great job!"' : 'Allison: "Your turn!" Di tu línea.'}
      </div>

      {dicha ? (
        <Hoja tono="bien" titulo="¡Muy bien!" boton="Continuar" onBoton={() => onTerminar({ calificadas: 0, aciertos: 0, fallos: [] })}>
          <div className="flex flex-wrap gap-2">
            <BotonOir onClick={() => void oirTodo()} texto="Oír el diálogo completo" />
            <BotonOir onClick={() => setDicha(null)} texto="Grabarla otra vez" />
          </div>
        </Hoja>
      ) : (
        visibles >= a.dialogo.length && (
          <>
            <div className="flex justify-center">
              <BotonOir onClick={() => void decir(a.modelo)} texto="Oír un ejemplo" />
            </div>
            <Grabador onEntrada={responder} ayuda="Toca y di tu línea" />
          </>
        )
      )}
    </div>
  );
}
