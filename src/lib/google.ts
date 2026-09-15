import { createHmac, timingSafeEqual } from "node:crypto";
import { VERSION_LEGAL } from "./legal.ts";
import { NIVELES, type Nivel } from "./tipos.ts";

/**
 * Entrar con Google: la parte que no necesita base de datos ni Next.
 *
 * Vive aparte de la entrada de verdad (entrada-google.ts) para que
 * scripts/probar-google.mjs la ejecute con Node a secas, igual que se
 * prueban la firma de Bold o los candados de intentos.
 */

/**
 * ¿Hay llaves de Google? Sin ellas el botón no existe en ninguna
 * pantalla, y el proveedor no se registra: un botón sin llaves sería
 * una puerta pintada en la pared. Las dos, no una: con el ID solo,
 * Google recibe al alumno y el regreso falla.
 */
export function googleConfigurado(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * El consentimiento viaja en una cookie FIRMADA desde /registro hasta
 * el regreso de Google.
 *
 * La Ley 1581 exige que la autorización sea previa, expresa y que se
 * pueda probar. Con Google no hay formulario entre "tocar el botón" y
 * "la cuenta existe": el alumno marca las casillas en /registro, la app
 * lo anota en una cookie que solo ella puede firmar, y cuando Google lo
 * devuelve, la cuenta se crea con ese consentimiento — o no se crea.
 * Sin cookie válida no hay cuenta, venga de donde venga el botón.
 *
 * Por qué no se crea la cuenta "pendiente de aceptar": guardar el
 * nombre y el correo antes de la autorización ya es un tratamiento sin
 * autorización. Aquí no se guarda nada hasta tenerla.
 *
 * Vive diez minutos: lo que toma ir a Google y volver. Una cookie más
 * larga, en un computador compartido, podría crearle la cuenta a la
 * siguiente persona con un consentimiento que no dio. Y sameSite "lax",
 * no "strict": la vuelta desde accounts.google.com es una navegación
 * desde otro sitio, y con "strict" el navegador no mandaría la cookie.
 */
export const COOKIE_CONSENTIMIENTO = "allison.consentimiento";
export const VIGENCIA_CONSENTIMIENTO_SEG = 10 * 60;

/** Margen hacia el futuro, por relojes que no van exactamente iguales. */
const ADELANTO_MAXIMO_SEG = 60;

export interface Consentimiento {
  nivel: Nivel;
  /** Cuándo marcó las casillas: es la fecha que se guarda como aceptación. */
  en: Date;
  version: string;
}

/** El mismo secreto de las sesiones: si no está, nada de esto funciona. */
export function secretoDeFirma(): string {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) {
    throw new Error("Falta AUTH_SECRET: sin él no se puede firmar el consentimiento.");
  }
  return secreto;
}

const firmaDe = (carga: string, secreto: string) =>
  createHmac("sha256", secreto).update(carga).digest("base64url");

/** El valor de la cookie: la carga en base64url, un punto, y su firma. */
export function firmarConsentimiento(
  datos: { nivel: Nivel; en?: Date },
  secreto: string
): string {
  const carga = Buffer.from(
    JSON.stringify({
      v: VERSION_LEGAL,
      n: datos.nivel,
      e: Math.floor((datos.en ?? new Date()).getTime() / 1000),
    })
  ).toString("base64url");
  return `${carga}.${firmaDe(carga, secreto)}`;
}

/**
 * Lee la cookie. null si no hay, si la firma no cuadra, si venció, si
 * es de otra versión de los documentos, o si trae un nivel inventado.
 * Todo lo que no sea un consentimiento perfecto vale lo mismo: nada.
 */
export function leerConsentimiento(
  valor: string | undefined | null,
  secreto: string,
  ahora: Date = new Date()
): Consentimiento | null {
  if (typeof valor !== "string") return null;

  const partes = valor.split(".");
  if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
  const [carga, firma] = partes;

  // Comparación de tiempo constante: el tiempo que tarda no puede decir
  // cuántos caracteres de la firma acertó alguien.
  const esperada = Buffer.from(firmaDe(carga, secreto));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return null;
  }

  let datos: { v?: unknown; n?: unknown; e?: unknown };
  try {
    datos = JSON.parse(Buffer.from(carga, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  // Aceptó OTROS documentos: no vale para estos.
  if (datos?.v !== VERSION_LEGAL) return null;

  const nivel = NIVELES.find((n) => n.nivel === datos.n)?.nivel;
  if (!nivel) return null;

  if (typeof datos.e !== "number" || !Number.isInteger(datos.e)) return null;
  const edadSeg = Math.floor(ahora.getTime() / 1000) - datos.e;
  if (edadSeg > VIGENCIA_CONSENTIMIENTO_SEG || edadSeg < -ADELANTO_MAXIMO_SEG) return null;

  return { nivel, en: new Date(datos.e * 1000), version: datos.v };
}

/**
 * Cómo se guarda la cookie. httpOnly: el navegador no puede leerla ni
 * fabricarla desde un script. secure siempre que la app viva en https
 * (en producción, siempre); en http://localhost no puede serlo o el
 * navegador la descarta.
 */
export function opcionesCookieConsentimiento() {
  const url = (process.env.AUTH_URL ?? "").trim();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: url.startsWith("https://") || process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VIGENCIA_CONSENTIMIENTO_SEG,
  };
}
