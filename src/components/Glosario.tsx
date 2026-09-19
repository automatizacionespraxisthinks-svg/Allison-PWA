"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FRASE_MAX } from "@/lib/frases";
import type { EntradaGlosario } from "@/lib/glosario";
import { pedir } from "@/lib/pedir";
import type { Nivel } from "@/lib/tipos";
import { useVelocidad } from "@/lib/velocidad";
import { desbloquearVoz, detenerVoz, hablarIngles } from "@/lib/voz";

/**
 * El glosario del alumno: todo lo que guardó, para repasarlo y oírlo.
 *
 * Lo que se guarda desde una conversación llega con su contexto —la
 * frase completa de donde salió— porque una palabra suelta se olvida y
 * una palabra en su frase se recuerda. También se puede escribir a
 * mano: en el celular seleccionar es a veces más difícil que teclear.
 */
export function Glosario({
  iniciales,
  nivel,
}: {
  iniciales: EntradaGlosario[];
  nivel: Nivel;
}) {
  const velocidad = useVelocidad();
  const [entradas, setEntradas] = useState(iniciales);
  const [filtro, setFiltro] = useState("");
  const [nueva, setNueva] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [sonando, setSonando] = useState<string | null>(null);
  /** La entrada cuyo "Quitar" espera confirmación: un toque no borra. */
  const [porQuitar, setPorQuitar] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return entradas;
    return entradas.filter(
      (e) => e.texto.toLowerCase().includes(q) || (e.contexto ?? "").toLowerCase().includes(q)
    );
  }, [entradas, filtro]);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    const texto = nueva.replace(/\s+/g, " ").trim();
    if (!texto || agregando) return;
    setAgregando(true);
    setAviso(null);

    const r = await pedir("/api/glosario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setAgregando(false);

    if (!r?.ok) {
      setAviso({ tipo: "error", texto: d.error ?? "No pudimos guardarla. Intenta de nuevo." });
      return;
    }
    if (d.estado === "repetida") {
      setAviso({ tipo: "ok", texto: "Esa ya estaba en tu glosario." });
    } else {
      setEntradas((lista) => [d.entrada, ...lista]);
      setAviso({ tipo: "ok", texto: "Guardada." });
    }
    setNueva("");
  }

  function escuchar(entrada: EntradaGlosario) {
    if (sonando === entrada.id) {
      detenerVoz();
      setSonando(null);
      return;
    }
    desbloquearVoz();
    setSonando(entrada.id);
    void hablarIngles(entrada.texto, nivel, velocidad).then(() => {
      setSonando((s) => (s === entrada.id ? null : s));
    });
  }

  async function quitar(entrada: EntradaGlosario) {
    if (porQuitar !== entrada.id) {
      setPorQuitar(entrada.id);
      return;
    }
    setPorQuitar(null);
    const r = await pedir(`/api/glosario/${entrada.id}`, { method: "DELETE" });
    if (r?.ok || r?.status === 404) {
      setEntradas((lista) => lista.filter((x) => x.id !== entrada.id));
    } else {
      setAviso({ tipo: "error", texto: "No pudimos quitarla. Intenta de nuevo." });
    }
  }

  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Tu glosario</h1>
        <p className="mt-1 text-texto-suave">
          {entradas.length === 0
            ? "Las palabras y frases que guardes de tus conversaciones."
            : `${entradas.length} ${entradas.length === 1 ? "entrada" : "entradas"}. Tócalas para oírlas.`}
        </p>
      </div>

      {/* ---- Agregar a mano ---- */}
      <form onSubmit={agregar} className="flex gap-2">
        <input
          value={nueva}
          onChange={(e) => {
            setNueva(e.target.value);
            setAviso(null);
          }}
          maxLength={FRASE_MAX}
          placeholder="Escribe una palabra o frase en inglés"
          aria-label="Palabra o frase para guardar"
          autoCapitalize="none"
          autoCorrect="off"
          className="h-11 min-w-0 flex-1 rounded-full border border-borde bg-superficie px-4 text-[15px] outline-none transition focus:border-primario"
        />
        <button
          type="submit"
          disabled={agregando || !nueva.trim()}
          className="degradado-primario sombra-accion h-11 shrink-0 rounded-full px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
        >
          {agregando ? "…" : "Guardar"}
        </button>
      </form>

      {aviso && (
        <p
          role={aviso.tipo === "error" ? "alert" : "status"}
          className={`rounded-lg p-3 text-sm ${
            aviso.tipo === "error" ? "bg-error/10 text-error" : "bg-exito/10 text-exito"
          }`}
        >
          {aviso.texto}
        </p>
      )}

      {entradas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-borde bg-superficie px-6 py-10 text-center">
          <span className="text-5xl" aria-hidden>📖</span>
          <h2 className="text-lg font-semibold">Tu glosario está vacío</h2>
          <p className="text-sm text-texto-suave">
            En cualquier conversación, <strong>selecciona una palabra o una frase</strong>{" "}
            de un mensaje: aparece una barra para escucharla y guardarla aquí. O
            escríbela arriba.
          </p>
          <Link
            href="/practicar"
            className="mt-2 rounded-2xl bg-primario px-6 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Hablar con Allison
          </Link>
        </div>
      ) : (
        <>
          {entradas.length > 6 && (
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar en tu glosario"
              aria-label="Buscar en tu glosario"
              className="h-10 rounded-full border border-borde bg-superficie px-4 text-sm outline-none transition focus:border-primario"
            />
          )}

          {visibles.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-suave">
              Nada coincide con «{filtro.trim()}».
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {visibles.map((e) => (
                <li
                  key={e.id}
                  className="rounded-2xl border border-borde bg-superficie px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => escuchar(e)}
                      aria-label={sonando === e.id ? "Detener" : `Escuchar «${e.texto}»`}
                      className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primario text-white transition hover:brightness-110"
                    >
                      {sonando === e.id ? (
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="ml-0.5 size-4" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="select-text text-[17px] font-semibold leading-snug">{e.texto}</p>
                      {e.contexto && e.contexto.toLowerCase() !== e.texto.toLowerCase() && (
                        <p className="mt-1 select-text text-sm leading-snug text-texto-suave">
                          {e.contexto}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-texto-suave">{fecha(e.creadoEn)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => quitar(e)}
                      onBlur={() => setPorQuitar((p) => (p === e.id ? null : p))}
                      aria-label={porQuitar === e.id ? "Confirmar: quitar del glosario" : "Quitar del glosario"}
                      className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                        porQuitar === e.id
                          ? "bg-error text-white"
                          : "text-texto-suave hover:bg-superficie-2 hover:text-texto"
                      }`}
                    >
                      {porQuitar === e.id ? "¿Quitar?" : "Quitar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
