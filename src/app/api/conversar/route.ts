import { NextResponse } from "next/server";
import { conversar } from "@/lib/allison";
import { sql } from "@/lib/db";
import { alumnoActual } from "@/lib/sesion";
import { AUDIO_MAX_SEGUNDOS } from "@/lib/tipos";

const MAX_BYTES = 8 * 1024 * 1024; // 60 s de opus caben de sobra

export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const formulario = await peticion.formData();
  const audio = formulario.get("audio");
  const duracionSeg = Number(formulario.get("duracion") ?? 0);
  let conversacionId = formulario.get("conversacion") as string | null;

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Falta el audio" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "El audio es demasiado grande" }, { status: 413 });
  }
  if (duracionSeg > AUDIO_MAX_SEGUNDOS + 5) {
    return NextResponse.json({ error: "El audio excede el máximo" }, { status: 413 });
  }

  // 1. Cobrar ANTES de llamar a Gemini. Es atómico: si dos pestañas
  //    intentan a la vez, solo una consigue el mensaje.
  const [{ consumir_mensaje: cobrado }] =
    await sql`select consumir_mensaje(${alumno.id}, null)`;

  if (!cobrado) {
    return NextResponse.json(
      { error: "sin_mensajes", mensaje: "Te quedaste sin mensajes." },
      { status: 402 }
    );
  }

  const bolsaUsada = alumno.mensajesPlan > 0 ? "plan" : "recarga";

  try {
    // 2. Historial de la conversación, para que Allison recuerde el hilo
    let historial: { rol: "alumno" | "allison"; texto: string }[] = [];

    if (conversacionId) {
      const filas = await sql`
        select rol, texto from mensajes
         where conversacion_id = ${conversacionId}
         order by creado_en asc limit 24
      `;
      historial = filas.map((f) => ({ rol: f.rol, texto: f.texto }));
    } else {
      const [nueva] = await sql`
        insert into conversaciones (user_id, modo, nivel_al_iniciar)
        values (${alumno.id}, 'libre', ${alumno.nivel})
        returning id
      `;
      conversacionId = nueva.id;
    }

    // 3. Allison escucha el audio y responde
    const buffer = Buffer.from(await audio.arrayBuffer());
    const resultado = await conversar({
      audioBase64: buffer.toString("base64"),
      mimeType: audio.type || "audio/webm",
      nivel: alumno.nivel,
      historial: historial.map((h, i) => ({
        id: String(i),
        rol: h.rol,
        texto: h.texto,
        correcciones: [],
        creadoEn: "",
      })),
    });

    // 4. Guardar los dos mensajes del turno
    const [mAlumno] = await sql`
      insert into mensajes
        (conversacion_id, user_id, rol, texto, duracion_seg, correcciones,
         tokens_entrada, tokens_salida)
      values
        (${conversacionId}, ${alumno.id}, 'alumno', ${resultado.transcripcion},
         ${duracionSeg}, ${sql.json(resultado.correcciones)},
         ${resultado.tokensEntrada}, ${resultado.tokensSalida})
      returning id, creado_en
    `;

    const [mAllison] = await sql`
      insert into mensajes (conversacion_id, user_id, rol, texto, correcciones)
      values (${conversacionId}, ${alumno.id}, 'allison', ${resultado.respuesta}, '[]'::jsonb)
      returning id, creado_en
    `;

    await sql`
      update conversaciones set ultima_actividad_en = now()
       where id = ${conversacionId}
    `;

    // Racha, resumen del día y errores frecuentes
    await sql`
      select registrar_practica(
        ${alumno.id},
        ${Math.round(duracionSeg)},
        ${resultado.correcciones.length}
      )
    `;

    for (const c of resultado.correcciones) {
      await sql`
        select registrar_error(${alumno.id}, ${c.tipo}, ${c.original}, ${c.correccion}, ${c.tema ?? "naturalidad"})
      `;
    }

    const [saldo] = await sql`
      select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}
    `;

    return NextResponse.json({
      conversacionId,
      alumno: {
        id: mAlumno.id,
        rol: "alumno",
        texto: resultado.transcripcion,
        correcciones: resultado.correcciones,
        creadoEn: mAlumno.creado_en,
        duracionSeg,
      },
      allison: {
        id: mAllison.id,
        rol: "allison",
        texto: resultado.respuesta,
        correcciones: [],
        creadoEn: mAllison.creado_en,
      },
      mensajesRestantes: saldo.mensajes_plan + saldo.mensajes_recarga,
    });
  } catch (e) {
    // 5. Si algo falló después de cobrar, se devuelve el mensaje.
    //    El alumno no paga por un turno que no recibió.
    await sql`select devolver_mensaje(${alumno.id}, ${bolsaUsada}::bolsa_credito)`;
    console.error("Fallo al conversar:", e);
    return NextResponse.json(
      { error: "fallo_ia", mensaje: "Allison no pudo responder. No te cobramos este mensaje." },
      { status: 502 }
    );
  }
}
