import { sql } from "../db";
import type { Nivel } from "../tipos";
import { estadoRutaDe, estrellasTotales } from "./avance";
import { selloDe } from "./sellos";
import { lugarDeViaje } from "./viaje";
import { VIAJES } from "./viajes";

/**
 * Lo que muestra el Perfil (pantalla 6): la semana con la racha, los
 * minutos, las estrellas, las palabras guardadas, las estampillas y
 * cuánto le dura el saldo al ritmo del alumno.
 */

export interface DiaDeLaSemana {
  fecha: string;
  letra: string;
  practico: boolean;
  esHoy: boolean;
}

export interface Pasaporte {
  semana: DiaDeLaSemana[];
  minutosSemana: number;
  estrellas: number;
  palabras: number;
  /** Las estampillas ganadas: las ciudades de la ruta del nivel y los países de Viajes, en orden. */
  sellos: { lugar: string; numero: number; ciudad: string }[];
  /** Ruta (12 por nivel) más los 10 viajes. */
  totalSellos: number;
  /** Intervenciones por día en las últimas dos semanas (0 si no hay uso). */
  porDia: number;
  /** La frase de Allison para animar, con un dato útil que no repite cifras. */
  animo: string | null;
}

const LETRA = ["D", "L", "M", "M", "J", "V", "S"];

export async function pasaporteDe(userId: string, nivel: Nivel): Promise<Pasaporte> {
  const [dias, [glosario], [uso], estrellas, ruta, viajes] = await Promise.all([
    // Un día cuenta si conversó, si sumó 3 minutos en la ruta o si gastó
    // intervenciones (un escenario o un viaje marcan la racha sin sumar
    // mensajes de Hablar).
    sql`
      select to_char(d.fecha, 'YYYY-MM-DD') as fecha,
             coalesce(p.mensajes, 0) + coalesce(u.turnos, 0) as mensajes,
             coalesce(p.segundos_practica, 0) as segundos_practica
        from generate_series(current_date - 6, current_date, interval '1 day') as d(fecha)
        left join progreso_diario p on p.user_id = ${userId} and p.fecha = d.fecha::date
        left join uso_diario u on u.user_id = ${userId} and u.fecha = d.fecha::date
    `,
    sql`select count(*)::int as n from glosario where user_id = ${userId}`.catch(() => [{ n: 0 }]),
    sql`
      select coalesce(sum(turnos), 0)::int as turnos from uso_diario
       where user_id = ${userId} and fecha > (now() at time zone 'America/Bogota')::date - 14
    `,
    estrellasTotales(userId),
    estadoRutaDe(userId, nivel),
    sql`select viaje from viajes_avance where user_id = ${userId} and sello_en is not null order by viaje`,
  ]);

  const porFecha = new Map(dias.map((d) => [d.fecha as string, d]));
  const [{ hoy }] = await sql`select to_char(current_date, 'YYYY-MM-DD') as hoy`;
  const base = new Date(`${hoy}T12:00:00`);
  const semana: DiaDeLaSemana[] = Array.from({ length: 7 }, (_, i) => {
    const f = new Date(base);
    f.setDate(base.getDate() - (6 - i));
    const clave = f.toISOString().slice(0, 10);
    const d = porFecha.get(clave);
    return {
      fecha: clave,
      letra: LETRA[f.getDay()],
      practico: !!d && (d.mensajes > 0 || d.segundos_practica >= 180),
      esHoy: i === 6,
    };
  });

  const sellos =
    ruta?.paradas
      .filter((p) => p.sello)
      .map((p) => ({ lugar: selloDe(p) ?? "", numero: p.numeroSello, ciudad: p.ciudad }))
      .filter((s) => s.lugar) ?? [];
  // Los países de Viajes van después de las ciudades.
  for (const f of viajes) {
    const v = VIAJES.find((x) => x.numero === f.viaje);
    if (v) sellos.push({ lugar: lugarDeViaje(v), numero: v.numero, ciudad: v.pais });
  }

  // El ánimo de Allison: cuánto falta para la próxima estampilla.
  let animo: string | null = null;
  const sig = ruta?.siguiente;
  const p = ruta?.paradas.find((x) => x.clave === sig?.parada);
  if (p) {
    const faltan = p.lecciones.filter((l) => l.estado !== "hecha").length;
    animo =
      faltan > 0
        ? `Te ${faltan === 1 ? "falta 1 lección" : `faltan ${faltan} lecciones`} y el escenario para el sello de ${p.ciudad}. ¡Vamos!`
        : `Solo te falta el escenario para el sello de ${p.ciudad}. ¡Tú puedes!`;
  }

  return {
    semana,
    minutosSemana: Math.floor(dias.reduce((n, d) => n + (d.segundos_practica ?? 0), 0) / 60),
    estrellas,
    palabras: glosario?.n ?? 0,
    sellos,
    totalSellos: (ruta?.totalSellos ?? 12) + 10,
    porDia: (uso?.turnos ?? 0) / 14,
    animo,
  };
}

/** "unas 2 semanas", "unos 5 días": cuánto le dura el saldo a su ritmo. */
export function cuantoLeAlcanza(saldo: number, porDia: number): string | null {
  if (porDia < 0.3 || saldo <= 0) return null;
  const dias = Math.floor(saldo / porDia);
  if (dias < 2) return "menos de 2 días";
  if (dias < 14) return `unos ${dias} días`;
  if (dias < 60) return `unas ${Math.round(dias / 7)} semanas`;
  return `unos ${Math.round(dias / 30)} meses`;
}
