import { interpretar } from "./identificador.ts";
import { NIVELES, type Nivel } from "./tipos.ts";

/**
 * Las reglas de lo que un alumno puede cambiar de su perfil. Sin base
 * ni Next, para que scripts/probar-perfil.mjs las pruebe con Node.
 *
 * Son las mismas reglas del registro: el correo es obligatorio para el
 * público general (es el único canal para recuperar la cuenta), el
 * celular y el usuario son opcionales y se normalizan igual que al
 * entrar, y el nivel se cambia cuando el alumno quiera.
 *
 * Un alumno de colegio solo cambia nombre y nivel: su usuario lo asigna
 * el colegio y no tiene correo.
 */
export interface DatosPerfil {
  nombre: string;
  nivel: Nivel;
  email: string | null;
  telefono: string | null;
  username: string | null;
}

export type ValidacionPerfil =
  | { ok: true; datos: DatosPerfil }
  | { ok: false; error: string };

const texto = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

export function validarPerfil(cuerpo: unknown, tipoAcceso: "email" | "institucional"): ValidacionPerfil {
  const c = (cuerpo ?? {}) as Record<string, unknown>;

  const nombre = texto(c.nombre);
  if (nombre.length < 2) return { ok: false, error: "Escribe tu nombre" };
  if (nombre.length > 80) return { ok: false, error: "El nombre es demasiado largo" };

  const nivel = NIVELES.find((n) => n.nivel === c.nivel)?.nivel;
  if (!nivel) return { ok: false, error: "Nivel inválido" };

  if (tipoAcceso === "institucional") {
    return { ok: true, datos: { nombre, nivel, email: null, telefono: null, username: null } };
  }

  const correo = interpretar(texto(c.email));
  if (!texto(c.email)) return { ok: false, error: "Escribe tu correo: es adonde te enviamos el enlace si olvidas la contraseña" };
  if (correo.tipo !== "email" || correo.error) {
    return { ok: false, error: correo.error ?? "Ese correo no parece válido" };
  }

  let telefono: string | null = null;
  if (texto(c.telefono)) {
    const t = interpretar(texto(c.telefono));
    if (t.tipo !== "telefono" || t.error) {
      return { ok: false, error: "El celular debe tener 10 dígitos y empezar por 3" };
    }
    telefono = t.valor;
  }

  let username: string | null = null;
  if (texto(c.username)) {
    const u = interpretar(texto(c.username));
    if (u.tipo !== "username" || u.error) {
      return {
        ok: false,
        error:
          u.tipo === "username" && u.error
            ? u.error
            : "El usuario admite letras, números, punto, guion y guion bajo (3 a 30)",
      };
    }
    username = u.valor;
  }

  return { ok: true, datos: { nombre, nivel, email: correo.valor, telefono, username } };
}

/** La contraseña nueva: las mismas reglas del registro. */
export function validarContrasenaNueva(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length < 8) {
    return "La contraseña nueva debe tener al menos 8 caracteres";
  }
  if (valor.length > 200) return "La contraseña es demasiado larga";
  return null;
}
