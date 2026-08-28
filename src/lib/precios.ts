/**
 * Conversión de pesos a mensajes.
 *
 * Los números viven aquí y no repartidos por las pantallas: son reglas
 * de negocio, y el día que cambien no se pueden quedar tres pantallas
 * con el precio viejo.
 */

export interface ConfigPrecios {
  copPorMensaje: number;
  minima: number;
  maxima: number;
}

/**
 * Se lee del entorno en el servidor y se le pasa al navegador como
 * props. Las variables sin NEXT_PUBLIC_ no existen en el cliente, y
 * dejar que caiga a un valor por defecto haría que la pantalla muestre
 * un precio distinto al que se cobra.
 */
export function configPrecios(): ConfigPrecios {
  return {
    copPorMensaje: Number(process.env.COP_POR_MENSAJE ?? 100),
    minima: Number(process.env.RECARGA_MINIMA_COP ?? 4000),
    maxima: 500_000,
  };
}

/** Bono por volumen: empuja a recargar grande, que es lo que baja el
 *  peso de la comisión fija de la pasarela. */
const ESCALONES = [
  { desde: 50_000, bono: 0.15 },
  { desde: 20_000, bono: 0.1 },
];

export interface Calculo {
  montoCop: number;
  base: number;
  bono: number;
  total: number;
  porcentajeBono: number;
  /** Cuánto falta para el siguiente escalón de bono, si lo hay. */
  siguienteEscalon?: { desde: number; bono: number; faltan: number };
}

export function calcularRecarga(montoCop: number, cfg: ConfigPrecios): Calculo {
  const monto = Math.floor(montoCop);
  const base = Math.floor(monto / cfg.copPorMensaje);

  const escalon = ESCALONES.find((e) => monto >= e.desde);
  const porcentajeBono = escalon?.bono ?? 0;
  const bono = Math.floor(base * porcentajeBono);

  // El escalón inmediatamente superior al que ya alcanzó
  const superior = [...ESCALONES]
    .reverse()
    .find((e) => monto < e.desde);

  return {
    montoCop: monto,
    base,
    bono,
    total: base + bono,
    porcentajeBono,
    siguienteEscalon: superior
      ? { desde: superior.desde, bono: superior.bono, faltan: superior.desde - monto }
      : undefined,
  };
}

export function validarMonto(montoCop: unknown, cfg: ConfigPrecios): string | null {
  const n = Number(montoCop);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return "El monto debe ser un número entero";
  }
  if (n < cfg.minima) {
    return `La recarga mínima es de ${pesos(cfg.minima)}`;
  }
  if (n > cfg.maxima) {
    return `El máximo por recarga es ${pesos(cfg.maxima)}`;
  }
  return null;
}

export const pesos = (n: number) => `$${n.toLocaleString("es-CO")}`;
