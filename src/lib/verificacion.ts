import { createHash, randomBytes } from "node:crypto";
import { correo, correoDeVerificacion } from "./correo";
import { sql } from "./db";

/**
 * Reparto de la prueba gratuita.
 *
 * Se entrega en dos partes a propósito: los primeros mensajes llegan de
 * una para que el alumno pruebe el producto sin fricción, y el resto
 * solo cuando confirma que el correo es suyo. Entregar los 20 de golpe
 * significa pagarle a Google 20 mensajes por cada correo inventado.
 */
export const PRUEBA_INICIAL = Number(process.env.MENSAJES_PRUEBA_INICIAL ?? 5);
export const PRUEBA_AL_VERIFICAR = Number(process.env.MENSAJES_PRUEBA_VERIFICAR ?? 15);
export const PRUEBA_TOTAL = PRUEBA_INICIAL + PRUEBA_AL_VERIFICAR;

/** Horas que dura el enlace antes de vencerse. */
const VIGENCIA_HORAS = 48;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Crea el token y manda el correo.
 *
 * Si el envío falla no se revienta el registro: la cuenta ya existe y
 * el alumno puede pedir el correo de nuevo. Perder la cuenta por un
 * problema del proveedor de correo sería mucho peor.
 */
export async function enviarVerificacion(opciones: {
  userId: string;
  nombre: string;
  email: string;
  origen: string;
}): Promise<{ enviado: boolean; enlace: string }> {
  const { userId, nombre, email, origen } = opciones;

  const token = randomBytes(32).toString("base64url");

  await sql`
    insert into verificaciones_correo (token_hash, user_id, correo, expira_en)
    values (${hash(token)}, ${userId}, ${email},
            now() + (${VIGENCIA_HORAS} || ' hours')::interval)
  `;

  const enlace = `${origen}/verificar/${token}`;
  const plantilla = correoDeVerificacion(nombre, enlace, PRUEBA_AL_VERIFICAR);

  try {
    await correo().enviar({ ...plantilla, para: email });
    return { enviado: true, enlace };
  } catch (e) {
    console.error("No se pudo enviar el correo de verificación:", e);
    return { enviado: false, enlace };
  }
}

/** Canjea el token. Devuelve el id del alumno, o null si no sirve. */
export async function canjearVerificacion(token: string): Promise<string | null> {
  const [fila] = await sql`
    select verificar_correo(${hash(token)}, ${PRUEBA_AL_VERIFICAR}) as user_id
  `;
  return fila?.user_id ?? null;
}

/** Invalida los enlaces anteriores antes de mandar uno nuevo. */
export async function anularPendientes(userId: string): Promise<void> {
  await sql`
    update verificaciones_correo set usado_en = now()
     where user_id = ${userId} and usado_en is null
  `;
}
