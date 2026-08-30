import { NIVELES, type Nivel } from "./tipos.ts";

/**
 * ¿Está listo el alumno para el siguiente nivel?
 *
 * La regla de la casa: se PROPONE, nunca se fuerza. El selector de
 * nivel sigue libre — esta lógica solo decide cuándo vale la pena
 * decirle "vas muy bien, ¿subimos?". Por eso los umbrales pecan de
 * conservadores: una sugerencia prematura que le quede grande lo
 * devuelve frustrado; una tardía solo llega un poco después.
 *
 * Es lógica PURA a propósito: sin base de datos, se prueba en seco
 * con casos de borde (scripts/probar-ascenso.mjs). La consulta que
 * junta las señales vive en progreso.ts.
 */

/** Dos caminos de evidencia, porque hay dos formas de usar Allison. */
export const ASCENSO = {
  /** Camino de lecciones: completó casi todo el temario de su nivel. */
  unidadesNecesarias: 7,
  /** Camino libre: una muestra suficiente de turnos recientes… */
  turnosMinimos: 25,
  /** …con pocas correcciones por turno (promedio). */
  correccionesPorTurnoMax: 0.2,
} as const;

export interface SenalesDeNivel {
  /** Unidades del nivel actual completadas (de las 10). */
  unidadesCompletadas: number;
  /** Turnos recientes del alumno hablando EN su nivel actual. */
  turnosRecientes: number;
  /** Correcciones recibidas en esos turnos. */
  correccionesRecientes: number;
}

/** El nivel que sigue, o null si ya está en la cima. */
export function siguienteNivel(nivel: Nivel): Nivel | null {
  const i = NIVELES.findIndex((n) => n.nivel === nivel);
  return NIVELES[i + 1]?.nivel ?? null;
}

/**
 * La razón para sugerir el ascenso, o null si todavía no.
 * La razón se muestra TAL CUAL al alumno: debe leerse como un mérito
 * suyo, no como un cálculo nuestro.
 */
export function evaluarAscenso(s: SenalesDeNivel): string | null {
  if (s.unidadesCompletadas >= ASCENSO.unidadesNecesarias) {
    return `Completaste ${s.unidadesCompletadas} de 10 temas de tu nivel`;
  }

  if (
    s.turnosRecientes >= ASCENSO.turnosMinimos &&
    s.correccionesRecientes / s.turnosRecientes <= ASCENSO.correccionesPorTurnoMax
  ) {
    return `En tus últimos ${s.turnosRecientes} turnos casi no necesitaste correcciones`;
  }

  return null;
}
