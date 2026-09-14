/**
 * Datos del responsable y versión de los documentos legales.
 *
 * Se publica la CIUDAD y no una dirección de calle. La Ley 1581 y el
 * Estatuto del Consumidor exigen identificar al responsable y dar una
 * dirección de notificación, pero la ciudad cumple ese papel sin exponer
 * un domicilio particular. Si la SIC o un cliente piden la dirección
 * exacta, se entrega por el canal de contacto.
 *
 * Los campos entre corchetes hay que llenarlos con los datos reales de
 * la empresa ANTES de salir a producción: la Ley 1581 exige identificar
 * al responsable del tratamiento con nombre, domicilio y correo.
 *
 * La versión se guarda junto con la aceptación de cada usuario. Si los
 * documentos cambian, se sabe quién aceptó cuál — sin eso, un cambio de
 * términos borra el rastro de lo que la gente aceptó de verdad.
 */
export const EMPRESA = {
  razonSocial: "PRAXIS - THINKS S.A.S.",
  nit: "901533185-1",
  domicilio: "Duitama, Boyacá, Colombia",
  correo: "praxisthinks@gmail.com",
  telefono: "311 731 8700",
  marca: "Allison",
} as const;

export const VERSION_LEGAL = "2026-09-14";

export const ACTUALIZADO = "14 de septiembre de 2026";

/** Terceros a los que llegan datos. Debe coincidir con la realidad. */
export const ENCARGADOS = [
  {
    nombre: "Google (Gemini API)",
    pais: "Estados Unidos",
    para: "Escuchar el audio del alumno y generar la respuesta y las correcciones",
  },
  {
    nombre: "Hetzner",
    pais: "Estados Unidos",
    para: "Servidor donde corre la aplicación y se guardan la cuenta, el saldo y el progreso",
  },
  {
    nombre: "Bold",
    pais: "Colombia",
    para: "Procesar los pagos. Nosotros no vemos ni guardamos datos de tarjetas",
  },
  {
    nombre: "Google (Gmail)",
    pais: "Estados Unidos",
    para: "Enviar correos de verificación y recuperación de contraseña",
  },
] as const;
