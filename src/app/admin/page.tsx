import Link from "next/link";
import { Filtros } from "@/components/admin/Filtros";
import { leerAjustes } from "@/lib/ajustes";
import { colegiosParaFiltro } from "@/lib/panel/consumo";
import { resumenDelPanel } from "@/lib/panel/resumen";
import { configPrecios, COP_POR_MENSAJE_REGLA, pesos } from "@/lib/precios";
import { paginaDeAdmin } from "@/lib/admin";
import { modeloIA } from "@/lib/modelo";
import { CAMBIO_DE_MODELO, TARIFAS } from "@/lib/uso";

/**
 * Resumen (plan, sección 21; boceto 1): lo primero que ve el
 * administrador. Si los alumnos vuelven, si el negocio da, y lo que hay
 * que atender hoy.
 */
export default async function PaginaAdmin({ searchParams }: { searchParams: Promise<{ dias?: string; colegio?: string }> }) {
  await paginaDeAdmin();
  const p = await searchParams;
  const dias = Number(p.dias) || 30;
  const [a, colegios] = await Promise.all([leerAjustes(), colegiosParaFiltro()]);
  const r = await resumenDelPanel({ dias, colegio: p.colegio ?? "todos" }, a);

  const modelo = modeloIA();
  const recarga = configPrecios().copPorMensaje;
  const fechaDelCambio = new Date(CAMBIO_DE_MODELO + "T12:00:00Z").toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const pct = r.cobrado > 0 ? (100 * r.costoIa) / r.cobrado : null;
  const delta = r.activosHoy - r.activosAyer;
  const deltaD7 = r.vuelvenD7 !== null && r.vuelvenD7Antes !== null ? r.vuelvenD7 - r.vuelvenD7Antes : null;

  const tarjeta = (titulo: string, valor: string, nota: string, tono = "") => (
    <div className="rounded-2xl border border-borde bg-superficie p-4">
      <p className="text-xs font-medium text-texto-suave">{titulo}</p>
      <p className="mt-1 text-3xl leading-none font-bold tabular-nums">{valor}</p>
      <p className={`mt-1.5 text-xs ${tono || "text-texto-suave"}`}>{nota}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold">Resumen</h1>
        <Filtros
          campos={[
            {
              nombre: "dias",
              etiqueta: "Periodo",
              opciones: [
                { valor: "30", texto: "Últimos 30 días" },
                { valor: "7", texto: "Últimos 7 días" },
                { valor: "90", texto: "Últimos 90 días" },
              ],
            },
            {
              nombre: "colegio",
              etiqueta: "Colegio",
              opciones: [
                { valor: "todos", texto: "Todos" },
                { valor: "particulares", texto: "Particulares" },
                ...colegios.map((c) => ({ valor: c.id, texto: c.nombre })),
              ],
            },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tarjeta(
          "Alumnos activos hoy",
          String(r.activosHoy),
          `${delta >= 0 ? "+" : ""}${delta} frente a ayer`,
          delta > 0 ? "text-exito" : delta < 0 ? "text-acento" : ""
        )}
        {tarjeta(
          "Vuelven al día 7",
          r.vuelvenD7 === null ? "—" : `${r.vuelvenD7} %`,
          deltaD7 === null
            ? "Aún no hay alumnos nuevos con 7 días"
            : `${deltaD7 >= 0 ? "+" : ""}${deltaD7} puntos frente al periodo anterior`,
          deltaD7 !== null && deltaD7 > 0 ? "text-exito" : deltaD7 !== null && deltaD7 < 0 ? "text-acento" : ""
        )}
        {tarjeta("Con racha de 7 días o más", String(r.conRacha7), `de ${r.activosPeriodo} activos en el periodo`)}
        {tarjeta(
          "Costo de IA frente a lo cobrado",
          pct === null ? "—" : `${pct.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`,
          `${pesos(r.costoIa)} de ${pesos(r.cobrado)}`
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="font-bold">Retención</h2>
          <p className="mb-3 text-xs text-texto-suave">Porcentaje de alumnos nuevos que vuelven a practicar justo ese día</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-xs text-texto-suave">
                  <th className="px-3 first:pl-0 last:pr-0 py-2 font-medium">Cohorte</th>
                  <th className="px-3 first:pl-0 last:pr-0 py-2 text-right font-medium">Alumnos</th>
                  <th className="px-3 first:pl-0 last:pr-0 py-2 text-right font-medium">Día 1</th>
                  <th className="px-3 first:pl-0 last:pr-0 py-2 text-right font-medium">Día 7</th>
                  <th className="px-3 first:pl-0 last:pr-0 py-2 text-right font-medium">Día 14</th>
                </tr>
              </thead>
              <tbody>
                {r.retencion.map((c) => (
                  <tr key={c.cohorte} className="border-b border-borde last:border-0">
                    <td className="px-3 first:pl-0 last:pr-0 py-2">{c.cohorte}</td>
                    <td className="px-3 first:pl-0 last:pr-0 py-2 text-right tabular-nums">{c.alumnos}</td>
                    {[c.d1, c.d7, c.d14].map((v, i) => (
                      <td key={i} className="px-3 first:pl-0 last:pr-0 py-2 text-right font-semibold tabular-nums">
                        {v === null ? "—" : `${v} %`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!a.fechaVersionNueva && (
            <p className="mt-3 text-xs text-texto-suave">
              Para comparar antes y después de los cambios, pon en{" "}
              <Link href="/admin/ajustes" className="underline">
                Ajustes
              </Link>{" "}
              la fecha en que salió la versión nueva.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="mb-3 font-bold">Para atender hoy</h2>
          <ul className="flex flex-col divide-y divide-borde">
            {r.alertas.map((al) => (
              <li key={al.clave}>
                <Link href={al.href} className="flex items-center gap-3 py-2.5 hover:bg-superficie-2">
                  <span
                    className={`grid h-9 min-w-9 place-items-center rounded-xl px-2 text-sm font-bold tabular-nums ${
                      al.cuantos > 0 ? "bg-acento/10 text-acento" : "bg-superficie-2 text-texto-suave"
                    }`}
                  >
                    {al.cuantos}
                  </span>
                  <span className="min-w-0 text-sm">
                    {al.texto}
                    {al.detalle && <span className="block text-xs text-texto-suave">{al.detalle}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-texto-suave">
            Cada umbral se cambia en{" "}
            <Link href="/admin/ajustes" className="underline">
              Ajustes
            </Link>
            .
          </p>
        </section>
      </div>

      <section className="grid gap-3 rounded-2xl border border-borde bg-superficie p-5 text-sm sm:grid-cols-4">
        <p>
          <span className="block text-xs text-texto-suave">Han pagado</span>
          <b className="text-lg tabular-nums">{r.negocio.pagaron}</b>
        </p>
        <p>
          <span className="block text-xs text-texto-suave">Colegios activos</span>
          <b className="text-lg tabular-nums">{r.negocio.colegios}</b>
        </p>
        <p>
          <span className="block text-xs text-texto-suave">Alumnos de colegio</span>
          <b className="text-lg tabular-nums">{r.negocio.alumnosColegio}</b>
        </p>
        <p>
          <span className="block text-xs text-texto-suave">Ingresos totales</span>
          <b className="text-lg tabular-nums">{pesos(r.negocio.ingresosTotal)}</b>
        </p>
      </section>

      <p className="text-xs text-texto-suave">
        Modelo en uso: <span className="font-mono">{modelo}</span>. El costo de IA usa los tokens reales y la tarifa de cada día (
        <span className="font-mono">{TARIFAS.antes.modelo}</span> antes del {fechaDelCambio},{" "}
        <span className="font-mono">{TARIFAS.desdeElCambio.modelo}</span> desde ese día), con el dólar a {pesos(a.dolarCop)} (se cambia
        en Ajustes). No incluye el servidor ni la voz, ni las comisiones de la pasarela.
        {modelo !== TARIFAS.desdeElCambio.modelo && (
          <b className="mt-1 block text-error">
            El modelo en uso no es el de la tarifa: revisa GEMINI_MODEL en el servidor, o el costo no cuadra.
          </b>
        )}
        {" "}La recarga se vende a {pesos(recarga)} por intervención.
        {recarga < COP_POR_MENSAJE_REGLA && (
          <b className="mt-1 block text-error">
            Está por debajo de {pesos(COP_POR_MENSAJE_REGLA)}, lo que pide el costo de {TARIFAS.desdeElCambio.modelo}: con eso la
            recarga casi no deja ganancia. Cambia COP_POR_MENSAJE en el servidor.
          </b>
        )}
      </p>
    </div>
  );
}
