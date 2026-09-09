import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { nuevaReferencia, pasarela } from "@/lib/pasarela";
import { calcularRecarga, configPrecios, validarMonto } from "@/lib/precios";
import { alumnoActual } from "@/lib/sesion";
import { origenPublico } from "@/lib/origen";

/** Órdenes de pago que puede abrir un alumno por hora. */
const ORDENES_POR_HORA = 10;

export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`pago:${alumno.id}`, ORDENES_POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados intentos de pago. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const cuerpo = await peticion.json().catch(() => null);
  const tipo = (cuerpo as { tipo?: string })?.tipo;

  let montoCop: number;
  let mensajes: number;
  let concepto: string;
  let planId: string | null = null;

  if (tipo === "plan") {
    const codigo = String((cuerpo as { plan?: string }).plan ?? "");
    const [plan] = await sql`
      select id, nombre, precio_cop, mensajes_por_mes
        from planes where codigo = ${codigo} and activo
    `;
    if (!plan) {
      return NextResponse.json({ error: "Ese plan no existe" }, { status: 400 });
    }
    planId = plan.id;
    montoCop = plan.precio_cop;
    // El plan entrega los mensajes del PRIMER mes. Los siguientes los
    // asigna la renovación mensual, no este pago.
    mensajes = plan.mensajes_por_mes;
    concepto = plan.nombre;
  } else {
    const monto = Number((cuerpo as { monto?: number })?.monto);
    const error = validarMonto(monto, configPrecios());
    if (error) return NextResponse.json({ error }, { status: 400 });

    const cfg = configPrecios();
    const calculo = calcularRecarga(monto, cfg);
    montoCop = calculo.montoCop;
    mensajes = calculo.total;
    concepto = `Recarga de ${calculo.total} mensajes`;
  }

  const via = pasarela();
  const referencia = nuevaReferencia();

  // La transacción nace PENDIENTE con su referencia definitiva. Solo el
  // webhook la aprueba y entrega los mensajes: nada que venga del
  // navegador acredita saldo.
  const [transaccion] = await sql`
    insert into transacciones
      (user_id, tipo, plan_id, monto_cop, mensajes_otorgados,
       pasarela, referencia_externa, estado)
    values
      (${alumno.id}, ${tipo === "plan" ? "plan" : "recarga"}, ${planId},
       ${montoCop}, ${mensajes}, ${via.nombre}, ${referencia}, 'pendiente')
    returning id
  `;

  let pago;
  try {
    pago = await via.crearPago({
      transaccionId: transaccion.id,
      referencia,
      montoCop,
      concepto,
      correo: null,
      origen: origenPublico(peticion),
    });
  } catch (e) {
    // Sin esto la fila queda pendiente para siempre y ensucia los
    // reportes de pagos sin completar.
    await sql`
      update transacciones set estado = 'rechazada' where id = ${transaccion.id}
    `;
    console.error("La pasarela no pudo abrir el pago:", e);
    return NextResponse.json(
      { error: "No pudimos abrir el pago. Intenta de nuevo." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    transaccionId: transaccion.id,
    referencia,
    urlPago: pago.urlPago,
    montoCop,
    mensajes,
    concepto,
    simulada: via.simulada,
  });
}
