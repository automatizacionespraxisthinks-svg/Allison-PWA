import { NextResponse } from "next/server";
import { limitar } from "@/lib/limite";
import { cambiarContrasena } from "@/lib/perfil";
import { validarContrasenaNueva } from "@/lib/perfil-reglas";
import { alumnoActual } from "@/lib/sesion";

/**
 * Intentos por hora y por alumno. Corto a propósito: la contraseña
 * actual se pide precisamente para que una sesión abierta en un
 * computador ajeno no pueda adueñarse de la cuenta, y sin este freno
 * podría adivinarla probando.
 */
const POR_HORA = 10;

export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`contrasena:${alumno.id}`, POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    actual?: unknown;
    nueva?: unknown;
  } | null;

  const error = validarContrasenaNueva(cuerpo?.nueva);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const resultado = await cambiarContrasena(
    alumno.id,
    typeof cuerpo?.actual === "string" ? cuerpo.actual : undefined,
    cuerpo!.nueva as string
  );

  if (resultado === "no_aplica") {
    return NextResponse.json(
      { error: "Tu PIN lo cambia el coordinador de tu colegio." },
      { status: 403 }
    );
  }
  if (resultado === "actual_incorrecta") {
    return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
