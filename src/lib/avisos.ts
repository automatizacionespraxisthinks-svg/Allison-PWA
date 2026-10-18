import webpush from "web-push";
import { sql } from "./db";
import { EMPRESA } from "./legal";

/**
 * Los avisos en el celular (documento "Competencia por salón y
 * recordatorios en el celular", aprobado el 17 de octubre de 2026): las
 * notificaciones de la app instalada desde el navegador (Web Push). No
 * hace falta publicar la app en una tienda ni pagar un servicio: el
 * navegador del alumno entrega el aviso.
 *
 * Necesita dos llaves que se generan una sola vez (docs/DESPLIEGUE.md):
 * VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY. Sin ellas los avisos quedan
 * apagados y el recordatorio sigue por correo.
 */

/** La llave pública que el navegador necesita para aceptar avisos, o null si no está configurado. */
export function llavePublicaAvisos(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

let listo = false;
function configurar(): boolean {
  const publica = llavePublicaAvisos();
  const privada = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publica || !privada) return false;
  if (!listo) {
    // Los servicios de avisos piden un contacto por si hay un problema con los envíos.
    webpush.setVapidDetails(`mailto:${EMPRESA.correo}`, publica, privada);
    listo = true;
  }
  return true;
}

/**
 * Los servicios de avisos de los navegadores: Chrome, Edge, Opera y los
 * Android (Google), Firefox (Mozilla), Safari y los iPhone (Apple) y el
 * Edge viejo (Windows). El servidor solo le manda avisos a estos: una
 * dirección cualquiera haría que el servidor le pegara a donde dijera el
 * navegador, incluso a la red interna.
 */
const SERVICIOS_DE_AVISOS = [
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/,
  /^[a-z0-9-]+\.notify\.windows\.com$/,
];

export function esServicioDeAvisos(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && !u.port && SERVICIOS_DE_AVISOS.some((p) => p.test(u.hostname));
  } catch {
    return false;
  }
}

export interface Suscripcion {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Guarda el aparato que aceptó los avisos. Si el aparato era de otra cuenta, pasa a esta. */
export async function guardarSuscripcion(userId: string, s: Suscripcion): Promise<void> {
  await sql`
    insert into suscripciones_push (user_id, endpoint, p256dh, auth)
    values (${userId}, ${s.endpoint}, ${s.keys.p256dh}, ${s.keys.auth})
    on conflict (endpoint) do update
       set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, creado_en = now()
  `;
}

export async function quitarSuscripcion(userId: string, endpoint: string): Promise<void> {
  await sql`delete from suscripciones_push where user_id = ${userId} and endpoint = ${endpoint}`;
}

/** ¿Tiene este aparato los avisos activados para esta cuenta? */
export async function tieneSuscripcion(userId: string, endpoint: string): Promise<boolean> {
  const [f] = await sql`select 1 from suscripciones_push where user_id = ${userId} and endpoint = ${endpoint}`;
  return !!f;
}

export interface Aviso {
  titulo: string;
  texto: string;
  /** Lo que abre al tocarlo. */
  url: string;
  /** Avisos con la misma etiqueta se reemplazan en el celular en vez de amontonarse. */
  etiqueta?: string;
}

/**
 * Manda el aviso a todos los aparatos del alumno. Devuelve a cuántos
 * llegó (lo aceptó el servicio de avisos). Un aparato que ya no existe
 * (404 o 410) se borra; un error de otro tipo no tumba a los demás.
 */
export async function avisar(userId: string, aviso: Aviso): Promise<number> {
  if (!configurar()) return 0;
  const aparatos = await sql`select id, endpoint, p256dh, auth from suscripciones_push where user_id = ${userId}`;
  let entregados = 0;
  for (const a of aparatos) {
    if (!esServicioDeAvisos(a.endpoint)) continue;
    try {
      await webpush.sendNotification(
        { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
        JSON.stringify(aviso),
        // Si el celular está apagado, el aviso espera hasta 12 horas: después ya no sirve.
        { TTL: 12 * 3600, urgency: "normal", topic: aviso.etiqueta }
      );
      entregados++;
      await sql`update suscripciones_push set usado_en = now() where id = ${a.id}`;
    } catch (e) {
      const estado = (e as { statusCode?: number }).statusCode;
      if (estado === 404 || estado === 410) await sql`delete from suscripciones_push where id = ${a.id}`;
      else console.error(`No se pudo enviar el aviso a ${userId}:`, e instanceof Error ? e.message : e);
    }
  }
  return entregados;
}

/** El aviso de la racha: "Diego, tu racha de 5 días se pierde mañana. Practica 3 minutos hoy." */
export function avisoDeRacha(nombre: string, racha: number): Aviso {
  const dias = racha === 1 ? "1 día" : `${racha} días`;
  return {
    titulo: "Allison",
    texto: `${nombre}, tu racha de ${dias} se pierde mañana. Practica 3 minutos hoy.`,
    url: "/ruta",
    etiqueta: "racha",
  };
}
