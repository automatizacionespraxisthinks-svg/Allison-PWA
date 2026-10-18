import { cache } from "react";
import { sql } from "./db";

/**
 * Los ajustes del panel (plan, sección 21): los valores que antes
 * estaban fijos en el código. Viven en la tabla `ajustes`
 * (db/026_panel.sql); si falta alguno, vale el de siempre.
 */
export interface Ajustes {
  /** Pesos por dólar para el costo de IA (antes fijo en 4.000). */
  dolarCop: number;
  /** Días que la racha aguanta sin practicar. */
  diasDescansoRacha: number;
  alertaInactivoDias: number;
  /** Porcentaje del último saldo asignado a un colegio o curso. */
  alertaSaldoColegioPct: number;
  alertaReporteDias: number;
  alertaParadaIntervenciones: number;
  /** El correo cuando la racha está por perderse. */
  recordatorioCorreo: boolean;
  /** El aviso en el celular cuando la racha está por perderse (va en vez del correo). */
  recordatorioCelular: boolean;
  /** Desde cuándo está la versión nueva: parte la retención en antes y después. */
  fechaVersionNueva: string | null;
}

const AJUSTES_POR_DEFECTO: Ajustes = {
  dolarCop: 4000,
  diasDescansoRacha: 2,
  alertaInactivoDias: 7,
  alertaSaldoColegioPct: 10,
  alertaReporteDias: 3,
  alertaParadaIntervenciones: 50,
  recordatorioCorreo: true,
  recordatorioCelular: true,
  fechaVersionNueva: null,
};

/** El nombre de cada ajuste en la base. */
export const CLAVES: Record<keyof Ajustes, string> = {
  dolarCop: "dolar_cop",
  diasDescansoRacha: "dias_descanso_racha",
  alertaInactivoDias: "alerta_inactivo_dias",
  alertaSaldoColegioPct: "alerta_saldo_colegio_pct",
  alertaReporteDias: "alerta_reporte_dias",
  alertaParadaIntervenciones: "alerta_parada_intervenciones",
  recordatorioCorreo: "recordatorio_correo",
  recordatorioCelular: "recordatorio_celular",
  fechaVersionNueva: "fecha_version_nueva",
};

/** Una lectura por petición (las páginas del panel la piden varias veces). */
export const leerAjustes = cache(async (): Promise<Ajustes> => {
  const filas = await sql`select clave, valor from ajustes`.catch(() => []);
  const de = new Map(filas.map((f) => [f.clave as string, f.valor as unknown]));
  const a = { ...AJUSTES_POR_DEFECTO };
  for (const [k, clave] of Object.entries(CLAVES) as [keyof Ajustes, string][]) {
    const v = de.get(clave);
    if (v === undefined || v === null) continue;
    const defecto = AJUSTES_POR_DEFECTO[k];
    if (typeof defecto === "number" && typeof v === "number" && Number.isFinite(v)) (a[k] as number) = v;
    else if (typeof defecto === "boolean" && typeof v === "boolean") (a[k] as boolean) = v;
    else if (k === "fechaVersionNueva" && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) a.fechaVersionNueva = v;
  }
  return a;
});

/** Guarda los ajustes que cambiaron (solo esos), con quién los cambió. */
export async function guardarAjustes(cambios: Partial<Ajustes>, quien: string): Promise<void> {
  const actuales = await leerAjustes();
  for (const [k, v] of Object.entries(cambios) as [keyof Ajustes, Ajustes[keyof Ajustes]][]) {
    if (v === undefined || !(k in CLAVES) || actuales[k] === v) continue;
    // null va como el null de JSON: la columna no acepta el NULL de SQL.
    await sql`
      insert into ajustes (clave, valor, actualizado_por)
      values (${CLAVES[k]}, ${v === null ? sql`'null'::jsonb` : sql.json(v as never)}, ${quien})
      on conflict (clave) do update
         set valor = excluded.valor, actualizado_en = now(), actualizado_por = excluded.actualizado_por
    `;
  }
}
