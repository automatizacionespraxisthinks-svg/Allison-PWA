import Link from "next/link";
import { Filtros } from "@/components/admin/Filtros";
import { Grafica } from "@/components/admin/Grafica";
import { SelectorPeriodo } from "@/components/admin/SelectorPeriodo";
import { leerAjustes } from "@/lib/ajustes";
import { colegiosParaFiltro, consumoPorAlumno, cursosDe, POR_PAGINA, type Estado, type Orden } from "@/lib/panel/consumo";
import { PARTES } from "@/lib/panel/etiquetas";
import { pesos } from "@/lib/precios";
import { informeDeUso, resolverRango } from "@/lib/uso";
import { paginaDeAdmin } from "@/lib/admin";

type Busqueda = {
  periodo?: string;
  desde?: string;
  hasta?: string;
  q?: string;
  colegio?: string;
  curso?: string;
  estado?: string;
  orden?: string;
  pagina?: string;
};

/**
 * Uso e IA · consumo por estudiante (plan, secciones 16 y 21; boceto 2):
 * todos los estudiantes con buscador, filtros por colegio, curso y
 * periodo, el consumo separado por las partes de la app, el saldo, las
 * alertas y la descarga en CSV. Aparte, la vigilancia de los que no
 * tienen saldo y los que están en prueba gratis.
 */
export default async function PaginaUso({ searchParams }: { searchParams: Promise<Busqueda> }) {
  await paginaDeAdmin();
  const p = await searchParams;
  const rango = resolverRango(p.periodo, p.desde, p.hasta);
  const estado: Estado = p.estado === "sin-saldo" || p.estado === "prueba" ? p.estado : "todos";
  const orden = (["intervenciones", "costo", "saldo", "nombre", "inactivos"] as const).find((o) => o === p.orden) ?? "intervenciones";
  const pagina = Math.max(1, Number(p.pagina) || 1);
  const colegio = p.colegio ?? "todos";
  const deUnColegio = colegio !== "todos" && colegio !== "particulares";

  const [a, colegios, cursos] = await Promise.all([leerAjustes(), colegiosParaFiltro(), deUnColegio ? cursosDe(colegio) : Promise.resolve([])]);
  const [c, informe] = await Promise.all([
    consumoPorAlumno({ rango, q: p.q, colegio, curso: p.curso, estado, orden, pagina }, a.dolarCop),
    informeDeUso(rango, a.dolarCop),
  ]);

  const miles = (v: number) => v.toLocaleString("es-CO");
  // Los filtros de ahora, para los enlaces (periodo, páginas, orden, CSV).
  const consulta = (cambios: Partial<Busqueda>, sin: (keyof Busqueda)[] = []) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...p, ...cambios })) if (v && !sin.includes(k as keyof Busqueda)) q.set(k, String(v));
    return q.toString();
  };
  const sinPeriodo = consulta({}, ["periodo", "desde", "hasta", "pagina"]);
  const paginas = Math.max(1, Math.ceil(c.total / POR_PAGINA));
  const sumaPartes = PARTES.reduce((s, x) => s + (c.porParte[x.clave] ?? 0), 0);
  const otras = Math.max(0, c.totales.intervenciones - sumaPartes);

  const tarjeta = (titulo: string, valor: string, nota: string) => (
    <div className="rounded-2xl border border-borde bg-superficie p-4">
      <p className="text-xs font-medium text-texto-suave">{titulo}</p>
      <p className="mt-1 text-2xl leading-none font-bold tabular-nums">{valor}</p>
      <p className="mt-1.5 text-xs text-texto-suave">{nota}</p>
    </div>
  );
  const cabecera = (texto: string, o: Orden, derecha = true) => (
    <th className={`py-2 font-medium ${derecha ? "text-right" : ""}`}>
      <Link href={`/admin/uso?${consulta({ orden: o }, ["pagina"])}`} className={orden === o ? "text-texto underline" : "hover:underline"}>
        {texto}
      </Link>
    </th>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Consumo por estudiante</h1>
          <p className="text-sm text-texto-suave">
            {rango.etiqueta} · del {rango.desde} al {rango.hasta}
          </p>
        </div>
        <a
          href={`/api/admin/uso/csv?${consulta({}, ["pagina"])}`}
          className="rounded-xl border border-borde bg-superficie px-4 py-2 text-sm font-semibold hover:bg-superficie-2"
        >
          Descargar CSV
        </a>
      </div>

      <Filtros
        campos={[
          { nombre: "q", etiqueta: "Alumno", tipo: "texto" },
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
                  opciones: [
                    { valor: "", texto: "Todos" },
                    ...cursos.map((x) => ({ valor: x.curso ?? "(sin curso)", texto: `${x.curso ?? "Sin curso"} · ${x.alumnos}` })),
                  ],
                },
              ]
            : []),
        ]}
      />
      <SelectorPeriodo activo={p.periodo ?? "mes"} desde={rango.desde} hasta={rango.hasta} conservar={sinPeriodo} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tarjeta("Intervenciones", miles(c.totales.intervenciones), `${miles(c.totales.alumnos)} alumnos las usaron`)}
        {tarjeta(
          "Tokens",
          miles(c.totales.tokensEntrada + c.totales.tokensSalida),
          `entrada ${miles(c.totales.tokensEntrada)} · salida ${miles(c.totales.tokensSalida)}`
        )}
        {tarjeta(
          "Costo de IA",
          pesos(c.totales.costoCop),
          c.totales.intervenciones ? `${pesos(c.totales.costoCop / c.totales.intervenciones)} por intervención` : "Sin uso en el periodo"
        )}
        {tarjeta(
          "Promedio por alumno",
          c.totales.alumnos ? miles(Math.round(c.totales.intervenciones / c.totales.alumnos)) : "0",
          "intervenciones, entre los que usaron"
        )}
      </div>

      {c.totales.intervenciones > 0 && (
        <section className="rounded-2xl border border-borde bg-superficie p-4">
          <p className="mb-2 text-xs font-medium text-texto-suave">Por parte de la app</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-superficie-2">
            {PARTES.map((x) =>
              c.porParte[x.clave] ? (
                <span key={x.clave} style={{ width: `${(100 * c.porParte[x.clave]) / c.totales.intervenciones}%`, background: x.color }} />
              ) : null
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
            {PARTES.map((x) => (
              <li key={x.clave} className="flex items-center gap-1.5">
                <i className="size-2.5 rounded-full" style={{ background: x.color }} />
                {x.nombre}: <b className="text-texto tabular-nums">{miles(c.porParte[x.clave] ?? 0)}</b>
              </li>
            ))}
            {otras > 0 && <li>Sin separar (antes de la medición por partes): {miles(otras)}</li>}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(
          [
            ["todos", `Todos · ${c.cuentas.todos}`],
            ["sin-saldo", `Sin saldo · ${c.cuentas.sinSaldo}`],
            ["prueba", `Prueba gratis · ${c.cuentas.prueba}`],
          ] as const
        ).map(([e, texto]) => (
          <Link
            key={e}
            href={`/admin/uso?${consulta({ estado: e === "todos" ? undefined : e }, ["pagina", ...(e === "todos" ? (["estado"] as const) : [])])}`}
            className={`rounded-full border px-3 py-1.5 font-medium ${
              estado === e ? "border-primario bg-primario text-white" : "border-borde text-texto-suave hover:bg-superficie-2"
            }`}
          >
            {texto}
          </Link>
        ))}
        {estado === "prueba" && (
          <span className="text-xs text-texto-suave">
            La prueba gratis es de 5 intervenciones. Un alumno que paga no puede costar más de lo que paga; por eso se vigila a estos grupos.
          </span>
        )}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-xs text-texto-suave">
              <th className="px-4 py-2 font-medium">
                <Link href={`/admin/uso?${consulta({ orden: "nombre" }, ["pagina"])}`} className={orden === "nombre" ? "text-texto underline" : "hover:underline"}>
                  Alumno
                </Link>
              </th>
              {cabecera("Intervenciones", "intervenciones")}
              <th className="py-2 font-medium">Por tipo</th>
              <th className="py-2 text-right font-medium">Tokens</th>
              {cabecera("Costo IA", "costo")}
              {cabecera("Saldo", "saldo")}
              <th className="px-4 py-2 font-medium">
                <Link
                  href={`/admin/uso?${consulta({ orden: "inactivos" }, ["pagina"])}`}
                  className={orden === "inactivos" ? "text-texto underline" : "hover:underline"}
                >
                  Alertas
                </Link>
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {c.filas.map((f) => (
              <tr key={f.id} className="border-b border-borde/60 align-top last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/admin/usuarios/${f.id}`} className="font-medium hover:underline">
                    {f.nombre}
                  </Link>
                  <span className="block text-[11px] text-texto-suave">
                    {[f.colegio ?? "Particular", f.curso, f.vaEn].filter(Boolean).join(" · ")}
                  </span>
                </td>
                <td className="py-2 text-right">{miles(f.intervenciones)}</td>
                <td className="py-2">
                  {f.intervenciones > 0 && (
                    <span
                      className="flex h-2 w-28 overflow-hidden rounded-full bg-superficie-2"
                      title={PARTES.map((x) => `${x.nombre}: ${f.porParte[x.clave] ?? 0}`).join(" · ")}
                    >
                      {PARTES.map((x) =>
                        f.porParte[x.clave] ? (
                          <span key={x.clave} style={{ width: `${(100 * f.porParte[x.clave]) / f.intervenciones}%`, background: x.color }} />
                        ) : null
                      )}
                    </span>
                  )}
                </td>
                <td className="py-2 text-right">{miles(f.tokensEntrada + f.tokensSalida)}</td>
                <td className="py-2 text-right">{pesos(f.costoCop)}</td>
                <td className={`py-2 text-right ${f.saldo === 0 ? "font-semibold text-acento" : ""}`}>{miles(f.saldo)}</td>
                <td className="px-4 py-2 text-xs">
                  <span className="flex flex-wrap gap-1">
                    {f.saldo === 0 && <span className="rounded-full bg-acento/10 px-2 py-0.5 text-acento">Sin saldo</span>}
                    {f.enPrueba && <span className="rounded-full bg-primario-suave px-2 py-0.5 text-primario">Prueba gratis</span>}
                    {f.diasSinActividad === null ? (
                      <span className="rounded-full bg-superficie-2 px-2 py-0.5 text-texto-suave">Nunca practicó</span>
                    ) : (
                      f.diasSinActividad >= a.alertaInactivoDias && (
                        <span className="rounded-full bg-superficie-2 px-2 py-0.5 text-texto-suave">Sin actividad hace {f.diasSinActividad} días</span>
                      )
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {!c.filas.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-texto-suave">
                  Ningún estudiante con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {paginas > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && (
            <Link href={`/admin/uso?${consulta({ pagina: String(pagina - 1) })}`} className="rounded-lg border border-borde px-3 py-1.5">
              Anterior
            </Link>
          )}
          <span className="text-texto-suave">
            Página {pagina} de {paginas} · {miles(c.total)} estudiantes
          </span>
          {pagina < paginas && (
            <Link href={`/admin/uso?${consulta({ pagina: String(pagina + 1) })}`} className="rounded-lg border border-borde px-3 py-1.5">
              Siguiente
            </Link>
          )}
        </nav>
      )}

      <section className="rounded-2xl border border-borde bg-superficie p-5">
        <h2 className="font-bold">Evolución de toda la plataforma</h2>
        <p className="mb-3 text-xs text-texto-suave">{rango.granularidad === "mes" ? "Por mes en el periodo" : "Por día en el periodo"}</p>
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-texto-suave">Intervenciones</p>
            <Grafica barras={informe.serie.map((x) => ({ etiqueta: x.etiqueta, valor: x.turnos, detalle: `${x.conversaciones} conversaciones` }))} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-texto-suave">Costo de IA</p>
            <Grafica barras={informe.serie.map((x) => ({ etiqueta: x.etiqueta, valor: x.costoCop, detalle: pesos(x.costoCop) }))} />
          </div>
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-texto-suave">
        Las cifras se acumulan por día en hora de Colombia y sobreviven al borrado de conversaciones a los 20 días; existen desde el 28 de
        agosto de 2026. El costo usa el dólar a {pesos(a.dolarCop)} (Ajustes) y solo cuenta los tokens del modelo de conversación: la voz va
        aparte.
      </p>
    </div>
  );
}
