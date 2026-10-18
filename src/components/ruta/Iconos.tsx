import type { TipoActividad } from "@/lib/ruta/tipos";

/**
 * Los íconos de Mi ruta, tal cual los bocetos aprobados. Los de las
 * actividades son de dos tonos: el color principal sale de currentColor
 * y los detalles de --c2 y --c3 (la clase act-<tipo> los define).
 */

const DOS_TONOS: Record<TipoActividad, React.ReactNode> = {
  "escucha-elige": (
    <>
      <path d="M3 14v-2a9 9 0 0118 0v2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="2" y="13" width="6" height="8.5" rx="2.5" fill="currentColor" />
      <rect x="16" y="13" width="6" height="8.5" rx="2.5" fill="currentColor" />
      <rect x="3.5" y="15" width="2" height="4.5" rx="1" fill="var(--c2)" />
      <rect x="18.5" y="15" width="2" height="4.5" rx="1" fill="var(--c2)" />
    </>
  ),
  "que-es-esto": (
    <>
      <rect x="2.5" y="3.5" width="17" height="14" rx="4" fill="currentColor" />
      <path d="M4.5 16l4-5 3 3 2-2 4.5 4z" fill="var(--c2)" />
      <circle cx="15.5" cy="7.5" r="1.7" fill="var(--c2)" />
      <circle cx="18.5" cy="18.5" r="5" fill="var(--c3)" />
      <path
        d="M17.1 17.2a1.5 1.5 0 112.4 1.2c-.5.3-.9.6-.9 1.2M18.6 21.3v.1"
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  repite: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0112.8-5.3" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M19.5 12a7.5 7.5 0 01-12.8 5.3" fill="none" stroke="var(--c3)" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M14.5 3.5h4v4z" fill="currentColor" />
      <path d="M9.5 20.5h-4v-4z" fill="var(--c3)" />
    </>
  ),
  "tu-turno": (
    <>
      <path
        d="M10 14.5h6.5l4.5 3.5v-3.5a2.5 2.5 0 002-2.5V8.5a2.5 2.5 0 00-2.5-2.5H19v4a4 4 0 01-4 4z"
        fill="var(--c2)"
      />
      <path
        d="M1.5 4.5a3 3 0 013-3h10a3 3 0 013 3v5a3 3 0 01-3 3H8l-4.5 3.5v-3.7A3 3 0 011.5 9.5z"
        fill="currentColor"
      />
      <circle cx="6.5" cy="7" r="1.3" fill="var(--c3)" />
      <circle cx="9.5" cy="7" r="1.3" fill="var(--c3)" />
      <circle cx="12.5" cy="7" r="1.3" fill="var(--c3)" />
    </>
  ),
  dilo: (
    <>
      <rect x="1.5" y="2.5" width="12" height="11" rx="3" fill="var(--c2)" />
      <rect x="10.5" y="10" width="12" height="11.5" rx="3" fill="currentColor" />
      <path
        d="M4.5 6h6M7.5 5v1.5M5.5 6c.5 2.5 2.5 4 4.5 4.5M9.5 6c-.5 2-2 3.5-4 4.5"
        fill="none"
        stroke="var(--c3)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M13.5 19l3-6.5 3 6.5M14.5 17h4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  describe: (
    <>
      <rect x="1.5" y="2.5" width="21" height="13" rx="3.5" fill="currentColor" />
      <path d="M3.5 13.5l4.5-5 3.5 3.5 2.5-2.5 5 4z" fill="var(--c2)" />
      <circle cx="17.5" cy="6.5" r="1.8" fill="var(--c2)" />
      <rect x="2" y="17.5" width="20" height="2.3" rx="1.15" fill="var(--c3)" />
      <rect x="2" y="21" width="13" height="2.3" rx="1.15" fill="var(--c3)" />
    </>
  ),
  responde: (
    <>
      <rect x="9" y="1" width="6" height="3.2" rx="1.3" fill="var(--c2)" />
      <circle cx="12" cy="13.5" r="9" fill="currentColor" />
      <path d="M12 13.5V8" stroke="var(--c3)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 13.5l3.8 2.2" stroke="var(--c2)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="13.5" r="1.4" fill="var(--c3)" />
    </>
  ),
  entrevista: (
    <>
      <circle cx="8.5" cy="8" r="4.2" fill="currentColor" />
      <path d="M1.5 21.5c0-4.2 3.2-7.3 7-7.3s7 3.1 7 7.3z" fill="currentColor" />
      <circle cx="18" cy="7.5" r="5" fill="var(--c3)" />
      <path
        d="M16.6 6.3a1.5 1.5 0 112.4 1.2c-.5.3-.9.6-.9 1.2M18.1 10.4v.1"
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  adivina: (
    <>
      <rect x="1.8" y="5" width="10.5" height="14.5" rx="2.5" fill="var(--c2)" transform="rotate(-10 7 12.2)" />
      <rect x="10.5" y="3.5" width="11" height="15.5" rx="2.6" fill="currentColor" transform="rotate(7 16 11.2)" />
      <path
        d="M14.3 9.2a2 2 0 113.1 1.6c-.7.4-1.1.9-1.1 1.6M16.2 15v.1"
        stroke="#fff"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  cuentame: (
    <>
      <path d="M2.5 5.5A3.5 3.5 0 016 2h11.5A3.5 3.5 0 0121 5.5v6A3.5 3.5 0 0117.5 15H10l-4.5 4v-4H6a3.5 3.5 0 01-3.5-3.5z" fill="currentColor" />
      <rect x="6.2" y="5.6" width="11" height="2.1" rx="1.05" fill="var(--c2)" />
      <rect x="6.2" y="9.4" width="7" height="2.1" rx="1.05" fill="var(--c2)" />
      <circle cx="18" cy="18" r="5" fill="var(--c3)" />
      <path d="M18 15.6v2.6l1.7 1.1" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // Narra la secuencia: cuatro viñetas en orden, la última resaltada.
  narra: (
    <>
      <rect x="2" y="2.5" width="9" height="8.5" rx="2" fill="currentColor" />
      <rect x="13" y="2.5" width="9" height="8.5" rx="2" fill="var(--c2)" />
      <rect x="2" y="13" width="9" height="8.5" rx="2" fill="var(--c2)" />
      <rect x="13" y="13" width="9" height="8.5" rx="2" fill="var(--c3)" />
      <path d="M5.5 6.8h2M16.5 6.8h2M5.5 17.3h2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 17.3l1.3 1.3 2.4-2.6" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Enséñale a Allison: un libro abierto y la bombilla de la idea nueva.
  ensenale: (
    <>
      <path d="M1.5 7c3-1.5 6-1.5 9.5.5v13c-3.5-2-6.5-2-9.5-.5z" fill="currentColor" />
      <path d="M22.5 7c-3-1.5-6-1.5-9.5.5v13c3.5-2 6.5-2 9.5-.5z" fill="var(--c2)" />
      <circle cx="18" cy="5.5" r="4.3" fill="var(--c3)" />
      <path d="M16.6 5.4c0-1 .7-1.6 1.4-1.6s1.4.6 1.4 1.6c0 .8-.6 1-.8 1.8h-1.2c-.2-.8-.8-1-.8-1.8zM17.3 8.4h1.4" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </>
  ),
};

/** El ícono de dos tonos de una actividad (va dentro de un elemento con la clase act-<tipo>). */
export function IconoActividad({ tipo, className }: { tipo: TipoActividad; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      {DOS_TONOS[tipo]}
    </svg>
  );
}

const LINEA: Record<string, React.ReactNode> = {
  ruta: (
    <>
      <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </>
  ),
  viajes: (
    <>
      <path d="M2.5 13.5l19-8-5 15-4.5-5.5z" />
      <path d="M12 15l3.5-6" />
    </>
  ),
  charla: (
    <>
      <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M17 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v3l-4-3h-3a2 2 0 0 1-2-1" />
    </>
  ),
  escenarios: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="16" cy="9" r="1.5" />
    </>
  ),
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1-4 5-6 8-6s7 2 8 6" />
    </>
  ),
  racha: <path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />,
  check: <path d="M6 12l4 4 8-9" />,
  candado: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="2" />
      <path d="M9 11V8a3 3 0 016 0v3" />
    </>
  ),
  atras: <path d="M15 6l-6 6 6 6" />,
  abajo: <path d="M6 9l6 6 6-6" />,
  libro: <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16" />,
  play: <path d="M8 5v14l11-7z" fill="currentColor" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" />
    </>
  ),
  teclado: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
    </>
  ),
  lento: (
    <>
      <path d="M3 17h13a5 5 0 0 0 5-5V9" />
      <circle cx="11" cy="12" r="5" />
      <path d="M21 9l-2-3M21 9l1-3" />
    </>
  ),
  voltear: <path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" />,
  guardar: <path d="M6 3h12v18l-6-4-6 4z" />,
  ayuda: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />
    </>
  ),
  salta: <path d="M5 6l6 6-6 6M13 6l6 6-6 6" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  enviar: <path d="M4 12l16-8-6 16-2-6z" />,
  idea: <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />,
  comida: (
    <>
      <circle cx="12" cy="13" r="6" />
      <path d="M3 4v5a2 2 0 0 0 2 2M5 4v16M21 4c-1.5 1-2 3-2 5s1 2 2 2v9" />
    </>
  ),
  compara: <path d="M4 8h14l-3-3M20 16H6l3 3" />,
  lupa: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  chispa: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />,
  bolsa: (
    <>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  salud: <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" />,
  ciudad: (
    <>
      <path d="M3 21h18M5 21V9l5-3v15M10 21V4h9v17" />
      <path d="M13 8h3M13 12h3M13 16h3" />
    </>
  ),
  estrella: <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z" />,
  regalo: (
    <>
      <rect x="3" y="9" width="18" height="12" rx="2" />
      <path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S9 9 12 9zm0 0c2-4 6-4 6-1.5S15 9 12 9z" />
    </>
  ),
  trofeo: (
    <>
      <path d="M7 4h10v5a5 5 0 01-10 0z" />
      <path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8 21h8M9 18h6" />
    </>
  ),
};

export type NombreIcono = keyof typeof LINEA;

/** Íconos de línea (navegación, controles). */
export function Icono({ nombre, className = "size-5" }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {LINEA[nombre]}
    </svg>
  );
}

/** Estrella rellena o vacía, con borde para que no se pierda sobre el camino. */
export function Estrella({ llena, className = "size-4" }: { llena: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z"
        fill={llena ? "var(--estrella)" : "#fff"}
        stroke="#8a5300"
        strokeWidth="1.7"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}

/** Tres estrellas, encendidas hasta `n`. */
export function Estrellas({ n, className = "size-4" }: { n: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${n} de 3 estrellas`}>
      {[1, 2, 3].map((i) => (
        <Estrella key={i} llena={i <= n} className={className} />
      ))}
    </span>
  );
}
