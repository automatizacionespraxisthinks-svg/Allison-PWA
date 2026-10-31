import { redirect } from "next/navigation";
import { Conversacion } from "@/components/Conversacion";
import { Navegacion } from "@/components/Navegacion";
import {
  conversacionActiva,
  conversacionDeLeccion,
  conversacionLibre,
  nuevaConversacion,
  ultimosMensajes,
} from "@/lib/conversaciones";
import { META_LOGROS, unidad } from "@/lib/curriculo";
import { progresoDe, progresoLecciones } from "@/lib/progreso";
import { configPrecios } from "@/lib/precios";
import { avisosPendientes, correccionesReportadas } from "@/lib/reportes";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaPracticar({
  searchParams,
}: {
  searchParams: Promise<{ leccion?: string; libre?: string; nueva?: string }>;
}) {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  const { leccion: clavePedida, libre, nueva } = await searchParams;

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
  } else if (nueva) {
    // "Nueva conversación" del menú: un hilo libre en blanco.
    conversacionId = await nuevaConversacion(alumno.id, alumno.nivel);
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

  const [historial, avisos] = await Promise.all([ultimosMensajes(conversacionId, 20), avisosPendientes(alumno.id)]);
  const reportadas = await correccionesReportadas(
    alumno.id,
    historial.filter((m) => m.rol === "alumno" && m.correcciones.length > 0).map((m) => m.id)
  );

  return (
    <>
    <Navegacion racha={alumno.rachaDias} />
    <div className="lg:pl-56">
    {/* key: "Nueva conversación" va de /practicar a /practicar?nueva=1, y
        cambiar solo la búsqueda NO vuelve a montar la página (Next
        conserva el estado). Conversacion guardaba el historial, la
        lección y el id del hilo viejo, y el turno siguiente seguía en el
        hilo viejo. Con el id como key, cada hilo monta una conversación
        nueva (auditoría, 30 de octubre de 2026). */}
    <Conversacion
      key={conversacionId}
      nombre={alumno.nombre}
      nivel={alumno.nivel}
      mensajesIniciales={alumno.mensajesPlan + alumno.mensajesRecarga}
      conversacionId={conversacionId}
      historial={historial.map((m) => ({ ...m, correcciones: m.correcciones }))}
      enPrueba={alumno.enPrueba}
      recargaMinima={configPrecios().minima}
      // El panel exige colegio (colegio/page.tsx): a un admin sin colegio
      // el enlace lo devolvía aquí sin explicación (auditoría, 30 de
      // octubre de 2026).
      esCoordinador={(alumno.rol === "coordinador" || alumno.rol === "admin") && alumno.institucionId !== null}
      esAdmin={alumno.rol === "admin"}
      racha={alumno.rachaDias}
      reportadas={reportadas}
      avisosReporte={avisos}
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
    </div>
    </>
  );
}
