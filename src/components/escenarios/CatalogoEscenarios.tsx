"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Estrella, Estrellas, Icono } from "@/components/ruta/Iconos";
import { CATEGORIAS, ESTILO_CATEGORIA, rutaDeEscenario, type Categoria, type TarjetaEscenario } from "@/lib/escenarios/categorias";

/** Ideas para el escenario propio (se tocan y quedan escritas). */
const IDEAS = ["Comprar boletas para un concierto", "Ir al cine", "Cortarme el pelo", "Comprar ropa", "Pedir una pizza por teléfono"];

const sinTildes = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Escenarios (pantalla 5, aprobada el 14 de octubre de 2026): el título
 * con la lupa y las estrellas ganadas aquí; el recomendado en una tarjeta
 * compacta; "Crea tu propio escenario", plegado; las categorías con su
 * color y el catálogo en tarjetas iguales (calcomanía, nombre, lugar y
 * estrellas o "Nuevo"; el nivel solo en las que aún no se abren).
 */
export function CatalogoEscenarios({ tarjetas, saldo }: { tarjetas: TarjetaEscenario[]; saldo: number }) {
  const [categoria, setCategoria] = useState<Categoria | "Todos">("Todos");
  const [buscando, setBuscando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const estrellas = tarjetas.reduce((n, t) => n + t.estrellas, 0);
  const recomendado =
    tarjetas.find((t) => t.abierto && t.veces === 0 && t.categoria !== "Míos") ??
    [...tarjetas].filter((t) => t.abierto).sort((a, b) => a.estrellas - b.estrellas)[0] ??
    null;

  const visibles = useMemo(() => {
    const q = sinTildes(busqueda.trim());
    return tarjetas.filter(
      (t) =>
        (categoria === "Todos" || t.categoria === categoria) &&
        (!q || sinTildes(`${t.titulo} ${t.lugar}`).includes(q))
    );
  }, [busqueda, categoria, tarjetas]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pt-5 pb-6 lg:max-w-3xl">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] leading-tight font-black">Escenarios</h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-oro-suave px-3 py-1 text-[13px] font-extrabold text-oro" title="Estrellas en Escenarios">
            <Estrella llena className="size-4" />
            {estrellas}
          </span>
          <button
            type="button"
            onClick={() => {
              setBuscando((b) => !b);
              setBusqueda("");
            }}
            aria-label="Buscar un lugar"
            aria-expanded={buscando}
            className="grid size-10 place-items-center rounded-full border border-borde hover:bg-superficie-2"
          >
            <Icono nombre={buscando ? "cerrar" : "lupa"} className="size-5" />
          </button>
        </div>
      </header>

      {buscando && (
        <input
          autoFocus
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Busca un lugar: hotel, cine, banco…"
          aria-label="Buscar un escenario"
          className="rounded-2xl border border-borde bg-superficie px-4 py-3 text-base outline-none focus:border-primario"
        />
      )}

      {recomendado && !busqueda && <Recomendado t={recomendado} />}

      <CreaTuPropio saldo={saldo} />

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Categorías">
        {(["Todos", ...CATEGORIAS] as const).map((c) => {
          const on = categoria === c;
          const estilo = c === "Todos" ? null : ESTILO_CATEGORIA[c];
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setCategoria(c)}
              className={`inline-flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-extrabold whitespace-nowrap ${
                on ? "bg-primario text-white" : estilo ? `${estilo.clase} bg-[var(--kf)] text-[var(--k2)]` : "bg-superficie-2"
              }`}
            >
              {estilo && <Icono nombre={estilo.icono} className="size-4" />}
              {c}
            </button>
          );
        })}
      </div>

      {visibles.length ? (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {visibles.map((t) => (
            <li key={t.clave} className="flex">
              <Tarjeta t={t} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-superficie-2 px-4 py-6 text-center text-sm font-semibold text-texto-suave">
          {categoria === "Míos" && !busqueda
            ? "Aún no tienes escenarios propios. Crea uno arriba: tú eliges el lugar."
            : "No hay escenarios con ese nombre. Prueba otro lugar, o créalo tú."}
        </p>
      )}
    </main>
  );
}

function Recomendado({ t }: { t: TarjetaEscenario }) {
  const estilo = ESTILO_CATEGORIA[t.categoria];
  return (
    <section
      className={`${estilo.clase} flex flex-col gap-2.5 rounded-3xl bg-gradient-to-br from-[var(--k1)] to-[color-mix(in_srgb,var(--k1)_55%,#1e1b4b)] p-3.5 text-white shadow-[0_10px_18px_-12px_var(--k1)]`}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-2xl bg-white/25">
          <Icono nombre={estilo.icono} className="size-6" />
        </span>
        <div className="min-w-0 leading-tight">
          <small className="text-[10.5px] font-black tracking-[0.07em] uppercase opacity-90">Recomendado para ti</small>
          <b className="block text-[18px] font-black">{t.titulo}</b>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Image src="/allison.png" alt="" width={34} height={34} className="size-[34px] flex-none rounded-full border-2 border-white object-cover" />
        <span className="min-w-0 flex-1 text-[13px] leading-tight font-bold">
          {t.papelCorto}
          <br />
          {t.tareas} tareas · 5 min
        </span>
        <Link href={`/escenarios/${t.ruta}`} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#1e1b4b]">
          Practicar
        </Link>
      </div>
    </section>
  );
}

function Tarjeta({ t }: { t: TarjetaEscenario }) {
  const estilo = ESTILO_CATEGORIA[t.categoria];
  const contenido = (
    <>
      <span className={`relative grid h-[76px] place-items-center overflow-hidden ${t.abierto ? "bg-[var(--kf)]" : "bg-superficie-2"}`}>
        {t.imagen ? (
          <Image
            src={`/ilustraciones/a1/${t.imagen}.webp`}
            alt=""
            fill
            sizes="200px"
            className={`object-cover ${t.abierto ? "" : "opacity-40 grayscale"}`}
          />
        ) : (
          <Icono nombre={estilo.icono} className="absolute -top-2 -right-2 size-20 text-[var(--k2)] opacity-15" />
        )}
        <span
          className={`relative grid size-10 place-items-center rounded-full border-[3px] border-superficie bg-[var(--kf)] text-[var(--k2)] shadow ${
            t.abierto ? "" : "opacity-60 grayscale"
          }`}
        >
          <Icono nombre={estilo.icono} className="size-5" />
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-0.5 px-2.5 pt-2 pb-2.5 text-left">
        <b className={`text-[13.5px] leading-tight font-black ${t.abierto ? "" : "opacity-60"}`}>{t.titulo}</b>
        <small className={`text-[11.5px] font-bold text-texto-suave ${t.abierto ? "" : "opacity-60"}`}>{t.lugar}</small>
        <span className="mt-auto pt-1">
          {!t.abierto ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-extrabold text-texto-suave">
              <Icono nombre="candado" className="size-3.5" />
              Desde {t.nivelMinimo}
            </span>
          ) : t.veces > 0 ? (
            <Estrellas n={t.estrellas} className="size-3.5" />
          ) : (
            <span className="rounded-full bg-primario-suave px-2 py-0.5 text-[11px] font-extrabold text-primario">Nuevo</span>
          )}
        </span>
      </span>
    </>
  );
  const clase = `${estilo.clase} flex w-full min-w-0 flex-col overflow-hidden rounded-[18px] border-[1.5px] border-borde bg-superficie`;
  return t.abierto ? (
    <Link href={`/escenarios/${t.ruta}`} className={`${clase} transition hover:border-[var(--k1)]`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase} aria-disabled>
      {contenido}
    </div>
  );
}

/**
 * "Crea tu propio escenario", plegado: el alumno escribe el lugar y qué
 * quiere hacer (o toca una idea) y Allison arma la escena a su nivel. Usa
 * una intervención y queda en "Míos".
 */
function CreaTuPropio({ saldo }: { saldo: number }) {
  const router = useRouter();
  const [pedido, setPedido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const t = pedido.trim();
    if (t.length < 3 || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/escenarios/propio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido: t }),
        signal: AbortSignal.timeout(30_000),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.clave) {
        router.push(`/escenarios/${rutaDeEscenario(d.clave)}`);
        return;
      }
      setError(d.mensaje ?? "No pudimos crear el escenario. Intenta otra vez.");
    } catch {
      setError("Sin conexión. Revisa tu internet e intenta otra vez.");
    }
    setEnviando(false);
  }

  return (
    <details className="group cat-ciudad overflow-hidden rounded-3xl border-[1.5px] border-borde">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="grid size-10 flex-none place-items-center rounded-full bg-[var(--kf)] text-[var(--k2)]">
          <Icono nombre="chispa" className="size-5" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <b className="block text-[15px] font-black">Crea tu propio escenario</b>
          <span className="text-[12.5px] font-semibold text-texto-suave">Tú eliges el lugar y la situación</span>
        </span>
        <Icono nombre="abajo" className="size-5 transition group-open:rotate-180" />
      </summary>
      <form onSubmit={crear} className="flex flex-col gap-2.5 px-3.5 pb-3.5">
        <div className="flex items-center gap-2">
          <input
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
            maxLength={160}
            placeholder="Ej.: comprar boletas para un concierto"
            aria-label="¿Dónde estás y qué quieres hacer?"
            className="min-w-0 flex-1 rounded-2xl border border-borde bg-superficie px-4 py-3 text-base outline-none focus:border-primario"
          />
          <button
            type="submit"
            disabled={enviando || pedido.trim().length < 3}
            aria-label="Crear el escenario"
            className="grid size-12 flex-none place-items-center rounded-full bg-primario text-white disabled:opacity-40"
          >
            {enviando ? (
              <span className="flex gap-0.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 rounded-full bg-white" style={{ animation: "pulso-voz 1s ease-in-out infinite", animationDelay: `${i * 0.16}s` }} />
                ))}
              </span>
            ) : (
              <Icono nombre="enviar" className="size-5" />
            )}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <small className="text-xs font-extrabold text-texto-suave">Ideas:</small>
          {IDEAS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPedido(i)}
              className="rounded-full bg-superficie-2 px-2.5 py-1 text-xs font-bold hover:bg-primario-suave"
            >
              {i}
            </button>
          ))}
        </div>
        <span className="text-[12px] font-semibold text-texto-suave">
          Allison arma la escena a tu nivel, con 3 tareas. Crearla usa 1 intervención (tienes {saldo}).
        </span>
        {error && (
          <p role="alert" className="text-sm font-bold text-oro">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}
