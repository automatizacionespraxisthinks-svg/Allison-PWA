/**
 * Envío de correo, detrás de una interfaz.
 *
 * Igual que la pasarela: hoy corre la implementación de CONSOLA porque
 * no hay servicio de correo contratado. Todo lo demás —tokens,
 * caducidad, canje, entrega de mensajes— es el definitivo. Cuando haya
 * un proveedor se cambia CORREO en el .env.
 */

export interface Mensaje {
  para: string;
  asunto: string;
  texto: string;
  html?: string;
}

export interface Enviador {
  nombre: string;
  /** true si en realidad no sale ningún correo. */
  simulado: boolean;
  enviar(mensaje: Mensaje): Promise<void>;
}

const consola: Enviador = {
  nombre: "consola",
  simulado: true,
  async enviar({ para, asunto, texto }) {
    console.log(
      `\n--- CORREO (no se envió de verdad) ---\n` +
        `Para:    ${para}\n` +
        `Asunto:  ${asunto}\n\n${texto}\n` +
        `--------------------------------------\n`
    );
  },
};

const resend: Enviador = {
  nombre: "resend",
  simulado: false,
  async enviar({ para, asunto, texto, html }) {
    const clave = process.env.RESEND_API_KEY;
    const remitente = process.env.CORREO_REMITENTE;
    if (!clave || !remitente) {
      throw new Error("Faltan RESEND_API_KEY o CORREO_REMITENTE");
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: remitente, to: para, subject: asunto, text: texto, html }),
    });

    if (!r.ok) {
      throw new Error(`Resend respondió ${r.status}: ${await r.text()}`);
    }
  },
};

const ENVIADORES: Record<string, Enviador> = { consola, resend };

export function correo(): Enviador {
  return ENVIADORES[process.env.CORREO ?? "consola"] ?? consola;
}

/** El correo de confirmación, en un solo sitio. */
export function correoDeVerificacion(nombre: string, enlace: string, mensajes: number): Mensaje {
  const texto = `Hola ${nombre},

Confirma tu correo y te damos ${mensajes} intervenciones más para hablar con Allison:

${enlace}

El enlace vence en 48 horas. Si no creaste esta cuenta, ignora este mensaje.`;

  return {
    para: "",
    asunto: `Confirma tu correo y recibe ${mensajes} intervenciones más`,
    texto,
  };
}
