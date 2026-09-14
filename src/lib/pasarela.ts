import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Referencia de pago propia: viaja a la pasarela y vuelve en el aviso. */
export function nuevaReferencia(): string {
  return `ALL-${Date.now().toString(36).toUpperCase()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/**
 * La pasarela de pagos, detrás de una interfaz.
 *
 * Todo el resto del sistema —cobro, acreditación, saldos, libro de
 * movimientos— es el mismo para cualquier pasarela. Cambiar de una a
 * otra es cambiar PASARELA en el entorno.
 */

export interface PagoCreado {
  urlPago: string;
  /** Identificador que la pasarela le da al pago (el link de Bold), para
   *  poder preguntarle por su estado después. */
  idExterno?: string;
}

export interface EventoPago {
  referencia: string;
  aprobado: boolean;
  /**
   * Lo que la pasarela dice que se cobró, en pesos. Si viene y no
   * coincide con la orden, no se acredita. `undefined` = el aviso no
   * trae monto; `NaN` = lo trae pero no se puede leer como pesos (otra
   * moneda, un texto), y eso nunca coincide con nada.
   */
  montoCop?: number;
}

/** Lo que responde la pasarela cuando se le PREGUNTA por un pago. */
export type EstadoConsultado =
  | { estado: "aprobado"; montoCop: number; detalle: unknown }
  | { estado: "rechazado"; detalle: unknown }
  | { estado: "pendiente"; detalle: unknown };

export interface Pasarela {
  nombre: string;
  /** true si el usuario todavía no puede pagar de verdad. */
  simulada: boolean;
  crearPago(opciones: {
    transaccionId: string;
    /** La generamos nosotros para poder guardarla ANTES de llamar a la
     *  pasarela. */
    referencia: string;
    montoCop: number;
    concepto: string;
    correo: string | null;
    /** La dirección pública de la app, para armar la URL de regreso. */
    origen: string;
  }): Promise<PagoCreado>;
  verificarFirma(cuerpoCrudo: string, cabeceras: Headers): boolean;
  /** null = auténtico, pero no es un cobro que haya que procesar. */
  interpretarEvento(cuerpo: unknown): EventoPago | null;
  /**
   * Preguntarle a la pasarela por un pago, sin esperar su aviso. Solo
   * la tienen las pasarelas cuyo aviso puede tardar o perderse.
   */
  consultarEstado?(orden: {
    referencia: string;
    idExterno: string;
  }): Promise<EstadoConsultado>;
}

const enProduccion = () => process.env.NODE_ENV === "production";

/** Compara sin filtrar información por el tiempo que tarda. */
function igualSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Un monto que llegó de afuera, leído como pesos (ver EventoPago.montoCop). */
function pesosDelAviso(valor: unknown, moneda: unknown): number | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (moneda !== undefined && moneda !== null && moneda !== "COP") return Number.NaN;
  return typeof valor === "number" && Number.isFinite(valor) ? valor : Number.NaN;
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
//  Bold — link de pago creado por API
//
//  El servidor crea un link con monto CERRADO y nuestra referencia, y el
//  navegador lo abre: el alumno escoge el medio en el checkout de Bold.
//  El más barato es el QR Bre-B (2,89% sin valor fijo), que exige tener
//  la Cuenta Bold activa; los demás medios llevan $900 fijos.
//
//  Documentación: developers.bold.co, "API Link de pagos" y "Webhook".
//  Las llaves son las de BOTÓN DE PAGOS: la API de links usa esa llave
//  de identidad, y Bold firma los avisos de esos pagos con su secreta.
// ---------------------------------------------------------------------
const BOLD_API = "https://integrations.api.bold.co";

/** Lo que vive un link antes de vencer: da tiempo de sobra a un PSE. */
const BOLD_MINUTOS_LINK = 60;

/**
 * Modo de pruebas de Bold: llaves de pruebas y avisos firmados con una
 * llave VACÍA (así lo documenta Bold). Nunca en producción: una firma
 * con llave vacía la puede calcular cualquiera, y un pago simulado
 * acreditaría saldo real.
 */
const boldEnPruebas = () => process.env.BOLD_PRUEBAS === "true" && !enProduccion();

/** BOLD_MEDIOS, si se definió: los medios que ofrece el checkout. */
function boldMedios(): string[] {
  return (process.env.BOLD_MEDIOS ?? "")
    .split(",")
    .map((m) => m.trim().toUpperCase())
    .filter((m) => /^[A-Z_]{2,40}$/.test(m));
}

const bold: Pasarela = {
  nombre: "bold",
  simulada: false,

  async crearPago({ transaccionId, referencia, montoCop, concepto, origen }) {
    if (enProduccion() && process.env.BOLD_PRUEBAS === "true") {
      throw new Error(
        "BOLD_PRUEBAS=true no puede correr en producción: los pagos de " +
          "prueba acreditarían saldo real."
      );
    }

    const identidad = process.env.BOLD_LLAVE_IDENTIDAD;
    const secreta = process.env.BOLD_LLAVE_SECRETA;
    // Se exigen LAS DOS antes de cobrar. Con la de identidad sola el
    // link se crea y el alumno paga, pero su aviso se rechaza por firma:
    // el peor desenlace posible es cobrar y no entregar.
    if (!identidad || (!secreta && !boldEnPruebas())) {
      throw new Error(
        "Bold sin configurar: faltan BOLD_LLAVE_IDENTIDAD o BOLD_LLAVE_SECRETA."
      );
    }

    const cuerpo: Record<string, unknown> = {
      amount_type: "CLOSE",
      amount: { currency: "COP", total_amount: montoCop, tip_amount: 0 },
      reference: referencia,
      description: `Allison · ${concepto}`.slice(0, 100),
      // En NANOSEGUNDOS: así lo dicen el texto y los tres ejemplos de
      // código de Bold (el JSON de muestra trae milisegundos, y es el
      // equivocado). Si algún día Bold esperara milisegundos, este valor
      // solo haría que el link no venza: la dirección segura del error.
      // Se redondea a segundos para que el número sea exacto en JSON.
      expiration_date: (Math.floor(Date.now() / 1000) + BOLD_MINUTOS_LINK * 60) * 1e9,
    };

    // Bold solo acepta direcciones https. En desarrollo sin túnel el
    // alumno vuelve a mano; en producción AUTH_URL siempre es https.
    if (origen.startsWith("https://")) {
      cuerpo.callback_url = `${origen}/pagar/${transaccionId}`;
      cuerpo.image_url = `${origen}/icono-512.png`;
    }

    const medios = boldMedios();
    if (medios.length > 0) cuerpo.payment_methods = medios;

    const respuesta = await fetch(`${BOLD_API}/online/link/v1`, {
      method: "POST",
      headers: {
        Authorization: `x-api-key ${identidad}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(10_000),
    });

    const datos = (await respuesta.json().catch(() => null)) as {
      payload?: { payment_link?: string; url?: string };
      errors?: unknown;
    } | null;

    const url = datos?.payload?.url;
    const link = datos?.payload?.payment_link;
    if (!respuesta.ok || !url?.startsWith("https://") || !link) {
      throw new Error(
        `Bold no creó el link de pago (HTTP ${respuesta.status}): ` +
          JSON.stringify(datos?.errors ?? datos).slice(0, 300)
      );
    }

    return { urlPago: url, idExterno: link };
  },

  /**
   * La firma de Bold: HMAC-SHA256, con la llave secreta, del cuerpo
   * CONVERTIDO A BASE64, en hexadecimal, contra la cabecera
   * x-bold-signature. El paso por base64 no es opcional: sin él, la
   * firma nunca coincide.
   */
  verificarFirma(cuerpoCrudo, cabeceras) {
    const llave = boldEnPruebas() ? "" : (process.env.BOLD_LLAVE_SECRETA ?? "");
    if (!llave && !boldEnPruebas()) return false;

    const recibida = (cabeceras.get("x-bold-signature") ?? "").trim().toLowerCase();
    if (!recibida) return false;

    const base64 = Buffer.from(cuerpoCrudo, "utf8").toString("base64");
    const esperada = createHmac("sha256", llave).update(base64).digest("hex");
    return igualSeguro(recibida, esperada);
  },

  /**
   * Solo ventas: SALE_APPROVED y SALE_REJECTED. Las anulaciones
   * (VOID_*) le devuelven el dinero al pagador y NO se revierten solas
   * aquí —el saldo pudo gastarse ya—; la ruta las deja en el log.
   *
   * Un aviso sin referencia tampoco se puede atar a una orden: en el
   * ejemplo oficial del QR presencial la referencia llega en null. Ese
   * caso lo rescata la consulta del estado del link.
   */
  interpretarEvento(cuerpo) {
    const e = cuerpo as {
      type?: string;
      data?: {
        metadata?: { reference?: string | null };
        amount?: { total?: unknown; currency?: unknown };
      };
    };
    if (e?.type !== "SALE_APPROVED" && e?.type !== "SALE_REJECTED") return null;

    const referencia = e.data?.metadata?.reference;
    if (!referencia) return null;

    return {
      referencia,
      aprobado: e.type === "SALE_APPROVED",
      montoCop: pesosDelAviso(e.data?.amount?.total, e.data?.amount?.currency),
    };
  },

  /**
   * El estado del link, preguntado directamente. Existe porque Bold
   * avisa los pagos de links con hasta 10 minutos de demora: sin esto,
   * el alumno vuelve de pagar y no ve su saldo.
   */
  async consultarEstado({ referencia, idExterno }) {
    const identidad = process.env.BOLD_LLAVE_IDENTIDAD;
    if (!identidad) throw new Error("Bold sin configurar: falta BOLD_LLAVE_IDENTIDAD.");

    const respuesta = await fetch(
      `${BOLD_API}/online/link/v1/${encodeURIComponent(idExterno)}`,
      {
        headers: { Authorization: `x-api-key ${identidad}` },
        signal: AbortSignal.timeout(8_000),
      }
    );
    if (!respuesta.ok) {
      throw new Error(`Bold no respondió el estado del link (HTTP ${respuesta.status}).`);
    }

    const datos = (await respuesta.json().catch(() => null)) as Record<string, unknown> | null;
    // La documentación muestra esta respuesta sin envoltura, y la de
    // crear la trae dentro de "payload". Se aceptan las dos formas.
    const link = ((datos?.payload as Record<string, unknown> | undefined) ?? datos ?? {}) as {
      status?: string;
      total?: unknown;
      reference?: string | null;
      is_sandbox?: boolean;
    };

    // Un link que no es de esta orden no puede acreditarla.
    if (link.reference !== referencia) {
      console.error(
        `Bold devolvió el link ${idExterno} con otra referencia (${link.reference}); se esperaba ${referencia}.`
      );
      return { estado: "pendiente", detalle: datos };
    }
    // Un pago de pruebas no vale plata.
    if (link.is_sandbox === true && !boldEnPruebas()) {
      console.error(`El link ${idExterno} es de pruebas y la app está cobrando de verdad.`);
      return { estado: "pendiente", detalle: datos };
    }

    switch (link.status) {
      case "PAID":
        // Pagado pero sin total legible: se trata como monto distinto
        // (NaN), nunca como "no hay monto que comparar".
        return {
          estado: "aprobado",
          montoCop: pesosDelAviso(link.total, undefined) ?? Number.NaN,
          detalle: datos,
        };
      case "REJECTED":
      case "CANCELLED":
      case "EXPIRED":
        return { estado: "rechazado", detalle: datos };
      default:
        // ACTIVE o PROCESSING: todavía puede pagarse.
        return { estado: "pendiente", detalle: datos };
    }
  },
};

// ---------------------------------------------------------------------
//  Wompi — checkout alojado. La alternativa a Bold, que solo desembolsa
//  a cuentas Bancolombia o Nequi.
//
//  Si se usa con la decisión de SOLO QR (1% contra 2,65% + $700), esa
//  restricción NO se puede imponer desde esta URL —el checkout alojado
//  no tiene parámetro de métodos— sino en el panel del comercio.
// ---------------------------------------------------------------------
const wompi: Pasarela = {
  nombre: "wompi",
  simulada: false,

  async crearPago({ transaccionId, referencia, montoCop, origen }) {
    const llavePublica = process.env.WOMPI_PUBLIC_KEY;
    const secretoIntegridad = process.env.WOMPI_INTEGRITY_SECRET;
    // El de eventos también se exige ANTES de cobrar: sin él, Wompi
    // cobra y la app rechaza su aviso, y el alumno paga sin recibir.
    if (!llavePublica || !secretoIntegridad || !process.env.WOMPI_EVENTS_SECRET) {
      throw new Error(
        "Wompi sin configurar: faltan WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET o WOMPI_EVENTS_SECRET."
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
      // A la página de la orden, que muestra el resultado en cuanto el
      // aviso lo acredita.
      "redirect-url": `${origen}/pagar/${transaccionId}`,
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
      data?: {
        transaction?: {
          reference?: string;
          status?: string;
          amount_in_cents?: unknown;
          currency?: unknown;
        };
      };
    };
    const t = e?.data?.transaction;
    if (!t?.reference) return null;

    const centavos = pesosDelAviso(t.amount_in_cents, t.currency);
    return {
      referencia: t.reference,
      aprobado: t.status === "APPROVED",
      montoCop: centavos === undefined ? undefined : centavos / 100,
    };
  },
};

const PASARELAS: Record<string, Pasarela> = { simulada, bold, wompi };

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
  if (enProduccion() && via.simulada) {
    throw new Error(
      "La pasarela simulada no puede correr en producción. " +
        "Define PASARELA=bold con sus llaves, o no cobres."
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
