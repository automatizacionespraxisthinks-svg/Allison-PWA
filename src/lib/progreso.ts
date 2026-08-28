import { sql } from "./db";

export interface DiaPracticado {
  fecha: string;
  mensajes: number;
  segundos: number;
}

export interface ErrorFrecuente {
  tipo: string;
  textoError: string;
  correccion: string;
  veces: number;
}

export interface Progreso {
  rachaDias: number;
  practicoHoy: boolean;
  totalMensajes: number;
  totalSegundos: number;
  erroresCorregidos: number;
  diasPracticados: number;
  ultimos30: DiaPracticado[];
  erroresFrecuentes: ErrorFrecuente[];
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

  const dias = await sql`
    select fecha::text, mensajes, segundos_hablados as segundos
      from progreso_diario
     where user_id = ${userId} and fecha > current_date - 30
     order by fecha asc
  `;

  // Los que más se repiten primero: son los que hay que atacar
  const errores = await sql`
    select tipo, texto_error, correccion, veces
      from errores_frecuentes
     where user_id = ${userId}
     order by veces desc, ultima_vez_en desc
     limit 8
  `;

  return {
    rachaDias: usuario?.racha_dias ?? 0,
    practicoHoy: usuario?.practico_hoy ?? false,
    totalMensajes: totales.mensajes,
    totalSegundos: totales.segundos,
    erroresCorregidos: totales.errores,
    diasPracticados: totales.dias,
    ultimos30: dias.map((d) => ({
      fecha: d.fecha,
      mensajes: d.mensajes,
      segundos: d.segundos,
    })),
    erroresFrecuentes: errores.map((e) => ({
      tipo: e.tipo,
      textoError: e.texto_error,
      correccion: e.correccion,
      veces: e.veces,
    })),
  };
}
