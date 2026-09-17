import { NextResponse } from "next/server";
import { correo, pistaDeCorreo, puertoGmail } from "@/lib/correo";
import { sql } from "@/lib/db";
import { googleConfigurado } from "@/lib/google";
import { autorizadaPorSecreto } from "@/lib/tareas";

/**
 * ¿Está sana la aplicación?
 *
 * Responde preguntas distintas, y separarlas importa:
 *
 *   /api/salud           ¿sigue vivo el proceso?     (lo pregunta Docker)
 *   /api/salud?base=1    ¿y la base contesta?        (lo pregunta el monitoreo)
 *   /api/salud?google=1  ¿el servidor ve las llaves de Google, y cuál es
 *                        la URI de regreso que hay que registrar?
 *   /api/salud?correo=1  ¿el servidor puede hablar con el SMTP? Exige el
 *                        secreto de las tareas: abre una conexión real.
 *
 * Por qué separadas: el chequeo del contenedor decide si Docker lo
 * REINICIA. Si ese chequeo dependiera de la base, un parpadeo de
 * Postgres — un reinicio, un respaldo, un segundo de red — tumbaría la
 * aplicación en bucle, empeorando justo lo que intenta proteger.
 * Reiniciar la app no arregla una base caída.
 *
 * El monitoreo externo sí quiere la verdad completa: una app que
 * responde pero no puede leer la base está rota para el alumno, y hay
 * que enterarse.
 *
 * Las dos últimas existen porque "el botón no hace nada" y "el correo
 * no llega" son fallos que, vistos desde afuera, no dicen por qué.
 * Aquí el servidor cuenta lo que ve. Sin secretos: la URL pública y un
 * sí o un no.
 */
export const dynamic = "force-dynamic";

export async function GET(peticion: Request) {
  const parametros = new URL(peticion.url).searchParams;
  const cabeceras = { "Cache-Control": "no-store" };

  if (parametros.has("google")) {
    const authUrl = (process.env.AUTH_URL ?? "").trim().replace(/\/+$/, "");
    return NextResponse.json(
      {
        ok: true,
        google: {
          llaves: googleConfigurado(),
          authUrl: authUrl || null,
          https: authUrl.startsWith("https://"),
          // Esta, letra por letra, es la que va en Google Cloud.
          callback: authUrl ? `${authUrl}/api/auth/callback/google` : null,
          // Si aquí no aparece "google", el proceso arrancó sin las
          // llaves: hay que volver a desplegar.
          proveedores: `${authUrl}/api/auth/providers`,
        },
      },
      { headers: cabeceras }
    );
  }

  if (parametros.has("correo")) {
    if (!autorizadaPorSecreto(peticion)) {
      return NextResponse.json({ error: "No autorizada" }, { status: 401, headers: cabeceras });
    }
    let nombre = process.env.CORREO ?? "consola";
    try {
      const enviador = correo();
      nombre = enviador.nombre;
      await enviador.verificar?.();
      return NextResponse.json(
        {
          ok: true,
          correo: {
            enviador: nombre,
            puerto: nombre === "gmail" ? puertoGmail() : null,
            conecta: true,
            probado: Boolean(enviador.verificar),
          },
        },
        { headers: cabeceras }
      );
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : String(e);
      console.error("Diagnóstico de correo:", mensaje);
      return NextResponse.json(
        {
          ok: false,
          correo: {
            enviador: nombre,
            puerto: nombre === "gmail" ? puertoGmail() : null,
            conecta: false,
            error: mensaje.slice(0, 200),
            pista: pistaDeCorreo(e),
          },
        },
        { status: 503, headers: cabeceras }
      );
    }
  }

  if (!parametros.has("base")) {
    return NextResponse.json({ ok: true }, { headers: cabeceras });
  }

  try {
    await sql`select 1`;
    return NextResponse.json({ ok: true, base: true }, { headers: cabeceras });
  } catch {
    return NextResponse.json(
      { ok: false, base: false, error: "base_no_disponible" },
      { status: 503, headers: cabeceras }
    );
  }
}
