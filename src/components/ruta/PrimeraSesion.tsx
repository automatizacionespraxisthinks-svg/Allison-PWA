"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { Nivel } from "@/lib/tipos";
import { Estampilla, type LugarSello } from "./Estampilla";
import { Icono } from "./Iconos";
import { Grabador, useVoz } from "./leccion/comun";

/** Cómo se describe cada nivel en el paso 1 (boceto aprobado). */
const DESCRIPCION: Record<Nivel, string> = {
  A1: "Empiezo desde cero",
  A2: "Entiendo frases sencillas",
  B1: "Me defiendo en una conversación",
  B2: "Hablo con soltura",
  C1: "Hablo casi sin esfuerzo",
  C2: "Como un nativo",
};

/**
 * La primera sesión guiada (pantalla 10): (1) el nivel, que es el país
 * del viaje; (2) la prueba del micrófono, que solo mide el volumen; (3)
 * la meta diaria y la hora del recordatorio; (4) el primer paso, que da
 * la primera estrella. Nada de esto gasta intervenciones.
 */
export function PrimeraSesion({
  nombre,
  nivelActual,
  niveles,
  primeras,
}: {
  nombre: string;
  nivelActual: Nivel;
  niveles: { nivel: Nivel; pais: string; primeraCiudad: string }[];
  /** La primera lección de cada nivel que ya tiene ruta; los demás siguen en la ruta provisional. */
  primeras: Partial<Record<Nivel, { parada: string; titulo: string; leccion: string; sello: LugarSello | null }>>;
}) {
  const router = useRouter();
  const primerNombre = nombre.split(" ")[0];
  const { decir, hablando } = useVoz("A1");
  const [paso, setPaso] = useState(1);
  const [nivel, setNivel] = useState<Nivel>(nivelActual);
  const [volumen, setVolumen] = useState<number | null>(null);
  const [microOk, setMicroOk] = useState<boolean | null>(null);
  const [meta, setMeta] = useState<5 | 10 | 15>(10);
  const [hora, setHora] = useState("19:00");
  const [conRecordatorio, setConRecordatorio] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elegido = niveles.find((n) => n.nivel === nivel)!;
  const primeraLeccion = primeras[nivel];
  const alGrabar = useCallback((v: number | null) => setVolumen(v), []);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const r = await fetch("/api/ruta/inicio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "primera", nivel, meta, hora: conRecordatorio ? hora : null }),
    }).catch(() => null);
    setGuardando(false);
    if (!r?.ok) {
      setError("No pudimos guardar. Revisa tu conexión e intenta otra vez.");
      return;
    }
    // Quien ya practicaba conserva su nivel: el paso 4 muestra el que quedó.
    const d = (await r.json().catch(() => null)) as { nivel?: Nivel } | null;
    if (d?.nivel) setNivel(d.nivel);
    setPaso(4);
  }

  const frases: Record<number, string> = {
    1: `Hi, ${primerNombre}! I'm Allison.`,
    2: "Let's test your microphone.",
    3: "",
    4: "",
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pt-5 pb-8">
      <div className="flex items-center gap-3 text-[13px] font-extrabold text-texto-suave">
        {paso > 1 && paso < 4 ? (
          <button type="button" onClick={() => setPaso(paso - 1)} aria-label="Paso anterior" className="grid size-9 place-items-center rounded-full hover:bg-superficie-2">
            <Icono nombre="atras" className="size-5" />
          </button>
        ) : (
          <span className="size-9" />
        )}
        <div className="h-2 flex-1 rounded-full bg-superficie-2">
          <div className="h-full rounded-full bg-menta transition-all" style={{ width: `${(paso / 4) * 100}%` }} />
        </div>
        Paso {paso} de 4
      </div>

      <div className="flex items-end gap-3">
        <button type="button" onClick={() => frases[paso] && void decir(frases[paso])} aria-label="Oír a Allison" className="flex-none">
          <Image
            src="/allison.png"
            alt="Allison"
            width={64}
            height={64}
            className={`size-16 rounded-full object-cover outline-[3px] outline-offset-2 outline ${
              volumen !== null ? "outline-menta" : "outline-primario"
            } ${hablando ? "" : "respira"}`}
            style={volumen !== null ? { boxShadow: `0 0 0 ${4 + volumen * 14}px var(--menta-suave)` } : undefined}
          />
        </button>
        <p className="rounded-[18px_18px_18px_4px] bg-superficie-2 px-4 py-2.5 text-[15px] font-bold">
          {paso === 1 && (
            <>
              Hi, {primerNombre}! I&apos;m Allison. <span className="block text-texto-suave">¿Cuánto inglés sabes?</span>
            </>
          )}
          {paso === 2 && (
            <>
              Let&apos;s test your microphone. <span className="block text-texto-suave">Di: &ldquo;Hello, Allison!&rdquo;</span>
            </>
          )}
          {paso === 3 && "¿Cuántos minutos al día quieres practicar conmigo?"}
          {paso === 4 &&
            `¡Listo, ${primerNombre}! Tu viaje por ${elegido.pais} empieza en ${elegido.primeraCiudad || "tu primera parada"}.`}
        </p>
      </div>

      {paso === 1 && (
        <>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Tu nivel">
            {niveles.map((n) => (
              <button
                key={n.nivel}
                type="button"
                role="radio"
                aria-checked={nivel === n.nivel}
                onClick={() => setNivel(n.nivel)}
                className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition ${
                  nivel === n.nivel ? "border-primario bg-primario-suave" : "border-borde"
                }`}
              >
                <b className={`w-9 text-lg font-black ${nivel === n.nivel ? "text-primario" : ""}`}>{n.nivel}</b>
                <span className="leading-tight">
                  <b className="block font-extrabold">{n.pais}</b>
                  <span className="text-[13px] font-semibold text-texto-suave">{DESCRIPCION[n.nivel]}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-[13px] font-semibold text-texto-suave">
            Después podrás bajar de nivel cuando quieras; para subir, completa todas las actividades de tu nivel.
          </p>
          <button type="button" onClick={() => setPaso(2)} className="degradado-primario sombra-accion mt-auto rounded-2xl px-5 py-3.5 font-extrabold text-white">
            Continuar
          </button>
        </>
      )}

      {paso === 2 && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            {microOk ? (
              <div className="flex flex-col items-center gap-1 rounded-3xl bg-menta-suave px-6 py-4 text-center text-menta">
                <Icono nombre="check" className="size-8 stroke-[3]" />
                <b className="text-xl font-black">¡Te escucho bien!</b>
                <span className="text-sm font-semibold">El nivel de tu voz es bueno.</span>
              </div>
            ) : (
              <>
                <div className="flex h-10 items-end gap-1" aria-hidden>
                  {Array.from({ length: 12 }, (_, i) => (
                    <span
                      key={i}
                      className="w-2 rounded-full bg-menta transition-all"
                      style={{ height: `${8 + Math.max(0, (volumen ?? 0) * 40 - Math.abs(i - 5.5) * 5)}px`, opacity: volumen ? 1 : 0.3 }}
                    />
                  ))}
                </div>
                <Grabador soloVoz alGrabar={alGrabar} onEntrada={() => setMicroOk(true)} ayuda='Toca, di "Hello, Allison!" y toca otra vez' />
              </>
            )}
          </div>
          {!microOk && (
            <p className="flex items-start gap-2 text-[13px] font-semibold text-texto-suave">
              <Icono nombre="teclado" className="mt-0.5 size-4 flex-none" />
              <span>
                ¿No funciona el micrófono? Sigue con el teclado: en cada actividad está al lado del micrófono, y lo puedes arreglar
                después.
              </span>
            </p>
          )}
          <button
            type="button"
            onClick={() => setPaso(3)}
            className={
              microOk
                ? "degradado-primario sombra-accion rounded-2xl px-5 py-3.5 font-extrabold text-white"
                : "rounded-2xl border border-borde px-5 py-3.5 font-extrabold"
            }
          >
            {microOk ? "Continuar" : "Seguir con el teclado"}
          </button>
        </>
      )}

      {paso === 3 && (
        <>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Meta diaria">
            {(
              [
                [5, "Suave", "Unos minutos para no perder la racha"],
                [10, "Normal", "Una lección al día"],
                [15, "Intenso", "Avanzas más rápido"],
              ] as const
            ).map(([m, nombreMeta, texto]) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={meta === m}
                onClick={() => setMeta(m)}
                className={`flex flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-3 text-center ${
                  meta === m ? "border-primario bg-primario-suave" : "border-borde"
                }`}
              >
                <b className={`text-3xl font-black ${meta === m ? "text-primario" : ""}`}>{m}</b>
                <span className="text-xs font-extrabold">min · {nombreMeta}</span>
                <span className="text-[11.5px] leading-tight font-semibold text-texto-suave">{texto}</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-borde px-4 py-3">
            <input type="checkbox" checked={conRecordatorio} onChange={(e) => setConRecordatorio(e.target.checked)} className="size-5 accent-[var(--primario)]" />
            <span className="flex-1 leading-tight">
              <b className="block font-extrabold">Te aviso por correo</b>
              <span className="text-[13px] font-semibold text-texto-suave">si tu racha está por perderse</span>
            </span>
            <input
              type="time"
              value={hora}
              disabled={!conRecordatorio}
              onChange={(e) => setHora(e.target.value)}
              aria-label="Hora del recordatorio"
              className="rounded-xl border border-borde bg-superficie px-2 py-1.5 font-bold disabled:opacity-40"
            />
          </label>
          <p className="text-[13px] font-semibold text-texto-suave">Lo puedes cambiar cuando quieras en Perfil.</p>
          {error && <p className="text-center text-sm font-bold text-oro">{error}</p>}
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="degradado-primario sombra-accion mt-auto rounded-2xl px-5 py-3.5 font-extrabold text-white disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Continuar"}
          </button>
        </>
      )}

      {paso === 4 && (
        <>
          {primeraLeccion ? (
            <div className="flex flex-col gap-3 rounded-3xl border border-borde p-4">
              <div className="flex items-center gap-3">
                {primeraLeccion.sello && (
                  <Estampilla lugar={primeraLeccion.sello} numero={1} className="block w-14 flex-none -rotate-6" />
                )}
                <div className="leading-tight">
                  <small className="text-[11px] font-extrabold tracking-[0.06em] text-primario uppercase">
                    Parada 1 · {primeraLeccion.titulo}
                  </small>
                  <b className="block text-lg font-black">Lección 1: {primeraLeccion.leccion}</b>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-superficie-2 px-3 py-2.5">
                <span className="grid size-10 flex-none place-items-center rounded-full bg-[#3b82f6] text-white">
                  <Icono nombre="play" className="size-5" />
                </span>
                <span className="leading-tight">
                  <b className="block font-extrabold">Escucha y elige</b>
                  <span className="text-[13px] font-semibold text-texto-suave">Gratis · unos 2 minutos</span>
                </span>
                <span className="ml-auto rounded-full bg-oro-suave px-2.5 py-1 text-xs font-extrabold text-oro">Tu primera estrella</span>
              </div>
            </div>
          ) : (
            <p className="rounded-3xl border border-borde p-4 text-sm font-semibold text-texto-suave">
              En cada ciudad conversas con Allison sobre un tema de tu nivel y ganas su estampilla. Las lecciones de este nivel llegan
              pronto.
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push(primeraLeccion ? `/ruta/${primeraLeccion.parada}/leccion/1?primera=1` : "/ruta")}
            className="degradado-primario sombra-accion mt-auto rounded-2xl px-5 py-4 font-extrabold text-white"
          >
            {primeraLeccion ? "Empezar mi primera lección" : "Ver mi ruta"}
          </button>
        </>
      )}
    </main>
  );
}
