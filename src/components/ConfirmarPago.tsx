"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { pedir } from "@/lib/pedir";

/** Cada cuánto se pregunta, y cuántas veces antes de dejar de insistir. */
const INTERVALO_MS = 4_000;
const INTENTOS = 30;

/**
 * La espera al volver de pagar.
 *
 * El aviso de la pasarela puede llegar después que el alumno (con Bold,
 * hasta 10 minutos después). Sin esta pantalla, alguien que acaba de
 * pagar no vería su saldo y podría pagar otra vez. Pregunta cada pocos
 * segundos; el servidor, a su vez, le pregunta a la pasarela.
 *
 * Nunca afirma lo que no sabe: si pasan dos minutos sin respuesta, no
 * dice "rechazado" sino que el pago puede tardar, y que se acredita
 * solo cuando llegue.
 */
export function ConfirmarPago({
  transaccionId,
  volverA,
}: {
  transaccionId: string;
  /** Adónde ir a intentarlo otra vez: planes o recargas. */
  volverA: string;
}) {
  const router = useRouter();
  const [fase, setFase] = useState<"confirmando" | "rechazada" | "demorada">(
    "confirmando"
  );

  useEffect(() => {
    let activo = true;
    let intento = 0;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    async function preguntar() {
      intento++;
      const r = await pedir("/api/pagos/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaccionId }),
      });
      const datos = r?.ok
        ? ((await r.json().catch(() => null)) as { estado?: string } | null)
        : null;
      if (!activo) return;

      if (datos?.estado === "aprobada") {
        // La página del servidor ya sabe mostrar la orden aprobada.
        router.refresh();
        return;
      }
      if (datos?.estado === "rechazada") {
        setFase("rechazada");
        return;
      }
      if (intento >= INTENTOS) {
        setFase("demorada");
        return;
      }
      // Sin red o todavía pendiente: se vuelve a preguntar.
      temporizador = setTimeout(preguntar, INTERVALO_MS);
    }

    preguntar();
    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [transaccionId, router]);

  if (fase === "rechazada") {
    return (
      <div className="flex flex-col gap-3 text-center">
        {/* No se promete "no te cobramos": con Bold el alumno pudo
            reintentar en el mismo link, y ese pago estar en proceso. */}
        <p role="alert" className="rounded-xl bg-error/10 p-4 text-error">
          El pago no se completó. Si tu banco muestra un cobro, no pagues
          otra vez: se acredita solo en cuanto se confirme.
        </p>
        <Link
          href={volverA}
          className="rounded-2xl bg-primario px-6 py-4 text-lg font-semibold text-white"
        >
          Intentar de nuevo
        </Link>
      </div>
    );
  }

  if (fase === "demorada") {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="rounded-xl border border-borde bg-superficie p-4 text-texto-suave">
          Tu pago todavía no se confirma. Algunos medios tardan unos
          minutos: <strong>si ya pagaste, las intervenciones se acreditan
          solas</strong> en cuanto llegue la confirmación. No pagues otra vez.
        </p>
        <Link
          href="/practicar"
          className="rounded-2xl bg-primario px-6 py-4 text-lg font-semibold text-white"
        >
          Seguir practicando
        </Link>
      </div>
    );
  }

  // Las mismas barras de onda de Cargando, en línea.
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-8 items-center gap-1.5" aria-hidden>
        {[14, 22, 30, 22, 14].map((alto, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-primario"
            style={{
              height: alto,
              transformOrigin: "center",
              animation: `barra-sonando 0.9s ease-in-out ${i * 0.12}s infinite`,
            }}
          />
        ))}
      </span>
      <p role="status" className="text-sm text-texto-suave">
        Confirmando tu pago…
      </p>
    </div>
  );
}
