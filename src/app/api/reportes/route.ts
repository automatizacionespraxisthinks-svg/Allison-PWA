import { NextResponse } from "next/server";
import { z } from "zod";
import { limitar } from "@/lib/limite";
import { crearReporte, marcarAvisosVistos } from "@/lib/reportes";
import { alumnoActual } from "@/lib/sesion";

/** Reportes por hora y por alumno: más que esto ya no es revisar, es spam. */
const POR_HORA = 30;

const Reporte = z.object({
  mensajeId: z.string().uuid(),
  indice: z.number().int().min(0).max(20),
  comentario: z.string().trim().max(300).optional(),
});

/**
 * "Esta corrección está mal": el alumno reporta una corrección de
 * Allison. No devuelve nada todavía; lo decide el administrador.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const limite = limitar(`reportes:${alumno.id}`, POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Ya enviaste muchos reportes. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const datos = Reporte.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { mensajeId, indice, comentario } = datos.data;
  const r = await crearReporte(alumno.id, mensajeId, indice, comentario || null);

  if (r.estado === "no_encontrado") {
    return NextResponse.json({ error: "No encontramos esa corrección." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, estado: r.estado }, { status: r.estado === "creado" ? 201 : 200 });
}

const Vistos = z.object({ ids: z.array(z.string().uuid()).max(20) });

/** El alumno cerró el aviso de una decisión: no se le vuelve a mostrar. */
export async function PATCH(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const datos = Vistos.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  await marcarAvisosVistos(alumno.id, datos.data.ids);
  return NextResponse.json({ ok: true });
}
