import { NextResponse } from "next/server";
import { z } from "zod";
import { activarCompetencia } from "@/lib/competencia";
import { alumnoActual } from "@/lib/sesion";

const Pedido = z.object({ activa: z.boolean() });

/**
 * El coordinador enciende o apaga la competencia por salón de su colegio.
 * El colegio sale de la sesión, nunca de la petición.
 */
export async function POST(peticion: Request) {
  const usuario = await alumnoActual();
  if (!usuario) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (usuario.rol !== "coordinador" && usuario.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!usuario.institucionId) return NextResponse.json({ error: "Sin colegio asignado" }, { status: 403 });

  const datos = Pedido.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  await activarCompetencia(usuario.institucionId, datos.data.activa);
  return NextResponse.json({ ok: true });
}
