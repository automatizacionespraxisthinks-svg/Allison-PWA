/**
 * La evaluación corta (src/lib/evaluacion.ts) contra grabaciones buenas
 * y malas, con revisión automática: ¿califica bien?, ¿cuánto tarda?,
 * ¿cuánto cuesta? Llama a Gemini, así que gasta créditos y no está en
 * "npm run revisar".
 *
 *   node --env-file=.env scripts/probar-evaluacion.mjs <carpeta-de-audios> [repeticiones]
 *
 * La carpeta tiene un audio por caso (.wav, .webm, .m4a, .mp3 u .ogg),
 * con el nombre de la lista CASOS
 * (rep-bien.wav, que-night.wav...). Sirve igual con grabaciones de
 * alumnos reales: basta con nombrarlas así.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const { evaluarRespuestaCorta } = await import("../src/lib/evaluacion.ts");

const carpeta = process.argv[2];
const reps = Number(process.argv[3] ?? 2);
if (!carpeta || !existsSync(carpeta)) {
  console.error("Uso: node --env-file=.env scripts/probar-evaluacion.mjs <carpeta-de-audios> [repeticiones]");
  process.exit(1);
}

/** Extensiones de audio que se aceptan, con su tipo. */
const TIPOS = { wav: "audio/wav", webm: "audio/webm", m4a: "audio/mp4", mp3: "audio/mpeg", ogg: "audio/ogg" };

const REPITE = { tipo: "repite", esperado: "Good morning! How are you?" };
const QUE = { tipo: "que-es-esto", esperado: "Good morning", aceptadas: ["Morning"] };
const DILO = { tipo: "dilo", esperado: "Nice to meet you", aceptadas: ["Pleased to meet you"] };
const RESP = { tipo: "responde", esperado: "How old are you?" };
const DESC = { tipo: "describe", esperado: "What do you see?", aceptadas: ["woman", "dog", "tree", "house", "ball"] };

/**
 * [archivo, actividad, ¿debe ser correcto?, palabras que deben quedar
 * "mejorar" en Repite (null = no se revisa palabra por palabra)]
 */
const CASOS = [
  ["rep-bien", REPITE, true, []],
  ["rep-acento", REPITE, true, null],
  ["rep-fonetico", REPITE, null, null], // acento fuerte: se informa, no se exige
  ["rep-night", REPITE, false, ["morning"]],
  ["rep-corta", REPITE, false, ["How", "are", "you"]],
  ["rep-espanol", REPITE, false, null],
  ["rep-balbuceo", REPITE, false, null],
  ["silencio", REPITE, false, null],
  ["que-bien", QUE, true],
  ["que-morning", QUE, true],
  ["que-night", QUE, false],
  ["que-espanol", QUE, false],
  ["que-acento", QUE, null],
  ["dilo-bien", DILO, true],
  ["dilo-pleased", DILO, true],
  ["dilo-incompleta", DILO, false],
  ["dilo-orden", DILO, false],
  ["dilo-espanol", DILO, false],
  ["dilo-acento", DILO, null],
  ["resp-bien", RESP, true],
  ["resp-error", RESP, true], // pequeño error: igual responde la pregunta
  ["resp-otra", RESP, false],
  ["resp-espanol", RESP, false],
  ["desc-bien", DESC, true],
  ["desc-dos", DESC, false],
  ["desc-espanol", DESC, false],
];

let total = 0;
let malas = 0;
let tokEntrada = 0;
let tokSalida = 0;
const tiempos = [];

for (let rep = 0; rep < reps; rep++) {
  for (const [archivo, actividad, debe, mejorar] of CASOS) {
    const ext = Object.keys(TIPOS).find((e) => existsSync(join(carpeta, `${archivo}.${e}`)));
    if (!ext) continue;
    const ruta = join(carpeta, `${archivo}.${ext}`);
    const t0 = Date.now();
    let r;
    try {
      r = await evaluarRespuestaCorta({ ...actividad, nivel: "A1", audioBase64: readFileSync(ruta).toString("base64"), mimeType: TIPOS[ext] });
    } catch (e) {
      console.log(`RED   ${archivo}: ${e.message}`);
      continue;
    }
    const ms = Date.now() - t0;
    tiempos.push(ms);
    tokEntrada += r.tokensEntrada;
    tokSalida += r.tokensSalida;
    total++;

    const fallas = [];
    if (debe !== null && r.correcto !== debe) fallas.push(`correcto=${r.correcto}, se esperaba ${debe}`);
    if (mejorar) {
      const marcadas = r.palabras.filter((p) => p.estado === "mejorar").map((p) => p.palabra.toLowerCase());
      const esperadas = mejorar.map((p) => p.toLowerCase());
      if (marcadas.join(",") !== esperadas.join(",")) fallas.push(`por mejorar: [${marcadas}] se esperaba [${esperadas}]`);
    }
    if (fallas.length) malas++;
    const palabras = r.palabras.length ? `  ${r.palabras.map((p) => (p.estado === "bien" ? p.palabra : `*${p.palabra}*`)).join(" ")}` : "";
    console.log(`${fallas.length ? "MAL " : "ok  "} ${archivo.padEnd(16)} ${(ms / 1000).toFixed(1)}s  oyó "${r.transcripcion}" -> ${r.correcto ? "correcto" : "no"}${palabras}${fallas.length ? `\n      ${fallas.join("; ")}` : ""}`);
  }
}

// Precios de gemini-2.5-flash-lite por millón de tokens (ai.google.dev,
// oct-2026): audio de entrada 0.30, texto 0.10, salida 0.40. Se cuenta
// toda la entrada como audio: es la cota alta.
const usd = (tokEntrada / 1e6) * 0.3 + (tokSalida / 1e6) * 0.4;
const porEval = usd / Math.max(total, 1);
tiempos.sort((a, b) => a - b);
console.log(`\n${total - malas}/${total} bien.`);
console.log(`Tiempo: mediana ${(tiempos[Math.floor(tiempos.length / 2)] / 1000).toFixed(1)} s, máximo ${(tiempos.at(-1) / 1000).toFixed(1)} s.`);
console.log(`Costo: ${Math.round(tokEntrada / total)} tokens de entrada y ${Math.round(tokSalida / total)} de salida por evaluación = USD ${porEval.toFixed(6)} ≈ $${(porEval * 4000).toFixed(2)} COP (a 4.000).`);
