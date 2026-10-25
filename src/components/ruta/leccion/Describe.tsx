"use client";

import { useEffect, useState } from "react";
import { conPunto } from "@/lib/habla";
import type { Describe as Datos } from "@/lib/ruta/tipos";
import { evaluar, type Contexto, type FinActividad } from "./api";
import { AllisonAro, BotonOir, Grabador, Hoja, IlustracionCompleta, NoDijeEso, useVoz, type Entrada } from "./comun";
import { Ondas } from "./EscuchaElige";

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** ¿La palabra de ayuda nombra esa cosa? "a clock"/"clock", "watches TV"/"TV", "trees"/"tree". */
const coincide = (ayuda: string, cosa: string) => {
  const a = norm(ayuda);
  const c = norm(cosa);
  return !!a && !!c && (a.includes(c) || c.includes(a));
};

/**
 * La frase de una cosa del dibujo: la frase modelo si ya es una frase
 * ("I see a board."), o la plantilla completada con ella ("a man" →
 * "I see a man.").
 */
function fraseModelo(modelo: string, plantilla?: string): string {
  if (/[.!?]$/.test(modelo.trim()) || modelo.trim().split(/\s+/).length >= 3) return modelo.trim();
  if (plantilla?.includes("___")) return plantilla.replace(/\ba ___/, "___").replace("___", modelo.trim());
  return `I see ${modelo.trim()}.`;
}

/**
 * Describe la imagen (pantalla 7): "Tell me 3 things you see". Completa
 * la frase con una palabra de ayuda y la dice, tres veces, con una cosa
 * distinta cada vez. Si una frase no nombra nada nuevo, Allison señala
 * una cosa y le da la frase para repetir; si tampoco sale, se la dice y
 * sigue (cuenta como nombrada con ayuda).
 */
export function Describe({
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
  /** Las cosas del dibujo que ya nombró (de `cosas`, como las devuelve el servidor). */
  const [nombradas, setNombradas] = useState<string[]>([]);
  /** Las frases que tuvo que darle Allison: van al repaso. */
  const [ayudadas, setAyudadas] = useState<string[]>([]);
  const [sugerida, setSugerida] = useState<string | null>(null);
  const [fallosSeguidos, setFallosSeguidos] = useState(0);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [oido, setOido] = useState<{ texto: string; escrito: boolean; antes: { sugerida: string | null; fallos: number } } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [dichas, setDichas] = useState<string[]>([]);

  const meta = `Tell me ${a.minimo} things you see.`;
  useEffect(() => {
    const t = setTimeout(() => void decir(meta), 400);
    return () => clearTimeout(t);
  }, [decir, meta]);

  /** Las cosas del dibujo que nombra una frase modelo. */
  const cosasDe = (frase: string) => a.cosas.filter((c) => ` ${norm(frase)} `.includes(` ${norm(c)}`));

  /** La primera frase modelo con una cosa que todavía no nombró. */
  function sugerencia(ya: string[]): string | null {
    const m = a.modelo.find((x) => {
      const cs = cosasDe(fraseModelo(x, a.plantillas[0]));
      return cs.length === 0 || cs.every((c) => !ya.includes(c));
    });
    return m ? fraseModelo(m, a.plantillas[0]) : null;
  }

  async function responder(e: Entrada) {
    setMensaje(null);
    setOcupado(true);
    const r = await evaluar(ctx, a.paso, e);
    setOcupado(false);
    if (r.sinSaldo) return onSinSaldo();
    if (r.error) return setMensaje(r.error);
    if (r.sinVoz) return setMensaje("No te oí. Inténtalo otra vez.");
    setOido({ texto: r.transcripcion, escrito: "texto" in e, antes: { sugerida, fallos: fallosSeguidos } });

    const nuevas = r.nombradas.filter((c) => !nombradas.includes(c));
    if (nuevas.length) {
      const todas = [...nombradas, ...nuevas];
      setNombradas(todas);
      setDichas((d) => [...d, r.transcripcion]);
      if (sugerida) setAyudadas((x) => [...x, sugerida]);
      setSugerida(null);
      setFallosSeguidos(0);
      void decir(todas.length >= a.minimo ? "Great job!" : "Yes! What else?");
      return;
    }
    const n = fallosSeguidos + 1;
    setFallosSeguidos(n);
    if (n >= 2 && sugerida) {
      // Lo que no sepa, Allison se lo dice y sigue: cuenta como nombrada con ayuda.
      const cs = cosasDe(sugerida);
      setNombradas((x) => [...new Set([...x, ...(cs.length ? cs : [sugerida])])]);
      setDichas((d) => [...d, sugerida]);
      setAyudadas((x) => [...x, sugerida]);
      setSugerida(null);
      setFallosSeguidos(0);
      return;
    }
    const s = sugerencia(nombradas);
    if (r.espanol) setMensaje("¡Eso es! Ahora dilo en inglés.");
    if (s) {
      setSugerida(s);
      void decir(`Look! ${conPunto(s)} Say it.`);
    }
  }

  /** "¿No dijiste eso?": el micrófono entendió mal y el intento no cuenta. */
  function noDijeEso() {
    if (!oido) return;
    setSugerida(oido.antes.sugerida);
    setFallosSeguidos(oido.antes.fallos);
    setOido(null);
    setMensaje(null);
  }

  const listo = nombradas.length >= a.minimo;
  const plantilla = a.plantillas[Math.min(nombradas.length, a.plantillas.length - 1)] ?? "I see a ___.";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-center gap-4">
        <Ondas activas={hablando} />
        <AllisonAro tam={72} aro={listo ? "bien" : sugerida ? "pista" : "pregunta"} hablando={hablando} />
        <Ondas activas={hablando} />
      </div>
      <div className="text-center">
        <h2 className="text-[21px] font-black">{meta}</h2>
        <p className="text-sm font-semibold text-texto-suave">Dime {a.minimo} cosas que ves en la imagen</p>
      </div>

      <IlustracionCompleta nombre={a.imagen} alt="La imagen para describir" alto="h-56" nivel={ctx.nivel} />

      {!listo && (
        <div className="flex flex-col gap-1 rounded-2xl border-2 border-dashed border-primario bg-primario-suave px-4 py-3">
          <small className="text-[11.5px] font-extrabold tracking-[0.06em] text-primario uppercase">
            {sugerida ? "Allison te ayuda · dilo así" : "Tu frase"}
          </small>
          <b className="text-[22px] leading-tight font-black">{sugerida ?? plantilla}</b>
          {sugerida && (
            <span>
              <BotonOir onClick={() => void decir(sugerida)} texto="Oír" />
            </span>
          )}
        </div>
      )}

      {!listo && a.palabrasAyuda.length > 0 && (
        <>
          <span className="text-center text-xs font-extrabold tracking-[0.08em] text-texto-suave uppercase">Palabras de ayuda</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {a.palabrasAyuda.map((p) => {
              const usada = nombradas.some((c) => coincide(p, c));
              return (
                <span
                  key={p}
                  className={`rounded-xl px-3.5 py-1.5 text-lg font-extrabold ${usada ? "bg-menta-suave text-menta" : "bg-superficie-2"}`}
                >
                  {p}
                </span>
              );
            })}
          </div>
        </>
      )}

      <div className="flex items-center justify-center gap-2.5 text-[13px] font-extrabold text-texto-suave" aria-live="polite">
        <span className="flex gap-1.5">
          {Array.from({ length: a.minimo }, (_, i) => (
            <i key={i} className={`size-2.5 rounded-full ${i < nombradas.length ? "bg-menta" : "bg-borde"}`} />
          ))}
        </span>
        {Math.min(nombradas.length, a.minimo)} de {a.minimo}
      </div>

      {mensaje && (
        <p role="alert" className="text-center text-sm font-bold text-oro">
          {mensaje}
        </p>
      )}
      {oido && !listo && <NoDijeEso oido={oido.texto} escrito={oido.escrito} onClick={noDijeEso} />}

      {listo ? (
        <Hoja
          tono="bien"
          titulo="¡Muy bien! Viste todo eso."
          boton="Continuar"
          onBoton={() =>
            onTerminar({
              calificadas: a.minimo,
              aciertos: Math.max(0, a.minimo - ayudadas.length),
              fallos: ayudadas.slice(0, a.minimo),
            })
          }
        >
          <ul className="flex flex-col gap-1 text-texto">
            {dichas.map((d, i) => (
              <li key={i} className="font-bold">
                {d}
              </li>
            ))}
          </ul>
        </Hoja>
      ) : (
        <Grabador onEntrada={responder} ocupado={ocupado} ayuda={sugerida ? "Toca y repítela" : "Toca y di la frase completa"} />
      )}
    </div>
  );
}
