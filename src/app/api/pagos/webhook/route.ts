import { NextResponse } from "next/server";
import { registrarResultado } from "@/lib/cobro";
import { pasarela } from "@/lib/pasarela";

/**
 * Aviso de pago de la pasarela.
 *
 * Es una de las dos puertas por las que se entrega saldo (la otra es la
 * consulta activa del estado), y las dos pasan por registrarResultado.
 * Tres defensas:
 *   1. Firma verificada: sin ella, cualquiera se regala mensajes.
 *   2. Idempotencia: la base rechaza acreditar dos veces la misma
 *      transacción, y la pasarela reenvía avisos con frecuencia.
 *   3. Los mensajes salen de la transacción guardada, no del aviso, y
 *      si el monto cobrado no coincide con la orden, no se acredita.
 *
 * Todo aviso auténtico recibe 200, incluso el que no se procesa: la
 * pasarela reintenta lo que no recibe 200 (Bold, durante un día entero),
 * y reintentar no puede cambiar el resultado.
 */
export async function POST(peticion: Request) {
  const crudo = await peticion.text();
  const via = pasarela();

  if (!via.verificarFirma(crudo, peticion.headers)) {
    // Uno suelto puede ser ruido de internet. TODOS los avisos así
    // significan que la llave secreta configurada no es la de la pasarela.
    console.warn(`Webhook de ${via.nombre} con firma inválida (si pasa con todos, revisa la llave secreta)`);
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const evento = via.interpretarEvento(cuerpo);
  if (!evento) {
    // Una anulación, otro tipo de evento, un pago sin referencia. Se
    // registran el tipo y el id de la transacción en la pasarela —para
    // poder buscarla en su panel— y nada más: el cuerpo trae datos del
    // pagador.
    const e = cuerpo as { type?: unknown; event?: unknown; subject?: unknown };
    const id = typeof e?.subject === "string" ? ` (transacción ${e.subject.slice(0, 40)})` : "";
    console.warn(
      `Aviso de ${via.nombre} sin cobro que procesar: ${String(e?.type ?? e?.event ?? "sin tipo")}${id}`
    );
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const desenlace = await registrarResultado({
    pasarela: via.nombre,
    referencia: evento.referencia,
    aprobado: evento.aprobado,
    montoCop: evento.montoCop,
    rastro: evento.rastro,
    origen: "aviso",
  });

  if (desenlace === "desconocido") {
    console.warn("Webhook de una referencia desconocida:", evento.referencia);
  }

  return NextResponse.json({
    ok: true,
    acreditado: desenlace === "acreditado",
    desenlace,
  });
}
