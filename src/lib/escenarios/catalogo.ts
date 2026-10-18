import { sql } from "../db";
import type { Escenario } from "../ruta/tipos";
import type { Nivel } from "../tipos";
import { rutaDeEscenario, type TarjetaEscenario } from "./categorias";
import { CATALOGO, escenario, nivelAbierto } from "./datos";

/**
 * Escenarios (pantalla 5): el catálogo vive en datos.ts (sin base de
 * datos, para que las pruebas lo lean); aquí, lo que pasa por la base:
 * los escenarios propios y el avance del alumno.
 */

export { CATALOGO } from "./datos";

export interface EscenarioEncontrado {
  escenario: Escenario;
  nivelMinimo: Nivel;
  abierto: (nivel: Nivel) => boolean;
}

/** Un escenario del catálogo o uno propio del alumno ("propio:<id>"). */
export async function buscarEscenario(userId: string, clave: string): Promise<EscenarioEncontrado | null> {
  const delCatalogo = CATALOGO.find((c) => c.clave === clave);
  if (delCatalogo) {
    return {
      escenario: delCatalogo.escenario,
      nivelMinimo: delCatalogo.nivelMinimo,
      abierto: (n) => nivelAbierto(delCatalogo.nivelMinimo, n),
    };
  }
  const id = clave.startsWith("propio:") ? clave.slice(7) : "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [p] = await sql`
    select titulo, lugar, papel, contexto, tareas, apertura, nivel from escenarios_propios
     where id = ${id} and user_id = ${userId}
  `;
  if (!p) return null;
  return {
    escenario: escenarioPropio(p as unknown as Parameters<typeof escenarioPropio>[0]),
    nivelMinimo: p.nivel as Nivel,
    abierto: () => true,
  };
}

/** Un escenario que armó Allison con lo que pidió el alumno: sin diálogo de ejemplo, con su primera línea. */
export function escenarioPropio(p: { titulo: string; lugar: string; papel: string; contexto: string; tareas: string[]; apertura: string }): Escenario {
  return escenario({
    titulo: p.titulo,
    imagen: "",
    contexto: p.contexto,
    personaje: p.papel,
    tareas: p.tareas,
    dialogo: [{ quien: "personaje", dice: p.apertura }],
  });
}

/**
 * Las tarjetas de la sección: el catálogo (con su nivel mínimo) y los
 * escenarios propios del alumno, con sus estrellas y si ya los hizo.
 */
export async function tarjetasDe(userId: string, nivel: Nivel): Promise<TarjetaEscenario[]> {
  const [avance, propios] = await Promise.all([
    sql`select escenario, estrellas, veces from escenarios_avance where user_id = ${userId}`,
    sql`
      select id, titulo, lugar, papel, tareas from escenarios_propios
       where user_id = ${userId} order by creado_en desc limit 30
    `,
  ]);
  const de = new Map(avance.map((f) => [f.escenario as string, f]));
  const conAvance = (clave: string) => ({ estrellas: (de.get(clave)?.estrellas as number) ?? 0, veces: (de.get(clave)?.veces as number) ?? 0 });
  return [
    ...propios.map((p): TarjetaEscenario => {
      const clave = `propio:${p.id}`;
      return {
        clave,
        ruta: rutaDeEscenario(clave),
        titulo: p.titulo,
        lugar: p.lugar,
        categoria: "Míos",
        imagen: "",
        papelCorto: `Allison es ${String(p.papel).charAt(0).toLowerCase()}${String(p.papel).slice(1)}`,
        tareas: (p.tareas as string[]).length,
        nivelMinimo: nivel,
        abierto: true,
        ...conAvance(clave),
      };
    }),
    ...CATALOGO.map(
      (c): TarjetaEscenario => ({
        clave: c.clave,
        ruta: rutaDeEscenario(c.clave),
        titulo: c.titulo,
        lugar: c.lugar,
        categoria: c.categoria,
        imagen: c.imagen,
        papelCorto: c.papelCorto,
        tareas: c.escenario.tareas.length,
        nivelMinimo: c.nivelMinimo,
        abierto: nivelAbierto(c.nivelMinimo, nivel),
        ...conAvance(c.clave),
      })
    ),
  ];
}
