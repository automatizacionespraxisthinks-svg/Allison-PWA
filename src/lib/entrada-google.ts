import { cookies } from "next/headers";
import type { Profile } from "next-auth";
import { sql } from "./db";
import {
  COOKIE_CONSENTIMIENTO,
  leerConsentimiento,
  secretoDeFirma,
  type Consentimiento,
} from "./google";
import { VERSION_LEGAL } from "./legal";
import { limitar, REGISTROS_GLOBALES_POR_HORA } from "./limite";
import { PRUEBA_AL_VERIFICAR, PRUEBA_TOTAL } from "./verificacion";

/**
 * Lo que pasa cuando Google devuelve a alguien a la aplicación.
 *
 * Corre dentro del callback signIn de Auth.js, antes de que exista la
 * sesión. Devuelve true si la persona puede entrar, o la ruta a la que
 * hay que mandarla si no: Auth.js la redirige ahí en vez de abrirle
 * sesión. Tres casos:
 *
 *   1. El correo ya tiene cuenta: entra. Se le anota el id de Google
 *      para reconocerla aunque un día cambie de correo, y si nunca había
 *      confirmado el correo, Google acaba de confirmarlo por ella: se
 *      le entregan los mensajes que faltaban de la prueba.
 *   2. No hay cuenta y viene de /registro con las casillas marcadas
 *      (la cookie firmada de src/lib/google.ts): se crea la cuenta con
 *      ese consentimiento y la prueba completa.
 *   3. No hay cuenta y no hay consentimiento (tocó "Entrar con Google"
 *      en /entrar sin tener cuenta, o la cookie venció): a /registro,
 *      con el aviso de marcar las casillas. Sin autorización expresa
 *      no se crea nada, ni siquiera el nombre y el correo.
 */
export async function entrarConGoogle(
  sub: string,
  perfil: Profile | undefined
): Promise<true | string> {
  const email = perfil?.email?.trim().toLowerCase();

  // Solo un correo que GOOGLE afirma haber verificado puede abrir la
  // cuenta que alguien creó con ese correo y una contraseña. Es la única
  // garantía de que quien llega es su dueño; sin ella, cualquiera con
  // una cuenta de Google que dijera tener ese correo entraría.
  if (!email || perfil?.email_verified !== true) {
    return "/entrar?error=google-sin-verificar";
  }

  const [existente] = await sql`
    select id, activo, tipo_acceso, email_verificado_en
      from users
     where google_id = ${sub} or email = ${email}
     order by (google_id is not distinct from ${sub}) desc
     limit 1
  `;

  if (existente) {
    if (!existente.activo) return "/entrar?error=cuenta-inactiva";
    await vincular(
      existente.id,
      sub,
      existente.tipo_acceso === "email" && !existente.email_verificado_en
    );
    return true;
  }

  const consentimiento = await consentimientoDeLaCookie();
  if (!consentimiento) return "/registro?google=consentimiento";

  // El mismo freno global que /api/registro: el que impide que un
  // script se lleve mil pruebas gratis en una noche. Comparten la
  // clave, así que las cuentas por Google cuentan en el mismo tope.
  if (!limitar("registro:global", REGISTROS_GLOBALES_POR_HORA, 3600).permitido) {
    return "/registro?google=limite";
  }

  try {
    await crearCuenta({ email, sub, nombre: nombreDe(perfil), consentimiento });
  } catch (e) {
    // Dos regresos de Google al mismo tiempo (un doble clic): el
    // segundo se encuentra con la cuenta que acaba de crear el primero,
    // y la persona entra igual.
    if ((e as { code?: string }).code !== "23505") throw e;
  }

  await borrarCookieDeConsentimiento();
  return true;
}

/** El nombre que Google trae, limpio y acotado como el del formulario. */
function nombreDe(perfil: Profile | undefined): string {
  const crudo = [perfil?.name, perfil?.given_name].find(
    (v): v is string => typeof v === "string" && v.trim() !== ""
  );
  return (crudo ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || "Estudiante";
}

async function consentimientoDeLaCookie(): Promise<Consentimiento | null> {
  try {
    const valor = (await cookies()).get(COOKIE_CONSENTIMIENTO)?.value;
    return leerConsentimiento(valor, secretoDeFirma());
  } catch (e) {
    console.error(
      "No se pudo leer la cookie de consentimiento:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}

/**
 * Ya sirvió: se borra para que no le cree la cuenta a la siguiente
 * persona que use el mismo navegador. Si no se pudiera borrar, vence
 * sola en minutos; no es motivo para negarle la entrada a nadie.
 */
async function borrarCookieDeConsentimiento(): Promise<void> {
  try {
    (await cookies()).delete(COOKIE_CONSENTIMIENTO);
  } catch (e) {
    console.warn(
      "No se pudo borrar la cookie de consentimiento:",
      e instanceof Error ? e.message : e
    );
  }
}

/**
 * Una cuenta que ya existía entra con Google.
 *
 * Si nunca confirmó el correo, se hace ahora lo mismo que hace el enlace
 * del correo (db/009): marcarlo verificado y entregar los mensajes que
 * faltaban. Los enlaces pendientes se anulan PRIMERO, y a propósito:
 * el canje del enlace bloquea su fila antes de entregar los mensajes,
 * así que quien de los dos llegue primero a esa fila gana, y el otro
 * no encuentra nada que entregar. Sin ese orden, hacer clic en el
 * correo y entrar con Google en el mismo segundo regalaría 30.
 */
async function vincular(userId: string, sub: string, verificarAhora: boolean): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`
      update users set google_id = ${sub}, actualizado_en = now()
       where id = ${userId} and google_id is null
    `;
    if (!verificarAhora) return;

    await tx`
      update verificaciones_correo set usado_en = now()
       where user_id = ${userId} and usado_en is null
    `;
    const [marcado] = await tx`
      update users set email_verificado_en = now(), actualizado_en = now()
       where id = ${userId} and email_verificado_en is null
       returning id
    `;
    if (!marcado) return;

    await tx`insert into saldos (user_id) values (${userId}) on conflict (user_id) do nothing`;
    const [s] = await tx`
      select mensajes_plan, mensajes_recarga from saldos
       where user_id = ${userId} for update
    `;
    const recarga = s.mensajes_recarga + PRUEBA_AL_VERIFICAR;
    await tx`
      update saldos set mensajes_recarga = ${recarga}, actualizado_en = now()
       where user_id = ${userId}
    `;
    await tx`
      insert into movimientos_credito
        (user_id, tipo, bolsa, cantidad, saldo_plan_despues, saldo_recarga_despues, nota)
      values
        (${userId}, 'bono', 'recarga', ${PRUEBA_AL_VERIFICAR}, ${s.mensajes_plan}, ${recarga},
         'Mensajes por confirmar el correo (lo confirmó Google)')
    `;
  });
}

/**
 * La cuenta nueva, con todo lo que el formulario de registro también
 * deja: saldo, movimiento en el libro y constancia del consentimiento.
 * La fecha de aceptación es la de las casillas, no la de ahora: es
 * cuando la persona dijo que sí. Google ya verificó el correo, así que
 * la prueba se entrega completa de una vez, sin enlace que confirmar.
 */
async function crearCuenta(datos: {
  email: string;
  sub: string;
  nombre: string;
  consentimiento: Consentimiento;
}): Promise<void> {
  const { email, sub, nombre, consentimiento } = datos;
  await sql.begin(async (tx) => {
    const [nuevo] = await tx`
      insert into users
        (tipo_acceso, email, google_id, nombre, nivel, email_verificado_en,
         acepto_terminos_en, version_legal, autoriza_transferencia,
         autoriza_voz, declara_edad_o_acudiente)
      values
        ('email', ${email}, ${sub}, ${nombre}, ${consentimiento.nivel}, now(),
         ${consentimiento.en}, ${VERSION_LEGAL}, true, true, true)
      returning id
    `;
    await tx`
      insert into saldos (user_id, mensajes_plan, mensajes_recarga)
      values (${nuevo.id}, 0, ${PRUEBA_TOTAL})
    `;
    await tx`
      insert into movimientos_credito
        (user_id, tipo, bolsa, cantidad, saldo_plan_despues, saldo_recarga_despues, nota)
      values
        (${nuevo.id}, 'bono', 'recarga', ${PRUEBA_TOTAL}, 0, ${PRUEBA_TOTAL},
         'Prueba completa: Google ya verificó el correo')
    `;
  });
}
