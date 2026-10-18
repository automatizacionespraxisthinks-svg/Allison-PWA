import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";

// Todo el panel son datos del momento: nunca se arma al compilar.
export const dynamic = "force-dynamic";

/**
 * El marco del panel. Este redirect solo es para la navegación normal:
 * en Next 16 una página se puede pedir sin volver a pasar por su layout,
 * así que la protección de verdad es `paginaDeAdmin()` en la primera
 * línea de cada página (`npm run probar:admin` lo revisa).
 */
export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await exigirAdmin();
  if (!admin) redirect("/practicar");

  // Las ocho secciones del panel (plan, sección 21).
  const enlaces = [
    { href: "/admin", texto: "Resumen" },
    { href: "/admin/uso", texto: "Uso e IA" },
    { href: "/admin/usuarios", texto: "Alumnos" },
    { href: "/admin/colegios", texto: "Colegios" },
    { href: "/admin/reportes", texto: "Reportes" },
    { href: "/admin/ruta", texto: "Ruta" },
    { href: "/admin/recargas", texto: "Recargas" },
    { href: "/admin/ajustes", texto: "Ajustes" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-borde pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-texto px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-fondo">
            Admin
          </span>
          <nav className="flex flex-wrap gap-1">
            {enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-texto-suave transition hover:bg-superficie-2"
              >
                {e.texto}
              </Link>
            ))}
          </nav>
        </div>
        <Link href="/practicar" className="text-sm text-texto-suave underline">
          Salir del panel
        </Link>
      </header>
      {children}
    </div>
  );
}
