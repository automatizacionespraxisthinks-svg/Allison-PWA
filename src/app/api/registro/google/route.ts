import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  COOKIE_CONSENTIMIENTO,
  firmarConsentimiento,
  googleConfigurado,
  opcionesCookieConsentimiento,
  secretoDeFirma,
  VIGENCIA_CONSENTIMIENTO_SEG,
} from "@/lib/google";
import { limitar, origenDe } from "@/lib/limite";

/**
 * El paso previo a "Continuar con Google" en /registro.
 *
 * No crea nada: toma las casillas marcadas y el nivel elegido, y los
 * deja en una cookie firmada que el regreso de Google exige para crear
 * la cuenta (src/lib/entrada-google.ts). Las mismas reglas que el
 * registro normal: las dos autorizaciones tienen que venir en true, no
 * vale la ausencia del campo ni una casilla marcada de antemano.
 */
const Consentimiento = z.object({
  nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  aceptaLegal: z.literal(true, {
    error: "Debes aceptar los términos y la política de datos",
  }),
  declaraEdad: z.literal(true, {
    error: "Debes confirmar que eres mayor de edad o que tu acudiente autoriza",
  }),
});

/** Por IP y por hora. No cuesta nada, pero tampoco hay por qué dejar que lo martillen. */
const POR_HORA = 30;

export async function POST(peticion: Request) {
  if (!googleConfigurado()) {
    return NextResponse.json(
      { error: "Entrar con Google no está disponible por ahora." },
      { status: 404 }
    );
  }

  const limite = limitar(`consentimiento:${origenDe(peticion)}`, POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const datos = Consentimiento.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json(
      { error: datos.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  (await cookies()).set(
    COOKIE_CONSENTIMIENTO,
    firmarConsentimiento({ nivel: datos.data.nivel }, secretoDeFirma()),
    opcionesCookieConsentimiento()
  );

  return NextResponse.json({ ok: true, vigenciaSeg: VIGENCIA_CONSENTIMIENTO_SEG });
}
