import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { ponerNivelComoAdmin } from "@/lib/nivel";

const Cambio = z.object({
  userId: z.string().uuid(),
  nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

/**
 * El administrador sube o baja de nivel a cualquier alumno, a voluntad
 * (plan, sección 22). El avance de cada nivel se guarda aparte: si el
 * alumno vuelve a un nivel donde ya estuvo, sigue donde iba.
 */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const datos = Cambio.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  await ponerNivelComoAdmin(datos.data.userId, datos.data.nivel);
  return NextResponse.json({ ok: true, nivel: datos.data.nivel });
}
