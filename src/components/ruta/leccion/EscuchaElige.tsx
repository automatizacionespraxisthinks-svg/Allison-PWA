"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { encuadreZona, escalaZona, srcIlustracion } from "@/lib/ruta/ilustracion";
import type { EscuchaElige as Datos, Zona } from "@/lib/ruta/tipos";
import { desdeB1, type Nivel } from "@/lib/tipos";
import { Icono } from "../Iconos";
import type { Contexto, FinActividad } from "./api";
import { AllisonAro, BotonOir, Hoja, useVoz } from "./comun";

/**
 * Escucha y elige (pantallas 1 y 2): oye la frase, que no está escrita,
 * y elige entre tres imágenes. Gratis: no usa IA. Si falla, la frase
 * vuelve a sonar despacio y elige otra vez, sin límite. En A1, al acertar
 * aparece la frase con su traducción; desde A2 la traducción queda a un
 * toque, no aparece sola (Contenido A2, "Qué cambia en A2"). Desde B1 es
 * una historia de tres o cuatro frases sin traducción ni texto a la vista:
 * se puede oír otra vez y, una sola vez, más despacio (Contenido B1).
 */
export function EscuchaElige({
  a,
  ctx,
  onTerminar,
}: {
  a: Datos;
  ctx: Contexto;
  onTerminar: (f: FinActividad) => void;
}) {
  const { decir, hablando } = useVoz(ctx.nivel);
  const [elegida, setElegida] = useState<number | null>(null);
  const [verFrase, setVerFrase] = useState(false);
  const [acierto, setAcierto] = useState(false);
  const [fallidas, setFallidas] = useState<number[]>([]);
  const [verTraduccion, setVerTraduccion] = useState(ctx.nivel === "A1");
  const b1 = desdeB1(ctx.nivel);
  /** B1: la versión más despacio suena una sola vez (al pedirla o al fallar). */
  const [lentoUsado, setLentoUsado] = useState(false);
  const primerIntento = useRef(true);
  const frase = a.audio.join(" ");
  /** Dos opciones con la misma foto y sin su zona marcada: solo se distinguen por la descripción. */
  const sinDistinguir = (o: Datos["opciones"][number]) =>
    !!o.imagen && !o.zona && a.opciones.filter((x) => x.imagen === o.imagen).length > 1;

  // La frase suena sola al entrar.
  useEffect(() => {
    const t = setTimeout(() => void decir(frase), 400);
    return () => clearTimeout(t);
  }, [decir, frase]);

  function comprobar() {
    if (elegida === null) return;
    if (elegida === a.correcta) {
      setAcierto(true);
      void decir(frase);
    } else {
      primerIntento.current = false;
      setFallidas((f) => [...f, elegida]);
      setElegida(null);
      if (b1 && lentoUsado) void decir(frase);
      else {
        setLentoUsado(true);
        void decir(frase, { lento: true });
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-[21px] font-black text-balance">{a.pregunta ?? "¿Qué dice Allison?"}</h2>
      <div className="flex items-center justify-center gap-4">
        <Ondas activas={hablando} />
        <AllisonAro tam={84} aro={acierto ? "bien" : fallidas.length ? "pista" : "pregunta"} hablando={hablando} />
        <Ondas activas={hablando} />
      </div>
      {!acierto && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <BotonOir onClick={() => void decir(frase)} texto="Oír otra vez" />
          {!(b1 && lentoUsado) && (
            <BotonOir
              onClick={() => {
                setLentoUsado(true);
                void decir(frase, { lento: true });
              }}
              texto="Más despacio"
              lento
            />
          )}
          {!b1 && (
            <button
              type="button"
              onClick={() => setVerFrase(true)}
              className="rounded-full border border-borde px-3.5 py-2 text-[13px] font-extrabold"
            >
              Ver la frase
            </button>
          )}
        </div>
      )}
      {verFrase && !acierto && <p className="text-center text-xl font-black">{frase}</p>}
      {fallidas.length > 0 && !acierto && (
        <p className="text-center text-sm font-bold text-oro">{b1 ? "¡Casi! Escúchala otra vez y elige." : "¡Casi! Escúchala despacio y elige otra vez."}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {a.opciones.map((o, i) => {
          const ok = acierto && i === a.correcta;
          const sel = elegida === i;
          const descartada = fallidas.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={acierto || descartada}
              onClick={() => setElegida(i)}
              aria-pressed={sel}
              className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl text-center text-xs font-extrabold transition disabled:cursor-default ${
                ok ? "text-menta" : sel ? "text-primario" : "text-texto-suave"
              } ${descartada ? "opacity-40" : ""}`}
            >
              <span
                className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border-2 bg-superficie-2 ${
                  ok ? "border-menta" : sel ? "border-primario" : "border-transparent"
                }`}
              >
                <Opcion o={o} nivel={ctx.nivel} />
                {ok && (
                  <span className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-menta text-white">
                    <Icono nombre="check" className="size-4 stroke-[3]" />
                  </span>
                )}
              </span>
              {/* La descripción delata la respuesta ("Tom, un muchacho…"): solo se
                  muestra cuando dos opciones usan la misma foto y no tienen zona
                  (con zona, cada tarjeta ya muestra ampliada a su persona). */}
              {sinDistinguir(o) && <span className="line-clamp-2">{o.descripcion}</span>}
            </button>
          );
        })}
      </div>

      {acierto ? (
        <Hoja
          tono="bien"
          titulo={frase}
          boton="Continuar"
          onBoton={() => onTerminar({ calificadas: 1, aciertos: primerIntento.current ? 1 : 0, fallos: [] })}
        >
          {a.audio.map((linea, i) => (
            <span key={i} className="flex items-center gap-2 text-texto">
              <BotonOir tam="chico" onClick={() => void decir(linea)} />
              <span>
                <b className="font-extrabold">{linea}</b>
                {verTraduccion && a.traduccion[i] && <span className="block text-texto-suave">{a.traduccion[i]}</span>}
              </span>
            </span>
          ))}
          {!verTraduccion && a.traduccion.length > 0 && (
            <button type="button" onClick={() => setVerTraduccion(true)} className="self-start text-[13px] font-extrabold text-primario underline">
              Ver la traducción
            </button>
          )}
        </Hoja>
      ) : (
        <button
          type="button"
          disabled={elegida === null}
          onClick={comprobar}
          className="degradado-primario sombra-accion rounded-2xl px-6 py-3.5 font-extrabold text-white disabled:opacity-40 disabled:shadow-none"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Las barras de onda junto a la foto de Allison mientras habla. */
export function Ondas({ activas }: { activas: boolean }) {
  return (
    <span className="flex h-7 items-center gap-1" aria-hidden>
      {[10, 18, 26, 18, 10].map((alto, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-primario opacity-75"
          style={{
            height: alto,
            transformOrigin: "center",
            animation: activas ? `barra-sonando 0.9s ease-in-out ${i * 0.12}s infinite` : undefined,
            transform: activas ? undefined : "scaleY(0.4)",
          }}
        />
      ))}
    </span>
  );
}

/** Una opción: la ilustración, o lo que la app dibuja (un reloj, una tarjeta). */
function Opcion({ o, nivel }: { o: { imagen?: string; texto?: string; descripcion: string; zona?: Zona }; nivel: Nivel }) {
  const [sinImagen, setSinImagen] = useState(false);
  if (o.imagen && !sinImagen) {
    const escala = o.zona ? escalaZona(o.zona) : 1;
    const dibujo = (
      <Image
        src={srcIlustracion(o.imagen, nivel)}
        alt={o.descripcion}
        fill
        sizes={`(max-width: 640px) ${Math.round(33 * escala)}vw, ${Math.round(170 * escala)}px`}
        className="object-cover"
        // Una ilustración que todavía no se ha producido: se dice qué representa.
        onError={() => setSinImagen(true)}
      />
    );
    // Una persona de una foto con varias: se ve ampliada su parte.
    return o.zona ? (
      <span className="absolute" style={encuadreZona(o.zona)}>
        {dibujo}
      </span>
    ) : (
      dibujo
    );
  }
  if (o.imagen) return <span className="px-2 text-[12px] leading-tight font-extrabold text-texto-suave">{o.descripcion}</span>;
  const hora = o.texto?.match(/^(\d{1,2}):(\d{2})$/);
  if (hora) return <Reloj horas={Number(hora[1])} minutos={Number(hora[2])} etiqueta={o.descripcion} />;
  // Las tarjetas de B1 llevan frases ("He made a thank-you card."): letra más chica.
  if ((o.texto?.length ?? 0) > 12) {
    return <span className="px-1.5 text-[13px] leading-tight font-extrabold text-texto sm:text-[15px]">{o.texto}</span>;
  }
  return <span className="px-1 text-lg font-black tracking-wide text-texto sm:text-xl">{o.texto}</span>;
}

/** Un reloj de manecillas, sin números (como en las ilustraciones aprobadas). */
export function Reloj({ horas, minutos, etiqueta }: { horas: number; minutos: number; etiqueta: string }) {
  const aMin = (minutos / 60) * 360;
  const aHora = ((horas % 12) / 12) * 360 + (minutos / 60) * 30;
  const punta = (ang: number, largo: number) => {
    const r = ((ang - 90) * Math.PI) / 180;
    return [50 + Math.cos(r) * largo, 50 + Math.sin(r) * largo];
  };
  const [hx, hy] = punta(aHora, 22);
  const [mx, my] = punta(aMin, 32);
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={etiqueta} className="size-[78%]">
      <circle cx="50" cy="50" r="44" fill="var(--superficie)" stroke="var(--texto)" strokeWidth="4" />
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = punta(i * 30, 37);
        const [x2, y2] = punta(i * 30, 41);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--texto-suave)" strokeWidth={i % 3 === 0 ? 3 : 1.5} />;
      })}
      <line x1="50" y1="50" x2={hx} y2={hy} stroke="var(--texto)" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="50" x2={mx} y2={my} stroke="var(--primario)" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3.5" fill="var(--texto)" />
    </svg>
  );
}
