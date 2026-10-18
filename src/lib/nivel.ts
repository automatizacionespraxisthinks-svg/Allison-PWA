import { sql } from "./db";
import { estadoRutaDe } from "./ruta/avance";
import { rutaProvisionalDe } from "./ruta/provisional";
import { NIVELES, type Nivel } from "./tipos";

/**
 * La regla del nivel (plan, sección 22, "Cambio de nivel", aprobada el
 * 15 de octubre de 2026): el alumno elige su nivel inicial en la primera
 * sesión. Después solo baja. Puede volver a subir hasta el nivel más
 * alto en el que ya estuvo (sigue donde iba), y para pasar de ahí tiene
 * que completar TODAS las actividades de ese nivel, también las de las
 * paradas saltadas. Solo el administrador sube y baja a voluntad.
 */

const ORDEN = NIVELES.map((n) => n.nivel);
const posicion = (n: Nivel) => ORDEN.indexOf(n);

/** ¿Completó todas las actividades del nivel? */
async function nivelCompleto(userId: string, nivel: Nivel): Promise<boolean> {
  const ruta = await estadoRutaDe(userId, nivel);
  if (ruta) return ruta.completa;
  const provisional = await rutaProvisionalDe(userId, nivel);
  return provisional.paradas.length > 0 && provisional.paradas.every((p) => p.estado === "hecha");
}

export interface OpcionesDeNivel {
  actual: Nivel;
  maximo: Nivel;
  /** El nivel de arriba del máximo ya se ganó: puede subir a él. */
  siguienteAbierto: Nivel | null;
}

export async function opcionesDeNivel(userId: string): Promise<OpcionesDeNivel | null> {
  const [u] = await sql`select nivel, coalesce(nivel_maximo, nivel) as maximo from users where id = ${userId}`;
  if (!u) return null;
  const maximo = u.maximo as Nivel;
  const siguiente = ORDEN[posicion(maximo) + 1] ?? null;
  return {
    actual: u.nivel as Nivel,
    maximo,
    siguienteAbierto: siguiente && (await nivelCompleto(userId, maximo)) ? siguiente : null,
  };
}

/** Cambia el nivel si la regla lo permite. Devuelve el motivo si no. */
export async function cambiarNivel(userId: string, nuevo: Nivel): Promise<"ok" | "bloqueado"> {
  const o = await opcionesDeNivel(userId);
  if (!o) return "bloqueado";
  if (posicion(nuevo) <= posicion(o.maximo)) {
    // El tope se guarda antes de bajar: una cuenta vieja sin tope no lo
    // pierde al bajar (en SQL, la derecha usa los valores de antes).
    await sql`
      update users set nivel_maximo = coalesce(nivel_maximo, nivel), nivel = ${nuevo}, actualizado_en = now()
       where id = ${userId}
    `;
    return "ok";
  }
  if (nuevo === o.siguienteAbierto) {
    await sql`update users set nivel = ${nuevo}, nivel_maximo = ${nuevo}, actualizado_en = now() where id = ${userId}`;
    return "ok";
  }
  return "bloqueado";
}

/**
 * El administrador pone cualquier nivel, hacia arriba o hacia abajo, y
 * ese pasa a ser también el tope del alumno: si lo bajó, el alumno no
 * se vuelve a subir solo.
 */
export async function ponerNivelComoAdmin(userId: string, nivel: Nivel): Promise<void> {
  await sql`update users set nivel = ${nivel}, nivel_maximo = ${nivel}, actualizado_en = now() where id = ${userId}`;
}
