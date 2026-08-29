import { NextResponse } from "next/server";
import { borrarTodas } from "@/lib/conversaciones";
import { alumnoActual } from "@/lib/sesion";

/** Borra TODO el historial de charlas. El progreso no se toca. */
export async function DELETE() {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const borradas = await borrarTodas(alumno.id);
  return NextResponse.json({ ok: true, borradas });
}
