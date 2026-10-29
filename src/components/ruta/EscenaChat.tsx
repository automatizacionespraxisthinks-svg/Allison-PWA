"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Transcripcion } from "@/components/Transcripcion";
import { sonar } from "@/lib/sonidos";
import { desdeB1, type Mensaje, type Nivel } from "@/lib/tipos";
import { desbloquearVoz } from "@/lib/voz";
import { pedirAyudaIA } from "@/lib/ayudaCliente";
import { Estampilla, type LugarSello } from "./Estampilla";
import { Estrellas, Icono, type NombreIcono } from "./Iconos";
import { ayudaEscena, iniciarEscena, terminarEscena, turnoEscena, type FinEscena } from "./escenaApi";
import { MisionCompacta } from "./Escenario";
import { AllisonAro, BotonOir, Grabador, useVoz, type Entrada } from "./leccion/comun";
import { Practicarla } from "./Practicarla";

/** Los colores de las tareas, en ciclo (pantalla 3: íconos de color). */
const COLORES_TAREA = ["#ff8a3d", "#ec4899", "#12b5a5"];

/** El ícono de una tarea por lo que pide: comida, pregunta, comparar o hablar. */
function iconoDeTarea(t: string): NombreIcono {
  if (/compar/i.test(t)) return "compara";
  if (/^pregunta|pide (ayuda|direcciones|información)/i.test(t)) return "ayuda";
  if (/comida|comer|plato|pizza|tacos|pasta|caf[eé]|men[uú]|bebida|postre|helado|desayuno|almuerzo|cena/i.test(t)) return "comida";
  if (/pide|paga|compra|boleta|precio|cuesta|cuenta/i.test(t)) return "bolsa";
  return "charla";
}

export interface DatosEscenaChat {
  /** Lo que abre el intento en el servidor. */
  inicio: { actividad: "viaje"; viaje: number } | { actividad: "catalogo"; clave: string };
  portada: {
    /** Ruta de la ilustración ("/ilustraciones/a1/brasil.webp"); vacía en los escenarios propios. */
    imagen: string;
    /** "Viaje 3 de 10" o "Escenarios · Compras". */
    rotulo: string;
    titulo: string;
    /** Sin ilustración: el color y el ícono de su categoría. */
    clase?: string;
    icono?: string;
  };
  /** Viajes: la estampilla del país. */
  sello?: { lugar: LugarSello; numero: number; ganado: boolean };
  /** "Tu guía en Río" / "Allison hace de cajera". */
  guia: {
    rotulo: string;
    detalle: string;
    /** Su papel en pocas palabras, para la barra de arriba: "Mesera del restaurante", "Tu guía en Río". */
    papel?: string;
  };
  /** "Tu misión en Río". */
  mision: string;
  tareas: string[];
  minimo: number;
  /** "¡Lo lograste! Viajaste a Brasil hablando en inglés." */
  logrado: string;
  /** Adónde vuelve la flecha y el resumen. */
  volver: { href: string; texto: string };
  /** Ya lo hizo antes: el resumen dice "Repite para subir tus estrellas". */
  estrellasAntes: number;
}

type Fase = "antes" | "charla" | "resumen";

/**
 * Por dentro de un viaje (pantalla 8) y de un escenario del catálogo
 * (pantalla 5): la portada, Allison en su papel, la misión con sus 3
 * tareas y la meta de intervenciones, y la conversación igual que en
 * Hablar (burbujas con audio y traducción). Abajo, la idea, el micrófono
 * y el teclado. Al cumplir la meta la app avisa y se puede seguir
 * hablando; al terminar, Allison da el resumen (y la estampilla).
 */
export function EscenaChat({ d, ctx }: { d: DatosEscenaChat; ctx: { nivel: Nivel; nombre: string } }) {
  const { decir, hablando } = useVoz(ctx.nivel);
  const [fase, setFase] = useState<Fase>("antes");
  const [conversacion, setConversacion] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cumplidas, setCumplidas] = useState<number[]>([]);
  const [intervenciones, setIntervenciones] = useState(0);
  const [ayudas, setAyudas] = useState(0);
  const [idea, setIdea] = useState<{ frase: string; es: string; tarea: string } | null>(null);
  const [meta, setMeta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [sinSaldo, setSinSaldo] = useState(false);
  const [fin, setFin] = useState<FinEscena | null>(null);
  const terminando = useRef(false);
  const pidiendo = useRef(false);
  /** Cuántos turnos lleva: una idea que llega después de otro turno ya no sirve. */
  const turnos = useRef(0);
  const abajo = useRef<HTMLDivElement>(null);
  const contador = useRef(0);
  /** La tarjeta de Allison arriba: cuando sale de la vista, aparece la barra fija. */
  const guia = useRef<HTMLDivElement>(null);
  const [guiaFuera, setGuiaFuera] = useState(false);

  const actual = d.tareas.findIndex((_, i) => !cumplidas.includes(i + 1));
  const todas = actual < 0;

  // En el celular, al conversar la tarjeta de Allison se va hacia arriba y
  // con ella su foto: Allison hablaba sin que se la viera moverse (prueba
  // en producción, octubre de 2026). Fuera de la vista, va la barra fija.
  useEffect(() => {
    const el = guia.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const o = new IntersectionObserver(([e]) => setGuiaFuera(!e.isIntersecting));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  // Cada mensaje nuevo queda a la vista, justo encima del micrófono.
  useEffect(() => {
    if (mensajes.length) abajo.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [mensajes.length, idea]);

  function agregar(rol: Mensaje["rol"], texto: string, textoVoz?: string) {
    contador.current += 1;
    const m: Mensaje = {
      id: `m${contador.current}`,
      rol,
      texto,
      textoVoz: textoVoz && textoVoz !== texto ? textoVoz : undefined,
      correcciones: [],
      creadoEn: new Date().toISOString(),
    };
    setMensajes((x) => [...x, m]);
  }

  async function empezar() {
    // En el toque, antes de esperar: la primera línea de Allison llega
    // después y el celular solo la deja sonar si el audio ya se desbloqueó.
    desbloquearVoz();
    setMensaje(null);
    setOcupado(true);
    const r = await iniciarEscena(d.inicio);
    setOcupado(false);
    if ("error" in r) {
      setMensaje(
        r.error === "bloqueada" ? "Todavía no se abre. Vuelve a la lista." : "No pudimos empezar. Revisa tu conexión e intenta otra vez."
      );
      return;
    }
    setConversacion(r.conversacionId);
    setFase("charla");
    if (r.apertura) {
      agregar("allison", r.apertura);
      void decir(r.apertura);
    }
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
    if (!conversacion) return;
    turnos.current += 1;
    setMensaje(null);
    setIdea(null);
    setOcupado(true);
    const r = await turnoEscena(conversacion, entrada);
    setOcupado(false);
    if (r.sinSaldo) return setSinSaldo(true);
    if (r.error) return setMensaje(r.error);
    if (r.sinVoz) {
      setMensaje("No te oí: no cuenta como intento.");
      return;
    }
    agregar("alumno", r.transcripcion);
    agregar("allison", r.respuesta, r.respuestaVoz);
    setCumplidas(r.estado.cumplidas);
    setIntervenciones(r.estado.intervenciones);
    // Las ideas que lleva según el servidor (las estrellas salen de ahí).
    setAyudas((n) => Math.max(n, r.estado.ayudas ?? 0));
    if (r.nuevas.length) sonar("acierto");
    setMeta(r.metaCumplida);
    await decir(r.respuestaVoz);
    if (r.cerrada) void cerrar();
  }

  /**
   * La idea: qué decir para la tarea de ahora. Cuenta como ayuda (como en
   * los escenarios, deja el máximo en 2 estrellas). Si la escena no trae
   * una frase de ejemplo, la sugiere la ayuda de siempre (gratis), y la
   * idea se cobra solo si llega y todavía sirve: antes se cobraba aunque
   * /api/ayuda fallara o la idea llegara tarde (auditoría, 28 de octubre de
   * 2026).
   */
  async function pedirIdea() {
    if (!conversacion || pidiendo.current) return;
    if (idea) return setIdea(null);
    pidiendo.current = true;
    setMensaje(null);
    // Si mientras llega la idea el alumno ya respondió, la idea es de la
    // línea anterior de Allison: no se muestra.
    const mio = turnos.current;
    try {
      const r = await ayudaEscena(conversacion);
      if (!r) return setMensaje("No pudimos traer la idea. Intenta otra vez.");
      // El contador, como lo lleva el servidor (las estrellas salen de ahí).
      setAyudas((n) => Math.max(n, r.ayudas));
      let frase = r.frase;
      let es = r.es ?? "";
      if (!frase) {
        const ultima = [...mensajes].reverse().find((m) => m.rol === "allison")?.texto ?? "";
        // Usa la IA: cuesta una intervención (29 de octubre de 2026).
        const a = await pedirAyudaIA(ultima || r.explicacion, ctx.nivel, r.explicacion, AbortSignal.timeout(20_000));
        if (!a.ok && a.sinSaldo) return setSinSaldo(true);
        frase = a.ok ? a.ayuda.sugerencia : "";
        es = a.ok ? a.ayuda.sugerenciaEs : "";
        if (mio !== turnos.current) return;
        if (!frase) return setMensaje("No pudimos traer la idea. Intenta otra vez.");
        // Ahora sí se va a mostrar: se cobra.
        const cobro = await ayudaEscena(conversacion, true);
        if (!cobro) return setMensaje("No pudimos traer la idea. Intenta otra vez.");
        setAyudas((n) => Math.max(n, cobro.ayudas));
      }
      if (mio !== turnos.current) return;
      if (!frase) return setMensaje("No pudimos traer la idea. Intenta otra vez.");
      // Desde B1 la escena no muestra español (Contenido B1), como en Escenario.
      setIdea({ frase, es: desdeB1(ctx.nivel) ? "" : es, tarea: r.explicacion });
      void decir(frase);
    } finally {
      pidiendo.current = false;
    }
  }

  if (fase === "resumen" && fin) {
    return <Resumen d={d} fin={fin} ayudas={ayudas} ctx={ctx} conversacion={conversacion} decir={decir} />;
  }

  const botonIdea = (
    <button
      type="button"
      onClick={() => void pedirIdea()}
      disabled={!conversacion || ocupado || todas}
      aria-label="Una idea de qué decir"
      aria-pressed={!!idea}
      title="Una idea de qué decir"
      className={`grid size-11 place-items-center rounded-full border transition disabled:opacity-40 ${
        idea ? "border-oro bg-oro text-superficie" : "border-borde text-texto-suave hover:bg-superficie-2"
      }`}
    >
      <Icono nombre="idea" className="size-5" />
    </button>
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-3 px-4 pt-4 pb-6 lg:max-w-5xl">
      {/* Celular, ya en la charla: Allison (que se mueve al hablar), su
          papel, el avance de la misión y la tarea de ahora completa,
          siempre a la vista (opción A, elegida el 25 de octubre de 2026). */}
      {fase === "charla" && guiaFuera && (
        <div className="fixed inset-x-0 top-0 z-30 lg:hidden" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <div className="mx-auto flex max-w-lg items-center gap-3 border-b border-borde bg-superficie/95 px-4 py-2.5 backdrop-blur">
            <AllisonAro tam={56} aro={meta ? "bien" : "pregunta"} hablando={hablando} />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="flex items-center gap-1.5">
                <b className="text-[16px] font-black">Allison</b>
                {hablando && <OndaHablando />}
              </span>
              <span className="block truncate text-[12.5px] font-semibold text-texto-suave">{d.guia.papel ?? d.guia.rotulo}</span>
              <span className="mt-1.5 flex gap-[3px]" aria-hidden>
                {d.tareas.map((_, i) => (
                  <span
                    key={i}
                    className={`h-[5px] flex-1 rounded-full ${cumplidas.includes(i + 1) ? "bg-menta" : i === actual ? "bg-primario" : "bg-borde"}`}
                  />
                ))}
              </span>
              <span className="sr-only">
                {cumplidas.length} de {d.tareas.length} tareas cumplidas.
              </span>
              <span className="mt-1 block text-[13.5px] font-bold text-primario">
                {todas ? "¡Misión cumplida!" : `Tarea ${actual + 1} de ${d.tareas.length}: ${d.tareas[actual]}`}
              </span>
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Lo que se ve: el lugar, Allison en su papel y la misión. */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4">
          <Portada d={d} />
          <div ref={guia} className="relative z-[1] -mt-8 mx-1 flex items-center gap-3 rounded-2xl bg-primario-suave px-3 py-2.5 shadow-sm">
            <AllisonAro tam={52} aro={meta ? "bien" : "pregunta"} hablando={hablando} />
            <span className="min-w-0 leading-tight">
              <small className="text-[11px] font-extrabold tracking-[0.06em] text-primario uppercase">{d.guia.rotulo}</small>
              <b className="block text-[17px] font-black">Allison</b>
              <span className="text-[13px] font-semibold text-texto-suave">{d.guia.detalle}</span>
            </span>
          </div>
          <Mision d={d} cumplidas={cumplidas} intervenciones={intervenciones} />
        </div>

        {/* Lo que se responde: la conversación y el micrófono. */}
        <div className="flex flex-1 flex-col gap-3 lg:min-h-[32rem]">
          {fase === "antes" ? (
            <div className="flex flex-col gap-2 rounded-3xl border border-borde p-4 text-sm font-semibold text-texto-suave">
              <b className="text-base font-black text-texto">Cómo funciona</b>
              <span>Allison te habla en inglés y tú le respondes con tu voz o escribiendo. Cumple las {d.tareas.length} tareas de tu misión.</span>
              <span>
                Meta: {d.minimo} intervenciones · <span className="font-extrabold text-oro">usa intervenciones</span>
              </span>
            </div>
          ) : (
            <>
              {!mensajes.length && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-primario-suave px-3 py-2.5 text-primario">
                  <AllisonAro tam={40} />
                  <span className="text-sm font-bold">
                    <b className="block font-black">Empiezas tú</b>
                    {d.tareas[0]}
                  </span>
                </div>
              )}
              <Transcripcion mensajes={mensajes} nivel={ctx.nivel} alCobrar={(n) => n === 0 && setSinSaldo(true)} />
            </>
          )}

          {idea && (
            <div className="flex items-center gap-3 rounded-2xl bg-oro-suave px-3 py-2.5 text-oro" aria-live="polite">
              <BotonOir tam="chico" onClick={() => void decir(idea.frase)} className="!bg-oro" />
              <div className="min-w-0 leading-tight">
                <small className="text-[11.5px] font-extrabold tracking-wide uppercase">Idea · puedes decir</small>
                <b className="block text-lg font-extrabold text-texto">{idea.frase}</b>
                {idea.es && <span className="block text-[13px] font-semibold text-texto-suave">{idea.es}</span>}
                <span className="text-[12.5px] font-semibold text-texto-suave">Tu tarea: {idea.tarea}</span>
              </div>
            </div>
          )}

          {meta && (
            <div className="flex flex-col gap-2 rounded-2xl bg-menta-suave px-4 py-3 text-menta" aria-live="polite">
              <b className="font-black">
                {todas ? "¡Meta cumplida!" : `Ya llevas ${d.minimo} intervenciones.`} Puedes terminar o seguir hablando.
              </b>
              <button
                type="button"
                onClick={() => void cerrar()}
                disabled={ocupado}
                className="rounded-xl bg-menta px-4 py-2.5 font-extrabold text-superficie disabled:opacity-50"
              >
                Terminar y ver mi resumen
              </button>
            </div>
          )}
          {mensaje && (
            <p role="alert" className="text-center text-sm font-bold text-oro">
              {mensaje}
            </p>
          )}
          {sinSaldo && (
            <div role="alert" className="flex flex-col gap-2 rounded-2xl bg-oro-suave px-4 py-3 text-sm font-semibold text-oro">
              <b className="font-black">Te quedaste sin intervenciones</b>
              <span>Recarga para seguir la conversación. Lo que llevas no se pierde.</span>
              <Link href="/recargar" className="degradado-primario rounded-xl px-4 py-2.5 text-center font-extrabold text-white">
                Recargar intervenciones
              </Link>
            </div>
          )}

          <div ref={abajo} className="mt-auto flex scroll-mb-28 flex-col gap-2 pt-1 lg:scroll-mb-6">
            {fase === "antes" ? (
              <button
                type="button"
                onClick={() => void empezar()}
                disabled={ocupado}
                className="degradado-primario sombra-accion flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-extrabold text-white disabled:opacity-50"
              >
                {ocupado ? "Un momento…" : d.inicio.actividad === "viaje" ? "Empezar el viaje" : "Empezar la escena"}
              </button>
            ) : (
              <Grabador onEntrada={responder} ocupado={ocupado} deshabilitado={sinSaldo} ayuda="Toca y respóndele" izquierda={botonIdea} />
            )}
            {fase === "charla" && !meta && intervenciones > 0 && (
              <>
                {todas && ayudas === 0 && (
                  <p className="text-center text-[12.5px] font-semibold text-texto-suave">
                    Si terminas ahora ganas 2 estrellas. Llega a {d.minimo} intervenciones para las 3.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void cerrar()}
                  disabled={ocupado}
                  className="self-center text-[12.5px] font-bold text-texto-suave underline disabled:opacity-40"
                >
                  Terminar ahora
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/** Las ondas junto al nombre mientras Allison habla. */
function OndaHablando() {
  return (
    <span role="img" aria-label="hablando" className="flex h-3.5 items-center gap-[2px]">
      {[9, 14, 10, 12].map((alto, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primario"
          style={{ height: alto, animation: `barra-sonando 0.9s ease-in-out ${i * 0.12}s infinite` }}
        />
      ))}
    </span>
  );
}

function Portada({ d }: { d: DatosEscenaChat }) {
  return (
    <div
      className={`relative h-44 overflow-hidden rounded-3xl lg:h-64 ${
        d.portada.imagen ? "bg-superficie-2" : `${d.portada.clase ?? "cat-mios"} bg-gradient-to-br from-[var(--k1)] to-[color-mix(in_srgb,var(--k1)_55%,#1e1b4b)]`
      }`}
    >
      {d.portada.imagen ? (
        <Image src={d.portada.imagen} alt="" fill sizes="(max-width: 1024px) 100vw, 512px" className="object-cover" priority />
      ) : (
        <Icono nombre={d.portada.icono ?? "chispa"} className="absolute -top-4 -right-4 size-44 text-white opacity-20" />
      )}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
      <Link
        href={d.volver.href}
        aria-label={d.volver.texto}
        className="absolute top-3 left-3 grid size-10 place-items-center rounded-full bg-superficie text-texto shadow"
      >
        <Icono nombre="atras" className="size-5" />
      </Link>
      {d.sello && (
        <span className="absolute top-3 right-3 flex flex-col items-center gap-0.5">
          <Estampilla lugar={d.sello.lugar} numero={d.sello.numero} className="block w-14 rotate-[4deg] drop-shadow-md" />
          <i className="rounded-full bg-oro-suave px-2 text-[10.5px] font-black text-oro not-italic">
            {d.sello.ganado ? "Ganada" : "Por ganar"}
          </i>
        </span>
      )}
      <span className="absolute bottom-9 left-4 leading-tight text-white">
        <small className="text-[11px] font-extrabold tracking-[0.08em] uppercase opacity-90">{d.portada.rotulo}</small>
        <b className="block text-[28px] font-black drop-shadow">{d.portada.titulo}</b>
      </span>
    </div>
  );
}

/** "Tu misión en Río": las tareas como calcomanías, la tarea actual y la meta. */
function Mision({ d, cumplidas, intervenciones }: { d: DatosEscenaChat; cumplidas: number[]; intervenciones: number }) {
  const actual = d.tareas.findIndex((_, i) => !cumplidas.includes(i + 1));
  return (
    <section className="flex flex-col gap-2.5 rounded-3xl border border-borde p-3">
      <div className="flex items-center justify-between gap-2">
        <b className="text-[15px] font-black">{d.mision}</b>
        <span className="rounded-full bg-primario-suave px-2.5 py-0.5 text-xs font-extrabold text-primario">
          {actual < 0 ? "¡Misión cumplida!" : `Tarea ${actual + 1} de ${d.tareas.length}`}
        </span>
      </div>
      {/* Con más de 4 tareas (el catálogo, los propios), los íconos con su
          texto no caben en el teléfono: van números y la tarea de ahora. */}
      {d.tareas.length > 4 ? (
        <MisionCompacta tareas={d.tareas} cumplidas={cumplidas} actual={actual} />
      ) : (
        <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${d.tareas.length}, minmax(0, 1fr))` }}>
          {d.tareas.map((t, i) => {
            const ok = cumplidas.includes(i + 1);
            const on = i === actual;
            const color = COLORES_TAREA[i % COLORES_TAREA.length];
            return (
              <li key={i} className="relative flex flex-col items-center gap-1 text-center">
                {i > 0 && <span aria-hidden className="absolute top-6 right-1/2 w-full border-t-2 border-dashed border-borde" />}
                <span
                  className={`relative grid size-12 place-items-center rounded-2xl border-2 ${on ? "shadow-[0_0_0_4px_var(--primario-suave)]" : ""}`}
                  style={
                    ok || on
                      ? { borderColor: color, background: `color-mix(in srgb, ${color} 18%, var(--superficie))`, color }
                      : { borderColor: "var(--borde)", background: "var(--superficie-2)", color: "var(--texto-suave)" }
                  }
                >
                  <Icono nombre={iconoDeTarea(t)} className="size-6" />
                  {ok && (
                    <span className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full border-2 border-superficie bg-[#1fae7a] text-white">
                      <Icono nombre="check" className="size-3 stroke-[3.4]" />
                    </span>
                  )}
                </span>
                <span className={`text-[12px] leading-tight font-extrabold ${on ? "text-primario" : ok ? "text-texto" : "text-texto-suave"}`}>{t}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex items-center gap-2.5">
        <div className="h-2 flex-1 rounded-full bg-superficie-2">
          <div className="h-full rounded-full bg-oro transition-all" style={{ width: `${Math.min(100, (intervenciones / d.minimo) * 100)}%` }} />
        </div>
        <span className="text-[12.5px] font-extrabold whitespace-nowrap text-texto-suave">
          {Math.min(intervenciones, d.minimo)} de {d.minimo} intervenciones
        </span>
      </div>
    </section>
  );
}

/** Al terminar: Allison vuelve como profesora; en los viajes, la estampilla. */
function Resumen({
  d,
  fin,
  ayudas,
  ctx,
  conversacion,
  decir,
}: {
  d: DatosEscenaChat;
  fin: FinEscena;
  ayudas: number;
  ctx: { nivel: Nivel; nombre: string };
  conversacion: string | null;
  decir: (t: string) => Promise<unknown>;
}) {
  const primerNombre = ctx.nombre.split(" ")[0];
  const logrado = fin.estrellas >= 1;
  useEffect(() => {
    if (logrado) sonar("logro");
  }, [logrado]);
  const hechas = d.tareas.filter((_, i) => fin.cumplidas.includes(i + 1));
  const faltaron = d.tareas.filter((_, i) => !fin.cumplidas.includes(i + 1));
  const todas = hechas.length >= d.tareas.length;
  const subio = fin.estrellas > d.estrellasAntes;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
        <Link href={d.volver.href} aria-label={d.volver.texto} className="grid size-9 place-items-center rounded-full hover:bg-superficie-2">
          <Icono nombre="cerrar" className="size-5" />
        </Link>
        <span className="flex-1">{d.portada.titulo}</span>
        <Estrellas n={fin.estrellas} className="size-[18px]" />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <AllisonAro tam={84} aro={logrado ? "bien" : "pista"} />
        <h1 className="mt-2 text-2xl font-black text-balance">{logrado ? `Great job, ${primerNombre}!` : `¡Buen intento, ${primerNombre}!`}</h1>
        <p className="text-sm font-semibold text-texto-suave">Allison vuelve como tu profesora</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-3xl bg-menta-suave px-4 py-3.5 text-menta">
        <b className="text-[15px] font-black">Lo que hiciste bien</b>
        <span className="text-sm font-semibold">
          {todas
            ? d.logrado
            : hechas.length
              ? `Cumpliste ${hechas.length} de ${d.tareas.length} tareas: ${hechas.join(". ")}.`
              : "Te animaste a hablar en inglés. ¡Eso ya cuenta!"}
        </span>
      </div>

      {fin.mejora && (
        <div className="flex flex-col gap-1.5 rounded-3xl bg-oro-suave px-4 py-3.5 text-oro">
          <b className="text-[15px] font-black">Para la próxima</b>
          <span className="text-sm font-semibold">Dijiste: &ldquo;{fin.mejora.dijo}&rdquo;</span>
          <span className="text-sm font-extrabold text-texto">Mejor: &ldquo;{fin.mejora.mejor}&rdquo;</span>
          <span className="flex flex-wrap items-center gap-2">
            <BotonOir onClick={() => void decir(fin.mejora!.mejor)} texto="Oír" />
          </span>
          {conversacion && <Practicarla conversacion={conversacion} frase={fin.mejora.mejor} nivel={ctx.nivel} nombre={ctx.nombre} />}
        </div>
      )}

      {!logrado && faltaron.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-3xl bg-primario-suave px-4 py-3.5 text-primario">
          <b className="text-[15px] font-black">Te faltó</b>
          <span className="text-sm font-semibold">{faltaron.join(". ")}.</span>
          <span className="text-sm font-semibold">Inténtalo otra vez: la idea te ayuda con qué decir.</span>
        </div>
      )}

      {ayudas > 0 && logrado && (
        <p className="text-center text-[13px] font-semibold text-texto-suave">
          Usaste la idea {ayudas === 1 ? "1 vez" : `${ayudas} veces`}: sin ella puedes ganar 3 estrellas.
        </p>
      )}

      {fin.sinMinimo && (
        <p className="text-center text-[13px] font-semibold text-texto-suave">
          Terminaste antes de la meta: con {fin.sinMinimo} intervenciones ganas 3 estrellas.
        </p>
      )}

      {fin.sello && d.sello && (
        <div className="flex items-center gap-3">
          <Estampilla lugar={d.sello.lugar} numero={d.sello.numero} className="block w-[62px] flex-none -rotate-6 drop-shadow-md" />
          <span className="text-sm font-semibold text-texto-suave">
            <b className="block text-texto">
              {d.sello.ganado ? `Estampilla de ${d.portada.titulo}` : `¡Estampilla de ${d.portada.titulo} ganada!`}
            </b>
            {d.sello.ganado ? (subio ? "Subiste tus estrellas." : "Ya estaba en tu pasaporte.") : "Ya está en tu pasaporte."}
          </span>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2.5">
        <Link href={d.volver.href} className="degradado-primario sombra-accion rounded-2xl px-5 py-3.5 text-center font-extrabold text-white">
          {d.volver.texto}
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-2xl border border-borde px-5 py-3.5 text-center font-extrabold"
        >
          {logrado ? "Repetir para subir estrellas" : "Intentarlo otra vez"}
        </button>
      </div>
    </main>
  );
}
