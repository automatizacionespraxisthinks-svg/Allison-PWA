import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { asignarSaldo, MAX_POR_ALUMNO, previsualizar } from "@/lib/panel/colegios";
import { textoRequerido } from "@/lib/validar";

const Pedido = z.object({
  institucionId: z.string().uuid(),
  /** null: todo el colegio. */
  cursos: z.array(z.string().trim().min(1).max(20)).max(60).nullable(),
  porAlumno: z.coerce.number().int().min(1).max(MAX_POR_ALUMNO),
  motivo: textoRequerido("Escribe el motivo (por ejemplo, «Pago octubre 2026»)", 3, 200),
  confirmar: z.boolean().default(false),
  /** El id que el navegador le dio a la asignación al ver el total. Con
   *  `confirmar` es obligatorio: un reintento con el mismo id no vuelve a
   *  sumar (lib/panel/operaciones.ts). */
  operacion: z.string().uuid().optional(),
});

/**
 * Asignar saldo a un colegio o a sus cursos. Sin `confirmar` solo dice a
 * cuántos les llega y el total; con `confirmar`, lo hace (todo o nada).
 */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const datos = Pedido.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: datos.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { confirmar, operacion, ...p } = datos.data;
  if (p.cursos !== null && !p.cursos.length) {
    return NextResponse.json({ error: "Elige al menos un curso, o todo el colegio" }, { status: 400 });
  }
  // Si la respuesta de una asignación se perdía y el admin volvía a
  // confirmar, cada alumno recibía el doble (auditoría, 30 de octubre de 2026).
  if (confirmar && !operacion) {
    return NextResponse.json({ error: "Falta el id de la operación: recarga la página" }, { status: 400 });
  }
  const r = confirmar && operacion ? await asignarSaldo(p, admin.nombre, operacion) : await previsualizar(p);
  if (!r.alumnos) return NextResponse.json({ error: "No hay alumnos activos en esa selección" }, { status: 409 });
  return NextResponse.json({ ok: true, hecho: confirmar, ...r });
}
