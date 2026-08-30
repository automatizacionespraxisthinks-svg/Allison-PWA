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
 * Las aserciones son deliberadamente TOLERANTES en la forma y ESTRICTAS
 * en el fondo. El modelo puede devolver "is → are" o "people is → people
 * are": ambas son correctas, y una prueba que exija el texto literal
 * falla al azar. Una prueba que falla al azar se termina ignorando, y
 * ese día deja de atrapar los errores de verdad.
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
  // `espera` se busca en el conjunto de correcciones Y en la respuesta
  // hablada: da igual cómo las reparta el modelo mientras la forma
  // correcta aparezca.
  { dice: "I have 25 years old", espera: /\bam\b.*\b25\b|\b25\b.*\bam\b/i },
  { dice: "Yesterday I go to the park", espera: /\bwent\b/i },
  { dice: "My friend she is more tall than me", espera: /\btaller\b/i },
  // Era "I no have money", pero la voz sintética pronuncia "no have"
  // igual que "know have", y el fallo era del audio de prueba, no de
  // Allison. Misma clase de error -- negar sin do/does -- y se oye sin
  // ambigüedad.
  { dice: "She no like coffee", espera: /\bdoesn'?t like\b|\bdoes not like\b/i },
  { dice: "I am agree with you", espera: /\bI agree\b/i },
  { dice: "She have a car", espera: /\bhas\b/i },
  { dice: "The people is very happy", espera: /\bare\b/i },
  // Controles: frases correctas. Aquí NO debe corregir nada.
  { dice: "I went to the park yesterday with my family", espera: null },
  { dice: "My sister is taller than me and she likes music", espera: null },
  // Una pregunta EN ESPAÑOL (caso real reportado): la transcripción no
  // se traduce, no hay correcciones fantasma, y la respuesta explica
  // EN ESPAÑOL — no el saludo vacío de "good question".
  {
    dice: "Cual es la diferencia entre el was y el did",
    idioma: "es",
    pregunta: true,
    contiene: /i was|i did/i,
  },
  {
    dice: "Cual es la diferencia entre was y were",
    idioma: "es",
    pregunta: true,
    contiene: /i was|they were|you were|we were/i,
  },
  {
    dice: "Como se dice quiero ir al banio en ingles",
    idioma: "es",
    pregunta: true,
    contiene: /go to the (bathroom|toilet|restroom)/i,
  },
];

function sintetizar(texto, destino, idioma = "en") {
  const ps = `Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$en = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.TwoLetterISOLanguageName -eq '${idioma}' } | Select-Object -First 1
$s.SelectVoice($en.VoiceInfo.Name)
$s.SetOutputToWaveFile('${destino}')
$s.Speak('${texto.replace(/'/g, "''")}')
$s.SetOutputToNull(); $s.Dispose()`;
  execFileSync("powershell", ["-NoProfile", "-Command", ps], { stdio: "ignore" });
}

console.log(`Modelo: ${process.env.GEMINI_MODEL}  ·  temperatura 0\n`);

let fallos = 0;
const ruta = join(tmpdir(), "allison-eval.wav");

for (const caso of CASOS) {
  sintetizar(caso.dice, ruta, caso.idioma ?? "en");
  const audio = readFileSync(ruta);

  const r = await conversar({
    audioBase64: audio.toString("base64"),
    mimeType: "audio/wav",
    alumno: { nombre: "Alumno de prueba", nivel: "A2" },
    temperatura: 0, // reproducible
  });

  const correcciones = r.correcciones
    .map((c) => `${c.original} -> ${c.correccion}`)
    .join(" | ");

  let ok;
  let detalle;

  if (caso.pregunta) {
    // Pregunta en español: sin correcciones, transcripción sin traducir
    // y respuesta que explica en español.
    const transcripcionEnEspanol =
      /diferencia|cu[aá]l|entre|como se dice|quiero|ba[ñn]o/i.test(r.transcripcion);
    // La respuesta va SIEMPRE en inglés: la voz es inglesa y una sola
    // palabra en español sale destrozada por ella. El español del
    // alumno vive en la transcripción y en el botón de traducción.
    const respondeConSustancia = r.respuesta.length > 60;
    const sinEspanolEnLaVoz = !/[áéíóúñ¿¡]/i.test(r.respuesta);
    const traeEjemplo = caso.contiene ? caso.contiene.test(r.respuesta) : true;
    ok =
      r.correcciones.length === 0 &&
      transcripcionEnEspanol &&
      respondeConSustancia &&
      sinEspanolEnLaVoz &&
      traeEjemplo;
    detalle = ok
      ? "transcripción en español, respuesta en inglés puro, con ejemplos"
      : `transcripcion="${r.transcripcion.slice(0, 40)}" correcciones=${r.correcciones.length} respuesta="${r.respuesta.slice(0, 60)}"`;
  } else if (caso.espera === null) {
    ok = r.correcciones.length === 0;
    detalle = ok ? "sin correcciones, como debe ser" : `INVENTÓ: ${correcciones}`;
  } else {
    // Vale si la forma correcta aparece en las correcciones o en lo que
    // Allison dijo: lo que importa es que el alumno la reciba.
    // Se normalizan los apóstrofos: el modelo usa el tipográfico (’) y
    // los patrones el recto ('). Sin esto, una corrección correcta como
    // "she doesn’t like" se marcaba como fallo.
    const heno = `${correcciones} ${r.respuesta}`.replace(/[‘’]/g, "'");
    ok = caso.espera.test(heno);
    detalle = correcciones || "no corrigió nada";
  }

  // Fallos que no dependen del caso
  const identicas = r.correcciones.filter(
    (c) => c.original.trim().toLowerCase() === c.correccion.trim().toLowerCase()
  );
  if (identicas.length > 0) {
    ok = false;
    detalle += `  [original = corrección: "${identicas[0].original}"]`;
  }

  const sinTema = r.correcciones.filter((c) => !c.tema);
  if (sinTema.length > 0) {
    ok = false;
    detalle += "  [corrección sin tema: no agruparía en el panel]";
  }

  const sinEspanol = r.correcciones.filter((c) => !c.explicacionEs?.trim());
  if (sinEspanol.length > 0) {
    ok = false;
    detalle += "  [corrección sin explicación en español]";
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
