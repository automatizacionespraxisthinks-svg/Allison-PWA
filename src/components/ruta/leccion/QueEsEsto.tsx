"use client";

import { useEffect, useMemo, useState } from "react";
import { conPunto } from "@/lib/habla";
import { letraDicha, llevaRaya, lugar, lugaresDeLetra, palabrasDeFrase, respuestaCompleta } from "@/lib/ruta/rayas";
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
 *
 * En A1 y A2 las rayas se van llenando: una palabra de la respuesta que
 * dijo se queda puesta y una letra dicha o escrita aparece en su lugar.
 * Ni lo uno ni lo otro abre pista. Con todo a la vista, acierta al decir
 * la frase completa (el orden cuenta). Buscar letras cuenta como ayuda:
 * ya no es acierto al primer intento. Una letra escrita se busca aquí
 * mismo, sin gastar intervención.
 */
type Fase = "pregunta" | "pista" | "bien" | "ensena" | "repetida";

/** "Yes! It's ten o'clock!": sin ".!" ni "?!" (salía en 37 de las 57; auditoría, 28 de octubre de 2026). */
const conExclamacion = (t: string) => (/\?\s*$/.test(t) ? t.trim() : `${t.trim().replace(/[.!]+$/, "")}!`);

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
  /** A1 y A2: la frase, una palabra o una letra van llenando las rayas. */
  const rellenar = !b1;
  const palabras = useMemo(() => palabrasDeFrase(a.respuesta), [a.respuesta]);
  /** Las palabras de la respuesta que ya dijo (desde 0). */
  const [dichas, setDichas] = useState<number[]>([]);
  /** Las rayas que llenó con letras ("palabra:letra"). */
  const [halladas, setHalladas] = useState<string[]>([]);
  const [conLetras, setConLetras] = useState(false);
  /** Lo que ya va bien ("¡Sí! Tiene la O."). */
  const [logro, setLogro] = useState<string | null>(null);
  /** Respuesta abierta ("Cualquier consejo con should…"): vale otra que no es la del ejemplo. */
  const abierta = /^cualquier/i.test(a.tambienSeAcepta ?? "");
  /** Acertó con otra respuesta buena, no con la del ejemplo. */
  const [otraBuena, setOtraBuena] = useState(false);

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
      // Si cortó la explicación (tocó el micrófono o "No sé", salió), no sigue.
      if (antes && !(await decir(antes, { espanol: !b1 }))) return;
      await decir(a.pistas[n - 1]);
    })();
  }

  function ensenar(antes?: string) {
    setFase("ensena");
    void (async () => {
      if (antes && !(await decir(antes, { espanol: !b1 }))) return;
      await decir(`${conPunto(a.respuesta)} Say it: ${conPunto(a.respuesta)}`);
    })();
  }

  /** Una letra aparece en sus rayas, si la respuesta la tiene. No abre pista. */
  function probarLetra(letra: string) {
    const L = letra.toUpperCase();
    if (!lugaresDeLetra(palabras, letra).length) {
      setMensaje(`No tiene la ${L}. Prueba otra letra.`);
      return;
    }
    const nuevos = lugaresDeLetra(palabras, letra, dichas).filter((k) => !halladas.includes(k));
    if (!nuevos.length) {
      setLogro(`La ${L} ya está.`);
      return;
    }
    const ahora = [...halladas, ...nuevos];
    setHalladas(ahora);
    setConLetras(true);
    setLogro(respuestaCompleta(palabras, dichas, ahora) ? "¡Ya la tienes completa! Ahora dila en voz alta." : `¡Sí! Tiene la ${L}.`);
  }

  async function responder(e: Entrada) {
    setMensaje(null);
    setLogro(null);
    if ("url" in e) setMiVoz(e.url);
    // Después de que Allison enseña, el alumno la repite una vez: no se califica.
    if (fase === "ensena") {
      setFase("repetida");
      return;
    }
    // Una letra escrita se busca aquí mismo: no pasa por el servidor ni gasta.
    const escrita = rellenar && "texto" in e && e.texto.trim().length === 1 ? letraDicha(e.texto) : null;
    if (escrita) {
      setOido(null);
      probarLetra(escrita);
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
      // Una respuesta abierta ("Cualquier consejo con should") puede ser
      // otra buena: no se celebra la del ejemplo como si fuera la suya.
      if (abierta && !r.transcripcion.toLowerCase().includes(a.respuesta.toLowerCase().replace(/[.!?]+$/, ""))) setOtraBuena(true);
      setFase("bien");
      void decir(abierta ? "Yes! Good answer!" : `Yes! ${conExclamacion(a.respuesta)}`);
      return;
    }
    if (rellenar) {
      // Las palabras de la respuesta que dijo se quedan puestas. Con todas a
      // la vista falta decirla completa: el orden cuenta ("Can I try it
      // on?" no es "I can try it on").
      const nuevas =
        r.palabras.length === palabras.length
          ? r.palabras.flatMap((w, i) => (w.estado === "bien" && !dichas.includes(i) ? [i] : []))
          : [];
      if (nuevas.length) {
        const ahora = [...dichas, ...nuevas];
        setDichas(ahora);
        setOido(null);
        const faltan = palabras.length - ahora.length;
        setLogro(
          respuestaCompleta(palabras, ahora, halladas)
            ? "¡Ya la tienes completa! Ahora dila completa en voz alta."
            : `¡Bien! Ya tienes «${nuevas.map((i) => palabras[i]).join(" ")}». ${faltan === 1 ? "Te falta una palabra." : `Te faltan ${faltan} palabras.`}`
        );
        return;
      }
      const letra = letraDicha(r.transcripcion);
      if (letra) {
        setOido(null);
        probarLetra(letra);
        return;
      }
    }
    setOido({ texto: r.transcripcion, pistaAntes: pistas, escrito: "texto" in e });
    if (r.espanol) {
      // Lo entendió: se acepta como comprensión y se pide en inglés. Cuenta como pista.
      // Sin "¡Eso es!": lo dicho en español no se comprueba (auditoría, 28 de octubre de 2026).
      setMensaje(b1 ? "In English, please!" : "Lo dijiste en español. ¿Y en inglés?");
    }
    const exp = explicacionPara(a.explicaciones, r.transcripcion, a.respuesta);
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
            ? otraBuena
              ? "Yes! Good answer!"
              : `Yes! ${conExclamacion(a.respuesta)}`
            : fase === "pista"
              ? "Almost! Here is a clue."
              : fase === "ensena" || fase === "repetida"
                ? a.respuesta
                : a.pregunta}
        </h2>
        {a.contexto && (fase === "pregunta" || fase === "pista") && (
          <p className="mt-1 text-[15px] font-bold text-balance text-texto-suave">{a.contexto}</p>
        )}
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
        palabras={palabras}
        llenas={fase === "bien" || fase === "ensena" || fase === "repetida"}
        tono={fase === "bien" ? "menta" : "primario"}
        dichas={dichas}
        halladas={halladas}
      />
      {rellenar && (fase === "pregunta" || fase === "pista") && !respuestaCompleta(palabras, dichas, halladas) && (
        <p className="text-center text-[13px] font-semibold text-balance text-texto-suave">
          Di la frase completa, o una palabra o una letra: lo que aciertes se va llenando.
        </p>
      )}
      {logro && !terminado && fase !== "ensena" && <p className="text-center text-sm font-bold text-menta">{logro}</p>}

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
              {/* Mientras se revisa otro intento, no: abriría la pista equivocada. */}
              <button type="button" onClick={noDijeEso} disabled={ocupado} className="font-extrabold text-primario underline disabled:opacity-40">
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
        <p className="text-center text-[13px] font-semibold text-texto-suave">
          {palabras.length > 1 ? "Esta frase vuelve a salir más adelante." : "Esta palabra vuelve a salir más adelante."}
        </p>
      )}

      {terminado ? (
        <Hoja
          tono={fase === "bien" ? "bien" : "ensena"}
          titulo={fase === "bien" ? "¡Muy bien!" : "¡Bien! Así se dice."}
          boton="Continuar"
          onBoton={() =>
            onTerminar({
              calificadas: 1,
              aciertos: fase === "bien" && intentos === 1 && !conLetras ? 1 : 0,
              fallos: fase === "bien" ? [] : [a.respuesta],
            })
          }
        >
          <div className="flex flex-wrap gap-2">
            <BotonOir onClick={() => void decir(a.respuesta)} texto={palabras.length > 1 ? "Oír la frase" : "Oír la palabra"} />
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
            ayuda={
              fase === "ensena"
                ? `Say it: ${a.respuesta}`
                : fase === "pista"
                  ? "Toca e inténtalo de nuevo"
                  : palabras.length > 1
                    ? "Toca y dilo en inglés"
                    : "Toca y di la palabra en inglés"
            }
          />
        </>
      )}
    </div>
  );
}

/**
 * Una raya por cada letra; se llenan todas al acertar (verde) o al
 * enseñar (azul). Antes, las palabras que ya dijo salen en verde y las
 * letras que halló, en azul. El apóstrofo no lleva raya.
 */
function Rayas({
  palabras,
  llenas,
  tono,
  dichas,
  halladas,
}: {
  palabras: string[];
  llenas: boolean;
  tono: "menta" | "primario";
  dichas: number[];
  halladas: string[];
}) {
  const letras = palabras.join("").replace(/'/g, "").length;
  const color = (t: "menta" | "primario") => (t === "menta" ? "border-menta text-menta" : "border-primario text-primario");
  return (
    <div
      className="flex flex-wrap justify-center gap-x-5 gap-y-2"
      role="img"
      aria-label={llenas ? palabras.join(" ") : `La respuesta tiene ${letras} letras`}
    >
      {palabras.map((p, i) => (
        <span key={i} className="flex items-end gap-1.5">
          {[...p].map((c, j) => {
            if (!llevaRaya(c)) {
              return (
                <i key={j} className="text-xl font-black text-texto-suave not-italic">
                  {c}
                </i>
              );
            }
            const visto = llenas ? tono : dichas.includes(i) ? "menta" : halladas.includes(lugar(i, j)) ? "primario" : null;
            return (
              <i
                key={j}
                className={`min-h-8 w-6 border-b-[3px] pb-0.5 text-center text-xl font-black not-italic ${visto ? color(visto) : "border-texto-suave"}`}
              >
                {visto ? c.toUpperCase() : ""}
              </i>
            );
          })}
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
