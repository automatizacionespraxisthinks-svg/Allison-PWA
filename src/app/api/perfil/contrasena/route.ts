import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { origenPublico } from "@/lib/origen";
import { cambiarContrasena } from "@/lib/perfil";
import { validarContrasenaNueva } from "@/lib/perfil-reglas";
import { pedirRecuperacion } from "@/lib/recuperacion";
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
    porCorreo?: unknown;
  } | null;

  // Cuenta sin contraseña (entra con Google): la contraseña se crea desde
  // un enlace que llega a SU correo, no con la sesión sola. Si no, quien
  // encontrara la sesión abierta en un computador ajeno creaba una
  // contraseña, cambiaba el correo y se quedaba con la cuenta (auditoría,
  // 31 de octubre de 2026). La pantalla manda { porCorreo: true }.
  if (cuerpo?.porCorreo === true) {
    const [u] = await sql`select email, password_hash, tipo_acceso from users where id = ${alumno.id}`;
    if (!u || u.tipo_acceso !== "email") {
      return NextResponse.json({ error: "Tu PIN lo cambia el coordinador de tu colegio." }, { status: 403 });
    }
    if (u.password_hash) {
      return NextResponse.json({ error: "Tu cuenta ya tiene contraseña: cámbiala con la actual." }, { status: 400 });
    }
    if (!u.email) {
      return NextResponse.json({ error: "Tu cuenta no tiene correo. Escríbenos para ayudarte." }, { status: 400 });
    }
    await pedirRecuperacion(u.email, origenPublico(peticion));
    return NextResponse.json({ ok: true, porCorreo: true, correo: u.email });
  }

  const error = validarContrasenaNueva(cuerpo?.nueva);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const resultado = await cambiarContrasena(
    alumno.id,
    typeof cuerpo?.actual === "string" ? cuerpo.actual : undefined,
    cuerpo!.nueva as string
  );

  if (resultado === "por_correo") {
    return NextResponse.json(
      { error: "Tu cuenta entra con Google: la contraseña se crea con un enlace que te mandamos al correo." },
      { status: 400 }
    );
  }

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
