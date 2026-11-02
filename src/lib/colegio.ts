import { randomInt } from "node:crypto";
import { sql } from "./db";
import { vaEn } from "./panel/etiquetas";
import type { Nivel } from "./tipos";

/**
 * Consultas del panel del coordinador.
 *
 * TODAS filtran por la institución que trae la sesión, nunca por una
 * que venga en la petición. Si el colegio saliera del cuerpo o de la
 * URL, un coordinador podría cambiar el número y ver los alumnos de
 * otro colegio.
 *
 * Aquí no hay ninguna consulta a `mensajes` ni a `conversaciones`: el
 * coordinador ve la actividad de sus alumnos, no lo que hablan. Esa
 * línea es deliberada — son menores de edad.
 */

/**
 * El costo del hash de un PIN de alumno.
 *
 * Más bajo que el de las contraseñas (12) a propósito. Un PIN corto no
 * lo protege el costo: su millón de combinaciones se prueba sin conexión
 * con cualquier costo. Lo protegen los límites de intentos al entrar
 * (src/lib/intentos.ts). Y el costo sí se paga: cada hash es CPU del
 * mismo servidor que atiende las conversaciones, y una carga de mil
 * alumnos a costo 12 lo ocupaba más de cuatro minutos. A costo 10,
 * cuatro veces menos.
 */
export const COSTO_HASH_PIN = 10;

/**
 * Los PIN nuevos son de 6 dígitos (auditoría de seguridad, 2 de noviembre
 * de 2026). Con 4, un compañero que probaba PIN contra todo el salón,
 * dentro del tope diario de intentos, acertaba alguna cuenta cada día en
 * un colegio grande; con 6 son cien veces más combinaciones. Los PIN de 4
 * que ya se entregaron siguen sirviendo hasta que se reinicien.
 */
export const DIGITOS_PIN = 6;

/** Un PIN nuevo, al azar criptográfico. */
export function pinNuevo(): string {
  return String(randomInt(0, 10 ** DIGITOS_PIN)).padStart(DIGITOS_PIN, "0");
}

export interface AlumnoDelColegio {
  id: string;
  nombre: string;
  username: string;
  nivel: Nivel;
  rachaDias: number;
  ultimaPractica: string | null;
  mensajesSemana: number;
  saldo: number;
  diasSinPracticar: number | null;
  curso: string | null;
  /** Dónde va en Mi ruta: "A1 · Parada 3", "A2 · ruta provisional". */
  vaEn: string;
  /** Paradas saltadas (pasó el escenario sin hacer las lecciones). */
  saltadas: number;
}

export interface ResumenColegio {
  nombre: string;
  codigoAcceso: string;
  totalAlumnos: number;
  practicaronSemana: number;
  nuncaEntraron: number;
  mensajesSemana: number;
  alumnos: AlumnoDelColegio[];
}

export async function resumenDe(institucionId: string): Promise<ResumenColegio | null> {
  const [colegio] = await sql`
    select nombre, codigo_acceso from instituciones where id = ${institucionId}
  `;
  if (!colegio) return null;

  const filas = await sql`
    select u.id, u.nombre, u.username, u.nivel, u.curso,
           (select l.parada from ruta_lecciones l where l.user_id = u.id order by l.actualizado_en desc limit 1) as ultima_parada,
           (select count(*)::int from ruta_paradas p where p.user_id = u.id and p.saltada_en is not null) as saltadas,
           case when u.ultima_practica_en::date >= current_date - (dias_descanso() + 1)
                then u.racha_dias else 0 end as racha_dias,
           u.ultima_practica_en,
           coalesce(s.mensajes_plan, 0) + coalesce(s.mensajes_recarga, 0) as saldo,
           coalesce((
             select sum(p.mensajes)::int
               from progreso_diario p
              where p.user_id = u.id and p.fecha > current_date - 7
           ), 0) as mensajes_semana
      from users u
      left join saldos s on s.user_id = u.id
     where u.institucion_id = ${institucionId}
       and u.rol = 'estudiante'
       and u.activo
     order by u.curso nulls last, u.nombre
  `;

  const alumnos: AlumnoDelColegio[] = filas.map((f) => {
    const ultima = f.ultima_practica_en as Date | null;
    const dias = ultima
      ? Math.floor((Date.now() - ultima.getTime()) / 86_400_000)
      : null;

    return {
      id: f.id,
      nombre: f.nombre,
      username: f.username,
      nivel: f.nivel as Nivel,
      rachaDias: f.racha_dias,
      ultimaPractica: ultima ? ultima.toISOString() : null,
      mensajesSemana: f.mensajes_semana,
      saldo: f.saldo,
      diasSinPracticar: dias,
      curso: f.curso,
      vaEn: vaEn(f.nivel as Nivel, f.ultima_parada),
      saltadas: f.saltadas,
    };
  });

  return {
    nombre: colegio.nombre,
    codigoAcceso: colegio.codigo_acceso,
    totalAlumnos: alumnos.length,
    practicaronSemana: alumnos.filter((a) => a.mensajesSemana > 0).length,
    nuncaEntraron: alumnos.filter((a) => a.ultimaPractica === null).length,
    mensajesSemana: alumnos.reduce((n, a) => n + a.mensajesSemana, 0),
    alumnos,
  };
}

/** Comprueba que el alumno sea de ese colegio antes de tocarlo. */
export async function alumnoPertenece(
  alumnoId: string,
  institucionId: string
): Promise<boolean> {
  const [f] = await sql`
    select 1 from users
     where id = ${alumnoId}
       and institucion_id = ${institucionId}
       and rol = 'estudiante'
       and tipo_acceso = 'institucional'
     limit 1
  `;
  return Boolean(f);
}
