import { NextResponse } from "next/server";
import { limitar } from "@/lib/limite";
import { actualizarPerfil } from "@/lib/perfil";
import { validarPerfil } from "@/lib/perfil-reglas";
import { alumnoActual } from "@/lib/sesion";

/** Cambios por hora y por alumno. */
const POR_HORA = 30;

/**
 * El alumno actualiza sus datos: nombre, correo, celular, usuario y
 * nivel. Las reglas viven en src/lib/perfil-reglas.ts y son las del
 * registro; la base tiene la última palabra sobre los repetidos.
 */
export async function PATCH(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`perfil:${alumno.id}`, POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados cambios seguidos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const tipoAcceso = alumno.institucionId ? "institucional" : "email";
  const validacion = validarPerfil(await peticion.json().catch(() => null), tipoAcceso);
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.error }, { status: 400 });
  }

  const error = await actualizarPerfil(alumno.id, tipoAcceso, validacion.datos);
  if (error) return NextResponse.json({ error }, { status: 409 });

  return NextResponse.json({ ok: true, datos: validacion.datos });
}
