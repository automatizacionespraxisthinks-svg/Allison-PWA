import Link from "next/link";
import { redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { BotonPlan } from "@/components/BotonPlan";
import { planConMesesPorDelante } from "@/lib/cobro";
import { sql } from "@/lib/db";
import { configPrecios, pesos, tiempoEquivalente } from "@/lib/precios";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaPlanes() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const planes = await sql`
    select codigo, nombre, tipo, precio_cop, mensajes_por_mes, duracion_meses
      from planes where activo order by orden
  `;

  // Las fechas se arman en hora de Colombia en la base: calculadas en
  // UTC, un plan que vence de noche en Colombia mostraría el día siguiente.
  const [suscripcion] = await sql`
    select p.nombre, p.mensajes_por_mes,
           to_char(s.fin_en at time zone 'America/Bogota', 'DD/MM/YYYY') as hasta,
           to_char(s.periodo_fin at time zone 'America/Bogota', 'DD/MM/YYYY') as proximo_mes,
           s.periodo_fin < s.fin_en as quedan_meses
      from suscripciones s join planes p on p.id = s.plan_id
     where s.user_id = ${alumno.id} and s.estado = 'activa'
     limit 1
  `;

  // Con meses por delante no se ofrece otro plan: lo vencería y se
  // perderían los meses pagados. El aviso reemplaza los botones y lleva a
  // recargar, con la misma regla que /api/pagos/crear (auditoría, 30 de
  // octubre de 2026).
  const conMeses = await planConMesesPorDelante(alumno.id);

  const mensual = planes.find((p) => p.tipo === "mensual");

  /** El plan de mayor ahorro se destaca. Se calcula en vez de fijarse
   *  con un umbral: un umbral de "20% o más" dejaba la pantalla sin
   *  ningún plan destacado el día que los descuentos bajaron a 16%. */
  const masLargo = planes.reduce(
    (mejor, p) => (p.duracion_meses > (mejor?.duracion_meses ?? 0) ? p : mejor),
    planes[0]
  );

  return (
    <ConNavegacion racha={alumno.rachaDias}>
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 py-5">
      <header>
        <Link href="/practicar" className="text-sm text-texto-suave">
          ← Volver
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-bold">Planes</h1>
        <p className="mt-1 text-texto-suave">
          Conversa con Allison todos los días. Al acabarse el mes te
          preguntamos si quieres seguir — sin cobros automáticos.
        </p>
      </div>

      {suscripcion && (
        <p className="rounded-xl bg-primario-suave p-3 text-sm text-primario">
          Ya tienes el <strong>{suscripcion.nombre}</strong> activo hasta el{" "}
          {suscripcion.hasta}.
          {suscripcion.quedan_meses &&
            ` Tus próximas ${suscripcion.mensajes_por_mes} intervenciones llegan el ${suscripcion.proximo_mes}.`}
        </p>
      )}

      {conMeses && (
        <div className="flex flex-col gap-3 rounded-xl border border-acento/40 bg-acento/10 p-4 text-sm">
          <p>
            Mientras tu plan tenga meses por delante no puedes comprar otro: lo
            reemplazaría y perderías los meses que ya pagaste. Podrás elegir un
            plan nuevo en su último mes. Si se te acabaron las intervenciones
            de este mes, recarga y sigue hablando.
          </p>
          <Link
            href="/recargar"
            className="degradado-primario sombra-accion self-start rounded-xl px-4 py-2.5 font-semibold text-white transition hover:brightness-110"
          >
            Recargar intervenciones
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {planes.map((p) => {
          const porMes = Math.round(p.precio_cop / p.duracion_meses);
          /** El total del periodo, que es lo que el alumno compra. Se
           *  muestra junto al "cada mes" para que quede claro que se
           *  entrega mensualmente y no todo de una vez. */
          const total = p.mensajes_por_mes * p.duracion_meses;
          const ahorro =
            mensual && p.duracion_meses > 1
              ? Math.round(
                  (1 - p.precio_cop / (mensual.precio_cop * p.duracion_meses)) * 100
                )
              : 0;

          return (
            <article
              key={p.codigo}
              className={`rounded-2xl border-2 p-5 ${
                p.codigo === masLargo?.codigo
                  ? "border-primario bg-primario-suave/30"
                  : "border-borde bg-superficie"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{p.nombre}</h2>
                  <p className="text-sm text-texto-suave">
                    {total.toLocaleString("es-CO")} intervenciones
                    {p.duracion_meses > 1
                      ? ` · ${p.mensajes_por_mes} cada mes`
                      : " al mes"}
                  </p>
                  <p className="text-sm font-medium text-primario">
                    {tiempoEquivalente(total)}
                  </p>
                </div>
                {ahorro > 0 && (
                  <span className="shrink-0 rounded-full bg-exito px-2.5 py-1 text-xs font-bold text-white">
                    Ahorras {ahorro}%
                  </span>
                )}
              </div>

              <p className="mt-3 text-3xl font-bold tabular-nums">
                {pesos(p.precio_cop)}
              </p>
              {p.duracion_meses > 1 && (
                <p className="text-sm text-texto-suave">
                  {pesos(porMes)} por mes · pago único
                </p>
              )}

              {conMeses ? (
                <p className="mt-4 text-sm text-texto-suave">
                  Disponible cuando tu {conMeses.nombre} esté en su último mes.
                </p>
              ) : (
                <BotonPlan codigo={p.codigo} nombre={p.nombre} />
              )}
            </article>
          );
        })}
      </div>

      <Link
        href="/recargar"
        className="rounded-xl border border-borde bg-superficie p-4 text-center text-sm transition hover:bg-superficie-2"
      >
        ¿Prefieres pagar solo lo que usas?{" "}
        <strong className="text-primario">
          Recarga desde {pesos(configPrecios().minima)}
        </strong>
      </Link>
    </main>
    </ConNavegacion>
  );
}
