"use client";

import { useEffect, useState } from "react";
import type { QueEsEsto as Datos } from "@/lib/ruta/tipos";
import { desdeB1 } from "@/lib/tipos";
import { Icono } from "../Iconos";
import { evaluar, type Contexto, type FinActividad, type ResultadoEvaluacion } from "./api";
import { AllisonAro, BotonOir, Explicado, Grabador, Hoja, IlustracionCompleta, explicacionPara, oirGrabacion, useVoz, type Entrada } from "./comun";
import { Ondas, Reloj } from "./EscuchaElige";

/**
 * ¿Qué es esto? (pantallas 3, 12, 13 y 14). Ve una imagen y dice la
 * palabra. Al fallar se abre la siguiente pista en inglés (hasta tres) y
 * nunca se da la primera letra; sin pistas, Allison da la respuesta y el
 * alumno la repite. El aro: azul al preguntar, verde al acertar, dorado
 * con pista, azul al enseñar.
 */
type Fase = "pregunta" | "pista" | "bien" | "ensena" | "repetida";

export function QueEsEsto({
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
  const [fase, setFase] = useState<Fase>("pregunta");
  const [pistas, setPistas] = useState(0);
  const [intentos, setIntentos] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [oido, setOido] = useState<{ texto: string; pistaAntes: number; escrito: boolean } | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  /** Lo que explica Allison si dijo algo previsto (desde B1, en inglés con «En español»). */
  const [explicacion, setExplicacion] = useState<{ en: string; es?: string } | null>(null);
  const [miVoz, setMiVoz] = useState<string | null>(null);
  const b1 = desdeB1(ctx.nivel);

  useEffect(() => {
    const t = setTimeout(() => void decir(a.pregunta), 400);
    return () => clearTimeout(t);
  }, [a.pregunta, decir]);

  function abrirPista(n: number, antes?: string) {
    if (n > a.pistas.length) {
      ensenar(antes);
      return;
    }
    setPistas(n);
    setFase("pista");
    void (async () => {
      if (antes) await decir(antes, { espanol: !b1 });
      await decir(a.pistas[n - 1]);
    })();
  }

  function ensenar(antes?: string) {
    setFase("ensena");
    void (async () => {
      if (antes) await decir(antes, { espanol: !b1 });
      await decir(`${a.respuesta}. Say it: ${a.respuesta}.`);
    })();
  }

  async function responder(e: Entrada) {
    setMensaje(null);
    if ("url" in e) setMiVoz(e.url);
    // Después de que Allison enseña, el alumno la repite una vez: no se califica.
    if (fase === "ensena") {
      setFase("repetida");
      return;
    }
    setOcupado(true);
    const r: ResultadoEvaluacion = await evaluar(ctx, a.paso, e);
    setOcupado(false);
    if (r.sinSaldo) return onSinSaldo();
    if (r.error) return setMensaje(r.error);
    if (r.sinVoz) return setMensaje("No te oí. Inténtalo otra vez.");

    setIntentos((n) => n + 1);
    if (r.correcto) {
      setFase("bien");
      void decir(`Yes! ${a.respuesta}!`);
      return;
    }
    setOido({ texto: r.transcripcion, pistaAntes: pistas, escrito: "texto" in e });
    if (r.espanol) {
      // Lo entendió: se acepta como comprensión y se pide en inglés. Cuenta como pista.
      setMensaje(b1 ? "That's it! And in English?" : "¡Eso es! ¿Y en inglés?");
    }
    const exp = explicacionPara(a.explicaciones, r.transcripcion);
    setExplicacion(exp ? { en: exp.explicacion, es: exp.es } : null);
    abrirPista(pistas + 1, exp?.explicacion);
  }

  /** "¿No dijiste eso?": el micrófono entendió mal y el intento no cuenta. */
  function noDijeEso() {
    if (!oido) return;
    setPistas(oido.pistaAntes);
    setFase(oido.pistaAntes ? "pista" : "pregunta");
    setIntentos((n) => Math.max(0, n - 1));
    setOido(null);
    setMensaje(null);
    setExplicacion(null);
  }

  const terminado = fase === "bien" || fase === "repetida";
  const aro = fase === "bien" ? "bien" : fase === "pista" ? "pista" : "pregunta";
  const letras = a.respuesta.replace(/[.!?]/g, "");

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-center gap-4">
        {fase !== "bien" && <Ondas activas={hablando} />}
        <AllisonAro tam={fase === "pregunta" ? 72 : 92} aro={aro} hablando={hablando} />
        {fase !== "bien" && <Ondas activas={hablando} />}
      </div>

      <div className="text-center">
        <h2
          className={`text-[22px] font-black text-balance ${fase === "bien" ? "text-menta" : fase === "pista" ? "text-oro" : ""}`}
        >
          {fase === "bien"
            ? `Yes! ${a.respuesta}!`
            : fase === "pista"
              ? "Almost! Here is a clue."
              : fase === "ensena" || fase === "repetida"
                ? a.respuesta
                : a.pregunta}
        </h2>
      </div>

      <div className="relative grid h-48 place-items-center overflow-hidden rounded-3xl bg-superficie-2">
        {a.imagen ? (
          <span className="absolute inset-0">
            <IlustracionCompleta nombre={a.imagen} alt="La imagen de la pregunta" alto="h-full" nivel={ctx.nivel} flecha={a.flecha} />
          </span>
        ) : (
          <TextoDibujado texto={a.texto ?? ""} />
        )}
        {fase === "bien" && (
          <span className="absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-menta text-white">
            <Icono nombre="check" className="size-5 stroke-[3]" />
          </span>
        )}
      </div>

      {pistas > 0 && fase !== "bien" && fase !== "ensena" && fase !== "repetida" && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-oro bg-oro-suave px-3 py-2.5 text-oro">
          <BotonOir onClick={() => void decir(a.pistas[pistas - 1])} />
          <div className="leading-tight">
            <small className="text-[11.5px] font-extrabold tracking-wide uppercase">
              Pista {pistas} de {a.pistas.length}
            </small>
            <b className="block text-lg font-extrabold text-texto">{a.pistas[pistas - 1]}</b>
          </div>
        </div>
      )}

      <Rayas
        texto={letras}
        llenas={fase === "bien" || fase === "ensena" || fase === "repetida"}
        tono={fase === "bien" ? "menta" : "primario"}
      />

      {explicacion && !terminado && (
        <div className="rounded-2xl bg-oro-suave px-4 py-2.5 text-center text-sm font-bold text-oro">
          <Explicado en={explicacion.en} es={explicacion.es} />
        </div>
      )}
      {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}
      {oido && fase === "pista" && (
        <p className="text-center text-[13px] font-semibold text-texto-suave">
          {oido.escrito ? "Escribiste" : "Oí"}: &ldquo;{oido.texto}&rdquo;
          {!oido.escrito && (
            <>
              {" · "}
              <button type="button" onClick={noDijeEso} className="font-extrabold text-primario underline">
                ¿No dijiste eso?
              </button>
            </>
          )}
        </p>
      )}

      {fase === "ensena" && (
        <div className="flex justify-center gap-2">
          <BotonOir onClick={() => void decir(a.respuesta)} texto="Normal" />
          <BotonOir onClick={() => void decir(a.respuesta, { lento: true })} texto="Lento" lento />
        </div>
      )}
      {(fase === "ensena" || fase === "repetida") && (
        <p className="text-center text-[13px] font-semibold text-texto-suave">Esta palabra vuelve a salir más adelante.</p>
      )}

      {terminado ? (
        <Hoja
          tono={fase === "bien" ? "bien" : "ensena"}
          titulo={fase === "bien" ? "¡Muy bien!" : "¡Bien! Así se dice."}
          boton="Continuar"
          onBoton={() =>
            onTerminar({
              calificadas: 1,
              aciertos: fase === "bien" && intentos === 1 ? 1 : 0,
              fallos: fase === "bien" ? [] : [a.respuesta],
            })
          }
        >
          <div className="flex flex-wrap gap-2">
            <BotonOir onClick={() => void decir(a.respuesta)} texto="Oír la palabra" />
            {miVoz && <BotonOir onClick={() => oirGrabacion(miVoz)} texto="Oír mi voz" />}
          </div>
        </Hoja>
      ) : (
        <>
          {fase !== "ensena" && (
            <button type="button" onClick={() => ensenar()} disabled={ocupado} className="self-center text-[13px] font-extrabold text-texto-suave underline disabled:opacity-40">
              No sé
            </button>
          )}
          <Grabador
            onEntrada={responder}
            ocupado={ocupado}
            ayuda={fase === "ensena" ? `Say it: ${a.respuesta}` : fase === "pista" ? "Toca e inténtalo de nuevo" : "Toca y di la palabra en inglés"}
          />
        </>
      )}
    </div>
  );
}

/** Una raya por cada letra; se llenan al acertar (verde) o al enseñar (azul). */
function Rayas({ texto, llenas, tono }: { texto: string; llenas: boolean; tono: "menta" | "primario" }) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const letras = texto.replace(/\s/g, "").length;
  return (
    <div
      className="flex flex-wrap justify-center gap-x-5 gap-y-2"
      role="img"
      aria-label={llenas ? texto : `La respuesta tiene ${letras} letras`}
    >
      {palabras.map((p, i) => (
        <span key={i} className="flex gap-1.5">
          {[...p].map((c, j) => (
            <i
              key={j}
              className={`w-6 border-b-[3px] pb-0.5 text-center text-xl font-black not-italic ${
                llenas ? (tono === "menta" ? "border-menta text-menta" : "border-primario text-primario") : "h-8 border-texto-suave"
              }`}
            >
              {llenas ? c.toUpperCase() : ""}
            </i>
          ))}
        </span>
      ))}
    </div>
  );
}

/** Lo que la app dibuja cuando no hay ilustración: un reloj ("10:00") o una tarjeta. */
function TextoDibujado({ texto }: { texto: string }) {
  const hora = texto.match(/^(\d{1,2}):(\d{2})$/);
  if (hora) {
    return (
      <span className="grid size-40 place-items-center">
        <Reloj horas={Number(hora[1])} minutos={Number(hora[2])} etiqueta={`Un reloj que marca las ${texto}`} />
      </span>
    );
  }
  return <span className="text-4xl font-black tracking-wide">{texto}</span>;
}
