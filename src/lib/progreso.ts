import { sql } from "./db";
import { tema as buscarTema, type ClaveTema } from "./temas";

export interface DiaPracticado {
  fecha: string;
  mensajes: number;
  segundos: number;
}

export interface TemaFallado {
  clave: ClaveTema;
  titulo: string;
  pista: string;
  ejemplo: string;
  veces: number;
  ejemplos: { error: string; correccion: string }[];
}

export interface Progreso {
  rachaDias: number;
  practicoHoy: boolean;
  totalMensajes: number;
  totalSegundos: number;
  erroresCorregidos: number;
  diasPracticados: number;
  mensajesHoy: number;
  semana: DiaPracticado[];
  temas: TemaFallado[];
  /** Aciertos: turnos sin ninguna corrección. */
  turnosLimpios: number;
}

export async function progresoDe(userId: string): Promise<Progreso> {
  const [usuario] = await sql`
    select racha_dias, ultima_practica_en::date = current_date as practico_hoy
      from users where id = ${userId}
  `;

  const [totales] = await sql`
    select coalesce(sum(mensajes), 0)::int           as mensajes,
           coalesce(sum(segundos_hablados), 0)::int  as segundos,
           coalesce(sum(errores_corregidos), 0)::int as errores,
           count(*)::int                             as dias
      from progreso_diario where user_id = ${userId}
  `;

  const [hoy] = await sql`
    select coalesce(mensajes, 0)::int as mensajes
      from progreso_diario
     where user_id = ${userId} and fecha = current_date
  `;

  const dias = await sql`
    select fecha::text, mensajes, segundos_hablados as segundos
      from progreso_diario
     where user_id = ${userId} and fecha > current_date - 7
  `;

  // Agrupado por tema: es lo que el alumno puede accionar.
  const porTema = await sql`
    select tema, sum(veces)::int as veces
      from errores_frecuentes
     where user_id = ${userId} and tema is not null
     group by tema
     order by veces desc
     limit 5
  `;

  const ejemplos = await sql`
    select tema, texto_error, correccion, veces
      from errores_frecuentes
     where user_id = ${userId} and tema is not null
     order by veces desc, ultima_vez_en desc
  `;

  const [limpios] = await sql`
    select count(*)::int as n
      from mensajes
     where user_id = ${userId} and rol = 'alumno'
       and jsonb_typeof(correcciones) = 'array'
       and jsonb_array_length(correcciones) = 0
  `;

  return {
    rachaDias: usuario?.racha_dias ?? 0,
    practicoHoy: usuario?.practico_hoy ?? false,
    totalMensajes: totales.mensajes,
    totalSegundos: totales.segundos,
    erroresCorregidos: totales.errores,
    diasPracticados: totales.dias,
    mensajesHoy: hoy?.mensajes ?? 0,
    turnosLimpios: limpios?.n ?? 0,
    semana: dias.map((d) => ({
      fecha: d.fecha,
      mensajes: d.mensajes,
      segundos: d.segundos,
    })),
    temas: porTema.map((t) => {
      const info = buscarTema(t.tema);
      return {
        clave: t.tema as ClaveTema,
        titulo: info.titulo,
        pista: info.pista,
        ejemplo: info.ejemplo,
        veces: t.veces,
        ejemplos: ejemplos
          .filter((e) => e.tema === t.tema)
          .slice(0, 2)
          .map((e) => ({ error: e.texto_error, correccion: e.correccion })),
      };
    }),
  };
}
