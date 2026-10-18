import { sql } from "../db";
import type { Nivel } from "../tipos";
import { lugarDeViaje } from "./viaje";
import { VIAJES } from "./viajes";

/**
 * El pasaporte de viajes (pantalla 3): los 10 países en orden. Cada viaje
 * se abre al terminar el anterior y respeta su nivel mínimo; no depende
 * del avance en Mi ruta (plan, sección 22).
 */

const ORDEN: Nivel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface ViajeEnPasaporte {
  numero: number;
  pais: string;
  lugar: string;
  /** La clave de su ilustración y su estampilla ("brasil"). */
  clave: string;
  nivelMinimo: Nivel;
  tareas: string[];
  ganado: boolean;
  estrellas: number;
  /** Se puede hacer ahora (ya ganado se puede repetir). */
  abierto: boolean;
  /** Por qué no: le falta nivel o terminar el anterior. */
  motivo: "nivel" | "anterior" | null;
}

export interface PasaporteDeViajes {
  viajes: ViajeEnPasaporte[];
  /** El próximo destino: el primero abierto que no ha ganado. */
  siguiente: number | null;
  ganados: number;
}

export async function pasaporteDeViajes(userId: string, nivel: Nivel): Promise<PasaporteDeViajes> {
  const filas = await sql`select viaje, estrellas, sello_en is not null as ganado from viajes_avance where user_id = ${userId}`;
  const porViaje = new Map(filas.map((f) => [f.viaje as number, f]));
  let anteriorGanado = true;
  const viajes = VIAJES.map((v): ViajeEnPasaporte => {
    const f = porViaje.get(v.numero);
    const ganado = !!f?.ganado;
    const nivelOk = ORDEN.indexOf(v.nivelMinimo) <= ORDEN.indexOf(nivel);
    const abierto = ganado || (nivelOk && anteriorGanado);
    const motivo = abierto ? null : !nivelOk ? "nivel" : "anterior";
    anteriorGanado = ganado;
    return {
      numero: v.numero,
      pais: v.pais,
      lugar: v.lugar,
      clave: lugarDeViaje(v),
      nivelMinimo: v.nivelMinimo,
      tareas: v.tareas,
      ganado,
      estrellas: f?.estrellas ?? 0,
      abierto,
      motivo,
    };
  });
  return {
    viajes,
    siguiente: viajes.find((v) => v.abierto && !v.ganado)?.numero ?? null,
    ganados: viajes.filter((v) => v.ganado).length,
  };
}
