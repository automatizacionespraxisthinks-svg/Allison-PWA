import { interpretar } from "./identificador.ts";
import { intentosAgotados, olvidarFallos, origenDe, sumarFallo } from "./limite.ts";

/**
 * Los candados del inicio de sesión.
 *
 * Sin ellos, la clave de una cuenta se puede adivinar sin freno. Y un
 * alumno de colegio entra con un PIN de 4 dígitos: 10.000
 * combinaciones, que un script recorre en una tarde.
 *
 * Cuentan FALLOS, en tres ventanas:
 *   · por cuenta, 15 minutos: frena adivinar la clave de alguien;
 *   · por cuenta, 24 horas: con solo la ventana corta un PIN caería en
 *     días; con esta, recorrer las 10.000 combinaciones toma más de
 *     medio año;
 *   · por IP, 15 minutos: frena probar muchas cuentas desde un mismo
 *     lugar, con margen para un salón entero detrás de una misma IP.
 *
 * La cuenta se identifica por lo que se TECLEÓ, exista o no: el
 * bloqueo se comporta igual para una cuenta real que para una
 * inventada, así que no revela cuáles existen.
 *
 * Una cuenta bloqueada se libera sola al vencer la ventana, al entrar
 * bien, o antes: cuando el coordinador le reinicia el PIN o cuando la
 * persona recupera su contraseña. Sin esa salida, un compañero de salón
 * podría dejar a otro por fuera un día entero a propósito.
 */
export const LIMITES_ENTRADA = {
  cuenta: { maximo: 10, ventanaSeg: 15 * 60 },
  cuentaDia: { maximo: 50, ventanaSeg: 24 * 60 * 60 },
  ip: { maximo: 60, ventanaSeg: 15 * 60 },
} as const;

/** La cuenta de quien entra con correo, celular o usuario. */
export function cuentaDeCorreo(identificador: string): string | null {
  const id = interpretar(identificador);
  return id.error || !id.valor ? null : `correo:${id.tipo}:${id.valor}`;
}

/** La cuenta de un alumno de colegio. El código no distingue mayúsculas. */
export function cuentaDeColegio(codigo: string, usuario: string): string {
  return `colegio:${codigo.trim().toUpperCase()}:${usuario.trim().toLowerCase()}`;
}

function candados(cuenta: string, peticion?: Request) {
  const lista: { clave: string; maximo: number; ventanaSeg: number }[] = [
    { clave: `entrar:cuenta:${cuenta}`, ...LIMITES_ENTRADA.cuenta },
    { clave: `entrar:cuenta-dia:${cuenta}`, ...LIMITES_ENTRADA.cuentaDia },
  ];

  // Sin un proxy que diga la IP real, todas las peticiones comparten el
  // mismo origen: un límite por IP ahí dejaría a TODO el mundo sin poder
  // entrar con 60 fallos de cualquiera. Quedan los límites por cuenta.
  const origen = peticion ? origenDe(peticion) : "sin-proxy";
  if (origen !== "sin-proxy") {
    lista.push({ clave: `entrar:ip:${origen}`, ...LIMITES_ENTRADA.ip });
  }
  return lista;
}

export function entradaBloqueada(cuenta: string, peticion?: Request): boolean {
  return candados(cuenta, peticion).some((c) => intentosAgotados(c.clave, c.maximo));
}

export function anotarFallo(cuenta: string, peticion?: Request): void {
  for (const c of candados(cuenta, peticion)) sumarFallo(c.clave, c.ventanaSeg);
}

/** Libera la cuenta, no la IP: entró bien, o recuperó su acceso. */
export function liberarCuenta(cuenta: string): void {
  olvidarFallos(`entrar:cuenta:${cuenta}`);
  olvidarFallos(`entrar:cuenta-dia:${cuenta}`);
}
