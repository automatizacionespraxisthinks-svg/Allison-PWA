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

/**
 * La conversación en curso del alumno.
 *
 * No se abre una nueva en cada visita: el alumno tiene UN hilo que dura
 * lo que dura su historial (20 días). Así Allison recuerda de qué
 * hablaron ayer, y el alumno vuelve a una charla que ya existía en vez
 * de a una pantalla en blanco.
 *
 * Solo se abre una nueva cuando el borrado se llevó la anterior.
 */
export async function conversacionActiva(
  userId: string,
  nivel: string
): Promise<{ id: string; leccion: string | null }> {
  const [existente] = await sql`
    select id, leccion from conversaciones
     where user_id = ${userId}
     order by ultima_actividad_en desc
     limit 1
  `;
  if (existente) return { id: existente.id, leccion: existente.leccion ?? null };

  const [nueva] = await sql`
    insert into conversaciones (user_id, modo, nivel_al_iniciar)
    values (${userId}, 'libre', ${nivel})
    returning id
  `;
  return { id: nueva.id, leccion: null };
}

/**
 * El hilo de UNA lección: cada unidad del currículo tiene el suyo.
 *
 * Así el alumno puede dejar la lección a medias, charlar libre, y
 * volver a la lección donde iba — sin que Allison mezcle el objetivo
 * de la unidad con la conversación de ayer sobre el partido.
 */
export async function conversacionDeLeccion(
  userId: string,
  nivel: string,
  leccion: string
): Promise<string> {
  const [existente] = await sql`
    select id from conversaciones
     where user_id = ${userId} and leccion = ${leccion}
     order by ultima_actividad_en desc
     limit 1
  `;
  if (existente) {
    await sql`
      update conversaciones set ultima_actividad_en = now()
       where id = ${existente.id}
    `;
    return existente.id;
  }

  const [nueva] = await sql`
    insert into conversaciones (user_id, modo, leccion, nivel_al_iniciar)
    values (${userId}, 'leccion', ${leccion}, ${nivel})
    returning id
  `;
  return nueva.id;
}

/** El hilo libre: el más reciente SIN lección, o uno nuevo. */
export async function conversacionLibre(
  userId: string,
  nivel: string
): Promise<string> {
  const [existente] = await sql`
    select id from conversaciones
     where user_id = ${userId} and leccion is null
     order by ultima_actividad_en desc
     limit 1
  `;
  if (existente) {
    await sql`
      update conversaciones set ultima_actividad_en = now()
       where id = ${existente.id}
    `;
    return existente.id;
  }

  const [nueva] = await sql`
    insert into conversaciones (user_id, modo, nivel_al_iniciar)
    values (${userId}, 'libre', ${nivel})
    returning id
  `;
  return nueva.id;
}

/** Los últimos mensajes, para pintar el hilo al abrir la pantalla. */
export async function ultimosMensajes(
  conversacionId: string,
  cuantos = 30
): Promise<MensajeConversacion[]> {
  const filas = await sql`
    select id, rol, texto, correcciones, creado_en
      from mensajes
     where conversacion_id = ${conversacionId}
     order by creado_en desc
     limit ${cuantos}
  `;

  return filas.reverse().map((f) => ({
    id: f.id,
    rol: f.rol,
    texto: f.texto ?? "",
    correcciones: Array.isArray(f.correcciones) ? f.correcciones : [],
    creadoEn: (f.creado_en as Date).toISOString(),
  }));
}
