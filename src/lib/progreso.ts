import { evaluarAscenso, siguienteNivel } from "./ascenso";
import { unidadesDe } from "./curriculo";
import { sql } from "./db";
import type { Nivel } from "./tipos";
import { CLAVES_TEMA, TEMAS, tema as buscarTema, type ClaveTema } from "./temas";

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

/**
 * Solo los temas, en UNA consulta.
 *
 * progresoDe() hace seis viajes a la base y calcula racha, semana y
 * totales. Para armar el prompt de Allison solo hacen falta los temas,
 * y cada viaje a la base es tiempo que el alumno espera mirando la
 * pantalla.
 */
export async function temasDe(
  userId: string
): Promise<{ abiertos: string[]; dominados: string[] }> {
  const filas = await sql`
    select tema, min(turnos_limpios)::int as limpios
      from errores_frecuentes
     where user_id = ${userId} and tema is not null
     group by tema
  `;

  const abiertos: string[] = [];
  const dominados: string[] = [];

  for (const f of filas) {
    const titulo = buscarTema(f.tema as string).titulo;
    if ((f.limpios as number) >= TURNOS_PARA_DOMINAR) dominados.push(titulo);
    else abiertos.push(titulo);
  }

  return { abiertos: abiertos.slice(0, 4), dominados: dominados.slice(0, 4) };
}

/** El avance del alumno en cada lección: clave -> {logros, completada}. */
export async function progresoLecciones(
  userId: string
): Promise<Record<string, { logros: number; completada: boolean }>> {
  const filas = await sql`
    select leccion, logros, completada_en
      from progreso_lecciones
     where user_id = ${userId}
  `;

  const avance: Record<string, { logros: number; completada: boolean }> = {};
  for (const f of filas) {
    avance[f.leccion] = {
      logros: f.logros,
      completada: f.completada_en !== null,
    };
  }
  return avance;
}

/**
 * ¿Vale la pena sugerirle el siguiente nivel? Null si no (o si ya es
 * C2). Junta las dos señales — temario completado y desempeño reciente
 * en su nivel — y deja la decisión a la lógica pura de ascenso.ts.
 */
export async function sugerenciaDeNivel(
  userId: string,
  nivel: Nivel
): Promise<{ siguiente: Nivel; razon: string } | null> {
  const siguiente = siguienteNivel(nivel);
  if (!siguiente) return null;

  const claves = unidadesDe(nivel).map((u) => u.clave);

  const [[completadas], [reciente]] = await Promise.all([
    sql`
      select count(*)::int as n
        from progreso_lecciones
       where user_id = ${userId}
         and completada_en is not null
         and leccion = any(${claves})
    `,
    // Solo turnos hablados EN el nivel actual: los de un nivel viejo
    // no dicen nada de cómo le va en este.
    sql`
      select count(*)::int as turnos,
             coalesce(sum(
               case when jsonb_typeof(t.correcciones) = 'array'
                    then jsonb_array_length(t.correcciones) else 0 end
             ), 0)::int as correcciones
        from (
          select m.correcciones
            from mensajes m
            join conversaciones c on c.id = m.conversacion_id
           where m.user_id = ${userId}
             and m.rol = 'alumno'
             and c.nivel_al_iniciar = ${nivel}
           order by m.creado_en desc
           limit 30
        ) t
    `,
  ]);

  const razon = evaluarAscenso({
    unidadesCompletadas: completadas.n,
    turnosRecientes: reciente.turnos,
    correccionesRecientes: reciente.correcciones,
  });

  return razon ? { siguiente, razon } : null;
}
