import { NextResponse } from "next/server";
import { z } from "zod";
import { borrarEntrada } from "@/lib/glosario";
import { alumnoActual } from "@/lib/sesion";

const Id = z.string().uuid();

/** Quitar una entrada del glosario. Solo las propias. */
export async function DELETE(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const id = Id.safeParse((await params).id);
  if (!id.success) {
    return NextResponse.json({ error: "Entrada inválida" }, { status: 400 });
  }

  const borrada = await borrarEntrada(alumno.id, id.data);
  if (!borrada) {
    return NextResponse.json({ error: "Esa entrada no existe" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
