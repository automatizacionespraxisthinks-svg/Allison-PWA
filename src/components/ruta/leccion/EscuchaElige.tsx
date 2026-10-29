"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { encuadreZona, escalaZona, srcIlustracion } from "@/lib/ruta/ilustracion";
import type { ColorDeTarjeta, EscuchaElige as Datos, DibujoOpcion, Zona } from "@/lib/ruta/tipos";
import { desdeB1, type Nivel } from "@/lib/tipos";
import { desbloquearVoz } from "@/lib/voz";
import { Icono } from "../Iconos";
import type { Contexto, FinActividad } from "./api";
import { AllisonAro, BotonOir, Hoja, desordenar, useVoz } from "./comun";
import { MapaCalles, edificioDe } from "./MapaCalles";

/**
 * Escucha y elige (pantallas 1 y 2): oye la frase, que no está escrita,
 * y elige entre tres imágenes. Gratis: no usa IA. Si falla, la frase
 * vuelve a sonar despacio y elige otra vez, sin límite.
 *
 * "Ver la frase" está desde el comienzo y cuenta como ayuda. La muestra en
 * inglés; la traducción queda a otro toque (28 de octubre de 2026): antes
 * en A1 traía la traducción de una vez y se acertaba leyendo en español,
 * sin oír nada.
 *
 * Al acertar aparece la frase con la etiqueta de la respuesta resaltada
 * ("a green hoodie"): se ve qué palabras la daban. En A1 trae su
 * traducción; desde A2 la traducción queda a un toque, no aparece sola
 * (Contenido A2, "Qué cambia en A2"). En A1 y A2 cada dibujo lleva su
 * etiqueta en inglés: un toque la dice en voz alta y muestra su
 * traducción. Desde B1 es una historia de tres o cuatro frases sin
 * traducción ni texto a la vista: se puede oír otra vez y, una sola vez,
 * más despacio (Contenido B1).
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
  const [verTraduccion, setVerTraduccion] = useState(false);
  /** Las etiquetas que el alumno tocó: ya se ven en español. */
  const [traducidas, setTraducidas] = useState<number[]>([]);
  const b1 = desdeB1(ctx.nivel);
  /** B1: la versión más despacio suena una sola vez (al pedirla o al fallar). */
  const [lentoUsado, setLentoUsado] = useState(false);
  const primerIntento = useRef(true);
  const frase = a.audio.join(" ");
  /**
   * El orden en pantalla, mezclado y estable para cada frase: en los
   * datos la correcta va primero en 38 de las 48 de A1, y tocar siempre
   * el primer dibujo acertaba (auditoría, 28 de octubre de 2026).
   */
  const orden = useMemo(() => desordenar(a.opciones.map((_, i) => i), frase), [a.opciones, frase]);
  /** Las opciones son edificios: un solo mapa donde se toca el edificio. */
  const mapa = a.opciones.every((o) => edificioDe(o));
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
      if (ctx.nivel === "A1") setVerTraduccion(true);
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
          {!b1 && !verFrase && (
            <button
              type="button"
              onClick={() => {
                // Con la frase a la vista ya no es acertar solo de oído:
                // cuenta como ayuda, como las letras en ¿Qué es esto?
                primerIntento.current = false;
                setVerFrase(true);
              }}
              className="rounded-full border border-borde px-3.5 py-2 text-[13px] font-extrabold"
            >
              Ver la frase
            </button>
          )}
        </div>
      )}
      {/* La frase en inglés; su traducción, a otro toque. */}
      {verFrase && !acierto && (
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Un diálogo va línea por línea, cada una con su traducción. */}
          {a.audio.map((linea, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <p className={`font-black text-balance ${a.audio.length > 1 ? "text-lg" : "text-xl"}`}>{linea}</p>
              {verTraduccion && a.traduccion[i] && (
                <p className="text-[15px] font-bold text-balance text-texto-suave">{a.traduccion[i]}</p>
              )}
            </div>
          ))}
          {!verTraduccion && a.traduccion.length > 0 && (
            <button type="button" onClick={() => setVerTraduccion(true)} className="text-[13px] font-extrabold text-primario underline">
              Ver la traducción
            </button>
          )}
        </div>
      )}
      {fallidas.length > 0 && !acierto && (
        <p className="text-center text-sm font-bold text-oro">
          {b1
            ? "¡Casi! Escúchala otra vez y elige."
            : mapa
              ? "¡Casi! Escúchala despacio y sigue el camino."
              : "¡Casi! Escúchala despacio y elige otra vez."}
        </p>
      )}

      {mapa ? (
        <MapaCalles
          opciones={a.opciones}
          parque={a.parque}
          orden={orden}
          elegida={elegida}
          fallidas={fallidas}
          correcta={a.correcta}
          acierto={acierto}
          onElegir={setElegida}
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {orden.map((i, posicion) => {
            const o = a.opciones[i];
            const ok = acierto && i === a.correcta;
            const sel = elegida === i;
            const descartada = fallidas.includes(i);
            const color = ok ? "text-menta" : sel ? "text-primario" : "text-texto-suave";
            // "Pizza" o "Chicago" se dicen igual en español: no hay nada que traducir.
            const traducible = !!o.etiquetaEs && o.etiquetaEs.toLowerCase() !== o.etiqueta?.toLowerCase();
            const traducida = traducidas.includes(i);
            return (
              <div key={i} className={`flex min-w-0 flex-col items-center gap-1 text-center ${descartada ? "opacity-40" : ""}`}>
                <button
                  type="button"
                  disabled={acierto || descartada}
                  onClick={() => setElegida(i)}
                  aria-pressed={sel}
                  className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border-2 bg-superficie-2 transition disabled:cursor-default ${
                    ok ? "border-menta" : sel ? "border-primario" : "border-transparent"
                  }`}
                >
                  {/* La descripción delata la respuesta ("Tom, un muchacho…"): no va de texto alternativo. */}
                  <Opcion o={o} nivel={ctx.nivel} alt={o.etiqueta ?? `Opción ${posicion + 1}`} />
                  {ok && (
                    <span className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-menta text-white">
                      <Icono nombre="check" className="size-4 stroke-[3]" />
                    </span>
                  )}
                </button>
                {/* La etiqueta va en inglés: un toque la dice en voz alta y muestra
                    su traducción, sin contar como ayuda. Nombra lo que muestra el
                    dibujo, sin decir cuál es la respuesta. La descripción sí la
                    delata ("Tom, un muchacho…"): solo se muestra cuando dos
                    opciones usan la misma foto y no tienen zona (con zona, cada
                    tarjeta ya muestra ampliada a su persona). */}
                {o.etiqueta ? (
                  <button
                    type="button"
                    onClick={() => {
                      desbloquearVoz();
                      void decir(o.etiqueta ?? "");
                      if (traducible && !traducida) setTraducidas((t) => [...t, i]);
                    }}
                    className={`px-1 py-0.5 text-[13px] leading-tight font-extrabold text-balance ${color}`}
                  >
                    <Icono nombre="play" className="mr-0.5 inline size-3 align-[-1px]" />
                    <span className="underline decoration-dotted underline-offset-[3px]">{o.etiqueta}</span>
                    {traducida && <span className="block pt-0.5 text-xs font-bold text-texto-suave">{o.etiquetaEs}</span>}
                  </button>
                ) : (
                  sinDistinguir(o) && <span className={`line-clamp-2 text-xs font-extrabold ${color}`}>{o.descripcion}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {acierto ? (
        <Hoja
          tono="bien"
          // La frase va abajo, línea por línea: de título salía dos veces.
          titulo="¡Muy bien!"
          boton="Continuar"
          onBoton={() => onTerminar({ calificadas: 1, aciertos: primerIntento.current ? 1 : 0, fallos: [] })}
        >
          {a.audio.map((linea, i) => (
            <span key={i} className="flex items-center gap-2 text-texto">
              <BotonOir tam="chico" onClick={() => void decir(linea)} />
              <span>
                <b className="font-extrabold">{conResaltado(linea, a.opciones[a.correcta]?.etiqueta)}</b>
                {verTraduccion && a.traduccion[i] && (
                  <span className="block text-texto-suave">{conResaltado(a.traduccion[i], a.opciones[a.correcta]?.etiquetaEs)}</span>
                )}
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

const LETRA = /\p{L}/u;

/**
 * La etiqueta de la respuesta resaltada dentro de la frase ("a green
 * hoodie", "un saco verde"), cuando está como palabras enteras. Si la
 * frase la dice de otra forma ("having breakfast" para "Have breakfast"),
 * va sin resaltar.
 */
function conResaltado(texto: string, etiqueta?: string): ReactNode {
  if (!etiqueta) return texto;
  const t = texto.toLowerCase();
  const e = etiqueta.toLowerCase();
  for (let i = t.indexOf(e); i >= 0; i = t.indexOf(e, i + 1)) {
    if (LETRA.test(t[i - 1] ?? "") || LETRA.test(t[i + e.length] ?? "")) continue;
    return (
      <>
        {texto.slice(0, i)}
        <mark className="rounded-md bg-menta px-1 text-superficie">{texto.slice(i, i + e.length)}</mark>
        {texto.slice(i + e.length)}
      </>
    );
  }
  return texto;
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
function Opcion({
  o,
  nivel,
  alt,
}: {
  o: { imagen?: string; texto?: string; dibujo?: DibujoOpcion; descripcion: string; zona?: Zona };
  nivel: Nivel;
  alt: string;
}) {
  const [sinImagen, setSinImagen] = useState(false);
  if (o.imagen && !sinImagen) {
    const escala = o.zona ? escalaZona(o.zona) : 1;
    const dibujo = (
      <Image
        src={srcIlustracion(o.imagen, nivel)}
        alt={alt}
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
  if (o.dibujo && "semaforo" in o.dibujo) return <Semaforo estado={o.dibujo.semaforo} />;
  if (o.dibujo && "flecha" in o.dibujo) return <Flecha hacia={o.dibujo.flecha} />;
  if (o.dibujo && "color" in o.dibujo) return <TarjetaDeColor color={o.dibujo.color} />;
  if (o.dibujo && "reloj" in o.dibujo) {
    const [h, m] = o.dibujo.reloj.split(":").map(Number);
    return (
      <span className="relative grid size-full place-items-center">
        <Reloj horas={h} minutos={m} etiqueta={o.descripcion} />
        {/* De noche: la luna al lado del reloj. */}
        <svg viewBox="0 0 20 20" className="absolute top-[7%] right-[7%] size-[26%]" aria-hidden>
          <path d="M13.5 2.5a7.5 7.5 0 1 0 4 13.6A8 8 0 0 1 13.5 2.5Z" fill="var(--estrella)" />
        </svg>
      </span>
    );
  }
  const hora = o.texto?.match(/^(\d{1,2}):(\d{2})$/);
  if (hora) return <Reloj horas={Number(hora[1])} minutos={Number(hora[2])} etiqueta={o.descripcion} />;
  // Las tarjetas de B1 llevan frases ("He made a thank-you card."): letra más chica.
  if ((o.texto?.length ?? 0) > 12) {
    return <span className="px-1.5 text-[13px] leading-tight font-extrabold text-texto sm:text-[15px]">{o.texto}</span>;
  }
  return <span className="px-1 text-lg font-black tracking-wide text-texto sm:text-xl">{o.texto}</span>;
}

/** Una flecha gruesa: izquierda, derecha o derecho (hacia arriba). */
function Flecha({ hacia }: { hacia: "izquierda" | "derecha" | "derecho" }) {
  const giro = hacia === "izquierda" ? -90 : hacia === "derecha" ? 90 : 0;
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={hacia === "derecho" ? "Flecha derecho" : `Flecha a la ${hacia}`} className="size-[70%]">
      <path d="M50 12 L82 46 H62 V88 H38 V46 H18 Z" fill="var(--primario)" strokeLinejoin="round" transform={`rotate(${giro} 50 50)`} />
    </svg>
  );
}

const COLORES: Record<ColorDeTarjeta, { fondo: string; nombre: string }> = {
  negro: { fondo: "#151515", nombre: "negra" },
  azul: { fondo: "#2563eb", nombre: "azul" },
  rojo: { fondo: "#dc2626", nombre: "roja" },
  verde: { fondo: "#16a34a", nombre: "verde" },
  amarillo: { fondo: "#facc15", nombre: "amarilla" },
  blanco: { fondo: "#ffffff", nombre: "blanca" },
};

/** Una tarjeta del color, sin la palabra: hay que oír el color para elegirla. */
function TarjetaDeColor({ color }: { color: ColorDeTarjeta }) {
  const c = COLORES[color];
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`Tarjeta ${c.nombre}`} className="size-[72%]">
      <rect x="8" y="8" width="84" height="84" rx="16" fill={c.fondo} stroke="var(--borde)" strokeWidth="3" />
    </svg>
  );
}

const SEMAFORO = { mano: "la mano roja", caminando: "la figura caminando", apagado: "apagado" } as const;

/**
 * Un semáforo peatonal de Estados Unidos: la mano arriba (roja) y la
 * figura caminando abajo (blanca); la que no está encendida queda oscura.
 * La caja es oscura en los dos temas, como en la calle.
 */
export function Semaforo({ estado }: { estado: keyof typeof SEMAFORO }) {
  const mano = estado === "mano" ? "#ef4444" : "#2f3644";
  const figura = estado === "caminando" ? "#f8fafc" : "#2f3644";
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`Semáforo peatonal: ${SEMAFORO[estado]}`} className="size-[82%]">
      <rect x="27" y="4" width="46" height="92" rx="9" fill="#1b2230" stroke="var(--borde)" strokeWidth="2.5" />
      <rect x="32" y="9" width="36" height="39" rx="6" fill="#0f141d" />
      <rect x="32" y="52" width="36" height="39" rx="6" fill="#0f141d" />
      {/* La mano: cuatro dedos, la palma y el pulgar. */}
      <g fill={mano}>
        {[39, 44, 49, 54].map((x, i) => (
          <rect key={x} x={x} y={[18, 15, 16, 19][i]} width="4.2" height="14" rx="2.1" />
        ))}
        <rect x="39" y="26" width="19.2" height="15" rx="5" />
        <rect x="33" y="28" width="4.2" height="11" rx="2.1" transform="rotate(-32 35 33)" />
      </g>
      {/* La figura caminando. */}
      <g stroke={figura} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <circle cx="52" cy="59" r="3.6" fill={figura} stroke="none" />
        <path d="M 51 65 L 48.5 75" />
        <path d="M 50.5 67 L 44.5 71.5 M 50.5 67 L 56 71" />
        <path d="M 48.5 75 L 43.5 85 M 48.5 75 L 55 84" />
      </g>
    </svg>
  );
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
