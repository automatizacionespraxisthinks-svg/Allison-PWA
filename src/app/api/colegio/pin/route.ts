import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { alumnoPertenece } from "@/lib/colegio";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";

/** Reinicios de PIN por hora y por coordinador. */
const REINICIOS_POR_HORA = 40;

/**
 * Reinicia el PIN de un alumno.
 *
 * El PIN nuevo se devuelve UNA sola vez, para que el coordinador se lo
 * dé al alumno. No se guarda en claro en ninguna parte: en la base solo
 * queda el hash, igual que una contraseña.
 */
export async function POST(peticion: Request) {
  const usuario = await alumnoActual();
  if (!usuario) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }
  if (usuario.rol !== "coordinador" && usuario.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!usuario.institucionId) {
    return NextResponse.json({ error: "Sin colegio asignado" }, { status: 403 });
  }

  const limite = limitar(`pin:${usuario.id}`, REINICIOS_POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados reinicios seguidos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const { alumnoId } = (await peticion.json()) as { alumnoId?: string };
  if (!alumnoId) {
    return NextResponse.json({ error: "Falta el alumno" }, { status: 400 });
  }

  // El alumno tiene que ser de SU colegio. Sin esto, un coordinador
  // podría reiniciarle el PIN a un alumno de otra institución.
  if (!(await alumnoPertenece(alumnoId, usuario.institucionId))) {
    return NextResponse.json({ error: "Ese alumno no es de tu colegio" }, { status: 404 });
  }

  const pin = String(randomInt(0, 10_000)).padStart(4, "0");

  await sql`
    update users set pin_hash = ${await bcrypt.hash(pin, 12)}, actualizado_en = now()
     where id = ${alumnoId}
  `;

  return NextResponse.json({ ok: true, pin });
}
