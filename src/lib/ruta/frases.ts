import type { Nivel } from "../tipos.ts";
import { rutaDe, type PasoDeRuta } from "./index.ts";
import { contenidoDe } from "./estado.ts";

/**
 * Las frases de una parada con su traducción aprobada: lo que se oye en
 * Escucha y elige y lo que se dice en Dilo en inglés. Las usan la Guía
 * de frases (pantalla 7) y la frase del día.
 */
export interface Frase {
  en: string;
  es: string;
  leccion: number;
}

export function frasesDe(paso: PasoDeRuta): Frase[] {
  const vistas = new Set<string>();
  const frases: Frase[] = [];
  for (const l of contenidoDe(paso).lecciones) {
    for (const a of l.actividades) {
      const pares =
        a.tipo === "escucha-elige"
          ? a.audio.map((en, i) => ({ en, es: a.traduccion[i] ?? "" }))
          : a.tipo === "dilo"
            ? [{ en: a.respuesta, es: a.espanol }]
            : [];
      for (const p of pares) {
        const clave = p.en.toLowerCase();
        // Sin repetidas, y solo las que tienen su traducción.
        if (!p.es || vistas.has(clave)) continue;
        vistas.add(clave);
        frases.push({ ...p, leccion: l.numero });
      }
    }
  }
  return frases;
}

/** Días desde una fecha fija: el mismo número para todos el mismo día. */
function diaDe(fecha: string): number {
  return Math.floor(Date.parse(`${fecha}T12:00:00Z`) / 86_400_000);
}

/**
 * La frase del día (plan, sección 10): una frase distinta cada día, con
 * audio y gratis, en el globo de Allison en Mi ruta. Sale de las paradas
 * a las que el alumno ya llegó (hasta la que va), así suena conocida y
 * útil; cambia cada día y no se repite hasta pasar por todas.
 */
export function fraseDelDia(nivel: Nivel, hastaParada: number, fecha: string): Frase | null {
  const ruta = rutaDe(nivel);
  if (!ruta) return null;
  const frases = ruta.slice(0, Math.max(1, hastaParada + 1)).flatMap(frasesDe);
  if (!frases.length) return null;
  return frases[diaDe(fecha) % frases.length];
}
