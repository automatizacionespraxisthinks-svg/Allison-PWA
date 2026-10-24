import { FICHA_ALLISON } from "../personaje.ts";
import type { Nivel } from "../tipos.ts";
import type { Escenario, Viaje } from "./tipos.ts";

/**
 * Un viaje (plan, sección 18; pantallas 3 y 8) corre con el mismo motor
 * que el escenario de cierre: Allison conversa como mínimo 10
 * intervenciones, no corrige durante el viaje, lleva al alumno por sus
 * tareas (6) y al final da un resumen y la estampilla del país. La
 * diferencia: aquí Allison es ella misma, la guía, y solo puede decir los
 * datos verificados de la ficha del país (pestaña Viajes de "Contenido
 * A1"); a Colombia se la compara PREGUNTANDO, nunca afirmando.
 */

/** El viaje como un escenario, para el motor común (src/lib/ruta/escena.ts). */
export function escenarioDeViaje(v: Viaje): Escenario {
  return {
    titulo: `Viaje a ${v.pais}`,
    imagen: imagenDeViaje(v),
    contexto: `Estás de viaje en ${v.lugar}. Allison es tu guía.`,
    personaje: `Allison, ${v.papel.split(".")[0].replace(/^Tu /, "tu ")}`,
    objetivo: v.tareas.join(". "),
    tareas: v.tareas.map((t) => (/[.!?]$/.test(t) ? t : `${t}.`)),
    dialogo: [{ quien: "personaje", dice: v.inicio }],
    resumen: `¡Lo lograste! Viajaste a ${v.pais} hablando en inglés.`,
    recompensa: `La estampilla de ${v.estampilla} en el pasaporte.`,
    siSeAtasca: [],
    minimoIntervenciones: v.minimoIntervenciones,
    // El tope de los escenarios de cierre (18), con margen para conversar.
    maximoIntervenciones: Math.max(v.minimoIntervenciones + 10, 20),
  };
}

const LUGAR: Record<string, string> = {
  México: "mexico",
  Perú: "peru",
  Brasil: "brasil",
  España: "espana",
  Francia: "francia",
  Italia: "italia",
  Egipto: "egipto",
  India: "india",
  China: "china",
  Japón: "japon",
};

/** La clave del país: su ilustración y su estampilla. */
export function lugarDeViaje(v: Pick<Viaje, "pais">): string {
  return LUGAR[v.pais] ?? "";
}

function imagenDeViaje(v: Pick<Viaje, "pais">): string {
  return lugarDeViaje(v);
}

/** El sitio en pocas palabras, para "Tu guía en Río" y "Tu misión en Río" (pantalla 8). */
const SITIO: Record<number, string> = {
  1: "Chichén Itzá",
  2: "Machu Picchu",
  3: "Río",
  4: "Barcelona",
  5: "París",
  6: "Roma",
  7: "Giza",
  8: "Agra",
  9: "Pekín",
  10: "Tokio",
};

export function sitioDeViaje(v: Pick<Viaje, "numero" | "lugar">): string {
  return SITIO[v.numero] ?? v.lugar.split(",")[0];
}

/** Las palabras de la ficha para el nivel del alumno ("A1", "A2", "B1 en adelante"). */
function palabrasPara(v: Viaje, nivel: Nivel): string {
  const exacta = v.palabrasPorNivel.find((p) => p.nivel === nivel);
  if (exacta) return exacta.palabras;
  const desde = v.palabrasPorNivel.find((p) => /en adelante/i.test(p.nivel));
  return desde?.palabras ?? v.palabrasPorNivel.at(-1)?.palabras ?? "";
}

/** Las reglas del viaje, en inglés como el resto del prompt; los datos van tal cual (en español). */
export function reglasDeViaje(v: Viaje, nivel: Nivel): string {
  return `THIS IS A TRIP, NOT A ROLE: you are Allison yourself, the student's
guide in ${v.lugar} (in Spanish).
7. FACTS: say ONLY these verified facts about the place (they are in
   Spanish: say them in very simple English for ${nivel}, one at a time,
   when they fit). Never invent other facts, numbers or dates. If they ask
   something that is not here, say you are not sure and ask them a
   question.
${v.datos.map((d) => `   - ${d.texto}`).join("\n")}
8. COLOMBIA: compare by ASKING, never stating facts about Colombia. Use
   questions like these:
${v.puentes.map((p) => `   - ${p}`).join("\n")}
9. Useful words for this level: ${palabrasPara(v, nivel)}.
10. Never talk about: ${v.evita}. If the student brings it up, change the
   topic kindly.
11. If they ask about you, use only your own facts:
${FICHA_ALLISON.trim()}`;
}
