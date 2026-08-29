import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { textoRequerido } from "@/lib/validar";

const Ajuste = z.object({
  userId: z.string().uuid(),
  cantidad: z.coerce.number().int().min(-100000).max(100000),
  bolsa: z.enum(["plan", "recarga"]).default("recarga"),
  nota: textoRequerido("Escribe por qué haces el ajuste", 3, 300),
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
  const nota = `${d.nota} — por ${admin.nombre}`;

  const [{ ajustar_saldo: saldo }] = await sql`
    select ajustar_saldo(${d.userId}, ${d.cantidad}, ${d.bolsa}::bolsa_credito, ${nota})
  `;

  return NextResponse.json({ ok: true, saldo });
}
