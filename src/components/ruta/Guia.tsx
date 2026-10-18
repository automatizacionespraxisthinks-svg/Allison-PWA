"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Nivel } from "@/lib/tipos";
import { Estampilla, type LugarSello } from "./Estampilla";
import { Icono } from "./Iconos";
import { BotonOir, useVoz } from "./leccion/comun";

interface LeccionGuia {
  numero: number;
  titulo: string;
  frases: { en: string; es: string }[];
}

/**
 * La Guía de frases (pantalla 7): una frase a la vez en una tarjeta
 * grande que dice Allison, con audio normal y lento. Al tocarla se
 * voltea y muestra la traducción. "Repasar otra vez" la manda al final;
 * "Ya me la sé" pasa a la siguiente. Se puede guardar en Mis palabras.
 */
export function Guia({
  parada,
  lecciones,
  inicial,
  nivel,
}: {
  parada: {
    clave: string;
    nombre: string;
    ciudad: string;
    titulo: string;
    portada: string;
    sello: LugarSello | null;
    numeroSello: number;
    ganado: boolean;
  };
  lecciones: LeccionGuia[];
  inicial: number;
  nivel: Nivel;
}) {
  const { decir, hablando } = useVoz(nivel);
  const primera = lecciones.find((l) => l.numero === inicial) ?? lecciones[0];
  const [leccion, setLeccion] = useState(primera?.numero ?? 1);
  const [cola, setCola] = useState(() => primera?.frases ?? []);
  const [sabidas, setSabidas] = useState(0);
  const [volteada, setVolteada] = useState(false);
  const [guardadas, setGuardadas] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);

  const actual = lecciones.find((l) => l.numero === leccion) ?? primera;
  const total = actual?.frases.length ?? 0;
  const frase = cola[0];

  function elegir(n: number) {
    const l = lecciones.find((x) => x.numero === n);
    if (!l) return;
    setLeccion(n);
    setCola(l.frases);
    setSabidas(0);
    setVolteada(false);
  }

  function siguiente(laSe: boolean) {
    setVolteada(false);
    setCola((c) => (laSe ? c.slice(1) : [...c.slice(1), c[0]]));
    if (laSe) setSabidas((n) => n + 1);
  }

  async function guardar() {
    if (!frase) return;
    setAviso(null);
    const r = await fetch("/api/glosario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: frase.en, contexto: frase.es }),
    }).catch(() => null);
    if (r?.ok) setGuardadas((g) => new Set(g).add(frase.en));
    else setAviso((await r?.json().catch(() => null))?.error ?? "No se pudo guardar. Intenta otra vez.");
  }

  // Al terminar: la lección siguiente (o la primera) para seguir repasando.
  const otra = lecciones.find((l) => l.numero > leccion && l.frases.length) ?? lecciones.find((l) => l.numero !== leccion && l.frases.length);

  if (!actual || !frase) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <Image src="/allison.png" alt="Allison" width={96} height={96} className="aro-allison bien size-24 rounded-full object-cover" />
        <h1 className="text-xl font-black">¡Repasaste todas las frases!</h1>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => elegir(leccion)} className="rounded-2xl border border-borde px-5 py-3 font-extrabold">
            Repasar otra vez
          </button>
          {otra && (
            <button type="button" onClick={() => elegir(otra.numero)} className="rounded-2xl border border-borde px-5 py-3 font-extrabold">
              Frases de la lección {otra.numero}
            </button>
          )}
          <Link href={`/ruta/${parada.clave}`} className="degradado-primario rounded-2xl px-5 py-3 font-extrabold text-white">
            Volver a {parada.ciudad}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-6 lg:min-h-dvh">
      <div className="flex items-center gap-3">
        <Link
          href={`/ruta/${parada.clave}`}
          aria-label="Volver"
          className="grid size-9 flex-none place-items-center rounded-full bg-superficie-2"
        >
          <Icono nombre="atras" className="size-5" />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <small className="text-[11px] font-extrabold tracking-[0.08em] text-primario uppercase">
            Guía de frases · {parada.nombre}
          </small>
          <b className="block text-xl font-black">{parada.ciudad}</b>
        </div>
        {parada.sello && <Estampilla lugar={parada.sello} numero={parada.numeroSello} className="block w-11 rotate-6" />}
      </div>

      {lecciones.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Lección">
          {lecciones.map((l) => (
            <button
              key={l.numero}
              type="button"
              role="tab"
              aria-selected={l.numero === leccion}
              onClick={() => elegir(l.numero)}
              className={`flex-none rounded-full px-3.5 py-1.5 text-[13px] font-extrabold ${
                l.numero === leccion ? "bg-primario text-white" : "border border-borde text-texto-suave"
              }`}
            >
              Lección {l.numero}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
        <span className="min-w-0 flex-1 truncate">
          Lección {actual.numero} · {actual.titulo}
        </span>
        <span className="text-primario">
          {Math.min(sabidas + 1, total)} de {total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-superficie-2">
        <div className="h-full rounded-full bg-menta transition-all" style={{ width: `${(sabidas / total) * 100}%` }} />
      </div>

      <button
        type="button"
        onClick={() => setVolteada((v) => !v)}
        className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-borde bg-superficie px-5 py-6 text-center shadow-[0_10px_30px_-18px_rgba(20,30,90,0.45)] transition"
        aria-label={volteada ? "Ver la frase en inglés" : "Voltear para ver qué significa"}
      >
        <span className="flex items-center gap-2 text-[13px] font-extrabold text-texto-suave">
          <Image
            src="/allison.png"
            alt=""
            width={36}
            height={36}
            className={`size-9 rounded-full object-cover ${hablando ? "aro-allison" : ""}`}
          />
          Allison la dice
        </span>
        {volteada ? (
          <>
            <b className="text-[28px] leading-tight font-black text-balance">{frase.es}</b>
            <span className="text-base font-bold text-texto-suave">{frase.en}</span>
          </>
        ) : (
          <>
            <b className="text-[28px] leading-tight font-black text-balance">{frase.en}</b>
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-texto-suave">
              <Icono nombre="voltear" className="size-4" />
              Toca para ver qué significa
            </span>
          </>
        )}
      </button>

      <div className="flex flex-wrap justify-center gap-2">
        <BotonOir onClick={() => void decir(frase.en)} texto="Oír" />
        <BotonOir onClick={() => void decir(frase.en, { lento: true })} texto="Lento" lento />
        <button
          type="button"
          onClick={guardar}
          disabled={guardadas.has(frase.en)}
          className="inline-flex items-center gap-1.5 rounded-full border border-borde px-3.5 py-2 text-[13px] font-extrabold disabled:text-menta"
        >
          <Icono nombre="guardar" className="size-4" />
          {guardadas.has(frase.en) ? "Guardada" : "Guardar en Mis palabras"}
        </button>
      </div>
      {aviso && <p className="text-center text-sm font-bold text-oro">{aviso}</p>}

      <div className="mt-auto grid grid-cols-2 gap-2.5">
        <button type="button" onClick={() => siguiente(false)} className="rounded-2xl border border-borde px-4 py-3.5 font-extrabold">
          Repasar otra vez
        </button>
        <button type="button" onClick={() => siguiente(true)} className="rounded-2xl bg-menta px-4 py-3.5 font-extrabold text-superficie">
          Ya me la sé
        </button>
      </div>
    </main>
  );
}
