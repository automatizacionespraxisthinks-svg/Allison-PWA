"use client";

import { useId } from "react";

/**
 * Las estampillas coleccionables, tal cual el boceto aprobado (allí se
 * llaman "postales"): borde perforado, cielo en degradé, sol, colina, el
 * monumento del lugar en trazos y la banda con el nombre. Hay una por cada
 * ciudad de las rutas A1, A2 y B1, las de repaso y una por cada viaje.
 */

export type LugarSello =
  | "miami"
  | "orlando"
  | "nueva-york"
  | "washington"
  | "chicago"
  | "los-angeles"
  | "nueva-orleans"
  | "boston"
  | "seattle"
  | "san-francisco"
  | "londres"
  | "manchester"
  | "liverpool"
  | "edimburgo"
  | "oxford"
  | "york"
  | "cambridge"
  | "brighton"
  | "bath"
  | "cardiff"
  | "toronto"
  | "montreal"
  | "ottawa"
  | "vancouver"
  | "calgary"
  | "victoria"
  | "quebec"
  | "banff"
  | "halifax"
  | "niagara"
  | "repaso-1"
  | "a1-completo"
  | "a2-completo"
  | "b1-completo"
  | "mexico"
  | "peru"
  | "brasil"
  | "espana"
  | "francia"
  | "italia"
  | "egipto"
  | "india"
  | "china"
  | "japon";

/**
 * Los monumentos, en trazos simples sobre el mismo espacio de 64 unidades de
 * los sellos del boceto. Heredan el trazo del grupo que los envuelve. Nada de
 * letras ni marcas: solo la silueta que hace reconocible el lugar.
 */
const GLIFOS = {
  palmera: <path d="M32 34V22M32 22c-4-4-9-3-11 0M32 22c4-4 9-3 11 0M32 22c-2-5 0-8 3-9" />,
  edificios: <path d="M20 34V22h6v12M28 34V16h8v18M38 34V24h6v10" />,
  estatua: (
    <>
      <path d="M30 34V22h4v12M28 22h8M33 22V14l3-3" />
      <circle cx="32" cy="19" r="1.5" />
    </>
  ),
  cupula: <path d="M24 34v-8c0-5 4-8 8-10 4 2 8 5 8 10v8zM32 16v-4M20 34V24M44 34V24M18 34h28" />,
  // Los Ángeles: dos palmeras altas y flacas frente a las colinas.
  palmeras: (
    <path d="M34 34c3-6 6-9 9-9s6 3 9 9M23 34c0-6 0-12 1-18M24 16c-2-2-5-2-7 1M24 16c2-2 5-2 7 1M24 16c-.5-2-2-3.5-4-4M24 16c.5-2 2-3.5 4-4M31 34V23M31 23c-2-2-4.5-2-6 1M31 23c2-2 4.5-2 6 1M31 23c0-2 1-3 2.5-3.5" />
  ),
  // Nueva Orleans: la trompeta del jazz, con sus tres pistones y la campana.
  trompeta: (
    <path d="M15 27h20M15 25v4M35 24.5c4 0 7-2.5 11-5.5v16c-4-3-7-5.5-11-5.5zM23 27v-6M27.5 27v-6M32 27v-6M22 21h2M26.5 21h2M31 21h2M22 27c0 4 1.5 5 4 5h9" />
  ),
  // Boston: el faro del puerto, con su linterna, la casita del farero y el mar.
  faro: (
    <path d="M24 34l2-15h6l2 15zM25.5 19h7M27 19v-3h4v3M26.5 16l2.5-3 2.5 3M25 27h8M23 15l-7-2.5M23 17.5l-7 2.5M36 34v-5l4-3.5 4 3.5v5M14 34h38" />
  ),
  // Seattle: la torre de la aguja con su platillo, y la montaña nevada detrás.
  aguja: (
    <path d="M36 34l8-11h3l7 11M43 24.5l1.8 1.8 1.5-1.3 1.5 1.3 1.7-1.8M22 34c2-6 3-10 3-14M30 34c-2-6-3-10-3-14M23.5 28h5M19 19.5c2-2 4.5-3 7-3s5 1 7 3c-2 1-4.5 1.5-7 1.5s-5-.5-7-1.5zM26 16.5V9" />
  ),
  // San Francisco: el puente colgante (el del boceto, con torres y cables).
  puente: (
    <path d="M12 29h40M22 34V13M42 34V13M20 15h4M40 15h4M20 21h4M40 21h4M22 14c5 12 15 12 20 0M22 14c-3 6-6 11-10 14M42 14c3 6 6 11 10 14M26.5 21.5V29M32 24V29M37.5 21.5V29" />
  ),
  // Primer repaso: el horizonte de Chicago, con la torre escalonada y sus dos antenas.
  horizonte: (
    <path d="M17 34V25h5v9M24 34V18h2v-4h7v4h2v16M27.5 14V9M31.5 14v-4M37 34V22h5v12M44 34v-7h4v7" />
  ),
  escalonada: <path d="M20 34h24v-4h-3v-4h-3v-4h-4v-3h-4v3h-4v4h-3v4h-3z" />,
  montanas: <path d="M18 34l8-12 5 6 4-7 9 13zM33 21l2.5 3" />,
  pandeazucar: (
    <>
      <path d="M14 34c2-6 5-8 8-8s5 3 6 8M26 34c1-10 4-17 9-17s8 7 9 17M22 26l13-9M12 34h38" />
      <circle cx="28" cy="22" r="1.2" />
    </>
  ),
  torres: <path d="M24 34V22l2-5 2 5v12M30 34V18l2-6 2 6v16M36 34V22l2-5 2 5v12" />,
  eiffel: <path d="M32 12l-6 22M32 12l6 22M27.5 26h9M29.5 19h5M25 34h14" />,
  coliseo: <path d="M18 34V22c0-3 6-5 14-5s14 2 14 5v12M22 34v-6M27 34v-7M32 34v-7M37 34v-7M42 34v-6M18 25h28" />,
  piramide: <path d="M22 33l10-15 10 15zM26 27h12M29 22.5h6" />,
  muralla: <path d="M16 32l8-6 8 3 8-6 8 3M16 28l8-6 8 3 8-6 8 3M22 23.5V21M30 25v-2.5M38 21v-2.5" />,
  fuji: <path d="M16 34l11-15h10l11 15zM27 19l2.5 4 2.5-3 2.5 3 2.5-4" />,
  // Londres: la torre del reloj, con la esfera y la aguja de arriba.
  reloj: (
    <>
      <path d="M28.5 34V17h7v17M27.5 17l4.5-6 4.5 6M32 11V7M26 34h12M28.5 27h7" />
      <circle cx="32" cy="21.5" r="2.4" />
    </>
  ),
  // Manchester: el estadio, con sus dos tribunas y los reflectores.
  estadio: <path d="M14 34v-5c6-4 30-4 36 0v5M14 29c6 3 30 3 36 0M19 27v-9M45 27v-9M17 18h4M43 18h4M24 25.5v-3M32 25v-3M40 25.5v-3" />,
  // Liverpool: el edificio del muelle con sus dos torres de cúpula, sobre el agua.
  muelle: <path d="M20 31V19l3-3 3 3v12M38 31V19l3-3 3 3v12M26 31V24h12v7M23 16v-3M41 16v-3M14 34c3-1.5 6-1.5 9 0s6 1.5 9 0 6-1.5 9 0 6 1.5 9 0" />,
  // Edimburgo y Cardiff: el castillo sobre la roca.
  castillo: <path d="M18 34l4-6h20l4 6M22 28V19h4v2h3v-2h6v2h3v-2h4v9M30 28v-3a2 2 0 014 0v3M26 19v-4h2v-2h2v2h2v4" />,
  // York: la catedral gótica, con sus dos torres y la puerta en arco.
  catedral: <path d="M20 34V17l2.5-3 2.5 3v17M39 34V17l2.5-3 2.5 3v17M25 34V23l7-5 7 5v11M30 34v-4a2 2 0 014 0v4M20 22h5M39 22h5" />,
  // Brighton: el muelle con la rueda de la feria sobre el mar.
  rueda: (
    <>
      <circle cx="32" cy="20" r="8" />
      <path d="M32 12v16M24 20h16M26.3 14.3l11.4 11.4M37.7 14.3L26.3 25.7M28 34l4-6 4 6M14 30h36M14 34c3-1.5 6-1.5 9 0s6 1.5 9 0 6-1.5 9 0 6 1.5 9 0" />
    </>
  ),
  // Bath: las columnas de los baños romanos con su frontón.
  columnas: <path d="M18 34h28M20 31h24M21 19h22l-11-6zM24 19v12M29 19v12M35 19v12M40 19v12" />,
  // Toronto: la CN Tower, con su platillo y la antena, sobre la ciudad.
  cntower: <path d="M32 6v6M30.5 12h3l1 22h-5zM27 18h10l-1.5 3.5h-7zM29 25.5h6M16 34v-7h6v7M42 34v-9h6v9M14 34h36" />,
  // Montreal: la Biosfera, la cúpula de varillas junto al río.
  biosfera: (
    <>
      <circle cx="32" cy="23" r="10" />
      <path d="M22 23h20M23.3 18h17.4M23.3 28h17.4M32 13v20M27 14c-2.2 6-2.2 12 0 18M37 14c2.2 6 2.2 12 0 18M16 34h32" />
    </>
  ),
  // Ottawa: el Parlamento, con la torre del reloj en el medio.
  parlamento: (
    <>
      <path d="M29 34V15l3-4 3 4v19M27 34V24h-9v10M37 34V24h9v10M18 24l4.5-3 4.5 3M37 24l4.5-3 4.5 3M14 34h36" />
      <circle cx="32" cy="20" r="1.6" />
    </>
  ),
  // Calgary: el sombrero vaquero de la Stampede.
  sombrero: (
    <path d="M14 28c4 3 12 4 18 4s14-1 18-4c-3 0-6 1-8 1-1-6-3-11-5-11-1.5 0-3 1.5-5 1.5s-3.5-1.5-5-1.5c-2 0-4 5-5 11-2 0-5-1-8-1zM22.5 26c6 1.5 13 1.5 19 0" />
  ),
  // Niagara: las cataratas, con el agua que cae y el río abajo.
  cataratas: (
    <path d="M14 17h36M18 17v12M23 17v14M28 17v13M33 17v14M38 17v12M43 17v13M14 34c3-1.5 6-1.5 9 0s6 1.5 9 0 6-1.5 9 0 6 1.5 9 0" />
  ),
  // B1 completo: la hoja de arce de Canadá.
  arce: (
    <path d="M32 9l2.5 5 3-1.5-1 6 4.5-3.5 1 3 4-1-2 5 2 1.5-7.5 4 1 3-6-1.2V34h-3v-4.7l-6 1.2 1-3-7.5-4 2-1.5-2-5 4 1 1-3 4.5 3.5-1-6 3 1.5z" />
  ),
};

type Lugar = {
  /** Lo que dice la banda de abajo. */
  nombre: string;
  glifo: keyof typeof GLIFOS;
  /** El cielo, de arriba hacia abajo. */
  cielo: [string, string];
  /** La tinta: monumento, colina, banda, número y marco. */
  tinta: string;
};

/** Cada lugar con su monumento y su paleta (las del boceto, y las nuevas en el mismo estilo). */
const LUGARES: Record<LugarSello, Lugar> = {
  miami: { nombre: "MIAMI", glifo: "palmera", cielo: ["#7fd8ff", "#ffd1a8"], tinta: "#d0603a" },
  orlando: { nombre: "ORLANDO", glifo: "edificios", cielo: ["#b8e6ff", "#c9f2e4"], tinta: "#2f7f8f" },
  "nueva-york": { nombre: "NUEVA YORK", glifo: "estatua", cielo: ["#a9d6ff", "#e3f1d0"], tinta: "#3d6b4f" },
  washington: { nombre: "WASHINGTON", glifo: "cupula", cielo: ["#c7cfff", "#ffe3c4"], tinta: "#4a4fa8" },
  chicago: { nombre: "CHICAGO", glifo: "edificios", cielo: ["#ffc2a8", "#ffe6b0"], tinta: "#a8372e" },
  "los-angeles": { nombre: "LOS ÁNGELES", glifo: "palmeras", cielo: ["#ffb27a", "#ffd6e6"], tinta: "#b03a6a" },
  "nueva-orleans": { nombre: "NUEVA ORLEANS", glifo: "trompeta", cielo: ["#d9c2ff", "#ffe39a"], tinta: "#5b2a86" },
  boston: { nombre: "BOSTON", glifo: "faro", cielo: ["#b5cfff", "#ffd0c7"], tinta: "#1f3b70" },
  seattle: { nombre: "SEATTLE", glifo: "aguja", cielo: ["#a6e3e9", "#dff5d8"], tinta: "#13695a" },
  "san-francisco": { nombre: "SAN FRANCISCO", glifo: "puente", cielo: ["#c4d6ea", "#f1f4f8"], tinta: "#c2461f" },
  "repaso-1": { nombre: "REPASO 1", glifo: "horizonte", cielo: ["#9fe0ff", "#ffe2b3"], tinta: "#0f5c8c" },
  "a1-completo": { nombre: "A1", glifo: "estatua", cielo: ["#ffe9a8", "#fff8e0"], tinta: "#9a6400" },
  londres: { nombre: "LONDRES", glifo: "reloj", cielo: ["#b9c8e8", "#f6d6c8"], tinta: "#a3252c" },
  manchester: { nombre: "MANCHESTER", glifo: "estadio", cielo: ["#c9d6ff", "#ffd9c2"], tinta: "#8f1f2f" },
  liverpool: { nombre: "LIVERPOOL", glifo: "muelle", cielo: ["#a8dcff", "#d9f0f5"], tinta: "#1d4f8a" },
  edimburgo: { nombre: "EDIMBURGO", glifo: "castillo", cielo: ["#c3cbe0", "#e8dcf2"], tinta: "#3f3a6b" },
  oxford: { nombre: "OXFORD", glifo: "torres", cielo: ["#ffe2a8", "#f6ead2"], tinta: "#1f3f78" },
  york: { nombre: "YORK", glifo: "catedral", cielo: ["#d6d0f2", "#f5e6c8"], tinta: "#5a3d82" },
  cambridge: { nombre: "CAMBRIDGE", glifo: "puente", cielo: ["#b8ecd8", "#e6f4ff"], tinta: "#14715a" },
  brighton: { nombre: "BRIGHTON", glifo: "rueda", cielo: ["#8fd8ff", "#ffe0f0"], tinta: "#c23f7a" },
  bath: { nombre: "BATH", glifo: "columnas", cielo: ["#ffe6b8", "#fff4dc"], tinta: "#9a6a1e" },
  cardiff: { nombre: "CARDIFF", glifo: "castillo", cielo: ["#c8f0c0", "#ffe8b0"], tinta: "#b0261f" },
  "a2-completo": { nombre: "A2", glifo: "reloj", cielo: ["#ffd9a8", "#fff3e0"], tinta: "#8a4a00" },
  toronto: { nombre: "TORONTO", glifo: "cntower", cielo: ["#a9d4ff", "#ffd6cc"], tinta: "#c0262d" },
  montreal: { nombre: "MONTREAL", glifo: "biosfera", cielo: ["#c4e3ff", "#e6f6ee"], tinta: "#1f5f8b" },
  ottawa: { nombre: "OTTAWA", glifo: "parlamento", cielo: ["#d2d8f5", "#ffe6c9"], tinta: "#2f4a2a" },
  vancouver: { nombre: "VANCOUVER", glifo: "montanas", cielo: ["#9fe0f0", "#e0f5e8"], tinta: "#0f5e6b" },
  calgary: { nombre: "CALGARY", glifo: "sombrero", cielo: ["#ffd9a0", "#fff1d6"], tinta: "#8a3b12" },
  victoria: { nombre: "VICTORIA", glifo: "cupula", cielo: ["#b8e3ff", "#ffe9f0"], tinta: "#24508f" },
  quebec: { nombre: "QUEBEC", glifo: "castillo", cielo: ["#cfd6ff", "#f3e3ff"], tinta: "#2a3f8f" },
  banff: { nombre: "BANFF", glifo: "montanas", cielo: ["#8fe3e0", "#e8fbff"], tinta: "#146f6a" },
  halifax: { nombre: "HALIFAX", glifo: "faro", cielo: ["#a8cfff", "#e9f3ff"], tinta: "#a3262d" },
  niagara: { nombre: "NIAGARA", glifo: "cataratas", cielo: ["#9fd8ff", "#dff7ff"], tinta: "#1b5a9a" },
  "b1-completo": { nombre: "B1", glifo: "arce", cielo: ["#ffc9b8", "#fff0e6"], tinta: "#c2261f" },
  mexico: { nombre: "MÉXICO", glifo: "escalonada", cielo: ["#ffcf6b", "#ff8a5c"], tinta: "#b23a1e" },
  peru: { nombre: "PERÚ", glifo: "montanas", cielo: ["#9ad9ff", "#d3f5d9"], tinta: "#2f7a3d" },
  brasil: { nombre: "BRASIL", glifo: "pandeazucar", cielo: ["#6fe0d2", "#fff3a6"], tinta: "#148a5c" },
  espana: { nombre: "ESPAÑA", glifo: "torres", cielo: ["#ffd36b", "#ff9a6b"], tinta: "#b8282e" },
  francia: { nombre: "FRANCIA", glifo: "eiffel", cielo: ["#a8c8ff", "#ffd1dc"], tinta: "#2b4bb3" },
  italia: { nombre: "ITALIA", glifo: "coliseo", cielo: ["#ffd9a0", "#ff9a7a"], tinta: "#7d3b2a" },
  egipto: { nombre: "EGIPTO", glifo: "piramide", cielo: ["#ffe08a", "#f2b05e"], tinta: "#8a5a12" },
  india: { nombre: "INDIA", glifo: "cupula", cielo: ["#ffc2e2", "#ffd99a"], tinta: "#7b2fa0" },
  china: { nombre: "CHINA", glifo: "muralla", cielo: ["#ffab96", "#ffd98a"], tinta: "#b51f1f" },
  japon: { nombre: "JAPÓN", glifo: "fuji", cielo: ["#ffcfe0", "#cfe6ff"], tinta: "#c2185b" },
};

/** Los dientes del borde perforado: círculos que la máscara recorta del papel. */
const DIENTES: [number, number][] = [];
for (let x = 3; x <= 57; x += 6) DIENTES.push([x, 0], [x, 72]);
for (let y = 3; y <= 69; y += 6) DIENTES.push([0, y], [60, y]);

const FUENTE = "var(--font-geist-sans), system-ui, sans-serif";

/**
 * Una estampilla. `apagada` la deja gris y tenue (la que todavía no se gana).
 * El número va arriba a la izquierda ("Nº3"); si no llega, no se escribe.
 */
export function Estampilla({
  lugar,
  numero,
  apagada = false,
  className,
  titulo,
}: {
  lugar: LugarSello;
  numero?: number | string;
  apagada?: boolean;
  className?: string;
  titulo?: string;
}) {
  // Cada estampilla necesita sus propios ids para la máscara y el degradé.
  const id = "est" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const { nombre, glifo, cielo, tinta } = LUGARES[lugar];
  const largo = nombre.length > 7;

  return (
    <svg
      viewBox="0 0 60 72"
      width="100%"
      role="img"
      aria-label={titulo ?? `Estampilla de ${nombre}`}
      className={className}
      style={apagada ? { filter: "grayscale(1)", opacity: 0.4 } : undefined}
    >
      <defs>
        <mask id={`${id}m`}>
          <rect width="60" height="72" fill="#fff" />
          <g fill="#000">
            {DIENTES.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" />
            ))}
          </g>
        </mask>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cielo[0]} />
          <stop offset="1" stopColor={cielo[1]} />
        </linearGradient>
      </defs>
      <rect width="60" height="72" fill="#fffdf6" mask={`url(#${id}m)`} />
      <rect x="5" y="5" width="50" height="62" rx="2" fill={`url(#${id}g)`} />
      <circle cx="42" cy="17" r="6" fill="#fff6c9" opacity=".9" />
      <path d="M5 47c10-4 18-3 25-1s15 2 25-2v23H5z" fill={tinta} opacity=".25" />
      <g
        fill="none"
        stroke={tinta}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-2,4) scale(1)"
      >
        {GLIFOS[glifo]}
      </g>
      <rect x="5" y="52" width="50" height="15" fill={tinta} />
      <text
        x="30"
        y="63"
        textAnchor="middle"
        fill="#fff"
        style={{ font: `900 8.5px ${FUENTE}`, letterSpacing: ".06em" }}
        {...(largo ? { textLength: 44, lengthAdjust: "spacingAndGlyphs" } : {})}
      >
        {nombre}
      </text>
      {numero !== undefined && numero !== "" && numero !== 0 && (
        <text x="9" y="13" fill={tinta} style={{ font: `900 6.5px ${FUENTE}` }}>
          Nº{numero}
        </text>
      )}
      <rect x="5" y="5" width="50" height="62" rx="2" fill="none" stroke={tinta} strokeWidth="1" />
    </svg>
  );
}
