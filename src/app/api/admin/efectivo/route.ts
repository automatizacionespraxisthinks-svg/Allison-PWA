import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { nuevaReferencia } from "@/lib/pasarela";
import { calcularRecarga, configPrecios, validarMonto } from "@/lib/precios";

const Pago = z.object({
  userId: z.string().uuid(),
  /** "plan": activa el plan mensual (sección 21: "la opción del plan mensual"). */
  tipo: z.enum(["recarga", "plan"]).default("recarga"),
  montoCop: z.coerce.number().int().min(0).max(5_000_000).default(0),
  medio: z.enum(["efectivo", "transferencia"]).default("efectivo"),
  /** Nota o número de recibo. */
  recibo: z.string().trim().max(80).optional().default(""),
  /** Lo que de verdad entró a la caja (para el cuadre del día). */
  valorRecibido: z.coerce.number().int().min(0).max(5_000_000).optional(),
});

/**
 * Registro de un pago EN EFECTIVO.
 *
 * No es un ajuste de saldo: es un ingreso. Crea una transacción real
 * con pasarela "efectivo" y la acredita por el MISMO camino probado de
 * los pagos en línea — idempotente, atómico y asentado en el libro.
 * Así el efectivo aparece en "Ingresos del mes" igual que lo demás, y
 * el día que la contabilidad pregunte de dónde salieron esos mensajes,
 * la respuesta está en la misma tabla que todo lo otro.
 *
 * Aplica la MISMA tasa y los mismos bonos por volumen que la recarga en
 * línea: pagar en efectivo no puede ser ni mejor ni peor negocio.
 */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const datos = Pago.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json(
      { error: datos.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { userId, tipo, medio, recibo } = datos.data;

  const [usuario] = await sql`
    select nombre from users where id = ${userId} and activo
  `;
  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Los mismos precios de la recarga en línea: pagar en efectivo no puede
  // ser ni mejor ni peor negocio.
  let montoCop = datos.data.montoCop;
  let mensajes: number;
  let bono = 0;
  let planId: string | null = null;
  if (tipo === "plan") {
    const [plan] = await sql`select id, precio_cop, mensajes_por_mes from planes where codigo = 'mensual' and activo`;
    if (!plan) return NextResponse.json({ error: "El plan mensual no está activo" }, { status: 400 });
    planId = plan.id;
    montoCop = plan.precio_cop;
    mensajes = plan.mensajes_por_mes;
  } else {
    const error = validarMonto(montoCop, configPrecios());
    if (error) return NextResponse.json({ error }, { status: 400 });
    const calculo = calcularRecarga(montoCop, configPrecios());
    mensajes = calculo.total;
    bono = calculo.bono;
  }

  const [transaccion] = await sql`
    insert into transacciones
      (user_id, tipo, plan_id, monto_cop, mensajes_otorgados, pasarela,
       referencia_externa, estado, payload)
    values
      (${userId}, ${tipo}, ${planId}, ${montoCop}, ${mensajes}, ${medio},
       ${nuevaReferencia()}, 'pendiente',
       ${sql.json({
         registradoPor: admin.nombre,
         adminId: admin.id,
         medio,
         recibo,
         valorRecibido: datos.data.valorRecibido ?? montoCop,
       })})
    returning id
  `;

  const [{ acreditar_transaccion: acreditado }] =
    await sql`select acreditar_transaccion(${transaccion.id})`;

  if (!acreditado) {
    return NextResponse.json(
      { error: "No se pudo acreditar. Revisa la transacción." },
      { status: 500 }
    );
  }

  const [saldo] = await sql`
    select mensajes_plan + mensajes_recarga as total
      from saldos where user_id = ${userId}
  `;

  return NextResponse.json({
    ok: true,
    mensajes,
    bono,
    saldo: saldo.total,
  });
}
