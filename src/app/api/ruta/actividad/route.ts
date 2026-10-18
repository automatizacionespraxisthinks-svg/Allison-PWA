import { NextResponse } from "next/server";
import { z } from "zod";
import { limitar } from "@/lib/limite";
import { terminarActividad } from "@/lib/ruta/avance";
import { alumnoActual } from "@/lib/sesion";

const Esquema = z.object({
  parada: z.string().min(4).max(12),
  leccion: z.number().int().min(1).max(10),
  paso: z.number().int().min(1).max(5),
  calificadas: z.number().int().min(0).max(20),
  aciertos: z.number().int().min(0).max(20),
  segundos: z.number().min(0).max(3600),
  fallos: z.array(z.string().max(200)).max(10).default([]),
  /** Primera sesión guiada: la primera actividad da la primera estrella. */
  primera: z.boolean().optional(),
});

/**
 * Una actividad terminada. Es gratis: no pasa por un prompt. Al
 * terminar la última de la lección devuelve las estrellas, la racha y
 * los minutos de hoy para la pantalla de fin de lección.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  // Una actividad de verdad dura más de unos segundos: 20 por minuto es más de lo que alguien termina.
  if (!limitar(`actividad:${alumno.id}`, 20, 60).permitido) {
    return NextResponse.json({ error: "Vas muy rápido. Espera un momento." }, { status: 429 });
  }

  const datos = Esquema.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });

  const r = await terminarActividad(alumno.id, alumno.nivel, datos.data);
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: r.error === "no_existe" ? 404 : 409 });
  }
  return NextResponse.json(r);
}
