import { NextResponse, type NextRequest } from "next/server";

/**
 * Freno a las peticiones que otro sitio hace a nombre del alumno (CSRF).
 *
 * La cookie de sesión es SameSite=Lax: frena a otros dominios, pero no a
 * otro subdominio de praxisia.org, que para el navegador es el mismo
 * sitio. Una página ahí podía mandar un POST con la sesión de quien la
 * abriera: reiniciar PIN con la de un coordinador, o asignar saldo con la
 * del administrador (auditoría de seguridad, 2 de noviembre de 2026).
 *
 * Todo navegador de hoy dice de dónde viene un POST (cabecera Origin): si
 * no es la propia página, no pasa. Sin Origin no es un navegador (el aviso
 * de Bold, la tarea programada) y sigue: esas rutas se protegen con su
 * firma o su secreto.
 */
const LIBRES = ["/api/auth/", "/api/pagos/webhook", "/api/tareas/"];

/**
 * El cuerpo más grande que acepta la API: un audio de 3 MB con margen.
 * Las rutas que leen JSON (voz, ayuda, registro…) lo leían entero sin
 * tope, y un cuerpo de varios GB tumbaba el proceso. Esto mira el tamaño
 * declarado; el que llega por partes, sin tamaño, lo frena Traefik
 * (docs/DESPLIEGUE.md) (auditoría de seguridad, 2 de noviembre de 2026).
 */
const MAX_CUERPO = 4 * 1024 * 1024;

/** El host de la propia app: el que pidió el navegador, o el de AUTH_URL. */
function esPropio(origen: string, peticion: NextRequest): boolean {
  let host: string;
  try {
    host = new URL(origen).host;
  } catch {
    return false; // "null" (un iframe aislado) u otra cosa rara
  }
  if (host === peticion.headers.get("host")) return true;
  try {
    return host === new URL(process.env.AUTH_URL ?? "").host;
  } catch {
    return false;
  }
}

export function proxy(peticion: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(peticion.method)) return NextResponse.next();
  if (Number(peticion.headers.get("content-length")) > MAX_CUERPO) {
    return NextResponse.json({ error: "La petición es demasiado grande" }, { status: 413 });
  }
  if (LIBRES.some((r) => peticion.nextUrl.pathname.startsWith(r))) return NextResponse.next();
  const origen = peticion.headers.get("origin");
  if (origen && !esPropio(origen, peticion)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
