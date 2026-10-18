import { sql } from "../db";
import type { Nivel } from "../tipos";
import { sumarTiempo } from "./avance";
import { contenidoDe, pasoDe } from "./estado";
import type { Actividad } from "./tipos";

/**
 * El repaso sorpresa (plan, sección 10; pantalla 9): días después de
 * fallar algo en la ruta, aparece un repaso corto con eso. Cinco
 * preguntas como máximo, una a la vez, con las actividades aprobadas;
 * máximo dos repasos por día; al terminarlo gana 1 estrella. Gasta
 * intervención solo en las preguntas con evaluación corta.
 *
 * Lo que se falla vive en ruta_fallos (lo anota cada actividad y, con
 * lección 0, los errores de los escenarios). Lo que se repasa bien sale
 * de la lista; lo que se vuelve a fallar regresa más adelante.
 */

/** Cuántos días espera un fallo antes de volver ("días después de una parada"). */
const DIAS_DE_ESPERA = 2;
const MAX_PREGUNTAS = 5;
/** Con menos fallos no vale la pena un repaso: espera a juntar más. */
const MIN_PREGUNTAS = 3;
const MAX_POR_DIA = 2;

export interface ItemRepaso {
  parada: string;
  leccion: number;
  paso: number;
  item: string;
  /** Cuándo lo falló por última vez (ISO). */
  fallado: string;
}

/** Una pregunta del repaso, lista para la pantalla. */
export interface PreguntaRepaso {
  n: number;
  /** La actividad con la que se pregunta (la original, o Repite de la frase). */
  actividad: Actividad;
  /** "Lo fallaste el martes · Parada 1". */
  etiqueta: string;
  nivel: Nivel;
}

export interface Repaso {
  id: string;
  items: ItemRepaso[];
  completado: boolean;
}

/** Los fallos pendientes que ya esperaron lo suficiente, del más repetido al más viejo. */
async function pendientes(userId: string, nivel: Nivel): Promise<ItemRepaso[]> {
  const filas = await sql`
    select parada, leccion, paso, item, ultimo_en
      from ruta_fallos
     where user_id = ${userId}
       and repasado_en is null
       and parada like ${`${nivel.toLowerCase()}-%`}
       and ultimo_en < now() - make_interval(days => ${DIAS_DE_ESPERA})
     order by veces desc, ultimo_en asc
     limit 40
  `;
  const items = filas
    .map((f) => ({
      parada: f.parada as string,
      leccion: f.leccion as number,
      paso: f.paso as number,
      item: f.item as string,
      fallado: (f.ultimo_en as Date).toISOString(),
    }))
    .filter((i) => preguntaDe(i, 0) !== null);
  // Una pregunta por actividad: dos fallos de la misma Dilo serían la misma pregunta.
  const vistos = new Set<string>();
  return items.filter((i) => {
    const k = `${i.parada}:${i.leccion}:${i.paso}:${i.leccion === 0 || tipoOriginal(i) === "describe" || tipoOriginal(i) === "responde" ? i.item : ""}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

function tipoOriginal(i: Pick<ItemRepaso, "parada" | "leccion" | "paso">): Actividad["tipo"] | null {
  if (i.leccion === 0) return null;
  const u = pasoDe(i.parada);
  const a = u ? contenidoDe(u.paso).lecciones.find((l) => l.numero === i.leccion)?.actividades.find((x) => x.paso === i.paso) : undefined;
  return a?.tipo ?? null;
}

/**
 * El repaso de hoy: el que está a medias, o uno nuevo si hay con qué y no
 * se pasó del máximo del día. `crear: false` solo mira (para la tarjeta).
 */
export async function repasoDeHoy(userId: string, nivel: Nivel, crear: boolean): Promise<Repaso | { disponible: true } | null> {
  const [abierto] = await sql`
    select id, items from repasos_sorpresa
     where user_id = ${userId} and fecha = current_date and completado_en is null
     order by creado_en desc limit 1
  `;
  if (abierto) return { id: abierto.id, items: abierto.items as ItemRepaso[], completado: false };

  const [{ hechos }] = await sql`
    select count(*)::int as hechos from repasos_sorpresa where user_id = ${userId} and fecha = current_date
  `;
  if (hechos >= MAX_POR_DIA) return null;
  const lista = await pendientes(userId, nivel);
  if (lista.length < MIN_PREGUNTAS) return null;
  if (!crear) return { disponible: true };

  const items = lista.slice(0, MAX_PREGUNTAS);
  const [nuevo] = await sql`
    insert into repasos_sorpresa (user_id, items) values (${userId}, ${sql.json(items as never)}) returning id
  `;
  return { id: nuevo.id, items, completado: false };
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "el martes", "ayer", "hace 9 días" (en Bogotá). */
function cuando(iso: string): string {
  const bogota = (d: Date) => new Date(d.toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const f = bogota(new Date(iso));
  const hoy = bogota(new Date());
  const dias = Math.round((Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - Date.UTC(f.getFullYear(), f.getMonth(), f.getDate())) / 86_400_000);
  if (dias <= 1) return "ayer";
  if (dias < 7) return `el ${DIAS[f.getDay()]}`;
  return `hace ${dias} días`;
}

/**
 * La pregunta de un fallo. ¿Qué es esto?, Dilo y Repite vuelven tal
 * cual; la frase que Allison tuvo que dar en Describe y la mejora de un
 * escenario se repiten (Repite); la pregunta de Responde rápido vuelve
 * sola.
 */
export function preguntaDe(i: ItemRepaso, n: number): PreguntaRepaso | null {
  const u = pasoDe(i.parada);
  if (!u) return null;
  const contenido = contenidoDe(u.paso);
  const lugar = u.paso.tipo === "parada" ? `Parada ${u.paso.parada.numero}` : u.paso.repaso.nombre;
  const base = { n, nivel: u.nivel };
  const repite = (frase: string): Actividad => ({
    tipo: "repite",
    paso: i.paso,
    frase,
    queAparece: "",
    siRespondeMal: "",
  });

  if (i.leccion === 0) {
    return { ...base, actividad: repite(i.item), etiqueta: `Lo dijiste distinto ${cuando(i.fallado)} · Escenario de ${lugar}` };
  }
  const a = contenido.lecciones.find((l) => l.numero === i.leccion)?.actividades.find((x) => x.paso === i.paso);
  if (!a) return null;
  const etiqueta = `Lo fallaste ${cuando(i.fallado)} · ${lugar}`;
  switch (a.tipo) {
    case "que-es-esto":
    case "dilo":
    case "repite":
      return { ...base, actividad: a, etiqueta };
    case "describe":
      return { ...base, actividad: repite(i.item), etiqueta };
    case "responde": {
      const p = a.preguntas.find((x) => x.pregunta === i.item);
      if (!p) return null;
      return { ...base, actividad: { ...a, preguntas: [p] }, etiqueta };
    }
    default:
      return null;
  }
}

/** Lo que se espera en la pregunta `n` de un repaso del alumno (para /api/ruta/evaluar). */
export async function itemDeRepaso(userId: string, repasoId: string, n: number): Promise<ItemRepaso | null> {
  if (!/^[0-9a-f-]{36}$/.test(repasoId)) return null;
  const [r] = await sql`
    select items from repasos_sorpresa
     where id = ${repasoId} and user_id = ${userId} and completado_en is null
  `;
  return (r?.items as ItemRepaso[] | undefined)?.[n] ?? null;
}

/**
 * Termina el repaso: 1 estrella, lo que salió bien sale de la lista y lo
 * que se volvió a fallar regresa más adelante. El tiempo cuenta para la
 * meta de hoy y la racha.
 */
export async function terminarRepaso(
  userId: string,
  repasoId: string,
  resultados: { n: number; bien: boolean }[],
  segundos: number
): Promise<{ ok: true; estrellas: number; racha: number; minutosHoy: number } | { ok: false }> {
  if (!/^[0-9a-f-]{36}$/.test(repasoId)) return { ok: false };
  const [r] = await sql`
    update repasos_sorpresa set completado_en = now(), estrellas = 1
     where id = ${repasoId} and user_id = ${userId} and completado_en is null
    returning items
  `;
  if (!r) return { ok: false };
  const items = r.items as ItemRepaso[];
  for (const [k, i] of items.entries()) {
    const hecha = resultados.find((x) => x.n === k);
    // Una pregunta que no se mostró no cuenta ni para bien ni para mal.
    if (!hecha) continue;
    if (hecha.bien) {
      // ¿Qué es esto?, Dilo y Repite vuelven enteras: si sale bien, salen
      // todos los fallos de esa actividad. Las demás, solo esa frase.
      const entera = ["que-es-esto", "dilo", "repite"].includes(tipoOriginal(i) ?? "");
      await sql`
        update ruta_fallos set repasado_en = now()
         where user_id = ${userId} and parada = ${i.parada} and leccion = ${i.leccion}
           and paso = ${i.paso} and (${entera} or item = ${i.item})
      `;
    } else {
      await sql`
        update ruta_fallos set veces = veces + 1, ultimo_en = now()
         where user_id = ${userId} and parada = ${i.parada} and leccion = ${i.leccion}
           and paso = ${i.paso} and item = ${i.item}
      `;
    }
  }
  const tiempo = await sumarTiempo(userId, segundos);
  return { ok: true, estrellas: 1, ...tiempo };
}
