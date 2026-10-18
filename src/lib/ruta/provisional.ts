import { META_LOGROS, unidadesDe } from "../curriculo";
import { sql } from "../db";
import { progresoLecciones } from "../progreso";
import type { Nivel } from "../tipos";
import { MAPAS } from "./mapas";

/**
 * La ruta provisional (plan, sección 22): mientras un nivel no tenga sus
 * lecciones escritas, Mi ruta muestra el mismo mapa y las mismas
 * ciudades, y cada parada abre la conversación del tema que ya existe en
 * la app para ese nivel. Al completarla se gana la estampilla de la
 * ciudad; cuando se escriban las lecciones, las reemplazan sin quitarle
 * nada al alumno.
 */

export interface ParadaProvisional {
  numero: number;
  ciudad: string;
  /** El nombre como acción del mapa del nivel, o el título del tema. */
  nombre: string;
  /** La clave del tema del currículo: abre /practicar?leccion=<clave>. */
  clave: string;
  logros: number;
  meta: number;
  estado: "hecha" | "actual" | "bloqueada";
}

export interface RutaProvisional {
  nivel: Nivel;
  pais: string;
  paradas: ParadaProvisional[];
  sellos: number;
}

export async function rutaProvisionalDe(userId: string, nivel: Nivel): Promise<RutaProvisional> {
  const unidades = unidadesDe(nivel);
  const [avance, sellos] = await Promise.all([
    progresoLecciones(userId),
    sql`select parada from ruta_paradas where user_id = ${userId} and sello_en is not null and parada like ${`${nivel.toLowerCase()}-%`}`,
  ]);
  const conSello = new Set(sellos.map((f) => f.parada as string));
  const mapa = MAPAS[nivel];
  const delMapa = mapa?.paradas.filter((p) => /^\d+$/.test(p.parada)) ?? [];

  let actualMarcada = false;
  const paradas = unidades.map((u, i): ParadaProvisional => {
    const a = avance[u.clave];
    // Hecha si completó el tema o si ya tiene la estampilla de la ciudad.
    const hecha = !!a?.completada || conSello.has(`${nivel.toLowerCase()}-p${String(u.orden).padStart(2, "0")}`);
    let estado: ParadaProvisional["estado"] = "hecha";
    if (!hecha) {
      estado = actualMarcada ? "bloqueada" : "actual";
      actualMarcada = true;
    }
    return {
      numero: i + 1,
      ciudad: delMapa[i]?.ciudad ?? `Parada ${i + 1}`,
      nombre: delMapa[i]?.nombre ?? u.titulo,
      clave: u.clave,
      logros: a?.logros ?? 0,
      meta: META_LOGROS,
      estado,
    };
  });

  return {
    nivel,
    pais: mapa?.pais ?? nivel,
    paradas,
    sellos: paradas.filter((p) => p.estado === "hecha").length,
  };
}
