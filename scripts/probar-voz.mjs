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
 *     lo que el alumno deja de esperar suelta su turno;
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
const { conPunto, estimarSegundos, idiomaDe, limpiarParaVoz, nuevoIdPeticion, prepararParaVoz, puntuarParaVoz, tiempoDeEsperaMs, tramosDeVoz } =
  await import("../src/lib/habla.ts");
const { segmentosParaVoz } = await import("../src/lib/voz-idiomas.ts");
const { todaLaRuta } = await import("../src/lib/ruta/index.ts");

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
const dormirPrueba = (ms) => new Promise((r) => setTimeout(r, ms));

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
  probar("mp3 en STREAMING, velocidad 1 si no se pide otra", cuerpo.format === "mp3" && cuerpo.stream === true && cuerpo.speed === 1, opciones.body);
  probar("texto en inglés: voz inglesa y lang en-US", cuerpo.voice === "af_heart" && cuerpo.lang === "en-US");
  probar("solo text, nunca text y segments a la vez", "text" in cuerpo && !("segments" in cuerpo));
  const id = cabeceras.get("x-request-id") ?? "";
  probar("X-Request-ID propio: allison-…, válido para la API (≤64, [A-Za-z0-9_.:-])", /^allison-[A-Za-z0-9_.:-]+$/.test(id) && id.length <= 64, id);
  probar("el flujo vuelve tal cual y con el rastro (cache, id)", (await leerTodo(r.cuerpo)) === "ab" && r.cache === "MISS" && r.idPeticion === "eco");
  probar("al terminar el flujo, el turno queda libre", turnosEnCurso() === 0, String(turnosEnCurso()));
  probar("tiempo de espera dimensionado al audio: 2×duración + 30 s", tiempoDeEsperaMs("x".repeat(300)) === (2 * 20 + 30) * 1000 && opciones.signal instanceof AbortSignal);
  probar("más despacio, el audio dura más y la espera también", tiempoDeEsperaMs("x".repeat(300), 0.5) === (2 * 40 + 30) * 1000);
}
{
  // La velocidad la pone la API (octubre de 2026: comparada de oído, sonó
  // más natural que estirar el audio en el celular).
  await leerTodo((await sintetizar({ texto: "Nice to meet you!", velocidad: 0.8 * 0.7 })).cuerpo);
  probar("la velocidad pedida va a la API, redondeada (0,8 × 0,7 → 0,56)", JSON.parse(ultima().opciones.body).speed === 0.56, ultima().opciones.body);
  await leerTodo((await sintetizar({ texto: "Nice to meet you!", velocidad: 0.2 })).cuerpo);
  const lenta = JSON.parse(ultima().opciones.body).speed;
  await leerTodo((await sintetizar({ texto: "Nice to meet you!", velocidad: 9 })).cuerpo);
  const rapida = JSON.parse(ultima().opciones.body).speed;
  probar("fuera de lo que acepta la API (0,5 a 2), se ajusta", lenta === 0.5 && rapida === 2, `${lenta} / ${rapida}`);
}
{
  await leerTodo((await sintetizar({ texto: "¿Cómo estás? Muy bien, gracias." })).cuerpo);
  const cuerpo = JSON.parse(ultima().opciones.body);
  probar("texto en español: voz española y lang es", cuerpo.voice === "ef_dora" && cuerpo.lang === "es", ultima().opciones.body);
  // "Mucho gusto" no trae ninguna señal de español para idiomaDe: lo dice quien lo pide.
  await leerTodo((await sintetizar({ texto: "Mucho gusto", idioma: "es" })).cuerpo);
  const explicito = JSON.parse(ultima().opciones.body);
  probar("un idioma explícito manda sobre la detección", explicito.lang === "es" && explicito.voice === "ef_dora", ultima().opciones.body);
}

{
  const r = await sintetizar({ texto: "You went. [ES] Fuiste. [en_us] Great!" });
  await leerTodo(r.cuerpo);
  const cuerpo = JSON.parse(ultima().opciones.body);
  probar(
    "una respuesta mixta va por partes, cada una con su idioma, y con la voz inglesa",
    cuerpo.voice === "af_heart" &&
      !("text" in cuerpo) &&
      JSON.stringify(cuerpo.segments) ===
        JSON.stringify([
          { text: "You went.", lang: "en-US" },
          { text: "Fuiste.", lang: "es" },
          { text: "Great!", lang: "en-US" },
        ]),
    ultima().opciones.body
  );
}

// ---------------------------------------------------------------------
console.log("\nEl texto que se manda:");
probar("se quitan marcas de formato y emojis, y se colapsan espacios", limpiarParaVoz("**Great** job! 🎉\n\nKeep  going.") === "Great job! Keep going.", JSON.stringify(limpiarParaVoz("**Great** job! 🎉\n\nKeep  going.")));
probar("la puntuación se conserva (marca las pausas)", limpiarParaVoz("Hi, Ana! How are you?") === "Hi, Ana! How are you?");
// La API no tiene marcas de pausa: las pausas salen de los signos (octubre de 2026).
probar(
  "un salto de línea sin signo es una pausa: se vuelve punto",
  limpiarParaVoz("Good morning\nHow are you?") === "Good morning. How are you?" &&
    limpiarParaVoz('She says "Hi"\nHe says "Bye."') === 'She says "Hi". He says "Bye."',
  limpiarParaVoz("Good morning\nHow are you?")
);
probar(
  "signos pegados: el punto sobra, los puntos suspensivos se unen",
  puntuarParaVoz("Can I try it on?. Say it.") === "Can I try it on? Say it." &&
    puntuarParaVoz("Yes! Good morning.!") === "Yes! Good morning!" &&
    puntuarParaVoz("Start with: I..") === "Start with: I." &&
    puntuarParaVoz("Wait...") === "Wait…"
);
probar(
  "sin espacio después del signo, se agrega (pero U.S.A. queda igual)",
  puntuarParaVoz("Hi!How are you?Fine.") === "Hi! How are you? Fine." && puntuarParaVoz("I live in the U.S.A. now.") === "I live in the U.S.A. now."
);
probar("conPunto: punto final solo si no hay ningún signo", conPunto("Nice to meet you") === "Nice to meet you." && conPunto("How are you?") === "How are you?" && conPunto("Start with:") === "Start with:");
{
  const tramos = tramosDeVoz("Great job [es] Te entendí [en-US] Now try it!", "en");
  probar(
    "al cambiar de idioma, cada tramo termina en un signo (la pausa)",
    JSON.stringify(tramos) ===
      JSON.stringify([
        { texto: "Great job.", idioma: "en" },
        { texto: "Te entendí.", idioma: "es" },
        { texto: "Now try it!", idioma: "en" },
      ]),
    JSON.stringify(tramos)
  );
}

console.log("\nEl inglés dentro del español:");
const partes = (texto, idioma = "es") =>
  segmentosParaVoz(prepararParaVoz(texto), idioma)
    .segmentos.map((s) => (s.idioma === "en" ? `[${s.texto}]` : s.texto))
    .join(" ");
probar("lo que se explica va en inglés", partes("Para pedir se usa I'd like.") === "Para pedir se usa [I'd like.]", partes("Para pedir se usa I'd like."));
probar("una palabra suelta también", partes("Para un hombre es his; para una mujer, her.") === "Para un hombre es [his;] para una mujer, [her.]", partes("Para un hombre es his; para una mujer, her."));
probar(
  "una dudosa en el borde se queda en español (can no lleva), el sufijo va en inglés",
  partes("Con can el verbo no cambia y can no lleva -s: he can speak.") === "Con [can] el verbo no cambia y [can] no lleva [s: he can speak.]",
  partes("Con can el verbo no cambia y can no lleva -s: he can speak.")
);
probar(
  "lo citado en inglés va en inglés; la pronunciación escrita para leer en español, no",
  partes("Como fue ayer, se dice 'played', con 'ed' al final.") === "Como fue ayer, se dice ['played',] con ['ed'] al final." &&
    partes("Suena 'pleid'.") === "Suena 'pleid'." &&
    partes('Para decir "hay" se usa there is.') === 'Para decir "hay" se usa [there is.]',
  partes("Como fue ayer, se dice 'played', con 'ed' al final.")
);
probar(
  "el español no se toca: 'he comido', la bienvenida",
  partes("Ya he comido arepas hoy.") === "Ya he comido arepas hoy." &&
    partes("¡Hola! Soy Allison, tu profesora de inglés. Vamos a aprender inglés conversando, de forma natural y sin miedo a equivocarnos.") ===
      "¡Hola! Soy Allison, tu profesora de inglés. Vamos a aprender inglés conversando, de forma natural y sin miedo a equivocarnos."
);
probar("un número al final de la frase en inglés va con ella", partes("Para la edad se usa am: I'm 15.") === "Para la edad se usa [am: I'm 15.]", partes("Para la edad se usa am: I'm 15."));
probar("el inglés no se parte: un nombre en español suena con acento inglés", partes("I'm from Bogotá. I love arepas!", "en") === "[I'm from Bogotá. I love arepas!]");
{
  // Todas las explicaciones de A1 y A2 que se dicen en español llevan su inglés aparte.
  const explicaciones = [];
  const recorrer = (v, campo) => {
    if (typeof v === "string") {
      if (campo === "explicacion") explicaciones.push(v);
    } else if (Array.isArray(v)) v.forEach((x) => recorrer(x, campo));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) recorrer(x, k);
  };
  recorrer(todaLaRuta().slice(0, 24), "");
  const sinIngles = explicaciones.filter((x) => !segmentosParaVoz(prepararParaVoz(x), "es").segmentos.some((s) => s.idioma === "en"));
  probar(`las ${explicaciones.length} explicaciones de A1 y A2 llevan su inglés aparte`, explicaciones.length > 30 && !sinIngles.length, sinIngles.join(" | "));
}
{
  await leerTodo((await sintetizar({ texto: "Para pedir se usa I'd like.", idioma: "es" })).cuerpo);
  const cuerpo = JSON.parse(ultima().opciones.body);
  probar(
    "una explicación en español va por partes con la voz española",
    cuerpo.voice === "ef_dora" &&
      JSON.stringify(cuerpo.segments) === JSON.stringify([{ text: "Para pedir se usa", lang: "es" }, { text: "I'd like.", lang: "en-US" }]),
    ultima().opciones.body
  );
}
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
console.log("\nLo que el alumno deja de esperar (tocó otro audio):");
{
  const abiertos = [];
  responder = () => {
    const r = audio(["parte"], { abierta: true });
    abiertos.push(r);
    return r;
  };
  const uno = await sintetizar({ texto: "one" });
  const dos = await sintetizar({ texto: "two" });
  const antes = llamadas.length;
  // Llegan dos más: la primera el alumno la deja (tocó otra etiqueta).
  const corte = new AbortController();
  const t0 = Date.now();
  const dejada = falla(() => sintetizar({ texto: "Orange T-shirt", cancelar: corte.signal }));
  const querida = sintetizar({ texto: "Green hoodie" });
  await dormirPrueba(20);
  corte.abort();
  const e = await dejada;
  probar(
    "la que ya nadie espera sale de la fila al momento con 'cancelado'",
    e instanceof ErrorTts && e.codigo === "cancelado" && !e.reintentable && Date.now() - t0 < 200,
    `${e?.codigo} tras ${Date.now() - t0} ms`
  );
  abiertos[0].cerrarFlujo();
  await leerTodo(uno.cuerpo);
  const g = await querida;
  probar(
    "y el turno que se libera es para la que sí se espera",
    llamadas.length - antes === 1 && JSON.parse(ultima().opciones.body).text === "Green hoodie",
    `${llamadas.length - antes} llamada(s)`
  );
  await dos.cuerpo.cancel();
  await g.cuerpo.cancel();
  probar("sin turnos ocupados después", turnosEnCurso() === 0, String(turnosEnCurso()));

  const ya = new AbortController();
  ya.abort();
  const n = llamadas.length;
  const e2 = await falla(() => sintetizar({ texto: "Yellow T-shirt", cancelar: ya.signal }));
  probar(
    "si ya se había ido, ni toma turno ni llama a la API",
    e2?.codigo === "cancelado" && llamadas.length === n && turnosEnCurso() === 0
  );

  // La API tarda en dar el primer byte y el alumno se va.
  responder = (_url, opciones) =>
    new Promise((_, rechazar) => opciones.signal.addEventListener("abort", () => rechazar(opciones.signal.reason)));
  const corte3 = new AbortController();
  const lenta = falla(() => sintetizar({ texto: "Slow one", cancelar: corte3.signal }));
  await dormirPrueba(20);
  probar("mientras la API responde, ocupa su turno", turnosEnCurso() === 1);
  corte3.abort();
  const e3 = await lenta;
  probar(
    "si el alumno se va, se corta la petición a la API y suelta el turno",
    e3?.codigo === "cancelado" && turnosEnCurso() === 0,
    `${e3?.codigo}, ${turnosEnCurso()} turno(s)`
  );

  // Entre reintentos (un 429 con Retry-After) tampoco se queda esperando.
  responder = () => errorApi(429, "rate_limited", { "Retry-After": "2" });
  const corte4 = new AbortController();
  const n4 = llamadas.length;
  const t4 = Date.now();
  const reintento = falla(() => sintetizar({ texto: "Busy one", cancelar: corte4.signal }));
  await dormirPrueba(50);
  corte4.abort();
  const e4 = await reintento;
  probar(
    "entre reintentos, deja de esperar y no vuelve a llamar",
    e4?.codigo === "cancelado" && llamadas.length - n4 === 1 && Date.now() - t4 < 500 && turnosEnCurso() === 0,
    `${e4?.codigo}, ${llamadas.length - n4} llamada(s) en ${Date.now() - t4} ms`
  );
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
  // (El de arriba ya venció: se piden dos nuevos.)
  const lento = registrarVoz({ userId: "ana", texto: "Hello there", velocidad: 0.8 }, ahora);
  const normal = registrarVoz({ userId: "ana", texto: "Hello there" }, ahora);
  probar(
    "guarda la velocidad pedida (1 si no se pide)",
    vozPedida(lento, "ana", ahora + 1000)?.velocidad === 0.8 && vozPedida(normal, "ana", ahora + 1000)?.velocidad === 1
  );
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nVoz de Allison correcta.");
