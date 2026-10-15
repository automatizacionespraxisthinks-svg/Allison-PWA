"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { FRASE_MAX, normalizarFrase } from "@/lib/frases";
import { pedir } from "@/lib/pedir";
import type { Nivel } from "@/lib/tipos";
import { useVelocidad } from "@/lib/velocidad";
import { desbloquearVoz, hablarIngles } from "@/lib/voz";

interface Seleccion {
  texto: string;
  /** La frase completa de donde salió: se guarda como contexto. */
  contexto: string;
  /** Centro horizontal y bordes verticales de lo seleccionado, en pantalla. */
  x: number;
  arriba: number;
  abajo: number;
}

type Estado = "quieto" | "guardando" | "guardada" | "repetida" | "error";

const ANCHO_BARRA = 232;

/**
 * La barra que aparece al seleccionar texto dentro de un mensaje.
 *
 * El alumno marca una palabra o una frase —con el dedo o el ratón— y
 * le salen dos botones: oírla sola, y guardarla en su glosario. Solo
 * reacciona a selecciones dentro de un elemento con data-frase (los
 * textos de los mensajes), nunca al resto de la pantalla.
 *
 * Dos detalles que no son adorno:
 *   · Tocar la barra NO debe deshacer la selección: los botones anulan
 *     el pointerdown, y por si el navegador la deshace igual (pasa en
 *     móviles), la última selección se recuerda aparte y es la que se
 *     usa al tocar.
 *   · La barra va DEBAJO de la selección: el menú nativo de copiar del
 *     celular sale encima, y dos barras en el mismo sitio se tapan.
 */
export function SelectorDeFrase({
  zona,
  nivel,
}: {
  /** El contenedor de los mensajes: fuera de él no hay barra. */
  zona: RefObject<HTMLElement | null>;
  nivel: Nivel;
}) {
  const velocidad = useVelocidad();
  const [sel, setSel] = useState<Seleccion | null>(null);
  const [estado, setEstado] = useState<Estado>("quieto");
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [sonando, setSonando] = useState(false);
  const ultima = useRef<Seleccion | null>(null);
  const tocandoBarra = useRef(false);
  const cierre = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const leer = () => {
      const s = window.getSelection();
      if (!s || s.rangeCount === 0 || s.isCollapsed) {
        // Si la selección se fue porque el dedo tocó la barra, se
        // conserva lo último seleccionado hasta que la acción termine.
        if (!tocandoBarra.current) setSel(null);
        return;
      }

      const rango = s.getRangeAt(0);
      const nodo = rango.commonAncestorContainer;
      const elemento =
        nodo.nodeType === Node.TEXT_NODE ? nodo.parentElement : (nodo as Element);
      const mensaje = elemento?.closest<HTMLElement>("[data-frase]") ?? null;
      if (!mensaje || !zona.current?.contains(mensaje)) {
        setSel(null);
        return;
      }

      const texto = normalizarFrase(s.toString());
      if (!texto || texto.length > FRASE_MAX) {
        setSel(null);
        return;
      }

      const r = rango.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setSel(null);
        return;
      }

      const nueva: Seleccion = {
        texto,
        contexto: mensaje.dataset.frase ?? mensaje.textContent ?? "",
        x: r.left + r.width / 2,
        arriba: r.top,
        abajo: r.bottom,
      };
      // Un texto distinto es una acción nueva: el "Guardada ✓" de la
      // anterior no tiene que seguir ahí.
      if (ultima.current?.texto !== texto) {
        setEstado("quieto");
        setErrorGuardar(null);
      }
      ultima.current = nueva;
      setSel(nueva);
    };

    const alCambiar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(leer, 150);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.getSelection()?.removeAllRanges();
        setSel(null);
      }
    };

    document.addEventListener("selectionchange", alCambiar);
    // El chat se desplaza dentro de su propio contenedor: al hacer
    // scroll la selección se mueve, y la barra tiene que seguirla.
    document.addEventListener("scroll", alCambiar, true);
    window.addEventListener("resize", alCambiar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("selectionchange", alCambiar);
      document.removeEventListener("scroll", alCambiar, true);
      window.removeEventListener("resize", alCambiar);
      document.removeEventListener("keydown", alTeclear);
      clearTimeout(temporizador);
      clearTimeout(cierre.current);
    };
  }, [zona]);

  function marcarToque() {
    tocandoBarra.current = true;
    setTimeout(() => {
      tocandoBarra.current = false;
    }, 600);
  }

  async function escuchar() {
    const s = ultima.current;
    if (!s || sonando) return;
    desbloquearVoz();
    setSonando(true);
    await hablarIngles(s.texto, nivel, velocidad);
    setSonando(false);
  }

  async function guardar() {
    const s = ultima.current;
    if (!s || estado === "guardando") return;
    setEstado("guardando");
    setErrorGuardar(null);

    const r = await pedir("/api/glosario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: s.texto, contexto: s.contexto }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) {
      setEstado("error");
      setErrorGuardar(d.error ?? "No pudimos guardarla. Intenta de nuevo.");
      return;
    }

    setEstado(d.estado === "repetida" ? "repetida" : "guardada");
    // Se despide sola: quedó guardada, no hay nada más que hacer aquí.
    clearTimeout(cierre.current);
    cierre.current = setTimeout(() => {
      window.getSelection()?.removeAllRanges();
      setSel(null);
      setEstado("quieto");
    }, 1600);
  }

  if (!sel) return null;

  // Debajo de la selección; encima solo si abajo no cabe.
  const cabeAbajo = sel.abajo + 64 < window.innerHeight;
  const top = cabeAbajo ? sel.abajo + 8 : sel.arriba - 56;
  const left = Math.min(
    Math.max(sel.x - ANCHO_BARRA / 2, 8),
    window.innerWidth - ANCHO_BARRA - 8
  );

  const boton =
    "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition disabled:opacity-50";

  return (
    <div
      role="toolbar"
      aria-label="Acciones sobre el texto seleccionado"
      onPointerDownCapture={marcarToque}
      onMouseDown={(e) => e.preventDefault()}
      style={{ position: "fixed", top, left, width: ANCHO_BARRA }}
      className="z-40 flex flex-col gap-1 rounded-2xl border border-borde bg-superficie p-1.5 shadow-lg"
    >
      <div className="flex gap-1">
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={escuchar}
          disabled={sonando}
          className={`${boton} bg-primario text-white hover:brightness-110`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
          </svg>
          {sonando ? "Sonando…" : "Escuchar"}
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={guardar}
          disabled={estado === "guardando" || estado === "guardada" || estado === "repetida"}
          className={`${boton} border border-borde bg-superficie text-texto hover:bg-superficie-2`}
        >
          {estado === "guardando" ? (
            "Guardando…"
          ) : estado === "guardada" ? (
            <span className="text-exito">Guardada ✓</span>
          ) : estado === "repetida" ? (
            <span className="text-texto-suave">Ya la tenías</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />
              </svg>
              Guardar
            </>
          )}
        </button>
      </div>
      {errorGuardar && (
        <p role="alert" className="px-2 pb-1 text-xs text-error">
          {errorGuardar}
        </p>
      )}
    </div>
  );
}
