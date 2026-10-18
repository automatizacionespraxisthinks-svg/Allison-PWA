"use client";

import { useEffect, useState } from "react";
import type { Repite as Datos } from "@/lib/ruta/tipos";
import { desdeB1 } from "@/lib/tipos";
import { evaluar, type Contexto, type FinActividad } from "./api";
import { AllisonAro, BotonOir, Explicado, Grabador, Hoja, NoDijeEso, oirGrabacion, useVoz, type Entrada } from "./comun";

/**
 * Repite (pantalla 4): oye la frase de Allison y la repite. Después de
 * hablar, cada palabra lleva una barra: verde si se entendió, dorada si
 * hay que mejorarla; la palabra por mejorar sale en una tarjeta con audio
 * normal y lento. Tras dos intentos sigue adelante. Escribir permite
 * seguir, pero la frase no recibe calificación de pronunciación.
 */
export function Repite({
  a,
  ctx,
  onTerminar,
  onSinSaldo,
}: {
  a: Datos;
  ctx: Contexto;
  onTerminar: (f: FinActividad) => void;
  onSinSaldo: () => void;
}) {
  const { decir, hablando } = useVoz(ctx.nivel);
  const [palabras, setPalabras] = useState<{ palabra: string; estado: "bien" | "mejorar" }[] | null>(null);
  const [mejorar, setMejorar] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);
  const [primeraBien, setPrimeraBien] = useState(false);
  const [escrita, setEscrita] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [oido, setOido] = useState<{
    texto: string;
    antes: { palabras: typeof palabras; mejorar: string | null; intentos: number; primeraBien: boolean };
  } | null>(null);
  const [miVoz, setMiVoz] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => void decir(a.frase), 400);
    return () => clearTimeout(t);
  }, [a.frase, decir]);

  async function responder(e: Entrada) {
    setMensaje(null);
    if ("texto" in e) {
      setEscrita(true);
      return;
    }
    setMiVoz(e.url);
    setOcupado(true);
    const r = await evaluar(ctx, a.paso, e);
    setOcupado(false);
    if (r.sinSaldo) return onSinSaldo();
    if (r.error) return setMensaje(r.error);
    if (r.sinVoz) return setMensaje("No te oí. Inténtalo otra vez.");
    setOido({ texto: r.transcripcion, antes: { palabras, mejorar, intentos, primeraBien } });
    const n = intentos + 1;
    setIntentos(n);
    setPalabras(r.palabras);
    setMejorar(r.palabraAMejorar);
    if (r.correcto && n === 1) setPrimeraBien(true);
    if (r.correcto) void decir("Great!");
    else if (r.palabraAMejorar) void decir(`${r.palabraAMejorar}. ${r.palabraAMejorar}.`, { lento: true });
  }

  /** "¿No dijiste eso?": el micrófono entendió mal y el intento no cuenta. */
  function noDijeEso() {
    if (!oido) return;
    setPalabras(oido.antes.palabras);
    setMejorar(oido.antes.mejorar);
    setIntentos(oido.antes.intentos);
    setPrimeraBien(oido.antes.primeraBien);
    setOido(null);
  }

  const claras = palabras?.filter((p) => p.estado === "bien").length ?? 0;
  // Desde B1 Allison habla en inglés: sin la línea en español debajo.
  const b1 = desdeB1(ctx.nivel);
  const listo = escrita || (palabras !== null && (!mejorar || intentos >= 2));
  const consejo =
    mejorar && a.palabraDificil && mejorar.toLowerCase().includes(a.palabraDificil.toLowerCase()) ? a.consejo : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <AllisonAro tam={58} aro={palabras ? (mejorar ? "pista" : "bien") : "pregunta"} hablando={hablando} />
        <div className="min-w-0 rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2.5 font-extrabold">
          {palabras === null ? (
            <>
              Listen and repeat.
              {!b1 && <small className="block font-semibold text-texto-suave">Escucha y repite.</small>}
            </>
          ) : mejorar ? (
            <>
              Almost! One more word.
              {!b1 && <small className="block font-semibold text-texto-suave">¡Casi! Falta una palabra.</small>}
            </>
          ) : (
            <>
              Great!
              {!b1 && <small className="block font-semibold text-texto-suave">¡Muy bien!</small>}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3" aria-live="polite">
        {(palabras ?? a.frase.split(/\s+/).map((p) => ({ palabra: p, estado: "bien" as const }))).map((p, i) => (
          <span key={i} className={`flex flex-col gap-1 text-2xl font-black ${palabras && p.estado === "mejorar" ? "text-oro" : ""}`}>
            {palabras ? p.palabra : a.frase.split(/\s+/)[i]}
            <i
              className={`h-[5px] rounded-full ${
                palabras === null ? "bg-superficie-2" : p.estado === "bien" ? "bg-menta" : "bg-oro"
              }`}
            />
          </span>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        <BotonOir onClick={() => void decir(a.frase)} texto="Oír la frase" />
        <BotonOir onClick={() => void decir(a.frase, { lento: true })} texto="Más despacio" lento />
      </div>

      {mejorar && (
        <div className="flex items-center gap-3 rounded-3xl border-2 border-oro bg-oro-suave px-4 py-3">
          <div className="min-w-0 flex-1">
            <small className="block text-[12.5px] font-extrabold text-oro">Practica esta palabra</small>
            <b className="block text-3xl leading-tight font-black">{mejorar}</b>
            {consejo && (
              <small className="block text-[12.5px] font-bold text-oro">
                {a.consejoEs ? <Explicado en={consejo} es={a.consejoEs} className="!items-start" /> : consejo}
              </small>
            )}
          </div>
          <span className="flex flex-col items-center gap-1 text-[11.5px] font-extrabold text-oro">
            <BotonOir onClick={() => void decir(mejorar)} className="!bg-oro" />
            Normal
          </span>
          <span className="flex flex-col items-center gap-1 text-[11.5px] font-extrabold text-oro">
            <BotonOir onClick={() => void decir(mejorar, { lento: true })} lento className="!bg-oro" />
            Lento
          </span>
        </div>
      )}

      {palabras && (
        <p className="text-center text-[13px] font-extrabold text-texto-suave">
          {claras} de {palabras.length} palabras claras
        </p>
      )}
      {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}
      {oido && mejorar && <NoDijeEso oido={oido.texto} escrito={false} onClick={noDijeEso} />}

      {listo ? (
        <Hoja
          tono={escrita ? "ensena" : mejorar ? "pista" : "bien"}
          titulo={escrita ? "¡Listo! Cuando puedas, dila en voz alta." : mejorar ? "¡Buen intento! Sigamos." : "¡Se entendió todo!"}
          boton="Continuar"
          onBoton={() =>
            onTerminar({
              calificadas: escrita ? 0 : 1,
              aciertos: primeraBien ? 1 : 0,
              fallos: !escrita && mejorar ? [mejorar] : [],
            })
          }
        >
          {miVoz && (
            <div>
              <BotonOir onClick={() => oirGrabacion(miVoz)} texto="Oír mi voz" />
            </div>
          )}
        </Hoja>
      ) : (
        <>
          <Grabador onEntrada={responder} ocupado={ocupado} ayuda={palabras ? "Repite la frase otra vez" : "Toca y repite la frase"} />
          {miVoz && (
            <div className="flex justify-center">
              <BotonOir onClick={() => oirGrabacion(miVoz)} texto="Oír mi voz" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
