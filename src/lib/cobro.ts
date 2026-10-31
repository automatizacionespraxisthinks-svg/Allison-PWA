import type postgres from "postgres";
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
    // Un pago que la pasarela ya devolvió no entrega saldo aunque su link
    // siga diciendo PAGADO: la conciliación lo acreditaría sin dinero
    // (auditoría, 30 de octubre de 2026).
    if (orden.alerta === "anulada") return "cerrada";

    const [{ acreditar_transaccion: acreditado }] =
      await tx`select acreditar_transaccion(${t.id})`;
    if (!acreditado) return "ya_acreditado";

    if (orden.tipo === "plan" && orden.plan_id) await abrirSuscripcion(tx, orden.user_id, orden.plan_id);

    return "acreditado";
  })) as Desenlace;
}

/**
 * La suscripción de un plan recién acreditado, en la MISMA transacción
 * que acreditó. La usan los pagos en línea y los de efectivo del panel:
 * antes el efectivo solo acreditaba, la suscripción no se abría y esos
 * 700 nunca vencían ni se mostraban como plan (auditoría, 30 de octubre
 * de 2026).
 *
 * Vence el plan que estuviera activo. Con meses por delante, la compra
 * ya se negó antes de abrir la orden (planConMesesPorDelante); si aun así
 * llega aquí —dos órdenes abiertas a la vez y pagadas las dos—, el dinero
 * entró y se entrega el plan nuevo.
 */
export async function abrirSuscripcion(tx: postgres.TransactionSql, userId: string, planId: string): Promise<void> {
  const [plan] = await tx`
    select mensajes_por_mes, duracion_meses from planes where id = ${planId}
  `;
  await tx`
    update suscripciones set estado = 'vencida'
     where user_id = ${userId} and estado = 'activa'
  `;
  await tx`
    insert into suscripciones
      (user_id, plan_id, estado, inicio_en, fin_en,
       periodo_inicio, periodo_fin, mensajes_asignados)
    values
      (${userId}, ${planId}, 'activa', now(),
       now() + (${plan.duracion_meses} || ' months')::interval,
       now(), now() + interval '1 month', ${plan.mensajes_por_mes})
  `;
}

/**
 * El plan activo del alumno, si todavía tiene meses por delante: su fin
 * (fin_en) va más allá del fin del mes en curso (periodo_fin).
 *
 * Comprar un plan vence en el acto el que está activo (abrirSuscripcion),
 * y con un semestral o un anual se perdían los meses ya pagados. Por
 * decisión del dueño, mientras al plan le queden meses no se vende otro:
 * quien gastó las intervenciones del mes antes de tiempo recarga
 * (auditoría, 30 de octubre de 2026). Un mensual al que solo le queda su
 * mes sí se puede volver a comprar, como antes: no tiene meses que perder.
 *
 * La usan /api/pagos/crear, el efectivo del panel y /planes, para que los
 * tres digan lo mismo. Dentro de una transacción se le pasa `tx`.
 */
export async function planConMesesPorDelante(
  userId: string,
  db: postgres.Sql | postgres.TransactionSql = sql
): Promise<{ nombre: string; hasta: string } | null> {
  const [s] = await db`
    select p.nombre,
           to_char(s.fin_en at time zone 'America/Bogota', 'DD/MM/YYYY') as hasta
      from suscripciones s join planes p on p.id = s.plan_id
     where s.user_id = ${userId} and s.estado = 'activa' and s.fin_en > s.periodo_fin
     limit 1
  `;
  return s ? { nombre: s.nombre as string, hasta: s.hasta as string } : null;
}

/**
 * Cuándo vence la bolsa del plan de cada alumno: el fin del mes de su
 * plan activo (periodo_fin), en hora de Colombia. Quien no tiene plan
 * activo no aparece: a él la bolsa del plan no le vence nunca, porque
 * renovar_suscripcion solo actúa sobre una suscripción activa. Por eso
 * el panel no deja ajustársela y, a los demás, les dice la fecha real en
 * vez de «vence con el mes» (auditoría, 30 de octubre de 2026).
 */
export async function finDelMesDelPlan(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {};
  const filas = await sql`
    select user_id, to_char(periodo_fin at time zone 'America/Bogota', 'DD/MM/YYYY') as vence
      from suscripciones
     where estado = 'activa' and user_id = any(${userIds}::uuid[])
  `;
  return Object.fromEntries(filas.map((f) => [f.user_id as string, f.vence as string]));
}

export type DesenlaceAnulacion = "marcada" | "ya_marcada" | "desconocida";

/**
 * Una anulación aprobada por la pasarela (reembolso o contracargo).
 *
 * Antes el aviso se ignoraba con un console.warn: la orden seguía
 * aprobada, el alumno conservaba el saldo y el dinero, y el panel lo
 * contaba como ingreso. Ahora la orden queda marcada en su payload
 * (alerta 'anulada' y la fecha) y aparece en «Pagos por revisar» del
 * panel. NO se descuenta saldo aquí: el alumno pudo gastarlo ya, y lo
 * que se descuente lo decide el administrador con un ajuste con motivo
 * (auditoría, 30 de octubre de 2026).
 *
 * La orden se busca por nuestra referencia y, si el aviso no la trae,
 * por el id del pago que el aviso de la venta dejó en el historial.
 */
export async function registrarAnulacion(anulacion: {
  pasarela: string;
  referencia: string | null;
  idPago: string | null;
  rastro: Rastro;
}): Promise<DesenlaceAnulacion> {
  let [t] = anulacion.referencia
    ? await sql`
        select id, referencia_externa, payload->>'alerta' as alerta
          from transacciones
         where pasarela = ${anulacion.pasarela} and referencia_externa = ${anulacion.referencia}
         limit 1
      `
    : [];
  if (!t && anulacion.idPago) {
    [t] = await sql`
      select id, referencia_externa, payload->>'alerta' as alerta
        from transacciones
       where pasarela = ${anulacion.pasarela}
         and payload->'historial' @> ${sql.json([{ transaccion: anulacion.idPago }])}::jsonb
       order by creado_en desc
       limit 1
    `;
  }
  if (!t) {
    console.error(
      `Anulación aprobada en ${anulacion.pasarela} sin orden que coincida (referencia ` +
        `${anulacion.referencia ?? "—"}, pago ${anulacion.idPago ?? "—"}): búscala en el panel de la pasarela.`
    );
    return "desconocida";
  }

  const ahora = new Date().toISOString();
  const entrada = { origen: "aviso", en: ahora, ...anulacion.rastro };
  // Una anulación nueva vuelve a la lista aunque la orden ya se hubiera
  // revisado por otra alerta: hay algo nuevo que mirar.
  const quitar = t.alerta === "anulada" ? [] : ["revisada_en", "revisada_por"];
  await sql`
    update transacciones
       set payload = (
             jsonb_set(
               coalesce(payload, '{}'::jsonb),
               '{historial}',
               coalesce(payload->'historial', '[]'::jsonb) || jsonb_build_array(${sql.json(entrada as never)}::jsonb)
             )
             || jsonb_build_object('alerta', 'anulada', 'anulada_en', coalesce(payload->>'anulada_en', ${ahora}::text))
           ) - ${quitar}::text[]
     where id = ${t.id}
  `;

  if (t.alerta === "anulada") return "ya_marcada";
  console.error(
    `Anulación aprobada de la orden ${t.referencia_externa}: el dinero volvió al pagador. ` +
      "Revísala en el panel (Recargas › Pagos por revisar) y descuenta a mano lo que corresponda."
  );
  return "marcada";
}
