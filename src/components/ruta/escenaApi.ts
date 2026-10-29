import type { Entrada } from "./leccion/comun";

/** El estado de un escenario o una entrevista, tal como lo guarda el servidor. */
export interface EstadoEscena {
  cumplidas: number[];
  intervenciones: number;
  ayudas: number;
  salto: boolean;
  /** Adivina: cómo va el juego (sin lo que piensa Allison). */
  adivina?: {
    /** Una entrada por ronda; el servidor no dice cuál es. */
    rondas: string[];
    ronda: number;
    descartadas: string[];
    preguntadas: number[];
    fallosSeguidos: number;
    calificadas: number;
    aciertos: number;
    ganadas: string[];
  };
  /** Enséñale: la pregunta de Allison en curso (desde 0) y los intentos que no sirvieron en ella. */
  ensenale?: { actual: number; intentos: number };
  /** Entrevista: la pregunta que Allison le devolvió al alumno ("And you?"), si espera su respuesta. */
  devuelta?: string | null;
}

export interface TurnoEscena {
  transcripcion: string;
  respuesta: string;
  respuestaVoz: string;
  nuevas: number[];
  estado: EstadoEscena;
  metaCumplida: boolean;
  cerrada: boolean;
  restantes?: number;
  sinVoz?: boolean;
  sinSaldo?: boolean;
  error?: string;
}

export interface FinEscena {
  estrellas: number;
  cumplidas: number[];
  total: number;
  sello: boolean;
  saltoLogrado?: boolean;
  mejora: { dijo: string; mejor: string } | null;
}

async function enviar(campos: Record<string, string | Blob>): Promise<{ ok: boolean; status: number; datos: Record<string, unknown> }> {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  try {
    // Un turno pasa por transcripción y respuesta: hasta 45 s antes de rendirse.
    const r = await fetch("/api/ruta/escena", { method: "POST", body: f, signal: AbortSignal.timeout(45_000) });
    return { ok: r.ok, status: r.status, datos: await r.json().catch(() => ({})) };
  } catch {
    return { ok: false, status: 0, datos: { mensaje: "Sin conexión. Revisa tu internet e intenta otra vez." } };
  }
}

/** Abre el intento: gratis. Devuelve la primera línea de Allison. */
export async function iniciarEscena(p: {
  parada?: string;
  actividad: "escenario" | "entrevista" | "adivina" | "ensenale" | "viaje" | "catalogo";
  leccion?: number;
  paso?: number;
  salto?: boolean;
  /** Viajes: el número del viaje. */
  viaje?: number;
  /** Escenarios: la clave ("cat:libreria", "propio:<id>"). */
  clave?: string;
}): Promise<{ conversacionId: string; apertura: string; estado?: EstadoEscena } | { error: string }> {
  const r = await enviar({
    accion: "inicio",
    parada: p.parada ?? "",
    actividad: p.actividad,
    ...(p.viaje ? { viaje: String(p.viaje) } : {}),
    ...(p.clave ? { clave: p.clave } : {}),
    ...(p.leccion ? { leccion: String(p.leccion) } : {}),
    ...(p.paso ? { paso: String(p.paso) } : {}),
    ...(p.salto ? { salto: "1" } : {}),
  });
  if (!r.ok) return { error: String(r.datos.error ?? "fallo") };
  return {
    conversacionId: String(r.datos.conversacionId),
    apertura: String(r.datos.apertura),
    estado: r.datos.estado as EstadoEscena | undefined,
  };
}

/** Un turno del alumno: una intervención (se devuelve si algo falla; si no se oyó nada, no cuenta como intento). */
export async function turnoEscena(conversacion: string, e: Entrada): Promise<TurnoEscena> {
  const campos: Record<string, string | Blob> = { accion: "turno", conversacion };
  if ("texto" in e) campos.texto = e.texto;
  else {
    campos.audio = e.audio;
    campos.duracion = String(e.duracion);
  }
  const r = await enviar(campos);
  const vacio = {
    transcripcion: "",
    respuesta: "",
    respuestaVoz: "",
    nuevas: [],
    estado: { cumplidas: [], intervenciones: 0, ayudas: 0, salto: false },
    metaCumplida: false,
    cerrada: false,
  };
  if (r.status === 402) return { ...vacio, sinSaldo: true };
  if (!r.ok) return { ...vacio, error: String(r.datos.mensaje ?? "Allison no pudo responder. Intenta otra vez.") };
  return { ...vacio, ...(r.datos as Partial<TurnoEscena>) };
}

/**
 * La frase sugerida de la tarea actual. Apaga una estrella, solo si trae
 * frase (`cobrada`). Sin frase (viajes y propios sin idea), la pantalla la
 * pide a /api/ayuda y, si la va a mostrar, llama otra vez con `sugerida`
 * para que se cobre. `ayudas`: las que lleva la escena, para el contador.
 */
export async function ayudaEscena(
  conversacion: string,
  sugerida = false
): Promise<{ tarea: number; frase: string; es: string; explicacion: string; cobrada: boolean; ayudas: number } | null> {
  const r = await enviar({ accion: "ayuda", conversacion, ...(sugerida ? { sugerida: "1" } : {}) });
  if (!r.ok) return null;
  const d = r.datos as { tarea: number; frase: string; es: string; explicacion: string; cobrada?: boolean; estado?: EstadoEscena };
  return { ...d, cobrada: d.cobrada !== false, ayudas: Number(d.estado?.ayudas ?? 0) };
}

/** Cierra el escenario: estrellas y estampilla. */
export async function terminarEscena(conversacion: string): Promise<FinEscena | null> {
  const r = await enviar({ accion: "fin", conversacion });
  return r.ok ? (r.datos as unknown as FinEscena) : null;
}
