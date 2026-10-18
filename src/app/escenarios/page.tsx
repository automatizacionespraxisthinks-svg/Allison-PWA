import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CatalogoEscenarios } from "@/components/escenarios/CatalogoEscenarios";
import { ConNavegacion } from "@/components/Navegacion";
import { sql } from "@/lib/db";
import { tarjetasDe } from "@/lib/escenarios/catalogo";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Escenarios · Allison" };

/** Escenarios (pantalla 5): el catálogo por categorías y los escenarios propios. */
export default async function PaginaEscenarios() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const [tarjetas, [saldo]] = await Promise.all([
    tarjetasDe(alumno.id, alumno.nivel),
    sql`select coalesce(mensajes_plan, 0) + coalesce(mensajes_recarga, 0) as total from saldos where user_id = ${alumno.id}`,
  ]);
  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <CatalogoEscenarios tarjetas={tarjetas} saldo={Number(saldo?.total ?? 0)} />
    </ConNavegacion>
  );
}
