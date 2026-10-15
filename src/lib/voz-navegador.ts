"use client";

import type { IdiomaVoz } from "./habla";

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

function mejorVoz(idioma: IdiomaVoz): SpeechSynthesisVoice | null {
  const todas = window.speechSynthesis.getVoices();
  const preferida = idioma === "es" ? "es-co" : "en-us";
  const exactas = todas.filter((v) => lengua(v).startsWith(preferida));
  const delIdioma = todas.filter((v) => lengua(v).startsWith(idioma));

  return (
    // La de Google es la buena en Chrome; la default del sistema después
    exactas.find((v) => v.name.includes("Google")) ??
    exactas.find((v) => v.default) ??
    exactas[0] ??
    delIdioma.find((v) => v.name.includes("Google")) ??
    delIdioma[0] ??
    null
  );
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
export function hablarConNavegador(
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
