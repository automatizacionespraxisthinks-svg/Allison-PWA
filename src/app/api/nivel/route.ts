import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { alumnoActual } from "@/lib/sesion";

const Cambio = z.object({
  nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

/**
 * El alumno cambia su nivel cuando quiera.
 *
 * Sin restricciones: si le queda grande baja, si le aburre sube. Un
 * nivel que no se puede cambiar deja al alumno atrapado en un producto
 * que dejó de servirle.
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

  await sql`
    update users set nivel = ${datos.data.nivel}, actualizado_en = now()
     where id = ${alumno.id}
  `;

  return NextResponse.json({ ok: true, nivel: datos.data.nivel });
}
