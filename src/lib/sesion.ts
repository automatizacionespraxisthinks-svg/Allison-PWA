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
  /** Nunca ha pagado: sigue con los mensajes de regalo. */
  enPrueba: boolean;
  /** Tiene correo sin confirmar: le faltan mensajes de la prueba. */
  faltaVerificar: boolean;
  rachaDias: number;
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

  const leer = () => sql`
    select u.id, u.nombre, u.nivel, u.rol, u.institucion_id, u.racha_dias,
           coalesce(s.mensajes_plan, 0)    as mensajes_plan,
           coalesce(s.mensajes_recarga, 0) as mensajes_recarga,
           not exists (
             select 1 from transacciones t
              where t.user_id = u.id and t.estado = 'aprobada'
           ) as en_prueba,
           (u.email is not null and u.email_verificado_en is null) as falta_verificar,
           extract(epoch from u.sesiones_validas_desde)::bigint as validas_desde,
           exists (
             select 1 from suscripciones x
              where x.user_id = u.id and x.estado = 'activa' and x.periodo_fin <= now()
           ) as mes_vencido
      from users u
      left join saldos s on s.user_id = u.id
     where u.id = ${sesion.user.id} and u.activo
     limit 1
  `;

  let [fila] = await leer();
  if (!fila) return null;

  // Si su mes de plan ya terminó, se pone al día ANTES de mostrar el
  // saldo: sin esto, quien tiene plan anual vería cero al empezar su mes
  // hasta que corriera la tarea de cada hora. Solo cuesta una consulta
  // más cuando de verdad hay algo que renovar.
  if (fila.mes_vencido) {
    try {
      await sql`select renovar_suscripcion(${fila.id})`;
      [fila] = await leer();
      if (!fila) return null;
    } catch (e) {
      // Una renovación que falla no puede dejar al alumno por fuera de
      // la app: sigue con el saldo que tenía, y el error queda en el log
      // (la tarea de cada hora lo reintentará).
      console.error("No se pudo renovar el plan al cargar:", e instanceof Error ? e.message : e);
    }
  }

  // Cambiar la contraseña cierra las sesiones abiertas. Sin esto, a
  // quien te robó la cuenta no lo echa cambiar la clave: su sesión
  // sigue viva semanas, hasta que caduque sola.
  if (sesion.user.emitidaEn && Number(fila.validas_desde) > sesion.user.emitidaEn) {
    return null;
  }

  return {
    id: fila.id,
    nombre: fila.nombre,
    nivel: fila.nivel as Nivel,
    rol: fila.rol,
    institucionId: fila.institucion_id,
    mensajesPlan: fila.mensajes_plan,
    mensajesRecarga: fila.mensajes_recarga,
    enPrueba: fila.en_prueba,
    faltaVerificar: fila.falta_verificar,
    rachaDias: fila.racha_dias ?? 0,
  };
}
