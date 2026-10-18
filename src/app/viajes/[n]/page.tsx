import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { EscenaChat } from "@/components/ruta/EscenaChat";
import type { LugarSello } from "@/components/ruta/Estampilla";
import { pasaporteDeViajes } from "@/lib/ruta/pasaporteViajes";
import { sitioDeViaje } from "@/lib/ruta/viaje";
import { VIAJES } from "@/lib/ruta/viajes";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Viaje · Allison" };

/** Por dentro de un viaje (pantalla 8). */
export default async function PaginaViaje({ params }: { params: Promise<{ n: string }> }) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const numero = Number((await params).n);
  const v = VIAJES.find((x) => x.numero === numero);
  if (!v) notFound();

  const p = await pasaporteDeViajes(alumno.id, alumno.nivel);
  const enPasaporte = p.viajes.find((x) => x.numero === numero);
  // Un viaje cerrado (le falta nivel o el anterior) no se abre escribiendo la dirección.
  if (!enPasaporte?.abierto) redirect("/viajes");
  const sitio = sitioDeViaje(v);

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <EscenaChat
        d={{
          inicio: { actividad: "viaje", viaje: v.numero },
          portada: { imagen: `/ilustraciones/a1/${enPasaporte.clave}.webp`, rotulo: `Viaje ${v.numero} de ${VIAJES.length}`, titulo: v.pais },
          sello: { lugar: enPasaporte.clave as LugarSello, numero: v.numero, ganado: enPasaporte.ganado },
          guia: { rotulo: `Tu guía en ${sitio}`, detalle: "Te habla despacio y te ayuda si te atascas." },
          mision: `Tu misión en ${sitio}`,
          tareas: v.tareas,
          minimo: v.minimoIntervenciones,
          logrado: `¡Lo lograste! Viajaste a ${v.pais} hablando en inglés y cumpliste tu misión.`,
          volver: { href: "/viajes", texto: "Volver a Viajes" },
          estrellasAntes: enPasaporte.estrellas,
        }}
        ctx={{ nivel: alumno.nivel, nombre: alumno.nombre }}
      />
    </ConNavegacion>
  );
}
