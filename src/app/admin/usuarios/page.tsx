import { BuscadorUsuarios } from "@/components/admin/BuscadorUsuarios";
import { buscarUsuarios } from "@/lib/admin";

export default async function PaginaUsuariosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const usuarios = q ? await buscarUsuarios(q) : [];

  return <BuscadorUsuarios consulta={q ?? ""} usuarios={usuarios} />;
}
