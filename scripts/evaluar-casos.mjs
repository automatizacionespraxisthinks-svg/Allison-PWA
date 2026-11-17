/**
 * Los once casos del plan contra el modelo real, con frases DISTINTAS a
 * las de los ejemplos del prompt (si el modelo solo copiara ejemplos, aquí
 * se nota) y revisión automática de cada respuesta. Llama a Gemini: gasta
 * créditos y por eso no está en "npm run revisar".
 *
 *   node --env-file=.env scripts/evaluar-casos.mjs [repeticiones] [nivel]
 *   VER=1 ...   muestra también las respuestas correctas
 *   TEMPERATURA=0 ...   reproducible (por defecto 0.8, la de producción)
 *   SOLO=texto ...   solo las frases que contienen ese texto
 *   AUDIO=1 ...   cada frase se DICE (voces de Windows: Zira en inglés,
 *                 Sabina en español y en lo mezclado) y entra como audio,
 *                 que es el camino de producción. Escrito y hablado no se
 *                 portan igual: el 17 de noviembre de 2026 un cambio del
 *                 prompt pasó 306/306 escrito y, hablado, mandaba las frases
 *                 en español al caso 2. Todo cambio del prompt se mide así.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const { conversar, esInglesClaro, esEspanolClaro } = await import("../src/lib/allison.ts");
const { quitarMarcadores, sinEspanol } = await import("../src/lib/habla.ts");

const reps = Number(process.argv[2] ?? 3);
const nivel = process.argv[3] ?? "A1";
const temperatura = Number(process.env.TEMPERATURA ?? 0.8);
const alumno = { nombre: "Diego Rojas", nivel, erroresRepetidos: ["playet", "goed"] };
const ctx = (allison) => [{ id: "1", rol: "allison", texto: allison, correcciones: [], creadoEn: "" }];
const sinEs = ["B2", "C1", "C2"].includes(nivel);
const unaCorr = ["A1", "A2"].includes(nivel);
const conAudio = Boolean(process.env.AUDIO);
const carpetaAudio = join(tmpdir(), "allison-evaluar-casos");
if (conAudio) mkdirSync(carpetaAudio, { recursive: true });
/** El wav de la frase, dicho por una voz de Windows (se graba una sola vez). */
function grabar(i, dice, espanol) {
  const destino = join(carpetaAudio, `${i}.wav`);
  if (!existsSync(destino)) {
    const ps = `Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('${espanol ? "Microsoft Sabina Desktop" : "Microsoft Zira Desktop"}')
$s.SetOutputToWaveFile('${destino}')
$s.Speak('${dice.replace(/'/g, "''")}')
$s.SetOutputToNull(); $s.Dispose()`;
    execFileSync("powershell", ["-NoProfile", "-Command", ps], { stdio: "ignore" });
  }
  return readFileSync(destino).toString("base64");
}
const igual = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

// [caso esperado (o lista), lo que dice, mensaje anterior de Allison]
const casos = [
  [["1"], "I have two brother", "Tell me about your family."],
  [["1"], "My mother cook very good", "Who cooks at home?"],
  [["1", "2", "11"], "I like the pizza with pineapple", "What food do you like?"],
  [["2"], "Last weekend I watch a movie", "What did you do last weekend?"],
  [["2"], "Yesterday my sister go to the mall", "What did your family do yesterday?"],
  [["2", "3"], "I am boring in the class of math", "How do you feel in math class?"],
  [["3"], "My mom is very sensible, she cry with movies", "Tell me about your mom."],
  [["3"], "My sister is embarrassed, she will have a baby", "Tell me about your sister."],
  [["3"], "My teacher is very sympathetic, she makes jokes", "Tell me about your teacher."],
  [["5"], "Yesterday I goed to the park", "What did you do yesterday?"],
  [["5"], "On Sunday I playet basketball", "What did you do on Sunday?"],
  [["6"], "mmm ah ke eh tu bla", "How are you today?"],
  [["6"], "blorp tika na sss", "What is your favorite color?"],
  [["7"], "¿Cómo se dice tengo hambre?", "Good morning, Diego!"],
  [["7"], "¿Cómo digo que me gusta bailar?", "What do you like to do?"],
  [["8"], "Explícame cuándo uso do y does", "What music do you like?"],
  [["8"], "¿Cuál es la diferencia entre was y were?", "Where were you yesterday?"],
  [["9"], "no entiendo", "We use 'do' for questions: Do you like pizza?"],
  [["9"], "Can you repeat? I not understand", "Use 'was' with I: I was tired yesterday."],
  [["10"], "¿Cómo se escribe cumpleaños en inglés? Deletréamelo", "When is your birthday?"],
  [["10"], "How do you spell beautiful?", "Your city sounds beautiful!"],
  [["11"], "I went to the park with my sister", "What did you do on Saturday?"],
  [["11"], "My favorite food is pizza", "What is your favorite food?"],
  [["11", "1"], "How old are you?", "Hi Diego!"],
  [["11", "1"], "What is your Instagram?", "Hi Diego!"],
  [["11", "1"], "Do you like reggaeton?", "Hi Diego!"],
  [["11"], "Are you a real person?", "Hi Diego! How are you today?"],
  [["7"], "Ayer fui al parque con mi hermana", "What did you do yesterday?"],
  // Producción, octubre de 2026: una pregunta en español a Allison recibía "No te oí" (caso 6).
  [["7"], "Hola Allison, ¿qué más puedes hacer?", "Good morning, Diego!"],
  [["7"], "te estoy preguntando que qué más puedes hacer", "Sorry. I didn't hear you. Can you say it again?"],
  // Inglés y español en un mismo turno (auditoría, 17 de noviembre de 2026):
  // antes "arepas con huevo" pasaba como 11 y el español quedaba en la parte inglesa.
  [["2"], "Yesterday I ate arepas con huevo", "What did you eat for breakfast?"],
  [["2"], "I have a perro, se llama Max", "Do you have any pets?"],
  [["2"], "I like to play fútbol pero I am not very good", "What sports do you like?"],
  [["8"], "Allison, what significa 'weekend'?", "What do you do on weekends?"],
  // Frases enteras en español, dichas (17 de noviembre de 2026): habladas
  // caían en el caso 2 con explicaciones raras ("en inglés no dices 'yo'").
  [["7"], "Yo vivo en Bucaramanga con mi mamá y mis dos hermanos", "Tell me about your family."],
  [["7"], "Me gusta jugar fútbol los sábados", "What do you like to do?"],
  [["7"], "Ayer fui al cine con mis amigos", "What did you do yesterday?"],
  [["7"], "Estoy estudiando en mi casa", "Where are you right now?"],
  [["7"], "Mi mamá cocina muy rico", "Who cooks at home?"],
  [["7"], "¿Cómo se dice mariposa?", "What animals do you like?"],
  [["8"], "¿Qué significa homework?", "Do you have homework today?"],
  [["9"], "No entendí la pregunta, ¿me la puedes repetir?", "What do you usually do on weekends?"],
  // El alumno dice que Allison oyó mal: se disculpa y pide que lo repita.
  [["Q"], "No, eso no fue lo que yo dije", "You were at home yesterday! What did you do there?"],
  [["Q"], "Yo no dije eso", "You like pizza! What else do you like?"],
  [["Q"], "That's not what I said", "You like pizza! What else do you like?"],
  // Corrige la forma y deja sus palabras: "in my house" no pasa a "at home".
  [["2"], "I am study in my house", "Where are you right now?", "house"],
  [["2"], "Yesterday I go to the school with my friends", "What did you do yesterday?", "school"],
  [["11"], "I am fine, thank you", "Hi Diego! How are you today?"],
];
/** Lo que no está en inglés se dice con la voz española (también lo mezclado). */
const enEspanol = (dice) => /[¿¡áéíóúñ]|\b(eso|dije|perro|pero|con|significa|estoy|ayer|gusta|entiendo|preguntando)\b/i.test(dice);

const REQUIERE_ES = new Set(["2", "3", "4", "5", "6", "7", "8", "9", "10"]);
const PREGUNTA_AL_FINAL = new Set(["1", "2", "5", "11"]);

function revisar(esperado, dice, r, conserva) {
  const fallas = [];
  // El alumno dijo que Allison oyó mal: disculpa fija, sin correcciones.
  if (esperado[0] === "Q") {
    const v = r.respuestaVoz;
    if (!/again/i.test(v)) fallas.push("no pidió que lo repitiera");
    if (/se dice así|try saying/i.test(v)) fallas.push("tradujo la queja");
    if (r.correcciones.length) fallas.push("corrigió una queja");
    if (!sinEs && !/o[ií] mal/i.test(v)) fallas.push("no se disculpó en español");
    return fallas;
  }
  // 1 y 11 se comportan igual (sin corrección, sin español). De B1 en
  // adelante, una -s o un plural sí se corrigen (caso 2), y un falso
  // amigo explicado como 2 también vale.
  esperado = [...esperado];
  // En A1 y A2 el caso 1 no existe: todo error se corrige, también el
  // pequeño, como caso 2 (2 de noviembre de 2026). Una frase bien dicha
  // es solo 11.
  if (unaCorr && esperado.includes("1")) {
    esperado = esperado.includes("11") ? esperado.filter((x) => x !== "1") : esperado.map((x) => (x === "1" ? "2" : x));
  }
  if (esperado.includes("1")) esperado.push("11");
  if (!unaCorr && (esperado.includes("1") || esperado.includes("3"))) esperado.push("2");
  const voz = r.respuestaVoz;
  const tieneEs = voz.includes("[es]");
  const caso = r.caso;
  if (!esperado.includes(caso)) fallas.push(`caso ${caso}, se esperaba ${esperado.join("/")}`);
  const c = esperado.includes(caso) ? caso : esperado[0];
  if (sinEs && tieneEs) fallas.push("español en B2+");
  if (!sinEs && nivel !== "B1" && REQUIERE_ES.has(c) && !tieneEs) fallas.push("falta el español");
  if (!sinEs && (c === "1" || c === "11") && tieneEs && !voz.includes("inteligencia artificial")) fallas.push("español en caso 1/11");
  // El inglés no debe traer español suelto.
  const ingles = quitarMarcadores(sinEspanol(voz));
  for (const o of ingles.match(/[^.!?]+[.!?]*/g) ?? []) {
    if (esEspanolClaro(o)) fallas.push(`español en la parte inglesa: "${o.trim()}"`);
  }
  for (const tramo of voz.match(/\[es\][^[]*/g) ?? []) {
    for (const o of tramo.replace("[es]", "").match(/[^.!?]+[.!?]*/g) ?? []) {
      if (esInglesClaro(o)) fallas.push(`inglés dentro del español: "${o.trim()}"`);
    }
  }
  if (/tranquil[oa]|bienvenid[oa]/i.test(voz)) fallas.push("español con género");
  if (dice === "Are you a real person?" && !sinEs && !voz.includes("inteligencia artificial")) fallas.push("no dijo la frase aprobada de IA");
  for (const c of r.correcciones) {
    // Lo citado no cuenta: "Use 'but' instead of 'pero'" es inglés.
    if (esEspanolClaro((c.explicacion ?? "").replace(/'[^']*'|"[^"]*"/g, ""))) fallas.push(`explicación en español donde va el inglés: "${c.explicacion}"`);
  }
  if (unaCorr && r.correcciones.length > 1) fallas.push(`${r.correcciones.length} correcciones`);
  if (unaCorr && ["1", "6", "7", "8", "9", "10", "11"].includes(c) && r.correcciones.length) fallas.push("corrigió en un caso sin correcciones");
  if (c === "9" && /understand|entiend/i.test(voz)) fallas.push("enseñó el pedido de ayuda");
  if (c === "10" && !/\b[A-Z], [A-Z], [A-Z]/.test(voz)) fallas.push("no deletreó");
  if (PREGUNTA_AL_FINAL.has(c) && !voz.trim().endsWith("?") && !/tell me/i.test(voz.slice(-40))) fallas.push("no termina en pregunta");
  const ultima = (quitarMarcadores(voz).match(/[^.!?]+[.!?]*/g) ?? []).pop()?.trim() ?? "";
  if (PREGUNTA_AL_FINAL.has(c) && /^(do|does|did|is|are|was|were|can|could|have|has|will|would|you|and you)\b/i.test(ultima)) fallas.push(`pregunta de sí o no: "${ultima}"`);
  const tramoEs = (voz.match(/\[es\]([^[]*)/) ?? [])[1] ?? "";
  const nOraciones = (tramoEs.match(/[.!?]+/g) ?? []).length;
  const tope = c === "8" || c === "9" ? 3 : 2;
  // Una muletilla inicial corta ("¡Claro!", "Tranquilo, Diego.") no cuenta, como en recortarOraciones.
  const primera = (tramoEs.match(/[^.!?]+[.!?]+/) ?? [""])[0].trim();
  const muletilla = primera && primera.split(/\s+/).length <= 3 ? 1 : 0;
  if (nOraciones - muletilla > tope && c !== "5") fallas.push(`español de ${nOraciones} oraciones`);
  if (c === "5" && /'ed'|se dice|se escribe/i.test(voz)) fallas.push("volvió a explicar el error repetido");
  if (/\[(?!es\]|en-US\])/.test(voz)) fallas.push("marcador raro");
  if (c === "7" && !sinEs && !/Se dice así\./.test(voz)) fallas.push("caso 7 sin «Se dice así.»");
  if (c === "7" && !/try (saying|asking)/i.test(voz)) fallas.push("caso 7 sin «Try saying it!»");
  if (conserva && !new RegExp(`\\b${conserva}\\b`, "i").test(voz)) fallas.push(`cambió «${conserva}» por otra palabra`);
  return fallas;
}

let total = 0, malas = 0, oidas = 0, oidasBien = 0;
const porCaso = {};
for (let rep = 0; rep < reps; rep++) {
  for (const [n, [esperado, dice, anterior, conserva]] of casos.entries()) {
    if (process.env.SOLO && !dice.includes(process.env.SOLO)) continue;
    let r;
    const entrada = conAudio ? { audioBase64: grabar(n, dice, enEspanol(dice)), mimeType: "audio/wav" } : { texto: dice };
    for (let i = 0; i < 3 && !r; i++) {
      try { r = await conversar({ ...entrada, alumno, historial: ctx(anterior), temperatura }); } catch {}
    }
    // Una voz sintética no sabe decir un error escrito ("playet" suena "play at").
    if (conAudio && esperado[0] === "5") continue;
    if (!r) { console.log(`RED  ${dice}`); continue; }
    total++;
    const fallas = revisar(esperado, dice, r, conserva);
    // Con audio, además: ¿transcribió lo que se dijo? (los ruidos del caso 6 no cuentan)
    if (conAudio && esperado[0] !== "6") {
      oidas++;
      if (igual(r.transcripcion) === igual(dice)) oidasBien++;
      else console.log(`OYÓ  "${dice}" -> "${r.transcripcion}"`);
    }
    const k = esperado[0];
    porCaso[k] ??= { ok: 0, mal: 0 };
    if (fallas.length) {
      malas++; porCaso[k].mal++;
      console.log(`MAL  [${r.caso}] "${dice}"\n     ${r.respuestaVoz}\n     corr: ${r.correcciones.map((c) => c.original + "->" + c.correccion).join(" | ")}\n     -> ${fallas.join("; ")}`);
    } else {
      porCaso[k].ok++;
      if (process.env.VER) console.log(`ok   [${r.caso}] "${dice}"\n     ${r.respuestaVoz}`);
    }
  }
}
console.log(`\nNivel ${nivel}, temperatura ${temperatura}: ${total - malas}/${total} bien.`);
if (conAudio) console.log(`Transcripciones exactas: ${oidasBien}/${oidas}.`);
console.log(Object.entries(porCaso).map(([k, v]) => `caso ${k}: ${v.ok}/${v.ok + v.mal}`).join("  "));
