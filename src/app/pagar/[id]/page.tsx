import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfirmarPago } from "@/components/ConfirmarPago";
import { PagoSimulado } from "@/components/PagoSimulado";
import { sql } from "@/lib/db";
import { pasarela } from "@/lib/pasarela";
import { pesos } from "@/lib/precios";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaPagar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const [t] = await sql`
    select id, monto_cop, mensajes_otorgados, tipo, estado
      from transacciones
     where id = ${id} and user_id = ${alumno.id}
     limit 1
  `;
  if (!t) notFound();

  const { simulada } = pasarela();

  if (t.estado === "aprobada") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-6xl" aria-hidden>🎉</span>
        <h1 className="text-2xl font-bold">¡Listo!</h1>
        <p className="text-texto-suave">
          Te acreditamos {t.mensajes_otorgados} intervenciones.
        </p>
        <Link
          href="/practicar"
          className="rounded-2xl bg-primario px-8 py-4 text-lg font-semibold text-white"
        >
          Hablar con Allison
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="rounded-3xl border border-borde bg-superficie p-6">
        <h1 className="text-lg font-semibold">
          {simulada ? "Confirmar pago" : "Tu pago"}
        </h1>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-texto-suave">Concepto</dt>
            <dd className="font-medium">
              {t.tipo === "plan" ? "Plan" : "Recarga"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-texto-suave">Intervenciones</dt>
            <dd className="font-medium tabular-nums">{t.mensajes_otorgados}</dd>
          </div>
          <div className="flex justify-between border-t border-borde pt-2">
            <dt className="text-texto-suave">Total</dt>
            <dd className="text-xl font-bold tabular-nums">{pesos(t.monto_cop)}</dd>
          </div>
        </dl>
      </div>

      {simulada ? (
        <PagoSimulado transaccionId={t.id} />
      ) : (
        // Aquí vuelve el alumno después de pagar en la pasarela.
        <ConfirmarPago
          transaccionId={t.id}
          volverA={t.tipo === "plan" ? "/planes" : "/recargar"}
        />
      )}

      {simulada && (
        <Link href="/recargar" className="text-center text-sm text-texto-suave">
          Cancelar
        </Link>
      )}
    </main>
  );
}
