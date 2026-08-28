import Link from "next/link";
import { Conversacion } from "@/components/Conversacion";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaPracticar() {
  const alumno = await alumnoActual();

  if (!alumno) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Falta crear el alumno de prueba</h1>
        <p className="text-texto-suave">
          Corre <code className="rounded bg-superficie-2 px-1.5 py-0.5">npm run sembrar</code>{" "}
          en la terminal y recarga esta página.
        </p>
        <Link href="/" className="text-primario underline">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <Conversacion
      nivel={alumno.nivel}
      mensajesIniciales={alumno.mensajesPlan + alumno.mensajesRecarga}
    />
  );
}
