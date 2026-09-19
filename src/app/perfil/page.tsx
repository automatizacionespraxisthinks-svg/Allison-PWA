import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioPerfil } from "@/components/FormularioPerfil";
import { perfilDe } from "@/lib/perfil";
import { alumnoActual } from "@/lib/sesion";

/** Lo que el alumno dio al registrarse, a la vista y editable. */
export default async function PaginaPerfil() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const perfil = await perfilDe(alumno.id);
  if (!perfil) redirect("/entrar");

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 py-5">
      <header className="flex items-center justify-between">
        <Link href="/practicar" className="text-sm text-texto-suave">
          ← Volver
        </Link>
        <Link
          href="/practicar"
          className="rounded-full bg-primario px-5 py-2.5 text-sm font-semibold text-white"
        >
          Practicar
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-bold">Tu perfil</h1>
        <p className="mt-1 text-texto-suave">
          Lo que sabemos de ti. Cámbialo cuando quieras.
        </p>
      </div>

      <FormularioPerfil perfil={perfil} />
    </main>
  );
}
