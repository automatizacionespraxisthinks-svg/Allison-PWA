import { sql } from "../db";
import { buscarEscenario } from "../escenarios/catalogo";
import { transcribirACiegas } from "../evaluacion";
import type { Nivel } from "../tipos";
import { estadoRutaDe } from "./avance";
import { barajarRondas, respuestaDeAdivina } from "./adivina";
import {
  REPETIR,
  clasificarAdivina,
  clasificarEnsenale,
  clasificarEntrevista,
  respuestaDeEnsenale,
  respuestaDeEntrevista,
  soloIngles,
  tareasVisibles,
  turnoDeEscenario,
} from "./escena";
import { contenidoDe, estrellasDeEscenario, pasaElSalto, pasoDe } from "./estado";
import { ayudasDe } from "./index";
import { pasaporteDeViajes } from "./pasaporteViajes";
import type { Adivina, Ensenale, Entrevista, Escenario } from "./tipos";
import { escenarioDeViaje, reglasDeViaje } from "./viaje";
import { VIAJES } from "./viajes";

/**
 * Las conversaciones con Allison fuera de Hablar, contra la base: el
 * escenario de cierre de cada parada, la Entrevista a Allison, Adivina
 * (A2), Enséñale a Allison (B1), los Viajes y los escenarios de la
 * sección Escenarios. Cada intento es una
 * conversación aparte (modo 'ruta'), con su estado en conversaciones.ruta.
 *
 * Reglas de gasto (plan, sección 22, "Conversaciones con IA y gasto"):
 * cada turno es una intervención; los turnos que no se entienden no
 * cuentan como intento ni para la meta, pero sí gastan, porque consumen
 * IA. Si la falla es de la IA (no responde), se devuelve.
 */

export type ActividadEscena = "escenario" | "entrevista" | "adivina" | "ensenale" | "viaje" | "catalogo";

/** Las actividades de una lección que son conversación (van con lección y paso). */
const DE_LECCION: ActividadEscena[] = ["entrevista", "adivina", "ensenale"];

/** Adivina: cómo va el juego. `rondas` dice en qué piensa Allison: nunca sale al navegador. */
export interface EstadoAdivina {
  rondas: string[];
  /** La ronda en curso (desde 0). */
  ronda: number;
  descartadas: string[];
  preguntadas: number[];
  /** Intentos seguidos que no sirvieron: con dos se ilumina la ayuda. */
  fallosSeguidos: number;
  /** Preguntas e intentos de adivinar que se entendieron, y cuántos al primer intento. */
  calificadas: number;
  aciertos: number;
  /** Lo que ya adivinó, ronda por ronda. */
  ganadas: string[];
}

export interface EstadoEscena {
  /** La parada (escenario de cierre y entrevista). */
  parada: string;
  actividad: ActividadEscena;
  leccion?: number;
  paso?: number;
  /** Viajes: el número del viaje. */
  viaje?: number;
  /** Escenarios: "cat:libreria" o "propio:<id>". */
  clave?: string;
  /** El nivel del alumno al empezar (viajes y escenarios, que no son de una ruta). */
  nivel?: Nivel;
  /** Escenario: tareas cumplidas. Entrevista: datos descubiertos. */
  cumplidas: number[];
  /** Turnos del alumno que contaron (los que no se entendieron no cuentan). */
  intervenciones: number;
  ayudas: number;
  /** Intento de saltar hasta esta parada. */
  salto: boolean;
  /** Entrevista: la pregunta que Allison acaba de devolver. */
  devuelta?: string | null;
  adivina?: EstadoAdivina;
  /** Enséñale: la pregunta de Allison en curso (desde 0) y los intentos que no sirvieron en ella. */
  ensenale?: { actual: number; intentos: number };
  /** Errores anotados en silencio, para el resumen y el repaso sorpresa. */
  errores?: { dijo: string; mejor: string }[];
  /**
   * Escenario: las tareas con que empezó (unidas). Si el contenido cambia a
   * mitad de una escena (un despliegue), las cumplidas apuntarían a otras
   * tareas: la escena se da por desactualizada y se empieza de nuevo.
   */
  tareasClave?: string;
  /** Escenario: qué responderle a la última línea de Allison (la ayuda la muestra). */
  idea?: { en: string; es: string; tarea: number } | null;
  terminada?: boolean;
}

export type ErrorEscena = "no_existe" | "bloqueada" | "salto_hoy" | "terminada" | "ocupada" | "desactualizada";

interface Ubicacion {
  nivel: Nivel;
  escenario?: Escenario;
  entrevista?: Entrevista;
  adivina?: Adivina;
  ensenale?: Ensenale;
  /** Reglas propias (viajes). */
  extra?: string;
  minimo: number;
  maximo: number;
}

async function ubicar(
  userId: string,
  e: Pick<EstadoEscena, "parada" | "actividad" | "leccion" | "paso" | "viaje" | "clave" | "nivel">,
  nivelAlumno: Nivel
): Promise<Ubicacion | null> {
  if (e.actividad === "viaje") {
    const v = VIAJES.find((x) => x.numero === e.viaje);
    if (!v) return null;
    const nivel = e.nivel ?? nivelAlumno;
    const escenario = escenarioDeViaje(v);
    return { nivel, escenario, extra: reglasDeViaje(v, nivel), minimo: escenario.minimoIntervenciones, maximo: escenario.maximoIntervenciones };
  }
  if (e.actividad === "catalogo") {
    const c = e.clave ? await buscarEscenario(userId, e.clave) : null;
    if (!c) return null;
    return {
      nivel: e.nivel ?? nivelAlumno,
      escenario: c.escenario,
      minimo: c.escenario.minimoIntervenciones,
      maximo: c.escenario.maximoIntervenciones,
    };
  }
  const u = pasoDe(e.parada);
  if (!u) return null;
  const c = contenidoDe(u.paso);
  if (e.actividad === "escenario") {
    return { nivel: u.nivel, escenario: c.escenario, minimo: c.escenario.minimoIntervenciones, maximo: c.escenario.maximoIntervenciones };
  }
  const a = c.lecciones.find((l) => l.numero === e.leccion)?.actividades.find((x) => x.paso === e.paso);
  if (a?.tipo === "adivina" && e.actividad === "adivina") {
    // Adivina termina al adivinar todas las rondas (unas 8 a 10
    // intervenciones). El tope evita que no termine nunca: al llegar,
    // Allison dice la respuesta.
    return { nivel: u.nivel, adivina: a, minimo: 1, maximo: 12 * a.rondas.length };
  }
  if (a?.tipo === "ensenale" && e.actividad === "ensenale") {
    // Termina al hacer las cuatro preguntas; cada una admite tres intentos.
    return { nivel: u.nivel, ensenale: a, minimo: a.preguntas.length, maximo: a.preguntas.length * 3 + 2 };
  }
  if (!a || a.tipo !== "entrevista" || e.actividad !== "entrevista") return null;
  // La entrevista no tiene tope en el contenido: el doble del mínimo.
  return { nivel: u.nivel, entrevista: a, minimo: a.minimoIntervenciones, maximo: a.minimoIntervenciones * 2 };
}

/** Las acotaciones del diálogo ("(pasa caminando)") no se dicen. */
const esAcotacion = (t: string) => /^\(.*\)$/.test(t.trim());

/**
 * La primera línea de Allison: la del diálogo de ejemplo, o la invitación
 * de la entrevista. Vacía si en el ejemplo empieza el alumno (en San
 * Francisco, la señora solo "pasa caminando": el alumno la llama).
 */
function apertura(u: Ubicacion): string {
  if (u.entrevista) return "Ask me 5 questions!";
  if (u.adivina) return u.adivina.apertura;
  if (u.ensenale) return `${u.ensenale.apertura} ${u.ensenale.preguntas[0]?.pregunta ?? ""}`.trim();
  const primera = u.escenario!.dialogo.find((l) => !esAcotacion(l.dice));
  return primera?.quien === "personaje" ? primera.dice : "";
}

/** El tope duro: con todas las tareas cumplidas, el alumno puede seguir hasta el doble. */
const topeDuro = (u: Ubicacion) => u.maximo * 2;

export async function iniciarEscena(
  userId: string,
  nivel: Nivel,
  pedido: {
    parada: string;
    actividad: ActividadEscena;
    leccion?: number;
    paso?: number;
    salto?: boolean;
    viaje?: number;
    clave?: string;
  }
): Promise<{ ok: true; conversacionId: string; apertura: string; estado: EstadoEscena } | { ok: false; error: ErrorEscena }> {
  const u = await ubicar(userId, { ...pedido, nivel }, nivel);
  if (!u) return { ok: false, error: "no_existe" };

  if (pedido.actividad === "viaje") {
    const p = await pasaporteDeViajes(userId, nivel);
    if (!p.viajes.find((v) => v.numero === pedido.viaje)?.abierto) return { ok: false, error: "bloqueada" };
  } else if (pedido.actividad === "catalogo") {
    const c = await buscarEscenario(userId, pedido.clave ?? "");
    if (!c || !c.abierto(nivel)) return { ok: false, error: "bloqueada" };
  } else {
    if (u.nivel !== nivel) return { ok: false, error: "no_existe" };
    const ruta = await estadoRutaDe(userId, nivel);
    const parada = ruta?.paradas.find((p) => p.clave === pedido.parada);
    if (!parada) return { ok: false, error: "no_existe" };

    if (pedido.salto) {
      if (!parada.puedeSaltar) return { ok: false, error: "bloqueada" };
      // Un intento por día, anotado desde que empieza (si no pasa, el
      // siguiente es mañana). En una sola sentencia: dos pestañas a la
      // vez no consiguen dos intentos.
      const anotado = await sql`
        insert into ruta_paradas (user_id, parada, intento_salto_en)
        values (${userId}, ${pedido.parada}, now())
        on conflict (user_id, parada) do update
           set intento_salto_en = now(), actualizado_en = now()
         where ruta_paradas.intento_salto_en is null or ruta_paradas.intento_salto_en::date < current_date
        returning parada
      `;
      if (!anotado.length) return { ok: false, error: "salto_hoy" };
    } else if (pedido.actividad === "escenario") {
      if (parada.escenario.estado === "bloqueado") return { ok: false, error: "bloqueada" };
    } else {
      const l = parada.lecciones.find((x) => x.numero === pedido.leccion);
      if (!l || l.estado === "bloqueada") return { ok: false, error: "bloqueada" };
    }
  }

  const estado: EstadoEscena = {
    parada: pedido.actividad === "escenario" || DE_LECCION.includes(pedido.actividad) ? pedido.parada : "",
    actividad: pedido.actividad,
    ...(pedido.actividad === "entrevista"
      ? { leccion: pedido.leccion, paso: pedido.paso, devuelta: null }
      : pedido.actividad === "ensenale"
        ? { leccion: pedido.leccion, paso: pedido.paso, ensenale: { actual: 0, intentos: 0 } }
      : pedido.actividad === "adivina"
        ? {
            leccion: pedido.leccion,
            paso: pedido.paso,
            adivina: {
              rondas: barajarRondas(u.adivina!.rondas),
              ronda: 0,
              descartadas: [],
              preguntadas: [],
              fallosSeguidos: 0,
              calificadas: 0,
              aciertos: 0,
              ganadas: [],
            },
          }
        : { errores: [] }),
    ...(pedido.actividad === "viaje" ? { viaje: pedido.viaje, nivel } : {}),
    ...(pedido.actividad === "catalogo" ? { clave: pedido.clave, nivel } : {}),
    ...(u.escenario ? { tareasClave: claveDeTareas(u.escenario) } : {}),
    cumplidas: [],
    intervenciones: 0,
    ayudas: 0,
    salto: !!pedido.salto,
  };
  const etiqueta =
    pedido.actividad === "escenario"
      ? `ruta:${pedido.parada}:escenario`
      : DE_LECCION.includes(pedido.actividad)
        ? `ruta:${pedido.parada}:${pedido.leccion}:${pedido.paso}`
        : pedido.actividad === "viaje"
          ? `ruta:viaje:${pedido.viaje}`
          : `ruta:${pedido.clave}`;
  const texto = apertura(u);

  const [c] = await sql`
    insert into conversaciones (user_id, modo, leccion, nivel_al_iniciar, ruta)
    values (${userId}, 'ruta', ${etiqueta}, ${nivel}, ${sql.json(estado as never)})
    returning id
  `;
  if (texto) {
    await sql`
      insert into mensajes (conversacion_id, user_id, rol, texto, correcciones)
      values (${c.id}, ${userId}, 'allison', ${texto}, '[]'::jsonb)
    `;
  }
  // La cifra del intento para el panel (sección Ruta): sobrevive al
  // borrado de la conversación.
  await sql`
    insert into escenas_intentos (conversacion_id, user_id, actividad, clave, minimo)
    values (${c.id}, ${userId}, ${pedido.actividad}, ${claveDeIntento(estado)}, ${u.minimo})
    on conflict (conversacion_id) do nothing
  `.catch((e) => console.error("No se pudo anotar el intento:", e instanceof Error ? e.message : e));
  return { ok: true, conversacionId: c.id, apertura: texto, estado: estadoPublico(estado) };
}

/** El estado que ve el navegador: sin decir en qué piensa Allison en Adivina. */
function estadoPublico(e: EstadoEscena): EstadoEscena {
  // La idea se ve solo al pedir la ayuda, que apaga una estrella.
  const publico = { ...e, idea: undefined };
  if (!e.adivina) return publico;
  return { ...publico, adivina: { ...e.adivina, rondas: e.adivina.rondas.map(() => "") } };
}

async function leerEscena(userId: string, conversacionId: string) {
  const [c] = await sql`
    select id, ruta, nivel_al_iniciar from conversaciones
     where id = ${conversacionId} and user_id = ${userId} and modo = 'ruta'
  `.catch(() => []);
  return c ? { id: c.id as string, estado: c.ruta as EstadoEscena, nivel: c.nivel_al_iniciar as Nivel } : null;
}

/**
 * "Practicarla" en el resumen: la frase mejor que Allison le mostró al
 * terminar (la primera de sus errores), para repetirla. Solo de una
 * escena del alumno, ya terminada.
 */
export async function mejoraDeEscena(userId: string, conversacionId: string): Promise<{ frase: string; nivel: Nivel } | null> {
  if (!/^[0-9a-f-]{36}$/.test(conversacionId)) return null;
  const leida = await leerEscena(userId, conversacionId);
  const frase = leida?.estado.terminada ? leida.estado.errores?.[0]?.mejor : undefined;
  return frase && leida ? { frase, nivel: leida.nivel } : null;
}

/** "a1-p01" (escenario), "a1-p01:4" (entrevista de la lección 4), "viaje:1", "cat:libreria", "propio". */
function claveDeIntento(e: EstadoEscena): string {
  if (DE_LECCION.includes(e.actividad)) return `${e.parada}:${e.leccion ?? 0}`;
  if (e.actividad === "viaje") return `viaje:${e.viaje ?? 0}`;
  if (e.actividad === "catalogo") return e.clave?.startsWith("propio:") ? "propio" : (e.clave ?? "");
  return e.parada;
}

/** Las tareas de un escenario, unidas: la huella con que empezó la escena. */
function claveDeTareas(e: { tareas: string[] }): string {
  return e.tareas.join("|");
}

/** La escena empezó con otras tareas (cambió el contenido a mitad de camino). */
function desactualizada(estado: EstadoEscena, u: { escenario?: { tareas: string[] } }): boolean {
  return !!u.escenario && !!estado.tareasClave && estado.tareasClave !== claveDeTareas(u.escenario);
}

/**
 * Guarda el turno solo si nadie tocó la escena mientras la IA respondía:
 * el mismo número de intervenciones y sin cerrar. Las ayudas pedidas en
 * ese rato se conservan (la mayor de las dos). Devuelve false si chocó.
 */
async function guardarTurno(conversacionId: string, estado: EstadoEscena, intervencionesAntes: number): Promise<boolean> {
  const filas = await sql`
    update conversaciones
       set ruta = jsonb_set(${sql.json(estado as never)}::jsonb, '{ayudas}',
                            to_jsonb(greatest(${estado.ayudas}::int, coalesce((ruta->>'ayudas')::int, 0)))),
           ultima_actividad_en = now()
     where id = ${conversacionId}
       and coalesce((ruta->>'intervenciones')::int, 0) = ${intervencionesAntes}
       and not coalesce((ruta->>'terminada')::boolean, false)
    returning (ruta->>'ayudas')::int as ayudas
  `;
  if (!filas.length) return false;
  estado.ayudas = filas[0].ayudas;
  await sql`
    update escenas_intentos
       set intervenciones = ${estado.intervenciones}, terminada = ${!!estado.terminada}, actualizado_en = now()
     where conversacion_id = ${conversacionId}
  `.catch((e) => console.error("No se pudo anotar el intento:", e instanceof Error ? e.message : e));
  return true;
}

/**
 * Cierra la escena una sola vez: si dos "Terminar" llegan juntos (doble
 * toque), solo el primero anota estrellas, sellos y viajes. Solo marca
 * "terminada", sin pisar lo que haya guardado un turno.
 */
async function cerrarEscena(conversacionId: string, estado: EstadoEscena): Promise<boolean> {
  const filas = await sql`
    update conversaciones
       set ruta = jsonb_set(ruta, '{terminada}', 'true'::jsonb), ultima_actividad_en = now()
     where id = ${conversacionId} and not coalesce((ruta->>'terminada')::boolean, false)
    returning id
  `;
  if (!filas.length) return false;
  estado.terminada = true;
  await sql`
    update escenas_intentos set terminada = true, actualizado_en = now() where conversacion_id = ${conversacionId}
  `.catch((e) => console.error("No se pudo anotar el intento:", e instanceof Error ? e.message : e));
  return true;
}

export interface ResultadoTurno {
  /** No se oyó o no se entendió: no cuenta como intento ni para la meta. */
  sinVoz?: boolean;
  /** La IA no dio una respuesta que sirva: la ruta devuelve la intervención. */
  sinRespuesta?: boolean;
  transcripcion: string;
  respuesta: string;
  respuestaVoz: string;
  /** Tareas o datos nuevos de este turno. */
  nuevas: number[];
  estado: EstadoEscena;
  /** Llegó al mínimo de intervenciones y cumplió todo: puede terminar. */
  metaCumplida: boolean;
  /** Llegó al tope: la escena se cierra. */
  cerrada: boolean;
  tokensEntrada: number;
  tokensSalida: number;
}

/**
 * Un turno del alumno. No cobra: la ruta cobra antes de llamar y
 * devuelve la intervención si algo falla o la IA no responde.
 */
export async function turnoDeEscena(
  userId: string,
  nombre: string,
  conversacionId: string,
  entrada: { texto?: string; audioBase64?: string; mimeType?: string }
): Promise<{ ok: true; r: ResultadoTurno } | { ok: false; error: ErrorEscena }> {
  const leida = await leerEscena(userId, conversacionId);
  if (!leida) return { ok: false, error: "no_existe" };
  const estado = leida.estado;
  if (estado.terminada) return { ok: false, error: "terminada" };
  const u = await ubicar(userId, estado, leida.nivel);
  if (!u) return { ok: false, error: "no_existe" };
  if (desactualizada(estado, u)) return { ok: false, error: "desactualizada" };
  const intervencionesAntes = estado.intervenciones;

  const total = u.escenario
    ? u.escenario.tareas.length
    : u.adivina
      ? u.adivina.rondas.length
      : u.ensenale
        ? u.ensenale.preguntas.length
        : u.entrevista!.datos.length;
  const todas = estado.cumplidas.length >= total;
  // El tope se aplica en el servidor: sin las tareas cumplidas, al máximo
  // la escena se cierra (Allison propone repasar); con todo cumplido, el
  // alumno puede seguir hablando hasta el doble.
  if (estado.intervenciones >= (todas ? topeDuro(u) : u.maximo)) return { ok: false, error: "terminada" };
  const ultimo = estado.intervenciones + 1 >= (todas ? topeDuro(u) : u.maximo);
  const vacio = { nuevas: [], estado, metaCumplida: false, cerrada: false };
  let r: ResultadoTurno;

  if (u.escenario) {
    // Hablado, primero se transcribe A CIEGAS, sin la conversación: con el
    // audio y el historial juntos, el modelo copiaba lo que el alumno había
    // dicho antes ("Hello, good morning." dos veces) en vez de oír lo nuevo
    // (prueba en producción, octubre de 2026).
    let texto = entrada.texto?.trim() ?? "";
    let tokensEntrada = 0;
    let tokensSalida = 0;
    if (!texto && entrada.audioBase64) {
      const tr = await transcribirACiegas(entrada.audioBase64, entrada.mimeType ?? "audio/webm");
      texto = tr.transcripcion;
      tokensEntrada += tr.tokensEntrada;
      tokensSalida += tr.tokensSalida;
    }
    if (!texto) {
      return {
        ok: true,
        r: { ...vacio, estado: estadoPublico(estado), sinVoz: true, transcripcion: "", respuesta: REPETIR, respuestaVoz: REPETIR, tokensEntrada, tokensSalida },
      };
    }
    const filas = await sql`
      select rol, texto from mensajes where conversacion_id = ${conversacionId}
       order by creado_en desc limit 20
    `;
    const t = await turnoDeEscenario({
      escenario: u.escenario,
      nivel: u.nivel,
      nombre,
      // De Allison solo va su parte en inglés: "En inglés se dice así:"
      // en el historial empujaba al modelo a contestar en español.
      historial: filas.reverse().map((f) => ({
        rol: f.rol,
        texto: f.rol === "allison" ? soloIngles(f.texto) || f.texto : f.texto,
      })),
      cumplidas: estado.cumplidas,
      ultimo,
      turno: estado.intervenciones + 1,
      minimo: u.minimo,
      extra: u.extra,
      texto,
    });
    tokensEntrada += t.tokensEntrada;
    tokensSalida += t.tokensSalida;
    if (t.sinRespuesta) {
      return { ok: true, r: { ...vacio, sinRespuesta: true, transcripcion: t.transcripcion, respuesta: "", respuestaVoz: "", tokensEntrada, tokensSalida } };
    }
    r = {
      ...vacio,
      transcripcion: t.transcripcion,
      respuesta: t.respuesta,
      respuestaVoz: t.respuestaVoz,
      nuevas: t.tareas,
      tokensEntrada,
      tokensSalida,
    };
    if (t.error) estado.errores = [...(estado.errores ?? []), t.error].slice(-5);
    estado.idea = t.idea ?? null;
  } else if (u.adivina) {
    const juego = estado.adivina;
    if (!juego || juego.ronda >= juego.rondas.length) return { ok: false, error: "terminada" };
    let transcripcion = entrada.texto?.trim() ?? "";
    let tokensEntrada = 0;
    let tokensSalida = 0;
    if (!transcripcion && entrada.audioBase64) {
      const tr = await transcribirACiegas(entrada.audioBase64, entrada.mimeType ?? "audio/webm");
      transcripcion = tr.transcripcion;
      tokensEntrada += tr.tokensEntrada;
      tokensSalida += tr.tokensSalida;
    }
    if (!transcripcion) {
      return {
        ok: true,
        r: { ...vacio, estado: estadoPublico(estado), sinVoz: true, transcripcion: "", respuesta: REPETIR, respuestaVoz: REPETIR, tokensEntrada, tokensSalida },
      };
    }
    const l = await clasificarAdivina({ adivina: u.adivina, transcripcion });
    tokensEntrada += l.tokensEntrada;
    tokensSalida += l.tokensSalida;
    const secreto = juego.rondas[juego.ronda];
    const a = respuestaDeAdivina(u.adivina, l, {
      secreto,
      descartadas: juego.descartadas,
      preguntadas: juego.preguntadas,
      ultima: juego.ronda >= juego.rondas.length - 1,
    });
    // Se califica cada pregunta o intento de adivinar que se entendió; es
    // un acierto si salió sin intentos fallidos justo antes.
    if (a.entendida) {
      juego.calificadas += 1;
      if (juego.fallosSeguidos === 0) juego.aciertos += 1;
    }
    juego.fallosSeguidos = a.fallo ? juego.fallosSeguidos + 1 : a.entendida ? 0 : juego.fallosSeguidos;
    if (a.fallo) estado.ayudas += 1;
    juego.descartadas = [...new Set([...juego.descartadas, ...a.descartar])];
    if (a.preguntada) juego.preguntadas = [...new Set([...juego.preguntadas, a.preguntada])];
    let respuesta = a.respuesta;
    let nuevas: number[] = [];
    if (a.gano) {
      nuevas = [juego.ronda + 1];
      juego.ganadas = [...juego.ganadas, secreto];
      juego.ronda += 1;
      juego.descartadas = [];
      juego.preguntadas = [];
      juego.fallosSeguidos = 0;
    } else if (ultimo) {
      // Llegó al tope sin adivinar: Allison dice la respuesta y el juego termina.
      respuesta = `Good try! The answer was: ${secreto}.`;
    }
    r = { ...vacio, transcripcion, respuesta, respuestaVoz: respuesta, nuevas, tokensEntrada, tokensSalida };
  } else if (u.ensenale) {
    const juego = estado.ensenale ?? { actual: 0, intentos: 0 };
    if (juego.actual >= u.ensenale.preguntas.length) return { ok: false, error: "terminada" };
    let transcripcion = entrada.texto?.trim() ?? "";
    let tokensEntrada = 0;
    let tokensSalida = 0;
    if (!transcripcion && entrada.audioBase64) {
      const tr = await transcribirACiegas(entrada.audioBase64, entrada.mimeType ?? "audio/webm");
      transcripcion = tr.transcripcion;
      tokensEntrada += tr.tokensEntrada;
      tokensSalida += tr.tokensSalida;
    }
    if (!transcripcion) {
      return { ok: true, r: { ...vacio, sinVoz: true, transcripcion: "", respuesta: REPETIR, respuestaVoz: REPETIR, tokensEntrada, tokensSalida } };
    }
    const l = await clasificarEnsenale({ ensenale: u.ensenale, pregunta: u.ensenale.preguntas[juego.actual].pregunta, transcripcion });
    tokensEntrada += l.tokensEntrada;
    tokensSalida += l.tokensSalida;
    const a = respuestaDeEnsenale({ ensenale: u.ensenale, lectura: l, actual: juego.actual, intentos: juego.intentos });
    // Si no respondió (en español, muy corto o sin entenderse), Allison le
    // dio la pregunta más simple: cuenta como ayuda.
    if (!a.respondida && (l.espanol || l.tipo === "corta" || l.tipo === "otro")) estado.ayudas += 1;
    estado.ensenale = { actual: a.actual, intentos: a.intentos };
    r = {
      ...vacio,
      transcripcion,
      respuesta: a.respuesta,
      respuestaVoz: a.respuesta,
      nuevas: a.respondida ? [juego.actual + 1] : [],
      tokensEntrada,
      tokensSalida,
    };
  } else {
    let transcripcion = entrada.texto?.trim() ?? "";
    let tokensEntrada = 0;
    let tokensSalida = 0;
    if (!transcripcion && entrada.audioBase64) {
      const tr = await transcribirACiegas(entrada.audioBase64, entrada.mimeType ?? "audio/webm");
      transcripcion = tr.transcripcion;
      tokensEntrada += tr.tokensEntrada;
      tokensSalida += tr.tokensSalida;
    }
    if (!transcripcion) {
      return { ok: true, r: { ...vacio, sinVoz: true, transcripcion: "", respuesta: REPETIR, respuestaVoz: REPETIR, tokensEntrada, tokensSalida } };
    }
    const c = await clasificarEntrevista({ entrevista: u.entrevista!, transcripcion, devuelta: estado.devuelta ?? undefined });
    tokensEntrada += c.tokensEntrada;
    tokensSalida += c.tokensSalida;
    const a = respuestaDeEntrevista({
      entrevista: u.entrevista!,
      clasificacion: c,
      descubiertos: estado.cumplidas,
      turno: estado.intervenciones,
      nivel: u.nivel,
    });
    // Si Allison tuvo que darle la pregunta, cuenta como pista. Contestar
    // su "And you?" en español no es pedir ayuda.
    if (c.tipo !== "respuesta" && (c.espanol || c.tipo === "otro")) estado.ayudas += 1;
    estado.devuelta = a.devuelta;
    r = {
      ...vacio,
      transcripcion,
      respuesta: a.respuesta,
      respuestaVoz: a.respuestaVoz,
      nuevas: a.descubierto && !estado.cumplidas.includes(a.descubierto) ? [a.descubierto] : [],
      tokensEntrada,
      tokensSalida,
    };
  }

  // No se oyó nada: no cuenta como intento ni para la meta (sí gasta, la
  // IA ya se usó). No se guarda nada.
  if (!r.transcripcion) {
    return { ok: true, r: { ...r, estado: estadoPublico(estado), sinVoz: true, nuevas: [], respuesta: REPETIR, respuestaVoz: REPETIR } };
  }

  estado.cumplidas = [...new Set([...estado.cumplidas, ...r.nuevas])].sort((a, b) => a - b);
  estado.intervenciones += 1;
  const todasAhora = estado.cumplidas.length >= total;
  if (u.ensenale) {
    // Enséñale termina al hacer las cuatro preguntas, respondidas o no.
    const hechas = (estado.ensenale?.actual ?? 0) >= u.ensenale.preguntas.length;
    r.metaCumplida = hechas;
    r.cerrada = hechas || estado.intervenciones >= u.maximo;
    if (r.cerrada) estado.terminada = true;
  } else {
    r.metaCumplida = todasAhora && estado.intervenciones >= u.minimo;
    r.cerrada = estado.intervenciones >= (todasAhora ? topeDuro(u) : u.maximo);
  }
  // Si en el camino se cerró la escena, se pidió una ayuda o llegó otro
  // turno, no se pisa: el turno no cuenta y la ruta devuelve la intervención.
  if (!(await guardarTurno(conversacionId, estado, intervencionesAntes))) return { ok: false, error: "ocupada" };
  r.estado = estadoPublico(estado);

  await sql`
    insert into mensajes (conversacion_id, user_id, rol, texto, correcciones)
    values (${conversacionId}, ${userId}, 'alumno', ${r.transcripcion}, '[]'::jsonb)
  `;
  await sql`
    insert into mensajes (conversacion_id, user_id, rol, texto, texto_voz, correcciones)
    values (${conversacionId}, ${userId}, 'allison', ${r.respuesta},
            ${r.respuestaVoz !== r.respuesta ? r.respuestaVoz : null}, '[]'::jsonb)
  `;
  return { ok: true, r };
}

/** Lo que dice la ayuda cuando la idea responde una pregunta de más, no una tarea. */
const RESPONDE_SU_PREGUNTA = "Responde su pregunta.";

/**
 * "Ayuda" en el escenario: apaga una estrella. Devuelve qué decir ahora,
 * de acuerdo con lo último que dijo Allison (la idea que escribió el
 * modelo con su línea). En el escenario de una parada, cuando Allison
 * pregunta por la tarea, va la ayuda aprobada del contenido (en A2, solo
 * el comienzo de la frase); la idea solo cuando hace una pregunta de más.
 * En el catálogo, los viajes y los escenarios propios, siempre la idea.
 * Sin idea (el primer turno), la frase de la tarea que sigue.
 */
export async function pedirAyuda(
  userId: string,
  conversacionId: string
): Promise<
  { ok: true; tarea: number; frase: string; es: string; explicacion: string; estado: EstadoEscena } | { ok: false; error: ErrorEscena }
> {
  const leida = await leerEscena(userId, conversacionId);
  if (!leida) return { ok: false, error: "no_existe" };
  const u = await ubicar(userId, leida.estado, leida.nivel);
  if (!u?.escenario) return { ok: false, error: "no_existe" };
  const estado = leida.estado;
  if (estado.terminada) return { ok: false, error: "terminada" };
  if (desactualizada(estado, u)) return { ok: false, error: "desactualizada" };
  const tarea = tareasVisibles(u.escenario, estado.cumplidas).find((n) => !estado.cumplidas.includes(n)) ?? u.escenario.tareas.length;
  // Solo se suma la ayuda, sin reescribir el resto: un turno que esté en
  // camino guarda después sus tareas sin borrar esta ayuda.
  const [fila] = await sql`
    update conversaciones
       set ruta = jsonb_set(ruta, '{ayudas}', to_jsonb(coalesce((ruta->>'ayudas')::int, 0) + 1)),
           ultima_actividad_en = now()
     where id = ${conversacionId}
    returning (ruta->>'ayudas')::int as ayudas
  `;
  estado.ayudas = fila?.ayudas ?? estado.ayudas + 1;
  const deParada = !estado.clave && !estado.viaje;
  const idea = estado.idea;
  if (idea?.en && (!deParada || idea.tarea === 0)) {
    return {
      ok: true,
      tarea: idea.tarea || tarea,
      frase: idea.en,
      es: idea.es,
      explicacion: idea.tarea ? (u.escenario.tareas[idea.tarea - 1] ?? "") : RESPONDE_SU_PREGUNTA,
      estado: estadoPublico(estado),
    };
  }
  return {
    ok: true,
    tarea,
    // Los viajes y los escenarios propios no tienen diálogo de ejemplo: la
    // frase la sugiere la ayuda de siempre (/api/ayuda) en la pantalla.
    frase: ayudasDe(u.escenario)[tarea - 1] ?? "",
    es: "",
    explicacion: u.escenario.tareas[tarea - 1] ?? "",
    estado: estadoPublico(estado),
  };
}

export interface FinDeEscena {
  estrellas: number;
  cumplidas: number[];
  total: number;
  sello: boolean;
  /** Salto: si pasó. */
  saltoLogrado?: boolean;
  /** Lo que se le muestra para mejorar (máximo un punto). */
  mejora: { dijo: string; mejor: string } | null;
}

/** Cierra un escenario, un viaje o un escenario del catálogo: estrellas y estampilla. */
export async function terminarEscenario(
  userId: string,
  nivel: Nivel,
  conversacionId: string
): Promise<{ ok: true; fin: FinDeEscena } | { ok: false; error: ErrorEscena }> {
  const leida = await leerEscena(userId, conversacionId);
  if (!leida) return { ok: false, error: "no_existe" };
  const estado = leida.estado;
  const u = await ubicar(userId, estado, leida.nivel);
  if (!u?.escenario) return { ok: false, error: "no_existe" };
  if ((estado.actividad === "escenario" || estado.actividad === "entrevista") && u.nivel !== nivel) {
    return { ok: false, error: "no_existe" };
  }

  const total = u.escenario.tareas.length;
  const estrellas = estrellasDeEscenario(estado.cumplidas.length, total, estado.ayudas);
  const mejora = estado.errores?.[0] ?? null;

  let sello = false;
  let saltoLogrado: boolean | undefined;
  if (!estado.terminada && (await cerrarEscena(conversacionId, estado))) {

    if (estado.actividad === "viaje") {
      await sql`
        insert into viajes_avance (user_id, viaje, estrellas, sello_en, veces)
        values (${userId}, ${estado.viaje!}, ${estrellas}, ${estrellas >= 1 ? new Date() : null}, 1)
        on conflict (user_id, viaje) do update
           set estrellas = greatest(viajes_avance.estrellas, excluded.estrellas),
               sello_en = coalesce(viajes_avance.sello_en, excluded.sello_en),
               veces = viajes_avance.veces + 1,
               actualizado_en = now()
      `;
      sello = estrellas >= 1;
    } else if (estado.actividad === "catalogo") {
      await sql`
        insert into escenarios_avance (user_id, escenario, estrellas, veces)
        values (${userId}, ${estado.clave!}, ${estrellas}, 1)
        on conflict (user_id, escenario) do update
           set estrellas = greatest(escenarios_avance.estrellas, excluded.estrellas),
               veces = escenarios_avance.veces + 1,
               ultimo_en = now()
      `;
    } else if (estado.salto) {
      saltoLogrado = pasaElSalto(estrellas, estado.ayudas);
      if (saltoLogrado) {
        const ruta = await estadoRutaDe(userId, nivel);
        const claves = ruta?.paradas.map((p) => p.clave) ?? [];
        const hasta = claves.indexOf(estado.parada);
        const desde = ruta?.paradas.findIndex((p) => p.estado === "en-curso") ?? -1;
        // Las de en medio quedan saltadas; la de destino gana su estampilla
        // y también queda saltada, porque sus lecciones están por hacer.
        for (let i = Math.max(0, desde); i <= hasta; i++) {
          await sql`
            insert into ruta_paradas (user_id, parada, saltada_en)
            values (${userId}, ${claves[i]}, now())
            on conflict (user_id, parada) do update
               set saltada_en = coalesce(ruta_paradas.saltada_en, now()), actualizado_en = now()
          `;
        }
        await sql`
          update ruta_paradas
             set sello_en = coalesce(sello_en, now()), estrellas = greatest(estrellas, ${estrellas})
           where user_id = ${userId} and parada = ${estado.parada}
        `;
        sello = true;
      }
    } else if (estrellas >= 1) {
      await sql`
        insert into ruta_paradas (user_id, parada, estrellas, sello_en)
        values (${userId}, ${estado.parada}, ${estrellas}, now())
        on conflict (user_id, parada) do update
           set estrellas = greatest(ruta_paradas.estrellas, excluded.estrellas),
               sello_en = coalesce(ruta_paradas.sello_en, now()),
               actualizado_en = now()
      `;
      sello = true;
    }

    // Los errores de un escenario de la ruta pasan al repaso sorpresa
    // (plan, sección 22: "Los errores del intento pasan al repaso
    // sorpresa"): la frase dicha bien, para repetirla.
    if (estado.actividad === "escenario") {
      for (const e of (estado.errores ?? []).slice(0, 3)) {
        await sql`
          insert into ruta_fallos (user_id, parada, leccion, paso, item)
          values (${userId}, ${estado.parada}, 0, 0, ${e.mejor.slice(0, 200)})
          on conflict (user_id, parada, leccion, paso, item) do update
             set veces = ruta_fallos.veces + 1, ultimo_en = now(), repasado_en = null
        `;
      }
    }
  }

  return { ok: true, fin: { estrellas, cumplidas: estado.cumplidas, total, sello, saltoLogrado, mejora } };
}
