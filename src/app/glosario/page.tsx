import Link from "next/link";
import { redirect } from "next/navigation";
import { Glosario } from "@/components/Glosario";
import { entradasDe } from "@/lib/glosario";
import { alumnoActual } from "@/lib/sesion";

/**
 * El glosario, con acceso propio desde el menú.
 *
 * Se lee completo de una vez: son palabras y frases cortas, y el tope
 * por alumno (src/lib/frases.ts) lo mantiene en un tamaño que cabe en
 * una pantalla sin paginar.
 */
export default async function PaginaGlosario() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const entradas = await entradasDe(alumno.id);

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

      {/* El contador vive dentro del componente: cambia al guardar o
          quitar, y un número pintado aquí se quedaría viejo. */}
      <Glosario iniciales={entradas} nivel={alumno.nivel} />
    </main>
  );
}
