import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { resolverReporte } from "@/lib/reportes";

const Decision = z.object({
  id: z.string().uuid(),
  decision: z.enum(["allison_se_equivoco", "correccion_buena"]),
});

/**
 * La decisión sobre un reporte. "Allison se equivocó" devuelve 1
 * intervención al alumno (en la misma transacción, db/023). Un reporte
 * ya resuelto responde 409: dos clics no devuelven dos veces.
 */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

  const datos = Decision.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const ok = await resolverReporte(datos.data.id, admin.id, datos.data.decision);
  if (!ok) return NextResponse.json({ error: "Ese reporte ya estaba resuelto." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
