import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Referencia de pago propia: viaja a la pasarela y vuelve en el aviso. */
export function nuevaReferencia(): string {
  return `ALL-${Date.now().toString(36).toUpperCase()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/**
 * La pasarela de pagos, detrás de una interfaz.
 *
 * Hoy corre la implementación SIMULADA porque el trámite con la
 * pasarela real todavía no está. Todo el resto del sistema —cobro,
 * acreditación, saldos, libro de movimientos— es el definitivo. Cuando
 * lleguen las llaves solo se cambia PASARELA en el .env.
 */

export interface PagoCreado {
  urlPago: string;
}

export interface EventoPago {
  referencia: string;
  aprobado: boolean;
}

export interface Pasarela {
  nombre: string;
  /** true si el usuario todavía no puede pagar de verdad. */
  simulada: boolean;
  crearPago(opciones: {
    transaccionId: string;
    /** La generamos nosotros para poder guardarla ANTES de llamar a la
     *  pasarela. Wompi también admite referencia propia. */
    referencia: string;
    montoCop: number;
    concepto: string;
    correo: string | null;
    /** El origen de la petición, para armar la URL de regreso. */
    origen: string;
  }): Promise<PagoCreado>;
  verificarFirma(cuerpoCrudo: string, cabeceras: Headers): boolean;
  interpretarEvento(cuerpo: unknown): EventoPago | null;
}

/** Compara sin filtrar información por el tiempo que tarda. */
function igualSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// ---------------------------------------------------------------------
//  Simulada — para desarrollo y para poder probar el flujo completo
// ---------------------------------------------------------------------
const simulada: Pasarela = {
  nombre: "simulada",
  simulada: true,

  async crearPago({ transaccionId }) {
    return { urlPago: `/pagar/${transaccionId}` };
  },

  verificarFirma(cuerpoCrudo, cabeceras) {
    // Aun simulada se firma: así el webhook se prueba de verdad y no
    // queda un agujero abierto el día que esto llegue a un servidor.
    const secreto = process.env.PASARELA_SECRETO ?? "";
    if (!secreto) return false;

    const firma = cabeceras.get("x-firma") ?? "";
    const esperada = createHmac("sha256", secreto).update(cuerpoCrudo).digest("hex");
    return igualSeguro(firma, esperada);
  },

  interpretarEvento(cuerpo) {
    const e = cuerpo as { referencia?: string; estado?: string };
    if (!e?.referencia) return null;
    return { referencia: e.referencia, aprobado: e.estado === "APPROVED" };
  },
};

// ---------------------------------------------------------------------
//  Wompi — checkout alojado, con la decisión de SOLO QR
//
//  El alumno paga escaneando el QR de Bancolombia/Nequi: es la tarifa
//  del 1% contra el 2,65% + $700 de tarjetas, y en la recarga mínima
//  la diferencia es comerse el 24% o el 1% del ingreso.
//
//  La restricción a solo QR NO se puede imponer desde esta URL — el
//  checkout alojado no tiene parámetro de métodos (verificado en
//  docs.wompi.co) — sino que se configura UNA vez en el panel del
//  comercio: Wompi > configuración > medios de pago > dejar solo QR.
//  El paso está en docs/DESPLIEGUE.md; si algún día se reactivan las
//  tarjetas allá, este código no necesita cambiar.
// ---------------------------------------------------------------------
const wompi: Pasarela = {
  nombre: "wompi",
  simulada: false,

  async crearPago({ referencia, montoCop, origen }) {
    const llavePublica = process.env.WOMPI_PUBLIC_KEY;
    const secretoIntegridad = process.env.WOMPI_INTEGRITY_SECRET;
    if (!llavePublica || !secretoIntegridad) {
      throw new Error(
        "Wompi sin configurar: faltan WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_SECRET."
      );
    }

    const centavos = montoCop * 100;

    // La firma de integridad ata referencia, monto y moneda: sin ella,
    // cualquiera podría abrir un checkout de $4.000 por una recarga de
    // $50.000. Fórmula documentada por Wompi: sha256 de la
    // concatenación referencia + centavos + moneda + secreto.
    const integridad = createHash("sha256")
      .update(`${referencia}${centavos}COP${secretoIntegridad}`)
      .digest("hex");

    const parametros = new URLSearchParams({
      "public-key": llavePublica,
      currency: "COP",
      "amount-in-cents": String(centavos),
      reference: referencia,
      "signature:integrity": integridad,
      // De vuelta a la conversación: el saldo del encabezado refleja
      // la recarga en cuanto el webhook la acredita.
      "redirect-url": `${origen}/practicar`,
    });

    return { urlPago: `https://checkout.wompi.co/p/?${parametros.toString()}` };
  },

  /**
   * Verifica la firma de un evento COMO LA CALCULA WOMPI.
   *
   * No es un HMAC sobre el cuerpo — eso fue un error que habría
   * rechazado todos los avisos reales, dejando al alumno pagando sin
   * recibir nada. Wompi documenta otra cosa (docs.wompi.co, "Eventos"):
   *
   *   sha256( valores de signature.properties, en orden
   *           + timestamp
   *           + secreto de eventos )
   *
   * Los "properties" son rutas dentro de `data` ("transaction.status"),
   * y pueden CAMBIAR con el tiempo: por eso se leen del propio evento
   * en vez de fijarlas aquí. El checksum llega por partida doble — en
   * la cabecera y en el cuerpo —; se prefiere la cabecera, que es lo
   * que un atacante tendría que falsificar junto con todo lo demás.
   */
  verificarFirma(cuerpoCrudo, cabeceras) {
    const secreto = process.env.WOMPI_EVENTS_SECRET ?? "";
    if (!secreto) return false;

    let evento: {
      data?: Record<string, unknown>;
      timestamp?: number | string;
      signature?: { properties?: unknown; checksum?: unknown };
    };
    try {
      evento = JSON.parse(cuerpoCrudo);
    } catch {
      return false;
    }

    const propiedades = evento?.signature?.properties;
    if (!Array.isArray(propiedades) || propiedades.length === 0) return false;
    if (evento.timestamp === undefined || !evento.data) return false;

    // "transaction.status" -> data.transaction.status
    const valor = (ruta: unknown): string | null => {
      if (typeof ruta !== "string") return null;
      let actual: unknown = evento.data;
      for (const paso of ruta.split(".")) {
        if (actual === null || typeof actual !== "object") return null;
        actual = (actual as Record<string, unknown>)[paso];
      }
      // Un campo ausente NO puede pasar como cadena vacía: dos eventos
      // distintos firmarían igual.
      if (actual === null || actual === undefined) return null;
      if (typeof actual === "object") return null;
      return String(actual);
    };

    let concatenado = "";
    for (const ruta of propiedades) {
      const v = valor(ruta);
      if (v === null) return false;
      concatenado += v;
    }
    concatenado += String(evento.timestamp) + secreto;

    const esperada = createHash("sha256").update(concatenado).digest("hex");
    const recibida = String(
      cabeceras.get("x-event-checksum") ?? evento.signature?.checksum ?? ""
    ).toLowerCase();

    return igualSeguro(recibida, esperada);
  },

  interpretarEvento(cuerpo) {
    const e = cuerpo as {
      data?: { transaction?: { reference?: string; status?: string } };
    };
    const t = e?.data?.transaction;
    if (!t?.reference) return null;
    return { referencia: t.reference, aprobado: t.status === "APPROVED" };
  },
};

const PASARELAS: Record<string, Pasarela> = { simulada, wompi };

export function pasarela(): Pasarela {
  const elegida = process.env.PASARELA ?? "simulada";
  const via = PASARELAS[elegida] ?? simulada;

  /**
   * CANDADO DE PRODUCCIÓN. La simulada aprueba pagos sin dinero real:
   * en producción, un despliegue con la variable olvidada regalaría
   * recargas a cualquiera. El candado vive en el CÓDIGO y no en una
   * lista de chequeo porque las listas se saltan y esto no puede
   * depender de que nadie olvide nada. Reventar la página de pago es
   * infinitamente mejor negocio que vender gratis.
   */
  if (process.env.NODE_ENV === "production" && via.simulada) {
    throw new Error(
      "La pasarela simulada no puede correr en producción. " +
        "Define PASARELA=wompi con sus llaves, o no cobres."
    );
  }

  return via;
}

/** Firma un cuerpo como lo haría la pasarela. Solo para pruebas. */
export function firmarComoPasarela(cuerpo: string): string {
  return createHmac("sha256", process.env.PASARELA_SECRETO ?? "")
    .update(cuerpo)
    .digest("hex");
}
