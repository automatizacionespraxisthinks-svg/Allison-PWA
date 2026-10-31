import type { PendingQuery, Row } from "postgres";
import { sql } from "../db";
import type { Ajustes } from "../ajustes";
import { costoCop } from "../uso";
import { cuantosPagosPorRevisar } from "./recargas";

/**
 * El Resumen del panel (plan, sección 21; boceto 1): si los alumnos
 * vuelven y si el negocio da, y lo que hay que atender hoy. La actividad
 * de un día sale de progreso_diario y uso_diario (no de los mensajes,
 * que se borran a los 20 días). La retención cuenta solo estudiantes, sin
 * las cuentas de prueba (@ejemplo.co), con la misma fórmula de
 * scripts/medir-retencion.mjs: volver el día N es practicar justo ese día.
 */

/** Una consulta que va dentro de otra (los alumnos del filtro, los días activos). */
type Fragmento = PendingQuery<Row[]>;

const UUID = /^[0-9a-f-]{36}$/;
const n = (v: unknown) => Number(v ?? 0);

export interface FiltroResumen {
  /** Días hacia atrás: 7, 30 o 90. */
  dias: number;
  /** "todos", "particulares" o el id del colegio. */
  colegio: string;
}

export interface Alerta {
  clave: "pagos" | "reportes" | "saldo-colegio" | "sin-saldo" | "inactivos" | "parada" | "prueba";
  cuantos: number;
  texto: string;
  detalle?: string;
  href: string;
}

export interface Retencion {
  cohorte: string;
  alumnos: number;
  /** Porcentaje que volvió el día 1, 7 y 14 (null si nadie de la cohorte llegó a ese día). */
  d1: number | null;
  d7: number | null;
  d14: number | null;
}

export interface ResumenPanel {
  activosHoy: number;
  activosAyer: number;
  vuelvenD7: number | null;
  vuelvenD7Antes: number | null;
  conRacha7: number;
  activosPeriodo: number;
  costoIa: number;
  cobrado: number;
  retencion: Retencion[];
  alertas: Alerta[];
  negocio: { pagaron: number; colegios: number; alumnosColegio: number; ingresosTotal: number };
}

export async function resumenDelPanel(f: FiltroResumen, a: Ajustes): Promise<ResumenPanel> {
  const dias = [7, 30, 90].includes(f.dias) ? f.dias : 30;
  const colegio = f.colegio === "particulares" || UUID.test(f.colegio) ? f.colegio : "todos";

  // Los estudiantes del filtro (sin las cuentas de prueba).
  const alumnos = sql`
    select id, institucion_id, racha_dias, ultima_practica_en, creado_en,
           (creado_en at time zone 'America/Bogota')::date as dia0
      from users
     where rol = 'estudiante' and activo
       and coalesce(email::text, '') not like '%@ejemplo.co'
       ${colegio === "particulares" ? sql`and institucion_id is null` : colegio !== "todos" ? sql`and institucion_id = ${colegio}` : sql``}
  `;
  // Un día con práctica: conversó, gastó intervenciones o sumó tiempo en la ruta.
  const activos = sql`
    select user_id, fecha from progreso_diario where mensajes > 0 or segundos_practica > 0
    union
    select user_id, fecha from uso_diario where turnos > 0
  `;

  /**
   * Lo que de verdad entró por cada orden aprobada. En las recargas del
   * panel (efectivo o transferencia) es lo recibido en caja, que puede ser
   * distinto del precio: sumar monto_cop hacía que el cuadre del día dijera
   * 30.000 y los ingresos 35.000. Un pago que la pasarela anuló (reembolso o
   * contracargo) ya no es ingreso: el dinero volvió (auditoría, 30 de
   * octubre de 2026).
   */
  const ingreso = sql`
    case when payload->>'alerta' = 'anulada' then 0
         when pasarela in ('efectivo', 'transferencia') then coalesce((payload->>'valorRecibido')::int, monto_cop)
         else monto_cop end
  `;

  const [[hoy], [d7], [racha], [dinero], [negocio]] = await Promise.all([
    sql`
      with a as (${alumnos}), x as (${activos})
      select count(distinct x.user_id) filter (where x.fecha = current_date)::int as hoy,
             count(distinct x.user_id) filter (where x.fecha = current_date - 1)::int as ayer,
             count(distinct x.user_id) filter (where x.fecha > current_date - ${dias}::int)::int as periodo
        from x join a on a.id = x.user_id
       where x.fecha >= current_date - ${dias}::int
    `,
    // Vuelven al día 7: los que se registraron en el periodo (y ya
    // cumplieron 7 días), y los del periodo anterior para comparar.
    sql`
      with a as (${alumnos}), x as (${activos})
      select count(*) filter (where a.dia0 between current_date - 7 - ${dias}::int and current_date - 8)::int as cohorte,
             count(*) filter (where a.dia0 between current_date - 7 - ${dias}::int and current_date - 8
                                and exists (select 1 from x where x.user_id = a.id and x.fecha = a.dia0 + 7))::int as volvieron,
             count(*) filter (where a.dia0 between current_date - 7 - 2 * ${dias}::int and current_date - 8 - ${dias}::int)::int as cohorte_antes,
             count(*) filter (where a.dia0 between current_date - 7 - 2 * ${dias}::int and current_date - 8 - ${dias}::int
                                and exists (select 1 from x where x.user_id = a.id and x.fecha = a.dia0 + 7))::int as volvieron_antes
        from a
    `,
    sql`
      with a as (${alumnos})
      select count(*) filter (
               where racha_dias >= 7 and ultima_practica_en::date >= current_date - (dias_descanso() + 1)
             )::int as racha7
        from a
    `,
    sql`
      with a as (${alumnos})
      select coalesce((select sum(tokens_entrada + tokens_ayuda_entrada) from uso_diario
                        where user_id in (select id from a) and fecha > current_date - ${dias}::int), 0)::bigint as entrada,
             coalesce((select sum(tokens_salida + tokens_ayuda_salida) from uso_diario
                        where user_id in (select id from a) and fecha > current_date - ${dias}::int), 0)::bigint as salida,
             coalesce((select sum(${ingreso}) from transacciones
                        where estado = 'aprobada' and user_id in (select id from a)
                          and confirmado_en > now() - make_interval(days => ${dias})), 0)::bigint as cobrado
    `,
    sql`
      select (select count(distinct user_id)::int from transacciones where estado = 'aprobada') as pagaron,
             (select count(*)::int from instituciones where estado = 'activa') as colegios,
             (select count(*)::int from users where institucion_id is not null and rol = 'estudiante' and activo) as alumnos_colegio,
             (select coalesce(sum(${ingreso}), 0)::bigint from transacciones where estado = 'aprobada') as ingresos
    `,
  ]);

  return {
    activosHoy: n(hoy.hoy),
    activosAyer: n(hoy.ayer),
    vuelvenD7: n(d7.cohorte) ? Math.round((100 * n(d7.volvieron)) / n(d7.cohorte)) : null,
    vuelvenD7Antes: n(d7.cohorte_antes) ? Math.round((100 * n(d7.volvieron_antes)) / n(d7.cohorte_antes)) : null,
    conRacha7: n(racha.racha7),
    activosPeriodo: n(hoy.periodo),
    costoIa: costoCop(n(dinero.entrada), n(dinero.salida), a.dolarCop),
    cobrado: n(dinero.cobrado),
    retencion: await retencion(alumnos, activos, a.fechaVersionNueva),
    alertas: await alertas(a, alumnos),
    negocio: {
      pagaron: n(negocio.pagaron),
      colegios: n(negocio.colegios),
      alumnosColegio: n(negocio.alumnos_colegio),
      ingresosTotal: n(negocio.ingresos),
    },
  };
}

/**
 * Retención al día 1, 7 y 14: los que se registraron antes de la versión
 * nueva frente a los de después. Sin la fecha en Ajustes, una sola fila.
 */
async function retencion(
  alumnos: Fragmento,
  activos: Fragmento,
  fecha: string | null
): Promise<Retencion[]> {
  const fila = async (cohorte: string, condicion: Fragmento): Promise<Retencion> => {
    const [r] = await sql`
      with a as (${alumnos}), x as (${activos}), c as (select * from a where ${condicion})
      select count(*)::int as alumnos,
             count(*) filter (where dia0 + 1 < current_date)::int as llegaron_1,
             count(*) filter (where dia0 + 1 < current_date
                                and exists (select 1 from x where x.user_id = c.id and x.fecha = c.dia0 + 1))::int as volvieron_1,
             count(*) filter (where dia0 + 7 < current_date)::int as llegaron_7,
             count(*) filter (where dia0 + 7 < current_date
                                and exists (select 1 from x where x.user_id = c.id and x.fecha = c.dia0 + 7))::int as volvieron_7,
             count(*) filter (where dia0 + 14 < current_date)::int as llegaron_14,
             count(*) filter (where dia0 + 14 < current_date
                                and exists (select 1 from x where x.user_id = c.id and x.fecha = c.dia0 + 14))::int as volvieron_14
        from c
    `;
    const pct = (d: number) => (n(r[`llegaron_${d}`]) ? Math.round((100 * n(r[`volvieron_${d}`])) / n(r[`llegaron_${d}`])) : null);
    return { cohorte, alumnos: n(r.alumnos), d1: pct(1), d7: pct(7), d14: pct(14) };
  };
  if (!fecha) return [await fila("Todos los alumnos", sql`true`)];
  return [await fila("Antes de los cambios", sql`dia0 < ${fecha}`), await fila("Después de los cambios", sql`dia0 >= ${fecha}`)];
}

/** "Para atender hoy": cada umbral sale de Ajustes. */
async function alertas(a: Ajustes, alumnos: Fragmento): Promise<Alerta[]> {
  const [[r], [sinSaldo], [inactivos], [parada], [prueba], colegios, pagos] = await Promise.all([
    sql`
      select count(*) filter (where creado_en < now() - make_interval(days => ${a.alertaReporteDias}))::int as viejos,
             count(*)::int as abiertos
        from reportes_correccion where estado = 'abierto'
    `,
    sql`
      with a as (${alumnos})
      select count(*)::int as n
        from a left join saldos s on s.user_id = a.id
       where coalesce(s.mensajes_plan, 0) + coalesce(s.mensajes_recarga, 0) = 0
         and a.ultima_practica_en > now() - make_interval(days => ${a.alertaInactivoDias})
    `,
    sql`
      with a as (${alumnos})
      select count(*)::int as n
        from a
       where coalesce(a.ultima_practica_en, a.creado_en) < now() - make_interval(days => ${a.alertaInactivoDias})
    `,
    sql`
      with a as (${alumnos})
      select count(distinct c.user_id)::int as n
        from ruta_consumo c join a on a.id = c.user_id
       where c.intervenciones > ${a.alertaParadaIntervenciones}
    `,
    sql`
      with a as (${alumnos})
      select count(*)::int as n,
             coalesce(sum(d.entrada), 0)::bigint as entrada, coalesce(sum(d.salida), 0)::bigint as salida
        from a
        left join (
          select user_id, sum(tokens_entrada + tokens_ayuda_entrada) as entrada, sum(tokens_salida + tokens_ayuda_salida) as salida
            from uso_diario where fecha >= date_trunc('month', current_date) group by user_id
        ) d on d.user_id = a.id
       where a.institucion_id is null
         and not exists (select 1 from transacciones t where t.user_id = a.id and t.estado = 'aprobada')
    `,
    colegiosConPocoSaldo(a.alertaSaldoColegioPct),
    cuantosPagosPorRevisar(),
  ]);

  return [
    // Primero la plata: montos que no cuadran y pagos anulados por la
    // pasarela, que antes solo quedaban en el log (auditoría, 30 de
    // octubre de 2026).
    {
      clave: "pagos",
      cuantos: pagos,
      texto: "Pagos por revisar: montos que no cuadran o anulados por la pasarela",
      href: "/admin/recargas",
    },
    {
      clave: "reportes",
      cuantos: n(r.viejos),
      texto: `Reportes sin revisar hace más de ${a.alertaReporteDias} días`,
      detalle: `${n(r.abiertos)} sin revisar en total`,
      href: "/admin/reportes",
    },
    {
      clave: "saldo-colegio",
      cuantos: colegios.length,
      texto: `Colegios o cursos con menos del ${a.alertaSaldoColegioPct} % del saldo asignado`,
      detalle: colegios.slice(0, 3).map((c) => `${c.colegio}${c.curso ? ` · ${c.curso}` : ""} (${c.pct} %)`).join(", ") || undefined,
      href: "/admin/colegios",
    },
    { clave: "sin-saldo", cuantos: n(sinSaldo.n), texto: "Alumnos activos que se quedaron sin saldo", href: "/admin/uso?estado=sin-saldo" },
    {
      clave: "inactivos",
      cuantos: n(inactivos.n),
      texto: `Alumnos sin actividad hace ${a.alertaInactivoDias} días o más`,
      href: "/admin/uso?orden=inactivos",
    },
    {
      clave: "parada",
      cuantos: n(parada.n),
      texto: `Alumnos que gastaron más de ${a.alertaParadaIntervenciones} intervenciones en una parada`,
      href: "/admin/ruta",
    },
    {
      clave: "prueba",
      cuantos: n(prueba.n),
      texto: "Alumnos en prueba gratis",
      detalle: `$${costoCop(n(prueba.entrada), n(prueba.salida), a.dolarCop).toLocaleString("es-CO")} de IA este mes`,
      href: "/admin/uso?estado=prueba",
    },
  ];
}

/**
 * Colegios o cursos a los que les queda menos del porcentaje dado de su
 * última asignación: lo que tienen hoy sus alumnos frente a lo asignado.
 */
async function colegiosConPocoSaldo(pct: number): Promise<{ colegio: string; curso: string | null; pct: number }[]> {
  const filas = await sql`
    with ultima as (
      select distinct on (institucion_id) * from asignaciones_saldo order by institucion_id, creado_en desc
    ),
    alumnos as (
      select u.institucion_id, u.curso,
             coalesce(s.mensajes_plan, 0) + coalesce(s.mensajes_recarga, 0) as saldo
        from users u
        join ultima a on a.institucion_id = u.institucion_id
        left join saldos s on s.user_id = u.id
       where u.rol = 'estudiante' and u.activo
         and (a.cursos is null or u.curso = any(a.cursos) or (u.curso is null and '(sin curso)' = any(a.cursos)))
    )
    select i.nombre as colegio, al.curso, grouping(al.curso) = 1 as todo_el_colegio,
           sum(al.saldo)::bigint as queda, (count(*) * a.por_alumno)::bigint as asignado
      from alumnos al
      join ultima a on a.institucion_id = al.institucion_id
      join instituciones i on i.id = al.institucion_id
     group by grouping sets ((i.nombre, a.por_alumno), (i.nombre, al.curso, a.por_alumno))
  `;
  return filas
    .filter((f) => n(f.asignado) > 0)
    .map((f) => ({
      colegio: f.colegio as string,
      curso: f.todo_el_colegio ? null : ((f.curso as string | null) ?? "sin curso"),
      pct: Math.round((100 * n(f.queda)) / n(f.asignado)),
    }))
    .filter((f) => f.pct < pct);
}
