import { NextResponse } from "next/server";
import { borrarConversacion } from "@/lib/conversaciones";
import { alumnoActual } from "@/lib/sesion";
import { esUuid } from "@/lib/validar";

export async function DELETE(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const { id } = await params;
  if (!esUuid(id)) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const borrada = await borrarConversacion(alumno.id, id);

  if (!borrada) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
