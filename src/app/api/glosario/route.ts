import { NextResponse } from "next/server";
import { normalizarFrase, recortarContexto, validarFrase, GLOSARIO_MAX } from "@/lib/frases";
import { agregarEntrada } from "@/lib/glosario";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";

/** Guardados por hora y por alumno: nadie estudia más rápido que esto. */
const POR_HORA = 120;

/**
 * Guardar una palabra o frase en el glosario.
 *
 * Llega desde la barra que aparece al seleccionar texto en un mensaje,
 * o desde el cuadro de la página del glosario. El contexto es la frase
 * completa de donde salió: se copia porque el mensaje se borra a los 20
 * días y el glosario no.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`glosario:${alumno.id}`, POR_HORA, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiadas palabras seguidas. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    texto?: unknown;
    contexto?: unknown;
  } | null;

  const texto = normalizarFrase(cuerpo?.texto);
  const error = validarFrase(texto);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const resultado = await agregarEntrada(alumno.id, texto, recortarContexto(cuerpo?.contexto));

  if (resultado.estado === "lleno") {
    return NextResponse.json(
      { error: `Tu glosario ya tiene ${GLOSARIO_MAX} entradas. Quita alguna para guardar más.` },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { ok: true, estado: resultado.estado, entrada: resultado.entrada },
    { status: resultado.estado === "creada" ? 201 : 200 }
  );
}
