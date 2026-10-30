"use client";

import { useEffect, useMemo, useState } from "react";
import { conPunto } from "@/lib/habla";
import { palabrasEnOrden, primeraDeLaParte } from "@/lib/ruta/dilo";
import type { Dilo as Datos } from "@/lib/ruta/tipos";
import { desdeB1 } from "@/lib/tipos";
import { desbloquearVoz } from "@/lib/voz";
import { evaluar, type Contexto, type FinActividad } from "./api";
import {
  AllisonAro,
  BotonOir,
  Explicado,
  Grabador,
  Hoja,
  IlustracionCompleta,
  NoDijeEso,
  desordenar,
  explicacionPara,
  oirGrabacion,
  useVoz,
  type Entrada,
} from "./comun";
import { Ondas } from "./EscuchaElige";

type Explicacion = { en: string; es?: string };

/**
 * Dilo en inglés (pantalla 6): una frase en español con su dibujo y las
 * palabras en inglés desordenadas como apoyo. Al fallar se marca la
 * primera palabra que falla; al segundo fallo Allison dice la frase y el
 * alumno la repite. Desde A2 las palabras de apoyo aparecen solo después
 * del primer fallo (Contenido A2, "Qué cambia en A2"). Desde B1 no hay
 * palabras de apoyo: la frase tiene dos partes y, al primer fallo, Allison
 * da solo la primera palabra de la parte que falló; lo que explica va en
 * inglés, con «En español» (Contenido B1).
 */
export function Dilo({
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
  const b1 = desdeB1(ctx.nivel) && a.palabras.length === 0;
  // La línea de la frase: las palabras de apoyo o, sin ellas (B1), las de la respuesta.
  const linea = useMemo(() => (a.palabras.length ? a.palabras : a.respuesta.split(/\s+/)), [a.palabras, a.respuesta]);
  const chips = useMemo(() => desordenar(a.palabras, a.respuesta), [a.palabras, a.respuesta]);
  const [enLinea, setEnLinea] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [fase, setFase] = useState<"pregunta" | "pista" | "bien" | "ensena" | "repetida">("pregunta");
  const [explicacion, setExplicacion] = useState<Explicacion | null>(null);
  /** Al acertar con una forma que la app dice distinto: la nota «Good!…». */
  const [notaBuena, setNotaBuena] = useState<Explicacion | null>(null);
  /** B1: la primera palabra de la parte que falló. */
  const [empieza, setEmpieza] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [oido, setOido] = useState<{
    texto: string;
    escrito: boolean;
    antes: { fase: typeof fase; fallos: number; enLinea: number; explicacion: Explicacion | null; empieza: string | null };
  } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [miVoz, setMiVoz] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => void decir("How do you say…?"), 400);
    return () => clearTimeout(t);
  }, [decir]);

  /** Desde B1 Allison explica en inglés; antes, en español. */
  const decirExplicacion = (texto: string) => decir(texto, { espanol: !b1 });

  async function responder(e: Entrada) {
    setMensaje(null);
    if ("url" in e) setMiVoz(e.url);
    if (fase === "ensena") {
      setFase("repetida");
      setEnLinea(linea.length);
      return;
    }
    setOcupado(true);
    const r = await evaluar(ctx, a.paso, e);
    setOcupado(false);
    if (r.sinSaldo) return onSinSaldo();
    if (r.error) return setMensaje(r.error);
    if (r.sinVoz) return setMensaje("No te oí. Inténtalo otra vez.");

    if (r.correcto) {
      setEnLinea(linea.length);
      setFase("bien");
      // Una forma que vale pero que la app dice distinto («If I was you»): la nota «Good!…» del documento.
      const nota = explicacionPara(a.explicaciones?.filter((x) => /^good!/i.test(x.explicacion)), r.transcripcion);
      setNotaBuena(nota ? { en: nota.explicacion, es: nota.es } : null);
      void (async () => {
        if (nota && !(await decirExplicacion(nota.explicacion))) return;
        await decir(a.respuesta);
      })();
      return;
    }
    setOido({ texto: r.transcripcion, escrito: "texto" in e, antes: { fase, fallos, enLinea, explicacion, empieza } });
    const n = fallos + 1;
    setFallos(n);
    const exp = explicacionPara(a.explicaciones, r.transcripcion, a.respuesta);
    setExplicacion(
      exp
        ? { en: exp.explicacion, es: exp.es }
        : r.espanol
          ? // Sin "¡Eso es!": lo dicho en español no se comprueba (auditoría, 28 de octubre de 2026).
            b1
            ? { en: "You said it in Spanish. Now say it in English.", es: "Lo dijiste en español. Ahora dilo en inglés." }
            : { en: "Lo dijiste en español. Ahora dilo en inglés." }
          : null
    );
    if (n >= 2) {
      setFase("ensena");
      setEmpieza(null);
      setEnLinea(linea.length);
      // La explicación va primero, entera; después Allison enseña la frase
      // (una sola voz a la vez, sin cortarse).
      void (async () => {
        // Si cortó la explicación (tocó el micrófono, salió), no sigue.
        if (exp && !(await decirExplicacion(exp.explicacion))) return;
        await decir(`${conPunto(a.respuesta)} Say it: ${conPunto(a.respuesta)}`);
      })();
    } else {
      // Se marca hasta dónde iba bien y la primera palabra que falla.
      setEnLinea(Math.min(linea.length - 1, Math.max(b1 ? 0 : 1, palabrasEnOrden(linea, r.transcripcion))));
      setFase("pista");
      if (b1 && a.partes?.length) {
        const palabra = primeraDeLaParte(a.partes, r.transcripcion);
        setEmpieza(palabra);
        void (async () => {
          if (exp && !(await decirExplicacion(exp.explicacion))) return;
          await decir(`Start with: ${palabra}…`);
        })();
      } else if (exp) void decirExplicacion(exp.explicacion);
    }
  }

  /** "¿No dijiste eso?": el micrófono entendió mal y el intento no cuenta. */
  function noDijeEso() {
    if (!oido) return;
    setFase(oido.antes.fase);
    setFallos(oido.antes.fallos);
    setEnLinea(oido.antes.enLinea);
    setExplicacion(oido.antes.explicacion);
    setEmpieza(oido.antes.empieza);
    setOido(null);
  }

  const colocadas = linea.slice(0, enLinea);
  const usadas = new Map<string, number>();
  colocadas.forEach((w) => usadas.set(w, (usadas.get(w) ?? 0) + 1));
  const terminado = fase === "bien" || fase === "repetida";
  const conApoyo = !b1 && (ctx.nivel === "A1" || fallos > 0);
  const tonoLinea = fase === "bien" ? "bg-menta-suave text-menta" : fase === "ensena" || fase === "repetida" ? "bg-primario-suave text-primario" : "bg-menta-suave text-menta";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-center gap-4">
        <Ondas activas={hablando} />
        <AllisonAro tam={72} aro={fase === "bien" ? "bien" : fase === "pista" ? "pista" : "pregunta"} hablando={hablando} />
        <Ondas activas={hablando} />
      </div>
      <div className="text-center">
        <h2 className="text-[21px] font-black">How do you say…?</h2>
        <p className="text-sm font-semibold text-texto-suave">¿Cómo se dice…?</p>
      </div>

      <div className="flex flex-col gap-2 rounded-3xl bg-superficie-2 p-2.5 text-center">
        {a.imagen && (
          <IlustracionCompleta nombre={a.imagen} alt="" alto="h-32" nivel={ctx.nivel} />
        )}
        <b className="text-[23px] leading-tight font-black">{a.espanol}</b>
      </div>

      <div
        className={`flex min-h-12 flex-wrap items-end justify-center gap-2 border-b-2 pb-2.5 ${terminado ? "border-menta" : "border-borde"}`}
        aria-label={colocadas.length ? `Tu frase: ${colocadas.join(" ")}` : "Tu frase, todavía vacía"}
      >
        {linea.map((w, i) =>
          i < enLinea ? (
            <span key={i} className={`rounded-xl px-3 py-1.5 text-lg font-extrabold ${tonoLinea}`}>
              {w}
            </span>
          ) : (
            <i
              key={i}
              className={`h-9 rounded-xl border-[1.5px] border-dashed ${b1 ? "w-8" : "w-11"} ${
                fase === "pista" && i === enLinea ? "border-oro bg-oro-suave" : "border-borde"
              }`}
            />
          )
        )}
      </div>

      {!terminado && b1 && !empieza && (
        <p className="text-center text-[13px] font-bold text-texto-suave">Dilo sin ayuda: es una frase de dos partes.</p>
      )}
      {!terminado && b1 && empieza && fase === "pista" && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-oro bg-oro-suave px-3 py-2.5 text-oro">
          <BotonOir onClick={() => void decir(`Start with: ${empieza}…`)} />
          <div className="leading-tight">
            <small className="text-[11.5px] font-extrabold tracking-wide uppercase">Pista</small>
            <b className="block text-lg font-extrabold text-texto">Start with: {empieza}…</b>
          </div>
        </div>
      )}
      {!terminado && !b1 && !conApoyo && (
        <p className="text-center text-[13px] font-bold text-texto-suave">Dilo sin ayuda. Si te equivocas, aparecen las palabras.</p>
      )}
      {!terminado && conApoyo && (
        <>
          <span className="text-center text-xs font-extrabold tracking-[0.08em] text-texto-suave uppercase">Usa estas palabras</span>
          {/* Cada palabra suena al tocarla, como las opciones de Escucha y elige (30 de octubre de 2026). */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {chips.map((w, i) => {
              const quedan = usadas.get(w) ?? 0;
              const usada = quedan > 0;
              if (usada) usadas.set(w, quedan - 1);
              // Sin el signo pegado ("you.", "name?"): delataba qué palabra va al final.
              const palabra = w.replace(/[.,!?;:]+$/, "");
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    desbloquearVoz();
                    void decir(palabra);
                  }}
                  aria-label={`Oír «${palabra}»`}
                  className={`rounded-xl px-3.5 py-1.5 text-lg font-extrabold transition active:scale-95 ${
                    usada ? "border-[1.5px] border-dashed border-borde text-borde" : "bg-superficie-2"
                  }`}
                >
                  {palabra}
                </button>
              );
            })}
          </div>
          <span className="text-center text-[12px] font-semibold text-texto-suave">Toca una palabra para oírla.</span>
        </>
      )}

      {explicacion && !terminado && (
        <div className="rounded-2xl bg-oro-suave px-4 py-2.5 text-center text-sm font-bold text-oro">
          <Explicado en={explicacion.en} es={explicacion.es} />
        </div>
      )}
      {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}
      {oido && !terminado && <NoDijeEso oido={oido.texto} escrito={oido.escrito} onClick={noDijeEso} />}
      {fase === "ensena" && (
        <div className="flex justify-center gap-2">
          <BotonOir onClick={() => void decir(a.respuesta)} texto="Normal" />
          <BotonOir onClick={() => void decir(a.respuesta, { lento: true })} texto="Lento" lento />
        </div>
      )}

      {terminado ? (
        <Hoja
          tono={fase === "bien" ? "bien" : "ensena"}
          titulo={a.respuesta}
          boton="Continuar"
          onBoton={() =>
            onTerminar({ calificadas: 1, aciertos: fase === "bien" && fallos === 0 ? 1 : 0, fallos: fase === "bien" ? [] : [a.respuesta] })
          }
        >
          <span>{fase === "bien" ? `¡Perfecto! Así se dice "${a.espanol}"` : "Esta frase vuelve a salir más adelante."}</span>
          {fase === "bien" && notaBuena && (
            <div className="rounded-2xl bg-oro-suave px-4 py-2.5 text-center text-sm font-bold text-oro">
              <Explicado en={notaBuena.en} es={notaBuena.es} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <BotonOir onClick={() => void decir(a.respuesta)} texto="Oír la frase" />
            {miVoz && <BotonOir onClick={() => oirGrabacion(miVoz)} texto="Oír mi voz" />}
          </div>
        </Hoja>
      ) : (
        <Grabador
          onEntrada={responder}
          ocupado={ocupado}
          ayuda={fase === "ensena" ? "Repite la frase" : fase === "pista" ? "Toca e inténtalo de nuevo" : "Toca y di la frase en orden"}
        />
      )}
    </div>
  );
}
