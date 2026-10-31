"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import type { Expresion } from "@/lib/expresiones";
import type { EstadoDeRuta, LeccionEnMapa, ParadaEnMapa } from "@/lib/ruta/estado";
import { NOMBRE_CORTO } from "@/lib/ruta/nombres";
import { NIVELES, type Nivel } from "@/lib/tipos";
import { EncabezadoRuta, PAIS_DE_NIVEL } from "./Encabezado";
import { FraseDelDia } from "./FraseDelDia";
import { TarjetaAvisos } from "./TarjetaAvisos";
import { TarjetaSalon } from "./TarjetaSalon";
import type { SalonDelAlumno } from "@/lib/competencia/tabla";
import { selloDe } from "@/lib/ruta/sellos";
import { Estampilla, type LugarSello } from "./Estampilla";
import { Icono, IconoActividad, Estrellas } from "./Iconos";
import { MapaViaje } from "./MapaViaje";

/**
 * El mapa del viaje de cada nivel con ruta escrita (los que acepta rutaDe).
 * Una tabla en vez del ternario "B1 ? canada : A2 ? reino-unido : eeuu",
 * que hacía creer que MiRuta podía recibir otros niveles (auditoría, 30 de
 * octubre de 2026).
 */
const MAPA_DE_NIVEL: Partial<Record<Nivel, ComponentProps<typeof MapaViaje>["pais"]>> = {
  A1: "eeuu",
  A2: "reino-unido",
  B1: "canada",
};

/** Desplazamiento en zigzag de cada calcomanía, continuo a lo largo de todo el camino. */
const dx = (i: number) => Math.round(Math.sin(i * 0.75) * 58);

/** Una curva suave que pasa por el centro de cada calcomanía (Catmull-Rom). */
function curva(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function MiRuta({
  estado,
  nombre,
  racha,
  minutosHoy,
  metaMin,
  frase = null,
  repaso = null,
  salon = null,
}: {
  estado: EstadoDeRuta;
  nombre: string;
  racha: number;
  minutosHoy: number;
  metaMin: number;
  /** La frase del día, en el globo de Allison. */
  frase?: Expresion | null;
  /** Hay un repaso sorpresa para hoy (empezado o por empezar). */
  repaso?: { empezado: boolean } | null;
  /** La competencia por salón, si su salón compite. */
  salon?: SalonDelAlumno | null;
}) {
  const primerNombre = nombre.split(" ")[0];
  const sig = estado.siguiente;
  const caja = useRef<HTMLDivElement>(null);
  const [camino, setCamino] = useState<{ todo: string; hecho: string }>({ todo: "", hecho: "" });

  // El camino se dibuja midiendo dónde quedó cada calcomanía: los
  // separadores cambian de alto según el texto, y así la curva siempre
  // pasa por el centro.
  const dibujar = useCallback(() => {
    const r = caja.current;
    if (!r) return;
    const base = r.getBoundingClientRect();
    const nodos = [...r.querySelectorAll<HTMLElement>("[data-nodo]")];
    const pts = nodos.map((n) => {
      const q = n.getBoundingClientRect();
      return [q.left - base.left + q.width / 2, q.top - base.top + q.height / 2] as [number, number];
    });
    const iActual = nodos.findIndex((n) => n.dataset.nodo === "actual");
    setCamino({ todo: curva(pts), hecho: iActual > 0 ? curva(pts.slice(0, iActual + 1)) : "" });
  }, []);

  useLayoutEffect(() => {
    dibujar();
    const obs = new ResizeObserver(dibujar);
    if (caja.current) obs.observe(caja.current);
    return () => obs.disconnect();
  }, [dibujar]);

  // Al entrar, la lección actual queda a la vista.
  useEffect(() => {
    caja.current?.querySelector("[data-nodo=actual]")?.scrollIntoView({ block: "center" });
  }, []);

  // La frase del día y el mapa del viaje.
  const panel = (
    <>
      <TarjetaAvisos racha={racha} />
      {frase && <FraseDelDia frase={frase} nivel={estado.nivel} />}
      {salon && <TarjetaSalon salon={salon} />}

      {/* Sin condición de nivel: MiRuta solo se pinta con un EstadoDeRuta, y
          ese estado solo existe para los niveles con ruta escrita (rutaDe:
          A1, A2 y B1). El "si es A1, A2 o B1" que había aquí siempre se
          cumplía (auditoría, 30 de octubre de 2026). */}
      <details className="group overflow-hidden rounded-2xl border border-borde bg-superficie-2">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
          <span className="grid size-9 place-items-center rounded-xl bg-primario text-white">
            <Icono nombre="ruta" className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <b className="text-[15px] font-black">Mapa del viaje</b>
            <span className="text-xs font-bold text-texto-suave">
              {PAIS_DE_NIVEL[estado.nivel]} · {estado.sellos} de {estado.totalSellos} sellos
            </span>
          </span>
          <Icono nombre="abajo" className="size-5 transition group-open:rotate-180" />
        </summary>
        <div className="px-2 pb-2">
          <MapaViaje
            pais={MAPA_DE_NIVEL[estado.nivel] ?? "eeuu"}
            ciudades={estado.paradas
              .filter((p) => p.tipo === "parada")
              .map((p) => ({
                nombre: p.ciudad,
                estado: p.sello ? "ok" : p.estado === "en-curso" ? "on" : "",
              }))}
          />
        </div>
      </details>
    </>
  );

  // Dónde empieza cada parada en el zigzag: así el camino sigue de una a otra.
  const bases = estado.paradas.reduce<number[]>((b, _, k) => [...b, k === 0 ? 0 : b[k - 1] + estado.paradas[k - 1].lecciones.length + 1], []);

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-4 lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      <main className="flex w-full flex-col gap-3">
        <EncabezadoRuta nombre={nombre} nivel={estado.nivel} racha={racha} minutosHoy={minutosHoy} metaMin={metaMin} />

        {/* En el teléfono va arriba del camino; en el computador, en el panel de la derecha. */}
        <div className="flex flex-col gap-3 lg:hidden">{panel}</div>

        <div ref={caja} className="relative flex flex-col items-center gap-4 pt-2 pb-6">
          <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
            <path d={camino.todo} fill="none" stroke="var(--camino)" strokeWidth={12} strokeLinecap="round" />
            <path d={camino.hecho} fill="none" stroke="var(--estrella)" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
          </svg>

          {estado.paradas.map((p, k) => (
            <TramoParada key={p.clave} p={p} siguiente={sig} primerNombre={primerNombre} base={bases[k]} />
          ))}

          {estado.completa && <PasarDeNivel nivel={estado.nivel} />}
        </div>
        {/* El repaso sorpresa: una tarjeta al final de Mi ruta (en el computador, en el panel). */}
        {repaso && (
          <div className="pb-6 lg:hidden">
            <TarjetaRepaso empezado={repaso.empezado} />
          </div>
        )}
      </main>
      <aside className="sticky top-4 hidden flex-col gap-3 lg:flex" aria-label="Para hoy">
        {repaso && <TarjetaRepaso empezado={repaso.empezado} />}
        {panel}
      </aside>
    </div>
  );
}

function TramoParada({
  p,
  siguiente,
  primerNombre,
  base,
}: {
  p: ParadaEnMapa;
  siguiente: EstadoDeRuta["siguiente"];
  primerNombre: string;
  /** La posición de su primera calcomanía en todo el camino. */
  base: number;
}) {
  const sello = selloDe(p) as LugarSello | null;
  const enCurso = p.estado === "en-curso";
  const saltada = p.estado === "saltada";
  const href = `/ruta/${p.clave}`;

  return (
    <>
      <div
        className={`relative z-[1] mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 self-stretch rounded-full px-3 py-1.5 text-center ${
          enCurso ? "bg-gradient-to-br from-[#4a5be6] to-[#7c4dd8] text-white" : "bg-superficie"
        }`}
      >
        <span
          className={`text-[11px] font-black tracking-[0.08em] uppercase ${
            enCurso ? "text-white" : p.sello ? "text-[#c98a0c]" : saltada ? "text-morado" : "text-texto-suave"
          }`}
        >
          {p.nombre} · {p.ciudad}
        </span>
        <em className={`text-[13px] font-extrabold not-italic ${enCurso ? "text-white" : "text-texto-suave"}`}>{p.titulo}</em>
        {enCurso && (
          <Link
            href={`${href}/guia`}
            className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-xs font-extrabold text-white"
          >
            <Icono nombre="libro" className="size-3.5" />
            Guía
          </Link>
        )}
        {saltada && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-morado-suave px-2 py-0.5 text-xs font-extrabold text-morado">
            <Icono nombre="salta" className="size-3.5" />
            Saltada
          </span>
        )}
        {p.puedeSaltar && (
          <Link
            href={`${href}/escenario?salto=1`}
            className="inline-flex items-center gap-1 rounded-lg bg-morado-suave px-2 py-0.5 text-xs font-extrabold text-morado"
          >
            <Icono nombre="salta" className="size-3.5" />
            ¿Ya lo sabes? Salta hasta aquí
          </Link>
        )}
      </div>

      {p.lecciones.map((l) => (
        <NodoLeccion
          key={l.numero}
          l={l}
          href={`${href}?leccion=${l.numero}`}
          dx={dx(base + l.numero - 1)}
          actual={siguiente?.parada === p.clave && siguiente.leccion === l.numero}
          primerNombre={primerNombre}
        />
      ))}

      <NodoEscenario
        p={p}
        sello={sello}
        dx={dx(base + p.lecciones.length)}
        actual={siguiente?.parada === p.clave && siguiente.leccion === "escenario"}
        primerNombre={primerNombre}
      />
    </>
  );
}

/** Allison junto al nodo actual, del lado donde hay espacio (el contrario al corrimiento del camino). */
/** La tarjeta del repaso sorpresa (pantalla 9 se abre desde aquí). */
function TarjetaRepaso({ empezado }: { empezado: boolean }) {
  return (
    <Link
      href="/ruta/repaso"
      className="flex items-center gap-3 rounded-3xl border-2 border-oro bg-oro-suave px-4 py-3 text-oro transition hover:brightness-105"
    >
      <span className="grid size-12 flex-none place-items-center rounded-2xl bg-gradient-to-br from-[#ffd36b] to-[#f5a623] text-white shadow-sm">
        <Icono nombre="regalo" className="size-6" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <b className="block text-[16px] font-black text-texto">Repaso sorpresa</b>
        <span className="text-[13px] font-semibold">Con lo que fallaste esta semana · gana 1 estrella</span>
      </span>
      <span className="rounded-full bg-oro px-3 py-1.5 text-[13px] font-extrabold text-superficie">{empezado ? "Seguir" : "Abrir"}</span>
    </Link>
  );
}

/** Completó todo el nivel: el botón para pasar al siguiente (la regla la revisa el servidor). */
function PasarDeNivel({ nivel }: { nivel: EstadoDeRuta["nivel"] }) {
  const siguiente = NIVELES[NIVELES.findIndex((n) => n.nivel === nivel) + 1]?.nivel;
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pasar() {
    if (!siguiente) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/nivel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivel: siguiente }),
        signal: AbortSignal.timeout(20_000),
      });
      if (r.ok) {
        router.refresh();
        return;
      }
      const d = await r.json().catch(() => ({}));
      setError(d.mensaje ?? "No pudimos cambiar tu nivel. Intenta otra vez.");
    } catch {
      setError("Sin conexión. Revisa tu internet e intenta otra vez.");
    }
    setEnviando(false);
  }

  return (
    <div className="relative z-[1] flex flex-col items-center gap-2.5 rounded-3xl bg-menta-suave px-4 py-4 text-center text-menta">
      <b className="text-base font-black">¡Completaste todo {nivel}!</b>
      {siguiente ? (
        <>
          <button
            type="button"
            onClick={() => void pasar()}
            disabled={enviando}
            className="degradado-primario sombra-accion rounded-2xl px-6 py-3 font-extrabold text-white disabled:opacity-60"
          >
            {enviando ? "Un momento…" : `Pasar a ${siguiente}`}
          </button>
          {error && <span className="text-sm font-bold text-oro">{error}</span>}
        </>
      ) : (
        <span className="text-sm font-semibold">Llegaste al nivel más alto. ¡Felicitaciones!</span>
      )}
    </div>
  );
}

function Mascota({ primerNombre, dx }: { primerNombre: string; dx: number }) {
  return (
    <span
      className={`absolute top-1/2 flex -translate-y-1/3 flex-col items-center gap-1 ${
        dx < 0 ? "left-[calc(100%+22px)]" : "right-[calc(100%+22px)]"
      }`}
    >
      <Image
        src="/allison.png"
        alt=""
        width={56}
        height={56}
        className="size-14 rounded-full object-cover outline-[3px] outline-offset-2 outline-morado outline"
      />
      <span className="rounded-lg bg-morado px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap text-white">
        ¡Vamos, {primerNombre}!
      </span>
    </span>
  );
}

function NodoLeccion({
  l,
  href,
  dx,
  actual,
  primerNombre,
}: {
  l: LeccionEnMapa;
  href: string;
  dx: number;
  actual: boolean;
  primerNombre: string;
}) {
  const bloqueada = l.estado === "bloqueada";
  const hecha = l.estado === "hecha";
  const clase = `calco act-${l.principal} ${actual ? "actual" : hecha ? "hecha" : bloqueada ? "bloqueada" : ""}`;
  const contenido = (
    <>
      <IconoActividad tipo={l.principal} />
      {hecha && (
        <span className="absolute -right-1.5 -bottom-1 grid size-[26px] place-items-center rounded-full border-[3px] border-superficie bg-[#1fae7a] text-white">
          <Icono nombre="check" className="size-3.5 stroke-[3.4]" />
        </span>
      )}
      {bloqueada && (
        <span className="absolute -right-1.5 -bottom-1 grid size-[26px] place-items-center rounded-full border-[3px] border-superficie bg-[#8a93b4] text-white">
          <Icono nombre="candado" className="size-3.5 stroke-[3]" />
        </span>
      )}
    </>
  );

  return (
    <div className={`relative z-[1] flex flex-col items-center ${actual ? "mt-14" : ""}`} style={{ transform: `translateX(${dx}px)` }}>
      {actual && (
        <Link
          href={href}
          className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 rounded-xl border-2 border-[#4a5be6] bg-superficie px-3 py-1.5 text-center text-xs leading-tight font-bold whitespace-nowrap text-texto-suave shadow-[0_4px_0_#2f3db0]"
        >
          Lección {l.numero} · {NOMBRE_CORTO[l.actividades[l.paso] ?? l.principal]}
          <br />
          <b className="text-sm font-black tracking-wide text-[#4a5be6] uppercase">Continuar</b>
        </Link>
      )}
      {actual && <Mascota primerNombre={primerNombre} dx={dx} />}
      {bloqueada ? (
        <span data-nodo={actual ? "actual" : "nodo"} className={clase} aria-label={`Lección ${l.numero}: ${l.titulo}. Bloqueada`}>
          {contenido}
        </span>
      ) : (
        <Link
          href={href}
          data-nodo={actual ? "actual" : "nodo"}
          className={clase}
          aria-label={`Lección ${l.numero}: ${l.titulo}${hecha ? `. Hecha, ${l.estrellas} estrellas` : ""}`}
        >
          {contenido}
        </Link>
      )}
      {hecha && (
        <span className="mt-2.5">
          <Estrellas n={l.estrellas} className="size-3.5" />
        </span>
      )}
    </div>
  );
}

function NodoEscenario({
  p,
  sello,
  dx,
  actual,
  primerNombre,
}: {
  p: ParadaEnMapa;
  sello: LugarSello | null;
  dx: number;
  actual: boolean;
  primerNombre: string;
}) {
  const e = p.escenario;
  const abierto = e.estado !== "bloqueado";
  const contenido = (
    <>
      {sello && (
        <Estampilla
          lugar={sello}
          numero={p.numeroSello}
          className={`block w-[42px] -rotate-[4deg] drop-shadow-[0_2px_3px_rgba(90,60,10,0.3)] ${p.sello ? "" : "opacity-45"}`}
        />
      )}
      {!abierto && (
        <span className="absolute -right-1.5 -bottom-1 grid size-[26px] place-items-center rounded-full border-[3px] border-superficie bg-[#8a93b4] text-white">
          <Icono nombre="candado" className="size-3.5 stroke-[3]" />
        </span>
      )}
    </>
  );
  return (
    <div className={`relative z-[1] flex flex-col items-center ${actual ? "mt-14" : ""}`} style={{ transform: `translateX(${dx}px)` }}>
      {actual && (
        <Link
          href={`/ruta/${p.clave}/escenario`}
          className="absolute bottom-[calc(100%+30px)] left-1/2 -translate-x-1/2 rounded-xl border-2 border-[#4a5be6] bg-superficie px-3 py-1.5 text-center text-xs leading-tight font-bold whitespace-nowrap text-texto-suave shadow-[0_4px_0_#2f3db0]"
        >
          Escenario de {p.ciudad}
          <br />
          <b className="text-sm font-black tracking-wide text-[#4a5be6] uppercase">Continuar</b>
        </Link>
      )}
      {actual && <Mascota primerNombre={primerNombre} dx={dx} />}
      <span className="mb-1 text-[10.5px] font-black tracking-[0.06em] text-oro uppercase">{p.sello ? "Sello ganado" : "Escenario"}</span>
      {abierto ? (
        <Link
          href={`/ruta/${p.clave}/escenario`}
          data-nodo={actual ? "actual" : "nodo"}
          className={`calco escena ${actual ? "actual" : ""}`}
          aria-label={`Escenario de ${p.ciudad}${p.sello ? `. Sello ganado, ${e.estrellas} estrellas` : ""}`}
        >
          {contenido}
        </Link>
      ) : (
        <span data-nodo="nodo" className="calco escena" aria-label={`Escenario de ${p.ciudad}. Bloqueado`}>
          {contenido}
        </span>
      )}
    </div>
  );
}
