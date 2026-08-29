import Link from "next/link";
import { redirect } from "next/navigation";
import { ListaConversaciones } from "@/components/ListaConversaciones";
import { conversacionesDe } from "@/lib/conversaciones";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaConversaciones() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const conversaciones = await conversacionesDe(alumno.id);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 py-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tus conversaciones</h1>
        <Link
          href="/practicar"
          className="rounded-full bg-primario px-5 py-2.5 text-sm font-semibold text-white"
        >
          Practicar
        </Link>
      </header>

      {conversaciones.length === 0 ? (
        <div className="rounded-2xl border border-borde bg-superficie p-8 text-center">
          <p className="font-medium">Todavía no has hablado con Allison.</p>
          <Link
            href="/practicar"
            className="mt-4 inline-block rounded-xl bg-primario px-6 py-2.5 font-semibold text-white"
          >
            Empezar
          </Link>
        </div>
      ) : (
        <ListaConversaciones conversaciones={conversaciones} />
      )}
    </main>
  );
}
