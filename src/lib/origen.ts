/**
 * La dirección pública de la aplicación.
 *
 * Existe por un fallo que solo aparece fuera de Vercel y que no se ve
 * en ningún log: `new URL(peticion.url).origin` NO devuelve el dominio
 * del visitante en un servidor propio. El server.js de la salida
 * autónoma arma esa URL con la dirección donde ESCUCHA, y como el
 * contenedor escucha en 0.0.0.0 el origen resultaba ser literalmente
 * `https://0.0.0.0:3000`.
 *
 * Con eso, cuatro caminos de negocio quedaban rotos en silencio — los
 * correos se envían "correctamente", solo que con enlaces muertos:
 *
 *   · el enlace de verificación (y sus +15 intervenciones)
 *   · el reenvío de ese enlace
 *   · la recuperación de contraseña, único canal para recuperar cuenta
 *   · el retorno de Wompi: el alumno paga y aterriza en la nada
 *
 * Por eso el origen se toma de AUTH_URL, que es configuración del
 * despliegue y no un dato que venga del cliente. Las cabeceras del
 * proxy quedan solo como respaldo: son falsificables, y aquí se usan
 * para construir enlaces que se le mandan por correo a una persona.
 */
export function origenPublico(peticion: Request): string {
  const configurado = process.env.AUTH_URL?.trim();
  if (configurado) return configurado.replace(/\/+$/, "");

  // Respaldo: lo que dice el proxy. Solo se llega aquí si nadie
  // configuró AUTH_URL, cosa que la guía de despliegue marca como
  // obligatoria.
  const host =
    peticion.headers.get("x-forwarded-host") ?? peticion.headers.get("host");
  if (host) {
    const protocolo = peticion.headers.get("x-forwarded-proto") ?? "https";
    return `${protocolo}://${host}`.replace(/\/+$/, "");
  }

  // Último recurso: lo que traiga la petición. En un contenedor esto
  // es 0.0.0.0 y produce enlaces muertos — pero es preferible a
  // reventar el registro de un alumno.
  return new URL(peticion.url).origin;
}
