import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Transcripcion } from "@/components/Transcripcion";
import { conversacionDe } from "@/lib/conversaciones";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaConversacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const { id } = await params;
  const c = await conversacionDe(alumno.id, id);
  if (!c) notFound();

  const fecha = new Date(c.resumen.iniciadaEn).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-4 py-5">
      <header>
        <Link href="/conversaciones" className="text-sm text-texto-suave">
          ← Todas tus conversaciones
        </Link>
        <h1 className="mt-2 text-lg font-bold">{fecha}</h1>
        <p className="text-sm text-texto-suave">
          Nivel {c.resumen.nivel} · {c.resumen.mensajes} mensajes
          {c.resumen.correcciones > 0 && ` · ${c.resumen.correcciones} correcciones`}
        </p>
      </header>

      <Transcripcion
        mensajes={c.mensajes.map((m) => ({
          id: m.id,
          rol: m.rol,
          texto: m.texto,
          correcciones: m.correcciones,
          creadoEn: m.creadoEn,
        }))}
      />
    </main>
  );
}
