import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { abrirSuscripcion, planConMesesPorDelante } from "@/lib/cobro";
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
  /** El id que el navegador le dio al pago al prepararlo. Es la
   *  referencia de la transacción: un reintento con el mismo id no
   *  acredita otra vez. */
  operacion: z.string().uuid("Falta el id de la operación: recarga la página"),
});

/** Los medios del panel: las dos «pasarelas» de las recargas manuales. */
const MEDIOS = ["efectivo", "transferencia"];

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
  const { userId, tipo, medio, recibo, operacion } = datos.data;

  /**
   * El mismo pago otra vez: la respuesta se perdió y el administrador
   * reintentó. Antes cada llamada creaba una referencia nueva y el
   * alumno recibía el doble; ahora la referencia es el id de la
   * operación, y lo ya registrado se responde tal cual (auditoría, 30 de
   * octubre de 2026). Se busca en los dos medios por si el reintento
   * llegó con el otro.
   */
  const anterior = async () => {
    const [t] = await sql`
      select user_id, mensajes_otorgados from transacciones
       where pasarela in ${sql(MEDIOS)} and referencia_externa = ${operacion}
       limit 1
    `;
    if (!t) return null;
    if (t.user_id !== userId) {
      return NextResponse.json({ error: "Ese id de operación ya se usó con otro alumno." }, { status: 409 });
    }
    const [saldo] = await sql`
      select mensajes_plan + mensajes_recarga as total from saldos where user_id = ${userId}
    `;
    return NextResponse.json({ ok: true, repetida: true, mensajes: t.mensajes_otorgados, bono: 0, saldo: saldo?.total ?? 0 });
  };
  const ya = await anterior();
  if (ya) return ya;

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

  /**
   * Insertar, acreditar y abrir la suscripción del plan van en UNA
   * transacción: si algo falla, no queda una orden a medias con el id de
   * la operación, y el reintento puede hacerlo completo. Si dos envíos
   * del mismo id llegan a la vez, el segundo espera al primero en el
   * insert y no inserta nada (la referencia es única por pasarela).
   */
  const r = await sql.begin(async (tx) => {
    // Con un plan que tiene meses por delante no se registra otro: lo
    // vencería y se perderían los meses pagados (auditoría, 30 de
    // octubre de 2026). Lo que corresponde es una recarga.
    if (tipo === "plan") {
      const activo = await planConMesesPorDelante(userId, tx);
      if (activo) return { planActivo: activo };
    }

    const [transaccion] = await tx`
      insert into transacciones
        (user_id, tipo, plan_id, monto_cop, mensajes_otorgados, pasarela,
         referencia_externa, estado, payload)
      values
        (${userId}, ${tipo}, ${planId}, ${montoCop}, ${mensajes}, ${medio},
         ${operacion}, 'pendiente',
         ${tx.json({
           registradoPor: admin.nombre,
           adminId: admin.id,
           medio,
           recibo,
           valorRecibido: datos.data.valorRecibido ?? montoCop,
         })})
      on conflict (pasarela, referencia_externa) do nothing
      returning id
    `;
    if (!transaccion) return { repetida: true as const };

    const [{ acreditar_transaccion: ok }] = await tx`select acreditar_transaccion(${transaccion.id})`;
    if (ok && tipo === "plan" && planId) await abrirSuscripcion(tx, userId, planId);
    return { acreditado: Boolean(ok) };
  });

  if (r.planActivo) {
    return NextResponse.json(
      {
        error:
          `${usuario.nombre} ya tiene el ${r.planActivo.nombre} activo hasta el ${r.planActivo.hasta}: otro plan le haría ` +
          "perder los meses que ya pagó. Regístrale una recarga (en línea, el alumno la hace en /recargar).",
        irA: "/recargar",
      },
      { status: 409 }
    );
  }
  if (r.repetida) {
    const repetida = await anterior();
    if (repetida) return repetida;
  }
  if (!r.acreditado) {
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
