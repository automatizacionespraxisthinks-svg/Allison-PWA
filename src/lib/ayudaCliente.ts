"use client";

import { pedir } from "./pedir";

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

export type ResultadoAyuda = { ok: true; ayuda: Ayuda; cobrada: boolean } | { ok: false; sinSaldo: boolean };

const guardadas = new Map<string, Ayuda>();

export async function pedirAyudaIA(texto: string, nivel: string, tarea?: string, signal?: AbortSignal): Promise<ResultadoAyuda> {
  const clave = `${nivel}\n${tarea ?? ""}\n${texto}`;
  const guardada = guardadas.get(clave);
  if (guardada) return { ok: true, ayuda: guardada, cobrada: false };
  const r = await pedir("/api/ayuda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, nivel, ...(tarea ? { tarea } : {}) }),
    signal,
  });
  if (!r) return { ok: false, sinSaldo: false };
  if (r.status === 402) return { ok: false, sinSaldo: true };
  if (!r.ok) return { ok: false, sinSaldo: false };
  const d = (await r.json().catch(() => null)) as Ayuda | null;
  if (!d) return { ok: false, sinSaldo: false };
  guardadas.set(clave, d);
  return { ok: true, ayuda: d, cobrada: true };
}
