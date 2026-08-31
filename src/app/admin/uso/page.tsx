import { Grafica } from "@/components/admin/Grafica";
import { SelectorPeriodo } from "@/components/admin/SelectorPeriodo";
import { pesos, tiempoEquivalente } from "@/lib/precios";
import { costoCop, informeDeUso, resolverRango, TARIFAS } from "@/lib/uso";

/**
 * Trazabilidad del uso y del consumo de IA.
 *
 * Cuatro secciones, en el orden en que se responden las preguntas:
 * cuánto se usó, cuánta IA costó, cómo evolucionó y quién lo consumió.
 */
export default async function PaginaUso({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>;
}) {
  const { periodo, desde, hasta } = await searchParams;
  const rango = resolverRango(periodo, desde, hasta);
  const { totales: t, serie, usuarios } = await informeDeUso(rango);

  const miles = (v: number) => v.toLocaleString("es-CO");

  const tokensConversar = t.tokensEntrada + t.tokensSalida;
  const tokensAyuda = t.tokensAyudaEntrada + t.tokensAyudaSalida;
  const tokensTotal = tokensConversar + tokensAyuda;

  const costoConversar = costoCop(t.tokensEntrada, t.tokensSalida);
  const costoAyuda = costoCop(t.tokensAyudaEntrada, t.tokensAyudaSalida);
  const costoTotal = costoConversar + costoAyuda;

  const llamadas = t.llamadasConversar + t.llamadasAyuda;
  const porTurno = t.turnos > 0 ? costoTotal / t.turnos : 0;

  const dato = (k: string, v: string, nota?: string) => (
    <div key={k} className="rounded-xl bg-superficie-2/60 p-3">
      <p className="text-xs text-texto-suave">{k}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{v}</p>
      {nota && <p className="text-[11px] text-texto-suave">{nota}</p>}
    </div>
  );

  const seccion = (titulo: string, subtitulo: string, hijos: React.ReactNode) => (
    <section className="rounded-2xl border border-borde bg-superficie p-5">
      <h2 className="text-base font-bold">{titulo}</h2>
      <p className="mb-3 text-xs text-texto-suave">{subtitulo}</p>
      {hijos}
    </section>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Uso y consumo de IA</h1>
        <p className="text-sm text-texto-suave">
          {rango.etiqueta} · del {rango.desde} al {rango.hasta}
        </p>
      </div>

      <SelectorPeriodo
        activo={periodo ?? "mes"}
        desde={rango.desde}
        hasta={rango.hasta}
      />

      {/* ---------- 1. Actividad ---------- */}
      {seccion(
        "Actividad",
        "Qué tanto se usó Allison en el periodo",
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {dato("Usuarios activos", miles(t.usuariosActivos))}
          {dato("Conversaciones", miles(t.conversaciones))}
          {dato("Intervenciones", miles(t.turnos), tiempoEquivalente(t.turnos))}
          {dato(
            "Audio recibido",
            `${Math.round(t.segundosAudio / 60)} min`,
            `${miles(t.segundosAudio)} segundos`
          )}
        </div>
      )}

      {/* ---------- 2. Mensajes ---------- */}
      {seccion(
        "Mensajes",
        "Cada intervención son dos mensajes: el del alumno y el de Allison",
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {dato("Entrantes (alumno)", miles(t.turnos))}
          {dato("Salientes (Allison)", miles(t.turnos))}
          {dato("Total", miles(t.turnos * 2))}
          {dato(
            "Promedio por usuario",
            t.usuariosActivos > 0
              ? (t.turnos / t.usuariosActivos).toFixed(1)
              : "0",
            "intervenciones"
          )}
        </div>
      )}

      {/* ---------- 3. Consumo de IA ---------- */}
      {seccion(
        "Consumo de IA",
        `Tokens y costo con las tarifas de gemini-2.5-flash-lite · $${TARIFAS.entrada}/M entrada, $${TARIFAS.salida}/M salida, dólar a ${miles(TARIFAS.usdACop)}`,
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dato("Llamadas a la IA", miles(llamadas))}
            {dato("Tokens de entrada", miles(t.tokensEntrada + t.tokensAyudaEntrada))}
            {dato("Tokens de salida", miles(t.tokensSalida + t.tokensAyudaSalida))}
            {dato("Tokens totales", miles(tokensTotal))}
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-xs text-texto-suave">
                  <th className="py-2 font-medium">Origen</th>
                  <th className="py-2 text-right font-medium">Llamadas</th>
                  <th className="py-2 text-right font-medium">Tokens</th>
                  <th className="py-2 text-right font-medium">Costo</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                <tr className="border-b border-borde/60">
                  <td className="py-2">Conversación</td>
                  <td className="py-2 text-right">{miles(t.llamadasConversar)}</td>
                  <td className="py-2 text-right">{miles(tokensConversar)}</td>
                  <td className="py-2 text-right">{pesos(costoConversar)}</td>
                </tr>
                <tr className="border-b border-borde/60">
                  <td className="py-2">
                    Traducciones e ideas
                    <span className="block text-[11px] text-texto-suave">
                      el botón Traducción y el 💡
                    </span>
                  </td>
                  <td className="py-2 text-right">{miles(t.llamadasAyuda)}</td>
                  <td className="py-2 text-right">{miles(tokensAyuda)}</td>
                  <td className="py-2 text-right">{pesos(costoAyuda)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{miles(llamadas)}</td>
                  <td className="py-2 text-right">{miles(tokensTotal)}</td>
                  <td className="py-2 text-right">{pesos(costoTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 rounded-xl bg-primario-suave/40 p-3 text-xs">
            <strong>{pesos(Math.round(porTurno * 100) / 100)}</strong> por
            intervención en promedio. Contra los $50 del plan mensual, la IA
            es el{" "}
            <strong>
              {porTurno > 0 ? ((porTurno / 50) * 100).toFixed(1) : "0"}%
            </strong>{" "}
            del precio. No incluye servidor ni comisiones de la pasarela.
          </p>
        </>
      )}

      {/* ---------- 4. Evolución ---------- */}
      {seccion(
        "Evolución",
        rango.granularidad === "mes"
          ? "Por mes en el periodo"
          : "Por día en el periodo",
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-xs font-medium text-texto-suave">
              Intervenciones
            </p>
            <Grafica
              barras={serie.map((p) => ({
                etiqueta: p.etiqueta,
                valor: p.turnos,
                detalle: `${p.conversaciones} conversaciones`,
              }))}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-texto-suave">
              Tokens consumidos
            </p>
            <Grafica
              barras={serie.map((p) => ({
                etiqueta: p.etiqueta,
                valor: p.tokensEntrada + p.tokensSalida,
                detalle: `${pesos(p.costoCop)} de IA`,
              }))}
              alto={120}
            />
          </div>
        </div>
      )}

      {/* ---------- 5. Por usuario ---------- */}
      {seccion(
        "Quién consume",
        "Los 15 que más usaron Allison en el periodo",
        usuarios.length === 0 ? (
          <p className="py-4 text-center text-sm text-texto-suave">
            Nadie practicó en este periodo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-xs text-texto-suave">
                  <th className="py-2 font-medium">Usuario</th>
                  <th className="py-2 text-right font-medium">Intervenciones</th>
                  <th className="py-2 text-right font-medium">Tokens</th>
                  <th className="py-2 text-right font-medium">Costo IA</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {usuarios.map((u) => (
                  <tr key={u.identificador} className="border-b border-borde/60">
                    <td className="py-2">
                      <span className="font-medium">{u.nombre}</span>
                      <span className="block text-[11px] text-texto-suave">
                        {u.identificador}
                      </span>
                    </td>
                    <td className="py-2 text-right">{miles(u.turnos)}</td>
                    <td className="py-2 text-right">{miles(u.tokens)}</td>
                    <td className="py-2 text-right">{pesos(u.costoCop)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <p className="pb-2 text-center text-[11px] text-texto-suave">
        Las cifras se acumulan por día en hora de Colombia y sobreviven al
        borrado de conversaciones a los 20 días. Los datos anteriores al 28
        de agosto de 2026 no existen: se perdieron con ese borrado, antes de
        que este registro existiera.
      </p>
    </div>
  );
}
