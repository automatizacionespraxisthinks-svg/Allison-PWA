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

/**
 * Un pago que hay que mirar a mano: la pasarela informó un monto distinto
 * al de la orden (no se acreditó) o anuló un pago (reembolso o
 * contracargo; el saldo no se tocó). Antes esas marcas solo quedaban en
 * el log y en el payload, y ninguna pantalla las leía (auditoría, 30 de
 * octubre de 2026).
 */
export interface PagoPorRevisar {
  id: string;
  /** Cuándo pasó: la anulación, o la orden si es un monto distinto. */
  fecha: string;
  alumnoId: string;
  alumno: string;
  alerta: string;
  estado: string;
  tipo: "recarga" | "plan";
  montoCop: number;
  intervenciones: number;
  pasarela: string;
  referencia: string;
}

/** Con alerta y sin revisar: lo mismo que cuenta la alerta del Resumen. */
const porRevisar = () => sql`t.payload->>'alerta' is not null and t.payload->>'revisada_en' is null`;

export async function pagosPorRevisar(limite = 50): Promise<PagoPorRevisar[]> {
  const filas = await sql`
    select t.id, t.estado, t.tipo, t.monto_cop, t.mensajes_otorgados, t.pasarela, t.referencia_externa,
           t.payload->>'alerta' as alerta, t.payload->>'anulada_en' as anulada_en, t.creado_en,
           u.id as user_id, u.nombre
      from transacciones t
      join users u on u.id = t.user_id
     where ${porRevisar()}
     order by t.creado_en desc limit ${limite}
  `;
  return filas.map((f) => ({
    id: f.id as string,
    fecha: (f.anulada_en as string | null) ?? (f.creado_en as Date).toISOString(),
    alumnoId: f.user_id as string,
    alumno: f.nombre as string,
    alerta: f.alerta as string,
    estado: f.estado as string,
    tipo: f.tipo === "plan" ? "plan" : "recarga",
    montoCop: Number(f.monto_cop),
    intervenciones: Number(f.mensajes_otorgados),
    pasarela: f.pasarela as string,
    referencia: f.referencia_externa as string,
  }));
}

export async function cuantosPagosPorRevisar(): Promise<number> {
  const [r] = await sql`select count(*)::int as n from transacciones t where ${porRevisar()}`;
  return Number(r.n);
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
