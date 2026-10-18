"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useAvisos } from "@/lib/avisosCliente";
import { animacionesActivas, fijarAnimaciones, fijarSonidos, sonar, sonidosActivos } from "@/lib/sonidos";

/** La meta diaria y la hora del recordatorio de la racha (Perfil · Ajustes). */
export function AjustesMeta({ meta: inicial, hora: horaInicial }: { meta: number; hora: string | null }) {
  const [meta, setMeta] = useState(inicial);
  const [con, setCon] = useState(!!horaInicial);
  const [hora, setHora] = useState(horaInicial ?? "19:00");
  const [aviso, setAviso] = useState<string | null>(null);

  async function guardar() {
    setAviso(null);
    const r = await fetch("/api/ruta/inicio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "ajustes", meta, hora: con ? hora : null }),
    }).catch(() => null);
    setAviso(r?.ok ? "Guardado." : "No se pudo guardar. Intenta otra vez.");
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-borde bg-superficie p-5">
      <h2 className="font-bold">Meta diaria y recordatorio</h2>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Meta diaria">
        {[5, 10, 15].map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={meta === m}
            onClick={() => setMeta(m)}
            className={`rounded-xl border-2 px-2 py-2.5 text-center font-extrabold ${meta === m ? "border-primario bg-primario-suave text-primario" : "border-borde"}`}
          >
            {m} min
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={con} onChange={(e) => setCon(e.target.checked)} className="size-5 accent-[var(--primario)]" />
        <span className="flex-1">
          Avisarme si mi racha está por perderse
          <small className="block text-xs text-texto-suave">En este celular si activas los avisos; si no, por correo.</small>
        </span>
        <input
          type="time"
          value={hora}
          disabled={!con}
          onChange={(e) => setHora(e.target.value)}
          aria-label="Hora del recordatorio"
          className="rounded-xl border border-borde bg-superficie px-2 py-1.5 font-bold disabled:opacity-40"
        />
      </label>
      {aviso && (
        <p role="status" className="text-sm font-semibold text-texto-suave">
          {aviso}
        </p>
      )}
      <button type="button" onClick={guardar} className="rounded-xl bg-primario px-4 py-3 font-semibold text-white">
        Guardar
      </button>
    </section>
  );
}

/**
 * Avisos en este celular (documento "Competencia por salón y
 * recordatorios en el celular"): el recordatorio de la racha como
 * notificación. Va en vez del correo, uno al día como mucho. Para los
 * alumnos de colegio es el único posible: no tienen correo.
 */
export function AvisosCelular() {
  const { estado, hora, ocupado, activar, desactivar } = useAvisos();
  const [aviso, setAviso] = useState<string | null>(null);
  // Sin las llaves del servidor no hay nada que ofrecer.
  if (estado === "cargando" || estado === "sin-configurar") return null;

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-borde bg-superficie p-5">
      <h2 className="font-bold">Avisos en este celular</h2>
      <p className="text-sm text-texto-suave">
        Si tu racha está por perderse, te aviso aquí{hora ? ` a las ${hora}` : ""} en vez del correo. Uno al día como mucho.
      </p>
      {estado === "activo" && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-extrabold text-menta">Activados en este celular</span>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void desactivar().then(() => setAviso(null))}
            className="rounded-xl border border-borde px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            Apagar
          </button>
        </div>
      )}
      {estado === "inactivo" && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() =>
            void activar().then((ok) =>
              setAviso(ok ? "Listo: te aviso en este celular. La hora la cambias arriba." : "No se activaron. Si el celular preguntó, toca Permitir.")
            )
          }
          className="rounded-xl bg-primario px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {ocupado ? "Activando…" : "Activar avisos"}
        </button>
      )}
      {estado === "bloqueado" && (
        <p className="text-sm font-semibold text-oro">
          Bloqueaste los avisos de Allison. Para activarlos, permítelos en los ajustes del navegador (el candado junto a la dirección).
        </p>
      )}
      {estado === "ios-instalar" && (
        <p className="text-sm font-semibold text-texto-suave">
          En iPhone los avisos funcionan con Allison en la pantalla de inicio: en Safari toca Compartir y luego «Agregar a inicio». Ábrela
          desde ahí y vuelve a este ajuste.
        </p>
      )}
      {estado === "no-compatible" && (
        <p className="text-sm font-semibold text-texto-suave">Este navegador no recibe avisos. En Android, prueba con Chrome.</p>
      )}
      {aviso && (
        <p role="status" className="text-sm font-semibold text-texto-suave">
          {aviso}
        </p>
      )}
    </section>
  );
}

export function CerrarSesion() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-3xl border border-borde bg-superficie px-5 py-4 text-left font-bold text-texto-suave hover:bg-superficie-2"
    >
      Cerrar sesión
    </button>
  );
}

/** Animaciones y sonidos: cortos y se pueden apagar (plan, sección 11). En este aparato. */
export function AjustesAnimaciones() {
  const [sonidos, setSonidos] = useState(true);
  const [animaciones, setAnimaciones] = useState(true);
  // Se leen después de montar: en el servidor no hay localStorage.
  useEffect(() => {
    const t = setTimeout(() => {
      setSonidos(sonidosActivos());
      setAnimaciones(animacionesActivas());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const interruptor = (activo: boolean, cambiar: (v: boolean) => void, texto: string, detalle: string) => (
    <label className="flex items-center gap-3">
      <span className="flex-1 leading-tight">
        <b className="block font-semibold">{texto}</b>
        <span className="text-sm text-texto-suave">{detalle}</span>
      </span>
      <input type="checkbox" role="switch" checked={activo} onChange={(e) => cambiar(e.target.checked)} className="size-5 accent-[var(--primario)]" />
    </label>
  );

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-borde bg-superficie p-5">
      <h2 className="font-bold">Animaciones y sonidos</h2>
      {interruptor(
        sonidos,
        (v) => {
          setSonidos(v);
          fijarSonidos(v);
          if (v) sonar("acierto");
        },
        "Sonidos",
        "Al acertar y al terminar una lección"
      )}
      {interruptor(
        animaciones,
        (v) => {
          setAnimaciones(v);
          fijarAnimaciones(v);
        },
        "Animaciones",
        "Allison respira, las calcomanías rebotan"
      )}
      <p className="text-xs text-texto-suave">Se guarda en este aparato.</p>
    </section>
  );
}
