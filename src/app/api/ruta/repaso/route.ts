import { NextResponse } from "next/server";
import { z } from "zod";
import { terminarRepaso } from "@/lib/ruta/repaso";
import { alumnoActual } from "@/lib/sesion";

const Esquema = z.object({
  id: z.string().uuid(),
  /** Cómo le fue en cada pregunta (n: su posición en el repaso). */
  resultados: z.array(z.object({ n: z.number().int().min(0).max(4), bien: z.boolean() })).max(5),
  segundos: z.number().min(0).max(3600),
});

/** Termina un repaso sorpresa: 1 estrella. Gratis (lo que gasta son sus evaluaciones). */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const datos = Esquema.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  const r = await terminarRepaso(alumno.id, datos.data.id, datos.data.resultados, datos.data.segundos);
  if (!r.ok) return NextResponse.json({ error: "no_existe" }, { status: 404 });
  return NextResponse.json(r);
}
