import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";
import { leerTurno, RECLAMOS_POR_DIA } from "@/lib/turno";
import { esUuid } from "@/lib/validar";

/**
 * "¿No dijiste eso?" en la conversación libre: Allison oyó mal el último
 * mensaje hablado del alumno. Se borran ese mensaje y la respuesta de
 * Allison, se deshacen los errores que ese turno anotó (eran de palabras
 * que él no dijo) y la intervención vuelve a la bolsa de la que salió.
 *
 * Lo autoriza el pase firmado que viajó con la respuesta de ese turno
 * (src/lib/turno.ts): dice qué mensaje es, de quién y de qué bolsa se
 * cobró, y vence a los diez minutos. Solo vale para el ÚLTIMO mensaje del
 * alumno en esa conversación, y unas pocas veces al día: es para un mal
 * oído, no para conversar gratis.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const cuerpo = (await peticion.json().catch(() => null)) as { pase?: unknown } | null;
  const turno = leerTurno(cuerpo?.pase, alumno.id);
  if (!turno || !esUuid(turno.mensajeId)) {
    return NextResponse.json(
      { error: "vencido", mensaje: "Ya pasó el tiempo para reclamar este mensaje." },
      { status: 400 }
    );
  }

  const limite = limitar(`no-dije-eso:${alumno.id}`, RECLAMOS_POR_DIA, 86400);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "tope", mensaje: `Solo se puede ${RECLAMOS_POR_DIA} veces al día. Si pasa seguido, prueba a escribir.` },
      { status: 429 }
    );
  }

  const restantes = await sql.begin(async (tx) => {
    const [mensaje] = await tx`
      select id, conversacion_id, creado_en, correcciones from mensajes
       where id = ${turno.mensajeId} and user_id = ${alumno.id} and rol = 'alumno'
         for update
    `;
    if (!mensaje) return null;

    // Solo el último turno: si después habló otra vez, ese ya quedó atrás.
    // Las fechas se comparan DENTRO de la base: al pasar por JavaScript
    // pierden los microsegundos y el mensaje salía "posterior" a sí mismo.
    const [posterior] = await tx`
      select 1 from mensajes
       where conversacion_id = ${mensaje.conversacion_id} and rol = 'alumno'
         and creado_en > (select creado_en from mensajes where id = ${mensaje.id})
       limit 1
    `;
    if (posterior) return null;

    // Su mensaje y lo que Allison respondió a él.
    await tx`
      delete from mensajes
       where conversacion_id = ${mensaje.conversacion_id} and user_id = ${alumno.id}
         and (id = ${mensaje.id}
              or (rol = 'allison' and creado_en >= (select creado_en from mensajes where id = ${mensaje.id})))
    `;

    // Los errores que anotó ese turno eran de lo que Allison oyó, no de lo
    // que él dijo: sin esto, un mal oído repetido terminaba en "error que
    // ya cometiste dos veces".
    const correcciones = Array.isArray(mensaje.correcciones) ? (mensaje.correcciones as { tipo?: unknown; original?: unknown }[]) : [];
    for (const c of correcciones) {
      if (typeof c?.tipo !== "string" || typeof c?.original !== "string") continue;
      const texto = c.original.trim().toLowerCase();
      await tx`
        delete from errores_frecuentes
         where user_id = ${alumno.id} and tipo = ${c.tipo} and texto_error = ${texto} and veces <= 1
      `;
      await tx`
        update errores_frecuentes set veces = veces - 1
         where user_id = ${alumno.id} and tipo = ${c.tipo} and texto_error = ${texto} and veces > 1
      `;
    }

    await tx`select devolver_mensaje(${alumno.id}, ${turno.bolsa}::bolsa_credito)`;
    const [saldo] = await tx`select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}`;
    return saldo ? (saldo.mensajes_plan as number) + (saldo.mensajes_recarga as number) : 0;
  });

  if (restantes === null) {
    return NextResponse.json(
      { error: "no_es_el_ultimo", mensaje: "Ese mensaje ya no se puede reclamar." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true, mensajesRestantes: restantes });
}
