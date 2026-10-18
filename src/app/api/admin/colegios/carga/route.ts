import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { cargarAlumnos } from "@/lib/cargaAlumnos";
import { MAX_POR_ALUMNO } from "@/lib/panel/colegios";

const Pedido = z.object({
  institucionId: z.string().uuid(),
  csv: z.string().min(1, "El archivo llegó vacío").max(2_000_000),
  confirmar: z.boolean().default(false),
  curso: z.string().trim().max(12).nullable().optional(),
  saldoInicial: z.coerce.number().int().min(0).max(MAX_POR_ALUMNO).default(0),
});

/**
 * La carga masiva desde el panel (boceto 4B): con el curso para todo el
 * archivo o la columna Curso (obligatoria si no se elige uno), y el saldo
 * inicial de las cuentas nuevas en el mismo paso.
 */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const datos = Pedido.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: datos.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const d = datos.data;
  const { status, ...r } = await cargarAlumnos({
    institucionId: d.institucionId,
    csv: d.csv,
    confirmar: d.confirmar,
    cursoParaTodos: d.curso ?? null,
    saldoInicial: d.saldoInicial,
    exigirCurso: true,
    quien: admin.nombre,
  });
  return NextResponse.json(r, { status });
}
