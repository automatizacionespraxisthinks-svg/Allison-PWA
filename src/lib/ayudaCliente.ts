"use client";

import { pedir, SESION_CERRADA } from "./pedir";

/**
 * La ayuda de rescate (/api/ayuda) desde la pantalla. Cuesta una
 * intervención (29 de octubre de 2026) y una sola llamada trae la
 * traducción y la idea: se guardan por mensaje, así que traducir lo que
 * dijo Allison y después pedir la idea para responderle cobra una vez.
 */
export interface Ayuda {
  traduccion: string;
  sugerencia: string;
  sugerenciaEs: string;
  /** Las intervenciones que le quedan después de cobrar esta. */
  restantes?: number;
}

/**
 * `mensaje`: qué decirle al alumno cuando no se pudo. Antes la pantalla
 * no decía nada (el bombillo mostraba "…" y después nada; auditoría, 30
 * de octubre de 2026).
 */
export type ResultadoAyuda = { ok: true; ayuda: Ayuda; cobrada: boolean } | { ok: false; sinSaldo: boolean; mensaje: string };

const guardadas = new Map<string, Ayuda>();

export async function pedirAyudaIA(texto: string, nivel: string, tarea?: string, signal?: AbortSignal): Promise<ResultadoAyuda> {
  const clave = `${nivel}\n${tarea ?? ""}\n${texto}`;
  const guardada = guardadas.get(clave);
  if (guardada) return { ok: true, ayuda: guardada, cobrada: false };
  // pedir() ya lleva a /entrar si la sesión se cerró.
  const r = await pedir("/api/ayuda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, nivel, ...(tarea ? { tarea } : {}) }),
    signal,
  });
  if (!r) return { ok: false, sinSaldo: false, mensaje: "Sin conexión. Revisa tu internet e intenta otra vez." };
  if (r.status === 401) return { ok: false, sinSaldo: false, mensaje: SESION_CERRADA };
  if (r.status === 402) return { ok: false, sinSaldo: true, mensaje: "Te quedaste sin intervenciones." };
  if (r.status === 429) return { ok: false, sinSaldo: false, mensaje: "Espera un momento e intenta otra vez." };
  const d = (await r.json().catch(() => null)) as (Ayuda & { mensaje?: string }) | null;
  if (!r.ok || !d) {
    // El 502 del servidor ya dice que no se cobró.
    return { ok: false, sinSaldo: false, mensaje: d?.mensaje ?? "No pudimos traer la ayuda. Intenta otra vez." };
  }
  guardadas.set(clave, d);
  return { ok: true, ayuda: d, cobrada: true };
}
