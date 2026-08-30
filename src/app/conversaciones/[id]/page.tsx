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
        {c.resumen.leccion && (
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primario-suave px-2 py-0.5 text-xs font-semibold text-primario">
            <span aria-hidden>🎯</span> {c.resumen.leccion}
          </p>
        )}
      </header>

      <Transcripcion
        nivel={c.resumen.nivel}
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
