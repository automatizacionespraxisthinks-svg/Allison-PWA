import { sql } from "./db";

/**
 * Las cifras de uso y de consumo de IA para el panel.
 *
 * Todo sale de uso_diario, el acumulado que sobrevive al borrado de
 * conversaciones a los 20 días. Consultar la tabla mensajes daría un
 * tablero que solo puede mirar tres semanas hacia atrás, y la
 * comparación contra el año pasado sería siempre cero.
 *
 * Las fechas se manejan en hora de COLOMBIA de punta a punta: "hoy"
 * tiene que significar hoy para quien mira el panel, no un día que
 * arranca a las siete de la tarde.
 */

/** Tarifas de gemini-2.5-flash-lite, en dólares por millón de tokens. */
export const TARIFAS = {
  entrada: 0.1,
  salida: 0.4,
  usdACop: 4000,
} as const;

export function costoCop(entrada: number, salida: number): number {
  const usd =
    (entrada / 1e6) * TARIFAS.entrada + (salida / 1e6) * TARIFAS.salida;
  return Math.round(usd * TARIFAS.usdACop);
}

export type Periodo = "hoy" | "semana" | "mes" | "anio" | "rango";

export interface Rango {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  /** Cómo se agrupan las barras de la gráfica. */
  granularidad: "dia" | "mes";
  etiqueta: string;
}

/** Hoy, en Colombia. Sin esto el panel cambia de día siete horas tarde. */
export function hoyEnColombia(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });
}

function restarDias(fecha: string, dias: number): string {
  const d = new Date(fecha + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Traduce lo que pidió el administrador a un rango concreto.
 *
 * Las fechas a mano se validan aquí y no en la consulta: un texto
 * cualquiera en la barra de direcciones no puede llegar a la base.
 */
export function resolverRango(
  periodo: string | undefined,
  desde?: string,
  hasta?: string
): Rango {
  const hoy = hoyEnColombia();
  const valida = (s?: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s ?? "") ? s! : null);

  switch (periodo) {
    case "hoy":
      return { desde: hoy, hasta: hoy, granularidad: "dia", etiqueta: "Hoy" };

    case "anio":
      return {
        desde: hoy.slice(0, 4) + "-01-01",
        hasta: hoy,
        granularidad: "mes",
        etiqueta: `Año ${hoy.slice(0, 4)}`,
      };

    case "rango": {
      const d = valida(desde);
      const h = valida(hasta);
      if (d && h && d <= h) {
        // Más de 92 días se agrupa por mes: sesenta barras no se leen.
        const dias =
          (Date.parse(h) - Date.parse(d)) / 86_400_000;
        return {
          desde: d,
          hasta: h,
          granularidad: dias > 92 ? "mes" : "dia",
          etiqueta: `${d} a ${h}`,
        };
      }
      break;
    }

    case "semana":
      return {
        desde: restarDias(hoy, 6),
        hasta: hoy,
        granularidad: "dia",
        etiqueta: "Últimos 7 días",
      };
  }

  // Por defecto, el mes en curso: es lo que se factura.
  return {
    desde: hoy.slice(0, 8) + "01",
    hasta: hoy,
    granularidad: "dia",
    etiqueta: "Este mes",
  };
}

export interface Totales {
  usuariosActivos: number;
  conversaciones: number;
  turnos: number;
  segundosAudio: number;
  llamadasConversar: number;
  llamadasAyuda: number;
  tokensEntrada: number;
  tokensSalida: number;
  tokensAyudaEntrada: number;
  tokensAyudaSalida: number;
}

export interface PuntoSerie {
  etiqueta: string;
  turnos: number;
  conversaciones: number;
  tokensEntrada: number;
  tokensSalida: number;
  costoCop: number;
}

export interface UsuarioUso {
  nombre: string;
  identificador: string;
  turnos: number;
  tokens: number;
  costoCop: number;
}

export interface InformeUso {
  rango: Rango;
  totales: Totales;
  serie: PuntoSerie[];
  usuarios: UsuarioUso[];
}

const n = (v: unknown) => Number(v ?? 0);

export async function informeDeUso(rango: Rango): Promise<InformeUso> {
  const { desde, hasta, granularidad } = rango;

  // Las tres consultas no dependen entre sí: van juntas. Cada viaje a
  // la base cuesta tiempo que el administrador espera en pantalla.
  const [[t], filas, usuarios] = await Promise.all([
    sql`
      select count(distinct user_id)::int          as usuarios_activos,
             coalesce(sum(conversaciones), 0)::int as conversaciones,
             coalesce(sum(turnos), 0)::int         as turnos,
             coalesce(sum(segundos_audio), 0)::int as segundos,
             coalesce(sum(llamadas_conversar), 0)::int as llamadas_conversar,
             coalesce(sum(llamadas_ayuda), 0)::int     as llamadas_ayuda,
             coalesce(sum(tokens_entrada), 0)::bigint  as tokens_entrada,
             coalesce(sum(tokens_salida), 0)::bigint   as tokens_salida,
             coalesce(sum(tokens_ayuda_entrada), 0)::bigint as ayuda_entrada,
             coalesce(sum(tokens_ayuda_salida), 0)::bigint  as ayuda_salida
        from uso_diario
       where fecha between ${desde} and ${hasta}
    `,

    granularidad === "mes"
      ? sql`
          select to_char(date_trunc('month', fecha), 'YYYY-MM') as etiqueta,
                 coalesce(sum(turnos), 0)::int         as turnos,
                 coalesce(sum(conversaciones), 0)::int as conversaciones,
                 coalesce(sum(tokens_entrada + tokens_ayuda_entrada), 0)::bigint as entrada,
                 coalesce(sum(tokens_salida + tokens_ayuda_salida), 0)::bigint   as salida
            from uso_diario
           where fecha between ${desde} and ${hasta}
           group by 1 order by 1
        `
      : sql`
          select fecha::text as etiqueta,
                 coalesce(sum(turnos), 0)::int         as turnos,
                 coalesce(sum(conversaciones), 0)::int as conversaciones,
                 coalesce(sum(tokens_entrada + tokens_ayuda_entrada), 0)::bigint as entrada,
                 coalesce(sum(tokens_salida + tokens_ayuda_salida), 0)::bigint   as salida
            from uso_diario
           where fecha between ${desde} and ${hasta}
           group by 1 order by 1
        `,

    sql`
      select u.nombre,
             coalesce(u.email, u.telefono, u.username, '—') as identificador,
             coalesce(sum(d.turnos), 0)::int as turnos,
             coalesce(sum(d.tokens_entrada + d.tokens_ayuda_entrada), 0)::bigint as entrada,
             coalesce(sum(d.tokens_salida + d.tokens_ayuda_salida), 0)::bigint   as salida
        from uso_diario d
        join users u on u.id = d.user_id
       where d.fecha between ${desde} and ${hasta}
       group by u.id, u.nombre, identificador
       having coalesce(sum(d.turnos), 0) > 0
       order by turnos desc
       limit 15
    `,
  ]);

  return {
    rango,
    totales: {
      usuariosActivos: n(t.usuarios_activos),
      conversaciones: n(t.conversaciones),
      turnos: n(t.turnos),
      segundosAudio: n(t.segundos),
      llamadasConversar: n(t.llamadas_conversar),
      llamadasAyuda: n(t.llamadas_ayuda),
      tokensEntrada: n(t.tokens_entrada),
      tokensSalida: n(t.tokens_salida),
      tokensAyudaEntrada: n(t.ayuda_entrada),
      tokensAyudaSalida: n(t.ayuda_salida),
    },
    serie: filas.map((f) => ({
      etiqueta: f.etiqueta as string,
      turnos: n(f.turnos),
      conversaciones: n(f.conversaciones),
      tokensEntrada: n(f.entrada),
      tokensSalida: n(f.salida),
      costoCop: costoCop(n(f.entrada), n(f.salida)),
    })),
    usuarios: usuarios.map((u) => ({
      nombre: u.nombre as string,
      identificador: u.identificador as string,
      turnos: n(u.turnos),
      tokens: n(u.entrada) + n(u.salida),
      costoCop: costoCop(n(u.entrada), n(u.salida)),
    })),
  };
}
