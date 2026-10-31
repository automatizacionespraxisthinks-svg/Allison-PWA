import { NextResponse } from "next/server";
import { cargarAlumnos } from "@/lib/cargaAlumnos";
import { CUERPO_MUY_GRANDE, cuerpoExcede, limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";

/**
 * Carga masiva de alumnos.
 *
 * Dos modos: "validar" muestra qué pasaría, "confirmar" lo hace. Meter
 * 500 alumnos mal es un desastre difícil de deshacer, así que nunca se
 * escribe sin que el coordinador haya visto antes el resultado.
 */
export async function POST(peticion: Request) {
  const usuario = await alumnoActual();
  if (!usuario) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (usuario.rol !== "coordinador" && usuario.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!usuario.institucionId) {
    return NextResponse.json({ error: "Sin colegio asignado" }, { status: 403 });
  }

  const limite = limitar(`importar:${usuario.id}`, 20, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiadas cargas seguidas. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  // Un curso entero en CSV pesa unos pocos KB; 1 MB alcanza para un colegio grande.
  if (cuerpoExcede(peticion, 1024 * 1024)) return NextResponse.json(CUERPO_MUY_GRANDE, { status: 413 });
  // Un cuerpo "null" es JSON válido: sin el ?? {}, desestructurarlo
  // reventaba con un 500 (auditoría, 30 de octubre de 2026).
  const { csv, confirmar, curso } = ((await peticion.json().catch(() => null)) ?? {}) as {
    csv?: unknown;
    confirmar?: unknown;
    curso?: unknown;
  };

  if (typeof csv !== "string" || !csv.trim()) {
    return NextResponse.json({ error: "El archivo llegó vacío" }, { status: 400 });
  }
  if (csv.length > 1024 * 1024) return NextResponse.json(CUERPO_MUY_GRANDE, { status: 413 });

  // El coordinador carga y actualiza cursos; el saldo lo asigna solo el
  // administrador (plan, sección 21).
  const { status, ...r } = await cargarAlumnos({
    institucionId: usuario.institucionId,
    csv,
    confirmar: !!confirmar,
    cursoParaTodos: typeof curso === "string" ? curso : null,
    quien: usuario.nombre,
  });
  return NextResponse.json(r, { status });
}
