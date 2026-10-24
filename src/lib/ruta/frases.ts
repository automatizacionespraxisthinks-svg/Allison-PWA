import type { PasoDeRuta } from "./index.ts";
import { contenidoDe } from "./estado.ts";

/**
 * Las frases de una parada con su traducción aprobada: lo que se oye en
 * Escucha y elige y lo que se dice en Dilo en inglés. Las usa la Guía de
 * frases (pantalla 7). La frase del día ya no sale de aquí: es una
 * expresión de los nativos (src/lib/expresiones.ts).
 */
export interface Frase {
  en: string;
  es: string;
  leccion: number;
}

/**
 * Lo que dice alguien en una línea contada ('Sarah says: "Hi, I'm
 * Sarah."' → "Hi, I'm Sarah."; igual en español). Null si no es una cita.
 */
export function citaDe(linea: string): string | null {
  return linea.match(/^[^"]*:\s*"(.+)"\s*$/)?.[1] ?? null;
}

export function frasesDe(paso: PasoDeRuta): Frase[] {
  const vistas = new Set<string>();
  const frases: Frase[] = [];
  for (const l of contenidoDe(paso).lecciones) {
    for (const a of l.actividades) {
      const pares: { en: string; es: string }[] =
        a.tipo === "escucha-elige"
          ? a.audio.flatMap((linea, i) => {
              const es = a.traduccion[i] ?? "";
              // Lo contado se aprende como lo que dice la persona, sin "Sarah says:".
              const enCita = citaDe(linea);
              if (!enCita) return [{ en: linea, es }];
              const esCita = citaDe(es);
              return esCita ? [{ en: enCita, es: esCita }] : [];
            })
          : a.tipo === "dilo"
            ? [{ en: a.respuesta, es: a.espanol }]
            : [];
      for (const p of pares) {
        const clave = p.en.toLowerCase();
        // Sin repetidas, solo las que tienen su traducción y completas
        // ("Her name is…" espera la respuesta de la actividad).
        if (!p.es || vistas.has(clave) || /…$/.test(p.en)) continue;
        vistas.add(clave);
        frases.push({ ...p, leccion: l.numero });
      }
    }
  }
  return frases;
}
