import type postgres from "postgres";

/**
 * Que una operación del panel que mueve saldo no se haga dos veces
 * (auditoría, 30 de octubre de 2026).
 *
 * Si la respuesta se perdía (la red del colegio, los datos móviles) y el
 * administrador volvía a confirmar, el alumno —o un colegio entero—
 * recibía el doble. Ahora el navegador genera un id al preparar la
 * operación (crypto.randomUUID()) y lo manda con ella; el servidor no
 * acredita dos veces el mismo id.
 *
 * El efectivo usa el id como referencia_externa de su transacción, que ya
 * es única por pasarela. Los ajustes a mano y la asignación a un colegio
 * no crean transacción, y no hay tabla para guardar el id sin una
 * migración: el id va al final de la nota de cada movimiento del libro
 * que la operación crea. Así queda en la MISMA transacción que el saldo
 * —no puede existir el movimiento sin la marca ni la marca sin el
 * movimiento—, sobrevive a un reinicio y sirve con varias instancias, que
 * es lo que un mapa en memoria no daría. Un candado de la base por id
 * (pg_advisory_xact_lock) pone en fila dos envíos simultáneos del mismo.
 */

export const conMarca = (nota: string, operacion: string) => `${nota} [op:${operacion}]`;

/** La nota sin la marca, para mostrarla. No va anclada al final:
 *  ajustar_saldo agrega después «[se pidió… y solo se pudo aplicar…]». */
export const sinMarca = (nota: string) => nota.replace(/ \[op:[0-9a-f-]{36}\]/, "");

/**
 * ¿Esta operación ya se hizo? Se llama DENTRO de la transacción que la
 * haría, antes de mover saldo, y deja tomado el candado hasta que esa
 * transacción termine. Devuelve lo que hizo (a cuántos y cuánto), o null.
 *
 * Un ajuste negativo sobre una bolsa en cero no deja movimiento (no hubo
 * nada que mover), y por eso tampoco marca: repetirlo no quita nada que
 * la primera vez sí hubiera quitado, salvo que el saldo haya subido entre
 * tanto.
 */
export async function operacionHecha(
  tx: postgres.TransactionSql,
  operacion: string,
  usuarios: string[]
): Promise<{ alumnos: number; total: number } | null> {
  const marca = `[op:${operacion}]`;
  await tx`select pg_advisory_xact_lock(hashtext(${marca}))`;
  const [r] = await tx`
    select count(*)::int as alumnos, coalesce(sum(cantidad), 0)::int as total
      from movimientos_credito
     where user_id = any(${usuarios}::uuid[])
       and tipo = 'ajuste_admin'
       and position(${marca} in coalesce(nota, '')) > 0
  `;
  return r.alumnos > 0 ? { alumnos: Number(r.alumnos), total: Number(r.total) } : null;
}
