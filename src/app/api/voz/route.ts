import { NextResponse } from "next/server";
import { limpiarParaVoz } from "@/lib/habla";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";
import { registrarVoz, ttsConfigurado, validarTextoVoz } from "@/lib/tts";

/**
 * Peticiones de voz por alumno cada cinco minutos. Una conversación
 * real pide una por turno, más las repeticiones y las palabras del
 * glosario; esto deja margen y frena a un script.
 */
const POR_CINCO_MINUTOS = 60;

/**
 * Primer paso para oír algo con la voz de Allison: registrar el texto.
 *
 * Responde con la dirección que el <audio> del navegador tiene que
 * abrir (src/lib/tts.ts explica por qué en dos pasos). Si la voz no
 * está configurada responde 503: el navegador cae a la voz del
 * dispositivo y lo deja dicho en su consola.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  if (!ttsConfigurado()) {
    return NextResponse.json({ error: "voz_no_configurada" }, { status: 503 });
  }

  const limite = limitar(`voz:${alumno.id}`, POR_CINCO_MINUTOS, 300);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiadas voces seguidas. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    texto?: unknown;
    idioma?: unknown;
  } | null;

  const texto = limpiarParaVoz(cuerpo?.texto);
  const error = validarTextoVoz(texto);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const idioma = cuerpo?.idioma === "es" || cuerpo?.idioma === "en" ? cuerpo.idioma : "auto";
  const id = registrarVoz({ userId: alumno.id, texto, idioma });

  return NextResponse.json({ ok: true, url: `/api/voz/${id}` });
}
