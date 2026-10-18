import type { Nivel } from "../tipos.ts";
import { rutaDe, type PasoDeRuta } from "./index.ts";
import type { Actividad, Ilustracion, TipoActividad } from "./tipos.ts";

/**
 * El estado de "Mi ruta" para un alumno: qué está hecho, qué sigue y
 * qué está bloqueado. Es una función pura (las filas de la base entran,
 * el mapa sale) para poder probarla sin base: scripts/probar-ruta.mjs.
 *
 * Reglas del plan de mejoras (secciones 5, 8, 17 y 22):
 *   · El alumno siempre ve UN solo paso siguiente.
 *   · Las lecciones de una parada van en orden; el escenario se abre
 *     al terminar las cuatro.
 *   · La parada siguiente se abre al pasar el escenario con 1 estrella
 *     o más (gana la estampilla).
 *   · Saltar: al pasar el escenario de una parada más adelante, las de
 *     antes quedan "saltadas", con sus lecciones abiertas. El Repaso
 *     final no se puede saltar.
 *   · Alumnos actuales: lo que ya tenían hecho queda como saltado, sin
 *     estampilla.
 *   · Para completar el nivel hay que hacer TODAS las lecciones, también
 *     las de las paradas saltadas, y pasar el Repaso final.
 */

/** Una fila de ruta_lecciones. */
export interface FilaLeccion {
  parada: string;
  leccion: number;
  paso: number;
  estrellas: number;
  completada: boolean;
}

/** Una fila de ruta_paradas. */
export interface FilaParada {
  parada: string;
  estrellas: number;
  sello: boolean;
  saltada: boolean;
  anterior: boolean;
  /** Ya intentó saltar hasta aquí hoy: el siguiente intento es mañana. */
  saltoHoy: boolean;
}

export type EstadoLeccion = "bloqueada" | "disponible" | "actual" | "hecha";
export type EstadoParada = "bloqueada" | "en-curso" | "superada" | "saltada";

export interface LeccionEnMapa {
  numero: number;
  titulo: string;
  /** La actividad que da el ícono y el color de su calcomanía. */
  principal: TipoActividad;
  estado: EstadoLeccion;
  estrellas: number;
  /** Actividades terminadas en el intento en curso. */
  paso: number;
  actividades: TipoActividad[];
}

export interface EscenarioEnMapa {
  estado: "bloqueado" | "disponible" | "actual" | "hecho";
  estrellas: number;
}

export interface ParadaEnMapa {
  clave: string;
  tipo: "parada" | "repaso";
  /** "Parada 3", "Repaso 1", "Repaso final". */
  nombre: string;
  /**
   * El número de la estampilla: el de la parada (la de Los Ángeles es la
   * Nº6 aunque el Repaso 1 vaya antes). Los repasos no llevan número: 0.
   */
  numeroSello: number;
  ciudad: string;
  titulo: string;
  portada: Ilustracion;
  estado: EstadoParada;
  /** Ganó la estampilla (pasó el escenario). */
  sello: boolean;
  /** Llegó por la versión anterior de la app, no saltando. */
  anterior: boolean;
  lecciones: LeccionEnMapa[];
  escenario: EscenarioEnMapa;
  /** Muestra "¿Ya lo sabes? Salta hasta aquí". */
  puedeSaltar: boolean;
  /** Ya lo intentó hoy: puede volver a intentarlo mañana. */
  saltoHoy: boolean;
}

export interface SiguientePaso {
  parada: string;
  /** El número de la lección, o "escenario". */
  leccion: number | "escenario";
}

export interface EstadoDeRuta {
  nivel: Nivel;
  paradas: ParadaEnMapa[];
  siguiente: SiguientePaso | null;
  sellos: number;
  totalSellos: number;
  /** Todas las lecciones hechas y el Repaso final pasado: puede subir de nivel. */
  completa: boolean;
  /** Lecciones que faltan fuera del Repaso final (lo mantienen cerrado). */
  leccionesPendientes: number;
}

/** La clave estable de un paso de la ruta: "a1-p03", "a1-r1", "a1-rf". */
export function claveDe(nivel: Nivel, paso: PasoDeRuta): string {
  const n = nivel.toLowerCase();
  if (paso.tipo === "parada") return `${n}-p${String(paso.parada.numero).padStart(2, "0")}`;
  return paso.repaso.nombre === "Repaso final" ? `${n}-rf` : `${n}-r${paso.repaso.despuesDeParada / 5}`;
}

/** El paso de la ruta con esa clave, o null. */
export function pasoDe(clave: string): { nivel: Nivel; paso: PasoDeRuta; indice: number } | null {
  const nivel = clave.slice(0, 2).toUpperCase() as Nivel;
  const ruta = rutaDe(nivel);
  if (!ruta) return null;
  const indice = ruta.findIndex((p) => claveDe(nivel, p) === clave);
  return indice < 0 ? null : { nivel, paso: ruta[indice], indice };
}

/** Las lecciones y el escenario de un paso, sea parada o repaso. */
export function contenidoDe(paso: PasoDeRuta) {
  return paso.tipo === "parada" ? paso.parada : paso.repaso;
}

/** La actividad del ícono: la primera de hablar (la lección siempre empieza escuchando). */
export function actividadPrincipal(actividades: Actividad[]): TipoActividad {
  return (actividades[1] ?? actividades[0]).tipo;
}

export { NOMBRE_ACTIVIDAD, usaIntervenciones } from "./nombres.ts";

export function estadoDeRuta(
  nivel: Nivel,
  lecciones: FilaLeccion[],
  paradas: FilaParada[]
): EstadoDeRuta | null {
  const ruta = rutaDe(nivel);
  if (!ruta) return null;

  const porLeccion = new Map(lecciones.map((l) => [`${l.parada}#${l.leccion}`, l]));
  const porParada = new Map(paradas.map((p) => [p.parada, p]));

  const claves = ruta.map((p) => claveDe(nivel, p));
  const superada = (clave: string) => {
    const p = porParada.get(clave);
    return !!p && (p.sello || p.saltada || p.anterior);
  };
  // La parada en curso: la primera que no se ha superado.
  const iActual = claves.findIndex((c) => !superada(c));

  const mapa: ParadaEnMapa[] = ruta.map((paso, i) => {
    const clave = claves[i];
    const c = contenidoDe(paso);
    const fila = porParada.get(clave);
    // Lo que ya está superado (con estampilla, saltado o hecho en la
    // versión anterior) nunca se ve bloqueado, aunque esté más adelante de
    // la parada en curso: un alumno actual con las unidades 6 a 10 hechas
    // las ve saltadas, no con candado.
    const bloqueada = iActual >= 0 && i > iActual && !superada(clave);
    const enCurso = i === iActual;

    let actualMarcada = false;
    const leccionesEnMapa: LeccionEnMapa[] = c.lecciones.map((l) => {
      const f = porLeccion.get(`${clave}#${l.numero}`);
      const hecha = !!f?.completada;
      let estado: EstadoLeccion;
      if (hecha) estado = "hecha";
      else if (bloqueada) estado = "bloqueada";
      else if (enCurso) {
        // En la parada en curso van en orden: la primera sin hacer es la
        // actual y las de después esperan.
        estado = actualMarcada ? "bloqueada" : "actual";
        actualMarcada = true;
      } else estado = "disponible";
      return {
        numero: l.numero,
        titulo: l.titulo,
        principal: actividadPrincipal(l.actividades),
        estado,
        estrellas: f?.estrellas ?? 0,
        paso: f && !hecha ? Math.min(f.paso, l.actividades.length - 1) : 0,
        actividades: l.actividades.map((a) => a.tipo),
      };
    });

    const todasHechas = leccionesEnMapa.every((l) => l.estado === "hecha");
    const escenario: EscenarioEnMapa = {
      estado: fila?.sello
        ? "hecho"
        : bloqueada
          ? "bloqueado"
          : enCurso
            ? todasHechas
              ? "actual"
              : "bloqueado"
            : "disponible",
      estrellas: fila?.estrellas ?? 0,
    };

    const estado: EstadoParada = bloqueada
      ? "bloqueada"
      : enCurso
        ? "en-curso"
        : !fila?.sello && (fila?.saltada || fila?.anterior)
          ? "saltada"
          : "superada";

    const esFinal = paso.tipo === "repaso" && paso.repaso.nombre === "Repaso final";
    return {
      clave,
      tipo: paso.tipo,
      nombre: paso.tipo === "parada" ? `Parada ${paso.parada.numero}` : paso.repaso.nombre,
      numeroSello: paso.tipo === "parada" ? paso.parada.numero : 0,
      ciudad: c.ciudad,
      titulo: c.titulo,
      portada: c.portada,
      estado,
      sello: !!fila?.sello,
      anterior: !!fila?.anterior,
      lecciones: leccionesEnMapa,
      escenario,
      puedeSaltar: bloqueada && !esFinal,
      saltoHoy: !!fila?.saltoHoy,
    };
  });

  // El paso siguiente: en la parada en curso, su lección actual o su
  // escenario. Si todas están superadas, la primera lección que falta
  // de una parada saltada (hacen falta para subir de nivel).
  let siguiente: SiguientePaso | null = null;
  if (iActual >= 0) {
    const p = mapa[iActual];
    const l = p.lecciones.find((x) => x.estado === "actual");
    siguiente = { parada: p.clave, leccion: l ? l.numero : "escenario" };
  } else {
    for (const p of mapa) {
      const l = p.lecciones.find((x) => x.estado !== "hecha");
      if (l) {
        siguiente = { parada: p.clave, leccion: l.numero };
        break;
      }
    }
  }

  // El Repaso final da el sello del nivel completo: solo se abre cuando
  // están hechas TODAS las lecciones del nivel, también las de las
  // paradas saltadas (plan, sección 22, "Saltar paradas" y "Cambio de
  // nivel"). Mientras falten, lo siguiente es la primera que falta.
  const final = mapa[mapa.length - 1];
  const pendientes = mapa
    .slice(0, -1)
    .flatMap((p) => p.lecciones.filter((l) => l.estado !== "hecha").map((l) => ({ parada: p.clave, leccion: l.numero })));
  if (!final.sello && pendientes.length && final.escenario.estado !== "bloqueado") {
    final.escenario.estado = "bloqueado";
  }
  if (siguiente?.parada === final.clave && siguiente.leccion === "escenario" && pendientes.length) {
    siguiente = pendientes[0];
  }

  const completa =
    mapa.every((p) => p.lecciones.every((l) => l.estado === "hecha")) && final.sello;

  return {
    nivel,
    paradas: mapa,
    siguiente,
    sellos: mapa.filter((p) => p.sello).length,
    totalSellos: mapa.length,
    completa,
    leccionesPendientes: pendientes.length,
  };
}

/**
 * Estrellas de una lección: cuántas respuestas salieron bien al primer
 * intento. 3 con 80 % o más, 2 con 50 % o más, 1 por terminarla. Una
 * lección sin nada que calificar (solo actividades gratis) da 3.
 */
export function estrellasDeLeccion(aciertos: number, total: number): number {
  if (total <= 0) return 3;
  const p = aciertos / total;
  return p >= 0.8 ? 3 : p >= 0.5 ? 2 : 1;
}

/**
 * Estrellas de un escenario: 3 si cumplió todas las tareas sin ayuda, 2
 * si usó la ayuda, 1 si completó al menos la mitad, 0 si no llegó.
 */
export function estrellasDeEscenario(cumplidas: number, total: number, ayudas: number): number {
  if (total > 0 && cumplidas >= total) return ayudas > 0 ? 2 : 3;
  return cumplidas * 2 >= total && total > 0 ? 1 : 0;
}

/**
 * Saltar: pasa si saca 2 estrellas o más y usó la ayuda una vez como
 * mucho (plan, sección 22).
 */
export function pasaElSalto(estrellas: number, ayudas: number): boolean {
  return estrellas >= 2 && ayudas <= 1;
}
