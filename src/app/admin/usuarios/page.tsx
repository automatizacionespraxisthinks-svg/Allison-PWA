import { BuscadorUsuarios } from "@/components/admin/BuscadorUsuarios";
import { buscarUsuarios, paginaDeAdmin } from "@/lib/admin";
import { finDelMesDelPlan } from "@/lib/cobro";
import { configPrecios } from "@/lib/precios";

export default async function PaginaUsuariosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await paginaDeAdmin();
  const { q } = await searchParams;
  const usuarios = q ? await buscarUsuarios(q) : [];
  // Para el ajuste en la bolsa del plan: cuándo vence de verdad, o que no
  // hay plan (auditoría, 30 de octubre de 2026).
  const planVence = await finDelMesDelPlan(usuarios.map((u) => u.id));

  return (
    <BuscadorUsuarios consulta={q ?? ""} usuarios={usuarios} cfg={configPrecios()} planVence={planVence} />
  );
}
