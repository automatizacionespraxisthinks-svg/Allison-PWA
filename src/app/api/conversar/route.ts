import { NextResponse } from "next/server";
import { conversarEnStream } from "@/lib/allison";
import { conversacionActiva } from "@/lib/conversaciones";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { temasDe } from "@/lib/progreso";
import { alumnoActual } from "@/lib/sesion";
import { AUDIO_MAX_SEGUNDOS } from "@/lib/tipos";

const MAX_BYTES = 8 * 1024 * 1024; // 60 s de opus caben de sobra

/**
 * Turnos por minuto y por alumno. Una conversación real ronda uno cada
 * 45 segundos; 20 deja margen de sobra a quien hable rápido y corta en
 * seco a un script.
 */
const TURNOS_POR_MINUTO = 20;

/**
 * La conversación, enviada POR PARTES.
 *
 * El alumno ve lo que él mismo dijo alrededor de un segundo después de
 * soltar el botón, y Allison empieza a hablar en cuanto su respuesta
 * está completa — sin esperar a que terminen de generarse unas
 * correcciones que va a leer después, si es que las lee.
 *
 * Cada parte viaja como una línea de JSON. Es más simple que los eventos
 * del servidor y basta para esto.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`conversar:${alumno.id}`, TURNOS_POR_MINUTO, 60);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "muy_rapido", mensaje: "Vas muy rápido. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  // Un cuerpo mal formado no debe reventar la ruta con un 500.
  const formulario = await peticion.formData().catch(() => null);
  if (!formulario) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const audio = formulario.get("audio");
  const duracionSeg = Number(formulario.get("duracion") ?? 0);
  const conversacionPedida = formulario.get("conversacion") as string | null;

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Falta el audio" }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "El audio es demasiado grande" }, { status: 413 });
  }
  if (duracionSeg > AUDIO_MAX_SEGUNDOS + 5) {
    return NextResponse.json({ error: "El audio excede el máximo" }, { status: 413 });
  }

  // Cobrar ANTES de llamar a Gemini. Es atómico: si dos pestañas
  // intentan a la vez, solo una consigue el mensaje. La base devuelve de
  // qué bolsa cobró, que no se puede deducir del saldo leído antes.
  const [{ consumir_mensaje: bolsaUsada }] =
    await sql`select consumir_mensaje(${alumno.id}, null)`;

  if (!bolsaUsada) {
    return NextResponse.json(
      { error: "sin_mensajes", mensaje: "Te quedaste sin mensajes." },
      { status: 402 }
    );
  }

  const devolver = () =>
    sql`select devolver_mensaje(${alumno.id}, ${bolsaUsada}::bolsa_credito)`;

  const conversacionId =
    conversacionPedida ?? (await conversacionActiva(alumno.id, alumno.nivel));

  // El audio se lee mientras la base contesta, no después
  const buffer = Buffer.from(await audio.arrayBuffer());
  const codificador = new TextEncoder();

  const flujo = new ReadableStream({
    async start(control) {
      const enviar = (dato: unknown) =>
        control.enqueue(codificador.encode(JSON.stringify(dato) + "\n"));

      try {
        // Las dos consultas no dependen entre sí: van juntas. Cada viaje
        // a la base en Ohio son ~90 ms que el alumno espera mirando la
        // pantalla, y en fila india se suman.
        const [filas, temas] = await Promise.all([
          sql`
            select rol, texto from mensajes
             where conversacion_id = ${conversacionId}
             order by creado_en desc limit 24
          `,
          temasDe(alumno.id),
        ]);

        const historial = filas.reverse().map((f, i) => ({
          id: String(i),
          rol: f.rol as "alumno" | "allison",
          texto: f.texto as string,
          correcciones: [],
          creadoEn: "",
        }));

        const partes = conversarEnStream({
          audioBase64: buffer.toString("base64"),
          mimeType: audio.type || "audio/webm",
          alumno: {
            nombre: alumno.nombre,
            nivel: alumno.nivel,
            temasAbiertos: temas.abiertos,
            temasDominados: temas.dominados,
          },
          historial,
        });

        let resultado = null;

        for await (const parte of partes) {
          if (parte.tipo === "fin") {
            resultado = parte.resultado;
          } else {
            enviar(parte);
          }
        }

        if (!resultado || !resultado.transcripcion.trim()) {
          // No se entendió nada: no se cobra.
          await devolver();
          enviar({
            tipo: "error",
            error: "sin_audio",
            mensaje: "No te escuchamos. Revisa el micrófono e intenta otra vez.",
          });
          control.close();
          return;
        }

        const [mAlumno] = await sql`
          insert into mensajes
            (conversacion_id, user_id, rol, texto, duracion_seg, correcciones,
             tokens_entrada, tokens_salida)
          values
            (${conversacionId}, ${alumno.id}, 'alumno', ${resultado.transcripcion},
             ${duracionSeg}, ${sql.json(resultado.correcciones as unknown as never)},
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

        await sql`
          select registrar_practica(
            ${alumno.id}, ${Math.round(duracionSeg)}, ${resultado.correcciones.length}
          )
        `;

        for (const c of resultado.correcciones) {
          await sql`
            select registrar_error(${alumno.id}, ${c.tipo}, ${c.original},
                                   ${c.correccion}, ${c.tema ?? "naturalidad"})
          `;
        }

        const [saldo] = await sql`
          select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}
        `;

        enviar({
          tipo: "fin",
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
        // Si algo falló después de cobrar, se devuelve el mensaje.
        await devolver().catch(() => {});
        console.error("Fallo al conversar:", e);
        enviar({
          tipo: "error",
          error: "fallo_ia",
          mensaje: "Allison no pudo responder. No te cobramos este mensaje.",
        });
      } finally {
        control.close();
      }
    },
  });

  return new Response(flujo, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Evita que un proxy intermedio acumule la respuesta y anule el
      // envío por partes, que es justo lo que da la sensación de rapidez.
      "X-Accel-Buffering": "no",
    },
  });
}
