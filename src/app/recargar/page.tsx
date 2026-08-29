import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioRecarga } from "@/components/FormularioRecarga";
import { pasarela } from "@/lib/pasarela";
import { configPrecios } from "@/lib/precios";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaRecargar() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const saldo = alumno.mensajesPlan + alumno.mensajesRecarga;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 py-5">
      <header className="flex items-center justify-between">
        <Link href="/practicar" className="text-sm text-texto-suave">
          ← Volver
        </Link>
        <span className="text-sm text-texto-suave">
          Tienes {saldo} {saldo === 1 ? "intervención" : "intervenciones"}
        </span>
      </header>

      <div>
        <h1 className="text-2xl font-bold">Recarga y sigue hablando</h1>
        <p className="mt-1 text-texto-suave">
          Paga solo lo que vas a usar. No caducan nunca.
        </p>
      </div>

      {pasarela().simulada && (
        <p className="rounded-xl border border-acento/40 bg-acento/10 p-3 text-sm text-acento">
          <strong>Modo de prueba.</strong> La pasarela real todavía no está
          conectada: no se cobra dinero.
        </p>
      )}

      <FormularioRecarga cfg={configPrecios()} />

      <Link
        href="/planes"
        className="rounded-xl border border-borde bg-superficie p-4 text-center text-sm transition hover:bg-superficie-2"
      >
        ¿Practicas todos los días? <strong className="text-primario">Mira los planes</strong>
      </Link>
    </main>
  );
}
