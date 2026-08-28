import type { DiaPracticado } from "@/lib/progreso";

const LETRA = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * Los últimos 7 días, un círculo grande por día.
 *
 * Antes eran 30 cuadros diminutos: un mapa de calor se lee bien en un
 * panel de analítica, pero un estudiante en un celular no distingue
 * cuatro tonos de verde. Siete círculos con el día de la semana se leen
 * de un vistazo y sin que nadie los explique.
 */
export function SemanaPractica({ dias }: { dias: DiaPracticado[] }) {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const hoy = new Date();

  const celdas = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - (6 - i));
    const clave = fecha.toISOString().slice(0, 10);
    return {
      clave,
      letra: LETRA[fecha.getDay()],
      mensajes: porFecha.get(clave)?.mensajes ?? 0,
      esHoy: i === 6,
    };
  });

  return (
    <section className="rounded-3xl border border-borde bg-superficie p-5">
      <h2 className="text-sm font-semibold text-texto-suave">Tu semana</h2>
      <div className="mt-3 flex justify-between gap-1">
        {celdas.map((c) => (
          <div key={c.clave} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              title={`${c.mensajes} ${c.mensajes === 1 ? "mensaje" : "mensajes"}`}
              className={`flex aspect-square w-full max-w-12 items-center justify-center rounded-full text-sm font-bold ${
                c.mensajes > 0
                  ? "bg-primario text-white"
                  : c.esHoy
                    ? "border-2 border-dashed border-primario/50 text-texto-suave"
                    : "bg-superficie-2 text-texto-suave/50"
              }`}
            >
              {c.mensajes > 0 ? c.mensajes : ""}
            </div>
            <span
              className={`text-xs ${
                c.esHoy ? "font-bold text-primario" : "text-texto-suave"
              }`}
            >
              {c.letra}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
