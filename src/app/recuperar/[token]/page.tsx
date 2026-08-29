import Link from "next/link";
import { FormularioClaveNueva } from "@/components/FormularioClaveNueva";
import { tokenValido } from "@/lib/recuperacion";

export default async function PaginaClaveNueva({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Se comprueba ANTES de mostrar el formulario: pedirle una contraseña
  // nueva y solo después decirle que el enlace venció es hacerle perder
  // el tiempo sin razón.
  if (!(await tokenValido(token))) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-6xl" aria-hidden>
          ⌛
        </span>
        <h1 className="text-2xl font-bold">Este enlace ya no sirve</h1>
        <p className="text-texto-suave">
          Los enlaces vencen en una hora y solo se pueden usar una vez. Pide uno
          nuevo.
        </p>
        <Link
          href="/recuperar"
          className="rounded-2xl bg-primario px-8 py-4 text-lg font-semibold text-white"
        >
          Pedir otro enlace
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Pon una contraseña nueva</h1>
        <p className="mt-1 text-texto-suave">
          Al cambiarla se cierran las sesiones abiertas en otros dispositivos.
        </p>
      </div>
      <FormularioClaveNueva token={token} />
    </main>
  );
}
