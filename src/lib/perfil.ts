import bcrypt from "bcryptjs";
import { sql } from "./db";
import type { DatosPerfil } from "./perfil-reglas";
import type { Nivel } from "./tipos";

export interface Perfil {
  nombre: string;
  nivel: Nivel;
  tipoAcceso: "email" | "institucional";
  email: string | null;
  telefono: string | null;
  username: string | null;
  colegio: string | null;
  /** Entra (también) con su cuenta de Google. */
  conGoogle: boolean;
  /** Tiene contraseña propia. Una cuenta creada con Google no, hasta que se la ponga. */
  conContrasena: boolean;
  creadoEn: string;
  aceptoTerminosEn: string | null;
  versionLegal: string | null;
}

/** Lo que el alumno ve de sí mismo en /perfil. */
export async function perfilDe(userId: string): Promise<Perfil | null> {
  const [u] = await sql`
    select u.nombre, u.nivel, u.tipo_acceso, u.email, u.telefono, u.username,
           u.creado_en, u.acepto_terminos_en, u.version_legal,
           (u.google_id is not null)     as con_google,
           (u.password_hash is not null) as con_contrasena,
           i.nombre as colegio
      from users u
      left join instituciones i on i.id = u.institucion_id
     where u.id = ${userId}
     limit 1
  `;
  if (!u) return null;
  return {
    nombre: u.nombre,
    nivel: u.nivel,
    tipoAcceso: u.tipo_acceso,
    email: u.email,
    telefono: u.telefono,
    username: u.username,
    colegio: u.colegio,
    conGoogle: u.con_google,
    conContrasena: u.con_contrasena,
    creadoEn: (u.creado_en as Date).toISOString(),
    aceptoTerminosEn: u.acepto_terminos_en ? (u.acepto_terminos_en as Date).toISOString() : null,
    versionLegal: u.version_legal,
  };
}

/**
 * Qué identificador chocó cuando la base rechaza el cambio: la
 * restricción única dice cuál. Es la misma traducción que hace el
 * registro, para no responder "error de servidor" a un correo repetido.
 */
function campoRepetido(e: unknown): string | null {
  const err = e as { code?: string; constraint_name?: string } | null;
  if (err?.code !== "23505") return null;
  const c = err.constraint_name ?? "";
  if (c.includes("email")) return "Ya hay otra cuenta con ese correo";
  if (c.includes("telefono")) return "Ya hay otra cuenta con ese celular";
  if (c.includes("username")) return "Ya hay otra cuenta con ese usuario";
  return "Ya hay otra cuenta con esos datos";
}

export type ResultadoPerfil =
  | { ok: true }
  | { ok: false; motivo: "actual_incorrecta" | "solo_google" | "repetido"; error: string };

/**
 * Guarda los cambios.
 *
 * Un alumno de colegio solo cambia su nombre; el resto de sus datos los
 * administra el colegio. El nivel no se cambia aquí: tiene su regla y su
 * ruta (/api/nivel, con el selector de Ajustes). Guardarlo desde aquí
 * podía pisar con un nivel viejo el que el alumno acababa de elegir.
 *
 * Cambiar el correo exige la contraseña actual, como cambiar la
 * contraseña: con solo la sesión abierta en un computador ajeno, alguien
 * ponía su correo, pedía "Olvidé mi contraseña" y se quedaba con la
 * cuenta. Una cuenta solo de Google (sin contraseña) no lo cambia aquí:
 * no hay con qué comprobar que es el dueño. Con el correo cambian
 * también: deja de contar como verificado y se suelta la cuenta de
 * Google, para que no quede unida al Google del correo anterior
 * (auditoría, 30 de octubre de 2026).
 */
export async function actualizarPerfil(
  userId: string,
  tipoAcceso: "email" | "institucional",
  datos: DatosPerfil,
  contrasenaActual?: string
): Promise<ResultadoPerfil> {
  try {
    if (tipoAcceso === "institucional") {
      await sql`
        update users
           set nombre = ${datos.nombre}, actualizado_en = now()
         where id = ${userId}
      `;
      return { ok: true };
    }

    const [u] = await sql`
      select email, password_hash from users
       where id = ${userId} and tipo_acceso = 'email'
       limit 1
    `;
    if (u && u.email !== datos.email) {
      if (!u.password_hash) {
        return {
          ok: false,
          motivo: "solo_google",
          error: "Entras con Google, así que tu correo es el de esa cuenta y no se cambia aquí.",
        };
      }
      if (!contrasenaActual || !(await bcrypt.compare(contrasenaActual, u.password_hash))) {
        return { ok: false, motivo: "actual_incorrecta", error: "La contraseña actual no es correcta." };
      }
    }

    await sql`
      update users
         set nombre   = ${datos.nombre},
             email_verificado_en = case
               when email is distinct from ${datos.email} then null
               else email_verificado_en
             end,
             google_id = case
               when email is distinct from ${datos.email} then null
               else google_id
             end,
             email    = ${datos.email},
             telefono = ${datos.telefono},
             username = ${datos.username},
             actualizado_en = now()
       where id = ${userId} and tipo_acceso = 'email'
    `;
    return { ok: true };
  } catch (e) {
    const repetido = campoRepetido(e);
    if (repetido) return { ok: false, motivo: "repetido", error: repetido };
    throw e;
  }
}

export type ResultadoContrasena = "ok" | "actual_incorrecta" | "no_aplica";

/**
 * Cambia (o crea) la contraseña.
 *
 * Si la cuenta ya tenía una, se exige la actual: quien encontró una
 * sesión abierta no puede adueñarse de la cuenta cambiándola. Una cuenta
 * creada con Google no tiene contraseña todavía, y ponérsela no exige
 * nada más que la sesión — es lo que le permite entrar también sin
 * Google.
 *
 * Cambiarla cierra las demás sesiones (sesiones_validas_desde): la
 * pantalla vuelve a entrar con la nueva de inmediato, y cualquier otra
 * queda fuera.
 */
export async function cambiarContrasena(
  userId: string,
  actual: string | undefined,
  nueva: string
): Promise<ResultadoContrasena> {
  const [u] = await sql`
    select password_hash, tipo_acceso from users where id = ${userId} limit 1
  `;
  if (!u || u.tipo_acceso !== "email") return "no_aplica";

  if (u.password_hash) {
    if (!actual || !(await bcrypt.compare(actual, u.password_hash))) {
      return "actual_incorrecta";
    }
  }

  const hash = await bcrypt.hash(nueva, 12);
  // La marca sale del reloj de la APP, no del de la base: la sesión
  // nueva se emite un instante después con el reloj de la app, y la
  // comparación entre las dos (src/lib/sesion.ts) tiene que ser entre
  // el mismo reloj. Con now() de la base, un Postgres medio segundo
  // adelantado —pasa con Docker Desktop— cerraba la sesión recién
  // abierta y sacaba al alumno justo después de cambiar la clave.
  const desde = new Date();
  await sql`
    update users
       set password_hash = ${hash},
           sesiones_validas_desde = ${desde},
           actualizado_en = now()
     where id = ${userId}
  `;
  return "ok";
}
