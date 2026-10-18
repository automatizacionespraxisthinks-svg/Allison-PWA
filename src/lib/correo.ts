/**
 * Envío de correo, detrás de una interfaz.
 *
 * Igual que la pasarela: el enviador se elige con CORREO en el entorno
 * (consola para desarrollo, gmail o resend para enviar de verdad), y
 * todo lo demás —plantillas, enlaces, quién recibe qué— es el mismo.
 *
 * Hoy el único correo que sale es el de recuperar la contraseña. La
 * verificación del correo se quitó (sep-2026): la prueba se entrega
 * completa al crear la cuenta.
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
  /**
   * Comprueba que el servidor puede hablar con el proveedor y que las
   * credenciales sirven, SIN enviar nada. Lanza si algo falla. Es lo
   * que consulta /api/salud?correo=1 desde producción.
   */
  verificar?(): Promise<void>;
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
      signal: AbortSignal.timeout(15_000),
    });

    if (!r.ok) {
      throw new Error(`Resend respondió ${r.status}: ${await r.text()}`);
    }
  },
  async verificar() {
    const clave = process.env.RESEND_API_KEY;
    if (!clave || !process.env.CORREO_REMITENTE) {
      throw new Error("Faltan RESEND_API_KEY o CORREO_REMITENTE");
    }
    const r = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${clave}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`Resend rechazó la llave (HTTP ${r.status})`);
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
 * Contraseñas de aplicaciones, y solo sirve para esto. Google la
 * muestra en cuatro bloques con espacios; se aceptan con o sin ellos.
 *
 * EL PUERTO IMPORTA. Hetzner bloquea la salida por los puertos 25 y 465
 * en las cuentas nuevas (hasta pedir el desbloqueo con la primera
 * factura pagada), y por eso el 465 "se quedaba pensando" y nunca
 * enviaba. El 587 con STARTTLS está abierto y es igual de cifrado: es
 * el que va por defecto. GMAIL_PUERTO=465 sigue valiendo si algún día
 * se desbloquea.
 *
 * Los tiempos de espera son cortos a propósito: un puerto bloqueado no
 * responde nada, y sin ellos la petición del alumno se quedaba colgada
 * los dos minutos que nodemailer espera por defecto.
 */
const gmail: Enviador = {
  nombre: "gmail",
  simulado: false,
  async enviar(mensaje) {
    const transporte = await transporteGmail();
    const { para, asunto, texto, html } = mensaje;
    // Gmail solo permite enviar COMO la cuenta autenticada; el nombre
    // visible sí es nuestro, y es lo que el alumno ve en la bandeja.
    await transporte.sendMail({
      from: `Allison <${process.env.GMAIL_USUARIO}>`,
      to: para,
      subject: asunto,
      text: texto,
      html,
    });
  },
  async verificar() {
    const transporte = await transporteGmail();
    await transporte.verify();
  },
};

/** El puerto de salida hacia smtp.gmail.com (ver el comentario de arriba). */
export function puertoGmail(): number {
  const puerto = Number(process.env.GMAIL_PUERTO ?? 587);
  return Number.isInteger(puerto) && puerto > 0 ? puerto : 587;
}

async function transporteGmail() {
  const usuario = process.env.GMAIL_USUARIO?.trim();
  const clave = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!usuario || !clave) {
    throw new Error("Faltan GMAIL_USUARIO o GMAIL_APP_PASSWORD");
  }

  const puerto = puertoGmail();

  // Importación diferida: nodemailer solo se carga si este enviador
  // se usa, y nunca termina en un bundle del navegador.
  const { default: nodemailer } = await import("nodemailer");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: puerto,
    // 465 = TLS desde el primer byte; cualquier otro = STARTTLS.
    secure: puerto === 465,
    // Nunca en claro: si el servidor no ofreciera cifrado, se aborta.
    requireTLS: true,
    auth: { user: usuario, pass: clave },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

/**
 * Qué significa un fallo del correo, en palabras. Sale en el
 * diagnóstico de /api/salud?correo=1 y en npm run probar:correo, para
 * no tener que descifrar un ETIMEDOUT a las once de la noche.
 */
export function pistaDeCorreo(error: unknown): string {
  const e = error as { code?: string; responseCode?: number; message?: string } | null;
  const codigo = String(e?.code ?? "");
  const mensaje = String(e?.message ?? "");

  if (/ETIMEDOUT|ECONNECTION|ESOCKET|ECONNREFUSED|EHOSTUNREACH|ENETUNREACH/.test(codigo + mensaje)) {
    return (
      `El servidor no alcanza smtp.gmail.com por el puerto ${puertoGmail()}. ` +
      "Hetzner bloquea la salida por los puertos 25 y 465 en las cuentas nuevas: " +
      "usa GMAIL_PUERTO=587 (STARTTLS), o pide el desbloqueo en el panel de Hetzner " +
      "(Limits) después de pagar la primera factura."
    );
  }
  if (codigo === "EAUTH" || e?.responseCode === 535 || /Invalid login|BadCredentials/i.test(mensaje)) {
    return (
      "Gmail rechazó el usuario o la contraseña. GMAIL_USUARIO es la dirección completa " +
      "y GMAIL_APP_PASSWORD es la contraseña de APLICACIÓN de 16 letras (no la de la " +
      "cuenta), que solo existe con la verificación en dos pasos activa."
    );
  }
  if (/Faltan /.test(mensaje)) {
    return "Faltan variables de entorno del correo. Revisa CORREO, GMAIL_USUARIO y GMAIL_APP_PASSWORD.";
  }
  return "Revisa el log del servidor: el error completo está ahí.";
}

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
        "Define CORREO=gmail (GMAIL_USUARIO y GMAIL_APP_PASSWORD) o CORREO=resend."
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
/** Lo que viene de afuera (el nombre que escribió la persona) va como texto, nunca como HTML. */
function escaparHtml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * El título, el botón, el enlace y la nota se escapan aquí; los párrafos
 * son texto fijo del código y pueden traer <b>.
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

      <h1 style="margin:0 0 16px;font-size:19px;color:#0e1a2f;">${escaparHtml(titulo)}</h1>

      ${parrafos
        .map(
          (p) =>
            `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#0e1a2f;">${p}</p>`
        )
        .join("\n      ")}

      <div style="margin:24px 0;">
        <a href="${escaparHtml(boton.enlace)}"
           style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 28px;border-radius:12px;">
          ${escaparHtml(boton.texto)}
        </a>
      </div>

      <p style="margin:0 0 6px;font-size:12px;color:#5a6b85;">
        Si el bot&oacute;n no funciona, copia este enlace en tu navegador:
      </p>
      <p style="margin:0 0 18px;font-size:12px;color:#1d4ed8;word-break:break-all;">${escaparHtml(boton.enlace)}</p>

      <p style="margin:0;font-size:12px;color:#5a6b85;line-height:1.5;">${escaparHtml(notaFinal)}</p>
    </div>

    <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#5a6b85;">
      PRAXIS - THINKS S.A.S. &middot; Duitama, Boyac&aacute;, Colombia
    </p>
  </div>
</body>
</html>`;
}

/** El correo de recuperación de contraseña. */
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

/**
 * El recordatorio de la racha (plan, sección 10): sale a la hora que
 * eligió el alumno, el último día antes de perderla. Se apaga en
 * Perfil · Ajustes.
 */
export function correoDeRacha(nombre: string, racha: number, enlace: string): Mensaje {
  const dias = racha === 1 ? "1 día" : `${racha} días`;
  const texto = `Hola ${nombre},

Llevas ${dias} de racha y hoy es el último día para no perderla. Con unos minutos en tu ruta basta: una actividad gratis cuenta.

${enlace}

Si no quieres estos correos, apágalos en tu perfil, en Ajustes.`;

  return {
    para: "",
    asunto: `Tu racha de ${dias} te espera`,
    texto,
    html: plantillaHtml({
      titulo: `Hola ${nombre}, ¡no pierdas tu racha!`,
      parrafos: [
        `Llevas <b>${dias}</b> de racha y hoy es el último día para no perderla.`,
        "Con unos minutos en tu ruta basta: una actividad gratis también cuenta.",
      ],
      boton: { texto: "Seguir mi ruta", enlace },
      notaFinal: "Si no quieres estos correos, apágalos en tu perfil, en Ajustes.",
    }),
  };
}
