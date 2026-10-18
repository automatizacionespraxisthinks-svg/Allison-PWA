import type { PendingQuery, Row } from "postgres";
import { sql } from "../db";
import { NOMBRE_ACTIVIDAD } from "../ruta/nombres";
import { claveDe, contenidoDe } from "../ruta/estado";
import { rutaDe } from "../ruta/index";
import { VIAJES } from "../ruta/viajes";
import { CATALOGO } from "../escenarios/datos";
import type { Nivel } from "../tipos";
import { nombreDeParada } from "./etiquetas";

/**
 * La sección Ruta del panel (plan, sección 21; boceto 6): cuántos alumnos
 * llegan a cada paso de una parada, en qué actividad se van, cuánto
 * aciertan al primer intento, y las conversaciones con IA que no llegan a
 * su mínimo de intervenciones. Sirve para saber qué lección mejorar.
 */

const UUID = /^[0-9a-f-]{36}$/;
const n = (v: unknown) => Number(v ?? 0);
/** Sin actividad en la ruta desde hace estos días: se fue ahí. */
const DIAS_PARA_IRSE = 3;

export interface FiltroRuta {
  nivel: Nivel;
  parada?: string;
  colegio?: string;
  curso?: string;
  /** AAAA-MM-DD */
  desde?: string;
}

export interface EmbudoRuta {
  nivel: Nivel;
  parada: string;
  paradas: { clave: string; nombre: string }[];
  pasos: { nombre: string; alumnos: number }[];
  mayorCaida: { paso: string; pct: number } | null;
  actividades: { leccion: number; paso: number; nombre: string; seVan: number; primerIntento: number | null; calificadas: number }[];
  conversaciones: { etiqueta: string; empezaron: number; antes: number; pct: number }[];
  gastanDeMas: { id: string; nombre: string; intervenciones: number; porErrores: number }[];
}

export async function embudoDeRuta(f: FiltroRuta, umbralParada: number): Promise<EmbudoRuta | null> {
  const ruta = rutaDe(f.nivel);
  if (!ruta) return null;
  const paradas = ruta.map((p) => ({ clave: claveDe(f.nivel, p), paso: p }));
  const elegida = paradas.find((p) => p.clave === f.parada) ?? paradas[0];
  const contenido = contenidoDe(elegida.paso);
  const clave = elegida.clave;
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(f.desde ?? "") ? f.desde! : null;
  const colegio = f.colegio && (f.colegio === "particulares" || UUID.test(f.colegio)) ? f.colegio : "todos";
  const curso = colegio !== "todos" && colegio !== "particulares" ? f.curso?.trim() || "" : "";

  const alumnos: PendingQuery<Row[]> = sql`
    select id from users
     where rol = 'estudiante'
       ${colegio === "particulares" ? sql`and institucion_id is null` : colegio !== "todos" ? sql`and institucion_id = ${colegio}` : sql``}
       ${curso ? (curso === "(sin curso)" ? sql`and curso is null` : sql`and curso = ${curso}`) : sql``}
  `;

  // Empezaron la parada: tienen avance en alguna de sus lecciones (desde la fecha, si la hay).
  const empezaron = await sql`
    with a as (${alumnos})
    select distinct l.user_id
      from ruta_lecciones l join a on a.id = l.user_id
     where l.parada = ${clave} ${desde ? sql`and l.actualizado_en >= ${desde}` : sql``}
  `;
  const ids = empezaron.map((e) => e.user_id as string);
  const vacio = sql`select null::uuid as id where false`;
  const quienes = ids.length ? sql`select unnest(${sql.array(ids)}::uuid[]) as id` : vacio;

  const [lecciones, [escenario], seVan, aciertos, conversaciones, gastan] = await Promise.all([
    sql`
      with q as (${quienes})
      select leccion, count(*)::int as completaron
        from ruta_lecciones where parada = ${clave} and completada_en is not null and user_id in (select id from q)
       group by leccion
    `,
    sql`
      with q as (${quienes})
      select count(*)::int as superado
        from ruta_paradas where parada = ${clave} and sello_en is not null and user_id in (select id from q)
    `,
    // Se van: la lección quedó a medias en esa actividad, o terminó la
    // anterior y nunca empezó esta; sin moverse en la ruta desde hace días.
    sql`
      with q as (${quienes})
      select leccion, paso + 1 as paso, count(*)::int as alumnos
        from ruta_lecciones
       where parada = ${clave} and completada_en is null and user_id in (select id from q)
         and actualizado_en < now() - make_interval(days => ${DIAS_PARA_IRSE})
       group by 1, 2
      union all
      select l.leccion + 1, 1, count(*)::int
        from ruta_lecciones l
       where l.parada = ${clave} and l.completada_en is not null and l.user_id in (select id from q)
         and l.completada_en < now() - make_interval(days => ${DIAS_PARA_IRSE})
         and not exists (
           select 1 from ruta_lecciones s where s.user_id = l.user_id and s.parada = l.parada and s.leccion = l.leccion + 1
         )
       group by 1, 2
    `,
    sql`
      with a as (${alumnos})
      select leccion, paso, sum(calificadas)::int as calificadas, sum(aciertos)::int as aciertos
        from ruta_actividades r join a on a.id = r.user_id
       where r.parada = ${clave} ${desde ? sql`and r.creado_en >= ${desde}` : sql``}
       group by 1, 2
    `,
    sql`
      with a as (${alumnos})
      select e.actividad, e.clave, count(*)::int as empezaron,
             count(*) filter (where e.intervenciones < e.minimo)::int as antes
        from escenas_intentos e join a on a.id = e.user_id
       where (e.terminada or e.actualizado_en < now() - interval '1 hour')
         ${desde ? sql`and e.creado_en >= ${desde}` : sql``}
       group by 1, 2
       order by 3 desc
    `,
    sql`
      with a as (${alumnos})
      select u.id, u.nombre, c.intervenciones, c.por_errores
        from ruta_consumo c join a on a.id = c.user_id join users u on u.id = c.user_id
       where c.parada = ${clave} and c.intervenciones > ${umbralParada}
       order by c.intervenciones desc limit 20
    `,
  ]);

  const completaron = new Map(lecciones.map((l) => [n(l.leccion), n(l.completaron)]));
  const pasos = [
    { nombre: "Empezaron la parada", alumnos: ids.length },
    ...contenido.lecciones.map((l) => ({ nombre: `Lección ${l.numero}`, alumnos: completaron.get(l.numero) ?? 0 })),
    { nombre: "Escenario superado", alumnos: n(escenario.superado) },
  ];
  let mayorCaida: EmbudoRuta["mayorCaida"] = null;
  for (let i = 1; i < pasos.length; i++) {
    const antes = pasos[i - 1].alumnos;
    if (!antes) continue;
    const pct = Math.round((100 * (antes - pasos[i].alumnos)) / antes);
    if (pct > 0 && (!mayorCaida || pct > mayorCaida.pct)) mayorCaida = { paso: pasos[i].nombre, pct };
  }

  const vanDe = new Map<string, number>();
  for (const s of seVan) vanDe.set(`${s.leccion}:${s.paso}`, (vanDe.get(`${s.leccion}:${s.paso}`) ?? 0) + n(s.alumnos));
  const aciertoDe = new Map(aciertos.map((a) => [`${a.leccion}:${a.paso}`, a]));

  return {
    nivel: f.nivel,
    parada: clave,
    paradas: paradas.map((p) => ({ clave: p.clave, nombre: nombreDeParada(p.clave) })),
    pasos,
    mayorCaida,
    actividades: contenido.lecciones.flatMap((l) =>
      l.actividades.map((a) => {
        const ac = aciertoDe.get(`${l.numero}:${a.paso}`);
        const calificadas = n(ac?.calificadas);
        return {
          leccion: l.numero,
          paso: a.paso,
          nombre: NOMBRE_ACTIVIDAD[a.tipo],
          seVan: vanDe.get(`${l.numero}:${a.paso}`) ?? 0,
          primerIntento: calificadas ? Math.round((100 * n(ac?.aciertos)) / calificadas) : null,
          calificadas,
        };
      })
    ),
    conversaciones: conversaciones.map((c) => ({
      etiqueta: etiquetaDeConversacion(c.actividad as string, c.clave as string),
      empezaron: n(c.empezaron),
      antes: n(c.antes),
      pct: n(c.empezaron) ? Math.round((100 * n(c.antes)) / n(c.empezaron)) : 0,
    })),
    gastanDeMas: gastan.map((g) => ({ id: g.id, nombre: g.nombre, intervenciones: n(g.intervenciones), porErrores: n(g.por_errores) })),
  };
}

/** "Escenario de la Parada 1 · Miami", "Entrevista a Allison · Parada 1, lección 4", "Viaje a México". */
function etiquetaDeConversacion(actividad: string, clave: string): string {
  if (actividad === "viaje") return `Viaje a ${VIAJES.find((v) => `viaje:${v.numero}` === clave)?.pais ?? clave}`;
  if (actividad === "catalogo") {
    if (clave === "propio") return "Escenarios propios";
    return `Escenario: ${CATALOGO.find((c) => c.clave === clave)?.titulo ?? clave}`;
  }
  if (actividad === "entrevista") {
    const [parada, leccion] = clave.split(":");
    return `Entrevista a Allison · ${nombreDeParada(parada)}, lección ${leccion}`;
  }
  if (actividad === "adivina") {
    const [parada, leccion] = clave.split(":");
    return `Adivina · ${nombreDeParada(parada)}, lección ${leccion}`;
  }
  return `Escenario de cierre · ${nombreDeParada(clave)}`;
}
