import { sql } from "./db.ts";

/**
 * Reportes de correcciones: el alumno marca "esta corrección está mal"
 * y el administrador decide (plan de mejoras, punto 16).
 *
 * Si Allison se equivocó se devuelve 1 intervención y el alumno ve un
 * aviso; si la corrección era buena, el alumno ve la explicación. La
 * corrección se copia al reporte porque el mensaje se borra a los 20
 * días (db/023_reportes_correccion.sql).
 */

export type DecisionReporte = "allison_se_equivoco" | "correccion_buena";

export interface Reporte {
  id: string;
  alumno: string;
  nivel: string | null;
  tipo: string;
  original: string;
  correccion: string;
  explicacion: string | null;
  textoAlumno: string;
  respuestaAllison: string | null;
  comentario: string | null;
  estado: "abierto" | DecisionReporte;
  /**
   * Se devolvió la intervención. "Allison se equivocó" sin devolver: otra
   * corrección del mismo mensaje ya la devolvió (una por mensaje).
   */
  devolvio: boolean;
  creadoEn: string;
  revisadoEn: string | null;
  /** Días que lleva abierto (para la alerta de más de 3 días). */
  dias: number;
}

export type ResultadoReporte =
  | { estado: "creado"; id: string }
  | { estado: "repetido" }
  | { estado: "no_encontrado" };

/**
 * Crea el reporte de la corrección número `indice` del mensaje del
 * alumno. Solo vale para mensajes propios; la misma corrección no se
 * reporta dos veces.
 */
export async function crearReporte(
  userId: string,
  mensajeId: string,
  indice: number,
  comentario: string | null
): Promise<ResultadoReporte> {
  const [m] = await sql`
    select m.id, m.texto, m.correcciones, m.conversacion_id, m.creado_en,
           u.nivel
      from mensajes m
      join users u on u.id = m.user_id
     where m.id = ${mensajeId}
       and m.user_id = ${userId}
       and m.rol = 'alumno'
  `;
  if (!m) return { estado: "no_encontrado" };

  const correcciones = Array.isArray(m.correcciones) ? m.correcciones : [];
  const c = correcciones[indice];
  if (!c || typeof c !== "object") return { estado: "no_encontrado" };

  // La respuesta de Allison a ese turno: el siguiente mensaje suyo
  const [r] = await sql`
    select texto from mensajes
     where conversacion_id = ${m.conversacion_id}
       and rol = 'allison'
       and creado_en >= ${m.creado_en}
     order by creado_en
     limit 1
  `;

  const [nuevo] = await sql`
    insert into reportes_correccion
      (user_id, mensaje_id, indice, tipo, original, correccion, explicacion,
       texto_alumno, respuesta_allison, comentario, nivel)
    values
      (${userId}, ${mensajeId}, ${indice},
       ${String(c.tipo ?? "")}, ${String(c.original ?? "")},
       ${String(c.correccion ?? "")}, ${c.explicacion ? String(c.explicacion) : null},
       ${m.texto}, ${r?.texto ?? null}, ${comentario}, ${m.nivel})
    on conflict (mensaje_id, indice) where mensaje_id is not null do nothing
    returning id
  `;
  return nuevo ? { estado: "creado", id: nuevo.id } : { estado: "repetido" };
}

/** Qué correcciones de estos mensajes ya reportó el alumno ("id:indice"). */
export async function correccionesReportadas(
  userId: string,
  mensajeIds: string[]
): Promise<string[]> {
  if (mensajeIds.length === 0) return [];
  const filas = await sql`
    select mensaje_id, indice from reportes_correccion
     where user_id = ${userId}
       and mensaje_id = any(${mensajeIds}::uuid[])
  `;
  return filas.map((f) => `${f.mensaje_id}:${f.indice}`);
}

function aReporte(f: Record<string, unknown>): Reporte {
  const creado = f.creado_en as Date;
  return {
    id: f.id as string,
    alumno: f.alumno as string,
    nivel: (f.nivel as string | null) ?? null,
    tipo: f.tipo as string,
    original: f.original as string,
    correccion: f.correccion as string,
    explicacion: (f.explicacion as string | null) ?? null,
    textoAlumno: f.texto_alumno as string,
    respuestaAllison: (f.respuesta_allison as string | null) ?? null,
    comentario: (f.comentario as string | null) ?? null,
    estado: f.estado as Reporte["estado"],
    devolvio: Boolean(f.devolvio),
    creadoEn: creado.toISOString(),
    revisadoEn: f.revisado_en ? (f.revisado_en as Date).toISOString() : null,
    dias: Math.floor((Date.now() - creado.getTime()) / 86_400_000),
  };
}

/** Los abiertos primero (los más viejos arriba) y los últimos resueltos. */
export async function reportesParaRevisar(): Promise<{
  abiertos: Reporte[];
  resueltos: Reporte[];
}> {
  const [abiertos, resueltos] = await Promise.all([
    sql`
      select r.*, u.nombre as alumno
        from reportes_correccion r join users u on u.id = r.user_id
       where r.estado = 'abierto'
       order by r.creado_en
       limit 200`,
    sql`
      select r.*, u.nombre as alumno
        from reportes_correccion r join users u on u.id = r.user_id
       where r.estado <> 'abierto'
       order by r.revisado_en desc
       limit 30`,
  ]);
  return { abiertos: abiertos.map(aReporte), resueltos: resueltos.map(aReporte) };
}

/**
 * La decisión del administrador. False si el reporte ya estaba resuelto.
 *
 * Como máximo una devolución por mensaje: el turno costó 1 intervención,
 * y desde B1 un mensaje puede traer varias correcciones. Reportando las
 * tres de un turno, el alumno recuperaba 3 por un turno de 1. Si otra
 * corrección del mismo mensaje ya devolvió, "Allison se equivocó" queda
 * anotado sin devolver (devolvio = false) y sin aviso: el aviso dice "te
 * devolvimos la intervención", y el alumno ya vio el de la primera
 * (auditoría, 30 de octubre de 2026). Se resuelve aquí, sin tocar
 * resolver_reporte (db/023), que sigue siendo la que devuelve.
 */
export async function resolverReporte(
  reporteId: string,
  adminId: string,
  decision: DecisionReporte
): Promise<boolean> {
  return (await sql.begin(async (tx) => {
    const [r] = await tx`
      select user_id, mensaje_id, texto_alumno, respuesta_allison
        from reportes_correccion
       where id = ${reporteId} and estado = 'abierto'
    `;
    if (!r) return false;

    // Los reportes del mismo mensaje (este incluido), bloqueados en orden:
    // dos decisiones a la vez sobre correcciones del mismo mensaje no
    // devuelven las dos. Si el mensaje ya se borró (a los 20 días queda
    // mensaje_id en null), se reconocen por la copia del texto del alumno
    // y de la respuesta de Allison.
    const delMensaje = await tx`
      select id, devolvio
        from reportes_correccion
       where user_id = ${r.user_id}
         and ((${r.mensaje_id}::uuid is not null and mensaje_id = ${r.mensaje_id}::uuid)
              or (${r.mensaje_id}::uuid is null and mensaje_id is null
                  and texto_alumno = ${r.texto_alumno}
                  and respuesta_allison is not distinct from ${r.respuesta_allison}::text))
       order by id
         for update
    `;
    const yaDevolvio = delMensaje.some((h) => h.devolvio && h.id !== reporteId);

    if (decision === "allison_se_equivoco" && yaDevolvio) {
      const filas = await tx`
        update reportes_correccion
           set estado = 'allison_se_equivoco',
               revisado_por = ${adminId},
               revisado_en = now(),
               devolvio = false,
               aviso_visto_en = now()
         where id = ${reporteId} and estado = 'abierto'
        returning id
      `;
      return filas.length > 0;
    }

    const [f] = await tx`
      select resolver_reporte(${reporteId}, ${adminId}, ${decision}::estado_reporte) as ok
    `;
    return Boolean(f.ok);
  })) as boolean;
}

export interface AvisoReporte {
  id: string;
  decision: DecisionReporte;
  original: string;
  correccion: string;
  explicacion: string | null;
}

/** Decisiones que el alumno todavía no ha visto. */
export async function avisosPendientes(userId: string): Promise<AvisoReporte[]> {
  const filas = await sql`
    select id, estado, original, correccion, explicacion
      from reportes_correccion
     where user_id = ${userId}
       and estado <> 'abierto'
       and aviso_visto_en is null
     order by revisado_en
     limit 5
  `;
  return filas.map((f) => ({
    id: f.id,
    decision: f.estado as DecisionReporte,
    original: f.original,
    correccion: f.correccion,
    explicacion: f.explicacion,
  }));
}

export async function marcarAvisosVistos(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await sql`
    update reportes_correccion
       set aviso_visto_en = now()
     where user_id = ${userId}
       and id = any(${ids}::uuid[])
       and aviso_visto_en is null
  `;
}
