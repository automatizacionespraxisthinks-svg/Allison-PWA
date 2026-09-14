import { NextResponse } from "next/server";
import { z } from "zod";
import { registrarResultado } from "@/lib/cobro";
import { sql } from "@/lib/db";
import { limitar } from "@/lib/limite";
import { pasarela } from "@/lib/pasarela";
import { alumnoActual } from "@/lib/sesion";

const Peticion = z.object({ transaccionId: z.string().uuid() });

/**
 * Consultas por minuto por alumno. La pantalla pregunta cada 4
 * segundos; esto deja margen y a la vez impide usar la ruta para
 * martillar la API de la pasarela.
 */
const CONSULTAS_POR_MINUTO = 30;

/**
 * Cada cuánto, como máximo, se le pregunta a la pasarela por la MISMA
 * orden. Entre tanto se responde con lo que ya sabe la base: varias
 * pestañas o varias cuentas no multiplican las llamadas a la pasarela.
 */
const MS_ENTRE_CONSULTAS = 8_000;

/** La última consulta por orden: cuándo, y si había un pago en curso.
 *  Lo segundo se recuerda porque la pantalla pregunta más seguido de lo
 *  que se consulta: sin eso, la pregunta intermedia respondería con el
 *  "rechazada" de la base y la pantalla dejaría de esperar un pago que
 *  sigue en curso. */
const ultimaConsulta = new Map<string, { en: number; enCurso: boolean }>();

/**
 * ¿Ya se confirmó mi pago?
 *
 * La pregunta la hace la pantalla a la que vuelve el alumno después de
 * pagar. Si la orden sigue sin aprobar y la pasarela permite consultar
 * (Bold, cuyo aviso puede tardar hasta 10 minutos), se le pregunta
 * directamente, y lo que responda entra por el MISMO camino que el
 * aviso: registrarResultado. Así el alumno ve su saldo en segundos, y
 * aunque el aviso llegue después, no se acredita dos veces.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`confirmar:${alumno.id}`, CONSULTAS_POR_MINUTO, 60);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const datos = Peticion.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  // La orden tiene que ser de quien pregunta.
  const leer = () => sql`
    select id, estado, pasarela, referencia_externa, mensajes_otorgados,
           payload->>'id_pasarela' as id_pasarela
      from transacciones
     where id = ${datos.data.transaccionId} and user_id = ${alumno.id}
     limit 1
  `;

  let [orden] = await leer();
  if (!orden) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  let estado: string = orden.estado;

  // También se consulta una orden RECHAZADA: con Bold, un intento
  // fallido deja el link activo, y el alumno pudo pagar al reintentar.
  // Una orden en cualquier otro estado (aprobada, reversada a mano) no.
  const consultable =
    (orden.estado === "pendiente" || orden.estado === "rechazada") && orden.id_pasarela;
  const ahora = Date.now();
  const anterior = ultimaConsulta.get(orden.id);
  const reciente = anterior !== undefined && ahora - anterior.en < MS_ENTRE_CONSULTAS;

  if (consultable && reciente && anterior.enCurso) {
    estado = "pendiente";
  } else if (consultable && !reciente) {
    const via = pasarela();
    if (via.consultarEstado && via.nombre === orden.pasarela) {
      if (ultimaConsulta.size > 5_000) ultimaConsulta.clear();
      ultimaConsulta.set(orden.id, { en: ahora, enCurso: false });

      try {
        const consulta = await via.consultarEstado({
          referencia: orden.referencia_externa,
          idExterno: orden.id_pasarela,
        });

        if (consulta.estado === "aprobado" || consulta.estado === "rechazado") {
          await registrarResultado({
            pasarela: orden.pasarela,
            referencia: orden.referencia_externa,
            aprobado: consulta.estado === "aprobado",
            montoCop: consulta.estado === "aprobado" ? consulta.montoCop : undefined,
            rastro: consulta.rastro,
            origen: "consulta",
          });
          [orden] = await leer();
          estado = orden.estado;
        } else if (consulta.estado === "pendiente") {
          // Hay un pago EN CURSO: aunque un intento anterior dejara la
          // orden rechazada, la pantalla debe seguir esperando y no
          // invitar a pagar otra vez.
          ultimaConsulta.set(orden.id, { en: ahora, enCurso: true });
          estado = "pendiente";
        }
      } catch (e) {
        // Si la pasarela no responde, se contesta con lo que hay: el
        // aviso sigue en camino y la pantalla volverá a preguntar.
        console.warn(
          "No se pudo consultar el estado del pago:",
          e instanceof Error ? e.message : e
        );
      }
    }
  }

  return NextResponse.json({ estado, mensajes: orden.mensajes_otorgados });
}
