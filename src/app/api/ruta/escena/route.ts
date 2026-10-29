import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { CUERPO_MUY_GRANDE, cuerpoExcede, limitar } from "@/lib/limite";
import { iniciarEscena, pedirAyuda, terminarEscenario, turnoDeEscena } from "@/lib/ruta/conversacion";
import { alumnoActual } from "@/lib/sesion";
import { AUDIO_MAX_SEGUNDOS } from "@/lib/tipos";

export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;

const ESTADOS: Record<string, number> = { no_existe: 404, bloqueada: 409, salto_hoy: 409, terminada: 409, ocupada: 409, desactualizada: 409 };

/** Lo que ve el alumno en los errores que no son suyos (la pantalla muestra "mensaje"). */
const MENSAJES: Record<string, string> = {
  ocupada: "Tu mensaje se cruzó con otro. No te cobramos: inténtalo otra vez.",
  desactualizada: "Esta escena se actualizó. Sal y vuelve a empezarla; no te cobramos.",
};
const error = (e: string) => NextResponse.json({ error: e, mensaje: MENSAJES[e] }, { status: ESTADOS[e] ?? 400 });

/**
 * Las conversaciones de la ruta: el escenario de cierre de cada parada,
 * la Entrevista a Allison y Adivina. Una sola ruta con cuatro acciones:
 *
 *   · inicio: abre el intento y trae la primera línea de Allison. Gratis.
 *   · turno: lo que dice el alumno. Una intervención: se devuelve si algo
 *     falla (la IA, un choque con otra acción); si no se oyó nada, se
 *     cobra (la IA ya trabajó) pero no cuenta como intento.
 *   · ayuda: la frase sugerida de la tarea actual. Gratis, apaga una
 *     estrella solo si hay algo que mostrar (o con "sugerida").
 *   · fin: cierra el escenario y entrega estrellas y estampilla.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (cuerpoExcede(peticion, MAX_BYTES + 64 * 1024)) return NextResponse.json(CUERPO_MUY_GRANDE, { status: 413 });

  const f = await peticion.formData().catch(() => null);
  if (!f) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  const accion = String(f.get("accion") ?? "");
  const conversacion = String(f.get("conversacion") ?? "");

  if (accion === "inicio") {
    const pedida = String(f.get("actividad") ?? "");
    const actividad = (["entrevista", "adivina", "ensenale", "viaje", "catalogo"] as const).find((a) => a === pedida) ?? "escenario";
    const r = await iniciarEscena(alumno.id, alumno.nivel, {
      parada: String(f.get("parada") ?? ""),
      actividad,
      leccion: Number(f.get("leccion")) || undefined,
      paso: Number(f.get("paso")) || undefined,
      salto: f.get("salto") === "1",
      viaje: Number(f.get("viaje")) || undefined,
      clave: String(f.get("clave") ?? "").slice(0, 60) || undefined,
    });
    if (!r.ok) return error(r.error);
    return NextResponse.json(r);
  }

  if (accion === "ayuda") {
    // "sugerida": la pantalla ya trajo la frase de /api/ayuda (viajes y
    // escenarios propios sin idea) y la va a mostrar: ahora se cobra.
    const r = await pedirAyuda(alumno.id, conversacion, { sugerida: f.get("sugerida") === "1" });
    if (!r.ok) return error(r.error);
    return NextResponse.json(r);
  }

  if (accion === "fin") {
    const r = await terminarEscenario(alumno.id, alumno.nivel, conversacion);
    if (!r.ok) return error(r.error);
    return NextResponse.json(r.fin);
  }

  if (accion !== "turno") return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });

  const limite = limitar(`escena:${alumno.id}`, 20, 60);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "muy_rapido", mensaje: "Vas muy rápido. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const audio = f.get("audio");
  const textoCrudo = f.get("texto");
  const texto = typeof textoCrudo === "string" ? textoCrudo.trim().slice(0, 400) : "";
  // La duración la manda el navegador: se acota antes de usarla. Un valor
  // raro (NaN, negativo, enorme) hacía fallar el registro DESPUÉS de que
  // Allison respondía, y el turno se devolvía: la escena salía gratis.
  const crudo = Number(f.get("duracion") ?? 0);
  const duracion = texto ? 0 : Number.isFinite(crudo) ? Math.max(0, Math.min(AUDIO_MAX_SEGUNDOS + 5, crudo)) : 0;
  if (!texto) {
    if (!(audio instanceof Blob)) return NextResponse.json({ error: "Falta el audio" }, { status: 400 });
    if (audio.size > MAX_BYTES || crudo > AUDIO_MAX_SEGUNDOS + 5) {
      return NextResponse.json({ error: "El audio es demasiado largo" }, { status: 413 });
    }
  }

  const [{ consumir_mensaje: bolsa }] = await sql`select consumir_mensaje(${alumno.id}, null)`;
  if (!bolsa) {
    return NextResponse.json({ error: "sin_mensajes", mensaje: "Te quedaste sin intervenciones." }, { status: 402 });
  }
  const devolver = () => sql`select devolver_mensaje(${alumno.id}, ${bolsa}::bolsa_credito)`;

  // Hasta que Allison responde, cualquier falla devuelve la intervención.
  let r: Awaited<ReturnType<typeof turnoDeEscena>>;
  try {
    r = await turnoDeEscena(alumno.id, alumno.nombre, conversacion, {
      ...(texto
        ? { texto }
        : {
            audioBase64: Buffer.from(await (audio as Blob).arrayBuffer()).toString("base64"),
            mimeType: (audio as Blob).type || "audio/webm",
          }),
    });
  } catch (e) {
    await devolver().catch(() => {});
    console.error("Fallo en la escena:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "fallo_ia", mensaje: "Allison no pudo responder. No te cobramos esta intervención." },
      { status: 502 }
    );
  }
  if (!r.ok) {
    await devolver();
    return error(r.error);
  }
  // La IA no dio una respuesta que sirva: es falla nuestra, no se cobra.
  if (r.r.sinRespuesta) {
    await devolver();
    return NextResponse.json(
      { error: "fallo_ia", mensaje: "Allison no pudo responder. No te cobramos esta intervención." },
      { status: 502 }
    );
  }

  // Desde aquí Allison ya respondió: un error al anotar se registra en el
  // log, pero no se devuelve el turno.
  try {
    const parte = r.r.estado.actividad === "escenario" ? "escenario" : r.r.estado.actividad === "viaje" ? "viajes" : r.r.estado.actividad === "catalogo" ? "escenarios" : "ruta";
    await sql`
      select registrar_uso(${alumno.id}, 'conversar', ${r.r.tokensEntrada}, ${r.r.tokensSalida},
                           ${Math.round(duracion)}, true, false)
    `;
    await sql`select registrar_parte(${alumno.id}, ${parte})`;
    // El gasto de la parada (ficha del alumno): lo que no se oyó se fue en errores.
    if (r.r.estado.parada) await sql`select registrar_consumo_parada(${alumno.id}, ${r.r.estado.parada}, ${!!r.r.sinVoz})`;
    if (!r.r.sinVoz) {
      // Conversar cuenta para la racha el mismo día; el tiempo, para la meta.
      await sql`select marcar_dia_de_racha(${alumno.id})`;
      await sql`select registrar_tiempo_ruta(${alumno.id}, ${Math.round(duracion) + 20})`;
    }
  } catch (e) {
    console.error("No se pudo anotar el turno de la escena:", e instanceof Error ? e.message : e);
  }

  const [saldo] = await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}`;
  return NextResponse.json({ ...r.r, restantes: (saldo?.mensajes_plan ?? 0) + (saldo?.mensajes_recarga ?? 0) });
}
