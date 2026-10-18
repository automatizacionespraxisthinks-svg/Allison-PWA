import { RecargaManual } from "@/components/admin/RecargaManual";
import { sql } from "@/lib/db";
import { cuadreDelDia, recargasRecientes } from "@/lib/panel/recargas";
import { configPrecios, pesos } from "@/lib/precios";
import { hoyEnColombia } from "@/lib/uso";
import { paginaDeAdmin } from "@/lib/admin";

/**
 * Recargas (plan, sección 21; boceto 7): sumar intervenciones a un alumno
 * que pagó en efectivo o por transferencia, con lo recibido para cuadrar
 * la caja. Solo el administrador; los coordinadores no recargan.
 */
export default async function PaginaRecargas() {
  await paginaDeAdmin();
  const hoy = hoyEnColombia();
  const [recientes, cuadre, [plan]] = await Promise.all([
    recargasRecientes(),
    cuadreDelDia(hoy),
    sql`select precio_cop, mensajes_por_mes from planes where codigo = 'mensual' and activo`,
  ]);
  const fecha = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Recargas</h1>
          <p className="text-sm text-texto-suave">
            Recibido hoy: <b className="text-texto">{pesos(cuadre.recibido)}</b>
            {Object.entries(cuadre.porMedio).map(([m, v]) => ` · ${m} ${pesos(v)}`)}
          </p>
        </div>
        <a
          href={`/api/admin/recargas/cuadre?fecha=${hoy}`}
          className="rounded-xl border border-borde bg-superficie px-4 py-2 text-sm font-semibold hover:bg-superficie-2"
        >
          Descargar cuadre del día
        </a>
      </div>

      <RecargaManual cfg={configPrecios()} plan={plan ? { precio: Number(plan.precio_cop), mensajes: Number(plan.mensajes_por_mes) } : null} />

      <section className="overflow-x-auto rounded-2xl border border-borde bg-superficie p-5">
        <h2 className="mb-3 font-bold">Recargas manuales recientes</h2>
        {recientes.length ? (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-xs text-texto-suave">
                <th className="py-2 font-medium">Fecha</th>
                <th className="py-2 font-medium">Alumno</th>
                <th className="py-2 text-right font-medium">Intervenciones</th>
                <th className="py-2 text-right font-medium">Valor</th>
                <th className="py-2 font-medium">Medio</th>
                <th className="py-2 font-medium">Recibo</th>
                <th className="py-2 font-medium">Hecha por</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {recientes.map((r, i) => (
                <tr key={i} className="border-b border-borde/60 last:border-0">
                  <td className="py-2 whitespace-nowrap">{fecha(r.fecha)}</td>
                  <td className="py-2">
                    {r.alumno}
                    <span className="block text-[11px] text-texto-suave">{[r.colegio ?? "Particular", r.curso].filter(Boolean).join(" · ")}</span>
                  </td>
                  <td className="py-2 text-right">{r.tipo === "plan" ? `${r.intervenciones} al mes` : r.intervenciones}</td>
                  <td className="py-2 text-right">
                    {pesos(r.montoCop)}
                    {r.tipo === "plan" && <span className="block text-[11px] text-texto-suave">plan mensual</span>}
                    {r.valorRecibido !== r.montoCop && <span className="block text-[11px] text-acento">recibido {pesos(r.valorRecibido)}</span>}
                  </td>
                  <td className="py-2 capitalize">{r.medio}</td>
                  <td className="py-2">{r.recibo || "—"}</td>
                  <td className="py-2">{r.hechaPor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-texto-suave">Todavía no hay recargas manuales.</p>
        )}
      </section>

      <p className="text-xs text-texto-suave">
        Los mismos precios de la recarga en línea, para que el alumno reciba igual pague como pague: {pesos(configPrecios().copPorMensaje)} por
        intervención, mínimo {pesos(configPrecios().minima)}, 10 % de bono desde $20.000 y 15 % desde $50.000. Una recarga no se borra: un error se
        corrige con un ajuste negativo con motivo, desde la ficha del alumno.
      </p>
    </div>
  );
}
