"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Las ocho secciones del panel (plan, sección 21).
const ENLACES = [
  { href: "/admin", texto: "Resumen" },
  { href: "/admin/uso", texto: "Uso e IA" },
  { href: "/admin/usuarios", texto: "Alumnos" },
  { href: "/admin/colegios", texto: "Colegios" },
  { href: "/admin/reportes", texto: "Reportes" },
  { href: "/admin/ruta", texto: "Ruta" },
  { href: "/admin/recargas", texto: "Recargas" },
  { href: "/admin/ajustes", texto: "Ajustes" },
];

/**
 * El menú del panel: arriba la marca y "Salir del panel"; debajo las
 * secciones, con la activa resaltada. Si no caben en una línea bajan
 * ordenadas a la siguiente (antes "Ajustes" y "Salir" quedaban sueltos, y
 * deslizarlas de lado dejaba una barra gruesa y secciones cortadas).
 */
export function MenuAdmin() {
  const ruta = usePathname();
  const activa = (href: string) => (href === "/admin" ? ruta === "/admin" : ruta === href || ruta.startsWith(`${href}/`));
  return (
    <header className="mb-6 flex flex-col gap-2 border-b border-borde pb-3">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-texto px-2.5 py-1 text-xs font-bold tracking-wide text-fondo uppercase">Panel de administración</span>
        <Link href="/practicar" className="text-sm whitespace-nowrap text-texto-suave underline">
          Salir del panel
        </Link>
      </div>
      <nav aria-label="Secciones del panel" className="flex flex-wrap gap-1">
        {ENLACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activa(e.href) ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
              activa(e.href) ? "bg-primario-suave text-primario" : "text-texto-suave hover:bg-superficie-2"
            }`}
          >
            {e.texto}
          </Link>
        ))}
      </nav>
    </header>
  );
}
