import { NextResponse } from "next/server";
import { intentosAgotados, limitar, sumarFallo } from "@/lib/limite";
import { actualizarPerfil } from "@/lib/perfil";
import { validarPerfil } from "@/lib/perfil-reglas";
import { alumnoActual } from "@/lib/sesion";

/** Cambios por hora y por alumno. */
const POR_HORA = 30;

/**
 * Contraseñas equivocadas por hora al cambiar el correo. Es el mismo cubo
 * que /api/perfil/contrasena (10 por hora): entre las dos rutas, una
 * sesión ajena no prueba más contraseñas que eso.
 */
const CLAVES_POR_HORA = 10;

/**
 * El alumno actualiza sus datos: nombre, correo, celular y usuario. Las
 * reglas viven en src/lib/perfil-reglas.ts y son las del registro; la
 * base tiene la última palabra sobre los repetidos. Cambiar el correo
 * pide la contraseña actual (`contrasenaActual`, src/lib/perfil.ts).
 *
 * El nivel no se cambia aquí: solo por /api/nivel (el selector de
 * Ajustes), con su regla. Lo que llegue en "nivel" se ignora: una
 * pantalla abierta desde antes mandaba el nivel viejo y lo bajaba
 * (auditoría, 30 de octubre de 2026).
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
  const cuerpo = ((await peticion.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  // validarPerfil pide un nivel válido: va el que el alumno ya tiene, y
  // actualizarPerfil no lo escribe.
  const validacion = validarPerfil({ ...cuerpo, nivel: alumno.nivel }, tipoAcceso);
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.error }, { status: 400 });
  }

  const cubo = `contrasena:${alumno.id}`;
  const contrasenaActual = typeof cuerpo.contrasenaActual === "string" ? cuerpo.contrasenaActual : undefined;
  if (contrasenaActual && intentosAgotados(cubo, CLAVES_POR_HORA)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
  }

  const r = await actualizarPerfil(alumno.id, tipoAcceso, validacion.datos, contrasenaActual);
  if (!r.ok) {
    if (r.motivo === "actual_incorrecta") sumarFallo(cubo, 3600);
    const status = r.motivo === "repetido" ? 409 : r.motivo === "solo_google" ? 403 : 400;
    return NextResponse.json({ error: r.error, motivo: r.motivo }, { status });
  }

  return NextResponse.json({ ok: true, datos: validacion.datos });
}
