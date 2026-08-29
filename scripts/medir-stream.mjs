/**
 * ¿Gemini entrega de verdad por partes?
 *
 * Compara tres formas de pedir lo mismo y mide cuándo llega el primer
 * trozo útil. Sin este dato, optimizar es adivinar.
 *
 *   node --env-file=.env scripts/medir-stream.mjs audio.wav
 */
import { readFileSync } from "node:fs";
import { GoogleGenAI, Type } from "@google/genai";

const ruta = process.argv[2];
if (!ruta) {
  console.error("Uso: node --env-file=.env scripts/medir-stream.mjs audio.wav");
  process.exit(1);
}

const audio = readFileSync(ruta).toString("base64");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelo = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

const parteAudio = { inlineData: { mimeType: "audio/wav", data: audio } };

async function medir(nombre, config) {
  const t0 = Date.now();
  const stream = await ai.models.generateContentStream({
    model: modelo,
    contents: [{ role: "user", parts: [parteAudio] }],
    config,
  });

  const trozos = [];
  let total = "";
  for await (const t of stream) {
    const texto = t.text ?? "";
    if (!texto) continue;
    total += texto;
    trozos.push({ seg: +((Date.now() - t0) / 1000).toFixed(2), largo: texto.length });
  }

  const primero = trozos[0];
  console.log(`\n${nombre}`);
  console.log(`  trozos recibidos:      ${trozos.length}`);
  console.log(`  primer trozo a los:    ${primero ? primero.seg : "—"} s`);
  console.log(`  último trozo a los:    ${trozos.at(-1)?.seg ?? "—"} s`);
  console.log(`  reparto:               ${trozos.slice(0, 8).map((t) => t.seg).join(", ")}${trozos.length > 8 ? " …" : ""}`);
  console.log(`  empieza así:           ${total.slice(0, 70).replace(/\n/g, " ")}`);
  return trozos;
}

const INSTRUCCION = `You are Allison, an English teacher. The student is
Colombian, level A2.`;

// 1. Como está hoy: JSON con esquema
await medir("JSON con esquema (como está hoy)", {
  systemInstruction: INSTRUCCION,
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      transcripcion: { type: Type.STRING },
      respuesta: { type: Type.STRING },
    },
    required: ["transcripcion", "respuesta"],
  },
  temperature: 0.8,
});

// 2. JSON pedido en el prompt, sin esquema
await medir("JSON pedido en el prompt, sin esquema", {
  systemInstruction: `${INSTRUCCION}
Reply with JSON only: {"transcripcion": "...", "respuesta": "..."}`,
  temperature: 0.8,
});

// 3. Texto plano con etiquetas por línea
await medir("Texto plano con etiquetas", {
  systemInstruction: `${INSTRUCCION}
Reply in exactly this format, nothing else:
DIJO: <what the student said, word for word, errors included>
ALLISON: <your reply in English>`,
  temperature: 0.8,
});
