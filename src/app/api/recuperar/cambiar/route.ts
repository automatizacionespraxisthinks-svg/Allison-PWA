import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { cuentaDeCorreo, liberarCuenta } from "@/lib/intentos";
import { limitar, origenDe } from "@/lib/limite";
import { validarContrasenaNueva } from "@/lib/perfil-reglas";
import { cambiarClave, tokenValido } from "@/lib/recuperacion";

export async function POST(peticion: Request) {
  const limite = limitar(`cambiar:${origenDe(peticion)}`, 10, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  // Un cuerpo "null" es JSON válido: sin el ?? {}, desestructurarlo
  // reventaba con un 500 (auditoría, 30 de octubre de 2026).
  const { token, password } = ((await peticion.json().catch(() => null)) ?? {}) as {
    token?: unknown;
    password?: unknown;
  };

  // Las reglas de la contraseña del registro y del perfil: de 8 a 200.
  // Sin el máximo, cualquiera hacía calcular bcrypt sobre una enorme.
  const invalida = validarContrasenaNueva(password);
  if (invalida) return NextResponse.json({ error: invalida }, { status: 400 });
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Enlace inválido" }, { status: 400 });
  }

  // El enlace se comprueba ANTES de hashear: bcrypt de costo 12 no se
  // calcula para un token inventado (auditoría, 30 de octubre de 2026).
  // cambiar_clave lo vuelve a comprobar al usarlo, así que dos usos a la
  // vez del mismo enlace siguen sin poder pasar los dos.
  if (!(await tokenValido(token))) {
    return NextResponse.json(
      { error: "Este enlace ya no sirve. Pide uno nuevo." },
      { status: 410 }
    );
  }

  const userId = await cambiarClave(token, await bcrypt.hash(String(password), 12));

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
