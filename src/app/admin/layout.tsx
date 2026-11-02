import { redirect } from "next/navigation";
import { MenuAdmin } from "@/components/admin/MenuAdmin";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <MenuAdmin />
      <main>{children}</main>
    </div>
  );
}
