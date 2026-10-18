"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Responde as Datos } from "@/lib/ruta/tipos";
import { desdeB1 } from "@/lib/tipos";
import { Icono } from "../Iconos";
import { evaluar, type Contexto, type FinActividad } from "./api";
import { BotonOir, Grabador, Hoja, NoDijeEso, useVoz, type Entrada } from "./comun";

interface Ronda {
  /** Índice de la pregunta en el contenido. */
  i: number;
  /** Ya salió una vez: vuelve al final de la ronda. */
  repetida: boolean;
}

interface Respuesta {
  i: number;
  dijo: string | null;
  bien: boolean;
}

/**
 * Responde rápido (pantalla 8): cinco preguntas seguidas con diez
 * segundos cada una. El reloj es un aro alrededor de la foto de Allison:
 * arranca cuando ella termina de preguntar y se detiene al tocar el
 * micrófono. Si se acaba el tiempo o la respuesta no corresponde, ve una
 * respuesta modelo y la pregunta vuelve al final de la ronda.
 */
export function Responde({
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
  const { decir } = useVoz(ctx.nivel);
  const [cola, setCola] = useState<Ronda[]>(() => a.preguntas.map((_, i) => ({ i, repetida: false })));
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [restante, setRestante] = useState(a.segundos);
  const [corriendo, setCorriendo] = useState(false);
  const [modelo, setModelo] = useState<string | null>(null);
  const [verEjemplo, setVerEjemplo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Las preguntas que ya fallaron una vez: no cuentan como acierto al primer intento. */
  const falladas = useRef(new Set<number>());
  /** Cada vez que Allison pregunta: una pregunta vieja que termina tarde no arranca su reloj. */
  const generacion = useRef(0);
  const [oido, setOido] = useState<{ texto: string; escrito: boolean; yaFallada: boolean } | null>(null);

  const actual = cola[0];
  const pregunta = actual ? a.preguntas[actual.i] : null;

  const parar = useCallback(() => {
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
    setCorriendo(false);
  }, []);

  const siguiente = useCallback(
    (bien: boolean, dijo: string | null) => {
      parar();
      if (!actual) return;
      setRespuestas((r) => [...r.filter((x) => x.i !== actual.i), { i: actual.i, dijo, bien }]);
      setCola((c) => {
        const resto = c.slice(1);
        // La que falló vuelve al final, una sola vez.
        return !bien && !actual.repetida ? [...resto, { i: actual.i, repetida: true }] : resto;
      });
    },
    [actual, parar]
  );

  // Cada pregunta: Allison pregunta y después arranca el reloj.
  const preguntar = useCallback(async () => {
    if (!pregunta) return;
    const mia = ++generacion.current;
    parar();
    setRestante(a.segundos);
    setVerEjemplo(false);
    await decir(pregunta.pregunta);
    if (mia !== generacion.current) return;
    parar();
    setCorriendo(true);
    const inicio = Date.now();
    reloj.current = setInterval(() => {
      if (mia !== generacion.current) return;
      const quedan = Math.max(0, a.segundos - Math.floor((Date.now() - inicio) / 1000));
      setRestante(quedan);
      if (quedan === 0) {
        parar();
        falladas.current.add(actual!.i);
        setModelo(pregunta.modelo);
      }
    }, 250);
  }, [a.segundos, actual, decir, parar, pregunta]);

  useEffect(() => {
    if (!actual || modelo) return;
    const t = setTimeout(() => void preguntar(), 350);
    return () => clearTimeout(t);
    // Solo al cambiar de pregunta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual?.i, actual?.repetida, modelo === null]);

  useEffect(
    () => () => {
      generacion.current++;
      parar();
    },
    [parar]
  );

  async function responder(e: Entrada) {
    generacion.current++;
    parar();
    setMensaje(null);
    setOido(null);
    if (!actual || !pregunta) return;
    setOcupado(true);
    const r = await evaluar(ctx, a.paso, e, actual.i);
    setOcupado(false);
    if (r.sinSaldo) return onSinSaldo();
    if (r.error) {
      setMensaje(r.error);
      void preguntar();
      return;
    }
    if (r.sinVoz) {
      setMensaje("No te oí. Inténtalo otra vez.");
      void preguntar();
      return;
    }
    if (r.correcto) {
      void decir("Good!");
      siguiente(true, r.transcripcion);
      return;
    }
    const yaFallada = falladas.current.has(actual.i);
    falladas.current.add(actual.i);
    if (r.espanol) {
      // Lo entendió: cuenta como pista y se le pide en inglés (plan, sección 5).
      setMensaje("¡Eso es! ¿Y en inglés?");
      void preguntar();
      return;
    }
    setOido({ texto: r.transcripcion, escrito: "texto" in e, yaFallada });
    setRespuestas((x) => [...x.filter((y) => y.i !== actual.i), { i: actual.i, dijo: r.transcripcion, bien: false }]);
    setModelo(pregunta.modelo);
  }

  /** "¿No dijiste eso?": el micrófono entendió mal; el intento no cuenta y la pregunta vuelve. */
  function noDijeEso() {
    if (!actual || !oido) return;
    if (!oido.yaFallada) falladas.current.delete(actual.i);
    setRespuestas((x) => x.filter((y) => y.i !== actual.i));
    setOido(null);
    setModelo(null);
  }

  const bien = respuestas.filter((r) => r.bien).length;
  const fin = !actual;

  if (fin) {
    const total = a.preguntas.length;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-3">
          <Image src="/allison.png" alt="Allison" width={56} height={56} className="aro-allison bien size-14 rounded-full object-cover" />
          <div className="rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2.5 font-extrabold">
            {bien * 2 >= total ? "Well done!" : "Nice try!"} {bien} out of {total}.
            {/* Desde B1 Allison habla en inglés: sin la línea en español debajo. */}
            {!desdeB1(ctx.nivel) && (
              <small className="block font-semibold text-texto-suave">
                {bien * 2 >= total ? "¡Bien hecho!" : "¡Buen intento!"} {bien} de {total}.
              </small>
            )}
          </div>
        </div>
        <ol className="flex flex-col gap-1.5">
          {a.preguntas.map((p, i) => {
            const r = respuestas.find((x) => x.i === i);
            const ok = !!r?.bien;
            return (
              <li
                key={i}
                className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 text-[14.5px] font-extrabold ${ok ? "bg-menta-suave" : "bg-oro-suave"}`}
              >
                <span
                  className={`grid size-6 flex-none place-items-center rounded-full text-xs font-black text-white ${ok ? "bg-menta" : "bg-oro"}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  {p.pregunta}
                  <b className={`block text-[13px] font-bold ${ok ? "text-menta" : "text-oro"}`}>
                    {r?.dijo ? `"${r.dijo}"` : "Sin respuesta"}
                    {!ok && ` · modelo: "${p.modelo}"`}
                  </b>
                </span>
              </li>
            );
          })}
        </ol>
        <Hoja
          tono="bien"
          titulo="¡Ronda terminada!"
          boton="Continuar"
          onBoton={() =>
            onTerminar({
              calificadas: total,
              aciertos: respuestas.filter((r) => r.bien && !falladas.current.has(r.i)).length,
              fallos: a.preguntas.filter((_, i) => !respuestas.find((r) => r.i === i)?.bien).map((p) => p.pregunta),
            })
          }
        />
      </div>
    );
  }

  const fraccion = restante / a.segundos;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-5 gap-2">
        {a.preguntas.map((_, i) => {
          const r = respuestas.find((x) => x.i === i);
          return (
            <i
              key={i}
              className={`rounded-xl py-2 text-center text-[15px] font-black not-italic ${
                actual?.i === i ? "bg-primario text-white" : r?.bien ? "bg-menta-suave text-menta" : r ? "bg-oro-suave text-oro" : "bg-superficie-2 text-texto-suave"
              }`}
            >
              {i + 1}
            </i>
          );
        })}
      </div>

      <div className="relative size-[150px] self-center">
        <svg viewBox="0 0 120 120" className="size-full" role="img" aria-label={`Quedan ${restante} de ${a.segundos} segundos`}>
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--superficie-2)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--oro)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(339 * fraccion).toFixed(1)} 339`}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dasharray 0.25s linear" }}
          />
        </svg>
        <Image src="/allison.png" alt="Allison" width={122} height={122} className="absolute inset-[14px] size-[122px] rounded-full object-cover" />
        <span className="absolute -right-0.5 -bottom-0.5 grid size-11 place-items-center rounded-full border-4 border-superficie bg-oro text-xl font-black text-superficie">
          {restante}
        </span>
      </div>

      <h2 className="text-center text-2xl font-black">{pregunta?.pregunta}</h2>

      {modelo ? (
        <Hoja tono="pista" titulo={restante === 0 ? "¡Se acabó el tiempo!" : "Casi. Así se puede responder:"} boton="Siguiente" onBoton={() => {
          setModelo(null);
          siguiente(false, respuestas.find((r) => r.i === actual?.i)?.dijo ?? null);
        }}>
          <span className="flex items-center gap-2 text-texto">
            <BotonOir tam="chico" onClick={() => void decir(modelo)} />
            <b className="text-lg font-extrabold">{modelo}</b>
          </span>
          {!actual?.repetida && <span>Esta pregunta vuelve al final de la ronda.</span>}
          {oido && <NoDijeEso oido={oido.texto} escrito={oido.escrito} onClick={noDijeEso} />}
        </Hoja>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            <BotonOir onClick={() => void preguntar()} texto="Oír de nuevo" />
            <button
              type="button"
              onClick={() => setVerEjemplo(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-borde px-3.5 py-2 text-[13px] font-extrabold"
            >
              <Icono nombre="idea" className="size-4" />
              Ejemplo
            </button>
          </div>
          {verEjemplo && pregunta && <p className="text-center text-sm font-bold text-texto-suave">Por ejemplo: &ldquo;{pregunta.modelo}&rdquo;</p>}
          {respuestas.length > 0 && (
            <p className="rounded-2xl bg-superficie-2 px-3 py-2 text-[13.5px] font-semibold text-texto-suave">
              <small className="block text-[11px] font-extrabold tracking-wide uppercase">Tu respuesta anterior</small>
              {a.preguntas[respuestas[respuestas.length - 1].i].pregunta} ·{" "}
              <b className="font-extrabold text-menta">&ldquo;{respuestas[respuestas.length - 1].dijo ?? "—"}&rdquo;</b>
            </p>
          )}
          {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}
          <Grabador
            onEntrada={responder}
            ocupado={ocupado}
            deshabilitado={!corriendo && !ocupado && restante === a.segundos}
            // El reloj se detiene al tocar el micrófono (pantalla 8), no al terminar de grabar.
            alEmpezar={() => {
              generacion.current++;
              parar();
            }}
            ayuda="Toca y responde ya"
          />
        </>
      )}
    </div>
  );
}
