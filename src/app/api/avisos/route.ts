import { NextResponse } from "next/server";
import { z } from "zod";
import { esServicioDeAvisos, guardarSuscripcion, llavePublicaAvisos, quitarSuscripcion, tieneSuscripcion } from "@/lib/avisos";
import { sql } from "@/lib/db";
import { alumnoActual } from "@/lib/sesion";

/**
 * Los avisos en el celular de este aparato (Perfil → Ajustes y la tarjeta
 * de Mi ruta):
 *
 *   · estado: la llave pública y si este aparato ya los tiene activados.
 *   · activar: guarda el aparato. Si el alumno no tenía hora de
 *     recordatorio, queda a las 7 de la noche (la cambia en Ajustes).
 *   · desactivar: lo borra.
 */
const Endpoint = z.string().url().max(1000);
const Pedido = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("estado"), endpoint: Endpoint.nullable() }),
  z.object({
    accion: z.literal("activar"),
    suscripcion: z.object({
      endpoint: Endpoint.refine(esServicioDeAvisos),
      keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(4).max(100) }),
    }),
  }),
  z.object({ accion: z.literal("desactivar"), endpoint: Endpoint }),
]);

export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const datos = Pedido.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  const d = datos.data;
  const llave = llavePublicaAvisos();

  if (d.accion === "estado") {
    const [u] = await sql`select to_char(recordatorio_hora, 'HH24:MI') as hora from users where id = ${alumno.id}`;
    return NextResponse.json({
      llave,
      activo: !!d.endpoint && (await tieneSuscripcion(alumno.id, d.endpoint)),
      hora: (u?.hora as string | null) ?? null,
    });
  }

  if (d.accion === "desactivar") {
    await quitarSuscripcion(alumno.id, d.endpoint);
    return NextResponse.json({ ok: true });
  }

  if (!llave) return NextResponse.json({ error: "Los avisos no están configurados" }, { status: 503 });
  await guardarSuscripcion(alumno.id, d.suscripcion);
  // Sin hora no hay recordatorio: queda a las 7 de la noche, que se cambia en Ajustes.
  const [u] = await sql`
    update users set recordatorio_hora = coalesce(recordatorio_hora, '19:00')
     where id = ${alumno.id}
    returning to_char(recordatorio_hora, 'HH24:MI') as hora
  `;
  return NextResponse.json({ ok: true, hora: u?.hora ?? "19:00" });
}
