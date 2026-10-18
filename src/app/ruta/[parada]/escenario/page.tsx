import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { LugarSello } from "@/components/ruta/Estampilla";
import { Escenario } from "@/components/ruta/Escenario";
import { separarIdiomas } from "@/lib/allison";
import { sql } from "@/lib/db";
import { estadoRutaDe } from "@/lib/ruta/avance";
import { contenidoDe, pasoDe } from "@/lib/ruta/estado";
import { selloDe } from "@/lib/ruta/sellos";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Escenario · Allison" };

/**
 * El escenario de cierre de una parada (pantallas 10 y 11) y, con
 * ?salto=1, el intento de saltar hasta ella (pantalla 19b).
 */
export default async function PaginaEscenario({
  params,
  searchParams,
}: {
  params: Promise<{ parada: string }>;
  searchParams: Promise<{ salto?: string }>;
}) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const { parada: clave } = await params;
  const salto = (await searchParams).salto === "1";

  const ubicado = pasoDe(clave);
  const estado = await estadoRutaDe(alumno.id, alumno.nivel);
  const p = estado?.paradas.find((x) => x.clave === clave);
  if (!ubicado || !estado || !p) notFound();
  if (salto ? !p.puedeSaltar : p.escenario.estado === "bloqueado") redirect(`/ruta/${clave}`);

  const e = contenidoDe(ubicado.paso).escenario;
  const indice = estado.paradas.findIndex((x) => x.clave === clave);
  const siguiente = estado.paradas[indice + 1];
  const enCurso = estado.paradas.findIndex((x) => x.estado === "en-curso");
  // Las paradas que quedarían saltadas, desde la que va hasta esta: "Las
  // paradas 3, 4 y 5", "La parada 5 y el Repaso 1".
  const tramo = salto ? estado.paradas.slice(Math.max(0, enCurso), indice + 1) : [];
  const numeros = tramo.filter((x) => x.tipo === "parada").map((x) => x.nombre.replace("Parada ", ""));
  const partes = [
    numeros.length ? `${numeros.length === 1 ? "la parada" : "las paradas"} ${unir(numeros)}` : "",
    ...tramo.filter((x) => x.tipo === "repaso").map((x) => `el ${x.nombre}`),
  ].filter(Boolean);
  const saltadas = partes.length ? [unir(partes).replace(/^./, (c) => c.toUpperCase())] : [];
  // Dónde sigue si no pasa: la lección en la que iba.
  const ibaEn = estado.siguiente ? estado.paradas.find((x) => x.clave === estado.siguiente!.parada) : null;
  const donde =
    ibaEn && estado.siguiente
      ? {
          href: `/ruta/${ibaEn.clave}${typeof estado.siguiente.leccion === "number" ? `?leccion=${estado.siguiente.leccion}` : ""}`,
          texto: `${ibaEn.nombre} · ${typeof estado.siguiente.leccion === "number" ? `lección ${estado.siguiente.leccion}` : "escenario"}`,
        }
      : { href: "/ruta", texto: "Mi ruta" };
  // El cierre cuando no lo logra: la parte en español del ejemplo aprobado ("Vamos a repasar…").
  const cierre = e.siSeAtasca.find((s) => /intervenciones/i.test(s.situacion));
  const repaso = cierre ? separarIdiomas(cierre.ejemplo).espanol.trim() : "";

  const [saldo] = await sql`
    select coalesce(mensajes_plan, 0) + coalesce(mensajes_recarga, 0) as total from saldos where user_id = ${alumno.id}
  `;

  return (
    <Escenario
      parada={{
        clave,
        nombre: p.nombre,
        ciudad: p.ciudad,
        sello: selloDe(p) as LugarSello | null,
        numeroSello: p.numeroSello,
        yaGanado: p.sello,
      }}
      e={{
        titulo: e.titulo,
        imagen: e.imagen,
        contexto: e.contexto,
        personaje: e.personaje,
        tareas: e.tareas,
        minimo: e.minimoIntervenciones,
        maximo: e.maximoIntervenciones,
        resumen: e.resumen.split(/\s*Para la próxima/)[0].trim(),
        repaso,
        momentos: e.momentos ?? [],
        ayudaDesdeSegundoFallo: !!e.ayudaDesdeSegundoFallo,
        imprevisto: e.imprevisto ? { despuesDeTarea: e.imprevisto.despuesDeTarea, tarea: e.imprevisto.tarea } : null,
      }}
      salto={salto ? { saltadas, saldo: Number(saldo?.total ?? 0), hoy: p.saltoHoy, donde } : null}
      siguiente={
        siguiente
          ? { href: `/ruta/${siguiente.clave}`, texto: `Ir a ${siguiente.tipo === "parada" ? "la" : "el"} ${siguiente.nombre}` }
          : { href: "/ruta", texto: "Volver a mi ruta" }
      }
      ctx={{ nivel: alumno.nivel, nombre: alumno.nombre }}
    />
  );
}

/** "3, 4 y 5" */
function unir(lista: string[]): string {
  return lista.length <= 1 ? (lista[0] ?? "") : `${lista.slice(0, -1).join(", ")} y ${lista[lista.length - 1]}`;
}
