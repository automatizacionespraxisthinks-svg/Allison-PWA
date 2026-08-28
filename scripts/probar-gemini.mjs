/**
 * Prueba real de Allison contra Gemini.
 *
 * Le manda un audio con una frase que tiene un error de gramática y
 * verifica que: oye el audio, transcribe SIN corregir, responde como
 * profesora, y detecta el error.
 *
 *   node --env-file=.env scripts/probar-gemini.mjs [ruta-audio.wav] [modelo]
 */
import { readFileSync } from "node:fs";
import { conversar } from "../src/lib/allison.ts";

const ruta = process.argv[2];
const modelo = process.argv[3];
if (modelo) process.env.GEMINI_MODEL = modelo;

if (!ruta) {
  console.error("Uso: node --env-file=.env scripts/probar-gemini.mjs audio.wav [modelo]");
  process.exit(1);
}

const audio = readFileSync(ruta);
const mimeType = ruta.endsWith(".wav") ? "audio/wav" : "audio/webm";

console.log(`Modelo:  ${process.env.GEMINI_MODEL}`);
console.log(`Audio:   ${ruta} (${(audio.length / 1024).toFixed(1)} KB)\n`);

const inicio = Date.now();
try {
  const r = await conversar({
    audioBase64: audio.toString("base64"),
    mimeType,
    nivel: "A2",
  });
  const seg = ((Date.now() - inicio) / 1000).toFixed(1);

  console.log(`El alumno dijo:  "${r.transcripcion}"`);
  console.log(`Allison responde: "${r.respuesta}"\n`);

  if (r.correcciones.length === 0) {
    console.log("Correcciones: ninguna");
  } else {
    console.log("Correcciones:");
    for (const c of r.correcciones) {
      console.log(`  [${c.tipo}] ${c.original} -> ${c.correccion}`);
      console.log(`      ${c.explicacion}`);
    }
  }

  // USD por millón de tokens. La entrada se cobra a tarifa de audio,
  // que es la que aplica aquí. Verificar contra la página de precios.
  const TARIFAS = {
    "gemini-2.5-flash-lite": { entrada: 0.3, salida: 0.4 },
    "gemini-2.5-flash": { entrada: 1.0, salida: 2.5 },
    "gemini-3.5-flash-lite": { entrada: 0.3, salida: 2.5 },
  };
  const t = TARIFAS[process.env.GEMINI_MODEL];

  console.log(
    `\nTiempo: ${seg}s · Tokens: ${r.tokensEntrada} entrada / ${r.tokensSalida} salida`
  );
  if (t) {
    const usd = (r.tokensEntrada / 1e6) * t.entrada + (r.tokensSalida / 1e6) * t.salida;
    console.log(`Costo de este mensaje: ${(usd * 4000).toFixed(2)} COP`);
  } else {
    console.log("Costo: tarifa no registrada para este modelo");
  }
} catch (e) {
  console.error("Error:", e.message);
  process.exitCode = 1;
}
