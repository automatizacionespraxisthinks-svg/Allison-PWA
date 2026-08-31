/**
 * Gráfica de barras, dibujada a mano en SVG.
 *
 * Sin librería de terceros a propósito: una librería de gráficas pesa
 * más que toda la aplicación, y esto es un panel interno que dibuja
 * barras. El SVG escala solo, se ve nítido en cualquier pantalla y
 * hereda los colores del tema, así que funciona igual en claro y en
 * oscuro sin código extra.
 *
 * Es un componente de servidor: no hay estado ni interacción, solo
 * datos que ya vinieron resueltos. El detalle de cada barra viaja en
 * el <title>, que el navegador muestra al pasar el cursor y los
 * lectores de pantalla leen.
 */
export interface Barra {
  etiqueta: string;
  valor: number;
  detalle?: string;
}

export function Grafica({
  barras,
  alto = 160,
  formato = (v: number) => v.toLocaleString("es-CO"),
}: {
  barras: Barra[];
  alto?: number;
  formato?: (v: number) => string;
}) {
  if (barras.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-texto-suave">
        No hay datos en este periodo.
      </p>
    );
  }

  const maximo = Math.max(...barras.map((b) => b.valor), 1);

  // Con muchas barras las etiquetas se encabalgan: se muestran salteadas.
  const cada = Math.ceil(barras.length / 12);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-full items-end gap-[3px]" style={{ height: alto }}>
        {barras.map((b, i) => {
          const proporcion = b.valor / maximo;
          return (
            <div
              key={b.etiqueta + i}
              className="flex min-w-[8px] flex-1 flex-col justify-end"
              style={{ height: "100%" }}
            >
              <div
                className="rounded-t bg-primario transition-all"
                style={{
                  // Una barra de valor cero se ve como un hilo, no como
                  // nada: así se distingue "no hubo" de "no hay datos".
                  height: `${Math.max(proporcion * 100, b.valor > 0 ? 3 : 1)}%`,
                  opacity: b.valor > 0 ? 1 : 0.25,
                }}
                title={`${b.etiqueta}: ${formato(b.valor)}${b.detalle ? ` · ${b.detalle}` : ""}`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex min-w-full gap-[3px]">
        {barras.map((b, i) => (
          <div
            key={b.etiqueta + i}
            className="min-w-[8px] flex-1 text-center text-[9px] leading-tight text-texto-suave"
          >
            {i % cada === 0 ? corta(b.etiqueta) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/** "2026-08-31" → "31/08"; "2026-08" → "ago". */
function corta(etiqueta: string): string {
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const partes = etiqueta.split("-");
  if (partes.length === 3) return `${partes[2]}/${partes[1]}`;
  if (partes.length === 2) return MES[Number(partes[1]) - 1] ?? etiqueta;
  return etiqueta;
}
