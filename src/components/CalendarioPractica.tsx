import type { DiaPracticado } from "@/lib/progreso";

/**
 * Los últimos 30 días, un cuadro por día.
 *
 * Un calendario dice más que un número: el alumno ve de un vistazo si
 * está siendo constante o si practica a ráfagas y luego desaparece.
 */
export function CalendarioPractica({ dias }: { dias: DiaPracticado[] }) {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));

  const hoy = new Date();
  const celdas = Array.from({ length: 30 }, (_, i) => {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - (29 - i));
    const clave = fecha.toISOString().slice(0, 10);
    const dia = porFecha.get(clave);
    return {
      clave,
      mensajes: dia?.mensajes ?? 0,
      etiqueta: fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short" }),
    };
  });

  // Cuatro intensidades: el color denso indica un día de práctica larga
  const intensidad = (m: number) =>
    m === 0 ? "bg-superficie-2"
    : m < 5  ? "bg-primario/25"
    : m < 15 ? "bg-primario/60"
    :          "bg-primario";

  return (
    <section className="rounded-2xl border border-borde bg-superficie p-5">
      <h2 className="font-semibold">Últimos 30 días</h2>
      <div className="mt-4 grid grid-cols-10 gap-1.5">
        {celdas.map((c) => (
          <div
            key={c.clave}
            title={`${c.etiqueta}: ${c.mensajes} ${c.mensajes === 1 ? "mensaje" : "mensajes"}`}
            className={`aspect-square rounded ${intensidad(c.mensajes)}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-texto-suave">
        <span>menos</span>
        {["bg-superficie-2", "bg-primario/25", "bg-primario/60", "bg-primario"].map((c) => (
          <span key={c} className={`size-3 rounded ${c}`} />
        ))}
        <span>más</span>
      </div>
    </section>
  );
}
