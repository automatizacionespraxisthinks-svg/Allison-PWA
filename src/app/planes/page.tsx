import Link from "next/link";
import { redirect } from "next/navigation";
import { BotonPlan } from "@/components/BotonPlan";
import { sql } from "@/lib/db";
import { pesos, tiempoEquivalente } from "@/lib/precios";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaPlanes() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const planes = await sql`
    select codigo, nombre, tipo, precio_cop, mensajes_por_mes, duracion_meses
      from planes where activo order by orden
  `;

  const [suscripcion] = await sql`
    select p.nombre, s.periodo_fin::date as hasta
      from suscripciones s join planes p on p.id = s.plan_id
     where s.user_id = ${alumno.id} and s.estado = 'activa'
     limit 1
  `;

  const mensual = planes.find((p) => p.tipo === "mensual");

  /** El plan de mayor ahorro se destaca. Se calcula en vez de fijarse
   *  con un umbral: un umbral de "20% o más" dejaba la pantalla sin
   *  ningún plan destacado el día que los descuentos bajaron a 16%. */
  const masLargo = planes.reduce(
    (mejor, p) => (p.duracion_meses > (mejor?.duracion_meses ?? 0) ? p : mejor),
    planes[0]
  );

  return (
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
          {new Date(suscripcion.hasta).toLocaleDateString("es-CO")}.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {planes.map((p) => {
          const porMes = Math.round(p.precio_cop / p.duracion_meses);
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
                    Hasta {p.mensajes_por_mes} intervenciones al mes
                  </p>
                  <p className="text-sm font-medium text-primario">
                    {tiempoEquivalente(p.mensajes_por_mes)} al mes
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

              <BotonPlan codigo={p.codigo} nombre={p.nombre} />
            </article>
          );
        })}
      </div>

      <Link
        href="/recargar"
        className="rounded-xl border border-borde bg-superficie p-4 text-center text-sm transition hover:bg-superficie-2"
      >
        ¿Prefieres pagar solo lo que usas?{" "}
        <strong className="text-primario">Recarga desde $4.000</strong>
      </Link>
    </main>
  );
}
