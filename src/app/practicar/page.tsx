import { redirect } from "next/navigation";
import { Conversacion } from "@/components/Conversacion";
import { progresoDe } from "@/lib/progreso";
import { alumnoActual } from "@/lib/sesion";
import { PRUEBA_AL_VERIFICAR } from "@/lib/verificacion";

export default async function PaginaPracticar() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  // Los logros solo hacen falta para la pantalla de fin de prueba: es
  // lo que le demuestra al alumno que el producto le sirvió.
  const p = alumno.enPrueba ? await progresoDe(alumno.id) : null;

  return (
    <Conversacion
      nombre={alumno.nombre}
      nivel={alumno.nivel}
      mensajesIniciales={alumno.mensajesPlan + alumno.mensajesRecarga}
      enPrueba={alumno.enPrueba}
      faltaVerificar={alumno.faltaVerificar}
      mensajesPorVerificar={PRUEBA_AL_VERIFICAR}
      logro={
        p
          ? {
              mensajes: p.totalMensajes,
              correcciones: p.temas.reduce((n, t) => n + t.veces, 0),
              temasDetectados: p.temas.filter((t) => t.estado !== "sin_datos")
                .length,
            }
          : undefined
      }
    />
  );
}
