import { sql } from "./db";
import { GLOSARIO_MAX } from "./frases";

export interface EntradaGlosario {
  id: string;
  texto: string;
  contexto: string | null;
  creadoEn: string;
}

/**
 * El glosario de un alumno: lo que guardó, de lo más nuevo a lo más
 * viejo. Vive aparte de las conversaciones y no se borra con ellas.
 */
export async function entradasDe(userId: string): Promise<EntradaGlosario[]> {
  const filas = await sql`
    select id, texto, contexto, creado_en
      from glosario
     where user_id = ${userId}
     order by creado_en desc
  `;
  return filas.map((f) => ({
    id: f.id,
    texto: f.texto,
    contexto: f.contexto,
    creadoEn: (f.creado_en as Date).toISOString(),
  }));
}

export type ResultadoAgregar =
  | { estado: "creada"; entrada: EntradaGlosario }
  | { estado: "repetida"; entrada: EntradaGlosario }
  | { estado: "lleno" };

/**
 * Guarda una frase. La misma frase dos veces (sin distinguir mayúsculas)
 * no crea otra fila: devuelve la que ya estaba, para que la pantalla lo
 * diga en vez de fingir que guardó algo nuevo.
 */
export async function agregarEntrada(
  userId: string,
  texto: string,
  contexto: string | null
): Promise<ResultadoAgregar> {
  const [{ cuantas }] = await sql`
    select count(*)::int as cuantas from glosario where user_id = ${userId}
  `;
  if (cuantas >= GLOSARIO_MAX) return { estado: "lleno" };

  const [nueva] = await sql`
    insert into glosario (user_id, texto, contexto)
    values (${userId}, ${texto}, ${contexto})
    on conflict (user_id, lower(texto)) do nothing
    returning id, texto, contexto, creado_en
  `;
  if (nueva) {
    return {
      estado: "creada",
      entrada: {
        id: nueva.id,
        texto: nueva.texto,
        contexto: nueva.contexto,
        creadoEn: (nueva.creado_en as Date).toISOString(),
      },
    };
  }

  const [existente] = await sql`
    select id, texto, contexto, creado_en
      from glosario
     where user_id = ${userId} and lower(texto) = lower(${texto})
     limit 1
  `;
  return {
    estado: "repetida",
    entrada: {
      id: existente.id,
      texto: existente.texto,
      contexto: existente.contexto,
      creadoEn: (existente.creado_en as Date).toISOString(),
    },
  };
}

/** Quita una entrada. Solo la del propio alumno: true si existía. */
export async function borrarEntrada(userId: string, id: string): Promise<boolean> {
  const borradas = await sql`
    delete from glosario where id = ${id} and user_id = ${userId} returning id
  `;
  return borradas.length > 0;
}
