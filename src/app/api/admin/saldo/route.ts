import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { conMarca, operacionHecha } from "@/lib/panel/operaciones";
import { textoRequerido } from "@/lib/validar";

const Ajuste = z.object({
  userId: z.string().uuid(),
  cantidad: z.coerce.number().int().min(-100000).max(100000),
  bolsa: z.enum(["plan", "recarga"]).default("recarga"),
  nota: textoRequerido("Escribe por qué haces el ajuste", 3, 300),
  /** El id que el navegador le dio al ajuste al prepararlo: un reintento
   *  con el mismo id no vuelve a sumar (lib/panel/operaciones.ts). */
  operacion: z.string().uuid("Falta el id de la operación: recarga la página"),
});

/**
 * Ajusta el saldo de un usuario a mano.
 *
 * Exige una NOTA obligatoria. Un movimiento de saldo sin explicación es
 * indefendible el día que alguien pregunte por qué a una cuenta le
 * aparecieron 500 mensajes.
 */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const datos = Ajuste.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json(
      { error: datos.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = datos.data;

  if (d.cantidad === 0) {
    return NextResponse.json({ error: "La cantidad no puede ser cero" }, { status: 400 });
  }

  const [existe] = await sql`select id from users where id = ${d.userId}`;
  if (!existe) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Queda constancia de QUIÉN lo hizo, no solo de que se hizo
  const nota = conMarca(`${d.nota} — por ${admin.nombre}`, d.operacion);

  const r = await sql.begin(async (tx) => {
    // El mismo ajuste otra vez (la respuesta se perdió y se reintentó):
    // se responde con el saldo de hoy, sin sumar de nuevo (auditoría, 30
    // de octubre de 2026).
    if (await operacionHecha(tx, d.operacion, [d.userId])) {
      const [s] = await tx`
        select coalesce(mensajes_plan + mensajes_recarga, 0)::int as saldo from saldos where user_id = ${d.userId}
      `;
      return { repetida: true, saldo: Number(s?.saldo ?? 0) };
    }

    /**
     * La bolsa del plan solo vence con una suscripción activa (la vence
     * renovar_suscripcion al cerrar el mes del plan). Sin plan, lo que se
     * sumara ahí no vencería nunca, aunque la pantalla dijera «vence con
     * el mes» (auditoría, 30 de octubre de 2026).
     *
     * QUITAR sí se deja: el plan mensual en efectivo no abría suscripción
     * y dejó alumnos con 700 en la bolsa del plan que no vencen; sin esto
     * no habría cómo corregirlos.
     */
    if (d.bolsa === "plan" && d.cantidad > 0) {
      const [plan] = await tx`
        select 1 from suscripciones where user_id = ${d.userId} and estado = 'activa'
      `;
      if (!plan) return { sinPlan: true as const };
    }

    const [{ ajustar_saldo: saldo }] = await tx`
      select ajustar_saldo(${d.userId}, ${d.cantidad}, ${d.bolsa}::bolsa_credito, ${nota})
    `;
    return { repetida: false, saldo: Number(saldo) };
  });

  if (r.sinPlan) {
    return NextResponse.json(
      {
        error:
          "Este alumno no tiene un plan activo: lo que sumes a la bolsa del plan no le vencería nunca. " +
          "Súmalo a la bolsa de recarga (de la del plan solo se puede quitar).",
      },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true, saldo: r.saldo, repetida: r.repetida });
}
