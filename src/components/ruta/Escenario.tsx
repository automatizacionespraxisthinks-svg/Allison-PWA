"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Momento } from "@/lib/ruta/tipos";
import { desdeB1, type Nivel } from "@/lib/tipos";
import { sonar } from "@/lib/sonidos";
import { Estampilla, type LugarSello } from "./Estampilla";
import { Estrella, Estrellas, Icono } from "./Iconos";
import { ayudaEscena, iniciarEscena, terminarEscena, turnoEscena, type FinEscena } from "./escenaApi";
import { Practicarla } from "./Practicarla";
import { srcIlustracion } from "@/lib/ruta/ilustracion";
import { AllisonAro, BotonOir, Grabador, oirGrabacion, useVoz, type Entrada } from "./leccion/comun";

interface Datos {
  titulo: string;
  imagen: string;
  contexto: string;
  personaje: string;
  tareas: string[];
  minimo: number;
  maximo: number;
  /** "¡Lo lograste! …": lo que hizo bien cuando cumple todo. */
  resumen: string;
  /** "Vamos a repasar … y lo intentas de nuevo.": cuando no lo logra. */
  repaso: string;
  momentos: Momento[];
  /** El botón Ayuda aparece solo desde el segundo fallo en una tarea (Repaso final de A2). */
  ayudaDesdeSegundoFallo: boolean;
  /** B1: la tarea del imprevisto no se ve hasta cumplir la tarea después de la cual pasa. */
  imprevisto: { despuesDeTarea: number; tarea: number } | null;
}

/** La tarea que todavía no se ve (la del imprevisto), o 0. */
function tareaOculta(e: Datos, cumplidas: number[]): number {
  return e.imprevisto && !cumplidas.includes(e.imprevisto.despuesDeTarea) ? e.imprevisto.tarea : 0;
}

interface Parada {
  clave: string;
  nombre: string;
  ciudad: string;
  sello: LugarSello | null;
  numeroSello: number;
  yaGanado: boolean;
}

type Fase = "inicio" | "escena" | "resumen";

interface Salto {
  /** "Las paradas 2 y 3": lo que queda hecho si pasa. */
  saltadas: string[];
  saldo: number;
  /** Ya lo intentó hoy. */
  hoy: boolean;
  /** Dónde sigue si no pasa: la lección en la que iba. */
  donde: { href: string; texto: string };
}

/**
 * El escenario de cierre (plan, sección 8; pantallas 10, 11 y 19b).
 * Allison hace un papel y no corrige durante la escena; al terminar
 * vuelve como profesora: qué hizo bien y una sola cosa por mejorar.
 * La ayuda muestra una frase sugerida y apaga una estrella.
 */
export function Escenario({
  parada,
  e,
  salto,
  siguiente,
  ctx,
}: {
  parada: Parada;
  e: Datos;
  salto: Salto | null;
  siguiente: { href: string; texto: string };
  ctx: { nivel: Nivel; nombre: string };
}) {
  const { decir, hablando } = useVoz(ctx.nivel);
  const [fase, setFase] = useState<Fase>("inicio");
  const [conversacion, setConversacion] = useState<string | null>(null);
  const [linea, setLinea] = useState<{ texto: string; voz: string } | null>(null);
  const [ultimo, setUltimo] = useState<{ texto: string; url?: string } | null>(null);
  const [cumplidas, setCumplidas] = useState<number[]>([]);
  const [intervenciones, setIntervenciones] = useState(0);
  const [ayudas, setAyudas] = useState(0);
  const [ayuda, setAyuda] = useState<{ frase: string; es: string; explicacion: string } | null>(null);
  const [sinAvanzar, setSinAvanzar] = useState(0);
  const [meta, setMeta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [fin, setFin] = useState<FinEscena | null>(null);
  const terminando = useRef(false);
  const pidiendo = useRef(false);
  /** Cuántos turnos lleva: una ayuda que llega después de otro turno ya no sirve. */
  const turnos = useRef(0);

  const primerNombre = ctx.nombre.split(" ")[0];
  const oculta = tareaOculta(e, cumplidas);
  const pendiente = e.tareas.findIndex((_, i) => i + 1 !== oculta && !cumplidas.includes(i + 1));
  const momento = e.momentos.find((m) => m.tareas.includes(pendiente + 1)) ?? e.momentos[e.momentos.length - 1];
  const imagen = momento?.imagen ?? e.imagen;
  const estrellasPosibles = ayudas > 0 ? 2 : 3;
  // "Con poca ayuda": el botón aparece cuando ya falló dos veces la tarea (o si ya lo usó).
  const conBotonAyuda = !e.ayudaDesdeSegundoFallo || sinAvanzar >= 2 || !!ayuda;

  async function empezar() {
    setMensaje(null);
    setOcupado(true);
    const r = await iniciarEscena({ parada: parada.clave, actividad: "escenario", salto: !!salto });
    setOcupado(false);
    if ("error" in r) {
      setMensaje(
        r.error === "salto_hoy"
          ? "Ya lo intentaste hoy. Puedes volver a intentarlo mañana."
          : "No pudimos abrir el escenario. Inténtalo en un momento."
      );
      return;
    }
    setConversacion(r.conversacionId);
    // Sin apertura (el alumno abre la escena): no hay globo de Allison,
    // solo la pista "Empiezas tú".
    setLinea(r.apertura ? { texto: r.apertura, voz: r.apertura } : null);
    setFase("escena");
    if (r.apertura) void decir(r.apertura);
  }

  async function cerrar() {
    if (!conversacion || terminando.current) return;
    terminando.current = true;
    const r = await terminarEscena(conversacion);
    terminando.current = false;
    if (!r) {
      setMensaje("No pudimos guardar el resultado. Revisa tu conexión e intenta otra vez.");
      return;
    }
    setFin(r);
    setFase("resumen");
    window.scrollTo({ top: 0 });
  }

  async function responder(entrada: Entrada) {
    turnos.current += 1;
    if (!conversacion) return;
    setMensaje(null);
    setAyuda(null);
    setOcupado(true);
    const r = await turnoEscena(conversacion, entrada);
    setOcupado(false);
    if (r.sinSaldo) return setMensaje("Te quedaste sin intervenciones. Recarga para seguir la escena.");
    if (r.error) return setMensaje(r.error);
    if (r.sinVoz) {
      setMensaje("No te oí: no cuenta como intento.");
      void decir(r.respuestaVoz);
      return;
    }
    setUltimo({ texto: r.transcripcion, url: "url" in entrada ? entrada.url : undefined });
    setLinea({ texto: r.respuesta, voz: r.respuestaVoz });
    setCumplidas(r.estado.cumplidas);
    setIntervenciones(r.estado.intervenciones);
    // Si falla la misma tarea dos veces seguidas, se ilumina la ayuda.
    setSinAvanzar((n) => (r.nuevas.length ? 0 : n + 1));
    setMeta(r.metaCumplida);
    await decir(r.respuestaVoz);
    if (r.cerrada) void cerrar();
  }

  async function pedirAyuda() {
    if (!conversacion || pidiendo.current) return;
    pidiendo.current = true;
    const mio = turnos.current;
    const r = await ayudaEscena(conversacion);
    pidiendo.current = false;
    // Si mientras llegaba ya respondió, la ayuda es de la línea anterior.
    if (mio !== turnos.current) return;
    if (!r) return setMensaje("No pudimos traer la ayuda. Intenta otra vez.");
    setAyudas((n) => n + 1);
    // Desde B1 la escena no muestra español (Contenido B1).
    setAyuda({ frase: r.frase, es: desdeB1(ctx.nivel) ? "" : r.es, explicacion: r.explicacion });
    void decir(r.frase);
  }

  // ---------------------------------------------------------------------
  //  Antes de empezar
  // ---------------------------------------------------------------------
  if (fase === "inicio") {
    return (
      <main className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-8 ${salto ? "lg:max-w-4xl" : ""}`}>
        <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
          <Link href="/ruta" aria-label="Volver a Mi ruta" className="grid size-9 place-items-center rounded-full hover:bg-superficie-2">
            <Icono nombre="cerrar" className="size-5" />
          </Link>
          <span className="flex-1">{salto ? `Salta hasta ${parada.ciudad}` : `Meta de la ${parada.nombre.toLowerCase()}`}</span>
        </div>

        {salto ? (
          <InicioSalto parada={parada} salto={salto} minimo={e.minimo} tareas={e.tareas} oculta={tareaOculta(e, [])} primerNombre={primerNombre} />
        ) : (
          <>
            <Imagen src={srcIlustracion(e.imagen, ctx.nivel)} lugar={`${parada.ciudad} · ${e.titulo}`} alto="h-40" />
            <div>
              <h1 className="text-[21px] leading-tight font-black text-balance">{e.titulo}</h1>
              <p className="mt-1 text-sm font-semibold text-texto-suave">{e.contexto}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-oro-suave px-3 py-2.5">
              <Image
                src="/allison.png"
                alt="Allison"
                width={60}
                height={60}
                className="size-[60px] rounded-full object-cover outline-2 outline-offset-2 outline-oro outline"
              />
              <div className="leading-tight">
                <small className="text-[11px] font-extrabold tracking-[0.06em] text-oro uppercase">Con quién hablas</small>
                <b className="block text-[15px] font-black">Allison hace {papel(e.personaje)}</b>
                <span className="text-[13px] font-semibold text-texto-suave">Te hablará en inglés.</span>
              </div>
            </div>
            <Mision tareas={e.tareas} cumplidas={[]} oculta={tareaOculta(e, [])} />
          </>
        )}

        <div className="flex items-center gap-3 text-[13px] font-semibold text-texto-suave">
          {parada.sello && (
            <Estampilla lugar={parada.sello} numero={parada.numeroSello} className="block w-[52px] flex-none -rotate-6 opacity-80" />
          )}
          <span>
            <b className="block text-texto">
              {parada.yaGanado ? "Repite para subir tus estrellas" : `Gana la estampilla de ${parada.ciudad}`}
            </b>
            Mínimo {e.minimo} intervenciones · usa intervenciones
          </span>
        </div>

        {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}

        <div className="mt-auto flex flex-col gap-2.5">
          <button
            type="button"
            onClick={empezar}
            disabled={ocupado || !!salto?.hoy}
            className="degradado-primario sombra-accion rounded-2xl px-5 py-3.5 font-extrabold text-white disabled:opacity-50"
          >
            {salto ? "Empezar el escenario" : "Empezar la escena"}
          </button>
          <Link
            href={salto ? "/ruta" : `/ruta/${parada.clave}/guia`}
            className="rounded-2xl border border-borde px-5 py-3.5 text-center font-extrabold"
          >
            {salto ? "Ahora no" : "Repasar las frases primero"}
          </Link>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------
  //  El resumen: Allison vuelve como profesora
  // ---------------------------------------------------------------------
  if (fase === "resumen" && fin) {
    return <Resumen parada={parada} e={e} fin={fin} salto={salto} siguiente={siguiente} ctx={ctx} conversacion={conversacion} decir={decir} />;
  }

  // ---------------------------------------------------------------------
  //  La escena
  // ---------------------------------------------------------------------
  const todas = cumplidas.length >= e.tareas.length;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3 px-4 pt-4 pb-8 lg:max-w-5xl">
      <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
        <Link href="/ruta" aria-label="Salir del escenario" className="grid size-9 place-items-center rounded-full hover:bg-superficie-2">
          <Icono nombre="cerrar" className="size-5" />
        </Link>
        <div className="h-2 flex-1 rounded-full bg-superficie-2">
          <div
            className="h-full rounded-full bg-menta transition-all"
            style={{ width: `${Math.min(100, (intervenciones / e.minimo) * 100)}%` }}
          />
        </div>
        <span className="flex gap-0.5" aria-label={`Puedes ganar ${estrellasPosibles} estrellas`}>
          {[1, 2, 3].map((i) => (
            <Estrella key={i} llena={i <= estrellasPosibles} className="size-[18px]" />
          ))}
        </span>
      </div>

      {/* En el computador, dos columnas: el lugar y la misión a la izquierda, la conversación a la derecha. */}
      <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="flex flex-col gap-3 lg:sticky lg:top-4">
          <Imagen
            src={srcIlustracion(imagen, ctx.nivel)}
            lugar={momento ? `${parada.ciudad} · ${momento.nombre}` : parada.ciudad}
            alto={ayuda ? "h-28 lg:h-72" : "h-36 lg:h-72"}
          />

          <Mision tareas={e.tareas} cumplidas={cumplidas} compacta oculta={oculta} imprevisto={e.imprevisto?.tarea} />
          <p className="text-center text-[13px] font-extrabold text-texto-suave">
            Meta: {Math.min(intervenciones, e.minimo)} de {e.minimo} intervenciones
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-3 lg:min-h-[28rem]">
          {ultimo && (
            <button
              type="button"
              onClick={() => (ultimo.url ? oirGrabacion(ultimo.url) : undefined)}
              className="rounded-2xl bg-superficie-2 px-3 py-2 text-left text-[13.5px] font-semibold text-texto-suave"
            >
              <small className="block text-[11px] font-extrabold tracking-wide uppercase">Lo último que dijiste</small>
              <b className="font-extrabold text-texto">&ldquo;{ultimo.texto}&rdquo;</b>
            </button>
          )}

          {!linea && !ultimo && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-primario-suave px-3 py-2.5 text-primario">
              <AllisonAro tam={44} aro="pregunta" />
              <span className="text-sm font-bold">
                <b className="block font-black">Empiezas tú</b>
                {e.tareas[0]}
              </span>
            </div>
          )}
          {linea && (
            <div className="flex items-end gap-2.5">
              <AllisonAro tam={58} hablando={hablando} />
              <button
                type="button"
                onClick={() => void decir(linea.voz)}
                className="min-w-0 rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2.5 text-left text-lg font-extrabold"
              >
                {linea.texto}
                <small className="block text-xs font-semibold text-texto-suave">Allison · {minuscula(e.personaje)}</small>
              </button>
            </div>
          )}

          {ayuda && (
            <div className="flex items-center gap-3 rounded-2xl bg-oro-suave px-3 py-2.5 text-oro">
              <BotonOir tam="chico" onClick={() => void decir(ayuda.frase)} className="!bg-oro" />
              <div className="leading-tight">
                <small className="text-[11.5px] font-extrabold tracking-wide uppercase">
                  {ayuda.frase.includes("___") ? "Ayuda · empieza así" : "Ayuda · puedes decir"}
                </small>
                <b className="block text-lg font-extrabold text-texto">{ayuda.frase}</b>
                {ayuda.es && <span className="block text-[13px] font-semibold text-texto-suave">{ayuda.es}</span>}
                <span className="text-[13px] font-semibold text-texto-suave">Tu tarea: {ayuda.explicacion}</span>
              </div>
            </div>
          )}

          {meta && (
            <div className="flex flex-col gap-2 rounded-2xl bg-menta-suave px-4 py-3 text-menta">
              <b className="font-black">
                {todas ? "¡Meta cumplida!" : "Ya llevas la meta de intervenciones."} Puedes terminar o seguir hablando.
              </b>
              <button
                type="button"
                onClick={() => void cerrar()}
                disabled={ocupado}
                className="rounded-xl bg-menta px-4 py-2.5 font-extrabold text-superficie disabled:opacity-50"
              >
                Terminar la escena
              </button>
            </div>
          )}
          {mensaje && <p className="text-center text-sm font-bold text-oro">{mensaje}</p>}

          <div className="mt-auto flex flex-col gap-2">
            <Grabador onEntrada={responder} ocupado={ocupado} ayuda="Toca y respóndele" />
            <div className="flex justify-center gap-2">
              <BotonOir onClick={() => linea && void decir(linea.voz)} texto="Oír de nuevo" />
              {conBotonAyuda && (
              <button
                type="button"
                onClick={pedirAyuda}
                // Mientras Allison responde, no: la ayuda sería para su línea anterior.
                disabled={ocupado || (!!salto && ayudas >= 1) || todas}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-extrabold transition disabled:opacity-40 ${
                  sinAvanzar >= 2 ? "bg-oro text-superficie shadow-[0_0_0_4px_var(--oro-suave)]" : "border border-borde"
                }`}
              >
                <Icono nombre="ayuda" className="size-4" />
                Ayuda
              </button>
              )}
            </div>
            {!meta && intervenciones > 0 && (
              <button
                type="button"
                onClick={() => void cerrar()}
                disabled={ocupado}
                className="self-center text-[12.5px] font-bold text-texto-suave underline disabled:opacity-40"
              >
                Terminar ahora
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/** "El agente…" → "el agente…"; un nombre propio ("Laura Bennett, la…") queda con su mayúscula. */
function minuscula(t: string) {
  return /^(El|La|Los|Las|Un|Una|Tu|Su)\s/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

/** "El agente de migración…" → "del agente de migración…"; "Kate, la empleada…" → "de Kate, la empleada…". */
function papel(t: string) {
  return /^el /i.test(t) ? `del ${t.slice(3)}` : `de ${minuscula(t)}`;
}

function Imagen({ src, lugar, alto }: { src: string; lugar: string; alto: string }) {
  return (
    <div className={`relative ${alto} overflow-hidden rounded-3xl bg-superficie-2 transition-all`}>
      <Image
        src={src}
        alt={lugar}
        fill
        sizes="(max-width: 640px) 100vw, 512px"
        className="object-cover"
        priority
      />
      <span className="absolute top-2.5 left-2.5 rounded-full bg-superficie px-3 py-1 text-xs font-extrabold">{lugar}</span>
    </div>
  );
}

/**
 * Las tareas numeradas: hechas en verde, la actual resaltada. La del
 * imprevisto (B1) no se ve hasta que pasa; entonces aparece con su marca.
 */
function Mision({
  tareas,
  cumplidas,
  compacta = false,
  oculta = 0,
  imprevisto,
}: {
  tareas: string[];
  cumplidas: number[];
  compacta?: boolean;
  /** El número de la tarea que todavía no se ve (0: todas se ven). */
  oculta?: number;
  /** El número de la tarea que trae el imprevisto, para marcarla al aparecer. */
  imprevisto?: number;
}) {
  const actual = tareas.findIndex((_, i) => i + 1 !== oculta && !cumplidas.includes(i + 1));
  const visibles = tareas.length - (oculta ? 1 : 0);
  // Durante la escena, en el teléfono: una fila de números y la tarea de
  // ahora. La lista de dos columnas, con 7 tareas, bajaba el micrófono
  // fuera de la pantalla (auditoría, octubre de 2026).
  if (compacta) return <MisionCompacta tareas={tareas} cumplidas={cumplidas} actual={actual} oculta={oculta} imprevisto={imprevisto} />;
  return (
    <div className="flex flex-col gap-1.5">
      {!compacta && (
        <span className="text-xs font-extrabold tracking-[0.08em] text-texto-suave uppercase">
          Tu misión · {visibles} pasos{oculta ? " y un imprevisto" : ""}
        </span>
      )}
      <ol className={`grid gap-1.5 ${compacta ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
        {tareas.map((t, i) => {
          if (i + 1 === oculta) return null;
          const ok = cumplidas.includes(i + 1);
          const act = compacta && i === actual;
          const esImprevisto = imprevisto === i + 1;
          return (
            <li
              key={i}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] leading-tight font-extrabold ${
                ok ? "bg-menta-suave text-menta" : act ? "bg-primario text-white" : "bg-superficie-2"
              }`}
            >
              <span
                className={`grid size-[22px] flex-none place-items-center rounded-full text-xs font-black ${
                  ok ? "bg-menta text-superficie" : act ? "bg-white text-primario" : "bg-primario text-white"
                }`}
              >
                {ok ? <Icono nombre="check" className="size-3.5 stroke-[3]" /> : i + 1}
              </span>
              <span className="min-w-0">
                {esImprevisto && (
                  <small className={`block text-[10.5px] font-black tracking-[0.06em] uppercase ${act ? "text-white/85" : "text-oro"}`}>
                    ¡Imprevisto!
                  </small>
                )}
                {t}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * La misión durante la escena: un número por tarea (verde la cumplida,
 * azul la de ahora) y la tarea de ahora escrita. Cabe igual con 3 que con
 * 7 tareas.
 */
export function MisionCompacta({
  tareas,
  cumplidas,
  actual,
  oculta = 0,
  imprevisto,
}: {
  tareas: string[];
  cumplidas: number[];
  actual: number;
  oculta?: number;
  imprevisto?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <ol className="flex flex-wrap items-center gap-1.5">
        {tareas.map((t, i) => {
          if (i + 1 === oculta) return null;
          const ok = cumplidas.includes(i + 1);
          const on = i === actual;
          return (
            <li
              key={i}
              aria-label={`Tarea ${i + 1}: ${t}${ok ? " (cumplida)" : on ? " (la de ahora)" : ""}`}
              className={`grid size-7 place-items-center rounded-full text-xs font-black ${
                ok ? "bg-menta text-superficie" : on ? "bg-primario text-white ring-4 ring-primario-suave" : "bg-superficie-2 text-texto-suave"
              }`}
            >
              {ok ? <Icono nombre="check" className="size-3.5 stroke-[3]" /> : i + 1}
            </li>
          );
        })}
      </ol>
      {actual >= 0 ? (
        <p className="text-[14px] leading-tight font-extrabold">
          <span className="text-primario">{imprevisto === actual + 1 ? "¡Imprevisto! " : "Ahora: "}</span>
          {tareas[actual]}
        </p>
      ) : (
        <p className="text-[14px] leading-tight font-extrabold text-menta">¡Misión cumplida!</p>
      )}
    </div>
  );
}

/** Pantalla 19b, antes de empezar: las reglas del salto, con el saldo a la vista. */
function InicioSalto({
  parada,
  salto,
  minimo,
  tareas,
  oculta,
  primerNombre,
}: {
  parada: Parada;
  salto: Salto;
  minimo: number;
  tareas: string[];
  oculta: number;
  primerNombre: string;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <AllisonAro tam={64} />
        <p className="rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2.5 text-[15px] font-bold">
          ¿Ya lo sabes, {primerNombre}? Demuéstralo en el escenario de {parada.ciudad}.
        </p>
      </div>
      {/* En el computador, las reglas y la misión lado a lado (pantalla 19b). */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <ul className="flex flex-col gap-2 text-sm font-semibold">
          <Regla icono="check" titulo="Pasa el escenario con 2 estrellas o más" texto="Puedes usar la ayuda una sola vez." />
          <Regla
            icono="salta"
            titulo={`${salto.saltadas[0] ?? ""} ${/^La parada \d+$/.test(salto.saltadas[0] ?? "") ? "queda hecha" : "quedan hechas"} y ganas la estampilla de ${parada.ciudad}`}
            texto="Para subir de nivel tendrás que completar sus actividades."
          />
          <Regla icono="reloj" titulo={`Gasta intervenciones: suele costar unas ${minimo + 2}`} texto={`Tienes ${salto.saldo}.`} />
          <Regla icono="atras" titulo="Si no pasas, sigues donde ibas" texto="Puedes intentarlo otra vez mañana." />
        </ul>
        <Mision tareas={tareas} cumplidas={[]} oculta={oculta} />
      </div>
      {salto.hoy && (
        <p className="rounded-2xl bg-oro-suave px-4 py-3 text-center text-sm font-bold text-oro">
          Ya lo intentaste hoy. Puedes volver a intentarlo mañana.
        </p>
      )}
    </>
  );
}

function Regla({ icono, titulo, texto }: { icono: "check" | "salta" | "reloj" | "atras"; titulo: string; texto: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-superficie-2 px-3 py-2.5">
      <span className="grid size-8 flex-none place-items-center rounded-full bg-morado-suave text-morado">
        <Icono nombre={icono} className="size-4" />
      </span>
      <span className="leading-tight">
        <b className="block font-extrabold">{titulo}</b>
        <span className="text-[13px] text-texto-suave">{texto}</span>
      </span>
    </li>
  );
}

/** Pantalla 11 (y 19b si pasa o no pasa). */
function Resumen({
  parada,
  e,
  fin,
  salto,
  siguiente,
  ctx,
  conversacion,
  decir,
}: {
  parada: Parada;
  e: Datos;
  fin: FinEscena;
  salto: Salto | null;
  siguiente: { href: string; texto: string };
  ctx: { nivel: Nivel; nombre: string };
  conversacion: string | null;
  decir: (t: string) => Promise<void>;
}) {
  const primerNombre = ctx.nombre.split(" ")[0];
  useEffect(() => {
    if (salto ? fin.saltoLogrado : fin.estrellas >= 1) sonar("logro");
  }, [fin, salto]);
  const todas = fin.cumplidas.length >= fin.total;
  const logrado = salto ? !!fin.saltoLogrado : fin.estrellas >= 1;
  const hechas = e.tareas.filter((_, i) => fin.cumplidas.includes(i + 1));
  const faltaron = e.tareas.filter((_, i) => !fin.cumplidas.includes(i + 1));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
        <Link href="/ruta" aria-label="Volver a Mi ruta" className="grid size-9 place-items-center rounded-full hover:bg-superficie-2">
          <Icono nombre="cerrar" className="size-5" />
        </Link>
        <span className="flex-1">{logrado ? `${parada.nombre} completa` : parada.nombre}</span>
        <Estrellas n={fin.estrellas} className="size-[18px]" />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <AllisonAro tam={84} aro={logrado ? "bien" : "pista"} />
        <h1 className="mt-2 text-2xl font-black text-balance">
          {salto
            ? logrado
              ? `Wow, ${primerNombre}! ¡Ya sabías todo esto!`
              : `¡Casi, ${primerNombre}! Todavía no saltas.`
            : logrado
              ? `Great job, ${primerNombre}!`
              : `¡Buen intento, ${primerNombre}!`}
        </h1>
        <p className="text-sm font-semibold text-texto-suave">Allison vuelve como tu profesora</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-3xl bg-menta-suave px-4 py-3.5 text-menta">
        <b className="text-[15px] font-black">Lo que hiciste bien</b>
        <span className="text-sm font-semibold">
          {todas
            ? e.resumen
            : hechas.length
              ? `Cumpliste ${hechas.length} de ${fin.total} tareas: ${hechas.join(" ")}`
              : "Te animaste a hablar en inglés. ¡Eso ya cuenta!"}
        </span>
      </div>

      {fin.mejora && (
        <div className="flex flex-col gap-1.5 rounded-3xl bg-oro-suave px-4 py-3.5 text-oro">
          <b className="text-[15px] font-black">Para la próxima</b>
          <span className="text-sm font-semibold">Dijiste: &ldquo;{fin.mejora.dijo}&rdquo;</span>
          <span className="text-sm font-extrabold text-texto">Mejor: &ldquo;{fin.mejora.mejor}&rdquo;</span>
          <span>
            <BotonOir onClick={() => void decir(fin.mejora!.mejor)} texto="Oír" />
          </span>
          {conversacion && <Practicarla conversacion={conversacion} frase={fin.mejora.mejor} nivel={ctx.nivel} nombre={ctx.nombre} />}
        </div>
      )}

      {!logrado && (
        <div className="flex flex-col gap-1.5 rounded-3xl bg-primario-suave px-4 py-3.5 text-primario">
          <b className="text-[15px] font-black">{salto ? "Sigues donde ibas" : "Te faltó"}</b>
          {faltaron.length > 0 && <span className="text-sm font-semibold">{faltaron.join(" ")}</span>}
          <span className="text-sm font-semibold">
            {salto
              ? "No perdiste nada de tu avance. Puedes intentarlo otra vez mañana."
              : e.repaso || "Repasa las frases y lo intentas de nuevo."}
          </span>
          {salto && (
            <Link href={salto.donde.href} className="text-sm font-extrabold underline">
              Sigues en: {salto.donde.texto}
            </Link>
          )}
          <Link href={`/ruta/${parada.clave}/guia`} className="text-sm font-extrabold underline">
            Guía de frases de {parada.ciudad} · gratis
          </Link>
        </div>
      )}

      {salto && logrado && salto.saltadas[0] && (
        <div className="flex flex-col gap-1 rounded-3xl bg-morado-suave px-4 py-3.5 text-morado">
          <b className="text-[15px] font-black">
            {salto.saltadas[0]} {/^La parada d+$/.test(salto.saltadas[0]) ? "quedó hecha" : "quedaron hechas"}
          </b>
          <span className="text-sm font-semibold">
            Sigues en: {siguiente.texto.replace(/^Ir a /, "")}. Para subir de nivel tendrás que completar sus actividades.
          </span>
        </div>
      )}

      {fin.sello && parada.sello && (
        <div className="flex items-center gap-3">
          <Estampilla lugar={parada.sello} numero={parada.numeroSello} className="block w-[62px] flex-none -rotate-6 drop-shadow-md" />
          <span className="text-sm font-semibold text-texto-suave">
            <b className="block text-texto">¡Estampilla de {parada.ciudad} ganada!</b>
            Ya está en tu pasaporte.
          </span>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2.5">
        {!logrado && !salto ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="degradado-primario sombra-accion rounded-2xl px-5 py-3.5 text-center font-extrabold text-white"
          >
            Intentarlo otra vez
          </button>
        ) : (
          <Link
            href={logrado ? siguiente.href : "/ruta"}
            className="degradado-primario sombra-accion rounded-2xl px-5 py-3.5 text-center font-extrabold text-white"
          >
            {logrado ? siguiente.texto : "Volver a mi ruta"}
          </Link>
        )}
        {logrado && !salto && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl border border-borde px-5 py-3.5 text-center font-extrabold"
          >
            Repetir el escenario
          </button>
        )}
      </div>
    </main>
  );
}
