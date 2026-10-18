"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Actividad } from "@/lib/ruta/tipos";
import { Estampilla, type LugarSello } from "../Estampilla";
import { Estrella, Icono } from "../Iconos";
import { sonar } from "@/lib/sonidos";
import { terminar, type Contexto, type FinActividad } from "./api";
import { Adivina } from "./Adivina";
import { Cuentame } from "./Cuentame";
import { Describe } from "./Describe";
import { Dilo } from "./Dilo";
import { Ensenale } from "./Ensenale";
import { Entrevista } from "./Entrevista";
import { EscuchaElige } from "./EscuchaElige";
import { Narra } from "./Narra";
import { QueEsEsto } from "./QueEsEsto";
import { Repite } from "./Repite";
import { Responde } from "./Responde";
import { TuTurno } from "./TuTurno";

export interface DatosLeccion {
  parada: string;
  numero: number;
  titulo: string;
  actividades: Actividad[];
  /** Por dónde va (actividades terminadas del intento en curso). */
  pasoInicial: number;
  ciudad: string;
  sello: LugarSello | null;
  numeroSello: number;
  /** Lecciones hechas de la parada antes de esta, y cuántas hay. */
  hechas: number;
  total: number;
  /** Adónde lleva "Seguir": la lección siguiente o el escenario. */
  siguiente: { href: string; texto: string };
}

type FinLeccion = { estrellas: number; nuevas: number; racha: number; minutosHoy: number };

/**
 * Una lección: sus tres actividades seguidas, con la barra de avance
 * arriba, y al final la celebración (pantalla 15). Lo que el alumno no
 * logró ni con las pistas vuelve a salir al final de la misma lección
 * (plan, sección 5), sin calificar.
 */
export function Leccion({
  datos,
  ctx,
  primera = false,
}: {
  datos: DatosLeccion;
  ctx: Omit<Contexto, "parada" | "leccion">;
  /** Primera sesión guiada: solo la primera actividad, y a Mi ruta. */
  primera?: boolean;
}) {
  const router = useRouter();
  const contexto: Contexto = { ...ctx, parada: datos.parada, leccion: datos.numero };
  const inicial = primera ? 0 : Math.min(datos.pasoInicial, datos.actividades.length - 1);
  const [indice, setIndice] = useState(inicial);
  const [repasos, setRepasos] = useState<number[]>([]);
  const [enRepaso, setEnRepaso] = useState<number | null>(null);
  const [fin, setFin] = useState<FinLeccion | null>(null);
  const [primeraLista, setPrimeraLista] = useState(false);
  const [sinSaldo, setSinSaldo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  /** No se pudo guardar una actividad: se reintenta antes de seguir. */
  const [sinGuardar, setSinGuardar] = useState<{ f: FinActividad; segundos: number } | null>(null);
  const desde = useRef(0);
  const ultimoFin = useRef<FinLeccion | null>(null);

  // El tiempo de cada actividad cuenta para la meta de hoy.
  useEffect(() => {
    desde.current = Date.now();
  }, []);

  const total = datos.actividades.length;
  const a = enRepaso !== null ? datos.actividades[enRepaso] : datos.actividades[indice];

  const alTerminar = useCallback(
    async (f: FinActividad) => {
      // Los repasos del final no se califican ni se vuelven a guardar.
      if (enRepaso !== null) {
        const resto = repasos.slice(1);
        setRepasos(resto);
        if (resto.length) setEnRepaso(resto[0]);
        else {
          setEnRepaso(null);
          setFin(ultimoFin.current);
        }
        return;
      }
      // Tope de 10 minutos por actividad: una pestaña olvidada no es práctica
      // (y el servidor no acepta más de una hora).
      const segundos = Math.min(600, (Date.now() - desde.current) / 1000);
      desde.current = Date.now();
      await guardar(f, segundos);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, enRepaso, indice, primera, repasos, total]
  );

  async function guardar(f: FinActividad, segundos: number) {
    setGuardando(true);
    setSinGuardar(null);
    const r = await terminar(contexto, a.paso, { ...f, segundos, primera });
    setGuardando(false);
    if (!r) {
      // Sin guardar no se sigue: la lección no puede parecer completa si
      // el servidor no la anotó.
      setSinGuardar({ f, segundos });
      return;
    }

    if (primera) {
      setPrimeraLista(true);
      return;
    }
    // Lo que se falló en las actividades de una sola respuesta vuelve al final.
    const vuelve = f.fallos.length && (a.tipo === "que-es-esto" || a.tipo === "dilo" || a.tipo === "repite") ? [indice] : [];
    const nuevosRepasos = [...repasos, ...vuelve];
    if (indice + 1 < total) {
      setRepasos(nuevosRepasos);
      setIndice(indice + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    const resultado = r;
    ultimoFin.current = resultado;
    if (nuevosRepasos.length) {
      setRepasos(nuevosRepasos);
      setEnRepaso(nuevosRepasos[0]);
      window.scrollTo({ top: 0 });
    } else setFin(resultado);
  }

  /** "Repetir para subir estrellas": la misma lección desde la primera actividad. */
  function repetir() {
    setIndice(0);
    setRepasos([]);
    setEnRepaso(null);
    setFin(null);
    desde.current = Date.now();
    window.scrollTo({ top: 0 });
  }

  if (primeraLista) return <PrimeraEstrella nombre={ctx.nombre} nivel={ctx.nivel} />;
  if (fin) return <Celebracion datos={datos} fin={fin} nombre={ctx.nombre} onRepetir={repetir} />;

  const avance = enRepaso !== null ? 1 : indice / total;
  const comun = { ctx: contexto, onTerminar: alTerminar, onSinSaldo: () => setSinSaldo(true) };
  const clave = `${enRepaso ?? indice}-${enRepaso !== null ? "r" : "a"}`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
        <button
          type="button"
          onClick={() => router.push(`/ruta/${datos.parada}?leccion=${datos.numero}`)}
          aria-label="Salir de la lección"
          className="grid size-9 place-items-center rounded-full hover:bg-superficie-2"
        >
          <Icono nombre="cerrar" className="size-5" />
        </button>
        <div className="h-2 flex-1 rounded-full bg-superficie-2">
          <div className="h-full rounded-full bg-menta transition-all" style={{ width: `${Math.max(6, avance * 100)}%` }} />
        </div>
        {enRepaso !== null ? "Repaso" : `${indice + 1} de ${total}`}
      </div>
      {enRepaso !== null && (
        <p className="rounded-2xl bg-oro-suave px-4 py-2 text-center text-sm font-bold text-oro">Una vez más: esta se te escapó.</p>
      )}

      <div className={guardando ? "pointer-events-none opacity-60" : ""}>
        {a.tipo === "escucha-elige" && <EscuchaElige key={clave} a={a} {...comun} />}
        {a.tipo === "que-es-esto" && <QueEsEsto key={clave} a={a} {...comun} />}
        {a.tipo === "repite" && <Repite key={clave} a={a} {...comun} />}
        {a.tipo === "tu-turno" && <TuTurno key={clave} a={a} {...comun} />}
        {a.tipo === "dilo" && <Dilo key={clave} a={a} {...comun} />}
        {a.tipo === "describe" && <Describe key={clave} a={a} {...comun} />}
        {a.tipo === "responde" && <Responde key={clave} a={a} {...comun} />}
        {a.tipo === "entrevista" && <Entrevista key={clave} a={a} {...comun} />}
        {a.tipo === "adivina" && <Adivina key={clave} a={a} {...comun} />}
        {a.tipo === "cuentame" && <Cuentame key={clave} a={a} {...comun} />}
        {a.tipo === "narra" && <Narra key={clave} a={a} {...comun} />}
        {a.tipo === "ensenale" && <Ensenale key={clave} a={a} {...comun} />}
      </div>

      {sinGuardar && (
        <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-oro-suave px-4 py-3 text-oro">
          <b className="font-black">No se guardó tu avance</b>
          <span className="text-sm font-semibold">Revisa tu conexión. Lo que hiciste sigue aquí.</span>
          <button
            type="button"
            onClick={() => void guardar(sinGuardar.f, sinGuardar.segundos)}
            disabled={guardando}
            className="rounded-xl bg-oro px-4 py-2.5 font-extrabold text-superficie disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Reintentar"}
          </button>
        </div>
      )}

      {sinSaldo && <SinSaldo tipo={a.tipo} onCerrar={() => setSinSaldo(false)} salir={`/ruta/${datos.parada}?leccion=${datos.numero}`} />}
    </main>
  );
}

/** Lo que explica la hoja de "sin intervenciones" en las actividades donde escribir también gasta. */
const GASTA_ESCRITO: Partial<Record<Actividad["tipo"], string>> = {
  entrevista: "En la Entrevista conversas con Allison: cada pregunta usa una intervención, también escrita. Recarga para seguir.",
  adivina: "En Adivina cada pregunta a Allison usa una intervención, también escrita. Recarga para seguir.",
  cuentame: "Cada relato que Allison escucha o lee usa una intervención, también escrito. Recarga para seguir.",
  narra: "Cada historia que Allison escucha o lee usa una intervención, también escrita. Recarga para seguir.",
  ensenale: "En Enséñale a Allison cada respuesta usa una intervención, también escrita. Recarga para seguir.",
};

/** Se quedó sin intervenciones a mitad de una actividad. */
function SinSaldo({ onCerrar, tipo, salir }: { onCerrar: () => void; tipo: Actividad["tipo"]; salir: string }) {
  const conversa = GASTA_ESCRITO[tipo];
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="sin-saldo">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-t-3xl bg-superficie p-5 sm:rounded-3xl">
        <h2 id="sin-saldo" className="text-lg font-black">
          Te quedaste sin intervenciones
        </h2>
        <p className="text-sm text-texto-suave">
          {conversa
            ? conversa
            : "Comprobar lo que dices con la voz usa intervenciones. Puedes recargar, o escribir tus respuestas con el teclado: escritas no gastan intervenciones (menos en Responde rápido)."}
        </p>
        <Link href="/recargar" className="degradado-primario rounded-2xl px-5 py-3 text-center font-extrabold text-white">
          Recargar intervenciones
        </Link>
        {conversa ? (
          <Link href={salir} className="rounded-2xl border border-borde px-5 py-3 text-center font-extrabold">
            Salir de la lección
          </Link>
        ) : (
          <button type="button" autoFocus onClick={onCerrar} className="rounded-2xl border border-borde px-5 py-3 font-extrabold">
            Seguir escribiendo
          </button>
        )}
      </div>
    </div>
  );
}

/** Pantalla 15: estrellas grandes sobre Allison, lo que ganó hoy y la próxima meta. */
function Celebracion({ datos, fin, nombre, onRepetir }: { datos: DatosLeccion; fin: FinLeccion; nombre: string; onRepetir: () => void }) {
  useEffect(() => sonar("logro"), []);
  const hechas = Math.min(datos.total, datos.hechas + 1);
  const faltan = datos.total - hechas;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
        <Link href="/ruta" aria-label="Volver a Mi ruta" className="grid size-9 place-items-center rounded-full hover:bg-superficie-2">
          <Icono nombre="cerrar" className="size-5" />
        </Link>
        <span className="flex-1">
          Lección {datos.numero} de {datos.total}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 bg-[radial-gradient(160px_110px_at_50%_62%,var(--menta-suave),transparent_72%)] pt-1">
        <div className="flex items-end gap-1">
          <Estrella llena={fin.estrellas >= 1} className="size-10" />
          <Estrella llena={fin.estrellas >= 2} className="-mt-2.5 size-13" />
          <Estrella llena={fin.estrellas >= 3} className="size-10" />
        </div>
        <Image src="/allison.png" alt="Allison" width={104} height={104} className="aro-allison bien size-[104px] rounded-full object-cover" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-black">¡Lección {datos.numero} completa!</h1>
        <p className="text-sm font-semibold text-texto-suave">Allison: &ldquo;Great job, {nombre.split(" ")[0]}!&rdquo;</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-texto-suave">
        <div className="rounded-2xl bg-oro-suave px-1 py-2.5">
          <b className="block text-2xl leading-tight font-black text-oro">+{fin.nuevas}</b>
          estrellas
        </div>
        <div className="rounded-2xl bg-primario-suave px-1 py-2.5">
          <b className="block text-2xl leading-tight font-black text-primario">{fin.racha}</b>
          {fin.racha === 1 ? "día seguido" : "días seguidos"}
        </div>
        <div className="rounded-2xl bg-menta-suave px-1 py-2.5">
          <b className="block text-2xl leading-tight font-black text-menta">{fin.minutosHoy}</b>
          minutos hoy
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-3xl border-[1.5px] border-borde px-3.5 py-2.5">
        {datos.sello && (
          <Estampilla lugar={datos.sello} numero={datos.numeroSello} className="block w-[52px] flex-none -rotate-6 opacity-75" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <small className="text-[11px] font-extrabold tracking-[0.06em] text-oro uppercase">Tu próxima meta</small>
          <b className="text-[17px] leading-tight font-black">
            {faltan > 0 ? `Te ${faltan === 1 ? "falta 1 lección" : `faltan ${faltan} lecciones`} y el escenario` : "Solo falta el escenario"}
          </b>
          <div className="my-1 h-2 rounded-full bg-superficie-2">
            <div className="h-full rounded-full bg-oro" style={{ width: `${(hechas / (datos.total + 1)) * 100}%` }} />
          </div>
          <span className="text-[12.5px] font-semibold text-texto-suave">Para la estampilla de {datos.ciudad}</span>
        </div>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3">
        <Link href={datos.siguiente.href} className="degradado-primario sombra-accion w-full rounded-2xl px-5 py-4 text-center text-base font-extrabold text-white">
          {datos.siguiente.texto}
        </Link>
        <button type="button" onClick={onRepetir} className="text-sm font-extrabold text-primario">
          Repetir para subir estrellas
        </button>
      </div>
    </main>
  );
}

/** Primera sesión: la primera actividad da la primera estrella y lleva a Mi ruta. */
function PrimeraEstrella({ nombre, nivel }: { nombre: string; nivel: string }) {
  const pais = nivel === "B1" ? "Canadá" : nivel === "A2" ? "el Reino Unido" : "Estados Unidos";
  useEffect(() => sonar("logro"), []);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <Estrella llena className="size-20" />
      <Image src="/allison.png" alt="Allison" width={104} height={104} className="aro-allison bien size-[104px] rounded-full object-cover" />
      <div>
        <h1 className="text-2xl font-black text-balance">¡Tu primera estrella, {nombre.split(" ")[0]}!</h1>
        <p className="mt-1 text-texto-suave">Allison: &ldquo;Great start!&rdquo; Tu viaje por {pais} ya empezó.</p>
      </div>
      <Link href="/ruta" className="degradado-primario sombra-accion w-full rounded-2xl px-5 py-4 font-extrabold text-white">
        Ver mi ruta
      </Link>
    </main>
  );
}
