import { sql } from "../db";
import type { Nivel } from "../tipos";
import { costoCop, type Rango } from "../uso";
import { vaEn } from "./etiquetas";

/**
 * Uso e IA · consumo por estudiante (plan, secciones 16 y 21): todos los
 * estudiantes, con buscador, filtro por colegio y curso, el consumo
 * separado por las partes de la app, el saldo y las alertas. Sale de
 * uso_diario, que sobrevive al borrado de las conversaciones.
 */

export const POR_PAGINA = 50;

export type Orden = "intervenciones" | "costo" | "saldo" | "nombre" | "inactivos";
export type Estado = "todos" | "sin-saldo" | "prueba";

export interface FiltroConsumo {
  rango: Rango;
  q?: string;
  /** "todos", "particulares" o el id del colegio. */
  colegio?: string;
  curso?: string;
  estado?: Estado;
  orden?: Orden;
  pagina?: number;
}

export interface FilaConsumo {
  id: string;
  nombre: string;
  identificador: string;
  colegio: string | null;
  curso: string | null;
  nivel: Nivel;
  vaEn: string;
  intervenciones: number;
  /** Intervenciones por parte de la app (ruta, escenario, hablar, viajes, escenarios). */
  porParte: Record<string, number>;
  tokensEntrada: number;
  tokensSalida: number;
  costoCop: number;
  saldo: number;
  enPrueba: boolean;
  /** Días desde la última práctica; null si nunca practicó. */
  diasSinActividad: number | null;
  creadoEn: string;
}

export interface Consumo {
  filas: FilaConsumo[];
  /** Cuántos estudiantes cumplen el filtro (para las páginas). */
  total: number;
  totales: { intervenciones: number; alumnos: number; tokensEntrada: number; tokensSalida: number; costoCop: number };
  porParte: Record<string, number>;
  /** Para los botones de la vigilancia. */
  cuentas: { todos: number; sinSaldo: number; prueba: number };
}

const n = (v: unknown) => Number(v ?? 0);
const UUID = /^[0-9a-f-]{36}$/;

/**
 * Los estudiantes del filtro con su consumo del periodo. `todas: true`
 * devuelve todas las filas sin páginas (la descarga en CSV).
 */
export async function consumoPorAlumno(f: FiltroConsumo, dolar: number, todas = false): Promise<Consumo> {
  const { desde, hasta } = f.rango;
  const q = f.q?.trim().toLowerCase() ?? "";
  const colegio = f.colegio && (f.colegio === "particulares" || UUID.test(f.colegio)) ? f.colegio : "todos";
  const curso = colegio !== "todos" && colegio !== "particulares" ? (f.curso?.trim() ?? "") : "";
  const estado = f.estado ?? "todos";
  const pagina = Math.max(1, Math.floor(f.pagina ?? 1));

  // Los estudiantes del filtro, con lo que se necesita para ordenar.
  const base = sql`
    select u.id, u.nombre, coalesce(u.email::text, u.username, u.telefono, '—') as identificador,
           u.nivel, u.curso, u.creado_en, u.ultima_practica_en, i.nombre as colegio,
           coalesce(s.mensajes_plan, 0) + coalesce(s.mensajes_recarga, 0) as saldo,
           (u.institucion_id is null and not exists (
              select 1 from transacciones t where t.user_id = u.id and t.estado = 'aprobada'
           )) as en_prueba,
           coalesce(d.turnos, 0) as turnos,
           coalesce(d.entrada, 0) as entrada,
           coalesce(d.salida, 0) as salida
      from users u
      left join instituciones i on i.id = u.institucion_id
      left join saldos s on s.user_id = u.id
      left join (
        select user_id, sum(turnos)::int as turnos,
               sum(tokens_entrada + tokens_ayuda_entrada)::bigint as entrada,
               sum(tokens_salida + tokens_ayuda_salida)::bigint as salida
          from uso_diario where fecha between ${desde} and ${hasta}
         group by user_id
      ) d on d.user_id = u.id
     where u.rol = 'estudiante' and u.activo
       ${q ? sql`and (lower(u.nombre) like ${`%${q}%`} or lower(coalesce(u.email::text, '')) like ${`%${q}%`} or lower(coalesce(u.username, '')) like ${`%${q}%`})` : sql``}
       ${colegio === "particulares" ? sql`and u.institucion_id is null` : colegio !== "todos" ? sql`and u.institucion_id = ${colegio}` : sql``}
       ${curso ? (curso === "(sin curso)" ? sql`and u.curso is null` : sql`and u.curso = ${curso}`) : sql``}
  `;

  const filtroEstado =
    estado === "sin-saldo" ? sql`where saldo = 0` : estado === "prueba" ? sql`where en_prueba` : sql``;
  const orden =
    f.orden === "nombre"
      ? sql`order by nombre`
      : f.orden === "costo"
        ? sql`order by (entrada * 0.1 + salida * 0.4) desc, nombre`
        : f.orden === "saldo"
          ? sql`order by saldo asc, nombre`
          : f.orden === "inactivos"
            ? sql`order by ultima_practica_en asc nulls first, nombre`
            : sql`order by turnos desc, nombre`;

  const [filas, [tot]] = await Promise.all([
    sql`
      with b as (${base}) select * from b ${filtroEstado} ${orden}
      ${todas ? sql`` : sql`limit ${POR_PAGINA} offset ${(pagina - 1) * POR_PAGINA}`}
    `,
    sql`
      with b as (${base})
      select count(*) filter (where ${estado === "sin-saldo" ? sql`saldo = 0` : estado === "prueba" ? sql`en_prueba` : sql`true`})::int as total,
             count(*)::int as todos,
             count(*) filter (where saldo = 0)::int as sin_saldo,
             count(*) filter (where en_prueba)::int as prueba,
             coalesce(sum(turnos) filter (where ${estado === "sin-saldo" ? sql`saldo = 0` : estado === "prueba" ? sql`en_prueba` : sql`true`}), 0)::int as turnos,
             count(*) filter (where turnos > 0 and ${estado === "sin-saldo" ? sql`saldo = 0` : estado === "prueba" ? sql`en_prueba` : sql`true`})::int as con_uso,
             coalesce(sum(entrada) filter (where ${estado === "sin-saldo" ? sql`saldo = 0` : estado === "prueba" ? sql`en_prueba` : sql`true`}), 0)::bigint as entrada,
             coalesce(sum(salida) filter (where ${estado === "sin-saldo" ? sql`saldo = 0` : estado === "prueba" ? sql`en_prueba` : sql`true`}), 0)::bigint as salida
        from b
    `,
  ]);

  const ids = filas.map((x) => x.id as string);
  const [partes, ultimas, partesTotales] = await Promise.all([
    ids.length
      ? sql`
          select d.user_id, p.key as parte, sum(p.value::int)::int as turnos
            from uso_diario d, jsonb_each_text(d.turnos_por_parte) p
           where d.fecha between ${desde} and ${hasta} and d.user_id in ${sql(ids)}
           group by d.user_id, p.key
        `
      : Promise.resolve([]),
    ids.length
      ? sql`
          select distinct on (user_id) user_id, parada
            from ruta_lecciones where user_id in ${sql(ids)}
           order by user_id, actualizado_en desc
        `
      : Promise.resolve([]),
    sql`
      with b as (${base})
      select p.key as parte, sum(p.value::int)::int as turnos
        from uso_diario d join b on b.id = d.user_id, jsonb_each_text(d.turnos_por_parte) p
       where d.fecha between ${desde} and ${hasta}
       group by p.key
    `,
  ]);

  const partesDe = new Map<string, Record<string, number>>();
  for (const p of partes) {
    const m = partesDe.get(p.user_id) ?? {};
    m[p.parte as string] = n(p.turnos);
    partesDe.set(p.user_id, m);
  }
  const ultimaDe = new Map(ultimas.map((u) => [u.user_id as string, u.parada as string]));
  const ahora = Date.now();

  return {
    filas: filas.map((x) => {
      const ultima = x.ultima_practica_en as Date | null;
      return {
        id: x.id,
        nombre: x.nombre,
        identificador: x.identificador,
        colegio: x.colegio,
        curso: x.curso,
        nivel: x.nivel as Nivel,
        vaEn: vaEn(x.nivel as Nivel, ultimaDe.get(x.id) ?? null),
        intervenciones: n(x.turnos),
        porParte: partesDe.get(x.id) ?? {},
        tokensEntrada: n(x.entrada),
        tokensSalida: n(x.salida),
        costoCop: costoCop(n(x.entrada), n(x.salida), dolar),
        saldo: n(x.saldo),
        enPrueba: !!x.en_prueba,
        diasSinActividad: ultima ? Math.floor((ahora - ultima.getTime()) / 86_400_000) : null,
        creadoEn: (x.creado_en as Date).toISOString(),
      };
    }),
    total: n(tot.total),
    totales: {
      intervenciones: n(tot.turnos),
      alumnos: n(tot.con_uso),
      tokensEntrada: n(tot.entrada),
      tokensSalida: n(tot.salida),
      costoCop: costoCop(n(tot.entrada), n(tot.salida), dolar),
    },
    porParte: Object.fromEntries(partesTotales.map((p) => [p.parte as string, n(p.turnos)])),
    cuentas: { todos: n(tot.todos), sinSaldo: n(tot.sin_saldo), prueba: n(tot.prueba) },
  };
}

/** Los cursos de un colegio, con cuántos estudiantes activos tiene cada uno. */
export async function cursosDe(institucionId: string): Promise<{ curso: string | null; alumnos: number }[]> {
  if (!UUID.test(institucionId)) return [];
  const filas = await sql`
    select curso, count(*)::int as alumnos
      from users
     where institucion_id = ${institucionId} and rol = 'estudiante' and activo
     group by curso
     order by curso nulls last
  `;
  return filas.map((f) => ({ curso: f.curso as string | null, alumnos: n(f.alumnos) }));
}

/** Los colegios para los filtros. */
export async function colegiosParaFiltro(): Promise<{ id: string; nombre: string }[]> {
  const filas = await sql`select id, nombre from instituciones order by nombre`;
  return filas.map((f) => ({ id: f.id as string, nombre: f.nombre as string }));
}
