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
  const m = modelo.trim();
  if (/[.!?]$/.test(m) || m.split(/\s+/).length >= 3) return m;
  // "a man" ya trae su artículo; "people" o "friends" no lo llevan; "party", sí.
  const sinArticulo = /^(a|an|the|some)\s/i.test(m) || /s$/i.test(m) || /^people$/i.test(m);
  if (plantilla?.includes("___")) return (sinArticulo ? plantilla.replace(/\ba ___/, "___") : plantilla).replace("___", m);
  return `I see ${sinArticulo ? m : `a ${m}`}.`;
}

/** La consigna que no es la de siempre ("Tell me 3 things people are doing."): sin traducción a mano. */
const consignaGenerica = (pregunta: string) => /^(tell me \d+ things\.?|what do you see\?)$/i.test(pregunta.trim());

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
  /** Las frases que Allison ya sugirió: no se repiten (antes podía pedir la misma en bucle). */
  const [dadas, setDadas] = useState<string[]>([]);

  // La consigna de la actividad: en A2 cambia ("Invite me to 3 things in
  // the picture.", "Tell me 3 rules at this pool."); antes siempre decía
  // "Tell me 3 things you see." (auditoría, 28 de octubre de 2026).
  const generica = consignaGenerica(a.pregunta);
  const meta = generica ? `Tell me ${a.minimo} things you see.` : a.pregunta;
  useEffect(() => {
    const t = setTimeout(() => void decir(meta), 400);
    return () => clearTimeout(t);
  }, [decir, meta]);

  /** Las cosas del dibujo que nombra una frase modelo. */
  const cosasDe = (frase: string) => a.cosas.filter((c) => ` ${norm(frase)} `.includes(` ${norm(c)}`));

  /**
   * La frase que sugiere Allison: una de las modelo (o aceptadas) que no
   * dio todavía y que nombra algo nuevo; si no queda ninguna, una cosa del
   * dibujo que no nombró; si tampoco, cualquier frase que no dio. Antes, en
   * la parada 10 (las tres modelo nombran "bank") o con una frase sin
   * cosas ("They're dancing."), no quedaba ninguna o se repetía la misma.
   */
  function sugerencia(ya: string[]): string | null {
    const libres = [...a.modelo, ...a.aceptadas].map((x) => fraseModelo(x, a.plantillas[0])).filter((f) => !dadas.includes(f));
    const conNueva = libres.find((f) => cosasDe(f).some((c) => !ya.includes(c)));
    if (conNueva) return conNueva;
    const cosa = a.cosas.find((c) => !ya.includes(c));
    if (cosa) {
      const f = fraseModelo(cosa, a.plantillas.find((p) => (p.match(/___/g) ?? []).length === 1));
      if (!dadas.includes(f)) return f;
    }
    return libres[0] ?? null;
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

    // Una cosa nueva por frase: la actividad pide decirlo tres veces, y
    // "A woman was reading a book." contaba tres de una vez.
    const nuevas = r.nombradas.filter((c) => !nombradas.includes(c)).slice(0, 1);
    // Desde A2, con un error de gramática ("He wash the car"): Allison la
    // dice bien y el alumno la repite; cuenta al decirla bien (Si responde
    // mal de A2; tanda 1, 29 de octubre de 2026). Si tampoco sale, sigue
    // como cualquier frase que Allison le da.
    if (nuevas.length && r.mejora?.mejor && !sugerida) {
      const mejor = conPunto(r.mejora.mejor);
      setSugerida(mejor);
      setDadas((d) => [...d, mejor]);
      setFallosSeguidos(1);
      void decir(`Almost! ${mejor} Say it.`);
      return;
    }
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
      // Lo que no sepa, Allison se lo dice y sigue: cuenta como nombrada
      // con ayuda, siempre una más (si la frase no nombra una cosa nueva,
      // cuenta ella misma; antes el contador podía no moverse).
      const nueva = cosasDe(sugerida).find((c) => !nombradas.includes(c)) ?? sugerida;
      setNombradas((x) => [...new Set([...x, nueva])]);
      setDichas((d) => [...d, sugerida]);
      setAyudadas((x) => [...x, sugerida]);
      setSugerida(null);
      setFallosSeguidos(0);
      return;
    }
    const s = sugerencia(nombradas);
    if (r.espanol) setMensaje("Lo dijiste en español. Ahora dilo en inglés.");
    if (s) {
      setSugerida(s);
      setDadas((d) => [...d, s]);
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
  // Sin plantillas, "I see a ___." solo en A1: en A2 empujaba al presente
  // cuando la consigna pide el pasado ("people were doing").
  const plantilla = a.plantillas[Math.min(nombradas.length, a.plantillas.length - 1)] ?? (ctx.nivel === "A1" ? "I see a ___." : null);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-center gap-4">
        <Ondas activas={hablando} />
        <AllisonAro tam={72} aro={listo ? "bien" : sugerida ? "pista" : "pregunta"} hablando={hablando} />
        <Ondas activas={hablando} />
      </div>
      <div className="text-center">
        <h2 className="text-[21px] font-black text-balance">{meta}</h2>
        <p className="text-sm font-semibold text-texto-suave">
          {generica ? `Dime ${a.minimo} cosas que ves en la imagen` : `Mira la imagen y dime ${a.minimo} cosas, en inglés`}
        </p>
      </div>

      <IlustracionCompleta nombre={a.imagen} alt="La imagen para describir" alto="h-56" nivel={ctx.nivel} />

      {!listo && (sugerida || plantilla) && (
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
