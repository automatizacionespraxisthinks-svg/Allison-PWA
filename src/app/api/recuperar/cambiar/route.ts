import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { cuentaDeCorreo, liberarCuenta } from "@/lib/intentos";
import { limitar, origenDe } from "@/lib/limite";
import { cambiarClave } from "@/lib/recuperacion";

export async function POST(peticion: Request) {
  const limite = limitar(`cambiar:${origenDe(peticion)}`, 10, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const { token, password } = (await peticion.json().catch(() => ({}))) as {
    token?: string;
    password?: string;
  };

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Enlace inválido" }, { status: 400 });
  }

  const userId = await cambiarClave(token, await bcrypt.hash(password, 12));

  if (!userId) {
    return NextResponse.json(
      { error: "Este enlace ya no sirve. Pide uno nuevo." },
      { status: 410 }
    );
  }

  // Quien recuperó su contraseña probó ser el dueño de la cuenta: si
  // estaba bloqueada por intentos fallidos, se libera con cualquiera de
  // las formas en que puede escribir su usuario.
  const [u] = await sql`select email, telefono, username from users where id = ${userId}`;
  for (const identificador of [u?.email, u?.telefono, u?.username]) {
    const cuenta = identificador ? cuentaDeCorreo(String(identificador)) : null;
    if (cuenta) liberarCuenta(cuenta);
  }

  return NextResponse.json({ ok: true });
}
