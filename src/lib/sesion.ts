import { auth } from "@/auth";
import { sql } from "./db";
import type { Nivel } from "./tipos";

export interface Alumno {
  id: string;
  nombre: string;
  nivel: Nivel;
  rol: "estudiante" | "coordinador" | "admin";
  institucionId: string | null;
  mensajesPlan: number;
  mensajesRecarga: number;
}

/**
 * El alumno de la sesión actual, con su saldo al día.
 *
 * El saldo se lee de la base y no del token: si se le acaban los
 * mensajes o recarga, el token seguiría diciendo lo de hace media hora.
 */
export async function alumnoActual(): Promise<Alumno | null> {
  const sesion = await auth();
  if (!sesion?.user?.id) return null;

  const [fila] = await sql`
    select u.id, u.nombre, u.nivel, u.rol, u.institucion_id,
           coalesce(s.mensajes_plan, 0)    as mensajes_plan,
           coalesce(s.mensajes_recarga, 0) as mensajes_recarga
      from users u
      left join saldos s on s.user_id = u.id
     where u.id = ${sesion.user.id} and u.activo
     limit 1
  `;

  if (!fila) return null;

  return {
    id: fila.id,
    nombre: fila.nombre,
    nivel: fila.nivel as Nivel,
    rol: fila.rol,
    institucionId: fila.institucion_id,
    mensajesPlan: fila.mensajes_plan,
    mensajesRecarga: fila.mensajes_recarga,
  };
}
