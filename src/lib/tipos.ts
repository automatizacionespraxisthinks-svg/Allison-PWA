/** Niveles del Marco Común Europeo de Referencia. */
export type Nivel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const NIVELES: { nivel: Nivel; etiqueta: string }[] = [
  { nivel: "A1", etiqueta: "Principiante" },
  { nivel: "A2", etiqueta: "Básico" },
  { nivel: "B1", etiqueta: "Intermedio" },
  { nivel: "B2", etiqueta: "Intermedio alto" },
  { nivel: "C1", etiqueta: "Avanzado" },
  { nivel: "C2", etiqueta: "Maestría" },
];

/**
 * Estado de la conversación. Es lo que decide qué ve el alumno
 * y qué animación tiene el avatar.
 */
export type EstadoConversacion =
  | "inactivo"    // esperando que el alumno hable
  | "grabando"    // el alumno está hablando
  | "procesando"  // Gemini está pensando
  | "hablando";   // Allison está respondiendo

export type TipoCorreccion =
  | "pronunciacion"
  | "gramatica"
  | "vocabulario"
  | "naturalidad";

export interface Correccion {
  tipo: TipoCorreccion;
  original: string;
  correccion: string;
  explicacion: string;
  prioridad: "alta" | "media" | "baja";
  /** Tema pedagógico con el que se agrupan los errores repetidos. */
  tema: string;
}

export interface Mensaje {
  id: string;
  rol: "alumno" | "allison";
  /** Literal, SIN corregir. Los errores del alumno se conservan tal cual. */
  texto: string;
  audioUrl?: string;
  duracionSeg?: number;
  correcciones: Correccion[];
  creadoEn: string;
}

/** Tope de duración de un audio. Un mensaje = un turno. */
export const AUDIO_MAX_SEGUNDOS = 60;
