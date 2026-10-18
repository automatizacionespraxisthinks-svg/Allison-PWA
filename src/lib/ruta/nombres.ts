import type { TipoActividad } from "./tipos.ts";

/**
 * Los nombres de las actividades, aparte del contenido: las pantallas del
 * navegador los usan sin cargar todas las paradas.
 */

export const NOMBRE_ACTIVIDAD: Record<TipoActividad, string> = {
  "escucha-elige": "Escucha y elige",
  "que-es-esto": "¿Qué es esto?",
  repite: "Repite",
  "tu-turno": "Tu turno en el diálogo",
  dilo: "Dilo en inglés",
  describe: "Describe la imagen",
  responde: "Responde rápido",
  entrevista: "Entrevista a Allison",
  adivina: "Adivina",
  cuentame: "Cuéntame",
  narra: "Narra la secuencia",
  ensenale: "Enséñale a Allison",
};

/** El nombre corto, para el globo del mapa ("Lección 2 · Tu turno"). */
export const NOMBRE_CORTO: Record<TipoActividad, string> = {
  ...NOMBRE_ACTIVIDAD,
  "tu-turno": "Tu turno",
  describe: "Describe",
  entrevista: "Entrevista",
  narra: "Narra",
  ensenale: "Enséñale",
};

/** Las que pasan por un prompt: cada comprobación es una intervención. */
export function usaIntervenciones(tipo: TipoActividad): boolean {
  return tipo !== "escucha-elige" && tipo !== "tu-turno";
}
