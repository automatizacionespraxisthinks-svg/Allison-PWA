import Link from "next/link";
import { AsignarSaldo } from "@/components/admin/AsignarSaldo";
import { Filtros } from "@/components/admin/Filtros";
import { PanelColegios } from "@/components/admin/PanelColegios";
import { CargaAlumnos } from "@/components/CargaAlumnos";
import { colegios, paginaDeAdmin } from "@/lib/admin";
import { asignacionesAnteriores, colegiosConCursos } from "@/lib/panel/colegios";

const VISTAS = [
  { clave: "asignar", texto: "Asignar saldo" },
  { clave: "carga", texto: "Carga masiva de alumnos" },
  { clave: "convenios", texto: "Convenios" },
] as const;

/**
 * Colegios (plan, secciones 12 y 21; bocetos 4 y 4B): asignar saldo a un
 * colegio o a sus cursos, la carga masiva de alumnos con su curso y los
 * convenios.
 */
export default async function PaginaColegiosAdmin({ searchParams }: { searchParams: Promise<{ vista?: string; colegio?: string }> }) {
  await paginaDeAdmin();
  const p = await searchParams;
  const vista = VISTAS.find((v) => v.clave === p.vista)?.clave ?? "asignar";
  const conCursos = await colegiosConCursos();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Colegios</h1>
        <nav className="flex flex-wrap gap-1 rounded-xl bg-superficie-2 p-1 text-sm">
          {VISTAS.map((v) => (
            <Link
              key={v.clave}
              href={`/admin/colegios?vista=${v.clave}`}
              className={`rounded-lg px-3 py-1.5 font-medium ${vista === v.clave ? "bg-superficie shadow-sm" : "text-texto-suave"}`}
            >
              {v.texto}
            </Link>
          ))}
        </nav>
      </div>

      {vista === "asignar" && <Asignar colegios={conCursos} />}
      {vista === "carga" && <Carga colegios={conCursos} elegido={p.colegio} />}
      {vista === "convenios" && <PanelColegios colegios={await colegios()} />}
    </div>
  );
}

async function Asignar({ colegios }: { colegios: Awaited<ReturnType<typeof colegiosConCursos>> }) {
  const anteriores = await asignacionesAnteriores();
  const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", year: "numeric" });
  return (
    <>
      <AsignarSaldo colegios={colegios} />
      <section className="overflow-x-auto rounded-2xl border border-borde bg-superficie p-5">
        <h2 className="mb-3 font-bold">Asignaciones anteriores</h2>
        {anteriores.length ? (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-xs text-texto-suave">
                <th className="py-2 font-medium">Fecha</th>
                <th className="py-2 font-medium">Colegio</th>
                <th className="py-2 font-medium">Curso</th>
                <th className="py-2 text-right font-medium">Por alumno</th>
                <th className="py-2 text-right font-medium">Alumnos</th>
                <th className="py-2 font-medium">Motivo</th>
                <th className="py-2 font-medium">Hecha por</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {anteriores.map((x, i) => (
                <tr key={i} className="border-b border-borde/60 last:border-0">
                  <td className="py-2 whitespace-nowrap">{fecha(x.fecha)}</td>
                  <td className="py-2">{x.colegio}</td>
                  <td className="py-2">{x.cursos ?? "Todos"}</td>
                  <td className="py-2 text-right">{x.porAlumno.toLocaleString("es-CO")}</td>
                  <td className="py-2 text-right">{x.alumnos}</td>
                  <td className="py-2">{x.motivo}</td>
                  <td className="py-2">{x.hechaPor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-texto-suave">Todavía no hay asignaciones.</p>
        )}
      </section>
    </>
  );
}

function Carga({ colegios, elegido }: { colegios: Awaited<ReturnType<typeof colegiosConCursos>>; elegido?: string }) {
  const colegio = colegios.find((c) => c.id === elegido) ?? colegios[0];
  if (!colegio) return <p className="text-sm text-texto-suave">Todavía no hay colegios. Créalos en Convenios.</p>;
  return (
    <>
      <Filtros
        campos={[{ nombre: "colegio", etiqueta: "Colegio", opciones: colegios.map((c) => ({ valor: c.id, texto: `${c.nombre} · ${c.alumnos} alumnos` })) }]}
      />
      <CargaAlumnos key={colegio.id} codigoColegio={colegio.codigo} admin={{ institucionId: colegio.id, nombreColegio: colegio.nombre }} />
      <p className="text-xs text-texto-suave">
        Dos formas: un archivo por curso eligiendo el curso para todo el archivo, o un archivo de todo el colegio con la columna Curso (en ese
        caso es obligatoria). Si el alumno ya existe, se actualiza su curso sin crear otra cuenta. El curso también se cambia a mano en la ficha
        del alumno.
      </p>
    </>
  );
}
