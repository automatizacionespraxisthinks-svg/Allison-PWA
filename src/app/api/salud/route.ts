import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * ¿Está viva la aplicación?
 *
 * La usa el healthcheck del contenedor y Dokploy para decidir si un
 * despliegue quedó sano o hay que reiniciarlo.
 *
 * Comprueba la BASE, no solo que el proceso responda: una app que
 * contesta 200 pero no puede leer la base está rota para el alumno, y
 * un healthcheck que la da por sana esconde la avería justo cuando hay
 * que verla.
 *
 * No revela versiones ni detalles del error: es una ruta pública.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sql`select 1`;
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "base_no_disponible" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
