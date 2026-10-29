"use client";

import type { DibujoOpcion, EscuchaElige } from "@/lib/ruta/tipos";
import { Icono } from "../Iconos";

/**
 * El mapa sencillo de Escucha y elige (A1, parada 10 y Repaso final): un
 * punto "You are here" abajo, la calle que sube, las calles que la cruzan
 * y tres edificios que se tocan. Un solo mapa y no una tarjeta por opción:
 * así hay que seguir la indicación ("Go straight two blocks and turn
 * left…") desde el punto, como pide el contenido, y las tres opciones se
 * ven igual de posibles sin oír nada. Después de un error, el camino
 * correcto se dibuja paso a paso hasta la calle del edificio, sin
 * marcarlo: queda decidir de qué lado está.
 */

type Edificio = Extract<DibujoOpcion, { edificio: unknown }>["edificio"];

const ANCHO = 300;
const MEDIA_CALLE = 11;
const CX = ANCHO / 2;
/** Dónde está "You are here". */
const Y0 = 282;
/** Entre una calle y la siguiente. */
const CUADRA = 88;
const ANCHO_EDIFICIO = 50;
const ALTO_EDIFICIO = 38;
/** Del borde de la calle a la acera de los edificios. */
const ACERA = 6;
const ALTO_PARQUE = 62;

// La primera calle queda lejos del punto: los edificios de abajo de esa
// calle no tapan "You are here".
const yCalle = (k: number) => Y0 - 80 - (k - 1) * CUADRA;
const dir = (gira: Edificio["gira"]) => (gira === "izquierda" ? -1 : 1);
const xLote = (e: Edificio) => CX + dir(e.gira) * (MEDIA_CALLE + 8 + ANCHO_EDIFICIO / 2 + ((e.lote ?? 1) - 1) * (ANCHO_EDIFICIO + 10));
/** Caminando hacia la izquierda, la derecha es arriba; hacia la derecha, abajo. */
const arriba = (e: Edificio) => e.gira !== e.lado;
const yEdificio = (e: Edificio) =>
  arriba(e) ? yCalle(e.cuadras) - MEDIA_CALLE - ACERA - ALTO_EDIFICIO : yCalle(e.cuadras) + MEDIA_CALLE + ACERA;

export const edificioDe = (o: EscuchaElige["opciones"][number]): Edificio | null =>
  o.dibujo && "edificio" in o.dibujo ? o.dibujo.edificio : null;

export function MapaCalles({
  opciones,
  parque,
  orden,
  elegida,
  fallidas,
  correcta,
  acierto,
  onElegir,
}: {
  opciones: EscuchaElige["opciones"];
  parque?: number;
  /** El orden mezclado de la actividad: numera los edificios para el lector de pantalla. */
  orden: number[];
  elegida: number | null;
  fallidas: number[];
  correcta: number;
  acierto: boolean;
  onElegir: (i: number) => void;
}) {
  const edificios = opciones.map(edificioDe);
  // Con parque, la calle sube hasta él (una T); sin parque sigue una cuadra más.
  const calles = parque ?? Math.max(...edificios.map((e) => e?.cuadras ?? 1)) + 1;
  const arribaDelTodo = parque
    ? yCalle(parque) - MEDIA_CALLE - ACERA - ALTO_PARQUE - 12
    : yCalle(calles) - MEDIA_CALLE - 16;
  const alto = Y0 + 20 - arribaDelTodo;
  const finCalle = parque ? yCalle(parque) - MEDIA_CALLE : arribaDelTodo;
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  // El camino a la calle del edificio correcto, después de un error.
  const meta = edificios[correcta];
  const conCamino = fallidas.length > 0 && !acierto && meta;
  const largo = meta ? Y0 - yCalle(meta.cuadras) + Math.abs(xLote(meta) - CX) : 1;
  // Las cuadras se cuentan del lado contrario al giro: así no tapan el final del camino.
  const xCuenta = CX - (meta ? dir(meta.gira) : 1) * (MEDIA_CALLE + 13);
  const parqueX = MEDIA_CALLE + 8 + ANCHO_EDIFICIO + 4;

  return (
    <div className="relative mx-auto w-full max-w-sm" style={{ aspectRatio: `${ANCHO} / ${alto}` }}>
      <svg
        viewBox={`0 ${arribaDelTodo} ${ANCHO} ${alto}`}
        role="img"
        aria-label="Mapa: tú estás abajo, en la calle que sube. Toca un edificio."
        className="absolute inset-0 size-full rounded-2xl bg-superficie-2"
      >
        {/* Las calles que cruzan y la que sube. */}
        {Array.from({ length: calles }, (_, i) => (
          <g key={i}>
            <rect x="0" y={yCalle(i + 1) - MEDIA_CALLE} width={ANCHO} height={MEDIA_CALLE * 2} fill="var(--superficie)" />
            <line x1="0" y1={yCalle(i + 1)} x2={ANCHO} y2={yCalle(i + 1)} stroke="var(--borde)" strokeWidth="1.5" strokeDasharray="6 6" />
          </g>
        ))}
        <rect x={CX - MEDIA_CALLE} y={finCalle} width={MEDIA_CALLE * 2} height={Y0 + 20 - finCalle} fill="var(--superficie)" />
        <line x1={CX} y1={finCalle} x2={CX} y2={Y0 + 20} stroke="var(--borde)" strokeWidth="1.5" strokeDasharray="6 6" />

        {parque && (
          <g>
            <rect
              x={CX - parqueX}
              y={yCalle(parque) - MEDIA_CALLE - ACERA - ALTO_PARQUE}
              width={parqueX * 2}
              height={ALTO_PARQUE}
              rx="10"
              fill="var(--menta-suave)"
              stroke="var(--menta)"
              strokeWidth="2"
            />
            {/* Los árboles, a los lados del nombre. */}
            {[
              [-58, 44],
              [-40, 20],
              [40, 44],
              [58, 20],
            ].map(([dx, dy], i) => (
              <circle key={i} cx={CX + dx} cy={yCalle(parque) - MEDIA_CALLE - ACERA - ALTO_PARQUE + dy} r="9" fill="var(--menta)" opacity="0.85" />
            ))}
            <text
              x={CX}
              y={yCalle(parque) - MEDIA_CALLE - ACERA - ALTO_PARQUE / 2 + 5}
              textAnchor="middle"
              fontSize="14"
              fontWeight="900"
              fill="var(--menta)"
            >
              Park
            </text>
          </g>
        )}

        {conCamino && (
          // key: cada error vuelve a dibujarlo desde el punto.
          <g key={fallidas.length}>
            <polyline
              points={`${CX},${Y0} ${CX},${yCalle(meta.cuadras)} ${xLote(meta)},${yCalle(meta.cuadras)}`}
              pathLength={1}
              className="camino-mapa"
              fill="none"
              stroke="var(--oro)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Las cuadras que se cuentan, a medida que el camino pasa. */}
            {Array.from({ length: meta.cuadras }, (_, j) => (
              <g
                key={j}
                className="paso-mapa"
                style={{ animationDelay: `${0.3 + (3.5 * (Y0 - yCalle(j + 1))) / largo}s` }}
              >
                <circle cx={xCuenta} cy={yCalle(j + 1)} r="10" fill="var(--oro)" />
                <text x={xCuenta} y={yCalle(j + 1) + 4.5} textAnchor="middle" fontSize="13" fontWeight="900" fill="var(--superficie)">
                  {j + 1}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* You are here: el punto mira hacia arriba, por donde se sigue derecho. */}
        <circle cx={CX} cy={Y0} r="12" fill="var(--primario-suave)" />
        <circle cx={CX} cy={Y0} r="7" fill="var(--primario)" />
        <path d={`M ${CX - 6} ${Y0 - 15} L ${CX} ${Y0 - 23} L ${CX + 6} ${Y0 - 15} Z`} fill="var(--primario)" />
        <text x={CX + 20} y={Y0 + 5} fontSize="13" fontWeight="900" fill="var(--primario)">
          You are here
        </text>
      </svg>

      {/* Los edificios son los botones: encima del dibujo, en su lugar del mapa. */}
      {orden.map((i, posicion) => {
        const e = edificios[i];
        if (!e) return null;
        const ok = acierto && i === correcta;
        const sel = elegida === i;
        const descartado = fallidas.includes(i);
        return (
          <button
            key={i}
            type="button"
            disabled={acierto || descartado}
            onClick={() => onElegir(i)}
            aria-pressed={sel}
            aria-label={`Edificio ${posicion + 1}`}
            className={`absolute transition disabled:cursor-default ${descartado ? "opacity-35" : ""}`}
            style={{
              left: pct(xLote(e) - ANCHO_EDIFICIO / 2, ANCHO),
              top: pct(yEdificio(e) - arribaDelTodo, alto),
              width: pct(ANCHO_EDIFICIO, ANCHO),
              height: pct(ALTO_EDIFICIO, alto),
            }}
          >
            <DibujoEdificio puertaArriba={!arriba(e)} estado={ok ? "bien" : sel ? "elegido" : "normal"} />
            {ok && (
              <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-menta text-white">
                <Icono nombre="check" className="size-3.5 stroke-[3]" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Un edificio visto desde arriba un poco de lado: ventanas y la puerta hacia la calle. */
function DibujoEdificio({ puertaArriba, estado }: { puertaArriba: boolean; estado: "normal" | "elegido" | "bien" }) {
  const borde = estado === "bien" ? "var(--menta)" : estado === "elegido" ? "var(--primario)" : "var(--texto-suave)";
  const fondo = estado === "bien" ? "var(--menta-suave)" : estado === "elegido" ? "var(--primario-suave)" : "var(--superficie)";
  const ventana = estado === "bien" ? "var(--menta)" : estado === "elegido" ? "var(--primario)" : "var(--primario-claro)";
  const yVentanas = puertaArriba ? [17, 27] : [7, 17];
  return (
    <svg viewBox="0 0 50 38" className="size-full overflow-visible" aria-hidden>
      <rect x="2" y="2" width="46" height="34" rx="5" fill={fondo} stroke={borde} strokeWidth={estado === "normal" ? 2 : 3.5} />
      {yVentanas.flatMap((y) =>
        [9, 21, 33].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="8" height="6" rx="1.5" fill={ventana} opacity="0.75" />),
      )}
      {/* La puerta da a la calle del edificio. */}
      <rect x="20" y={puertaArriba ? 2 : 26} width="10" height="10" rx="2" fill={borde} />
    </svg>
  );
}
