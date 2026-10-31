import { NextResponse } from "next/server";
import { leerAjustes } from "@/lib/ajustes";
import { registrarResultado } from "@/lib/cobro";
import { sql } from "@/lib/db";
import { pasarela } from "@/lib/pasarela";
import { avisar, avisoDeRacha } from "@/lib/avisos";
import { correo, correoDeRacha } from "@/lib/correo";
import { autorizadaPorSecreto } from "@/lib/tareas";

/**
 * Borrado de conversaciones vencidas.
 *
 * La llama cada hora una tarea programada de Dokploy (cada hora y no
 * cada día por la conciliación de pagos, más abajo). Vive en la
 * aplicación porque borrar aquí es una sola sentencia contra la base.
 *
 * Se protege con un secreto compartido, no con sesión: quien la invoca
 * es una máquina, no una persona.
 */

export async function POST(peticion: Request) {
  return limpiar(peticion);
}

async function limpiar(peticion: Request) {
  if (!autorizadaPorSecreto(peticion)) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }

  const [{ borrar_conversaciones_vencidas: borradas }] =
    await sql`select borrar_conversaciones_vencidas()`;

  // Los enlaces de verificación y recuperación ya usados o vencidos
  // tampoco tienen por qué acumularse.
  const [{ count: tokens }] = await sql`
    with a as (
      delete from verificaciones_correo
       where expira_en < now() - interval '30 days' returning 1
    ), b as (
      delete from recuperaciones_clave
       where expira_en < now() - interval '30 days' returning 1
    )
    select (select count(*) from a) + (select count(*) from b) as count
  `;

  const renovadas = await renovarPlanes();
  const conciliados = await conciliarPagos();
  const recordados = await recordarRachas();

  // Órdenes de pago que se abrieron y nunca se pagaron. A las 48 horas
  // son carritos abandonados: se cierran para que no ensucien los
  // reportes de pagos ni la auditoría de integridad. Cerrarla no le
  // quita nada a nadie: si la pasarela confirmara después un pago que
  // SÍ se hizo, acreditar_transaccion acredita también una orden
  // rechazada — el dinero llegó, y cobrar sin entregar sería peor.
  //
  // Una orden con alerta (monto distinto, pago anulado) NO es un carrito
  // abandonado: el alumno pudo pagar y está en «Pagos por revisar» del
  // panel. Cerrarla como rechazada la hacía pasar por un abandono
  // (auditoría, 30 de octubre de 2026).
  const abandonadas = await sql`
    update transacciones set estado = 'rechazada'
     where estado = 'pendiente' and creado_en < now() - interval '48 hours'
       and payload->>'alerta' is null
     returning id
  `;

  console.log(
    `Limpieza: ${borradas} conversaciones, ${tokens} enlaces vencidos, ${renovadas} planes renovados, ` +
      `${conciliados} pagos conciliados, ${abandonadas.length} órdenes abandonadas y ${recordados} recordatorios de racha`
  );

  return NextResponse.json({
    ok: true,
    conversacionesBorradas: borradas,
    enlacesBorrados: Number(tokens),
    ordenesAbandonadas: abandonadas.length,
    planesRenovados: renovadas,
    pagosConciliados: conciliados,
    recordatoriosDeRacha: recordados,
  });
}

/**
 * El recordatorio de la racha (plan, sección 10): a la hora que eligió
 * el alumno, solo el último día antes de perderla (con los días de
 * descanso de los ajustes, 2 por defecto: si practicó hace tres días y
 * hoy no, mañana se reinicia). Uno por día como mucho, y nunca tumba la
 * limpieza.
 *
 * Va al celular si el alumno activó los avisos; si no le llegó a ningún
 * celular, por correo. Nunca los dos el mismo día. Los alumnos de
 * colegio no tienen correo: para ellos el celular es el único camino.
 * Cada canal se apaga desde Ajustes del panel.
 */
async function recordarRachas(): Promise<number> {
  let enviados = 0;
  try {
    const ajustes = await leerAjustes();
    if (!ajustes.recordatorioCorreo && !ajustes.recordatorioCelular) return 0;
    const pendientes = await sql`
      select id, nombre, email, racha_dias
        from users u
       where activo and recordatorio_hora is not null
         and (email is not null or exists (select 1 from suscripciones_push s where s.user_id = u.id))
         and racha_dias > 0
         and ultima_practica_en::date = current_date - (dias_descanso() + 1)
         and extract(hour from recordatorio_hora) = extract(hour from now() at time zone 'America/Bogota')
         and (recordatorio_enviado_en is null or recordatorio_enviado_en < current_date)
       limit 500
    `;
    const enlace = `${(process.env.AUTH_URL ?? "").replace(/\/$/, "")}/ruta`;
    for (const u of pendientes) {
      try {
        const nombre = u.nombre.split(" ")[0];
        const alCelular = ajustes.recordatorioCelular ? await avisar(u.id, avisoDeRacha(nombre, u.racha_dias)) : 0;
        if (!alCelular) {
          if (!ajustes.recordatorioCorreo || !u.email) continue;
          await correo().enviar({ ...correoDeRacha(nombre, u.racha_dias, enlace), para: u.email });
        }
        await sql`update users set recordatorio_enviado_en = current_date where id = ${u.id}`;
        enviados++;
      } catch (e) {
        console.error(`No se pudo enviar el recordatorio a ${u.id}:`, e instanceof Error ? e.message : e);
      }
    }
  } catch (e) {
    console.error("Recordatorios de racha omitidos:", e instanceof Error ? e.message : e);
  }
  return enviados;
}

/**
 * Los planes cuyo mes terminó: vence lo que sobró y llega el mes nuevo,
 * o el plan termina (db/020_renovacion_planes.sql).
 *
 * Quien entra a la app se pone al día solo, al cargar su saldo; esto es
 * para quien no entra, y para que el panel no muestre como activos
 * planes que ya terminaron. Una persona a la vez, y cada una con su
 * propio intento: un error con alguien no deja sin renovar a los demás.
 */
async function renovarPlanes(): Promise<number> {
  let renovadas = 0;
  try {
    const pendientes = await sql`
      select user_id from suscripciones
       where estado = 'activa' and periodo_fin <= now()
       order by periodo_fin
    `;
    for (const { user_id } of pendientes) {
      try {
        const [{ cambio }] = await sql`select renovar_suscripcion(${user_id}) as cambio`;
        if (cambio) renovadas++;
      } catch (e) {
        console.error(
          `No se pudo renovar el plan de ${user_id}:`,
          e instanceof Error ? e.message : e
        );
      }
    }
  } catch (e) {
    console.error("Renovación de planes omitida:", e instanceof Error ? e.message : e);
  }
  return renovadas;
}

/**
 * La red de seguridad de los pagos.
 *
 * Un pago se acredita por el aviso de la pasarela o cuando el alumno
 * vuelve a la app. Si las dos cosas fallan —el aviso se perdió, o llegó
 * sin referencia, y el alumno cerró el navegador—, la persona pagó y no
 * recibió nada. Aquí se le pregunta a la pasarela por cada orden de los
 * últimos tres días que siga abierta, y lo que diga entra por el mismo
 * camino de siempre.
 *
 * Revisa TODAS las abiertas, de la más vieja a la más nueva: con un tope
 * pequeño, unos cuantos checkouts abandonados bastaban para dejar por
 * fuera, día tras día, justo la orden pagada. Un link vencido se marca y
 * no se vuelve a consultar, así que la lista no crece con el abandono.
 *
 * Solo acredita; no rechaza: cerrar órdenes viejas es trabajo de la
 * limpieza. Y nunca tumba la limpieza: si la pasarela no está
 * configurada o no responde, las conversaciones se borran igual —eso
 * es lo que promete la política de privacidad.
 */
const TOPE_CONCILIACION = 500;

async function conciliarPagos(): Promise<number> {
  let acreditados = 0;
  try {
    const via = pasarela();
    if (!via.consultarEstado) return 0;

    const abiertas = await sql`
      select id, referencia_externa, payload->>'id_pasarela' as id_pasarela
        from transacciones
       where pasarela = ${via.nombre}
         and estado in ('pendiente', 'rechazada')
         and payload->>'id_pasarela' is not null
         and payload->>'link_vencido' is null
         -- Con alerta no se acredita sola (registrarResultado la frena):
         -- preguntarle a la pasarela cada hora no serviría de nada.
         and payload->>'alerta' is null
         and creado_en > now() - interval '72 hours'
         and creado_en < now() - interval '15 minutes'
       order by creado_en
       limit ${TOPE_CONCILIACION}
    `;
    if (abiertas.length === TOPE_CONCILIACION) {
      console.warn(
        `Conciliación: ${TOPE_CONCILIACION} órdenes abiertas o más; las que no alcanzaron quedan para la próxima corrida.`
      );
    }

    for (const orden of abiertas) {
      try {
        const consulta = await via.consultarEstado({
          referencia: orden.referencia_externa,
          idExterno: orden.id_pasarela,
        });

        if (consulta.estado === "rechazado" && consulta.definitivo) {
          await sql`
            update transacciones
               set payload = coalesce(payload, '{}'::jsonb) || '{"link_vencido": true}'::jsonb
             where id = ${orden.id}
          `;
          continue;
        }
        if (consulta.estado !== "aprobado") continue;

        const desenlace = await registrarResultado({
          pasarela: via.nombre,
          referencia: orden.referencia_externa,
          aprobado: true,
          montoCop: consulta.montoCop,
          rastro: consulta.rastro,
          origen: "consulta",
        });
        if (desenlace === "acreditado") {
          acreditados++;
          console.warn(
            `Pago conciliado sin aviso de la pasarela: ${orden.referencia_externa}`
          );
        }
      } catch (e) {
        console.warn(
          `No se pudo conciliar ${orden.referencia_externa}:`,
          e instanceof Error ? e.message : e
        );
      }
    }
  } catch (e) {
    console.warn("Conciliación de pagos omitida:", e instanceof Error ? e.message : e);
  }
  return acreditados;
}
