import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { guardarAjustes } from "@/lib/ajustes";

const Cambios = z
  .object({
    dolarCop: z.coerce.number().int().min(1000).max(20000),
    diasDescansoRacha: z.coerce.number().int().min(0).max(7),
    alertaInactivoDias: z.coerce.number().int().min(1).max(90),
    alertaSaldoColegioPct: z.coerce.number().int().min(1).max(100),
    alertaReporteDias: z.coerce.number().int().min(1).max(60),
    alertaParadaIntervenciones: z.coerce.number().int().min(10).max(500),
    recordatorioCorreo: z.boolean(),
    recordatorioCelular: z.boolean(),
    fechaVersionNueva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha va como AAAA-MM-DD").nullable(),
  })
  .partial();

/** Ajustes del panel (plan, sección 21): quedan con quién los cambió. */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const datos = Cambios.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: datos.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  await guardarAjustes(datos.data, admin.nombre);
  return NextResponse.json({ ok: true });
}
