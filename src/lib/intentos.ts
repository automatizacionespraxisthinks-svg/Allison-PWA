import { interpretar } from "./identificador.ts";
import { intentosAgotados, olvidarFallos, origenDe, restarFallo, sumarFallo } from "./limite.ts";

/**
 * Los candados del inicio de sesión.
 *
 * Sin ellos, la clave de una cuenta se puede adivinar sin freno. Y un
 * alumno de colegio entra con un PIN de 6 dígitos (los primeros eran de
 * 4: 10.000 combinaciones, que un script recorre en una tarde).
 *
 * Cuentan FALLOS, en tres ventanas:
 *   · por cuenta, 15 minutos: frena adivinar la clave de alguien;
 *   · por cuenta, 24 horas: con solo la ventana corta un PIN caería en
 *     días; con esta, recorrer las 10.000 combinaciones toma más de un
 *     año (era 50 al día; con 20, un compañero que prueba todo el salón
 *     cada día tarda 2,5 veces más; auditoría, 2 de noviembre de 2026);
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
  cuentaDia: { maximo: 20, ventanaSeg: 24 * 60 * 60 },
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

/**
 * Aparta un intento ANTES de mirar la clave: se anota como fallo y se
 * devuelve con `entradaBuena` si la clave era la correcta. Devuelve
 * false si ya no quedan intentos.
 *
 * Mirar el candado y anotar el fallo después de consultar la base y
 * bcrypt dejaba un hueco: mil peticiones a la vez pasaban todas el
 * candado mientras la primera esperaba, y un PIN de 4 dígitos caía en
 * una sola ráfaga (auditoría de seguridad, 2 de noviembre de 2026).
 * Apartar el intento es inmediato, sin esperas en medio: la petición
 * once ya encuentra la cuenta bloqueada.
 */
export function reservarIntento(cuenta: string, peticion?: Request): boolean {
  if (entradaBloqueada(cuenta, peticion)) return false;
  anotarFallo(cuenta, peticion);
  return true;
}

/**
 * Entró bien: se libera la cuenta y se le devuelve a la IP el intento
 * apartado (cuarenta alumnos que entran bien desde la IP del colegio no
 * pueden contar como cuarenta fallos).
 */
export function entradaBuena(cuenta: string, peticion?: Request): void {
  liberarCuenta(cuenta);
  for (const c of candados(cuenta, peticion)) {
    if (c.clave.startsWith("entrar:ip:")) restarFallo(c.clave);
  }
}
