import Image from "next/image";
import Link from "next/link";

export default function PaginaInicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="relative size-32 overflow-hidden rounded-full border-4 border-borde bg-primario-suave">
        <Image
          src="/allison.png"
          alt="Allison"
          fill
          sizes="128px"
          className="object-cover"
          priority
        />
      </div>

      <div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Aprende inglés <span className="text-primario">hablando</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-texto-suave">
          Allison te escucha, te corrige la pronunciación y conversa contigo
          sobre lo que quieras. En tu nivel, a tu ritmo.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/registro"
          className="rounded-xl bg-primario px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:brightness-110 active:scale-95"
        >
          Empezar a hablar
        </Link>
        <p className="text-sm text-texto-suave">Prueba gratis, sin tarjeta</p>
        <p className="text-sm text-texto-suave">
          ¿Ya tienes cuenta?{" "}
          <Link href="/entrar" className="font-medium text-primario underline">
            Entrar
          </Link>
        </p>
      </div>
      <footer className="mt-4 flex gap-4 text-xs text-texto-suave">
        <Link href="/legal/terminos" className="underline">
          Términos
        </Link>
        <Link href="/legal/privacidad" className="underline">
          Política de datos
        </Link>
      </footer>
    </main>
  );
}
