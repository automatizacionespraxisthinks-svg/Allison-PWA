import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";

const Peticion = z.object({ transaccionId: z.string().uuid() });

/**
 * «Ya lo revisé» de un pago por revisar (monto distinto o anulado).
 *
 * Solo lo saca de la lista, con quién y cuándo: no toca el estado de la
 * orden ni el saldo, y la alerta se queda (una orden con monto distinto
 * sigue sin poder acreditarse sola). Lo que haya que descontar o
 * acreditar se hace aparte, con un ajuste con motivo desde la ficha del
 * alumno (auditoría, 30 de octubre de 2026).
 */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const datos = Peticion.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const revisada = { revisada_en: new Date().toISOString(), revisada_por: admin.nombre };
  const [t] = await sql`
    update transacciones
       set payload = payload || ${sql.json(revisada)}::jsonb
     where id = ${datos.data.transaccionId} and payload->>'alerta' is not null
     returning id
  `;
  if (!t) return NextResponse.json({ error: "Ese pago no tiene nada por revisar" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
