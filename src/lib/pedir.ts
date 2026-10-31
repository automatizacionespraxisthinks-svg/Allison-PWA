"use client";

/**
 * fetch que no revienta.
 *
 * Todos los botones de la app llamaban a fetch directo, y un tirón de
 * la red móvil en ese preciso instante hacía explotar la promesa: la
 * función moría en silencio y el botón quedaba en "Cargando…" para
 * siempre. La novena auditoría encontró el mismo defecto en dieciséis
 * sitios — una clase de error se arregla UNA vez, aquí, no dieciséis
 * veces allá.
 *
 * Sin red devuelve null; quien llama pregunta r?.ok y decide el
 * mensaje. El público de Allison está en datos móviles colombianos:
 * la red que se cae un segundo no es el caso raro, es el caso normal.
 *
 * Con la sesión cerrada (401) lleva a /entrar: ver sesionCerrada.
 */
export async function pedir(
  url: string,
  opciones?: RequestInit
): Promise<Response | null> {
  try {
    const r = await fetch(url, opciones);
    sesionCerrada(r);
    return r;
  } catch {
    return null;
  }
}

/** Lo que se le dice al alumno mientras se va a /entrar. */
export const SESION_CERRADA = "Tu sesión se cerró. Entra de nuevo.";

let saliendo = false;

/**
 * ¿La sesión se cerró? Todas las rutas del alumno responden 401 "Sin
 * sesión" cuando la cookie venció o cuando la app cerró las demás
 * sesiones a propósito (cambió la contraseña en otro equipo,
 * src/lib/sesion.ts). Ninguna pantalla lo miraba: decían "revisa tu
 * conexión" y el Reintentar fallaba para siempre (auditoría, 30 de
 * octubre de 2026). Ahora cualquier 401 lleva a /entrar, que dice por
 * qué; quien llama puede mostrar SESION_CERRADA mientras tanto.
 *
 * Es una navegación completa (no router.push) a propósito: sin sesión,
 * nada de lo que hay en memoria sirve, y la pantalla de entrar arranca
 * limpia.
 */
export function sesionCerrada(r: Response | null | undefined): boolean {
  if (r?.status !== 401) return false;
  if (!saliendo && typeof window !== "undefined" && !window.location.pathname.startsWith("/entrar")) {
    // Varias peticiones pueden fallar a la vez (la voz, la evaluación):
    // se navega una sola vez.
    saliendo = true;
    // Completa a propósito (ver arriba), y aquí, fuera de un componente, no hay router.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/entrar?aviso=sesion");
  }
  return true;
}
