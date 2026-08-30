import { redirect } from "next/navigation";
import { Conversacion } from "@/components/Conversacion";
import {
  conversacionActiva,
  conversacionDeLeccion,
  conversacionLibre,
  ultimosMensajes,
} from "@/lib/conversaciones";
import { META_LOGROS, unidad } from "@/lib/curriculo";
import { progresoDe, progresoLecciones } from "@/lib/progreso";
import { alumnoActual } from "@/lib/sesion";
import { PRUEBA_AL_VERIFICAR } from "@/lib/verificacion";

export default async function PaginaPracticar({
  searchParams,
}: {
  searchParams: Promise<{ leccion?: string; libre?: string }>;
}) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const { leccion: clavePedida, libre } = await searchParams;

  // Los logros solo hacen falta para la pantalla de fin de prueba: es
  // lo que le demuestra al alumno que el producto le sirvió.
  const p = alumno.enPrueba ? await progresoDe(alumno.id) : null;

  // ¿A qué hilo vuelve el alumno? A la lección que pidió, al hilo
  // libre si lo pidió, o a donde estaba la última vez.
  const unidadPedida = clavePedida ? unidad(clavePedida) : null;

  let conversacionId: string;
  let claveLeccion: string | null = null;

  if (unidadPedida) {
    conversacionId = await conversacionDeLeccion(
      alumno.id,
      alumno.nivel,
      unidadPedida.clave
    );
    claveLeccion = unidadPedida.clave;
  } else if (libre) {
    conversacionId = await conversacionLibre(alumno.id, alumno.nivel);
  } else {
    const activa = await conversacionActiva(alumno.id, alumno.nivel);
    conversacionId = activa.id;
    claveLeccion = activa.leccion;
  }

  const laLeccion = claveLeccion ? unidad(claveLeccion) : null;
  const avance = laLeccion ? await progresoLecciones(alumno.id) : {};
  const deEsta = laLeccion ? avance[laLeccion.clave] : undefined;

  const historial = await ultimosMensajes(conversacionId, 20);

  return (
    <Conversacion
      nombre={alumno.nombre}
      nivel={alumno.nivel}
      mensajesIniciales={alumno.mensajesPlan + alumno.mensajesRecarga}
      conversacionId={conversacionId}
      historial={historial.map((m) => ({ ...m, correcciones: m.correcciones }))}
      enPrueba={alumno.enPrueba}
      faltaVerificar={alumno.faltaVerificar}
      mensajesPorVerificar={PRUEBA_AL_VERIFICAR}
      esCoordinador={alumno.rol === "coordinador" || alumno.rol === "admin"}
      esAdmin={alumno.rol === "admin"}
      racha={alumno.rachaDias}
      leccion={
        laLeccion
          ? {
              clave: laLeccion.clave,
              titulo: laLeccion.titulo,
              gramatica: laLeccion.gramatica,
              logros: deEsta?.logros ?? 0,
              meta: META_LOGROS,
              completada: deEsta?.completada ?? false,
            }
          : undefined
      }
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
