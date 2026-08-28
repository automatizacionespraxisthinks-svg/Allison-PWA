import Link from "next/link";
import { canjearVerificacion, PRUEBA_AL_VERIFICAR } from "@/lib/verificacion";

export default async function PaginaVerificar({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const userId = await canjearVerificacion(token);

  if (!userId) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-6xl" aria-hidden>⌛</span>
        <h1 className="text-2xl font-bold">Este enlace ya no sirve</h1>
        <p className="text-texto-suave">
          Puede que ya lo hayas usado o que hayan pasado más de 48 horas.
          Entra a tu cuenta y pide uno nuevo.
        </p>
        <Link
          href="/entrar"
          className="rounded-2xl bg-primario px-8 py-4 text-lg font-semibold text-white"
        >
          Entrar
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="text-6xl" aria-hidden>🎉</span>
      <h1 className="text-2xl font-bold">¡Correo confirmado!</h1>
      <p className="text-texto-suave">
        Te acabamos de dar {PRUEBA_AL_VERIFICAR} mensajes más para que sigas
        practicando con Allison.
      </p>
      <Link
        href="/practicar"
        className="rounded-2xl bg-primario px-8 py-4 text-lg font-semibold text-white"
      >
        Seguir hablando
      </Link>
    </main>
  );
}
