import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { alumnoActual } from "@/lib/sesion";

const Pedido = z.discriminatedUnion("accion", [
  // Alumnos actuales: ya vieron la pantalla que les cuenta la ruta nueva.
  z.object({ accion: z.literal("presentada") }),
  // Ajustes del perfil: la meta diaria y la hora del recordatorio.
  z.object({
    accion: z.literal("ajustes"),
    meta: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    hora: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
  }),
  // La primera sesión guiada: el nivel inicial, la meta diaria y la hora
  // del recordatorio. Ningún paso gasta intervenciones.
  z.object({
    accion: z.literal("primera"),
    nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
    meta: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    hora: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
  }),
]);

export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const datos = Pedido.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  const d = datos.data;

  if (d.accion === "presentada") {
    await sql`update users set ruta_presentada_en = now() where id = ${alumno.id}`;
    return NextResponse.json({ ok: true });
  }

  if (d.accion === "ajustes") {
    await sql`
      update users set meta_diaria_min = ${d.meta}, recordatorio_hora = ${d.hora}, actualizado_en = now()
       where id = ${alumno.id}
    `;
    return NextResponse.json({ ok: true });
  }

  // El nivel inicial se elige una sola vez, en la primera sesión. Después
  // solo se baja (plan, sección 22): quien ya la hizo no puede usar esta
  // ruta para subirse de nivel.
  // Tampoco quien ya practicó (entró a Hablar sin pasar por la primera
  // sesión): su nivel ya es el que eligió al registrarse.
  const [{ practico }] = await sql`select exists (select 1 from progreso_diario where user_id = ${alumno.id}) as practico`;
  if (alumno.primeraSesion || practico) {
    await sql`
      update users set meta_diaria_min = ${d.meta}, recordatorio_hora = ${d.hora},
             primera_sesion_en = coalesce(primera_sesion_en, now()), actualizado_en = now()
       where id = ${alumno.id}
    `;
    return NextResponse.json({ ok: true, nivel: alumno.nivel });
  }

  await sql`
    update users
       set nivel = ${d.nivel}, nivel_maximo = ${d.nivel},
           meta_diaria_min = ${d.meta}, recordatorio_hora = ${d.hora},
           primera_sesion_en = now(), ruta_presentada_en = now(), actualizado_en = now()
     where id = ${alumno.id}
  `;
  return NextResponse.json({ ok: true, nivel: d.nivel });
}
