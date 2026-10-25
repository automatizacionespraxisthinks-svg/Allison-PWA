"use client";

import type { IdiomaVoz, SegmentoVoz } from "./habla";

/**
 * La voz del NAVEGADOR: el respaldo cuando la API de voz no responde.
 *
 * Fue la voz de Allison hasta septiembre de 2026. Se conserva entera
 * porque, cuando la API está caída, ocupada o sin configurar, oír a
 * Allison con una voz peor es mejor que no oírla. Quien la usa es
 * src/lib/voz.ts, que lo deja dicho en la consola cada vez.
 *
 * Hablar con speechSynthesis "a secas" falla de maneras distintas según
 * el navegador. Los cuatro fallos reales que este módulo tapa:
 *
 * 1. cancel() seguido de speak() en la misma vuelta: Chrome a veces
 *    descarta el speak nuevo. Aquí solo se cancela si algo suena, y el
 *    speak espera unos milisegundos.
 * 2. El motor exige un speak() DURANTE un gesto del usuario para
 *    "desbloquearse" (iOS y algunos Android). La respuesta de Allison
 *    llega segundos después del gesto, así que desbloquearVozNavegador()
 *    habla en silencio en el momento del toque.
 * 3. En el primer uso getVoices() está vacío y el navegador puede caer
 *    en la voz del sistema — en un teléfono colombiano, una voz en
 *    ESPAÑOL leyendo inglés. Se esperan las voces (con tope) y se
 *    elige una del idioma pedido.
 * 4. Chrome a veces deja el motor en pausa y el speak queda mudo:
 *    resume() al arrancar y un latido que insiste mientras suena.
 *
 * Y si aun así el navegador falla, se reintenta UNA vez: la mayoría de
 * los fallos de arranque son transitorios.
 */

const hayVoz = () => typeof window !== "undefined" && "speechSynthesis" in window;

let desbloqueada = false;
let latidoActivo: number | null = null;

export function desbloquearVozNavegador(): void {
  if (desbloqueada || !hayVoz()) return;
  desbloqueada = true;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
    // Algunos navegadores solo empiezan a cargar las voces al pedirlas
    window.speechSynthesis.getVoices();
  } catch {
    desbloqueada = false;
  }
}

/** Android reporta "en_US" con guion bajo; se normaliza antes de comparar. */
const lengua = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");

/**
 * Voces de mujer y de hombre por su nombre, en Windows, Mac, iPhone y
 * Chrome. Solo habla Allison: una voz de hombre para el español (en
 * Windows la de por defecto es "Microsoft Raul") sonaba a otra persona.
 */
const VOZ_DE_MUJER =
  /\b(female|zira|aria|jenny|hazel|susan|heera|sabina|helena|laura|dalia|elvira|paloma|salome|catalina|samantha|victoria|karen|moira|tessa|fiona|allison|ava|zoe|nicky|paulina|m[oó]nica|marisol|soledad|isabela|francisca|ang[eé]lica|google us english|google español)\b/i;
const VOZ_DE_HOMBRE =
  /\b(male|david|mark|guy|george|ra[uú]l|pablo|jorge|juan|diego|carlos|alex|daniel|fred|tom|aaron|arthur|gordon|rishi|[aá]lvaro|enrique)\b/i;

function mejorVoz(idioma: IdiomaVoz): SpeechSynthesisVoice | null {
  const preferida = idioma === "es" ? "es-co" : "en-us";
  const delIdioma = window.speechSynthesis.getVoices().filter((v) => lengua(v).startsWith(idioma));
  // Primero que sea de mujer; después el acento (es-CO, en-US); la de
  // Google es la buena en Chrome, y la del sistema desempata.
  const puntaje = (v: SpeechSynthesisVoice) =>
    (VOZ_DE_MUJER.test(v.name) ? 3 : VOZ_DE_HOMBRE.test(v.name) ? -3 : 0) +
    (lengua(v).startsWith(preferida) ? 2 : 0) +
    (v.name.includes("Google") ? 1 : 0) +
    (v.default ? 0.5 : 0);
  return delIdioma.reduce<SpeechSynthesisVoice | null>((mejor, v) => (!mejor || puntaje(v) > puntaje(mejor) ? v : mejor), null);
}

/** Espera a que el navegador cargue las voces, con tope: hablar tarde
 *  es mejor que no hablar. */
function conVoces(maxMs = 1200): Promise<void> {
  const s = window.speechSynthesis;
  if (s.getVoices().length > 0) return Promise.resolve();

  return new Promise((resolver) => {
    const listo = () => {
      s.removeEventListener("voiceschanged", listo);
      clearTimeout(tope);
      resolver();
    };
    const tope = setTimeout(listo, maxMs);
    s.addEventListener("voiceschanged", listo);
    s.getVoices();
  });
}

/**
 * Dice las partes de un texto una tras otra, cada una con la voz de su
 * idioma: el español con una voz en español y el inglés con una en
 * inglés. Antes lo leía todo una voz inglesa, marcadores incluidos
 * ("[es] En inglés se dice así…"). Para si una parte no suena (la
 * cortaron) o si `vigente` dice que ya se pidió otra cosa.
 */
export async function hablarSegmentosConNavegador(
  segmentos: SegmentoVoz[],
  ritmo = 1,
  alEmpezar?: () => void,
  vigente: () => boolean = () => true
): Promise<boolean> {
  let primero = true;
  for (const s of segmentos) {
    if (!vigente()) return false;
    const ok = await hablarConNavegador(s.texto, s.idioma, ritmo, primero ? alEmpezar : undefined);
    if (!ok) return false;
    primero = false;
  }
  return !primero;
}

/** Corta lo que esté sonando (y su latido). */
export function detenerVozNavegador(): void {
  if (!hayVoz()) return;
  if (latidoActivo !== null) {
    clearInterval(latidoActivo);
    latidoActivo = null;
  }
  window.speechSynthesis.cancel();
}

/**
 * Dice un texto con la voz del navegador. Resuelve cuando termina de
 * sonar; false si el navegador no lo dejó sonar.
 */
function hablarConNavegador(
  texto: string,
  idioma: IdiomaVoz,
  ritmo = 1,
  alEmpezar?: () => void
): Promise<boolean> {
  if (!hayVoz() || !texto.trim()) return Promise.resolve(false);
  const s = window.speechSynthesis;

  return new Promise((resolver) => {
    const decir = (esReintento: boolean) => {
      const voz = new SpeechSynthesisUtterance(texto);
      voz.lang = idioma === "es" ? "es-CO" : "en-US";
      const elegida = mejorVoz(idioma);
      if (elegida) {
        voz.voice = elegida;
        voz.lang = elegida.lang;
      }
      voz.rate = ritmo;

      // Cada intento lleva SU latido y limpia solo el suyo: si uno
      // viejo limpiara el del nuevo, el nuevo quedaría sin seguro
      // contra la pausa fantasma de Chrome.
      const latido = window.setInterval(() => s.resume(), 5000);
      latidoActivo = latido;
      const soltar = () => {
        window.clearInterval(latido);
        if (latidoActivo === latido) latidoActivo = null;
      };

      voz.onstart = () => alEmpezar?.();
      voz.onend = () => {
        soltar();
        resolver(true);
      };
      voz.onerror = (e) => {
        soltar();
        const cortada = e.error === "canceled" || e.error === "interrupted";
        if (esReintento || cortada) {
          resolver(false);
          return;
        }
        // Fallo transitorio de arranque: limpiar y probar UNA vez más
        s.cancel();
        setTimeout(() => decir(true), 250);
      };

      s.speak(voz);
      s.resume();
    };

    void conVoces().then(() => {
      if (s.speaking || s.pending) {
        // Nunca speak() pegado al cancel(): Chrome se traga el nuevo
        s.cancel();
        setTimeout(() => decir(false), 80);
      } else {
        decir(false);
      }
    });
  });
}
