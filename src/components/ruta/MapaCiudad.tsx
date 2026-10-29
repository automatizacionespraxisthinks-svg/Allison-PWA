"use client";

import { EDIFICIO, MEDIA_CALLE, type Trazo } from "@/lib/ruta/indicaciones";

/**
 * El mapa sencillo que la app dibuja con indicaciones en inglés (A1,
 * parada 10): calles, "You are here", el camino y los lugares con su
 * nombre. En el escenario se va dibujando con lo que dice Carmen; en Tu
 * turno muestra lo que el alumno tiene que decir. Lo nuevo del camino se
 * dibuja paso a paso (la animación camino-mapa de globals.css).
 */
export function MapaCiudad({
  trazo,
  vuelta = 0,
  conCamino = true,
  etiqueta,
  className = "",
}: {
  trazo: Trazo;
  /** Cambia cuando hay algo nuevo que dibujar: vuelve a correr la animación. */
  vuelta?: number;
  conCamino?: boolean;
  /** Lo que dice el lector de pantalla. */
  etiqueta: string;
  className?: string;
}) {
  const { caja, calles, camino, lugares, destino, bus } = trazo;
  const previo = camino.slice(0, trazo.nuevoDesde + 1);
  const nuevo = camino.slice(trazo.nuevoDesde);
  const largoNuevo = nuevo.reduce((s, p, i) => (i ? s + Math.hypot(p.x - nuevo[i - 1].x, p.y - nuevo[i - 1].y) : 0), 0);
  const puntos = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x},${p.y}`).join(" ");
  const abajo = caja.y + caja.alto;

  return (
    <svg
      viewBox={`${caja.x} ${caja.y} ${caja.ancho} ${caja.alto}`}
      role="img"
      aria-label={etiqueta}
      className={`rounded-3xl bg-superficie-2 ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Las calles: de arriba abajo y de lado a lado, con su línea del centro. */}
      {calles.x.map((x) => (
        <g key={`v${x}`}>
          <rect x={x - MEDIA_CALLE} y={calles.desde} width={MEDIA_CALLE * 2} height={abajo - calles.desde} fill="var(--superficie)" />
          <line x1={x} y1={calles.desde} x2={x} y2={abajo} stroke="var(--borde)" strokeWidth="1.5" strokeDasharray="6 6" />
        </g>
      ))}
      {calles.y
        .filter((y) => y > calles.desde)
        .map((y) => (
          <g key={`h${y}`}>
            <rect x={caja.x} y={y - MEDIA_CALLE} width={caja.ancho} height={MEDIA_CALLE * 2} fill="var(--superficie)" />
            <line x1={caja.x} y1={y} x2={caja.x + caja.ancho} y2={y} stroke="var(--borde)" strokeWidth="1.5" strokeDasharray="6 6" />
          </g>
        ))}

      {destino && <Puente x={destino.x} y={destino.y} nombre={destino.etiqueta} caja={caja} />}

      {conCamino && bus && (
        <g key={`bus${vuelta}`} className="paso-mapa" style={{ animationDelay: `${0.3 + largoNuevo / 120}s` }}>
          <polyline points={puntos(bus)} fill="none" stroke="var(--primario)" strokeWidth="4" strokeDasharray="3 8" strokeLinecap="round" strokeLinejoin="round" />
          <Bus x={bus[bus.length - 1].x} y={(bus[bus.length - 1].y + bus[bus.length - 2].y) / 2} />
        </g>
      )}

      {conCamino && previo.length > 1 && (
        <polyline points={puntos(previo)} fill="none" stroke="var(--oro)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {conCamino && nuevo.length > 1 && (
        <polyline
          // key: cada vez que lo dice (también repetido) se vuelve a dibujar.
          key={`camino${vuelta}`}
          points={puntos(nuevo)}
          pathLength={1}
          className="camino-mapa"
          style={{ animationDuration: `${Math.max(1, largoNuevo / 120)}s` }}
          fill="none"
          stroke="var(--oro)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {lugares.map((l) =>
        l.nombre === "bus stop" ? (
          <ParadaBus key={l.nombre} {...l} />
        ) : (
          <Edificio key={l.nombre} {...l} />
        ),
      )}

      {/* You are here: el punto mira hacia arriba, por donde se sigue derecho. */}
      <circle cx={0} cy={0} r="12" fill="var(--primario-suave)" />
      <circle cx={0} cy={0} r="7" fill="var(--primario)" />
      <path d="M -6 -15 L 0 -23 L 6 -15 Z" fill="var(--primario)" />
      <text x={20} y={5} fontSize="15" fontWeight="900" fill="var(--primario)">
        You are here
      </text>
    </svg>
  );
}

type Lugar = Trazo["lugares"][number];

/** El nombre del lugar, del lado contrario a la calle, sobre una pastilla para que se lea encima de todo. */
function Nombre({ x, y, calle, etiqueta, medio, alarga }: Lugar & { medio: number }) {
  const dx = Math.sign(x - calle.x);
  const dy = Math.sign(y - calle.y);
  const tx = x + dx * (medio + 4);
  const ty = y + dy * (medio + 4);
  const ancho = etiqueta.length * 8 + 12;
  // Dos lotes seguidos en una calle de lado a lado: cada nombre se alarga para su lado.
  const ax =
    dx > 0 ? tx : dx < 0 ? tx - ancho : alarga < 0 ? tx + 18 - ancho : alarga > 0 ? tx - 18 : tx - ancho / 2;
  const ay = dy > 0 ? ty : dy < 0 ? ty - 20 : ty - 10;
  return (
    <g>
      <rect x={ax} y={ay} width={ancho} height={20} rx={10} fill="var(--superficie)" opacity="0.92" />
      <text x={ax + ancho / 2} y={ay + 15} textAnchor="middle" fontSize="14" fontWeight="900" fill="var(--texto)">
        {etiqueta}
      </text>
    </g>
  );
}

function Edificio(l: Lugar) {
  const [w, h] = l.horizontal ? [EDIFICIO.largo, EDIFICIO.fondo] : [EDIFICIO.fondo, EDIFICIO.largo];
  // La puerta da a la calle.
  const px = l.horizontal ? l.x - 5 : l.calle.x < l.x ? l.x - w / 2 : l.x + w / 2 - 8;
  const py = l.horizontal ? (l.calle.y < l.y ? l.y - h / 2 : l.y + h / 2 - 8) : l.y - 5;
  return (
    <g className="paso-mapa">
      <rect x={l.x - w / 2} y={l.y - h / 2} width={w} height={h} rx="4" fill="var(--superficie)" stroke="var(--texto-suave)" strokeWidth="2" />
      {[-1, 1].flatMap((i) =>
        [-1, 1].map((j) => (
          <rect key={`${i}${j}`} x={l.x + i * w * 0.22 - 3} y={l.y + j * h * 0.22 - 3} width="6" height="6" rx="1.5" fill="var(--primario-claro)" opacity="0.7" />
        )),
      )}
      <rect x={px} y={py} width={l.horizontal ? 10 : 8} height={l.horizontal ? 8 : 10} rx="1.5" fill="var(--texto-suave)" />
      <Nombre {...l} medio={(l.horizontal ? h : w) / 2} />
    </g>
  );
}

/** La parada: un poste con la placa azul de BUS, en el andén. */
function ParadaBus(l: Lugar) {
  return (
    <g className="paso-mapa">
      <line x1={l.x} y1={l.y + 10} x2={l.x} y2={l.y - 8} stroke="var(--texto-suave)" strokeWidth="3" strokeLinecap="round" />
      <rect x={l.x - 15} y={l.y - 22} width="30" height="16" rx="4" fill="var(--primario)" />
      <text x={l.x} y={l.y - 10} textAnchor="middle" fontSize="10" fontWeight="900" fill="var(--superficie)">
        BUS
      </text>
      <Nombre {...l} medio={14} />
    </g>
  );
}

/** El bus que sube al puente. */
function Bus({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 11} y={y - 15} width="22" height="30" rx="5" fill="var(--primario)" />
      <rect x={x - 7} y={y - 11} width="14" height="8" rx="2" fill="var(--superficie)" opacity="0.85" />
      <circle cx={x - 6} cy={y + 10} r="2" fill="var(--superficie)" />
      <circle cx={x + 6} cy={y + 10} r="2" fill="var(--superficie)" />
    </g>
  );
}

/**
 * El Golden Gate al otro lado del agua: el agua de lado a lado, las dos
 * torres y los cables, en el rojo del puente (igual en los dos temas).
 */
function Puente({ x, y, nombre, caja }: { x: number; y: number; nombre: string; caja: Trazo["caja"] }) {
  const rojo = "#d9480f";
  return (
    <g>
      <rect x={caja.x} y={y - 22} width={caja.ancho} height={44} fill="var(--primario-suave)" />
      <path
        d={`M ${x - 75} ${y} L ${x - 42} ${y - 26} Q ${x} ${y + 2} ${x + 42} ${y - 26} L ${x + 75} ${y}`}
        fill="none"
        stroke={rojo}
        strokeWidth="2.5"
      />
      <rect x={x - 46} y={y - 32} width="7" height="40" rx="1.5" fill={rojo} />
      <rect x={x + 39} y={y - 32} width="7" height="40" rx="1.5" fill={rojo} />
      <line x1={x - 80} y1={y} x2={x + 80} y2={y} stroke={rojo} strokeWidth="5" strokeLinecap="round" />
      <text x={x} y={y - 38} textAnchor="middle" fontSize="15" fontWeight="900" fill="var(--texto)">
        {nombre}
      </text>
    </g>
  );
}
