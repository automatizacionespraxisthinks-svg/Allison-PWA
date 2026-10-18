import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RepasoSorpresa } from "@/components/ruta/RepasoSorpresa";
import { preguntaDe, repasoDeHoy } from "@/lib/ruta/repaso";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Repaso sorpresa · Allison" };

/** El repaso sorpresa (pantalla 9): se abre desde su tarjeta en Mi ruta. */
export default async function PaginaRepaso() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const r = await repasoDeHoy(alumno.id, alumno.nivel, true);
  if (!r || !("id" in r)) redirect("/ruta");

  // `n` es la posición en el repaso guardado: con ella el servidor sabe qué se espera.
  const preguntas = r.items.flatMap((it, n) => {
    const p = preguntaDe(it, n);
    return p ? [{ ...p, parada: it.parada, leccion: it.leccion }] : [];
  });
  if (!preguntas.length) redirect("/ruta");

  return <RepasoSorpresa id={r.id} preguntas={preguntas} ctx={{ nivel: alumno.nivel, nombre: alumno.nombre }} />;
}
