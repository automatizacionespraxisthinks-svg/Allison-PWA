import { sql } from "./db";

/**
 * El administrador entra a todo para probarlo (pedido del dueño, 1 de
 * noviembre de 2026): cualquier nivel, parada, lección, actividad,
 * escenario, salto, viaje y escenario del catálogo, sin desbloquear
 * nada. Lo que usa la IA le cuesta igual que a un alumno.
 */
export async function entraATodo(userId: string): Promise<boolean> {
  const [u] = await sql`select rol = 'admin' as admin from users where id = ${userId}`;
  return !!u?.admin;
}
