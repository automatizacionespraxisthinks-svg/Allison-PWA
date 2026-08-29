import { sql } from "./db";
import { CLAVES_TEMA, TEMAS, type ClaveTema } from "./temas";

export interface DiaPracticado {
  fecha: string;
  mensajes: number;
  segundos: number;
}

/**
 * El estado de un tema para este alumno.
 *
 * La clave del modelo: un error no se queda marcado para siempre. Si el
 * alumno lleva varios turnos sin repetirlo, el tema sube de estado. Así
 * la pantalla puede decir "ya lo superaste", que es lo único que
 * convence a alguien de seguir practicando.
 */
export type EstadoTema = "dominado" | "mejorando" | "atraviesa" | "sin_datos";

export interface TemaAlumno {
  clave: ClaveTema;
  titulo: string;
  pista: string;
  ejemplo: string;
  estado: EstadoTema;
  veces: number;
  /** Turnos hablados desde la última vez que cometió este error. */
  turnosLimpios: number;
  ultimoEjemplo?: { error: string; correccion: string };
}

export interface Progreso {
  rachaDias: number;
  practicoHoy: boolean;
  mensajesHoy: number;
  totalMensajes: number;
  totalSegundos: number;
  diasPracticados: number;
  semana: DiaPracticado[];
  temas: TemaAlumno[];
  dominados: number;
  enJuego: number;
  /** El tema a trabajar hoy: el que más falla, o el más cerca de dominar. */
  mision?: TemaAlumno;
}

/** Turnos sin repetir el error que hacen falta para considerarlo superado. */
const TURNOS_PARA_DOMINAR = 10;
const TURNOS_PARA_MEJORANDO = 4;

export async function progresoDe(userId: string): Promise<Progreso> {
  const [usuario] = await sql`
    select racha_dias, ultima_practica_en::date = current_date as practico_hoy
      from users where id = ${userId}
  `;

  const [totales] = await sql`
    select coalesce(sum(mensajes), 0)::int          as mensajes,
           coalesce(sum(segundos_hablados), 0)::int as segundos,
           count(*)::int                            as dias
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

  // Por cada tema: cuántas veces falló y cuántos turnos lleva sin
  // repetirlo. El contador vive en la tabla y NO se calcula contando
  // mensajes: las conversaciones se borran a los 20 días, y ese conteo
  // se desplomaría con ellas.
  const filas = await sql`
    select tema,
           sum(veces)::int          as veces,
           min(turnos_limpios)::int as turnos_limpios,
           (array_agg(
              texto_error || ' ||| ' || correccion
              order by ultima_vez_en desc
            ))[1] as ejemplo
      from errores_frecuentes
     where user_id = ${userId} and tema is not null
     group by tema
  `;

  const porClave = new Map(filas.map((f) => [f.tema as string, f]));

  const temas: TemaAlumno[] = CLAVES_TEMA.map((clave) => {
    const info = TEMAS[clave];
    const f = porClave.get(clave);

    if (!f) {
      return {
        clave,
        titulo: info.titulo,
        pista: info.pista,
        ejemplo: info.ejemplo,
        estado: "sin_datos",
        veces: 0,
        turnosLimpios: 0,
      };
    }

    const limpios = f.turnos_limpios as number;
    const estado: EstadoTema =
      limpios >= TURNOS_PARA_DOMINAR
        ? "dominado"
        : limpios >= TURNOS_PARA_MEJORANDO
          ? "mejorando"
          : "atraviesa";

    const [error, correccion] = String(f.ejemplo ?? "").split(" ||| ");

    return {
      clave,
      titulo: info.titulo,
      pista: info.pista,
      ejemplo: info.ejemplo,
      estado,
      veces: f.veces as number,
      turnosLimpios: limpios,
      ultimoEjemplo: error ? { error, correccion: correccion ?? "" } : undefined,
    };
  });

  const atraviesan = temas.filter((t) => t.estado === "atraviesa");
  const mejorando = temas.filter((t) => t.estado === "mejorando");

  // Si nada está fallando, la misión pasa a ser rematar el tema que más
  // le costó. Una pantalla sin siguiente paso deja al alumno sin nada
  // que hacer justo cuando va bien.
  const mision =
    [...atraviesan].sort((a, b) => b.veces - a.veces)[0] ??
    [...mejorando].sort((a, b) => b.turnosLimpios - a.turnosLimpios)[0];

  return {
    rachaDias: usuario?.racha_dias ?? 0,
    practicoHoy: usuario?.practico_hoy ?? false,
    mensajesHoy: hoy?.mensajes ?? 0,
    totalMensajes: totales.mensajes,
    totalSegundos: totales.segundos,
    diasPracticados: totales.dias,
    semana: dias.map((d) => ({
      fecha: d.fecha,
      mensajes: d.mensajes,
      segundos: d.segundos,
    })),
    temas,
    dominados: temas.filter((t) => t.estado === "dominado").length,
    enJuego: temas.filter((t) => t.estado !== "sin_datos").length,
    mision,
  };
}
