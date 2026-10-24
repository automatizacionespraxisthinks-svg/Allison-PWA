/**
 * La limpieza de lo que el modelo "oyó" en el audio del alumno. La usan
 * todas las partes que transcriben: Hablar (allison.ts), las escenas
 * (ruta/escena.ts) y la evaluación corta de las lecciones (evaluacion.ts).
 */

/**
 * Una marca de tiempo del audio ("00:01", "0:05", "[00:02]"): con un
 * audio en silencio o con ruido, el modelo devuelve marcas en vez de
 * dejar la transcripción vacía ("00:00 00:01 00:02"), y a veces las
 * intercala en lo que sí se oyó. Siempre empiezan con cero (un audio dura
 * a lo sumo 60 segundos), así que una hora que el alumno dijo ("7:30",
 * "10:00") no se confunde con ellas.
 */
const MARCA_DE_TIEMPO = /^[[(]?0\d?:\d{2}(?::\d{2})?(?:\.\d+)?[\])]?[,.;]?$/;

/**
 * Lo que el modelo escribe cuando no hubo voz, en vez de dejarlo vacío:
 * notas entre corchetes o paréntesis ("[silence]", "(inaudible)",
 * "[Música]") y esas mismas palabras sueltas. Un alumno no dice nada
 * entre corchetes.
 */
const NOTA = /\[[^\]]*\]|\((?:[^)]*?\b(?:silence|silencio|inaudible|unintelligible|noise|ruido|music|música|musica|no speech|sin voz|background)\b[^)]*)\)/gi;
const SOLO_NOTA = /^(?:silence|silencio|inaudible|unintelligible|noise|ruido|music|música|musica|no speech|sin voz)[.!]?$/i;

/**
 * Sin marcas de tiempo, notas de "no hubo voz" ni el eco duplicado ("X
 * X": cuando el modelo alucina, a veces pega la misma frase dos veces
 * seguidas; ninguna frase real de más de doce letras es idéntica a su
 * propia segunda mitad), y con los apóstrofos curvos como rectos ("I’m").
 * Si no queda nada, es que no se oyó voz: "".
 */
export function limpiarTranscripcion(t: string): string {
  const sinNotas = t.replace(/[‘’]/g, "'").replace(NOTA, " ");
  const limpio = sinNotas
    .split(/\s+/)
    .filter((p) => p && !MARCA_DE_TIEMPO.test(p))
    .join(" ")
    .trim();
  if (SOLO_NOTA.test(limpio)) return "";

  const mitad = Math.floor(limpio.length / 2);
  const a = limpio.slice(0, mitad).trim().toLowerCase();
  const b = limpio.slice(limpio.length - mitad).trim().toLowerCase();
  if (a.length > 12 && a === b) return limpio.slice(0, mitad).trim();

  // Lo que queda sin letras ni números ("…", "-") tampoco es voz.
  return /[\p{L}\p{N}]/u.test(limpio) ? limpio : "";
}
