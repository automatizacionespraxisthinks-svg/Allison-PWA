import Link from "next/link";
import { redirect } from "next/navigation";
import { TablaAlumnos } from "@/components/TablaAlumnos";
import { resumenDe } from "@/lib/colegio";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaColegio() {
  const usuario = await alumnoActual();
  if (!usuario) redirect("/entrar");

  // El panel es solo del coordinador. Un estudiante que escriba la URL
  // a mano se va a su pantalla de práctica.
  if (usuario.rol !== "coordinador" && usuario.rol !== "admin") {
    redirect("/practicar");
  }
  if (!usuario.institucionId) redirect("/practicar");

  const r = await resumenDe(usuario.institucionId);
  if (!r) redirect("/practicar");

  const sinPracticar = r.totalAlumnos - r.practicaronSemana;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-5 px-4 py-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{r.nombre}</h1>
          <p className="text-sm text-texto-suave">
            Código de acceso:{" "}
            <span className="font-mono font-semibold tracking-wider text-texto">
              {r.codigoAcceso}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/colegio/importar"
            className="rounded-full bg-primario px-4 py-2 text-sm font-semibold text-white"
          >
            Cargar alumnos
          </Link>
          <Link href="/practicar" className="text-sm text-texto-suave underline">
            Ir a practicar
          </Link>
        </div>
      </header>

      {/* Lo primero es a cuántos hay que empujar, no cuántos van bien */}
      <section
        className={`rounded-3xl border-2 p-6 ${
          sinPracticar > 0
            ? "border-acento/40 bg-acento/5"
            : "border-exito/40 bg-exito/5"
        }`}
      >
        {sinPracticar > 0 ? (
          <>
            <p className="text-4xl font-bold leading-none tabular-nums text-acento">
              {sinPracticar}
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              {sinPracticar === 1
                ? "alumno no ha practicado esta semana"
                : "alumnos no han practicado esta semana"}
            </h2>
            <p className="mt-1 text-[15px] text-texto-suave">
              Están de primeros en la lista.
              {r.nuncaEntraron > 0 &&
                ` ${r.nuncaEntraron} nunca han entrado: revisa que tengan su usuario y su PIN.`}
            </p>
          </>
        ) : (
          <>
            <p className="text-4xl leading-none" aria-hidden>
              🎉
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Todos practicaron esta semana
            </h2>
          </>
        )}
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { valor: r.totalAlumnos, etiqueta: "alumnos" },
          { valor: r.practicaronSemana, etiqueta: "activos esta semana" },
          { valor: r.mensajesSemana, etiqueta: "mensajes esta semana" },
        ].map((c) => (
          <div
            key={c.etiqueta}
            className="rounded-2xl border border-borde bg-superficie px-2 py-4 text-center"
          >
            <p className="text-2xl font-bold tabular-nums">{c.valor}</p>
            <p className="mt-0.5 text-xs leading-tight text-texto-suave">
              {c.etiqueta}
            </p>
          </div>
        ))}
      </section>

      <TablaAlumnos alumnos={r.alumnos} />

      <p className="rounded-2xl border border-borde bg-superficie p-4 text-sm text-texto-suave">
        Puedes ver cuánto practica cada alumno y reiniciarle el PIN si lo
        olvida. <strong className="text-texto">No puedes ver sus conversaciones</strong> —
        son privadas, y la mayoría son menores de edad.
      </p>
    </main>
  );
}
