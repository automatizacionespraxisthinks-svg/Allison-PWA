import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { cargoDeClave, escenarioDeEntrevista, esEntrevista } from "@/lib/escenarios/entrevista";
import { generarInforme, type Informe } from "@/lib/escenarios/informe";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";
import type { Nivel } from "@/lib/tipos";
import { esUuid } from "@/lib/validar";

/** El informe lee toda la entrevista: tarda unos 3 a 8 segundos. */
export const maxDuration = 45;

/**
 * El informe de la entrevista de trabajo: cómo le fue, qué frases se
 * dicen mejor y una respuesta de ejemplo (src/lib/escenarios/informe.ts).
 *
 * Cuesta UNA intervención (decisión del usuario, 18 de noviembre de 2026)
 * y solo la primera vez: queda guardado con la escena y volver a verlo es
 * gratis. Si la IA falla, la intervención se devuelve. Solo de una
 * entrevista del alumno y ya terminada.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const cuerpo = (await peticion.json().catch(() => null)) as { conversacion?: unknown } | null;
  const conversacion = typeof cuerpo?.conversacion === "string" ? cuerpo.conversacion : "";
  if (!esUuid(conversacion)) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });

  const limite = limitar(`informe:${alumno.id}`, 10, 300);
  if (!limite.permitido) {
    return NextResponse.json({ error: "muy_rapido", mensaje: "Vas muy rápido. Espera un momento." }, { status: 429 });
  }

  const [c] = await sql`
    select ruta, nivel_al_iniciar from conversaciones
     where id = ${conversacion} and user_id = ${alumno.id} and modo = 'ruta'
  `;
  const estado = c?.ruta as { clave?: string; nivel?: Nivel; cumplidas?: number[]; terminada?: boolean; informe?: Informe } | undefined;
  if (!estado || !esEntrevista(estado.clave ?? "")) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!estado.terminada) {
    return NextResponse.json({ error: "sin_terminar", mensaje: "Termina la entrevista para ver tu informe." }, { status: 409 });
  }
  // Ya se hizo (y se cobró): se entrega el mismo.
  if (estado.informe) return NextResponse.json({ informe: estado.informe, cobrado: false });

  const cargo = cargoDeClave(estado.clave!);
  if (!cargo) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const nivel = (estado.nivel ?? (c.nivel_al_iniciar as Nivel) ?? alumno.nivel) as Nivel;
  const escenario = escenarioDeEntrevista(nivel, cargo);

  const mensajes = (
    await sql`select rol, texto from mensajes where conversacion_id = ${conversacion} order by creado_en asc limit 60`
  ).map((m) => ({ rol: m.rol as "alumno" | "allison", texto: String(m.texto ?? "") }));
  if (!mensajes.some((m) => m.rol === "alumno" && m.texto.trim())) {
    return NextResponse.json({ error: "sin_charla", mensaje: "No hay nada que revisar: no alcanzaste a hablar en esta entrevista." }, { status: 409 });
  }

  const [{ consumir_mensaje: bolsa }] = await sql`select consumir_mensaje(${alumno.id}, null)`;
  if (!bolsa) {
    return NextResponse.json({ error: "sin_mensajes", mensaje: "Te quedaste sin intervenciones." }, { status: 402 });
  }
  const fallo = async () => {
    await sql`select devolver_mensaje(${alumno.id}, ${bolsa}::bolsa_credito)`.catch(() => {});
    return NextResponse.json({ error: "fallo_ia", mensaje: "No pudimos hacer tu informe. No te cobramos. Intenta otra vez." }, { status: 502 });
  };

  let r: Awaited<ReturnType<typeof generarInforme>>;
  try {
    r = await generarInforme({
      nivel,
      nombre: alumno.nombre.split(" ")[0],
      cargo: cargo.en ?? cargo.es,
      tareas: escenario.tareas,
      cumplidas: estado.cumplidas ?? [],
      mensajes,
    });
  } catch (e) {
    console.error("Fallo en el informe de la entrevista:", e instanceof Error ? e.message : e);
    return fallo();
  }
  if (!r.informe) return fallo();

  // Se guarda con la escena. Si otra petición lo guardó primero (dos
  // toques), queda el suyo y esta intervención se devuelve.
  const guardado = await sql`
    update conversaciones
       set ruta = jsonb_set(ruta, '{informe}', ${sql.json(r.informe as unknown as never)})
     where id = ${conversacion} and user_id = ${alumno.id} and not (ruta ? 'informe')
    returning id
  `;
  if (!guardado.length) {
    await sql`select devolver_mensaje(${alumno.id}, ${bolsa}::bolsa_credito)`.catch(() => {});
    const [otra] = await sql`select ruta->'informe' as informe from conversaciones where id = ${conversacion}`;
    return NextResponse.json({ informe: otra?.informe ?? r.informe, cobrado: false });
  }

  void sql`select registrar_uso(${alumno.id}, 'ayuda', ${r.tokensEntrada}, ${r.tokensSalida}, 0, true, false)`.catch(() => {});
  const [saldo] = await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}`.catch(() => []);
  return NextResponse.json({
    informe: r.informe,
    cobrado: true,
    ...(saldo ? { restantes: saldo.mensajes_plan + saldo.mensajes_recarga } : {}),
  });
}
