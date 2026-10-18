import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AjustesAnimaciones, AjustesMeta, AvisosCelular, CerrarSesion } from "@/components/AjustesRuta";
import { FormularioPerfil } from "@/components/FormularioPerfil";
import { ConNavegacion } from "@/components/Navegacion";
import { SelectorNivel } from "@/components/SelectorNivel";
import { sql } from "@/lib/db";
import { opcionesDeNivel } from "@/lib/nivel";
import { perfilDe } from "@/lib/perfil";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Ajustes · Allison" };

/** El engrane del Perfil: datos, nivel, meta y recordatorio, cuenta y contraseña, cerrar sesión. */
export default async function PaginaAjustes() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  const [perfil, nivel, [u]] = await Promise.all([
    perfilDe(alumno.id),
    opcionesDeNivel(alumno.id),
    sql`select to_char(recordatorio_hora, 'HH24:MI') as hora from users where id = ${alumno.id}`,
  ]);
  if (!perfil || !nivel) redirect("/entrar");

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      <main className="mx-auto flex max-w-lg flex-col gap-5 px-4 py-5">
        <header className="flex items-center gap-3">
          <Link href="/perfil" aria-label="Volver al perfil" className="grid size-9 place-items-center rounded-full bg-superficie-2">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Ajustes</h1>
        </header>

        <section id="nivel" className="flex flex-col gap-2 rounded-3xl border border-borde bg-superficie p-5">
          <h2 className="font-bold">Tu nivel</h2>
          <p className="text-sm text-texto-suave">
            Puedes bajar de nivel cuando quieras. Para subir, completa todas las actividades de tu nivel.
          </p>
          <SelectorNivel nivel={nivel.actual} maximo={nivel.maximo} siguienteAbierto={nivel.siguienteAbierto} />
        </section>

        <AjustesMeta meta={alumno.metaDiariaMin} hora={u?.hora ?? null} />

        <AvisosCelular />

        <AjustesAnimaciones />

        <FormularioPerfil perfil={perfil} />

        <CerrarSesion />
      </main>
    </ConNavegacion>
  );
}
