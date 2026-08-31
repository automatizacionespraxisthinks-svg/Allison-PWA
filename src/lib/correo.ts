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

/**
 * Gmail por SMTP con contraseña de aplicación.
 *
 * Es el camino SIN dominio propio: como es Gmail enviando a través de
 * Gmail, SPF, DKIM y DMARC pasan solos — nada de suplantación, nada de
 * spam. El costo es el tope de ~500 correos al día de una cuenta
 * normal y un remitente @gmail.com menos comercial; cuando haya
 * dominio, se cambia CORREO=resend y este enviador queda de respaldo.
 *
 * La contraseña de aplicación NO es la clave de la cuenta: se genera
 * en Cuenta de Google → Seguridad → Verificación en dos pasos →
 * Contraseñas de aplicaciones, y solo sirve para esto.
 */
const gmail: Enviador = {
  nombre: "gmail",
  simulado: false,
  async enviar({ para, asunto, texto, html }) {
    const usuario = process.env.GMAIL_USUARIO;
    const clave = process.env.GMAIL_APP_PASSWORD;
    if (!usuario || !clave) {
      throw new Error("Faltan GMAIL_USUARIO o GMAIL_APP_PASSWORD");
    }

    // Importación diferida: nodemailer solo se carga si este enviador
    // se usa, y nunca termina en un bundle del navegador.
    const { default: nodemailer } = await import("nodemailer");
    const transporte = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: usuario, pass: clave },
    });

    // Gmail solo permite enviar COMO la cuenta autenticada; el nombre
    // visible sí es nuestro, y es lo que el alumno ve en la bandeja.
    await transporte.sendMail({
      from: `Allison <${usuario}>`,
      to: para,
      subject: asunto,
      text: texto,
      html,
    });
  },
};

const ENVIADORES: Record<string, Enviador> = { consola, resend, gmail };

export function correo(): Enviador {
  const enviador = ENVIADORES[process.env.CORREO ?? "consola"] ?? consola;

  /**
   * CANDADO DE PRODUCCIÓN. El enviador de consola imprime el correo en
   * el log y reporta éxito: en producción eso sería mentirle al alumno
   * — "te enviamos el enlace" — sin enviarle nada, y quedaría fuera de
   * su cuenta para siempre. Fallar con ruido es mejor que prometer en
   * silencio.
   */
  if (process.env.NODE_ENV === "production" && enviador.simulado) {
    throw new Error(
      "El correo de consola no puede correr en producción. " +
        "Define CORREO=resend con RESEND_API_KEY y CORREO_REMITENTE."
    );
  }

  return enviador;
}

/**
 * La plantilla HTML de la casa, compartida por todos los correos.
 *
 * Estilos EN LÍNEA porque los clientes de correo (Gmail, Outlook) no
 * cargan hojas de estilo: cualquier cosa fuera del atributo style se
 * pierde. La paleta es la misma azul de la app, y el enlace aparece
 * también en texto plano debajo del botón — hay clientes que bloquean
 * botones y gente que desconfía de ellos, y el correo tiene que servir
 * igual.
 */
function plantillaHtml(opciones: {
  titulo: string;
  parrafos: string[];
  boton: { texto: string; enlace: string };
  notaFinal: string;
}): string {
  const { titulo, parrafos, boton, notaFinal } = opciones;

  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background-color:#f6f8fc;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background-color:#ffffff;border-radius:16px;padding:32px 28px;border:1px solid #dbe3f0;">
      <p style="margin:0 0 4px;font-size:22px;font-weight:bold;color:#1d4ed8;">Allison</p>
      <p style="margin:0 0 20px;font-size:13px;color:#5a6b85;">Aprende ingl&eacute;s hablando</p>

      <h1 style="margin:0 0 16px;font-size:19px;color:#0e1a2f;">${titulo}</h1>

      ${parrafos
        .map(
          (p) =>
            `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#0e1a2f;">${p}</p>`
        )
        .join("\n      ")}

      <div style="margin:24px 0;">
        <a href="${boton.enlace}"
           style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:12px;">
          ${boton.texto}
        </a>
      </div>

      <p style="margin:0 0 6px;font-size:12px;color:#5a6b85;">
        Si el bot&oacute;n no funciona, copia este enlace en tu navegador:
      </p>
      <p style="margin:0 0 18px;font-size:12px;color:#1d4ed8;word-break:break-all;">${boton.enlace}</p>

      <p style="margin:0;font-size:12px;color:#5a6b85;line-height:1.5;">${notaFinal}</p>
    </div>

    <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#5a6b85;">
      PRAXIS - THINKS S.A.S. &middot; Duitama, Boyac&aacute;, Colombia
    </p>
  </div>
</body>
</html>`;
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
    html: plantillaHtml({
      titulo: `Hola ${nombre}, confirma tu correo`,
      parrafos: [
        `Confirma tu correo y te damos <strong>${mensajes} intervenciones más</strong> para hablar con Allison.`,
      ],
      boton: { texto: "Confirmar mi correo", enlace },
      notaFinal:
        "El enlace vence en 48 horas. Si no creaste esta cuenta, ignora este mensaje.",
    }),
  };
}

/** El correo de recuperación de contraseña, junto al de verificación. */
export function correoDeRecuperacion(nombre: string, enlace: string): Mensaje {
  const texto = `Hola ${nombre},

Alguien pidió recuperar la contraseña de tu cuenta. Si fuiste tú, entra aquí:

${enlace}

El enlace vence en una hora y solo sirve una vez.

Si no fuiste tú, ignora este mensaje: tu contraseña sigue igual.`;

  return {
    para: "",
    asunto: "Recupera tu contraseña de Allison",
    texto,
    html: plantillaHtml({
      titulo: `Hola ${nombre}, recupera tu contraseña`,
      parrafos: [
        "Alguien pidió recuperar la contraseña de tu cuenta. Si fuiste tú, crea una nueva con el botón.",
      ],
      boton: { texto: "Crear contraseña nueva", enlace },
      notaFinal:
        "El enlace vence en una hora y solo sirve una vez. Si no fuiste tú, ignora este mensaje: tu contraseña sigue igual.",
    }),
  };
}
