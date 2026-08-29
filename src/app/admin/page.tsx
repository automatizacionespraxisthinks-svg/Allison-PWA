import { resumenGeneral } from "@/lib/admin";
import { pesos } from "@/lib/precios";

export default async function PaginaAdmin() {
  const r = await resumenGeneral();
  const margen =
    r.ingresosMes > 0
      ? Math.round((1 - r.costoIaMes / r.ingresosMes) * 100)
      : null;

  const bloque = (titulo: string, filas: [string, string][]) => (
    <section className="rounded-2xl border border-borde bg-superficie p-5">
      <h2 className="text-sm font-semibold text-texto-suave">{titulo}</h2>
      <dl className="mt-3 flex flex-col gap-2">
        {filas.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-texto-suave">{k}</dt>
            <dd className="text-lg font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {bloque("Usuarios", [
          ["Total", String(r.usuarios)],
          ["Activos esta semana", String(r.activosSemana)],
          ["Todavía en prueba", String(r.enPrueba)],
          ["Han pagado", String(r.pagaron)],
        ])}

        {bloque("Colegios", [
          ["Convenios activos", String(r.colegios)],
          ["Alumnos de colegio", String(r.alumnosDeColegio)],
        ])}

        {bloque("Dinero", [
          ["Ingresos del mes", pesos(r.ingresosMes)],
          ["Ingresos totales", pesos(r.ingresosTotal)],
          ["Costo de IA del mes", pesos(r.costoIaMes)],
          ["Margen del mes", margen === null ? "—" : `${margen}%`],
        ])}

        {bloque("Uso", [
          ["Mensajes esta semana", String(r.mensajesSemana)],
        ])}
      </div>

      <p className="rounded-xl border border-borde bg-superficie p-4 text-sm text-texto-suave">
        El costo de IA se calcula con los tokens realmente consumidos y las
        tarifas de <span className="font-mono">gemini-2.5-flash-lite</span>. No
        incluye el servidor ni las comisiones de la pasarela, que en recargas
        pequeñas pesan mucho más que la IA.
      </p>
    </div>
  );
}
