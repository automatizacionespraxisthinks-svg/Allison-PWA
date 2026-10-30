/**
 * Cómo se comparan las palabras: minúsculas, sin signos, con las
 * contracciones abiertas y los números en cifras. Lo usan la evaluación
 * (servidor) y las explicaciones previstas (navegador): «He's boring» y
 * «He is boring» son lo mismo en los dos lados (30 de octubre de 2026).
 */
const NUMEROS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", thirteen: "13",
  fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18",
  nineteen: "19", twenty: "20",
  // "It's 9:30" llega en cifras: "thirty" también (antes "thirty" nunca
  // coincidía y Repite lo marcaba aunque se dijera bien).
  thirty: "30", forty: "40", fifty: "50", sixty: "60", seventy: "70", eighty: "80", ninety: "90",
};

/** Quién puede llevar "'s" de "is"/"has" (el resto es posesivo: "Allison's cat"). */
const SUJETOS_S = new Set([
  "he", "she", "it", "what", "that", "there", "here", "who", "where", "how", "when", "this",
  "name", "everyone", "everybody", "someone", "somebody", "nobody", "nothing", "everything",
]);
/** Lo que sigue a "'s"/"'d" cuando es "has"/"had": "He's been…", "She'd already left". */
// "He's ridden a horse" es "he has ridden": antes se abría "he is ridden" y no coincidía (30 de octubre de 2026).
const PIDE_HAS = new Set([
  "been", "got", "gotten", "gone", "done", "had", "already", "never", "just", "ever", "seen", "eaten", "left", "lost", "finished",
  "ridden", "tried", "visited", "flown", "driven", "swum", "forgotten", "met",
]);
const PIDE_HAD = new Set([...PIDE_HAS, "better", "made", "taken", "given", "written", "found", "bought", "brought", "told", "said", "come", "become", "begun", "felt", "kept", "met", "known"]);

/**
 * Una palabra con su contracción abierta. La siguiente decide las que
 * tienen dos lecturas: "he's been" es "he has been" y "he's tired", "he
 * is tired"; "I'd like" es "I would like" y "she'd already left", "she
 * had already left". Abrir solo unas pocas (como antes) marcaba mal
 * respuestas correctas: "I have been studying…" no coincidía con "I've
 * been studying…" (auditoría, 28 de octubre de 2026).
 */
export function abrirContraccion(p: string, siguiente = ""): string[] {
  if (p === "cannot" || p === "can't") return ["can", "not"];
  if (p === "won't") return ["will", "not"];
  if (p === "shan't") return ["shall", "not"];
  if (p === "let's") return ["let", "us"];
  const negada = /^([a-z]+)n't$/.exec(p);
  if (negada) return [negada[1], "not"];
  const m = /^([a-z]+)'(m|re|ve|ll|d|s)$/.exec(p);
  if (!m) return [p];
  const [, base, fin] = m;
  if (fin === "m") return [base, "am"];
  if (fin === "re") return [base, "are"];
  if (fin === "ve") return [base, "have"];
  if (fin === "ll") return [base, "will"];
  if (fin === "d") return [base, PIDE_HAD.has(siguiente) || /ed$/.test(siguiente) ? "had" : "would"];
  return SUJETOS_S.has(base) ? [base, PIDE_HAS.has(siguiente) ? "has" : "is"] : [p];
}

/** Las palabras de un texto, en minúsculas y sin tildes ni signos (con su apóstrofo). */
export function palabrasCrudas(texto: string): string[] {
  return (
    texto
      .toLowerCase()
      // Sin tildes: "café" y "cafe" son la misma palabra (antes la tilde
      // se borraba con la letra y "café" quedaba "caf").
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[’‘`´]/g, "'")
      // "ten o'clock" nombra el reloj del dibujo: cuenta como "clock".
      .replace(/\bo'clock\b/g, "o clock")
      .replace(/[^a-z0-9' ]+/g, " ")
      .split(/\s+/)
      // Comillas simples alrededor de una palabra ('played'), no apóstrofos.
      .map((p) => p.replace(/^'+|'+$/g, ""))
      .filter(Boolean)
  );
}

/** En cifras, y "twenty five" como "25" (la transcripción escribe "25"). */
export function enCifras(palabras: string[]): string[] {
  const salida: string[] = [];
  for (const p of palabras.map((x) => NUMEROS[x] ?? x)) {
    const antes = salida[salida.length - 1] ?? "";
    if (/^[2-9]0$/.test(antes) && /^[1-9]$/.test(p)) salida[salida.length - 1] = String(Number(antes) + Number(p));
    else salida.push(p);
  }
  // "oh" es cero solo entre números ("three one oh five"); suelto es
  // una exclamación ("Oh, nice!").
  return salida.map((p, i, todas) => (p === "oh" && (/^\d+$/.test(todas[i - 1] ?? "") || /^\d+$/.test(todas[i + 1] ?? "")) ? "0" : p));
}

/** Minúsculas, sin puntuación, con contracciones abiertas y números en cifras. */
export function normalizar(texto: string): string {
  const crudas = palabrasCrudas(texto);
  const abiertas = crudas.flatMap((p, i) => abrirContraccion(p, crudas[i + 1]));
  return ` ${enCifras(abiertas).join(" ")} `;
}
