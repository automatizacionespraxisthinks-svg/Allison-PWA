import { NextResponse } from "next/server";
import { z } from "zod";
import { cambiarNivel } from "@/lib/nivel";
import { alumnoActual } from "@/lib/sesion";

const Cambio = z.object({
  nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

/**
 * El alumno cambia de nivel con la regla aprobada (src/lib/nivel.ts):
 * baja cuando quiera, vuelve a subir hasta el nivel más alto en el que
 * ya estuvo, y para pasar de ahí completa todas las actividades.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const datos = Cambio.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: "Nivel inválido" }, { status: 400 });
  }

  const r = await cambiarNivel(alumno.id, datos.data.nivel);
  if (r === "bloqueado") {
    return NextResponse.json(
      { error: "bloqueado", mensaje: "Para subir de nivel, completa todas las actividades de tu nivel." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true, nivel: datos.data.nivel });
}
