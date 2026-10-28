/**
 * Animaciones y sonidos (plan, sección 11): cortos, al completar pasos, y
 * se pueden apagar desde Perfil · Ajustes. Los sonidos se sintetizan con
 * Web Audio (unas notas de campana): no hay archivos que descargar ni
 * audios nuevos que grabar (plan, sección 20).
 *
 * Las preferencias son de cada aparato (localStorage): quien practica en
 * el computador del colegio en silencio no apaga el sonido de su celular.
 */

const CLAVE_SONIDOS = "allison-sonidos";
const CLAVE_ANIMACIONES = "allison-animaciones";

function leer(clave: string): boolean {
  try {
    return localStorage.getItem(clave) !== "0";
  } catch {
    return true;
  }
}

function guardar(clave: string, valor: boolean) {
  try {
    localStorage.setItem(clave, valor ? "1" : "0");
  } catch {
    // Navegación privada o almacenamiento bloqueado: se queda como está.
  }
}

export const sonidosActivos = () => leer(CLAVE_SONIDOS);
export const animacionesActivas = () => leer(CLAVE_ANIMACIONES);

export function fijarSonidos(activos: boolean) {
  guardar(CLAVE_SONIDOS, activos);
}

/** Con las animaciones apagadas, todo se queda quieto (globals.css: [data-quieto]). */
export function fijarAnimaciones(activas: boolean) {
  guardar(CLAVE_ANIMACIONES, activas);
  aplicarAnimaciones();
}

export function aplicarAnimaciones() {
  if (typeof document === "undefined") return;
  if (animacionesActivas()) document.documentElement.removeAttribute("data-quieto");
  else document.documentElement.setAttribute("data-quieto", "");
}

let contexto: AudioContext | null = null;

/** Una nota corta de campana. */
function nota(ctx: AudioContext, frecuencia: number, inicio: number, duracion: number, volumen: number) {
  const osc = ctx.createOscillator();
  const gan = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frecuencia;
  gan.gain.setValueAtTime(0, inicio);
  gan.gain.linearRampToValueAtTime(volumen, inicio + 0.015);
  gan.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  osc.connect(gan).connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.05);
}

/**
 * "acierto": dos notas que suben, al responder bien.
 * "logro": tres notas, al terminar una lección, ganar una estampilla o
 * celebrar la racha.
 * "listo": un tic corto y agudo, cuando el micrófono ya graba: "habla ahora".
 */
export function sonar(tipo: "acierto" | "logro" | "listo") {
  if (typeof window === "undefined" || !sonidosActivos()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    contexto ??= new Ctx();
    const ctx = contexto;
    void ctx.resume();
    const t = ctx.currentTime + 0.02;
    if (tipo === "listo") {
      nota(ctx, 1318.5, t, 0.12, 0.09);
    } else if (tipo === "acierto") {
      nota(ctx, 880, t, 0.25, 0.12);
      nota(ctx, 1318.5, t + 0.09, 0.35, 0.1);
    } else {
      nota(ctx, 659.25, t, 0.3, 0.1);
      nota(ctx, 880, t + 0.11, 0.3, 0.1);
      nota(ctx, 1318.5, t + 0.22, 0.5, 0.09);
    }
  } catch {
    // Sin Web Audio: la app sigue en silencio.
  }
}
