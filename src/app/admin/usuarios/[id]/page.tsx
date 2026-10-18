import Link from "next/link";
import { notFound } from "next/navigation";
import { AccionesAlumno } from "@/components/admin/AccionesAlumno";
import { paginaDeAdmin } from "@/lib/admin";
import { leerAjustes } from "@/lib/ajustes";
import { fichaDe } from "@/lib/panel/ficha";
import { pesos } from "@/lib/precios";
import { esUuid } from "@/lib/validar";

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", year: "numeric" });

/**
 * La ficha de un alumno (plan, sección 21; boceto 3): dónde va en la
 * ruta, cuánto practica y gasta, el historial de su saldo, el avance en
 * cada nivel y las intervenciones por parada.
 */
export default async function PaginaFicha({ params }: { params: Promise<{ id: string }> }) {
  await paginaDeAdmin();
  const { id } = await params;
  if (!esUuid(id)) notFound();
  const a = await leerAjustes();
  const f = await fichaDe(id, a.dolarCop);
  if (!f) notFound();
  const iniciales = f.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const dato = (titulo: string, valor: string, nota: string) => (
    <div className="rounded-2xl border border-borde bg-superficie p-4">
      <p className="text-xs font-medium text-texto-suave">{titulo}</p>
      <p className="mt-1 text-xl leading-tight font-bold">{valor}</p>
      <p className="mt-1 text-xs text-texto-suave">{nota}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/usuarios" className="text-sm text-texto-suave underline">
        ← Alumnos
      </Link>
      <header className="flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-primario-suave text-lg font-bold text-primario">{iniciales}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">
              {f.nombre}
              {f.rol !== "estudiante" && (
                <span className="ml-2 rounded-full bg-texto px-2 py-0.5 align-middle text-[11px] font-bold text-fondo uppercase">{f.rol}</span>
              )}
              {!f.activo && (
                <span className="ml-2 rounded-full bg-error/15 px-2 py-0.5 align-middle text-[11px] font-bold text-error uppercase">Inactivo</span>
              )}
            </h1>
            <p className="text-sm text-texto-suave">
              {[f.colegio ?? "Particular", f.curso ? `curso ${f.curso}` : null, `nivel actual ${f.nivel}`, f.identificador]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="text-xs text-texto-suave">
              Desde el {fecha(f.creadoEn)} · puede volver a subir hasta {f.nivelMaximo}
            </p>
          </div>
        </div>
        <AccionesAlumno userId={f.id} nombre={f.nombre} nivel={f.nivel} curso={f.curso} deColegio={!!f.institucionId} />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dato("Va en", f.vaEn || "—", `Nivel ${f.nivel}`)}
        {dato("Racha", `${f.racha} ${f.racha === 1 ? "día" : "días"}`, `la más larga: ${f.rachaMaxima}`)}
        {dato("Saldo", f.saldo.toLocaleString("es-CO"), "intervenciones")}
        {dato(
          "Este mes",
          `${f.mes.intervenciones.toLocaleString("es-CO")} intervenciones`,
          `${pesos(f.mes.costoCop)} de IA · en total ${pesos(f.total.costoCop)}`
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="mb-3 font-bold">Historial de saldo</h2>
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-superficie">
                <tr className="border-b border-borde text-left text-xs text-texto-suave">
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Movimiento</th>
                  <th className="py-2 text-right font-medium">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {f.historial.map((m, i) => (
                  <tr key={i} className="border-b border-borde/60 align-top last:border-0">
                    <td className="py-2 pr-2 whitespace-nowrap text-texto-suave">{fecha(m.fecha)}</td>
                    <td className="py-2 pr-2">{m.texto}</td>
                    <td className={`py-2 text-right font-semibold tabular-nums ${m.cantidad >= 0 ? "text-exito" : ""}`}>
                      {m.cantidad > 0 ? "+" : m.cantidad < 0 ? "−" : ""}
                      {Math.abs(m.cantidad).toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
                {!f.historial.length && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-texto-suave">
                      Sin movimientos.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-borde">
                  <td colSpan={2} className="py-2 font-semibold">
                    Saldo actual
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums">{f.saldo.toLocaleString("es-CO")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-borde bg-superficie p-5">
            <h2 className="mb-3 font-bold">Avance por nivel</h2>
            <table className="w-full text-sm">
              <tbody>
                {f.niveles.map((l) => (
                  <tr key={l.nivel} className="border-b border-borde/60 last:border-0">
                    <td className="py-2 pr-2 font-semibold whitespace-nowrap">
                      {l.nivel} · {l.pais}
                    </td>
                    <td className={`py-2 ${l.texto.startsWith("No ha") ? "text-texto-suave" : ""}`}>{l.texto}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-2 font-semibold">Reportó correcciones</td>
                  <td className="py-2">
                    {f.reportes.total ? (
                      <Link href="/admin/reportes" className="underline">
                        {f.reportes.total} en total · {f.reportes.abiertos} {f.reportes.abiertos === 1 ? "abierta" : "abiertas"}
                      </Link>
                    ) : (
                      <span className="text-texto-suave">Ninguna</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-borde bg-superficie p-5">
            <h2 className="mb-3 font-bold">Intervenciones por parada</h2>
            {f.paradas.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-xs text-texto-suave">
                    <th className="py-2 font-medium">Parada</th>
                    <th className="py-2 text-right font-medium">Gastó</th>
                    <th className="py-2 text-right font-medium">Por errores</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {f.paradas.map((p) => (
                    <tr key={p.clave} className="border-b border-borde/60 last:border-0">
                      <td className="py-2">
                        {p.nombre}
                        <span className="block text-[11px] text-texto-suave">
                          {p.sello ? `${p.estrellas} ${p.estrellas === 1 ? "estrella" : "estrellas"} · estampilla` : p.saltada ? "Saltada" : "En curso"}
                        </span>
                      </td>
                      <td className={`py-2 text-right font-semibold ${p.intervenciones > a.alertaParadaIntervenciones ? "text-acento" : ""}`}>
                        {p.intervenciones}
                      </td>
                      <td className="py-2 text-right">{p.porErrores}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-texto-suave">Todavía no gasta intervenciones en la ruta.</p>
            )}
            <p className="mt-2 text-xs text-texto-suave">
              Lo esperado es 32 a 36 por parada, más lo que gasten los errores. Se cuenta desde la etapa 8 (17 de octubre de 2026).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
