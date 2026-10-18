import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { limpiarCurso } from "@/lib/importar";

const Cambio = z.object({
  userId: z.string().uuid(),
  /** Vacío: sin curso. */
  curso: z.string().trim().max(12),
});

/** El curso de un alumno, a mano (por ejemplo, al pasar de año). */
export async function POST(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const datos = Cambio.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const curso = limpiarCurso(datos.data.curso);
  const r = await sql`update users set curso = ${curso}, actualizado_en = now() where id = ${datos.data.userId} returning id`;
  if (!r.length) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, curso });
}

/** Buscar un alumno para la recarga manual: nombre, correo o usuario. */
export async function GET(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const q = (new URL(peticion.url).searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ alumnos: [] });
  const filas = await sql`
    select u.id, u.nombre, coalesce(u.email::text, u.username, u.telefono, '—') as identificador,
           i.nombre as colegio, u.curso,
           coalesce(s.mensajes_plan, 0) + coalesce(s.mensajes_recarga, 0) as saldo
      from users u
      left join instituciones i on i.id = u.institucion_id
      left join saldos s on s.user_id = u.id
     where u.activo
       and (lower(u.nombre) like ${`%${q}%`} or lower(coalesce(u.email::text, '')) like ${`%${q}%`}
            or lower(coalesce(u.username, '')) like ${`%${q}%`})
     order by u.nombre limit 8
  `;
  return NextResponse.json({
    alumnos: filas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      identificador: f.identificador,
      colegio: f.colegio,
      curso: f.curso,
      saldo: Number(f.saldo),
    })),
  });
}
