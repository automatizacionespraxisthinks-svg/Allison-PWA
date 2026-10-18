import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";

export const maxDuration = 30;

const Peticion = z.object({
  /** Lo que escribió el alumno: el lugar y qué quiere hacer ("comprar boletas para un concierto"). */
  pedido: z.string().trim().min(3).max(160),
});

const NIVEL_EN: Record<string, string> = {
  A1: "A1 (very simple words, present tense, short sentences)",
  A2: "A2 (simple sentences, everyday words, present and past)",
  B1: "B1 (everyday conversation, some opinions and plans)",
  B2: "B2 (natural conversation)",
  C1: "C1 (natural, fluent conversation)",
  C2: "C2 (natural, fluent conversation)",
};

/**
 * "Crea tu propio escenario" (pantalla 5): Allison arma la escena a la
 * medida del alumno, a su nivel, con su papel y 3 tareas, y queda en
 * "Míos". Usa una intervención; si la IA falla o el pedido no sirve para
 * una escena (algo que no es para el colegio), se devuelve.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const limite = limitar(`propio:${alumno.id}`, 5, 600);
  if (!limite.permitido) {
    return NextResponse.json({ error: "muy_rapido", mensaje: "Ya creaste varios. Espera un momento." }, { status: 429 });
  }
  const datos = Peticion.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Petición inválida", mensaje: "Escribe el lugar y qué quieres hacer." }, { status: 400 });
  const { pedido } = datos.data;

  const [{ consumir_mensaje: bolsa }] = await sql`select consumir_mensaje(${alumno.id}, null)`;
  if (!bolsa) {
    return NextResponse.json({ error: "sin_mensajes", mensaje: "Te quedaste sin intervenciones. Recarga para crear tu escenario." }, { status: 402 });
  }
  const devolver = () => sql`select devolver_mensaje(${alumno.id}, ${bolsa}::bolsa_credito)`.catch(() => {});

  let d: Record<string, unknown>;
  let tokens = { entrada: 0, salida: 0 };
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const r = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
      contents: [{ role: "user", parts: [{ text: pedido }] }],
      config: {
        systemInstruction: `A Colombian teenager (12-17) learning English at level ${NIVEL_EN[alumno.nivel] ?? alumno.nivel}
wants to practice a real-life situation with Allison, their English teacher.
The message is what they wrote (in Spanish or English): the place and what
they want to do. Build a short role-play scene from it.

- "sirve": false if it is not a real everyday situation a teenager could
  practice at school (violence, sex, drugs, alcohol, gambling, insults,
  politics, or nonsense). Then fill the rest with empty strings.
- "titulo": in Spanish, what the student does, starting with a verb in
  infinitive, max 6 words ("Comprar boletas para un concierto").
- "lugar": in Spanish, the place in 1-3 words ("Taquilla del estadio").
- "papel": in Spanish, Allison's role, feminine, with article, max 6 words
  ("La vendedora de boletas").
- "contexto": in Spanish, one short sentence that sets the scene for the
  student ("Llegas a la taquilla y quieres dos boletas.").
- "tareas": exactly 3 tasks for the student, in Spanish, in the order they
  happen, each one short and starting with a verb ("Pide dos boletas.").
  The last one usually closes the scene (pay, say thanks, say goodbye).
- "apertura": Allison's first line IN CHARACTER, in natural US English
  only (no Spanish), at the student's level, max 15 words, ending with a
  question that invites the first task. No stage directions.

Always US English (soccer, apartment, check, "I have").`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sirve: { type: Type.BOOLEAN },
            titulo: { type: Type.STRING },
            lugar: { type: Type.STRING },
            papel: { type: Type.STRING },
            contexto: { type: Type.STRING },
            tareas: { type: Type.ARRAY, items: { type: Type.STRING } },
            apertura: { type: Type.STRING },
          },
          required: ["sirve", "titulo", "lugar", "papel", "contexto", "tareas", "apertura"],
        },
        temperature: 0.5,
        maxOutputTokens: 800,
      },
    });
    tokens = { entrada: r.usageMetadata?.promptTokenCount ?? 0, salida: r.usageMetadata?.candidatesTokenCount ?? 0 };
    d = JSON.parse(r.text ?? "{}");
  } catch (e) {
    await devolver();
    console.error("No se pudo crear el escenario:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "fallo_ia", mensaje: "No pudimos crear el escenario. No te cobramos. Intenta otra vez." }, { status: 502 });
  }

  const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const tareas = Array.isArray(d.tareas) ? d.tareas.map((t) => texto(t, 120)).filter(Boolean).slice(0, 3) : [];
  const escena = {
    titulo: texto(d.titulo, 80),
    lugar: texto(d.lugar, 40),
    papel: texto(d.papel, 80),
    contexto: texto(d.contexto, 200),
    // Solo inglés en la línea de Allison: sin acotaciones entre paréntesis.
    apertura: texto(d.apertura, 200).replace(/\([^)]*\)/g, "").trim(),
  };
  const completa = d.sirve === true && tareas.length === 3 && Object.values(escena).every(Boolean);
  if (!completa) {
    await devolver();
    return NextResponse.json(
      {
        error: "no_sirve",
        mensaje:
          d.sirve === false
            ? "Ese no lo podemos practicar aquí. Prueba con un lugar de la vida diaria: una tienda, el cine, un restaurante…"
            : "No pudimos armar ese escenario. Escríbelo de otra forma: el lugar y qué quieres hacer.",
      },
      { status: 422 }
    );
  }

  const [nuevo] = await sql`
    insert into escenarios_propios (user_id, pedido, titulo, lugar, papel, contexto, tareas, apertura, nivel)
    values (${alumno.id}, ${pedido}, ${escena.titulo}, ${escena.lugar}, ${escena.papel}, ${escena.contexto},
            ${sql.json(tareas)}, ${escena.apertura}, ${alumno.nivel})
    returning id
  `;

  try {
    await sql`select registrar_uso(${alumno.id}, 'conversar', ${tokens.entrada}, ${tokens.salida}, 0, true, false)`;
    await sql`select registrar_parte(${alumno.id}, 'escenarios')`;
  } catch (e) {
    console.error("No se pudo anotar el escenario propio:", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ clave: `propio:${nuevo.id}` });
}
