import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { sql } from "@/lib/db";

/**
 * Borrado de conversaciones vencidas.
 *
 * La llama n8n una vez al día. Vive en el servidor de la aplicación y
 * no en n8n porque n8n está en Europa: hacerle borrar fila por fila
 * cruzando el Atlántico sería lentísimo. Aquí es una sola sentencia.
 *
 * Se protege con un secreto compartido, no con sesión: quien la invoca
 * es una máquina, no una persona.
 */
function autorizada(peticion: Request): boolean {
  // Dos nombres para el mismo candado: TAREAS_SECRETO cuando la llama
  // n8n u otra máquina propia, CRON_SECRET cuando la llama el cron de
  // Vercel — que manda ese valor como Bearer automáticamente.
  const secretos = [process.env.TAREAS_SECRETO, process.env.CRON_SECRET].filter(
    (s): s is string => Boolean(s)
  );
  if (secretos.length === 0) return false;

  const enviado = (peticion.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!enviado) return false;

  // Se comparan los hashes para que el tiempo de comparación no
  // dependa de cuántos caracteres coincidieron.
  const a = createHash("sha256").update(enviado).digest();
  return secretos.some((s) =>
    timingSafeEqual(a, createHash("sha256").update(s).digest())
  );
}

export async function POST(peticion: Request) {
  return limpiar(peticion);
}

/** El cron de Vercel solo sabe hacer GET. Mismo trabajo, mismo candado. */
export async function GET(peticion: Request) {
  return limpiar(peticion);
}

async function limpiar(peticion: Request) {
  if (!autorizada(peticion)) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }

  const [{ borrar_conversaciones_vencidas: borradas }] =
    await sql`select borrar_conversaciones_vencidas()`;

  // Los enlaces de verificación y recuperación ya usados o vencidos
  // tampoco tienen por qué acumularse.
  const [{ count: tokens }] = await sql`
    with a as (
      delete from verificaciones_correo
       where expira_en < now() - interval '30 days' returning 1
    ), b as (
      delete from recuperaciones_clave
       where expira_en < now() - interval '30 days' returning 1
    )
    select (select count(*) from a) + (select count(*) from b) as count
  `;

  // Órdenes de pago que se abrieron y nunca se pagaron. A las 48 horas
  // son carritos abandonados: se cierran para que no ensucien los
  // reportes de pagos ni la auditoría de integridad. Si la pasarela
  // llegara a confirmar una después, el webhook la encontraría
  // rechazada y no acreditaría — correcto para una orden vencida.
  const abandonadas = await sql`
    update transacciones set estado = 'rechazada'
     where estado = 'pendiente' and creado_en < now() - interval '48 hours'
     returning id
  `;

  console.log(
    `Limpieza: ${borradas} conversaciones, ${tokens} enlaces vencidos y ` +
      `${abandonadas.length} órdenes abandonadas`
  );

  return NextResponse.json({
    ok: true,
    conversacionesBorradas: borradas,
    enlacesBorrados: Number(tokens),
    ordenesAbandonadas: abandonadas.length,
  });
}
