import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { pasarela } from "@/lib/pasarela";

/**
 * Aviso de pago de la pasarela.
 *
 * Es el único punto donde se entrega saldo. Tres defensas:
 *   1. Firma verificada: sin ella, cualquiera se regala mensajes.
 *   2. Idempotencia: la base rechaza acreditar dos veces la misma
 *      transacción, y la pasarela reenvía avisos con frecuencia.
 *   3. El monto y los mensajes salen de la transacción guardada, no
 *      del cuerpo del aviso.
 */
export async function POST(peticion: Request) {
  const crudo = await peticion.text();
  const via = pasarela();

  if (!via.verificarFirma(crudo, peticion.headers)) {
    console.warn("Webhook con firma inválida");
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const evento = via.interpretarEvento(cuerpo);
  if (!evento) {
    return NextResponse.json({ error: "Evento no reconocido" }, { status: 400 });
  }

  const [transaccion] = await sql`
    select id, user_id, tipo, plan_id, estado
      from transacciones
     where pasarela = ${via.nombre} and referencia_externa = ${evento.referencia}
     limit 1
  `;

  if (!transaccion) {
    // 200 a propósito: si devolvemos error la pasarela reintenta para
    // siempre un pago que no es nuestro.
    console.warn("Webhook de una referencia desconocida:", evento.referencia);
    return NextResponse.json({ ok: true, ignorado: true });
  }

  await sql`
    update transacciones set payload = ${sql.json(cuerpo as never)}
     where id = ${transaccion.id}
  `;

  if (!evento.aprobado) {
    await sql`
      update transacciones set estado = 'rechazada'
       where id = ${transaccion.id} and estado = 'pendiente'
    `;
    return NextResponse.json({ ok: true, acreditado: false });
  }

  const [{ acreditar_transaccion: acreditado }] =
    await sql`select acreditar_transaccion(${transaccion.id})`;

  // Un plan además abre o renueva la suscripción
  if (acreditado && transaccion.tipo === "plan" && transaccion.plan_id) {
    const [plan] = await sql`
      select mensajes_por_mes, duracion_meses from planes where id = ${transaccion.plan_id}
    `;
    await sql`
      update suscripciones set estado = 'vencida'
       where user_id = ${transaccion.user_id} and estado = 'activa'
    `;
    await sql`
      insert into suscripciones
        (user_id, plan_id, estado, inicio_en, fin_en,
         periodo_inicio, periodo_fin, mensajes_asignados)
      values
        (${transaccion.user_id}, ${transaccion.plan_id}, 'activa', now(),
         now() + (${plan.duracion_meses} || ' months')::interval,
         now(), now() + interval '1 month', ${plan.mensajes_por_mes})
    `;
  }

  return NextResponse.json({ ok: true, acreditado });
}
