/**
 * La competencia semanal por salón (documento "Competencia por salón y
 * recordatorios en el celular", aprobado el 17 de octubre de 2026), sin
 * base de datos: cómo se arma la tabla de una semana y lo que ve cada
 * quien. Las consultas están en ./index.ts.
 *
 *   · Compiten los salones de un mismo colegio (el curso de cada alumno).
 *   · Cuentan los minutos de práctica de la meta diaria, con tope de 30
 *     por alumno al día, divididos entre TODOS los alumnos activos del
 *     salón: el que no ha entrado suma cero.
 *   · Un salón necesita al menos 5 alumnos activos para aparecer, y hacen
 *     falta dos salones para que haya competencia.
 *   · La semana va de lunes a domingo, en hora de Colombia.
 *
 * Nadie ve los minutos de un compañero: solo el promedio de cada salón.
 */

/** Lo que cuenta por alumno en un día: 30 minutos. Premia practicar seguido, no dejar la app abierta. */
export const TOPE_DIARIO_SEG = 30 * 60;
/** Los alumnos activos que necesita un salón para aparecer. */
export const MINIMO_ALUMNOS = 5;
/** Los salones que ve el alumno en su tarjeta. */
const PRIMEROS = 3;

/** Un alumno activo en la semana: su salón y sus segundos (ya con el tope de cada día). */
export interface AlumnoEnSemana {
  curso: string;
  segundos: number;
}

export interface SalonEnTabla {
  curso: string;
  alumnos: number;
  /** Minutos por alumno, redondeados: es lo que se muestra y lo que ordena la tabla. */
  minutos: number;
  /** 1, 2, 3…; dos salones con los mismos minutos comparten el puesto. */
  puesto: number;
}

export interface Semana {
  /** Los salones que compiten, del primero al último. Vacía si no hay competencia. */
  tabla: SalonEnTabla[];
  /** Los salones que no aparecen por tener menos de 5 alumnos activos. */
  pequenos: string[];
}

/** "9A" antes de "10A", y "10A" antes de "10B". */
function porNombre(a: string, b: string): number {
  return a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
}

/** La tabla de una semana a partir de los segundos de cada alumno. */
export function tablaDeLaSemana(alumnos: AlumnoEnSemana[]): Semana {
  const salones = new Map<string, { alumnos: number; segundos: number }>();
  for (const a of alumnos) {
    const curso = a.curso.trim();
    if (!curso) continue;
    const s = salones.get(curso) ?? { alumnos: 0, segundos: 0 };
    s.alumnos++;
    s.segundos += Math.max(0, a.segundos);
    salones.set(curso, s);
  }

  const pequenos: string[] = [];
  const grandes: Omit<SalonEnTabla, "puesto">[] = [];
  for (const [curso, s] of salones) {
    if (s.alumnos < MINIMO_ALUMNOS) pequenos.push(curso);
    else grandes.push({ curso, alumnos: s.alumnos, minutos: Math.round(s.segundos / 60 / s.alumnos) });
  }
  pequenos.sort(porNombre);
  // Un salón solo no compite con nadie.
  if (grandes.length < 2) return { tabla: [], pequenos };

  grandes.sort((a, b) => b.minutos - a.minutos || porNombre(a.curso, b.curso));
  const tabla = grandes.map((s, i) => ({ ...s, puesto: i + 1 }));
  for (let i = 1; i < tabla.length; i++) {
    if (tabla[i].minutos === tabla[i - 1].minutos) tabla[i].puesto = tabla[i - 1].puesto;
  }
  return { tabla, pequenos };
}

/** Los ganadores de una semana ya cerrada: los primeros, si practicaron algo. Pueden ser dos si empataron. */
export function ganadores(tabla: SalonEnTabla[]): SalonEnTabla[] {
  return tabla.filter((s) => s.puesto === 1 && s.minutos > 0);
}

/** "1 minuto", "42 minutos". */
export function minutosEnTexto(n: number): string {
  return n === 1 ? "1 minuto" : `${n} minutos`;
}

/** Lo que el alumno ve en Mi ruta. */
export interface SalonDelAlumno {
  curso: string;
  puesto: number;
  /** Cuántos salones compiten. */
  de: number;
  minutos: number;
  /** Los tres primeros de la semana. */
  primeros: SalonEnTabla[];
  /** Nadie ha practicado esta semana todavía (el lunes temprano). */
  empieza: boolean;
  /** Si su salón ganó la semana pasada: el lunes de esa semana ("AAAA-MM-DD") y sus minutos. */
  gano: { lunes: string; minutos: number } | null;
}

/**
 * La tarjeta del alumno, o null si su salón no compite (no tiene curso,
 * tiene menos de 5 alumnos activos o es el único que compite).
 */
export function salonDelAlumno(
  curso: string | null,
  estaSemana: Semana,
  semanaAnterior: Semana,
  lunesAnterior: string
): SalonDelAlumno | null {
  const mio = curso?.trim();
  if (!mio) return null;
  const s = estaSemana.tabla.find((x) => x.curso === mio);
  if (!s) return null;
  const ganador = ganadores(semanaAnterior.tabla).find((x) => x.curso === mio);
  return {
    curso: mio,
    puesto: s.puesto,
    de: estaSemana.tabla.length,
    minutos: s.minutos,
    primeros: estaSemana.tabla.slice(0, PRIMEROS),
    empieza: estaSemana.tabla.every((x) => x.minutos === 0),
    gano: ganador ? { lunes: lunesAnterior, minutos: ganador.minutos } : null,
  };
}

/** "Tu salón 9A va 2.º de 6 esta semana · 42 minutos por alumno". */
export function fraseDelSalon(s: SalonDelAlumno): string {
  if (s.empieza) return `Tu salón ${s.curso} compite con ${s.de - 1} ${s.de === 2 ? "salón" : "salones"} esta semana`;
  return `Tu salón ${s.curso} va ${s.puesto}.º de ${s.de} esta semana · ${minutosEnTexto(s.minutos)} por alumno`;
}
