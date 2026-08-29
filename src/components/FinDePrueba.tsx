import Link from "next/link";
import { pesos, tiempoEquivalente } from "@/lib/precios";

export interface LogroPrueba {
  mensajes: number;
  correcciones: number;
  /** Temas donde Allison ya detectó algo que trabajar. Nunca se muestra
   *  un cero en la pantalla que pide el pago: un cero ahí resta. */
  temasDetectados: number;
}

/**
 * La pantalla que ve un alumno cuando se le acaba la prueba gratis.
 *
 * Es el momento más decisivo del producto: acaba de probarlo y tiene
 * que decidir si paga. Un aviso genérico de "recarga" desperdicia ese
 * momento. Lo que convence no es el precio sino la prueba de que
 * funcionó — por eso lo primero que ve es lo que LOGRÓ, con sus
 * propios números.
 */
export function FinDePrueba({ logro }: { logro: LogroPrueba }) {
  // Sin nada que mostrar, las cifras sobran: quedarían todas en cero.
  const hizoAlgo = logro.mensajes > 0 && logro.correcciones > 0;

  return (
    <div className="rounded-3xl border-2 border-primario/40 bg-primario/5 p-6">
      <h2 className="text-xl font-bold leading-tight">
        Se te acabó la prueba gratis
      </h2>

      {hizoAlgo && (
        <>
          <p className="mt-2 text-[15px] leading-relaxed text-texto-suave">
            Mira lo que hiciste en {tiempoEquivalente(logro.mensajes).replace("≈ ", "solo ")}:
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { valor: logro.mensajes, etiqueta: "veces hablaste" },
              { valor: logro.correcciones, etiqueta: "errores corregidos" },
              { valor: logro.temasDetectados, etiqueta: "temas por mejorar" },
            ].map((c) => (
              <div
                key={c.etiqueta}
                className="rounded-2xl bg-superficie px-2 py-3 text-center"
              >
                <p className="text-2xl font-bold tabular-nums text-primario">
                  {c.valor}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-texto-suave">
                  {c.etiqueta}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-4 text-[15px] leading-relaxed">
        {hizoAlgo
          ? "Allison ya sabe en qué fallas. Sigue y verás cómo esos temas pasan a dominados."
          : "Sigue practicando con Allison."}{" "}
        Desde <strong>{pesos(4000)}</strong>, sin tarjeta y sin suscripción. Los
        mensajes que compras <strong>no caducan</strong>.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        <Link
          href="/recargar"
          className="rounded-2xl bg-primario px-6 py-4 text-center text-lg font-semibold text-white transition hover:brightness-110"
        >
          Recargar desde {pesos(4000)}
        </Link>
        <Link
          href="/planes"
          className="rounded-2xl border border-borde bg-superficie px-6 py-3 text-center font-medium transition hover:bg-superficie-2"
        >
          ¿Practicas a diario? Mira los planes
        </Link>
      </div>
    </div>
  );
}
