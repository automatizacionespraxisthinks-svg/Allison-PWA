import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { EscenaChat } from "@/components/ruta/EscenaChat";
import { sql } from "@/lib/db";
import { buscarEscenario, CATALOGO } from "@/lib/escenarios/catalogo";
import { claveDeRuta, ESTILO_CATEGORIA } from "@/lib/escenarios/categorias";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Escenario · Allison" };

/** Un escenario del catálogo o uno propio, por dentro (como un viaje: pantalla 8). */
export default async function PaginaEscenario({ params }: { params: Promise<{ clave: string }> }) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const clave = claveDeRuta(decodeURIComponent((await params).clave));
  const encontrado = await buscarEscenario(alumno.id, clave);
  if (!encontrado) notFound();
  // Respeta su nivel mínimo (plan, sección 22), aunque no dependa de Mi ruta.
  if (!encontrado.abierto(alumno.nivel)) redirect("/escenarios");

  const e = encontrado.escenario;
  const delCatalogo = CATALOGO.find((c) => c.clave === clave);
  const categoria = delCatalogo?.categoria ?? "Míos";
  const [avance] = await sql`select estrellas from escenarios_avance where user_id = ${alumno.id} and escenario = ${clave}`;

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <EscenaChat
        d={{
          inicio: { actividad: "catalogo", clave },
          portada: {
            imagen: e.imagen ? `/ilustraciones/a1/${e.imagen}.webp` : "",
            rotulo: `Escenarios · ${categoria}`,
            titulo: delCatalogo?.titulo ?? e.titulo,
            clase: ESTILO_CATEGORIA[categoria].clase,
            icono: ESTILO_CATEGORIA[categoria].icono,
          },
          guia: { rotulo: `Allison es ${minuscula(e.personaje)}`, detalle: e.contexto, papel: sinArticulo(e.personaje) },
          mision: "Tu misión",
          tareas: e.tareas.map((t) => t.replace(/\.$/, "")),
          minimo: e.minimoIntervenciones,
          logrado: e.resumen,
          volver: { href: "/escenarios", texto: "Volver a Escenarios" },
          estrellasAntes: Number(avance?.estrellas ?? 0),
        }}
        ctx={{ nivel: alumno.nivel, nombre: alumno.nombre }}
      />
    </ConNavegacion>
  );
}

function minuscula(t: string) {
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/** "La mesera del restaurante" → "Mesera del restaurante", para la barra de arriba. */
function sinArticulo(t: string) {
  const sin = t.replace(/^(el|la|los|las|un|una)\s+/i, "");
  return sin.charAt(0).toUpperCase() + sin.slice(1);
}
