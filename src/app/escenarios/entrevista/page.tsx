import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PrepararEntrevista } from "@/components/escenarios/PrepararEntrevista";
import { ConNavegacion } from "@/components/Navegacion";
import { sql } from "@/lib/db";
import { AVANCE_ENTREVISTA } from "@/lib/escenarios/catalogo";
import { cargosPara } from "@/lib/escenarios/entrevista";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Entrevista de trabajo · Allison" };

/** La entrevista de trabajo: elegir el cargo y prepararse (gratis, sin IA). */
export default async function PaginaEntrevista() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const [avance] = await sql`
    select estrellas, veces from escenarios_avance where user_id = ${alumno.id} and escenario = ${AVANCE_ENTREVISTA}
  `;
  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <PrepararEntrevista
        // En una cuenta de colegio van primero el primer empleo y la beca.
        cargos={cargosPara(!!alumno.institucionId)}
        nivel={alumno.nivel}
        estrellas={Number(avance?.estrellas ?? 0)}
        veces={Number(avance?.veces ?? 0)}
      />
    </ConNavegacion>
  );
}
