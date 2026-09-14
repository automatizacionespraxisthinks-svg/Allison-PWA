import { sql } from "./db.ts";

export type Desenlace =
  | "acreditado"
  | "ya_acreditado"
  | "rechazado"
  | "desconocido"
  | "monto_distinto";

/**
 * Aplica a una orden lo que la pasarela dice que pasó con su pago.
 *
 * Es el ÚNICO camino por el que un pago en línea entrega saldo, y lo
 * usan dos puertas: el aviso firmado de la pasarela y la consulta activa
 * de su estado (cuando el alumno vuelve de pagar, y en la revisión
 * diaria). Que las dos pasen por aquí es lo que garantiza que no puedan
 * acreditar dos veces ni con reglas distintas: la base bloquea la fila y
 * acreditar_transaccion es idempotente, así que si llegan a la vez, solo
 * una acredita.
 */
export async function registrarResultado(resultado: {
  pasarela: string;
  referencia: string;
  aprobado: boolean;
  /** Lo que la pasarela dice que se cobró. Si no coincide con la orden,
   *  no se acredita: la orden queda pendiente para revisarla a mano. */
  montoCop?: number;
  /** Lo recibido, tal cual, para la auditoría. */
  detalle: unknown;
  origen: "aviso" | "consulta";
}): Promise<Desenlace> {
  const [t] = await sql`
    select id, user_id, tipo, plan_id, estado, monto_cop
      from transacciones
     where pasarela = ${resultado.pasarela}
       and referencia_externa = ${resultado.referencia}
     limit 1
  `;
  if (!t) return "desconocido";

  // Se AGREGA a lo guardado en vez de reemplazarlo: ahí vive también el
  // identificador del link, que se necesita para consultar el estado.
  await sql`
    update transacciones
       set payload = coalesce(payload, '{}'::jsonb)
                     || ${sql.json({ [resultado.origen]: resultado.detalle } as never)}::jsonb
     where id = ${t.id}
  `;

  if (!resultado.aprobado) {
    if (t.estado === "aprobada") return "ya_acreditado";
    // Solo una orden pendiente pasa a rechazada. Y no es definitivo: un
    // link de Bold sigue activo tras un intento fallido, y si el alumno
    // reintenta y paga, acreditar_transaccion acredita igual.
    await sql`
      update transacciones set estado = 'rechazada'
       where id = ${t.id} and estado = 'pendiente'
    `;
    return "rechazado";
  }

  if (resultado.montoCop !== undefined && resultado.montoCop !== t.monto_cop) {
    console.error(
      `Pago de la orden ${resultado.referencia} con monto distinto: la pasarela ` +
        `dice ${resultado.montoCop} y la orden es de ${t.monto_cop}. No se acredita.`
    );
    return "monto_distinto";
  }

  const [{ acreditar_transaccion: acreditado }] =
    await sql`select acreditar_transaccion(${t.id})`;
  if (!acreditado) return "ya_acreditado";

  // Un plan además abre o renueva la suscripción
  if (t.tipo === "plan" && t.plan_id) {
    const [plan] = await sql`
      select mensajes_por_mes, duracion_meses from planes where id = ${t.plan_id}
    `;
    await sql`
      update suscripciones set estado = 'vencida'
       where user_id = ${t.user_id} and estado = 'activa'
    `;
    await sql`
      insert into suscripciones
        (user_id, plan_id, estado, inicio_en, fin_en,
         periodo_inicio, periodo_fin, mensajes_asignados)
      values
        (${t.user_id}, ${t.plan_id}, 'activa', now(),
         now() + (${plan.duracion_meses} || ' months')::interval,
         now(), now() + interval '1 month', ${plan.mensajes_por_mes})
    `;
  }

  return "acreditado";
}
