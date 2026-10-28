import { NextResponse } from "next/server";
import { z } from "zod";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";
import { ErrorTts, sintetizar, vozPedida } from "@/lib/tts";

const Id = z.string().uuid();

/**
 * Segundo paso: el audio, tal como lo va generando la API de voz.
 *
 * El navegador abre esta dirección en un <audio> y empieza a sonar en
 * cuanto llegan los primeros bytes. No se guarda nada en disco ni se
 * espera a que termine: lo que entra de la API sale hacia el alumno.
 *
 * Si la API falla, se responde con un JSON de error: el <audio> lo
 * toma como fallo de carga y el reproductor cae a la voz del
 * dispositivo. El motivo y el X-Request-ID quedan en el log.
 */
export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  // El navegador abre cada audio una o dos veces; más que eso es alguien
  // repitiendo la misma voz y ocupando los dos turnos que tiene la API para todos.
  if (!limitar(`voz-audio:${alumno.id}`, 150, 300).permitido) {
    return NextResponse.json({ error: "Espera un momento" }, { status: 429 });
  }

  const id = Id.safeParse((await params).id);
  const pedido = id.success ? vozPedida(id.data, alumno.id) : null;
  if (!pedido) {
    return NextResponse.json({ error: "Esa voz ya no está disponible" }, { status: 404 });
  }

  try {
    // Si el alumno toca otro audio, el navegador corta esta descarga y
    // request.signal avisa: lo que esperaba turno lo suelta para el nuevo.
    const audio = await sintetizar({
      texto: pedido.texto,
      idioma: pedido.idioma,
      velocidad: pedido.velocidad,
      cancelar: peticion.signal,
    });
    return new Response(audio.cuerpo, {
      headers: {
        "Content-Type": audio.tipo,
        "Cache-Control": "no-store",
        "Accept-Ranges": "none",
        "X-Request-ID": audio.idPeticion,
        "X-Cache": audio.cache ?? "-",
        // Que ningún proxy acumule el audio: lo que importa es que
        // empiece a sonar cuanto antes.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    // Nadie va a leer la respuesta: no es un fallo de la voz.
    if (e instanceof ErrorTts && e.codigo === "cancelado") {
      return new Response(null, { status: e.estado, headers: { "Cache-Control": "no-store" } });
    }
    if (e instanceof ErrorTts) {
      console.warn(`Voz no disponible (${e.codigo}, HTTP ${e.estado}): ${e.message}`);
      return NextResponse.json(
        { error: e.codigo, reintentable: e.reintentable },
        { status: e.estado, headers: { "Cache-Control": "no-store" } }
      );
    }
    console.error("Fallo inesperado al pedir la voz:", e);
    return NextResponse.json({ error: "fallo_voz" }, { status: 502 });
  }
}
