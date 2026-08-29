import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";

const Peticion = z.object({
  texto: z.string().trim().min(1).max(1000),
  nivel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});

/**
 * Ayuda de rescate: traducción y respuesta sugerida.
 *
 * Va aparte de la conversación y NO cuesta un mensaje. Cobrarle a un
 * alumno por no haber entendido sería castigarlo justo cuando más
 * necesita seguir.
 *
 * Tampoco entra en la ruta principal: la mayoría de turnos no la usan, y
 * meterla ahí retrasaría cada respuesta para todos.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`ayuda:${alumno.id}`, 60, 300);
  if (!limite.permitido) {
    return NextResponse.json({ error: "Espera un momento." }, { status: 429 });
  }

  const datos = Peticion.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }
  const { texto, nivel } = datos.data;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const r = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: texto }] }],
    config: {
      systemInstruction: `A Colombian student at CEFR level ${nivel} just heard
this from their English teacher and needs help. Return:

- "traduccion": what it means, in natural Colombian Spanish. Not word by
  word: what a person would actually say.
- "sugerencia": ONE thing they could reply, in English, at level ${nivel}.
  Short, true to a real conversation, and easy enough that they can say
  it out loud right now. Never a question back unless it fits naturally.
- "sugerenciaEs": what that suggestion means in Spanish, so they know
  what they are saying before they say it.`,
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
    },
  });

  const d = JSON.parse(r.text ?? "{}");

  return NextResponse.json({
    traduccion: d.traduccion ?? "",
    sugerencia: d.sugerencia ?? "",
    sugerenciaEs: d.sugerenciaEs ?? "",
  });
}
