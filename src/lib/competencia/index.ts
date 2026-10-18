import { sql } from "../db";
import { salonDelAlumno, tablaDeLaSemana, TOPE_DIARIO_SEG, type SalonDelAlumno, type Semana } from "./tabla";

/**
 * Las consultas de la competencia por salón (las reglas están en
 * ./tabla.ts). No guarda nada propio: sale de los minutos de práctica de
 * cada día (progreso_diario.segundos_practica) y del curso de cada alumno.
 *
 * Como en el resto del panel del colegio, el colegio sale siempre de la
 * sesión, nunca de la petición.
 */

export interface CompetenciaDelColegio {
  activa: boolean;
  /** El lunes de esta semana y el de la anterior, "AAAA-MM-DD". */
  lunes: string;
  lunesAnterior: string;
  estaSemana: Semana;
  semanaAnterior: Semana;
  /** Alumnos activos sin curso: no compiten hasta que se les cargue. */
  sinCurso: number;
}

/**
 * Los segundos de esta semana y de la anterior de cada alumno activo del
 * colegio. La semana es la de Postgres (de lunes a domingo); la conexión
 * ya está en hora de Colombia (src/lib/db.ts).
 */
async function semanasDe(institucionId: string) {
  const filas = await sql`
    with s as (select date_trunc('week', current_date)::date as lunes)
    select u.curso,
           coalesce(sum(least(d.segundos_practica, ${TOPE_DIARIO_SEG})) filter (where d.fecha >= s.lunes), 0)::int as esta,
           coalesce(sum(least(d.segundos_practica, ${TOPE_DIARIO_SEG})) filter (where d.fecha < s.lunes), 0)::int as anterior
      from users u
      cross join s
      left join progreso_diario d on d.user_id = u.id and d.fecha >= s.lunes - 7
     where u.institucion_id = ${institucionId}
       and u.rol = 'estudiante'
       and u.activo
     group by u.id, u.curso
  `;
  // Aparte: un colegio sin alumnos también tiene semana.
  const [semana] = await sql`
    select to_char(date_trunc('week', current_date), 'YYYY-MM-DD') as lunes,
           to_char(date_trunc('week', current_date) - interval '7 days', 'YYYY-MM-DD') as lunes_anterior
  `;
  const conCurso = filas.filter((f) => f.curso);
  return {
    lunes: semana.lunes as string,
    lunesAnterior: semana.lunes_anterior as string,
    // Los alumnos de la semana pasada son los de hoy: no se guarda quién estaba entonces.
    estaSemana: tablaDeLaSemana(conCurso.map((f) => ({ curso: f.curso, segundos: f.esta }))),
    semanaAnterior: tablaDeLaSemana(conCurso.map((f) => ({ curso: f.curso, segundos: f.anterior }))),
    sinCurso: filas.length - conCurso.length,
  };
}

/** Para el panel del coordinador: las dos semanas y si está encendida. */
export async function competenciaDelColegio(institucionId: string): Promise<CompetenciaDelColegio | null> {
  const [c] = await sql`select competencia_activa from instituciones where id = ${institucionId}`;
  if (!c) return null;
  return { activa: c.competencia_activa, ...(await semanasDe(institucionId)) };
}

/**
 * Para la tarjeta de Mi ruta: dónde va el salón del alumno, o null si no
 * compite (alumno particular, sin curso, salón pequeño, competencia
 * apagada por el colegio).
 */
export async function salonDe(userId: string): Promise<SalonDelAlumno | null> {
  const [u] = await sql`
    select u.curso, u.institucion_id, i.competencia_activa
      from users u
      join instituciones i on i.id = u.institucion_id
     where u.id = ${userId} and u.rol = 'estudiante' and u.activo
  `;
  if (!u?.curso || !u.competencia_activa) return null;
  const s = await semanasDe(u.institucion_id);
  return salonDelAlumno(u.curso, s.estaSemana, s.semanaAnterior, s.lunesAnterior);
}

/** El coordinador enciende o apaga la competencia de su colegio. */
export async function activarCompetencia(institucionId: string, activa: boolean): Promise<void> {
  await sql`update instituciones set competencia_activa = ${activa} where id = ${institucionId}`;
}
