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
  const secreto = process.env.TAREAS_SECRETO ?? "";
  if (!secreto) return false;

  const enviado = (peticion.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!enviado) return false;

  // Se comparan los hashes para que el tiempo de comparación no
  // dependa de cuántos caracteres coincidieron.
  const a = createHash("sha256").update(enviado).digest();
  const b = createHash("sha256").update(secreto).digest();
  return timingSafeEqual(a, b);
}

export async function POST(peticion: Request) {
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

  console.log(
    `Limpieza: ${borradas} conversaciones y ${tokens} enlaces vencidos eliminados`
  );

  return NextResponse.json({
    ok: true,
    conversacionesBorradas: borradas,
    enlacesBorrados: Number(tokens),
  });
}
