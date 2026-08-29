import { NextResponse } from "next/server";
import { limitar, origenDe } from "@/lib/limite";
import { pedirRecuperacion } from "@/lib/recuperacion";

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

  const { identificador } = (await peticion.json().catch(() => ({}))) as {
    identificador?: string;
  };

  if (typeof identificador === "string" && identificador.trim()) {
    await pedirRecuperacion(identificador, new URL(peticion.url).origin);
  }

  // Siempre lo mismo, exista la cuenta o no: si dijéramos "esa cuenta
  // no existe", cualquiera podría averiguar qué correos hay registrados
  // probándolos uno por uno.
  return NextResponse.json({
    ok: true,
    mensaje: "Si esa cuenta existe, te mandamos un correo con el enlace.",
  });
}
