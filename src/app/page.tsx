import Link from "next/link";

export default function PaginaInicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div
        role="img"
        aria-label="Allison"
        className="size-32 rounded-full border-4 border-borde bg-primario-suave bg-cover bg-center"
        style={{ backgroundImage: "url('/allison.jpg')" }}
      />

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
          href="/practicar"
          className="rounded-xl bg-primario px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:brightness-110 active:scale-95"
        >
          Empezar a hablar
        </Link>
        <p className="text-sm text-texto-suave">
          20 mensajes gratis, sin tarjeta
        </p>
      </div>
    </main>
  );
}
