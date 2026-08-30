import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { nuevaReferencia } from "@/lib/pasarela";
import { calcularRecarga, configPrecios } from "@/lib/precios";

const Pago = z.object({
  userId: z.string().uuid(),
  montoCop: z.coerce.number().int().min(1000).max(5_000_000),
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
      { error: "Monto inválido: entre $1.000 y $5.000.000" },
      { status: 400 }
    );
  }
  const { userId, montoCop } = datos.data;

  const [usuario] = await sql`
    select nombre from users where id = ${userId} and activo
  `;
  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const calculo = calcularRecarga(montoCop, configPrecios());

  const [transaccion] = await sql`
    insert into transacciones
      (user_id, tipo, monto_cop, mensajes_otorgados, pasarela,
       referencia_externa, estado, payload)
    values
      (${userId}, 'recarga', ${montoCop}, ${calculo.total}, 'efectivo',
       ${nuevaReferencia()}, 'pendiente',
       ${sql.json({ registradoPor: admin.nombre, adminId: admin.id })})
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
    mensajes: calculo.total,
    bono: calculo.bono,
    saldo: saldo.total,
  });
}
