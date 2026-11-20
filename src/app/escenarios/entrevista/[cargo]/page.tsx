import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { EscenaChat } from "@/components/ruta/EscenaChat";
import { sql } from "@/lib/db";
import { AVANCE_ENTREVISTA } from "@/lib/escenarios/catalogo";
import { ESTILO_CATEGORIA } from "@/lib/escenarios/categorias";
import { cargoDeRuta, claveDeEntrevista, escenarioDeEntrevista } from "@/lib/escenarios/entrevista";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Entrevista de trabajo · Allison" };

/** La entrevista de trabajo, por dentro: Ms. Carter y la versión del nivel del alumno. */
export default async function PaginaEntrevistaCargo({ params }: { params: Promise<{ cargo: string }> }) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const cargo = cargoDeRuta(decodeURIComponent((await params).cargo));
  if (!cargo) notFound();

  const e = escenarioDeEntrevista(alumno.nivel, cargo);
  const [avance] = await sql`
    select estrellas from escenarios_avance where user_id = ${alumno.id} and escenario = ${AVANCE_ENTREVISTA}
  `;
  const estilo = ESTILO_CATEGORIA.Trabajo;

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <EscenaChat
        d={{
          inicio: { actividad: "catalogo", clave: claveDeEntrevista(cargo) },
          portada: { imagen: `/ilustraciones/a1/${e.imagen}.webp`, rotulo: "Escenarios · Trabajo", titulo: e.titulo, clase: estilo.clase, icono: estilo.icono },
          guia: { rotulo: "Allison es Ms. Carter, la entrevistadora", detalle: e.contexto, papel: "Ms. Carter, entrevistadora" },
          mision: "Tu entrevista",
          tareas: e.tareas.map((t) => t.replace(/\.$/, "")),
          minimo: e.minimoIntervenciones,
          logrado: e.resumen,
          volver: { href: "/escenarios/entrevista", texto: "Volver a la entrevista" },
          estrellasAntes: Number(avance?.estrellas ?? 0),
          ...(e.imprevisto ? { imprevisto: { despuesDeTarea: e.imprevisto.despuesDeTarea, tarea: e.imprevisto.tarea } } : {}),
          informe: true,
        }}
        ctx={{ nivel: alumno.nivel, nombre: alumno.nombre }}
      />
    </ConNavegacion>
  );
}
