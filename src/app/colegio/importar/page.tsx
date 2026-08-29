import Link from "next/link";
import { redirect } from "next/navigation";
import { CargaAlumnos } from "@/components/CargaAlumnos";
import { sql } from "@/lib/db";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaImportar() {
  const usuario = await alumnoActual();
  if (!usuario) redirect("/entrar");
  if (usuario.rol !== "coordinador" && usuario.rol !== "admin") redirect("/practicar");
  if (!usuario.institucionId) redirect("/practicar");

  const [colegio] = await sql`
    select nombre, codigo_acceso from instituciones where id = ${usuario.institucionId}
  `;
  if (!colegio) redirect("/practicar");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 px-4 py-5">
      <header>
        <Link href="/colegio" className="text-sm text-texto-suave">
          ← Volver al panel
        </Link>
        <h1 className="mt-2 text-xl font-bold">Cargar alumnos</h1>
        <p className="text-sm text-texto-suave">{colegio.nombre}</p>
      </header>

      <CargaAlumnos codigoColegio={colegio.codigo_acceso} />
    </main>
  );
}
