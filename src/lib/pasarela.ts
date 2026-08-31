import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

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
//  Wompi — pendiente de llaves reales
// ---------------------------------------------------------------------
const wompi: Pasarela = {
  nombre: "wompi",
  simulada: false,

  async crearPago() {
    throw new Error(
      "Wompi todavía no está configurado. Faltan WOMPI_PUBLIC_KEY y WOMPI_PRIVATE_KEY."
    );
  },

  verificarFirma(cuerpoCrudo, cabeceras) {
    const secreto = process.env.WOMPI_EVENTS_SECRET ?? "";
    if (!secreto) return false;
    const firma = cabeceras.get("x-event-checksum") ?? "";
    const esperada = createHmac("sha256", secreto).update(cuerpoCrudo).digest("hex");
    return igualSeguro(firma.toLowerCase(), esperada);
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
