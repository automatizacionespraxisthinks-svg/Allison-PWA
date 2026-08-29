import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";

/**
 * Todo lo que cuelgue de /admin pasa por aquí.
 *
 * La comprobación de rol vive en el layout y no en cada página: así una
 * pantalla nueva queda protegida aunque a quien la escriba se le olvide.
 */
export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await exigirAdmin();
  if (!admin) redirect("/practicar");

  const enlaces = [
    { href: "/admin", texto: "Resumen" },
    { href: "/admin/colegios", texto: "Colegios" },
    { href: "/admin/usuarios", texto: "Usuarios" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-5">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-borde pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-texto px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-fondo">
            Admin
          </span>
          <nav className="flex gap-1">
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
