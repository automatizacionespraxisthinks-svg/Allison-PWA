"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * La primera vez que un alumno abre Allison.
 *
 * Un audio en ESPAÑOL, no en inglés: un principiante que aterriza en una
 * explicación en inglés no entiende nada y se va. Allison se presenta,
 * cuenta cómo funciona y termina con una pregunta, para que el alumno
 * tenga algo concreto que responder en vez de una pantalla en blanco.
 *
 * Se guarda en el navegador que ya se vio. No se pone en la base de
 * datos a propósito: es una preferencia de este dispositivo, y si el
 * navegador la pierde, volver a oírla no le hace daño a nadie.
 */
const CLAVE = "allison:bienvenida-vista";

/**
 * El guion se lee con la voz del navegador y no desde un archivo.
 *
 * Un WAV de 38 segundos pesa 1,2 MB. Descargarlo en la primera pantalla,
 * con datos móviles colombianos, es justo lo que hace que alguien cierre
 * la app antes de empezar. La voz del navegador pesa cero.
 *
 * Cuando esté el TTS del VPS, esto se reemplaza por un archivo
 * comprimido con la voz real de Allison, que sí vale su peso.
 */
const GUION = `¡Hola! Soy Allison, tu profesora de inglés.
Vamos a aprender inglés conversando, de forma natural y sin miedo a equivocarnos.
Para empezar, toca el botón verde y háblame en inglés, como si estuviéramos charlando.
Mientras hablamos voy notando qué se te dificulta, y lo vamos trabajando poco a poco.
No tienes que hablar perfecto. Lo importante es que te animes a hablar.
¿Empezamos? Cuéntame, ¿cómo estás hoy?`;

/**
 * Se lee con useSyncExternalStore y no con un efecto.
 *
 * localStorage no existe en el servidor. Leerlo dentro de un efecto
 * obliga a cambiar el estado justo después de pintar, lo que provoca un
 * repintado en cascada y un parpadeo. Así el servidor devuelve "ya
 * vista" -- no pinta nada -- y el navegador lee el valor real sin que
 * las dos versiones se contradigan.
 */
const oyentes = new Set<() => void>();

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

function yaLaVio(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== null;
  } catch {
    // Navegador con el almacenamiento bloqueado: se muestra.
    return false;
  }
}

export function Bienvenida({ nombre }: { nombre: string }) {
  const vista = useSyncExternalStore(suscribir, yaLaVio, () => true);
  const [sonando, setSonando] = useState(false);

  function cerrar() {
    window.speechSynthesis?.cancel();
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      // Sin almacenamiento la verá otra vez. No es grave.
    }
    for (const avisar of oyentes) avisar();
  }

  function reproducir() {
    if (sonando) {
      window.speechSynthesis?.cancel();
      setSonando(false);
      return;
    }

    if (!window.speechSynthesis) return;

    const voz = new SpeechSynthesisUtterance(GUION);
    // Voz en español si el dispositivo tiene alguna; si no, la del sistema
    const enEspanol = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith("es"));
    if (enEspanol) voz.voice = enEspanol;
    voz.lang = enEspanol?.lang ?? "es-CO";
    voz.rate = 1;
    voz.onend = () => setSonando(false);
    voz.onerror = () => setSonando(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(voz);
    setSonando(true);
  }

  if (vista) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-superficie p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div
            role="img"
            aria-label="Allison"
            className="size-24 rounded-full border-4 border-primario bg-primario-suave bg-cover bg-center"
            style={{ backgroundImage: "url('/allison.png')" }}
          />
          <h2 className="mt-4 text-xl font-bold">
            Hola {nombre.split(" ")[0]}, soy Allison
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-texto-suave">
            Escúchame un momento y te explico cómo vamos a trabajar. Es
            rápido, y en español.
          </p>
        </div>

        <button
          type="button"
          onClick={reproducir}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primario px-6 py-4 text-lg font-semibold text-white transition hover:brightness-110"
        >
          {sonando ? (
            <>
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
              Pausar
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Escuchar a Allison
            </>
          )}
        </button>

        <ul className="mt-5 flex flex-col gap-2.5 text-sm">
          {[
            ["🎤", "Toca el botón verde y háblame en inglés"],
            ["✅", "Si te equivocas, te corrijo y seguimos"],
            ["🔁", "¿No entendiste? Toca Repetir o Qué dijo"],
            ["💡", "¿No sabes qué decir? Te doy una idea"],
          ].map(([icono, texto]) => (
            <li key={texto} className="flex items-start gap-2.5">
              <span aria-hidden className="text-base leading-tight">
                {icono}
              </span>
              <span className="leading-snug">{texto}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={cerrar}
          className="mt-5 w-full rounded-2xl border border-borde px-6 py-3 font-medium transition hover:bg-superficie-2"
        >
          Entendido, vamos a hablar
        </button>
      </div>
    </div>
  );
}
