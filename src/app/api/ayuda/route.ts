import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";

/** Tope de la ruta: una traducción tarda 2-5 s; 30 da margen. */
export const maxDuration = 30;

const Peticion = z.object({
  texto: z.string().trim().min(1).max(1000),
  nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  /** Viajes y Escenarios: la tarea de la misión que tiene que cumplir ahora (en español). */
  tarea: z.string().trim().max(200).optional(),
});

/**
 * Ayuda de rescate: traducción y respuesta sugerida.
 *
 * Cuesta una intervención: todo lo que usa la IA cuesta, porque sus
 * tokens se pagan (decisión del usuario, 29 de octubre de 2026). Antes
 * era gratis, "para no castigar a quien no entendió". Una sola llamada
 * trae la traducción y la idea: la pantalla guarda las dos, así que
 * traducir y pedir la idea del mismo mensaje cobra una vez. Si la IA
 * falla, se devuelve.
 *
 * No entra en la ruta principal: la mayoría de turnos no la usan, y
 * meterla ahí retrasaría cada respuesta para todos.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  // Dos topes: el de ráfaga y uno por día que ningún alumno de verdad
  // alcanza (unas 300 ayudas es más de lo que se conversa en un día entero).
  const limite = limitar(`ayuda:${alumno.id}`, 60, 300);
  const porDia = limitar(`ayuda-dia:${alumno.id}`, 300, 86400);
  if (!limite.permitido || !porDia.permitido) {
    return NextResponse.json({ error: "Espera un momento." }, { status: 429 });
  }

  const datos = Peticion.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }
  const { texto, nivel, tarea } = datos.data;

  const [{ consumir_mensaje: bolsa }] = await sql`select consumir_mensaje(${alumno.id}, null)`;
  if (!bolsa) {
    return NextResponse.json({ error: "sin_mensajes", mensaje: "Te quedaste sin intervenciones." }, { status: 402 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Una llamada colgada o un JSON roto no puede tumbar la ruta (antes daba
  // un 500 sin mensaje): se responde un error que la pantalla sabe mostrar,
  // y la intervención se devuelve.
  const fallo = async () => {
    await sql`select devolver_mensaje(${alumno.id}, ${bolsa}::bolsa_credito)`.catch(() => {});
    return NextResponse.json({ error: "fallo_ia", mensaje: "No pudimos traer la ayuda. No te cobramos. Intenta otra vez." }, { status: 502 });
  };
  const instruccion = `A Colombian student at CEFR level ${nivel} just heard
this from their English teacher and needs help. Return:

- "traduccion": what it means, in natural Colombian Spanish. Not word by
  word: what a person would actually say.
- "sugerencia": ONE thing they could reply, in English, at level ${nivel}.
  Short, true to a real conversation, and easy enough that they can say
  it out loud right now. Never a question back unless it fits naturally.${
    tarea
      ? `
  IMPORTANT: their task right now is "${tarea}" (in Spanish). The
  suggestion MUST do exactly that task, even if the teacher was talking
  about something else: it may start with a two-word reaction, then do
  the task. If the task is to ask about something, the suggestion IS that
  question. Example: task "Pide un café" → "Nice! Can I have a coffee,
  please?". Always natural US English.`
      : ""
  }
- "sugerenciaEs": what that suggestion means in Spanish, so they know
  what they are saying before they say it.`;

  let r: Awaited<ReturnType<typeof ai.models.generateContent>>;
  try {
    r = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
      contents: [{ role: "user", parts: [{ text: texto }] }],
      config: {
        systemInstruction: instruccion,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            traduccion: { type: Type.STRING },
            sugerencia: { type: Type.STRING },
            sugerenciaEs: { type: Type.STRING },
          },
          required: ["traduccion", "sugerencia", "sugerenciaEs"],
        },
        temperature: 0.4,
        // Una traducción y una frase: con esto sobra, y nadie puede pedirle textos largos gratis.
        maxOutputTokens: 600,
        abortSignal: AbortSignal.timeout(15_000),
      },
    });
  } catch (e) {
    console.error("Fallo en la ayuda:", e instanceof Error ? e.message : e);
    return fallo();
  }

  let d: { traduccion?: string; sugerencia?: string; sugerenciaEs?: string };
  try {
    d = JSON.parse(r.text ?? "");
  } catch {
    return fallo();
  }

  /**
   * Se anota aparte de la conversación ('ayuda') para saber cuánto pesan
   * de verdad las traducciones y las ideas. No se espera (`void`): si la
   * anotación falla, la traducción se entrega igual.
   */
  void sql`
    select registrar_uso(
      ${alumno.id}, 'ayuda',
      ${r.usageMetadata?.promptTokenCount ?? 0},
      ${r.usageMetadata?.candidatesTokenCount ?? 0},
      0, true, false
    )
  `.catch(() => {});

  // El contador de la pantalla baja con lo que se cobró.
  const [saldo] = await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}`.catch(() => []);
  return NextResponse.json({
    traduccion: d.traduccion ?? "",
    sugerencia: d.sugerencia ?? "",
    sugerenciaEs: d.sugerenciaEs ?? "",
    ...(saldo ? { restantes: saldo.mensajes_plan + saldo.mensajes_recarga } : {}),
  });
}
