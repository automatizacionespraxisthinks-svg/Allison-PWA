import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";
import { anularPendientes, enviarVerificacion } from "@/lib/verificacion";
import { origenPublico } from "@/lib/origen";

/** Reenvíos por hora y por alumno: el correo cuesta y se puede abusar. */
const REENVIOS_POR_HORA = 3;

export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`verificar:${alumno.id}`, REENVIOS_POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Ya pedimos varios correos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const [u] = await sql`
    select email, nombre, email_verificado_en from users where id = ${alumno.id}
  `;

  if (!u?.email) {
    return NextResponse.json({ error: "Tu cuenta no tiene correo" }, { status: 400 });
  }
  if (u.email_verificado_en) {
    return NextResponse.json({ ok: true, yaVerificado: true });
  }

  // Un solo enlace válido a la vez: los anteriores dejan de servir.
  await anularPendientes(alumno.id);

  const { enviado } = await enviarVerificacion({
    userId: alumno.id,
    nombre: u.nombre,
    email: u.email,
    origen: origenPublico(peticion),
  });

  return NextResponse.json({ ok: true, enviado });
}
