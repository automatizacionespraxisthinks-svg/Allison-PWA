/**
 * El mapa del viaje, tal cual el boceto aprobado: un contorno simplificado
 * del país, las ciudades de la ruta ubicadas por longitud y latitud, y
 * vuelos curvos de una a la siguiente (punteados los que faltan, en menta
 * los ya hechos). A1 es Estados Unidos; A2, Gran Bretaña, y B1, el sur de
 * Canadá (donde quedan las diez ciudades), con el mismo dibujo.
 */

type EstadoCiudad = "ok" | "on" | "";

/** Proyecta longitud y latitud sobre el lienzo de 330 × 210. */
function proy(lon: number, lat: number): [number, number] {
  return [((lon + 125) / 58) * 316 + 7, ((49.5 - lat) / 25) * 196 + 6];
}

/** Gran Bretaña es alta y angosta: la misma escala en los dos ejes (corregida por la latitud), centrada. */
function proyUK(lon: number, lat: number): [number, number] {
  return [165 + (lon + 2.1) * 13.3, 6 + (58.7 - lat) * 22.5];
}

/**
 * El sur de Canadá: de la costa del Pacífico a Terranova, cortado en el
 * paralelo 58 (las ciudades de la ruta quedan entre el 43 y el 51). Un poco
 * más alto que la proporción real, para que las ciudades no se amontonen.
 */
function proyCA(lon: number, lat: number): [number, number] {
  return [7 + (lon + 132) * 3.95, 6 + (58.5 - lat) * 11.647];
}

/** El contorno simplificado del sur de Canadá (con la bahía de Hudson y James) y Terranova. */
const CONTORNO_CA: [number, number][] = [
  [-131, 58], [-130, 55], [-128, 52], [-127.5, 50.5], [-125, 48.8], [-123.4, 48.3], [-123, 49], [-95.2, 49],
  [-95.1, 49.4], [-89.6, 48], [-84.6, 46.5], [-82.4, 45.3], [-82.5, 43], [-83, 42], [-79, 42.8], [-79.2, 43.4],
  [-76.5, 44.2], [-74.7, 45], [-71.5, 45], [-70.8, 45.6], [-69.2, 47.4], [-67.8, 47.1], [-67.8, 45.6], [-67, 44.8],
  [-66, 44.2], [-65.6, 43.5], [-63.6, 44.4], [-60, 45.6], [-60.5, 46.9], [-61.5, 45.9], [-64.5, 46.3], [-65, 48.5],
  [-64.2, 48.8], [-67, 49.2], [-60, 50.2], [-57, 51.5], [-55.7, 52.5], [-58, 55], [-61, 56.5], [-63, 58], [-77, 58],
  [-77.5, 56], [-79, 54.5], [-79.5, 51.6], [-81, 52.6], [-82.3, 53.1], [-85, 55.2], [-88.5, 56.8], [-92.4, 57.1],
  [-94.3, 58],
];

const TERRANOVA: [number, number][] = [
  [-59.3, 47.6], [-56, 47.6], [-52.7, 47.5], [-53, 49.5], [-55.5, 51.6], [-57.6, 50.7], [-59.3, 48.5],
];

const TIERRA_CA = [CONTORNO_CA, TERRANOVA]
  .map((c) => c.map(([lo, la], i) => (i ? "L" : "M") + proyCA(lo, la).map((v) => v.toFixed(1)).join(" ")).join(" ") + "Z")
  .join(" ");

/** El contorno simplificado del país, en longitud y latitud. */
const CONTORNO: [number, number][] = [
  [-124.7, 48.4], [-124, 46], [-124.3, 42], [-122.4, 37.8], [-120.6, 34.6], [-117.1, 32.5], [-114.7, 32.7],
  [-111, 31.3], [-108.2, 31.3], [-106.5, 31.8], [-104.5, 29.6], [-103, 29], [-101.4, 29.8], [-99.5, 27.5],
  [-97.4, 25.9], [-97.3, 27.8], [-94.7, 29.4], [-91, 29.2], [-89.2, 30.3], [-86, 30.4], [-84, 30], [-82.8, 28.5],
  [-81.7, 25.2], [-80.1, 25.8], [-80.6, 28.4], [-81.4, 30.7], [-79, 33.6], [-75.5, 35.3], [-76, 37], [-74, 40.5],
  [-70, 41.6], [-70.7, 43], [-67, 44.8], [-67.8, 47.1], [-69.2, 47.4], [-71.5, 45], [-74.9, 45], [-76.5, 43.6],
  [-79, 43.3], [-82.4, 41.7], [-82.5, 45.3], [-84.6, 46.5], [-88, 48.2], [-95.2, 49], [-123, 49],
];

const TIERRA =
  CONTORNO.map(([lo, la], i) => (i ? "L" : "M") + proy(lo, la).map((v) => v.toFixed(1)).join(" ")).join(" ") + "Z";

/** El contorno simplificado de Gran Bretaña, en longitud y latitud. */
const CONTORNO_UK: [number, number][] = [
  [-5.7, 50.05], [-4.2, 50.35], [-3, 50.65], [-1.3, 50.75], [0.3, 50.8], [1.4, 51.15], [1, 51.5], [1.75, 52.5],
  [1.4, 52.95], [0.3, 53], [0.1, 53.6], [-0.3, 54.05], [-1.2, 54.6], [-1.6, 55.6], [-2, 55.95], [-2.7, 56.1],
  [-2, 56.8], [-1.8, 57.5], [-3, 57.7], [-4, 57.6], [-3.1, 58.6], [-5, 58.6], [-5.4, 58], [-5.8, 57.3],
  [-5.6, 56.4], [-5.6, 55.3], [-4.9, 55.7], [-5, 54.8], [-3.6, 54.9], [-3.2, 54.4], [-3, 53.8], [-3, 53.35],
  [-4.6, 53.3], [-4.2, 52.9], [-4.1, 52.3], [-5.3, 51.9], [-4.2, 51.6], [-3.2, 51.4], [-3, 51.2], [-4.2, 51.2],
  [-5, 50.4],
];

const TIERRA_UK =
  CONTORNO_UK.map(([lo, la], i) => (i ? "L" : "M") + proyUK(lo, la).map((v) => v.toFixed(1)).join(" ")).join(" ") + "Z";

/** Quita tildes y mayúsculas para encontrar la ciudad aunque venga escrita distinto. */
function clave(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Dónde queda cada ciudad (longitud, latitud) y cuánto se corre su letrero.
 * Los corrimientos son los del boceto, salvo el de Nueva Orleans: allí su
 * letrero caía encima del de Orlando, así que baja un poco, sobre el golfo.
 */
const UBICACION: Record<string, { lon: number; lat: number; desp: [number, number] }> = {
  miami: { lon: -80.2, lat: 25.8, desp: [-46, 4] },
  orlando: { lon: -81.4, lat: 28.5, desp: [-50, 0] },
  "nueva york": { lon: -74, lat: 40.7, desp: [-64, -6] },
  washington: { lon: -77, lat: 38.9, desp: [-58, 10] },
  chicago: { lon: -87.6, lat: 41.9, desp: [-16, -9] },
  "los angeles": { lon: -118.2, lat: 34, desp: [6, 12] },
  "nueva orleans": { lon: -90, lat: 30, desp: [-40, 22] },
  boston: { lon: -71, lat: 42.4, desp: [-26, -9] },
  seattle: { lon: -122.3, lat: 47.6, desp: [7, 4] },
  "san francisco": { lon: -122.4, lat: 37.8, desp: [7, 4] },
};

/** Las ciudades de A2. Varias quedan cerca: los letreros van a lados distintos. */
const UBICACION_UK: Record<string, { lon: number; lat: number; desp: [number, number] }> = {
  londres: { lon: -0.13, lat: 51.5, desp: [8, 3] },
  manchester: { lon: -2.24, lat: 53.48, desp: [8, -1] },
  liverpool: { lon: -2.98, lat: 53.41, desp: [-56, 4] },
  edimburgo: { lon: -3.19, lat: 55.95, desp: [8, 3] },
  oxford: { lon: -1.26, lat: 51.75, desp: [-50, -4] },
  york: { lon: -1.08, lat: 53.96, desp: [8, -2] },
  cambridge: { lon: 0.12, lat: 52.2, desp: [8, -3] },
  brighton: { lon: -0.14, lat: 50.82, desp: [8, 9] },
  bath: { lon: -2.36, lat: 51.38, desp: [-36, 3] },
  cardiff: { lon: -3.18, lat: 51.48, desp: [-50, 10] },
};

/**
 * Las ciudades de B1. Tres parejas quedan muy cerca (Victoria y Vancouver,
 * Calgary y Banff, Toronto y Niagara): sus letreros van a lados opuestos.
 */
const UBICACION_CA: Record<string, { lon: number; lat: number; desp: [number, number] }> = {
  toronto: { lon: -79.4, lat: 43.7, desp: [-54, 4] },
  montreal: { lon: -73.6, lat: 45.5, desp: [7, -2] },
  ottawa: { lon: -75.7, lat: 45.4, desp: [-50, -6] },
  vancouver: { lon: -123.1, lat: 49.3, desp: [7, -3] },
  calgary: { lon: -114.1, lat: 51, desp: [7, 4] },
  victoria: { lon: -123.4, lat: 48.4, desp: [7, 9] },
  quebec: { lon: -71.2, lat: 46.8, desp: [-24, -9] },
  banff: { lon: -115.6, lat: 51.2, desp: [-36, -7] },
  halifax: { lon: -63.6, lat: 44.6, desp: [-30, 15] },
  niagara: { lon: -79.1, lat: 43.1, desp: [7, 10] },
};

/** Lo que cambia de un país a otro. */
const PAISES = {
  eeuu: { tierra: TIERRA, ubicacion: UBICACION, proy, nombre: "Estados Unidos" },
  "reino-unido": { tierra: TIERRA_UK, ubicacion: UBICACION_UK, proy: proyUK, nombre: "Gran Bretaña" },
  canada: { tierra: TIERRA_CA, ubicacion: UBICACION_CA, proy: proyCA, nombre: "Canadá" },
};

const f = (v: number) => v.toFixed(1);

/**
 * El mapa con las ciudades en el orden de la ruta: `ok` es una estampilla ya
 * ganada (dorada, con letrero), `on` la ciudad actual (azul, con letrero) y
 * las demás un círculo con su número.
 */
export function MapaViaje({
  ciudades,
  pais = "eeuu",
  className,
}: {
  ciudades: { nombre: string; estado: EstadoCiudad }[];
  /** El país del nivel: A1 Estados Unidos, A2 Gran Bretaña, B1 Canadá. */
  pais?: keyof typeof PAISES;
  className?: string;
}) {
  const p = PAISES[pais];
  // Las ciudades que se pueden ubicar, con su número de parada en la ruta.
  const puntos = ciudades.flatMap((c, i) => {
    const u = p.ubicacion[clave(c.nombre)];
    if (!u) return [];
    const [x, y] = p.proy(u.lon, u.lat);
    return [{ ...c, n: i + 1, x, y, desp: u.desp }];
  });

  return (
    <svg
      viewBox="0 0 330 210"
      width="100%"
      role="img"
      aria-label={`Mapa de ${p.nombre} con las ${puntos.length} ciudades del viaje`}
      className={`block h-auto w-full ${className ?? ""}`}
    >
      <path d={p.tierra} fill="var(--superficie)" stroke="var(--borde)" strokeWidth="1.5" />

      {/* Los vuelos: una curva que se levanta un poco entre cada par de ciudades. */}
      {puntos.slice(1).map((b, i) => {
        const a = puntos[i];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.18;
        const hecho = b.estado === "ok" || (b.estado === "on" && a.estado === "ok");
        return (
          <path
            key={`vuelo-${b.n}`}
            d={`M${f(a.x)} ${f(a.y)} Q${f(mx)} ${f(my)} ${f(b.x)} ${f(b.y)}`}
            fill="none"
            {...(hecho
              ? { stroke: "var(--menta)", strokeWidth: 2.2 }
              : { stroke: "var(--texto-suave)", strokeWidth: 1.3, strokeDasharray: "2 4", opacity: 0.7 })}
          />
        );
      })}

      {puntos.map((c) => {
        if (c.estado === "") {
          return (
            <g key={`ciudad-${c.n}`}>
              <circle cx={f(c.x)} cy={f(c.y)} r="7" fill="var(--superficie)" stroke="var(--borde)" strokeWidth="2" />
              <text
                x={f(c.x)}
                y={f(c.y + 2.6)}
                textAnchor="middle"
                fill="var(--texto-suave)"
                fontSize="7"
                fontWeight="800"
              >
                {c.n}
              </text>
            </g>
          );
        }
        const actual = c.estado === "on";
        return (
          <circle
            key={`ciudad-${c.n}`}
            cx={f(c.x)}
            cy={f(c.y)}
            r={actual ? 7 : 5.5}
            fill={actual ? "var(--primario)" : "var(--oro)"}
            stroke={actual ? "var(--primario-suave)" : "var(--oro)"}
            strokeWidth={actual ? 5 : 2}
          />
        );
      })}

      {/* Los letreros van al final, encima de todo, para que ningún círculo los tape. */}
      {puntos
        .filter((c) => c.estado !== "")
        .map((c) => {
          const actual = c.estado === "on";
          const [dx, dy] = c.desp;
          return (
            <text
              key={`letrero-${c.n}`}
              x={f(c.x + dx)}
              y={f(c.y + dy)}
              fill={actual ? "var(--primario)" : "var(--oro)"}
              fontSize={actual ? 9.5 : 8.5}
              fontWeight="800"
            >
              {`${c.n}. ${c.nombre}`}
            </text>
          );
        })}
    </svg>
  );
}
