import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { Guia } from "@/components/ruta/Guia";
import { estadoRutaDe } from "@/lib/ruta/avance";
import { contenidoDe, pasoDe } from "@/lib/ruta/estado";
import { frasesDe } from "@/lib/ruta/frases";
import { selloDe } from "@/lib/ruta/sellos";
import { alumnoActual } from "@/lib/sesion";
import type { LugarSello } from "@/components/ruta/Estampilla";

export const metadata: Metadata = { title: "Guía de frases · Allison" };

/**
 * Pantalla 7: la Guía de frases de una parada. Las frases salen de sus
 * lecciones, con la traducción aprobada: lo que se oye en Escucha y
 * elige y lo que se dice en Dilo en inglés. Es gratis.
 */
export default async function PaginaGuia({
  params,
  searchParams,
}: {
  params: Promise<{ parada: string }>;
  searchParams: Promise<{ leccion?: string }>;
}) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const { parada: clave } = await params;
  const { leccion } = await searchParams;

  const ubicado = pasoDe(clave);
  const estado = await estadoRutaDe(alumno.id, alumno.nivel);
  const p = estado?.paradas.find((x) => x.clave === clave);
  if (!ubicado || !p) notFound();
  const todas = frasesDe(ubicado.paso);
  const lecciones = contenidoDe(ubicado.paso).lecciones.map((l) => ({
    numero: l.numero,
    titulo: l.titulo,
    frases: todas.filter((f) => f.leccion === l.numero).map(({ en, es }) => ({ en, es })),
  }));

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <Guia
        parada={{
          clave,
          nombre: p.nombre,
          ciudad: p.ciudad,
          titulo: p.titulo,
          portada: p.portada,
          sello: selloDe(p) as LugarSello | null,
          numeroSello: p.numeroSello,
          ganado: p.sello,
        }}
        lecciones={lecciones.filter((l) => l.frases.length > 0)}
        inicial={Number(leccion) || 1}
        nivel={alumno.nivel}
      />
    </ConNavegacion>
  );
}
