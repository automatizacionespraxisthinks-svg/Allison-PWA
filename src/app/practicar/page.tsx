import { redirect } from "next/navigation";
import { Conversacion } from "@/components/Conversacion";
import { alumnoActual } from "@/lib/sesion";

export default async function PaginaPracticar() {
  const alumno = await alumnoActual();
  if (!alumno) redirect("/entrar");

  return (
    <Conversacion
      nombre={alumno.nombre}
      nivel={alumno.nivel}
      mensajesIniciales={alumno.mensajesPlan + alumno.mensajesRecarga}
    />
  );
}
