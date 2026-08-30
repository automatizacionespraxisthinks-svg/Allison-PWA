"use client";

import type { Nivel } from "./tipos";

/**
 * La voz de Allison — PROVISIONAL sobre la voz del navegador, hasta
 * que el TTS del VPS esté conectado.
 *
 * Este módulo existe porque hablar con speechSynthesis "a secas" falla
 * de maneras distintas según el navegador, y cada fallo es un alumno
 * convencido de que la app está rota. Los cuatro fallos reales que
 * este módulo tapa:
 *
 * 1. cancel() seguido de speak() en la misma vuelta: Chrome a veces
 *    descarta el speak nuevo. Aquí solo se cancela si algo suena, y el
 *    speak espera unos milisegundos.
 * 2. El motor exige un speak() DURANTE un gesto del usuario para
 *    "desbloquearse" (iOS y algunos Android). La respuesta de Allison
 *    llega segundos después del gesto, así que desbloquearVoz() habla
 *    en silencio en el momento del toque.
 * 3. En el primer uso getVoices() está vacío y el navegador puede caer
 *    en la voz del sistema — en un teléfono colombiano, una voz en
 *    ESPAÑOL leyendo inglés. Se esperan las voces (con tope) y se
 *    elige una en-US de verdad.
 * 4. Chrome a veces deja el motor en pausa y el speak queda mudo:
 *    resume() al arrancar y un latido que insiste mientras suena.
 *
 * Y si aun así el navegador falla, se reintenta UNA vez: la mayoría de
 * los fallos de arranque son transitorios.
 */

const hayVoz = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

let desbloqueada = false;
let latidoActivo: number | null = null;

/**
 * Llamar en un gesto REAL del usuario (tocar grabar, enviar texto).
 * Habla un espacio a volumen cero: inaudible, pero cuenta como el
 * speak-con-gesto que iOS y Android exigen para permitir los
 * siguientes sin gesto. Una vez por página basta.
 */
export function desbloquearVoz(): void {
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

/** La base por nivel: un A1 oye más lento que un C1. */
export function velocidadBase(nivel: Nivel): number {
  return nivel === "A1" ? 0.8 : nivel === "A2" ? 0.9 : 1;
}

/** Android reporta "en_US" con guion bajo; se normaliza antes de comparar. */
const lengua = (v: SpeechSynthesisVoice) =>
  v.lang.toLowerCase().replace("_", "-");

function mejorVozIngles(): SpeechSynthesisVoice | null {
  const todas = window.speechSynthesis.getVoices();
  const enUS = todas.filter((v) => lengua(v).startsWith("en-us"));
  const en = todas.filter((v) => lengua(v).startsWith("en"));

  return (
    // La de Google es la buena en Chrome; la default del sistema después
    enUS.find((v) => v.name.includes("Google")) ??
    enUS.find((v) => v.default) ??
    enUS[0] ??
    en[0] ??
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
export function detenerVoz(): void {
  if (!hayVoz()) return;
  if (latidoActivo !== null) {
    clearInterval(latidoActivo);
    latidoActivo = null;
  }
  window.speechSynthesis.cancel();
}

/**
 * Dice un texto en inglés. Resuelve cuando termina de sonar; false si
 * el navegador no lo dejó sonar (el alumno siempre tiene el botón ▶
 * en el mensaje para oírlo con su propio gesto).
 */
export function hablarIngles(
  texto: string,
  nivel: Nivel,
  velocidad = 1
): Promise<boolean> {
  if (!hayVoz() || !texto.trim()) return Promise.resolve(false);
  const s = window.speechSynthesis;

  return new Promise((resolver) => {
    const decir = (esReintento: boolean) => {
      const voz = new SpeechSynthesisUtterance(texto);
      voz.lang = "en-US";
      const elegida = mejorVozIngles();
      if (elegida) {
        voz.voice = elegida;
        voz.lang = elegida.lang;
      }
      voz.rate = velocidadBase(nivel) * velocidad;

      // Cada intento lleva SU latido y limpia solo el suyo: si uno
      // viejo limpiara el del nuevo, el nuevo quedaría sin seguro
      // contra la pausa fantasma de Chrome.
      const latido = window.setInterval(() => s.resume(), 5000);
      latidoActivo = latido;
      const soltar = () => {
        window.clearInterval(latido);
        if (latidoActivo === latido) latidoActivo = null;
      };

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
