import { sql } from "./db";
import type { Nivel } from "./tipos";

export interface Alumno {
  id: string;
  nombre: string;
  nivel: Nivel;
  mensajesPlan: number;
  mensajesRecarga: number;
}

/**
 * PROVISIONAL — devuelve el alumno de demostración.
 *
 * Cuando exista la autenticación (fase 0), esto leerá la sesión real.
 * Toda la aplicación pasa por aquí, así que ese cambio será de una sola
 * función y nada más tendrá que tocarse.
 */
export async function alumnoActual(): Promise<Alumno | null> {
  const [fila] = await sql`
    select u.id, u.nombre, u.nivel,
           coalesce(s.mensajes_plan, 0)    as mensajes_plan,
           coalesce(s.mensajes_recarga, 0) as mensajes_recarga
      from users u
      left join saldos s on s.user_id = u.id
     where u.email = 'demo@allison.co'
     limit 1
  `;

  if (!fila) return null;

  return {
    id: fila.id,
    nombre: fila.nombre,
    nivel: fila.nivel as Nivel,
    mensajesPlan: fila.mensajes_plan,
    mensajesRecarga: fila.mensajes_recarga,
  };
}
