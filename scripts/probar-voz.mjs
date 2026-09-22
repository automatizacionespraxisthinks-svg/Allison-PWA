/**
 * La voz de Allison (src/lib/tts.ts y src/lib/habla.ts), sin tocar la red.
 *
 * Lo que se prueba es lo que la guía de la API exige y lo que, si
 * falla, deja a Allison muda o tumba el servicio compartido:
 *   · la petición: endpoint nativo, clave Bearer, mp3 en streaming,
 *     velocidad 1, voz según el idioma, X-Request-ID válido;
 *   · el texto: limpio de marcas y emojis, ni vacío ni pasado de 5000;
 *   · los reintentos: SOLO en 429, 503 y 500, respetando Retry-After,
 *     con tope de intentos; un 400 no se repite;
 *   · los turnos: nunca más de dos síntesis a la vez, y quien no
 *     consigue turno falla rápido (para caer a la voz del navegador);
 *   · lo pedido y no reproducido: solo lo abre su dueño y vence.
 *
 *   node scripts/probar-voz.mjs
 */
process.env.TTS_API_KEY = "clave-de-prueba";
process.env.TTS_URL = "https://tts.ejemplo.org/";
process.env.TTS_VOZ = "af_heart";
process.env.TTS_VOZ_ES = "ef_dora";
process.env.TTS_SIMULTANEAS = "2";
process.env.TTS_ESPERA_TURNO_MS = "300";

const { ErrorTts, registrarVoz, sintetizar, ttsConfigurado, turnosEnCurso, validarTextoVoz, vozPedida } =
  await import("../src/lib/tts.ts");
const { estimarSegundos, idiomaDe, limpiarParaVoz, nuevoIdPeticion, tiempoDeEsperaMs } =
  await import("../src/lib/habla.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

// ---------------------------------------------------------------------
//  Red simulada: se registra cada llamada y se responde lo que se pida.
// ---------------------------------------------------------------------
const llamadas = [];
let responder = () => audio(["a", "b"]);
globalThis.fetch = async (url, opciones = {}) => {
  llamadas.push({ url: String(url), opciones });
  return responder(String(url), opciones);
};
const ultima = () => llamadas[llamadas.length - 1];

/** Una respuesta de audio con los trozos dados. `abierta` deja el flujo sin cerrar. */
function audio(trozos, { abierta = false, cabeceras = {} } = {}) {
  let cerrar;
  const flujo = new ReadableStream({
    start(control) {
      for (const t of trozos) control.enqueue(new TextEncoder().encode(t));
      if (!abierta) control.close();
      cerrar = () => control.close();
    },
  });
  const r = new Response(flujo, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "X-Cache": "MISS", "X-Request-ID": "eco", ...cabeceras },
  });
  r.cerrarFlujo = () => cerrar?.();
  return r;
}
const errorApi = (status, code, cabeceras = {}) =>
  new Response(JSON.stringify({ error: { code, message: `simulado ${code}` } }), {
    status,
    headers: { "Content-Type": "application/json", ...cabeceras },
  });
const leerTodo = async (cuerpo) => {
  const lector = cuerpo.getReader();
  let texto = "";
  for (;;) {
    const { done, value } = await lector.read();
    if (done) return texto;
    texto += new TextDecoder().decode(value);
  }
};
const falla = async (fn) => {
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  }
};

// ---------------------------------------------------------------------
console.log("Configuración:");
{
  const clave = process.env.TTS_API_KEY;
  delete process.env.TTS_API_KEY;
  probar("sin TTS_API_KEY no hay voz propia", ttsConfigurado() === false);
  const e = await falla(() => sintetizar({ texto: "Hello" }));
  probar("y pedir voz sin clave falla con no_configurado, sin llamar a la API", e instanceof ErrorTts && e.codigo === "no_configurado" && llamadas.length === 0);
  process.env.TTS_API_KEY = clave;
  probar("con clave, sí", ttsConfigurado() === true);
}

// ---------------------------------------------------------------------
console.log("\nLa petición a la API:");
{
  const r = await sintetizar({ texto: "Nice to meet you, Ana!" });
  const { url, opciones } = ultima();
  const cuerpo = JSON.parse(opciones.body);
  const cabeceras = new Headers(opciones.headers);
  probar("POST al endpoint nativo /v1/tts, sin barra doble", url === "https://tts.ejemplo.org/v1/tts" && opciones.method === "POST", url);
  probar("clave Bearer", cabeceras.get("authorization") === "Bearer clave-de-prueba");
  probar(
    "mp3 en STREAMING, velocidad 1 (la velocidad se aplica en el reproductor)",
    cuerpo.format === "mp3" && cuerpo.stream === true && cuerpo.speed === 1,
    opciones.body
  );
  probar("texto en inglés: voz inglesa y lang en-US", cuerpo.voice === "af_heart" && cuerpo.lang === "en-US");
  probar("solo text, nunca text y segments a la vez", "text" in cuerpo && !("segments" in cuerpo));
  const id = cabeceras.get("x-request-id") ?? "";
  probar("X-Request-ID propio: allison-…, válido para la API (≤64, [A-Za-z0-9_.:-])", /^allison-[A-Za-z0-9_.:-]+$/.test(id) && id.length <= 64, id);
  probar("el flujo vuelve tal cual y con el rastro (cache, id)", (await leerTodo(r.cuerpo)) === "ab" && r.cache === "MISS" && r.idPeticion === "eco");
  probar("al terminar el flujo, el turno queda libre", turnosEnCurso() === 0, String(turnosEnCurso()));
  probar("tiempo de espera dimensionado al audio: 2×duración + 30 s", tiempoDeEsperaMs("x".repeat(300)) === (2 * 20 + 30) * 1000 && opciones.signal instanceof AbortSignal);
}
{
  await leerTodo((await sintetizar({ texto: "¿Cómo estás? Muy bien, gracias." })).cuerpo);
  const cuerpo = JSON.parse(ultima().opciones.body);
  probar("texto en español: voz española y lang es", cuerpo.voice === "ef_dora" && cuerpo.lang === "es", ultima().opciones.body);
  await leerTodo((await sintetizar({ texto: "Good morning", idioma: "es" })).cuerpo);
  probar("un idioma explícito manda sobre la detección", JSON.parse(ultima().opciones.body).lang === "es");
}

// ---------------------------------------------------------------------
console.log("\nEl texto que se manda:");
probar("se quitan marcas de formato y emojis, y se colapsan espacios", limpiarParaVoz("**Great** job! 🎉\n\nKeep  going.") === "Great job! Keep going.", JSON.stringify(limpiarParaVoz("**Great** job! 🎉\n\nKeep  going.")));
probar("la puntuación se conserva (marca las pausas)", limpiarParaVoz("Hi, Ana! How are you?") === "Hi, Ana! How are you?");
{
  const n = llamadas.length;
  const vacio = await falla(() => sintetizar({ texto: "🎉 ** " }));
  probar("un texto sin nada que decir falla con empty_text, sin llamar", vacio instanceof ErrorTts && vacio.codigo === "empty_text" && llamadas.length === n);
  const largo = await falla(() => sintetizar({ texto: "a".repeat(5001) }));
  probar("más de 5000 caracteres falla con text_too_long, sin llamar", largo instanceof ErrorTts && largo.codigo === "text_too_long" && llamadas.length === n);
}
probar("la app acota lo que dice de una vez (3000)", validarTextoVoz("a".repeat(3000)) === null && validarTextoVoz("a".repeat(3001)) !== null && validarTextoVoz("") !== null);
probar("detecta español por signos propios", idiomaDe("¿Dónde vives?") === "es" && idiomaDe("mañana") === "es");
probar("detecta español por palabras", idiomaDe("el perro de la casa es muy grande") === "es");
probar("lo demás es inglés, incluida la duda", idiomaDe("I don't have money for the ticket") === "en" && idiomaDe("Tuesday") === "en" && idiomaDe("el") === "en");
probar("estimación de duración: ~15 caracteres por segundo", estimarSegundos("x".repeat(300)) === 20 && estimarSegundos("hi") === 1);
probar("ids de petición únicos", nuevoIdPeticion() !== nuevoIdPeticion());

// ---------------------------------------------------------------------
console.log("\nReintentos, como pide la guía:");
{
  let vez = 0;
  responder = () => (++vez === 1 ? errorApi(429, "rate_limited", { "Retry-After": "1" }) : audio(["ok"]));
  const antes = llamadas.length;
  const t0 = Date.now();
  const r = await sintetizar({ texto: "Try again" });
  probar("un 429 se reintenta tras Retry-After y sale", (await leerTodo(r.cuerpo)) === "ok" && llamadas.length - antes === 2 && Date.now() - t0 >= 900, `${llamadas.length - antes} llamadas en ${Date.now() - t0} ms`);

  vez = 0;
  responder = () => (++vez === 1 ? errorApi(500, "internal_error") : audio(["ok"]));
  probar("un 500 se reintenta una vez", (await leerTodo((await sintetizar({ texto: "Again" })).cuerpo)) === "ok");

  responder = () => errorApi(400, "voice_not_found");
  const n = llamadas.length;
  const e = await falla(() => sintetizar({ texto: "No retry" }));
  probar("un 400 NO se reintenta y sube el error.code de la API", e instanceof ErrorTts && e.codigo === "voice_not_found" && e.estado === 400 && !e.reintentable && llamadas.length - n === 1);

  responder = () => errorApi(503, "server_busy", { "Retry-After": "1" });
  const n2 = llamadas.length;
  const e2 = await falla(() => sintetizar({ texto: "Busy" }));
  probar("un 503 persistente se rinde a los 3 intentos, marcado como reintentable", e2 instanceof ErrorTts && e2.codigo === "server_busy" && e2.reintentable && llamadas.length - n2 === 3, `${llamadas.length - n2} llamadas`);

  responder = () => {
    throw new TypeError("fetch failed");
  };
  const e3 = await falla(() => sintetizar({ texto: "Down" }));
  probar("sin conexión: sin_conexion (502), reintentable", e3 instanceof ErrorTts && e3.codigo === "sin_conexion" && e3.estado === 502);
  probar("y tras todos los fallos no queda ningún turno ocupado", turnosEnCurso() === 0, String(turnosEnCurso()));
}

// ---------------------------------------------------------------------
console.log("\nTurnos (el servicio solo sintetiza dos a la vez):");
{
  const abiertos = [];
  responder = () => {
    const r = audio(["parte"], { abierta: true });
    abiertos.push(r);
    return r;
  };
  const uno = await sintetizar({ texto: "one" });
  const dos = await sintetizar({ texto: "two" });
  probar("dos síntesis en curso ocupan los dos turnos", turnosEnCurso() === 2);
  const t0 = Date.now();
  const tres = await falla(() => sintetizar({ texto: "three" }));
  probar(
    "la tercera espera su turno y, si no llega, falla rápido con 'ocupado' (503, reintentable)",
    tres instanceof ErrorTts && tres.codigo === "ocupado" && tres.estado === 503 && tres.reintentable && Date.now() - t0 >= 250,
    `${tres?.codigo} tras ${Date.now() - t0} ms`
  );
  abiertos[0].cerrarFlujo();
  await leerTodo(uno.cuerpo);
  probar("cuando uno termina, se libera su turno", turnosEnCurso() === 1);
  const cuatro = await sintetizar({ texto: "four" });
  probar("y el siguiente entra", turnosEnCurso() === 2);
  await dos.cuerpo.cancel();
  probar("cancelar un flujo (el alumno paró el audio) también libera", turnosEnCurso() === 1);
  abiertos[2].cerrarFlujo();
  await leerTodo(cuatro.cuerpo);
  probar("todo libre al final", turnosEnCurso() === 0);
}

// ---------------------------------------------------------------------
console.log("\nLo pedido y no reproducido:");
{
  const ahora = Date.parse("2026-09-22T12:00:00Z");
  const id = registrarVoz({ userId: "ana", texto: "Hello there" }, ahora);
  probar("el id es un uuid", /^[0-9a-f-]{36}$/.test(id));
  probar("su dueño lo abre, y más de una vez", vozPedida(id, "ana", ahora + 1000)?.texto === "Hello there" && vozPedida(id, "ana", ahora + 2000) !== null);
  probar("otro alumno no", vozPedida(id, "juan", ahora + 1000) === null);
  probar("vence a los diez minutos", vozPedida(id, "ana", ahora + 10 * 60 * 1000) === null);
  probar("un id inventado no existe", vozPedida("00000000-0000-4000-8000-000000000000", "ana", ahora) === null);
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nVoz de Allison correcta.");
