"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "./ruta/Iconos";

/**
 * El menú de la app (plan, secciones 11 y 17): Mi ruta · Viajes · Hablar
 * · Escenarios · Perfil. En el celular es una barra abajo con cinco
 * íconos; en el computador, una columna fija a la izquierda, con texto y
 * la racha abajo.
 *
 * Hablar va al centro y resaltado. Dentro de Hablar se ve plano, porque
 * ahí el micrófono grande es el de grabar y no se repite (pantalla 4).
 * Su ícono son dos globos, no un micrófono: en cada pantalla hay un solo
 * micrófono.
 */
const SECCIONES: { href: string; texto: string; icono: NombreIcono; prefijos: string[] }[] = [
  { href: "/ruta", texto: "Mi ruta", icono: "ruta", prefijos: ["/ruta"] },
  { href: "/viajes", texto: "Viajes", icono: "viajes", prefijos: ["/viajes"] },
  { href: "/practicar", texto: "Hablar", icono: "charla", prefijos: ["/practicar", "/conversaciones"] },
  { href: "/escenarios", texto: "Escenarios", icono: "escenarios", prefijos: ["/escenarios"] },
  { href: "/perfil", texto: "Perfil", icono: "perfil", prefijos: ["/perfil", "/progreso", "/glosario", "/recargar", "/planes"] },
];

export function Navegacion({ racha }: { racha?: number }) {
  const ruta = usePathname() ?? "";
  const activa = SECCIONES.find((s) => s.prefijos.some((p) => ruta === p || ruta.startsWith(`${p}/`)))?.href;
  const enHablar = activa === "/practicar";

  return (
    <>
      {/* Celular: barra de abajo */}
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-1 pt-1.5 pb-1">
          {SECCIONES.map((s) => {
            const on = activa === s.href;
            const centro = s.href === "/practicar" && !enHablar;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 text-[11px] leading-tight ${
                    on ? "font-extrabold text-primario" : "font-semibold text-texto-suave"
                  }`}
                >
                  {centro ? (
                    <span className="-mt-5 grid size-12 place-items-center rounded-full border-4 border-superficie bg-primario text-white shadow-sm">
                      <Icono nombre={s.icono} className="size-[22px]" />
                    </span>
                  ) : (
                    <Icono nombre={s.icono} className="size-[22px]" />
                  )}
                  {s.texto}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Computador: columna fija a la izquierda */}
      <nav
        aria-label="Secciones"
        className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-borde bg-superficie px-3 py-6 lg:flex"
      >
        <Link href="/ruta" className="mb-6 px-3 text-xl font-black tracking-tight text-primario">
          Allison
        </Link>
        <ul className="flex flex-col gap-1">
          {SECCIONES.map((s) => {
            const on = activa === s.href;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition ${
                    on ? "bg-primario-suave font-extrabold text-primario" : "font-semibold text-texto-suave hover:bg-superficie-2"
                  }`}
                >
                  <Icono nombre={s.icono} className="size-[22px]" />
                  {s.texto}
                </Link>
              </li>
            );
          })}
        </ul>
        {racha !== undefined && (
          <p className="mt-auto flex items-center gap-2 rounded-xl bg-oro-suave px-3 py-2.5 text-sm font-bold text-oro">
            <Icono nombre="racha" className="size-5" />
            {racha} {racha === 1 ? "día seguido" : "días seguidos"}
          </p>
        )}
      </nav>
    </>
  );
}

/** El contenido de una pantalla con menú: deja libre el espacio de la barra o de la columna. */
export function ConNavegacion({ racha, children }: { racha?: number; children: React.ReactNode }) {
  return (
    <>
      <Navegacion racha={racha} />
      <div className="min-h-dvh pb-24 lg:pb-0 lg:pl-56">{children}</div>
    </>
  );
}
