import Link from "next/link";
import { Filtros } from "@/components/admin/Filtros";
import { leerAjustes } from "@/lib/ajustes";
import { colegiosParaFiltro, cursosDe } from "@/lib/panel/consumo";
import { embudoDeRuta } from "@/lib/panel/ruta";
import { rutaDe } from "@/lib/ruta/index";
import { NIVELES, type Nivel } from "@/lib/tipos";
import { paginaDeAdmin } from "@/lib/admin";

/**
 * Ruta (plan, sección 21; boceto 6): cuántos alumnos llegan a cada paso
 * de una parada, en qué actividad se van, cuánto aciertan al primer
 * intento y las conversaciones con IA que no llegan a su mínimo.
 */
export default async function PaginaRutaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; parada?: string; colegio?: string; curso?: string; desde?: string }>;
}) {
  await paginaDeAdmin();
  const p = await searchParams;
  const conRuta = NIVELES.map((n) => n.nivel).filter((n) => rutaDe(n));
  const nivel = (conRuta.find((n) => n === p.nivel) ?? conRuta[0]) as Nivel;
  const deUnColegio = !!p.colegio && p.colegio !== "todos" && p.colegio !== "particulares";
  const [a, colegios, cursos] = await Promise.all([leerAjustes(), colegiosParaFiltro(), deUnColegio ? cursosDe(p.colegio!) : Promise.resolve([])]);
  const e = await embudoDeRuta({ nivel, parada: p.parada, colegio: p.colegio, curso: p.curso, desde: p.desde }, a.alertaParadaIntervenciones);
  if (!e) return <p className="text-sm text-texto-suave">Ese nivel todavía no tiene ruta escrita.</p>;

  const maximo = Math.max(1, ...e.pasos.map((x) => x.alumnos));
  const peorActividad = [...e.actividades].sort((x, y) => y.seVan - x.seVan)[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold">
          Avance en {e.nivel} · {e.paradas.find((x) => x.clave === e.parada)?.nombre}
        </h1>
        <Filtros
          campos={[
            { nombre: "nivel", etiqueta: "Nivel", borra: ["parada"], opciones: conRuta.map((n) => ({ valor: n, texto: n })) },
            { nombre: "parada", etiqueta: "Parada", opciones: e.paradas.map((x) => ({ valor: x.clave, texto: x.nombre })) },
            {
              nombre: "colegio",
              etiqueta: "Colegio",
              borra: ["curso"],
              opciones: [
                { valor: "todos", texto: "Todos" },
                { valor: "particulares", texto: "Particulares" },
                ...colegios.map((x) => ({ valor: x.id, texto: x.nombre })),
              ],
            },
            ...(deUnColegio
              ? [
                  {
                    nombre: "curso",
                    etiqueta: "Curso",
                    opciones: [{ valor: "", texto: "Todos" }, ...cursos.map((x) => ({ valor: x.curso ?? "(sin curso)", texto: x.curso ?? "Sin curso" }))],
                  },
                ]
              : []),
            { nombre: "desde", etiqueta: "Desde", tipo: "fecha" as const },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="mb-3 font-bold">Cuántos llegan a cada paso</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {e.pasos.map((x) => (
              <li key={x.nombre} className="grid grid-cols-[150px_1fr_48px] items-center gap-2">
                <span>{x.nombre}</span>
                <span className="h-3 overflow-hidden rounded-full bg-superficie-2">
                  <span className="block h-full rounded-full bg-primario" style={{ width: `${(100 * x.alumnos) / maximo}%` }} />
                </span>
                <b className="text-right tabular-nums">{x.alumnos}</b>
              </li>
            ))}
          </ul>
          {e.mayorCaida && (
            <p className="mt-3 text-sm font-semibold text-acento">
              La mayor caída: {e.mayorCaida.paso.toLowerCase()} (−{e.mayorCaida.pct} %)
            </p>
          )}
        </section>

        <section className="overflow-x-auto rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="mb-1 font-bold">Por actividad</h2>
          <p className="mb-3 text-xs text-texto-suave">
            «Se van aquí»: dejaron la lección en esa actividad y no avanzan en la ruta hace 3 días o más.
          </p>
          <table className="w-full min-w-[380px] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-xs text-texto-suave">
                <th className="py-2 font-medium">Actividad</th>
                <th className="py-2 text-right font-medium">Se van aquí</th>
                <th className="py-2 text-right font-medium">Aciertan al 1.º intento</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {e.actividades.map((x) => (
                <tr
                  key={`${x.leccion}-${x.paso}`}
                  className={`border-b border-borde/60 last:border-0 ${peorActividad?.seVan && x === peorActividad ? "bg-acento/5" : ""}`}
                >
                  <td className="py-1.5">
                    <span className="text-texto-suave">L{x.leccion} · </span>
                    {x.nombre}
                  </td>
                  <td className={`py-1.5 text-right ${x.seVan ? "font-semibold" : "text-texto-suave"}`}>{x.seVan}</td>
                  <td className="py-1.5 text-right">{x.primerIntento === null ? <span className="text-texto-suave">—</span> : `${x.primerIntento} %`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-borde bg-superficie p-5">
        <h2 className="mb-1 font-bold">Conversaciones que no llegan a su mínimo</h2>
        <p className="mb-3 text-xs text-texto-suave">
          Escenarios, entrevistas, viajes y escenarios del catálogo (mínimo 10 intervenciones). Si muchos se van antes, esa conversación está muy
          difícil o poco clara.
        </p>
        {e.conversaciones.length ? (
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-xs text-texto-suave">
                <th className="py-2 font-medium">Conversación</th>
                <th className="py-2 text-right font-medium">Empezaron</th>
                <th className="py-2 text-right font-medium">Se fueron antes</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {e.conversaciones.map((c) => (
                <tr key={c.etiqueta} className="border-b border-borde/60 last:border-0">
                  <td className="py-1.5">{c.etiqueta}</td>
                  <td className="py-1.5 text-right">{c.empezaron}</td>
                  <td className={`py-1.5 text-right ${c.pct >= 20 ? "font-semibold text-acento" : ""}`}>
                    {c.antes} ({c.pct} %)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-texto-suave">Todavía no hay conversaciones con estos filtros.</p>
        )}
      </section>

      <section className="rounded-2xl border border-borde bg-superficie p-5">
        <h2 className="mb-1 font-bold">Gastan de más en esta parada</h2>
        <p className="mb-3 text-xs text-texto-suave">
          Más de {a.alertaParadaIntervenciones} intervenciones (se cambia en Ajustes). Lo esperado es 32 a 36, más lo que gasten los errores.
        </p>
        {e.gastanDeMas.length ? (
          <ul className="flex flex-col gap-1 text-sm">
            {e.gastanDeMas.map((g) => (
              <li key={g.id}>
                <Link href={`/admin/usuarios/${g.id}`} className="font-medium underline">
                  {g.nombre}
                </Link>{" "}
                · {g.intervenciones} intervenciones ({g.porErrores} por errores)
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-texto-suave">Nadie, por ahora.</p>
        )}
      </section>
    </div>
  );
}
