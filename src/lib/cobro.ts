import { sql } from "./db.ts";
import type { Rastro } from "./pasarela.ts";

export type Desenlace =
  | "acreditado"
  | "ya_acreditado"
  | "rechazado"
  | "desconocido"
  | "monto_distinto"
  | "cerrada";

/** Estados desde los que una orden todavía puede acreditarse. */
const ACREDITABLES = ["pendiente", "rechazada"];

/**
 * Aplica a una orden lo que la pasarela dice que pasó con su pago.
 *
 * Es el ÚNICO camino por el que un pago en línea entrega saldo, y lo
 * usan tres puertas: el aviso firmado de la pasarela, la consulta activa
 * cuando el alumno vuelve de pagar, y la conciliación de la limpieza.
 * Que todas pasen por aquí es lo que garantiza que no puedan acreditar
 * dos veces ni con reglas distintas.
 */
export async function registrarResultado(resultado: {
  pasarela: string;
  referencia: string;
  aprobado: boolean;
  /** Lo que la pasarela dice que se cobró. Si no coincide con la orden,
   *  no se acredita y la orden queda marcada para revisarla a mano. */
  montoCop?: number;
  /** Identificadores y montos, sin datos personales (ver Rastro). */
  rastro: Rastro;
  origen: "aviso" | "consulta";
}): Promise<Desenlace> {
  const [t] = await sql`
    select id, estado, monto_cop
      from transacciones
     where pasarela = ${resultado.pasarela}
       and referencia_externa = ${resultado.referencia}
     limit 1
  `;
  if (!t) return "desconocido";

  // Se AGREGA al historial en vez de reemplazar: un rechazo que llega
  // tarde no puede borrar el rastro de la aprobación. Y se conserva lo
  // demás del registro, como el id del link.
  const entrada = { origen: resultado.origen, en: new Date().toISOString(), ...resultado.rastro };
  await sql`
    update transacciones
       set payload = jsonb_set(
             coalesce(payload, '{}'::jsonb),
             '{historial}',
             coalesce(payload->'historial', '[]'::jsonb) || jsonb_build_array(${sql.json(entrada as never)}::jsonb)
           )
     where id = ${t.id}
  `;

  if (!resultado.aprobado) {
    if (t.estado === "aprobada") return "ya_acreditado";
    // Solo una orden pendiente pasa a rechazada. Y no es definitivo: un
    // link de Bold sigue activo tras un intento fallido, y si el alumno
    // reintenta y paga, la orden rechazada se acredita igual.
    await sql`
      update transacciones set estado = 'rechazada'
       where id = ${t.id} and estado = 'pendiente'
    `;
    return "rechazado";
  }

  if (resultado.montoCop !== undefined && resultado.montoCop !== t.monto_cop) {
    // La marca queda en la orden: otra puerta (la consulta del link, que
    // devuelve el monto que nosotros mismos fijamos) no puede acreditar
    // después lo que un aviso ya dijo que no cuadra.
    await sql`
      update transacciones
         set payload = coalesce(payload, '{}'::jsonb) || '{"alerta": "monto_distinto"}'::jsonb
       where id = ${t.id}
    `;
    console.error(
      `Pago de la orden ${resultado.referencia} con monto distinto: la pasarela ` +
        `dice ${resultado.montoCop} y la orden es de ${t.monto_cop}. No se acredita; revísala a mano.`
    );
    return "monto_distinto";
  }

  /**
   * Acreditar y abrir la suscripción del plan van en UNA transacción.
   * Separados, si la suscripción fallaba después de acreditar, los
   * reintentos respondían "ya acreditado" y la suscripción no se creaba
   * nunca. Y el estado se revisa aquí dentro, con la fila bloqueada:
   * una orden reversada a mano no vuelve a acreditarse porque su link
   * siga diciendo PAGADO.
   */
  return (await sql.begin(async (tx) => {
    const [orden] = await tx`
      select estado, tipo, plan_id, user_id, payload->>'alerta' as alerta
        from transacciones where id = ${t.id}
         for update
    `;

    if (orden.estado === "aprobada") return "ya_acreditado";
    if (!ACREDITABLES.includes(orden.estado)) return "cerrada";
    if (orden.alerta === "monto_distinto") return "monto_distinto";

    const [{ acreditar_transaccion: acreditado }] =
      await tx`select acreditar_transaccion(${t.id})`;
    if (!acreditado) return "ya_acreditado";

    if (orden.tipo === "plan" && orden.plan_id) {
      const [plan] = await tx`
        select mensajes_por_mes, duracion_meses from planes where id = ${orden.plan_id}
      `;
      await tx`
        update suscripciones set estado = 'vencida'
         where user_id = ${orden.user_id} and estado = 'activa'
      `;
      await tx`
        insert into suscripciones
          (user_id, plan_id, estado, inicio_en, fin_en,
           periodo_inicio, periodo_fin, mensajes_asignados)
        values
          (${orden.user_id}, ${orden.plan_id}, 'activa', now(),
           now() + (${plan.duracion_meses} || ' months')::interval,
           now(), now() + interval '1 month', ${plan.mensajes_por_mes})
      `;
    }

    return "acreditado";
  })) as Desenlace;
}
