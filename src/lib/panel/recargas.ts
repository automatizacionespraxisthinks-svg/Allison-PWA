import { sql } from "../db";

/**
 * Las recargas manuales (plan, sección 21; boceto 7): las que registra
 * el administrador cuando el alumno paga en efectivo o por transferencia.
 * Son transacciones como las de la pasarela (pasarela = el medio), así que
 * cuentan en los ingresos y quedan en el libro. Una recarga no se borra:
 * un error se corrige con un ajuste negativo con motivo.
 */

export interface RecargaManual {
  fecha: string;
  alumno: string;
  colegio: string | null;
  curso: string | null;
  intervenciones: number;
  tipo: "recarga" | "plan";
  montoCop: number;
  valorRecibido: number;
  medio: string;
  recibo: string;
  hechaPor: string;
}

const MEDIOS = ["efectivo", "transferencia"];

function fila(f: Record<string, unknown>): RecargaManual {
  const p = (f.payload ?? {}) as { recibo?: string; valorRecibido?: number; registradoPor?: string };
  return {
    fecha: (f.confirmado_en as Date | null)?.toISOString() ?? (f.creado_en as Date).toISOString(),
    alumno: f.nombre as string,
    colegio: (f.colegio as string | null) ?? null,
    curso: (f.curso as string | null) ?? null,
    intervenciones: Number(f.mensajes_otorgados),
    tipo: f.tipo === "plan" ? "plan" : "recarga",
    montoCop: Number(f.monto_cop),
    valorRecibido: Number(p.valorRecibido ?? f.monto_cop),
    medio: f.pasarela as string,
    recibo: p.recibo ?? "",
    hechaPor: p.registradoPor ?? "—",
  };
}

export async function recargasRecientes(limite = 30): Promise<RecargaManual[]> {
  const filas = await sql`
    select t.*, u.nombre, u.curso, i.nombre as colegio
      from transacciones t
      join users u on u.id = t.user_id
      left join instituciones i on i.id = u.institucion_id
     where t.pasarela in ${sql(MEDIOS)} and t.estado = 'aprobada'
     order by t.creado_en desc limit ${limite}
  `;
  return filas.map(fila);
}

/** El cuadre de caja de un día (en Bogotá): cada recarga y lo recibido. */
export async function cuadreDelDia(fecha: string): Promise<{ recargas: RecargaManual[]; recibido: number; porMedio: Record<string, number> }> {
  const filas = await sql`
    select t.*, u.nombre, u.curso, i.nombre as colegio
      from transacciones t
      join users u on u.id = t.user_id
      left join instituciones i on i.id = u.institucion_id
     where t.pasarela in ${sql(MEDIOS)} and t.estado = 'aprobada'
       and (coalesce(t.confirmado_en, t.creado_en) at time zone 'America/Bogota')::date = ${fecha}
     order by t.creado_en
  `;
  const recargas = filas.map(fila);
  const porMedio: Record<string, number> = {};
  for (const r of recargas) porMedio[r.medio] = (porMedio[r.medio] ?? 0) + r.valorRecibido;
  return { recargas, recibido: recargas.reduce((s, r) => s + r.valorRecibido, 0), porMedio };
}
