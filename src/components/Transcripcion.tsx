"use client";

import { useEffect, useRef, useState } from "react";
import { SelectorDeFrase } from "@/components/SelectorDeFrase";
import type { Mensaje, Nivel, TipoCorreccion } from "@/lib/tipos";
import { fijarVelocidad, useVelocidad, VELOCIDADES } from "@/lib/velocidad";
import { desbloquearVoz, detenerVoz, hablarIngles } from "@/lib/voz";
import { pedir } from "@/lib/pedir";
import { pedirAyudaIA } from "@/lib/ayudaCliente";

/** Traducir usa la IA y gasta una intervención (29 de octubre de 2026). */
const SIN_SALDO = "Te quedaste sin intervenciones: traducir gasta una.";

const ETIQUETA: Record<TipoCorreccion, string> = {
  pronunciacion: "Pronunciación",
  gramatica: "Gramática",
  vocabulario: "Vocabulario",
  naturalidad: "Naturalidad",
};

/** Alturas fijas de la onda decorativa: siempre la misma, sin azar. */
const ONDA = [7, 12, 9, 15, 11, 16, 8, 13, 10];

/**
 * El chat con Allison.
 *
 * El texto del alumno se muestra TAL COMO LO DIJO, con sus errores
 * intactos — corregirlo aquí escondería justo lo que tiene que aprender
 * a ver. Cada mensaje de Allison lleva UNA fila de controles: audio,
 * onda, velocidad y traducción. Nada de tres pisos de botones por
 * mensaje: el lujo es la contención.
 *
 * Todo texto de mensaje lleva data-frase: es lo que permite seleccionar
 * una palabra o una frase y que aparezca la barra de escuchar y guardar
 * (SelectorDeFrase). El atributo trae la frase completa, que se guarda
 * como contexto en el glosario.
 */
export function Transcripcion({
  mensajes,
  nivel = "B1",
  reportadas = [],
  alCobrar,
}: {
  mensajes: Mensaje[];
  nivel?: Nivel;
  /** Correcciones que el alumno ya reportó, como "mensajeId:indice". */
  reportadas?: string[];
  /** Traducir cuesta una intervención: las que quedan (0 si no alcanzó). */
  alCobrar?: (restantes: number) => void;
}) {
  const velocidad = useVelocidad();
  const [reportes, setReportes] = useState<Record<string, "enviando" | "listo" | "error">>(() =>
    Object.fromEntries(reportadas.map((k) => [k, "listo" as const]))
  );
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [sonando, setSonando] = useState<string | null>(null);
  const [traducciones, setTraducciones] = useState<Record<string, string>>({});
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});
  const [traduciendo, setTraduciendo] = useState<string | null>(null);
  const zonaRef = useRef<HTMLDivElement>(null);

  // Si el alumno se va de la pantalla, la voz no sigue hablando sola
  useEffect(() => {
    return () => detenerVoz();
  }, []);

  function reproducir(m: Mensaje) {
    if (sonando === m.id) {
      detenerVoz();
      setSonando(null);
      return;
    }

    // Este clic también sirve de gesto de desbloqueo para el auto-play
    desbloquearVoz();
    setSonando(m.id);
    // Al terminar (o si otro mensaje lo interrumpió), se apaga SOLO si
    // este sigue siendo el que suena: la comprobación funcional evita
    // pisar al que lo reemplazó.
    // La versión con marcadores, si la hay: es la que sabe decir el
    // español en español. La pantalla sigue mostrando `texto`.
    void hablarIngles(m.textoVoz ?? m.texto, nivel, velocidad).then(() => {
      setSonando((s) => (s === m.id ? null : s));
    });
  }

  function cambiarVelocidad() {
    const i = VELOCIDADES.findIndex((v) => v.valor === velocidad);
    fijarVelocidad(VELOCIDADES[(i + 1) % VELOCIDADES.length].valor);
  }

  /**
   * "Esta corrección está mal". Se pide confirmar con un segundo toque
   * para que un dedo distraído no mande reportes; el administrador
   * decide si se devuelve la intervención.
   */
  async function reportar(mensajeId: string, indice: number) {
    const clave = `${mensajeId}:${indice}`;
    if (confirmando !== clave) {
      setConfirmando(clave);
      return;
    }
    setConfirmando(null);
    setReportes((r) => ({ ...r, [clave]: "enviando" }));
    const r = await pedir("/api/reportes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensajeId, indice }),
    });
    setReportes((e) => ({ ...e, [clave]: r?.ok ? "listo" : "error" }));
  }

  async function traducir(m: Mensaje) {
    if (abiertas[m.id]) {
      setAbiertas((a) => ({ ...a, [m.id]: false }));
      return;
    }
    // El aviso de sin saldo no se guarda como traducción: al recargar, se pide otra vez.
    if (traducciones[m.id] && traducciones[m.id] !== SIN_SALDO) {
      setAbiertas((a) => ({ ...a, [m.id]: true }));
      return;
    }

    setTraduciendo(m.id);
    try {
      const r = await pedirAyudaIA(m.texto, nivel);
      if (!r.ok) {
        if (r.sinSaldo) {
          alCobrar?.(0);
          // Se dice ahí mismo: traducir usa la IA y gasta una intervención.
          setTraducciones((t) => ({ ...t, [m.id]: SIN_SALDO }));
          setAbiertas((a) => ({ ...a, [m.id]: true }));
        }
        return;
      }
      if (r.cobrada && r.ayuda.restantes !== undefined) alCobrar?.(r.ayuda.restantes);
      setTraducciones((t) => ({ ...t, [m.id]: r.ayuda.traduccion || "—" }));
      setAbiertas((a) => ({ ...a, [m.id]: true }));
    } finally {
      setTraduciendo(null);
    }
  }

  return (
    <div ref={zonaRef} className="w-full space-y-3">
      {mensajes.map((m) =>
        m.rol === "allison" ? (
          <div key={m.id} className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-borde bg-superficie px-4 py-3">
              <p data-frase={m.texto} className="select-text text-[15px] leading-relaxed">
                {m.texto}
              </p>

              {/* Una sola fila: audio · onda · velocidad · traducción */}
              <div className="mt-2.5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => reproducir(m)}
                  aria-label={sonando === m.id ? "Detener el audio" : "Escuchar"}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primario text-white transition hover:brightness-110"
                >
                  {sonando === m.id ? (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <span className="flex h-5 items-center gap-[3px]" aria-hidden>
                  {ONDA.map((alto, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full bg-primario/40"
                      style={{
                        height: alto,
                        transformOrigin: "center",
                        animation:
                          sonando === m.id
                            ? `barra-sonando 0.9s ease-in-out ${i * 0.08}s infinite`
                            : undefined,
                      }}
                    />
                  ))}
                </span>

                <button
                  type="button"
                  onClick={cambiarVelocidad}
                  aria-label={`Velocidad del audio: ${velocidad}×. Tocar para cambiar`}
                  title="Cambiar la velocidad"
                  className="shrink-0 rounded-full border border-borde px-2 py-0.5 font-mono text-[11px] font-semibold text-texto-suave transition hover:bg-superficie-2"
                >
                  {velocidad}×
                </button>

                <span className="flex-1" />

                <button
                  type="button"
                  onClick={() => traducir(m)}
                  disabled={traduciendo === m.id}
                  aria-expanded={Boolean(abiertas[m.id])}
                  title={traducciones[m.id] && traducciones[m.id] !== SIN_SALDO ? undefined : "Traducir usa una intervención"}
                  className="shrink-0 text-xs font-semibold text-primario transition hover:opacity-75 disabled:opacity-40"
                >
                  {traduciendo === m.id
                    ? "Traduciendo…"
                    : abiertas[m.id]
                      ? "Ocultar"
                      : "Traducción"}
                </button>
              </div>

              {abiertas[m.id] && traducciones[m.id] && (
                <p className="mt-2 border-t border-borde pt-2 text-sm text-texto-suave">
                  {traducciones[m.id]}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primario-suave px-4 py-3 text-texto">
              <p data-frase={m.texto} className="select-text text-[15px] leading-relaxed">
                {m.texto}
              </p>

              {m.correcciones.length > 0 && (
                <ul className="mt-3 space-y-2.5 border-t border-primario/15 pt-3">
                  {m.correcciones.map((c, i) => (
                    <li key={i} data-frase={c.correccion} className="select-text text-sm">
                      <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-texto-suave">
                        {ETIQUETA[c.tipo]}
                      </span>
                      <span className="text-error line-through">{c.original}</span>
                      <span className="mx-1.5 text-texto-suave">→</span>
                      <span className="font-medium text-exito">{c.correccion}</span>
                      <span className="mt-0.5 block text-texto">{c.explicacion}</span>
                      {c.explicacionEs && (
                        <span className="mt-0.5 block text-texto-suave">
                          {c.explicacionEs}
                        </span>
                      )}
                      <BotonReportar
                        estado={reportes[`${m.id}:${i}`]}
                        confirmando={confirmando === `${m.id}:${i}`}
                        onReportar={() => reportar(m.id, i)}
                        onCancelar={() => setConfirmando(null)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      )}

      <SelectorDeFrase zona={zonaRef} nivel={nivel} />
    </div>
  );
}

/** El enlace pequeño bajo cada corrección y sus estados. */
function BotonReportar({
  estado,
  confirmando,
  onReportar,
  onCancelar,
}: {
  estado?: "enviando" | "listo" | "error";
  confirmando: boolean;
  onReportar: () => void;
  onCancelar: () => void;
}) {
  if (estado === "listo") {
    return (
      <span className="mt-1.5 block text-xs font-medium text-texto-suave">
        Reportada · la revisamos y te avisamos
      </span>
    );
  }
  if (estado === "enviando") {
    return <span className="mt-1.5 block text-xs text-texto-suave">Enviando…</span>;
  }
  if (confirmando) {
    return (
      <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-texto-suave">¿Crees que Allison se equivocó?</span>
        <button
          type="button"
          onClick={onReportar}
          className="rounded-full bg-primario px-2.5 py-0.5 font-semibold text-white"
        >
          Sí, reportar
        </button>
        <button type="button" onClick={onCancelar} className="font-semibold text-texto-suave">
          No
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onReportar}
      className="mt-1.5 block text-xs font-semibold text-texto-suave underline decoration-dotted underline-offset-2 transition hover:text-primario"
    >
      {estado === "error" ? "No se pudo enviar · intentar otra vez" : "¿Esta corrección está mal?"}
    </button>
  );
}
