import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { LugarSello } from "@/components/ruta/Estampilla";
import { Leccion } from "@/components/ruta/leccion/Leccion";
import { adivinaParaElNavegador } from "@/lib/ruta/adivina";
import { estadoRutaDe } from "@/lib/ruta/avance";
import { contenidoDe, pasoDe } from "@/lib/ruta/estado";
import { selloDe } from "@/lib/ruta/sellos";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Lección · Allison" };

/** Una lección de la ruta: sus tres actividades a pantalla completa, sin el menú. */
export default async function PaginaLeccion({
  params,
  searchParams,
}: {
  params: Promise<{ parada: string; n: string }>;
  searchParams: Promise<{ primera?: string }>;
}) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const { parada: clave, n } = await params;
  const { primera } = await searchParams;
  const numero = Number(n);

  const ubicado = pasoDe(clave);
  const estado = await estadoRutaDe(alumno.id, alumno.nivel);
  const enMapa = estado?.paradas.find((p) => p.clave === clave);
  const leccion = ubicado ? contenidoDe(ubicado.paso).lecciones.find((l) => l.numero === numero) : undefined;
  const lm = enMapa?.lecciones.find((l) => l.numero === numero);
  if (!ubicado || !enMapa || !leccion || !lm) notFound();
  // Una lección bloqueada lleva a la pantalla de su parada, que lo explica.
  if (lm.estado === "bloqueada") redirect(`/ruta/${clave}?leccion=${numero}`);

  const hechas = enMapa.lecciones.filter((l) => l.estado === "hecha" && l.numero !== numero).length;
  const proxima = enMapa.lecciones.find((l) => l.numero > numero && l.estado !== "hecha");
  const siguiente = proxima
    ? { href: `/ruta/${clave}?leccion=${proxima.numero}`, texto: `Seguir con la lección ${proxima.numero}` }
    : { href: `/ruta/${clave}/escenario`, texto: `Ir al escenario de ${enMapa.ciudad}` };

  return (
    <Leccion
      datos={{
        parada: clave,
        numero,
        titulo: leccion.titulo,
        // En Adivina, en qué piensa Allison no sale del servidor.
        actividades: leccion.actividades.map((a) => (a.tipo === "adivina" ? adivinaParaElNavegador(a) : a)),
        pasoInicial: lm.paso,
        ciudad: enMapa.ciudad,
        sello: selloDe(enMapa) as LugarSello | null,
        numeroSello: enMapa.numeroSello,
        hechas,
        total: enMapa.lecciones.length,
        siguiente,
      }}
      ctx={{ nivel: alumno.nivel, nombre: alumno.nombre }}
      primera={primera === "1"}
    />
  );
}
