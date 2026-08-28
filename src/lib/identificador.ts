/**
 * Un solo campo para entrar: correo, celular o usuario.
 *
 * El alumno escribe lo que tenga y nosotros deducimos qué es. Pedirle
 * que elija primero "tipo de identificación" es fricción innecesaria.
 */

export type TipoIdentificador = "email" | "telefono" | "username";

export interface Identificador {
  tipo: TipoIdentificador;
  valor: string;
  /** Mensaje de por qué no sirve, si no sirve. */
  error?: string;
}

/**
 * Normaliza un celular colombiano a 10 dígitos.
 * Acepta +57 300 123 4567, 57-3001234567, (300) 1234567...
 */
function normalizarCelular(entrada: string): string | null {
  let d = entrada.replace(/\D/g, "");
  if (d.startsWith("57") && d.length === 12) d = d.slice(2); // indicativo país
  if (d.length !== 10) return null;
  if (!d.startsWith("3")) return null; // los móviles en Colombia empiezan en 3
  return d;
}

export function interpretar(entrada: string): Identificador {
  const limpio = entrada.trim();

  if (!limpio) {
    return { tipo: "username", valor: "", error: "Escribe tu correo, celular o usuario" };
  }

  // Correo
  if (limpio.includes("@")) {
    const email = limpio.toLowerCase();
    const valido = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email);
    return valido
      ? { tipo: "email", valor: email }
      : { tipo: "email", valor: email, error: "Ese correo no parece válido" };
  }

  // Solo dígitos y signos de teléfono → celular
  if (/^[\d\s()+.-]+$/.test(limpio)) {
    const celular = normalizarCelular(limpio);
    return celular
      ? { tipo: "telefono", valor: celular }
      : {
          tipo: "telefono",
          valor: limpio,
          error: "El celular debe tener 10 dígitos y empezar por 3",
        };
  }

  // Usuario
  const username = limpio.toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return {
      tipo: "username",
      valor: username,
      error: "El usuario admite letras, números, punto, guion y guion bajo (3 a 30)",
    };
  }
  return { tipo: "username", valor: username };
}

/** Cómo se le muestra al alumno lo que escribió. */
export function describir(tipo: TipoIdentificador): string {
  return tipo === "email" ? "correo" : tipo === "telefono" ? "celular" : "usuario";
}
