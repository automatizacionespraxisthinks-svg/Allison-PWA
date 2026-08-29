import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { textoRequerido } from "@/lib/validar";

const Colegio = z.object({
  nombre: textoRequerido("Escribe el nombre del colegio", 3, 120),
  nit: z.string().trim().max(30).optional().default(""),
  codigoAcceso: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,20}$/, "El código admite letras y números, de 4 a 20"),
  contactoEmail: z.string().trim().toLowerCase().max(120).optional().default(""),
  contactoTelefono: z.string().trim().max(30).optional().default(""),
  cupoAlumnos: z.coerce.number().int().min(1).max(20000),
  tarifaPorAlumno: z.coerce.number().int().min(0).max(1_000_000),
  notas: z.string().trim().max(1000).optional().default(""),
});

export async function POST(peticion: Request) {
  if (!(await exigirAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const datos = Colegio.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json(
      { error: datos.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = datos.data;

  try {
    const [c] = await sql`
      insert into instituciones
        (nombre, nit, codigo_acceso, contacto_email, contacto_telefono,
         cupo_alumnos, tarifa_por_alumno_cop, notas, estado)
      values
        (${d.nombre}, ${d.nit || null}, ${d.codigoAcceso},
         ${d.contactoEmail || null}, ${d.contactoTelefono || null},
         ${d.cupoAlumnos}, ${d.tarifaPorAlumno}, ${d.notas || null}, 'activa')
      returning id
    `;
    return NextResponse.json({ ok: true, id: c.id }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "Ya existe un colegio con ese código de acceso" },
        { status: 409 }
      );
    }
    throw e;
  }
}

const Actualizacion = z.object({
  id: z.string().uuid(),
  estado: z.enum(["activa", "suspendida"]).optional(),
  cupoAlumnos: z.coerce.number().int().min(1).max(20000).optional(),
  tarifaPorAlumno: z.coerce.number().int().min(0).max(1_000_000).optional(),
  notas: z.string().trim().max(1000).optional(),
  /** Registro del pago en efectivo, que ocurre fuera de la plataforma. */
  pagoCop: z.coerce.number().int().min(0).max(500_000_000).optional(),
  pagadoHasta: z.string().trim().optional(),
});

export async function PATCH(peticion: Request) {
  if (!(await exigirAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const datos = Actualizacion.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json(
      { error: datos.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = datos.data;

  const cambios: Record<string, unknown> = {};
  if (d.estado) cambios.estado = d.estado;
  if (d.cupoAlumnos !== undefined) cambios.cupo_alumnos = d.cupoAlumnos;
  if (d.tarifaPorAlumno !== undefined) cambios.tarifa_por_alumno_cop = d.tarifaPorAlumno;
  if (d.notas !== undefined) cambios.notas = d.notas || null;

  // El convenio se paga en efectivo por fuera de la plataforma: aquí
  // solo se anota que la plata entró y hasta cuándo cubre.
  if (d.pagoCop !== undefined) {
    cambios.ultimo_pago_cop = d.pagoCop;
    cambios.ultimo_pago_en = new Date();
  }
  if (d.pagadoHasta) cambios.pagado_hasta = d.pagadoHasta;

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 });
  }

  await sql`update instituciones set ${sql(cambios)} where id = ${d.id}`;
  return NextResponse.json({ ok: true });
}
