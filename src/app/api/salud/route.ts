import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * ¿Está sana la aplicación?
 *
 * Responde DOS preguntas distintas, y separarlas importa:
 *
 *   /api/salud          ¿sigue vivo el proceso?  (lo pregunta Docker)
 *   /api/salud?base=1   ¿y la base contesta?     (lo pregunta el monitoreo)
 *
 * Por qué separadas: el chequeo del contenedor decide si Docker lo
 * REINICIA. Si ese chequeo dependiera de la base, un parpadeo de
 * Postgres — un reinicio, un respaldo, un segundo de red — tumbaría la
 * aplicación en bucle, empeorando justo lo que intenta proteger.
 * Reiniciar la app no arregla una base caída.
 *
 * El monitoreo externo sí quiere la verdad completa: una app que
 * responde pero no puede leer la base está rota para el alumno, y hay
 * que enterarse.
 *
 * No revela versiones ni detalles del error: es una ruta pública.
 */
export const dynamic = "force-dynamic";

export async function GET(peticion: Request) {
  const revisarBase = new URL(peticion.url).searchParams.has("base");
  const cabeceras = { "Cache-Control": "no-store" };

  if (!revisarBase) {
    return NextResponse.json({ ok: true }, { headers: cabeceras });
  }

  try {
    await sql`select 1`;
    return NextResponse.json({ ok: true, base: true }, { headers: cabeceras });
  } catch {
    return NextResponse.json(
      { ok: false, base: false, error: "base_no_disponible" },
      { status: 503, headers: cabeceras }
    );
  }
}
