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
 */
export async function pedir(
  url: string,
  opciones?: RequestInit
): Promise<Response | null> {
  try {
    return await fetch(url, opciones);
  } catch {
    return null;
  }
}
