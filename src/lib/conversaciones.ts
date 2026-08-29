import { sql } from "./db";
import type { Correccion, Nivel } from "./tipos";

export interface ResumenConversacion {
  id: string;
  titulo: string;
  nivel: Nivel;
  mensajes: number;
  correcciones: number;
  iniciadaEn: string;
  ultimaActividad: string;
  borrarDespuesDe: string;
  /** Lo primero que dijo el alumno, para reconocerla en la lista. */
  primeraFrase: string | null;
}

export interface MensajeConversacion {
  id: string;
  rol: "alumno" | "allison";
  texto: string;
  correcciones: Correccion[];
  creadoEn: string;
}

/** Todas las conversaciones del alumno, la más reciente primero. */
export async function conversacionesDe(
  userId: string
): Promise<ResumenConversacion[]> {
  const filas = await sql`
    select c.id, c.titulo, c.nivel_al_iniciar, c.iniciada_en,
           c.ultima_actividad_en, c.borrar_despues_de,
           count(m.id) filter (where m.rol = 'alumno')::int as mensajes,
           coalesce(sum(
             case when jsonb_typeof(m.correcciones) = 'array'
                  then jsonb_array_length(m.correcciones) else 0 end
           ), 0)::int as correcciones,
           (array_agg(m.texto order by m.creado_en)
              filter (where m.rol = 'alumno'))[1] as primera
      from conversaciones c
      left join mensajes m on m.conversacion_id = c.id
     where c.user_id = ${userId}
     group by c.id
     having count(m.id) > 0
     order by c.ultima_actividad_en desc
  `;

  return filas.map((f) => ({
    id: f.id,
    titulo: f.titulo ?? "Conversación",
    nivel: f.nivel_al_iniciar as Nivel,
    mensajes: f.mensajes,
    correcciones: f.correcciones,
    iniciadaEn: (f.iniciada_en as Date).toISOString(),
    ultimaActividad: (f.ultima_actividad_en as Date).toISOString(),
    borrarDespuesDe: (f.borrar_despues_de as Date).toISOString(),
    primeraFrase: f.primera ?? null,
  }));
}

/** Una conversación con sus mensajes. Null si no es de ese alumno. */
export async function conversacionDe(
  userId: string,
  conversacionId: string
): Promise<{ resumen: ResumenConversacion; mensajes: MensajeConversacion[] } | null> {
  const [c] = await sql`
    select id, titulo, nivel_al_iniciar, iniciada_en, ultima_actividad_en,
           borrar_despues_de
      from conversaciones
     where id = ${conversacionId} and user_id = ${userId}
     limit 1
  `;
  if (!c) return null;

  const filas = await sql`
    select id, rol, texto, correcciones, creado_en
      from mensajes
     where conversacion_id = ${conversacionId}
     order by creado_en asc
  `;

  const mensajes: MensajeConversacion[] = filas.map((f) => ({
    id: f.id,
    rol: f.rol,
    texto: f.texto ?? "",
    correcciones: Array.isArray(f.correcciones) ? f.correcciones : [],
    creadoEn: (f.creado_en as Date).toISOString(),
  }));

  return {
    resumen: {
      id: c.id,
      titulo: c.titulo ?? "Conversación",
      nivel: c.nivel_al_iniciar as Nivel,
      mensajes: mensajes.filter((m) => m.rol === "alumno").length,
      correcciones: mensajes.reduce((n, m) => n + m.correcciones.length, 0),
      iniciadaEn: (c.iniciada_en as Date).toISOString(),
      ultimaActividad: (c.ultima_actividad_en as Date).toISOString(),
      borrarDespuesDe: (c.borrar_despues_de as Date).toISOString(),
      primeraFrase: mensajes.find((m) => m.rol === "alumno")?.texto ?? null,
    },
    mensajes,
  };
}

/**
 * Borra una conversación del alumno.
 *
 * El filtro por user_id va en el propio DELETE, no en una comprobación
 * aparte: así no hay ninguna ventana entre verificar el dueño y borrar.
 * Devuelve false si la conversación no existe o no es suya — sin
 * distinguir entre las dos cosas.
 */
export async function borrarConversacion(
  userId: string,
  conversacionId: string
): Promise<boolean> {
  const filas = await sql`
    delete from conversaciones
     where id = ${conversacionId} and user_id = ${userId}
     returning id
  `;
  return filas.length > 0;
}

/** Borra todo el historial de charlas. El progreso no se toca. */
export async function borrarTodas(userId: string): Promise<number> {
  const filas = await sql`
    delete from conversaciones where user_id = ${userId} returning id
  `;
  return filas.length;
}
