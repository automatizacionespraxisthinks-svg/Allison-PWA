import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConNavegacion } from "@/components/Navegacion";
import { CelebracionSalon } from "@/components/ruta/CelebracionSalon";
import { HitoRacha } from "@/components/ruta/HitoRacha";
import { repasoDeHoy } from "@/lib/ruta/repaso";
import { MiRuta } from "@/components/ruta/MiRuta";
import { RutaNueva } from "@/components/ruta/RutaNueva";
import { RutaProvisional } from "@/components/ruta/RutaProvisional";
import { salonDe } from "@/lib/competencia";
import { sql } from "@/lib/db";
import { estadoRutaDe, minutosDeHoy } from "@/lib/ruta/avance";
import { fraseDelDia } from "@/lib/ruta/frases";
import type { EstadoDeRuta } from "@/lib/ruta/estado";
import { rutaProvisionalDe } from "@/lib/ruta/provisional";
import { alumnoActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mi ruta · Allison" };

/**
 * Mi ruta (pantalla 1): la pantalla de inicio del alumno. Un solo
 * camino para todo el viaje del nivel, con un solo paso siguiente.
 */
/** "la Parada 3, en Nueva York": dónde sigue el alumno, para la pantalla de la ruta nueva. */
function dondeSigue(estado: EstadoDeRuta | null): string | null {
  const p = estado?.paradas.find((x) => x.clave === estado.siguiente?.parada);
  return p ? `${p.tipo === "parada" ? "la " : "el "}${p.nombre}, en ${p.ciudad}` : null;
}

export default async function PaginaRuta() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");
  // Quien entra por primera vez empieza por la primera sesión guiada.
  if (!alumno.primeraSesion) redirect("/empezar");

  const [estado, minutosHoy, [{ hoy }], salon] = await Promise.all([
    estadoRutaDe(alumno.id, alumno.nivel),
    minutosDeHoy(alumno.id),
    sql`select to_char(current_date, 'YYYY-MM-DD') as hoy`,
    // Solo los alumnos de colegio con curso; los particulares no tienen salón.
    alumno.institucionId ? salonDe(alumno.id) : null,
  ]);
  // La frase del día sale de las paradas a las que ya llegó.
  const enCurso = estado ? Math.max(0, estado.paradas.findIndex((p) => p.clave === estado.siguiente?.parada)) : 0;
  const frase = estado ? fraseDelDia(alumno.nivel, enCurso, hoy) : null;
  const repaso = estado ? await repasoDeHoy(alumno.id, alumno.nivel, false) : null;

  return (
    <ConNavegacion racha={alumno.rachaDias}>
      {estado ? (
        <MiRuta
          estado={estado}
          nombre={alumno.nombre}
          racha={alumno.rachaDias}
          minutosHoy={minutosHoy}
          metaMin={alumno.metaDiariaMin}
          frase={frase}
          repaso={repaso ? { empezado: "id" in repaso } : null}
          salon={salon}
        />
      ) : (
        <RutaProvisional
          ruta={await rutaProvisionalDe(alumno.id, alumno.nivel)}
          nombre={alumno.nombre}
          racha={alumno.rachaDias}
          minutosHoy={minutosHoy}
          metaMin={alumno.metaDiariaMin}
          salon={salon}
        />
      )}
      {/* Debajo del hito de racha: si salen los dos, el hito queda encima y esta después. */}
      {salon?.gano && <CelebracionSalon curso={salon.curso} gano={salon.gano} />}
      <HitoRacha racha={alumno.rachaDias} nombre={alumno.nombre} hoy={hoy} />
      {/* Alumnos actuales: la primera vez, Allison les cuenta la ruta nueva. */}
      {!alumno.rutaPresentada && <RutaNueva nombre={alumno.nombre} donde={dondeSigue(estado)} />}
    </ConNavegacion>
  );
}
