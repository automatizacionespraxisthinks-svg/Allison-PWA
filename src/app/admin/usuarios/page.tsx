import { BuscadorUsuarios } from "@/components/admin/BuscadorUsuarios";
import { listarUsuarios, paginaDeAdmin } from "@/lib/admin";
import { finDelMesDelPlan } from "@/lib/cobro";
import { colegiosParaFiltro } from "@/lib/panel/consumo";
import { configPrecios } from "@/lib/precios";

const NIVELES = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ORDENES = ["recientes", "practica", "nombre"] as const;

/**
 * Alumnos: al entrar, los últimos que se registraron; el buscador filtra
 * mientras se escribe (nombre, correo, celular o usuario), y se puede
 * filtrar por colegio y nivel.
 */
export default async function PaginaUsuariosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; colegio?: string; nivel?: string; orden?: string }>;
}) {
  await paginaDeAdmin();
  const p = await searchParams;
  const colegios = await colegiosParaFiltro();
  const colegio = p.colegio === "particulares" || colegios.some((c) => c.id === p.colegio) ? p.colegio : undefined;
  const nivel = NIVELES.includes(p.nivel ?? "") ? p.nivel : undefined;
  const orden = ORDENES.find((o) => o === p.orden) ?? "recientes";
  const { usuarios, total } = await listarUsuarios({ q: p.q, colegio, nivel, orden });
  // Para el ajuste en la bolsa del plan: cuándo vence de verdad, o que no
  // hay plan (auditoría, 30 de octubre de 2026).
  const planVence = await finDelMesDelPlan(usuarios.map((u) => u.id));

  return (
    <BuscadorUsuarios
      consulta={p.q ?? ""}
      usuarios={usuarios}
      total={total}
      filtrado={!!(p.q?.trim() || colegio || nivel)}
      orden={orden}
      colegios={colegios}
      niveles={NIVELES}
      cfg={configPrecios()}
      planVence={planVence}
    />
  );
}
