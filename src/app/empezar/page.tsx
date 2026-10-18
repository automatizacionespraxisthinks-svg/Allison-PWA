import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { LugarSello } from "@/components/ruta/Estampilla";
import { PrimeraSesion } from "@/components/ruta/PrimeraSesion";
import { rutaDe } from "@/lib/ruta";
import { claveDe, contenidoDe } from "@/lib/ruta/estado";
import { MAPAS } from "@/lib/ruta/mapas";
import { selloDe } from "@/lib/ruta/sellos";
import { alumnoActual } from "@/lib/sesion";
import { NIVELES, type Nivel } from "@/lib/tipos";

/** La primera lección de cada nivel que ya tiene ruta (A1 siempre; A2 y B1 con su interruptor). */
function primerasLecciones() {
  const primeras: Partial<Record<Nivel, { parada: string; titulo: string; leccion: string; sello: LugarSello | null }>> = {};
  for (const { nivel } of NIVELES) {
    const ruta = rutaDe(nivel);
    if (!ruta?.length) continue;
    const c = contenidoDe(ruta[0]);
    primeras[nivel] = {
      parada: claveDe(nivel, ruta[0]),
      titulo: c.titulo,
      leccion: c.lecciones[0].titulo,
      sello: selloDe({ tipo: ruta[0].tipo, nombre: "", ciudad: c.ciudad }) as LugarSello | null,
    };
  }
  return primeras;
}

export const metadata: Metadata = { title: "Bienvenida · Allison" };

/**
 * Pantalla 10: la primera sesión guiada. Cuatro pasos cortos con
 * Allison: el nivel, el micrófono, la meta diaria y el primer paso, que
 * es una actividad gratis y da la primera estrella. Ninguno gasta
 * intervenciones.
 */
export default async function PaginaEmpezar() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  if (alumno.primeraSesion) redirect("/ruta");

  return (
    <PrimeraSesion
      nombre={alumno.nombre}
      nivelActual={alumno.nivel}
      niveles={NIVELES.map((n) => ({
        nivel: n.nivel,
        pais: MAPAS[n.nivel].pais,
        primeraCiudad: MAPAS[n.nivel].paradas[0]?.ciudad ?? "",
      }))}
      primeras={primerasLecciones()}
    />
  );
}
