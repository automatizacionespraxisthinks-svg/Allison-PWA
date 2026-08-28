import type { EstadoTema, TemaAlumno } from "@/lib/progreso";

const ESTILO: Record<
  EstadoTema,
  { caja: string; punto: string; etiqueta: string; texto: string }
> = {
  dominado: {
    caja: "border-exito/40 bg-exito/10",
    punto: "bg-exito",
    etiqueta: "Dominado",
    texto: "text-exito",
  },
  mejorando: {
    caja: "border-primario/40 bg-primario/5",
    punto: "bg-primario",
    etiqueta: "Mejorando",
    texto: "text-primario",
  },
  atraviesa: {
    caja: "border-acento/50 bg-acento/10",
    punto: "bg-acento",
    etiqueta: "Se te atraviesa",
    texto: "text-acento",
  },
  sin_datos: {
    caja: "border-borde bg-superficie",
    punto: "bg-borde",
    etiqueta: "Sin explorar",
    texto: "text-texto-suave",
  },
};

/** Turnos limpios que hacen falta para dominar un tema. */
const META = 10;

/**
 * El mapa de dominio.
 *
 * La diferencia con una lista de errores: un tema puede MEJORAR. Cada
 * turno sin repetir el error llena la barra, y a los 10 el tema queda
 * dominado. Contar errores solo sube; esto también baja, que es lo
 * único que se siente como avanzar.
 */
export function MapaDominio({ temas }: { temas: TemaAlumno[] }) {
  // Primero lo que se atraviesa, luego lo que mejora, dominado, y al
  // final lo que no ha aparecido nunca.
  const orden: EstadoTema[] = ["atraviesa", "mejorando", "dominado", "sin_datos"];
  const ordenados = [...temas].sort(
    (a, b) =>
      orden.indexOf(a.estado) - orden.indexOf(b.estado) || b.veces - a.veces
  );

  return (
    <section className="flex flex-col gap-2.5">
      {ordenados.map((t) => {
        const e = ESTILO[t.estado];
        const avance =
          t.estado === "dominado"
            ? 100
            : t.estado === "sin_datos"
              ? 0
              : Math.min(100, Math.round((t.turnosLimpios / META) * 100));

        return (
          <article
            key={t.clave}
            className={`rounded-2xl border p-4 transition-colors ${e.caja}`}
          >
            <div className="flex items-center gap-3">
              <span className={`size-2.5 shrink-0 rounded-full ${e.punto}`} aria-hidden />
              <h3 className="flex-1 font-semibold leading-tight">{t.titulo}</h3>
              <span className={`shrink-0 text-xs font-semibold ${e.texto}`}>
                {e.etiqueta}
              </span>
            </div>

            {t.estado !== "sin_datos" && (
              <>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-superficie-2">
                  <div
                    className={`h-full rounded-full transition-all ${e.punto}`}
                    style={{ width: `${avance}%` }}
                  />
                </div>

                <p className="mt-2 text-sm text-texto-suave">
                  {t.estado === "dominado"
                    ? `Llevas ${t.turnosLimpios} turnos sin equivocarte aquí.`
                    : t.turnosLimpios === 0
                      ? "Te acaba de pasar. Vuelve a intentarlo."
                      : `${t.turnosLimpios} de ${META} turnos limpios.`}
                </p>

                {t.estado === "atraviesa" && t.ultimoEjemplo?.error && (
                  <p className="mt-1.5 text-sm">
                    <span className="text-error line-through">
                      {t.ultimoEjemplo.error}
                    </span>
                    <span className="mx-1.5 text-texto-suave">→</span>
                    <span className="font-medium text-exito">
                      {t.ultimoEjemplo.correccion}
                    </span>
                  </p>
                )}
              </>
            )}
          </article>
        );
      })}
    </section>
  );
}
