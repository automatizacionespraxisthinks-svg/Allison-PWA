import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { firmarComoPasarela, pasarela } from "@/lib/pasarela";
import { alumnoActual } from "@/lib/sesion";

/**
 * Simula el aviso de la pasarela. SOLO existe en modo simulado.
 *
 * No acredita nada por su cuenta: arma el mismo cuerpo que enviaría la
 * pasarela, lo firma y lo manda al webhook de verdad. Así lo que se
 * prueba es el camino real, incluida la verificación de firma.
 */
export async function POST(peticion: Request) {
  const via = pasarela();
  if (!via.simulada) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const { transaccionId, aprobar } = (await peticion.json()) as {
    transaccionId?: string;
    aprobar?: boolean;
  };

  // La transacción tiene que ser de quien la está pagando
  const [t] = await sql`
    select referencia_externa from transacciones
     where id = ${transaccionId ?? ""} and user_id = ${alumno.id}
     limit 1
  `;
  if (!t) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  const cuerpo = JSON.stringify({
    referencia: t.referencia_externa,
    estado: aprobar ? "APPROVED" : "DECLINED",
  });

  const url = new URL("/api/pagos/webhook", peticion.url);
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-firma": firmarComoPasarela(cuerpo) },
    body: cuerpo,
  });

  return NextResponse.json(await respuesta.json(), { status: respuesta.status });
}
