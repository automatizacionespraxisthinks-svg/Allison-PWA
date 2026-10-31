import { PAIS_DE_NIVEL } from "@/components/ruta/Encabezado";
import { finDelMesDelPlan } from "../cobro";
import { sql } from "../db";
import { estadoRutaDe } from "../ruta/avance";
import { rutaDe } from "../ruta/index";
import { rutaProvisionalDe } from "../ruta/provisional";
import { NIVELES, type Nivel } from "../tipos";
import { costoCop } from "../uso";
import { nombreDeParada } from "./etiquetas";
import { sinMarca } from "./operaciones";

/**
 * La ficha de un alumno en el panel (plan, sección 21; boceto 3): dónde
 * va en la ruta, cuánto practica, cuánto gasta, su historial de saldo
 * (asignaciones, recargas, consumo y ajustes, con motivo y quién lo hizo),
 * el avance en cada nivel y las intervenciones por parada.
 */

const n = (v: unknown) => Number(v ?? 0);

export interface MovimientoFicha {
  fecha: string;
  /** Para el consumo: el día. */
  texto: string;
  cantidad: number;
}

export interface FichaAlumno {
  id: string;
  nombre: string;
  identificador: string;
  colegio: string | null;
  institucionId: string | null;
  curso: string | null;
  nivel: Nivel;
  nivelMaximo: Nivel;
  rol: string;
  activo: boolean;
  creadoEn: string;
  vaEn: string;
  racha: number;
  rachaMaxima: number;
  saldo: number;
  /** El fin del mes de su plan activo (DD/MM/AAAA): cuando vence la bolsa
   *  del plan. null si no tiene plan activo. */
  planVence: string | null;
  mes: { intervenciones: number; costoCop: number };
  total: { intervenciones: number; costoCop: number };
  historial: MovimientoFicha[];
  niveles: { nivel: Nivel; pais: string; texto: string }[];
  reportes: { abiertos: number; total: number };
  paradas: { clave: string; nombre: string; intervenciones: number; porErrores: number; estrellas: number; sello: boolean; saltada: boolean }[];
}

const TIPO: Record<string, string> = {
  recarga: "Recarga",
  plan_asignacion: "Plan",
  bono: "Bono",
  ajuste_admin: "Ajuste",
  reverso: "Reverso",
  expiracion: "Vencimiento del plan",
};

export async function fichaDe(userId: string, dolar: number): Promise<FichaAlumno | null> {
  if (!/^[0-9a-f-]{36}$/.test(userId)) return null;
  const [u] = await sql`
    select u.*, coalesce(u.email::text, u.username, u.telefono, '—') as identificador, i.nombre as colegio,
           case when u.ultima_practica_en::date >= current_date - (dias_descanso() + 1) then u.racha_dias else 0 end as racha,
           coalesce(s.mensajes_plan, 0) + coalesce(s.mensajes_recarga, 0) as saldo
      from users u
      left join instituciones i on i.id = u.institucion_id
      left join saldos s on s.user_id = u.id
     where u.id = ${userId}
  `;
  if (!u) return null;
  const nivel = u.nivel as Nivel;

  const [[mes], [total], movimientos, consumo, [rep], paradasConsumo] = await Promise.all([
    sql`
      select coalesce(sum(turnos), 0)::int as turnos,
             coalesce(sum(tokens_entrada + tokens_ayuda_entrada), 0)::bigint as entrada,
             coalesce(sum(tokens_salida + tokens_ayuda_salida), 0)::bigint as salida
        from uso_diario where user_id = ${userId} and fecha >= date_trunc('month', current_date)
    `,
    sql`
      select coalesce(sum(turnos), 0)::int as turnos,
             coalesce(sum(tokens_entrada + tokens_ayuda_entrada), 0)::bigint as entrada,
             coalesce(sum(tokens_salida + tokens_ayuda_salida), 0)::bigint as salida
        from uso_diario where user_id = ${userId}
    `,
    // Todo lo que no es consumo, uno por uno; el consumo, sumado por día.
    sql`
      select m.creado_en, m.tipo, m.cantidad, m.nota, t.pasarela, t.monto_cop, t.payload
        from movimientos_credito m
        left join transacciones t on t.id = m.transaccion_id
       where m.user_id = ${userId} and m.tipo <> 'consumo'
       order by m.creado_en desc limit 40
    `,
    sql`
      select (creado_en at time zone 'America/Bogota')::date::text as dia, sum(cantidad)::int as cantidad
        from movimientos_credito
       where user_id = ${userId} and tipo = 'consumo'
       group by 1 order by 1 desc limit 40
    `,
    sql`
      select count(*) filter (where estado = 'abierto')::int as abiertos, count(*)::int as total
        from reportes_correccion where user_id = ${userId}
    `,
    sql`
      select c.parada, c.intervenciones, c.por_errores,
             coalesce(p.estrellas, 0) as estrellas, p.sello_en is not null as sello, p.saltada_en is not null as saltada
        from ruta_consumo c
        left join ruta_paradas p on p.user_id = c.user_id and p.parada = c.parada
       where c.user_id = ${userId}
       order by c.parada
    `,
  ]);

  const historial: (MovimientoFicha & { orden: number })[] = [
    ...movimientos.map((m) => {
      const pago = m.pasarela as string | null;
      const payload = (m.payload ?? {}) as { recibo?: string; medio?: string; registradoPor?: string };
      const texto =
        pago === "efectivo" || pago === "transferencia"
          ? `${pago === "efectivo" ? "Recarga en efectivo" : "Recarga por transferencia"} · $${n(m.monto_cop).toLocaleString("es-CO")}${
              payload.recibo ? ` · ${payload.recibo}` : ""
            }${payload.registradoPor ? ` · por ${payload.registradoPor}` : ""}`
          : pago
            ? `${TIPO[m.tipo] ?? m.tipo} en línea · $${n(m.monto_cop).toLocaleString("es-CO")}`
            : `${TIPO[m.tipo] ?? m.tipo}${m.nota ? ` · ${sinMarca(m.nota)}` : ""}`;
      return { fecha: (m.creado_en as Date).toISOString(), texto, cantidad: n(m.cantidad), orden: (m.creado_en as Date).getTime() };
    }),
    ...consumo.map((c) => ({
      fecha: `${c.dia}T12:00:00-05:00`,
      texto: "Consumo en actividades y conversación",
      cantidad: n(c.cantidad),
      orden: Date.parse(`${c.dia}T23:59:59-05:00`),
    })),
  ].sort((a, b) => b.orden - a.orden);

  // Dónde va y el avance en cada nivel (cada nivel se guarda aparte).
  const niveles: FichaAlumno["niveles"] = [];
  let vaEn = "";
  for (const { nivel: l } of NIVELES) {
    const pais = PAIS_DE_NIVEL[l] ?? l;
    if (rutaDe(l)) {
      const [hay] = await sql`
        select (exists (select 1 from ruta_lecciones where user_id = ${userId} and parada like ${`${l.toLowerCase()}-%`})
             or exists (select 1 from ruta_paradas where user_id = ${userId} and parada like ${`${l.toLowerCase()}-%`})) as hay
      `;
      if (!hay.hay && l !== nivel) {
        niveles.push({ nivel: l, pais, texto: "No ha empezado" });
        continue;
      }
      const e = await estadoRutaDe(userId, l);
      const sig = e?.siguiente;
      const p = e?.paradas.find((x) => x.clave === sig?.parada);
      const donde = e?.completa
        ? "Completo"
        : p && sig
          ? `${p.nombre}${typeof sig.leccion === "number" ? ` · lección ${sig.leccion} de ${p.lecciones.length}` : " · escenario"}`
          : "Sin empezar";
      niveles.push({ nivel: l, pais, texto: `${donde} · ${e?.sellos ?? 0} ${e?.sellos === 1 ? "estampilla" : "estampillas"}` });
      if (l === nivel) vaEn = donde;
    } else {
      const r = await rutaProvisionalDe(userId, l);
      const actual = r.paradas.find((x) => x.estado === "actual");
      const empezo = r.sellos > 0 || r.paradas.some((x) => x.logros > 0);
      const texto = !empezo && l !== nivel ? "No ha empezado" : actual ? `Parada ${actual.numero} de ${r.paradas.length} (provisional)` : "Completo";
      niveles.push({ nivel: l, pais, texto: `${texto}${empezo ? ` · ${r.sellos} ${r.sellos === 1 ? "estampilla" : "estampillas"}` : ""}` });
      if (l === nivel) vaEn = texto;
    }
  }

  return {
    id: u.id,
    nombre: u.nombre,
    identificador: u.identificador,
    colegio: u.colegio,
    institucionId: u.institucion_id,
    curso: u.curso,
    nivel,
    nivelMaximo: (u.nivel_maximo ?? nivel) as Nivel,
    rol: u.rol,
    activo: u.activo,
    creadoEn: (u.creado_en as Date).toISOString(),
    vaEn,
    racha: n(u.racha),
    rachaMaxima: Math.max(n(u.racha_maxima), n(u.racha)),
    saldo: n(u.saldo),
    planVence: (await finDelMesDelPlan([u.id]))[u.id] ?? null,
    mes: { intervenciones: n(mes.turnos), costoCop: costoCop(n(mes.entrada), n(mes.salida), dolar) },
    total: { intervenciones: n(total.turnos), costoCop: costoCop(n(total.entrada), n(total.salida), dolar) },
    historial: historial.slice(0, 40).map(({ fecha, texto, cantidad }) => ({ fecha, texto, cantidad })),
    niveles,
    reportes: { abiertos: n(rep.abiertos), total: n(rep.total) },
    paradas: paradasConsumo.map((p) => ({
      clave: p.parada,
      nombre: nombreDeParada(p.parada),
      intervenciones: n(p.intervenciones),
      porErrores: n(p.por_errores),
      estrellas: n(p.estrellas),
      sello: !!p.sello,
      saltada: !!p.saltada,
    })),
  };
}
