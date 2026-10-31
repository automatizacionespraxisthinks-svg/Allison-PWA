import { NextResponse } from "next/server";
import { limitar, origenDe } from "@/lib/limite";
import { pedirRecuperacion } from "@/lib/recuperacion";
import { origenPublico } from "@/lib/origen";

/** Solicitudes por hora desde una misma IP. */
const POR_HORA = 5;

export async function POST(peticion: Request) {
  const limite = limitar(`recuperar:${origenDe(peticion)}`, POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  // Un cuerpo "null" es JSON válido: sin el ?? {}, desestructurarlo
  // reventaba con un 500 (auditoría, 30 de octubre de 2026).
  const { identificador } = ((await peticion.json().catch(() => null)) ?? {}) as {
    identificador?: unknown;
  };

  if (typeof identificador === "string" && identificador.trim()) {
    await pedirRecuperacion(identificador, origenPublico(peticion));
  }

  // Siempre lo mismo, exista la cuenta o no: si dijéramos "esa cuenta
  // no existe", cualquiera podría averiguar qué correos hay registrados
  // probándolos uno por uno.
  return NextResponse.json({
    ok: true,
    mensaje: "Si esa cuenta existe, te mandamos un correo con el enlace.",
  });
}
