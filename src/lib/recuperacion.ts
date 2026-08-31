import { createHash, randomBytes } from "node:crypto";
import { correo, correoDeRecuperacion } from "./correo";
import { sql } from "./db";
import { interpretar } from "./identificador";

/**
 * Recuperación de contraseña.
 *
 * Vale una hora, no 48 como el enlace de verificación: este entrega el
 * control de la cuenta, y cuanto menos tiempo esté vivo, menos margen
 * hay si el correo queda abierto en un computador compartido.
 *
 * La plantilla del correo vive en correo.ts junto a la de
 * verificación: una sola cara para todos los correos de la casa.
 */
const VIGENCIA_MINUTOS = 60;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Manda el enlace a quien corresponda.
 *
 * SIEMPRE devuelve lo mismo, exista la cuenta o no. Si respondiera
 * "esa cuenta no existe", cualquiera podría averiguar qué correos están
 * registrados probándolos uno por uno.
 */
export async function pedirRecuperacion(
  identificador: string,
  origen: string
): Promise<void> {
  const id = interpretar(identificador);
  if (id.error || !id.valor) return;

  const columna =
    id.tipo === "email" ? "email" : id.tipo === "telefono" ? "telefono" : "username";

  const [u] = await sql`
    select id, nombre, email from users
     where ${sql(columna)} = ${id.valor}
       and tipo_acceso = 'email'
       and institucion_id is null
       and activo
     limit 1
  `;

  // Sin cuenta o sin correo no hay a dónde mandar nada, y aun así se
  // sale en silencio.
  if (!u?.email) return;

  // Un solo enlace válido a la vez
  await sql`
    update recuperaciones_clave set usado_en = now()
     where user_id = ${u.id} and usado_en is null
  `;

  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into recuperaciones_clave (token_hash, user_id, expira_en)
    values (${hash(token)}, ${u.id},
            now() + (${VIGENCIA_MINUTOS} || ' minutes')::interval)
  `;

  const plantilla = correoDeRecuperacion(u.nombre, `${origen}/recuperar/${token}`);
  try {
    await correo().enviar({ ...plantilla, para: u.email });
  } catch (e) {
    console.error("No se pudo enviar el correo de recuperación:", e);
  }
}

/** ¿El enlace sirve todavía? Se comprueba antes de mostrar el formulario. */
export async function tokenValido(token: string): Promise<boolean> {
  const [f] = await sql`
    select 1 from recuperaciones_clave
     where token_hash = ${hash(token)}
       and usado_en is null
       and expira_en > now()
     limit 1
  `;
  return Boolean(f);
}

/** Cambia la contraseña. Devuelve el id del usuario, o null si no sirve. */
export async function cambiarClave(
  token: string,
  passwordHash: string
): Promise<string | null> {
  const [f] = await sql`
    select cambiar_clave(${hash(token)}, ${passwordHash}) as user_id
  `;
  return f?.user_id ?? null;
}
