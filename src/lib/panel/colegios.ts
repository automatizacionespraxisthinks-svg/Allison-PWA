import { sql } from "../db";

/**
 * Asignar saldo a un colegio o a sus cursos (plan, sección 12; boceto 4):
 * a todo el colegio, a un curso o a varios a la vez, con motivo. Antes de
 * confirmar se ve el total y a quién le llega. El saldo queda en cada
 * alumno (bolsa de recarga: no vence ni se renueva solo) y cada uno tiene
 * su movimiento en el libro con el motivo y quién lo hizo. Los alumnos
 * inactivos no reciben.
 */

export const MAX_POR_ALUMNO = 5000;

export interface PedidoAsignacion {
  institucionId: string;
  /** null: todo el colegio. "(sin curso)" son los que no tienen curso. */
  cursos: string[] | null;
  porAlumno: number;
  motivo: string;
}

/** Los alumnos que recibirían la asignación. */
async function destinatarios(p: PedidoAsignacion): Promise<{ id: string }[]> {
  const cursos = p.cursos?.filter((c) => c !== "(sin curso)") ?? [];
  const sinCurso = p.cursos?.includes("(sin curso)") ?? false;
  return (await sql`
    select id from users
     where institucion_id = ${p.institucionId} and rol = 'estudiante' and activo
       ${
         p.cursos === null
           ? sql``
           : sql`and (${cursos.length ? sql`curso in ${sql(cursos)}` : sql`false`} or ${sinCurso ? sql`curso is null` : sql`false`})`
       }
     order by nombre
  `) as unknown as { id: string }[];
}

/** Lo que pasaría: a cuántos alumnos les llega y el total. */
export async function previsualizar(p: PedidoAsignacion): Promise<{ alumnos: number; total: number }> {
  const d = await destinatarios(p);
  return { alumnos: d.length, total: d.length * p.porAlumno };
}

/** La asignación: todo o nada, en una sola transacción. */
export async function asignarSaldo(p: PedidoAsignacion, quien: string): Promise<{ alumnos: number; total: number }> {
  const d = await destinatarios(p);
  if (!d.length) return { alumnos: 0, total: 0 };
  const etiqueta = p.cursos === null ? "todo el colegio" : p.cursos.join(", ");
  const nota = `Asignación del colegio (${etiqueta}) · «${p.motivo}» — por ${quien}`;
  await sql.begin(async (tx) => {
    for (const { id } of d) {
      await tx`select ajustar_saldo(${id}, ${p.porAlumno}, 'recarga'::bolsa_credito, ${nota})`;
    }
    await tx`
      insert into asignaciones_saldo (institucion_id, cursos, por_alumno, alumnos, motivo, hecha_por)
      values (${p.institucionId}, ${p.cursos}, ${p.porAlumno}, ${d.length}, ${p.motivo}, ${quien})
    `;
  });
  return { alumnos: d.length, total: d.length * p.porAlumno };
}

export interface AsignacionHecha {
  fecha: string;
  colegio: string;
  cursos: string | null;
  porAlumno: number;
  alumnos: number;
  motivo: string;
  hechaPor: string;
}

export async function asignacionesAnteriores(limite = 20): Promise<AsignacionHecha[]> {
  const filas = await sql`
    select a.creado_en, i.nombre as colegio, a.cursos, a.por_alumno, a.alumnos, a.motivo, a.hecha_por
      from asignaciones_saldo a join instituciones i on i.id = a.institucion_id
     order by a.creado_en desc limit ${limite}
  `;
  return filas.map((f) => ({
    fecha: (f.creado_en as Date).toISOString(),
    colegio: f.colegio,
    cursos: (f.cursos as string[] | null)?.join(", ") ?? null,
    porAlumno: f.por_alumno,
    alumnos: f.alumnos,
    motivo: f.motivo,
    hechaPor: f.hecha_por,
  }));
}

/** Cada colegio con sus cursos y alumnos activos (para elegir a quién asignar). */
export async function colegiosConCursos(): Promise<
  { id: string; nombre: string; codigo: string; cursos: { curso: string; alumnos: number }[]; alumnos: number }[]
> {
  const [colegios, cursos] = await Promise.all([
    sql`select id, nombre, codigo_acceso from instituciones order by nombre`,
    sql`
      select institucion_id, coalesce(curso, '(sin curso)') as curso, count(*)::int as alumnos
        from users
       where institucion_id is not null and rol = 'estudiante' and activo
       group by 1, 2 order by 2
    `,
  ]);
  return colegios.map((c) => {
    const suyos = cursos.filter((x) => x.institucion_id === c.id).map((x) => ({ curso: x.curso as string, alumnos: x.alumnos as number }));
    return { id: c.id, nombre: c.nombre, codigo: c.codigo_acceso, cursos: suyos, alumnos: suyos.reduce((s, x) => s + x.alumnos, 0) };
  });
}
