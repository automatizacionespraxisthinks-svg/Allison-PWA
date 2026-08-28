/**
 * Batería de regresión pedagógica.
 *
 * Una corrección equivocada es peor que ninguna: el alumno confía en el
 * panel y memoriza lo que ahí diga. Este script comprueba, con los
 * errores típicos de un hispanohablante, que Allison corrige bien.
 *
 * También incluye frases CORRECTAS, para detectar el problema contrario:
 * que el modelo invente errores donde no los hay.
 *
 *   node --env-file=.env scripts/evaluar-correcciones.mjs [modelo]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { conversar } from "../src/lib/allison.ts";

const modelo = process.argv[2];
if (modelo) process.env.GEMINI_MODEL = modelo;

const CASOS = [
  // frase dicha            | debe aparecer en la corrección
  { dice: "I have 25 years old", espera: "I am 25" },
  { dice: "Yesterday I go to the park", espera: "went" },
  { dice: "My friend she is more tall than me", espera: "taller" },
  { dice: "I no have money", espera: "do not have|don't have|dont have" },
  { dice: "I am agree with you", espera: "I agree" },
  { dice: "She have a car", espera: "She has|she has" },
  { dice: "The people is very happy", espera: "people are" },
  // Controles: NO debe haber correcciones
  { dice: "I went to the park yesterday with my family", espera: null },
  { dice: "My sister is taller than me and she likes music", espera: null },
];

function sintetizar(texto, destino) {
  const ps = `Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$en = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.TwoLetterISOLanguageName -eq 'en' } | Select-Object -First 1
$s.SelectVoice($en.VoiceInfo.Name)
$s.SetOutputToWaveFile('${destino}')
$s.Speak('${texto.replace(/'/g, "''")}')
$s.SetOutputToNull(); $s.Dispose()`;
  execFileSync("powershell", ["-NoProfile", "-Command", ps], { stdio: "ignore" });
}

console.log(`Modelo: ${process.env.GEMINI_MODEL}\n`);

let fallos = 0;
const ruta = join(tmpdir(), "allison-eval.wav");

for (const caso of CASOS) {
  sintetizar(caso.dice, ruta);
  const audio = readFileSync(ruta);

  const r = await conversar({
    audioBase64: audio.toString("base64"),
    mimeType: "audio/wav",
    nivel: "A2",
  });

  const texto = r.correcciones.map((c) => c.correccion).join(" | ");
  let ok;
  let detalle;

  if (caso.espera === null) {
    ok = r.correcciones.length === 0;
    detalle = ok ? "sin correcciones, como debe ser" : `INVENTÓ: ${texto}`;
  } else {
    ok = new RegExp(caso.espera, "i").test(texto);
    detalle = texto || "no corrigió nada";
  }

  // Red flags que no dependen del caso
  const identicas = r.correcciones.filter(
    (c) => c.original.trim().toLowerCase() === c.correccion.trim().toLowerCase()
  );
  if (identicas.length > 0) {
    ok = false;
    detalle += `  [original = corrección: "${identicas[0].original}"]`;
  }

  if (!ok) fallos++;
  console.log(`${ok ? "OK   " : "FALLA"}  "${caso.dice}"`);
  console.log(`         ${detalle}`);
}

try {
  unlinkSync(ruta);
} catch {}

console.log(
  fallos === 0
    ? `\n${CASOS.length}/${CASOS.length} correctos.\n`
    : `\n${fallos} de ${CASOS.length} fallaron.\n`
);
process.exitCode = fallos === 0 ? 0 : 1;
