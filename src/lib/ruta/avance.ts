import { sql } from "../db";
import type { Nivel } from "../tipos";
import {
  contenidoDe,
  estadoDeRuta,
  estrellasDeLeccion,
  pasoDe,
  type EstadoDeRuta,
  type FilaLeccion,
  type FilaParada,
} from "./estado";

/**
 * El avance del alumno en "Mi ruta", contra la base. La lógica de qué
 * está abierto y qué sigue vive en estado.ts (pura y probada); aquí
 * solo se leen y se escriben las filas.
 */

export async function estadoRutaDe(userId: string, nivel: Nivel): Promise<EstadoDeRuta | null> {
  const prefijo = `${nivel.toLowerCase()}-%`;
  const [lecciones, paradas] = await Promise.all([
    sql`
      select parada, leccion, paso, estrellas, completada_en is not null as completada
        from ruta_lecciones
       where user_id = ${userId} and parada like ${prefijo}
    `,
    sql`
      select parada, estrellas, sello_en is not null as sello,
             saltada_en is not null as saltada, anterior_en is not null as anterior,
             coalesce(intento_salto_en::date = current_date, false) as salto_hoy
        from ruta_paradas
       where user_id = ${userId} and parada like ${prefijo}
    `,
  ]);
  return estadoDeRuta(
    nivel,
    lecciones.map((f) => ({
      parada: f.parada,
      leccion: f.leccion,
      paso: f.paso,
      estrellas: f.estrellas,
      completada: f.completada,
    })) as FilaLeccion[],
    paradas.map((f) => ({
      parada: f.parada,
      estrellas: f.estrellas,
      sello: f.sello,
      saltada: f.saltada,
      anterior: f.anterior,
      saltoHoy: f.salto_hoy,
    })) as FilaParada[]
  );
}

/** Minutos practicados hoy: la meta diaria. */
export async function minutosDeHoy(userId: string): Promise<number> {
  const [fila] = await sql`
    select segundos_practica from progreso_diario
     where user_id = ${userId} and fecha = current_date
  `;
  return Math.floor((fila?.segundos_practica ?? 0) / 60);
}

/**
 * Las estrellas del alumno: lecciones y escenarios de cierre de todas sus
 * rutas, viajes, escenarios del catálogo y repasos sorpresa.
 */
export async function estrellasTotales(userId: string): Promise<number> {
  const [fila] = await sql`
    select coalesce((select sum(estrellas) from ruta_lecciones where user_id = ${userId}), 0)
         + coalesce((select sum(estrellas) from ruta_paradas where user_id = ${userId}), 0)
         + coalesce((select sum(estrellas) from viajes_avance where user_id = ${userId}), 0)
         + coalesce((select sum(estrellas) from escenarios_avance where user_id = ${userId}), 0)
         + coalesce((select sum(estrellas) from repasos_sorpresa where user_id = ${userId}), 0) as total
  `;
  return Number(fila?.total ?? 0);
}

/**
 * El tiempo en una actividad de la ruta cuenta para la meta de hoy y,
 * al llegar a 3 minutos en el día, para la racha. Tope de 10 minutos
 * por actividad: una pestaña olvidada abierta no es práctica.
 */
/**
 * Cuándo terminó cada alumno su última actividad. El tiempo lo mide el
 * navegador, así que se acredita como mucho lo que de verdad pasó en el
 * servidor desde la anterior (más un margen): si no, tres peticiones a
 * mano llenarían los 30 minutos diarios de la competencia del salón.
 */
const ultimaActividad = new Map<string, number>();

function segundosCreibles(userId: string, pedidos: number, ahora = Date.now()): number {
  const antes = ultimaActividad.get(userId);
  ultimaActividad.set(userId, ahora);
  if (ultimaActividad.size > 50_000) ultimaActividad.delete(ultimaActividad.keys().next().value as string);
  // Sin una actividad en la última hora no hay contra qué medir: el tope de siempre.
  const tope = antes && ahora - antes < 3_600_000 ? (ahora - antes) / 1000 + 30 : 600;
  return Math.min(pedidos, tope);
}

export async function sumarTiempo(userId: string, segundos: number): Promise<{ racha: number; minutosHoy: number }> {
  const s = Math.max(0, Math.min(600, Math.round(segundosCreibles(userId, segundos))));
  const [fila] = await sql`select registrar_tiempo_ruta(${userId}, ${s}) as r`;
  return { racha: fila.r.racha as number, minutosHoy: Math.floor((fila.r.segundos as number) / 60) };
}

export interface FinDeActividad {
  parada: string;
  leccion: number;
  /** El número de la actividad que terminó (1, 2 o 3). */
  paso: number;
  /** Respuestas calificadas y cuántas salieron bien al primer intento. */
  calificadas: number;
  aciertos: number;
  segundos: number;
  /** Lo que no logró ni con las pistas. */
  fallos: string[];
  /** Primera sesión guiada: la primera actividad ya da la primera estrella. */
  primera?: boolean;
}

export type ResultadoActividad =
  | { ok: false; error: "no_existe" | "bloqueada" }
  | {
      ok: true;
      leccionCompleta: boolean;
      /** La nota de este intento (solo al terminar la lección). */
      estrellas: number;
      /** Cuántas estrellas subió su mejor nota. */
      nuevas: number;
      racha: number;
      minutosHoy: number;
    };

/**
 * Asienta una actividad terminada. Al terminar la última de la lección
 * se calculan las estrellas del intento y se guarda la mejor.
 */
export async function terminarActividad(
  userId: string,
  nivel: Nivel,
  fin: FinDeActividad
): Promise<ResultadoActividad> {
  const ubicado = pasoDe(fin.parada);
  if (!ubicado || ubicado.nivel !== nivel) return { ok: false, error: "no_existe" };
  const leccion = contenidoDe(ubicado.paso).lecciones.find((l) => l.numero === fin.leccion);
  if (!leccion || fin.paso < 1 || fin.paso > leccion.actividades.length) {
    return { ok: false, error: "no_existe" };
  }

  // Una lección bloqueada no se puede hacer llamando a la API a mano.
  const estado = await estadoRutaDe(userId, nivel);
  const enMapa = estado?.paradas.find((p) => p.clave === fin.parada)?.lecciones.find((l) => l.numero === fin.leccion);
  if (!enMapa || enMapa.estado === "bloqueada") return { ok: false, error: "bloqueada" };

  const calificadas = Math.max(0, Math.min(20, Math.round(fin.calificadas)));
  const aciertos = Math.max(0, Math.min(calificadas, Math.round(fin.aciertos)));
  const ultima = fin.paso === leccion.actividades.length;

  // La primera actividad abre un intento nuevo; las demás suman al que va.
  const [fila] = await sql`
    insert into ruta_lecciones (user_id, parada, leccion, paso, aciertos, calificadas)
    values (${userId}, ${fin.parada}, ${fin.leccion}, ${fin.paso}, ${aciertos}, ${calificadas})
    on conflict (user_id, parada, leccion) do update
       set paso        = excluded.paso,
           aciertos    = case when excluded.paso = 1 then excluded.aciertos
                              else ruta_lecciones.aciertos + excluded.aciertos end,
           calificadas = case when excluded.paso = 1 then excluded.calificadas
                              else ruta_lecciones.calificadas + excluded.calificadas end,
           actualizado_en = now()
    returning aciertos, calificadas, estrellas
  `;

  let estrellas = 0;
  let nuevas = 0;
  if (ultima) {
    estrellas = estrellasDeLeccion(fila.aciertos, fila.calificadas);
    nuevas = Math.max(0, estrellas - fila.estrellas);
    await sql`
      update ruta_lecciones
         set estrellas = greatest(estrellas, ${estrellas}),
             completada_en = coalesce(completada_en, now()),
             paso = 0
       where user_id = ${userId} and parada = ${fin.parada} and leccion = ${fin.leccion}
    `;
  }

  // La primera estrella de la primera sesión: solo en la primera actividad
  // de la primera lección de la ruta del nivel (a1-p01, a2-p01 o b1-p01,
  // lección 1). Antes solo A1: en A2 y B1 se prometía y no se daba.
  if (fin.primera && fin.paso === 1 && /^[a-c][12]-p01$/.test(fin.parada) && fin.leccion === 1) {
    await sql`
      update ruta_lecciones set estrellas = greatest(estrellas, 1)
       where user_id = ${userId} and parada = ${fin.parada} and leccion = ${fin.leccion}
    `;
  }

  for (const item of fin.fallos.slice(0, 10)) {
    await sql`
      insert into ruta_fallos (user_id, parada, leccion, paso, item)
      values (${userId}, ${fin.parada}, ${fin.leccion}, ${fin.paso}, ${item.slice(0, 200)})
      on conflict (user_id, parada, leccion, paso, item) do update
         set veces = ruta_fallos.veces + 1, ultimo_en = now(), repasado_en = null
    `;
  }

  // Para el panel (sección Ruta): acierto al primer intento y dónde se van.
  await sql`
    insert into ruta_actividades (user_id, parada, leccion, paso, tipo, calificadas, aciertos)
    values (${userId}, ${fin.parada}, ${fin.leccion}, ${fin.paso}, ${leccion.actividades[fin.paso - 1].tipo},
            ${calificadas}, ${aciertos})
  `.catch((e) => console.error("No se pudo anotar la actividad:", e instanceof Error ? e.message : e));

  const tiempo = await sumarTiempo(userId, fin.segundos);
  return { ok: true, leccionCompleta: ultima, estrellas, nuevas, ...tiempo };
}
