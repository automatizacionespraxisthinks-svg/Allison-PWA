import { NextResponse } from "next/server";
import { conversarEnStream } from "@/lib/allison";
import { conversacionActiva } from "@/lib/conversaciones";
import { META_LOGROS, unidad } from "@/lib/curriculo";
import { sql } from "@/lib/db";
import { CUERPO_MUY_GRANDE, cuerpoExcede, limitar } from "@/lib/limite";
import { contextoDeEnsenanza, temasDe } from "@/lib/progreso";
import { rutaDe } from "@/lib/ruta";
import { alumnoActual } from "@/lib/sesion";
import { senalesDeEspanol } from "@/lib/habla";
import { AUDIO_MAX_SEGUNDOS } from "@/lib/tipos";

/**
 * Tope de ejecución de la ruta.
 *
 * Un turno con audio son varios viajes (base, Gemini en streaming,
 * base otra vez) y puede pasar de los diez segundos. Corriendo en un
 * contenedor propio no hay tope impuesto, pero se declara igual: si
 * algún día esto vuelve a una plataforma sin servidor, la respuesta
 * no se corta a la mitad.
 */
export const maxDuration = 60;

// 60 s de opus caben de sobra en 8 MB. En el contenedor no hay tope
// de cuerpo impuesto por la plataforma: este es el único límite.
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Turnos por minuto y por alumno. Una conversación real ronda uno cada
 * 45 segundos; 20 deja margen de sobra a quien hable rápido y corta en
 * seco a un script.
 */
const TURNOS_POR_MINUTO = 20;

/**
 * La conversación, enviada POR PARTES.
 *
 * El alumno ve lo que él mismo dijo alrededor de un segundo después de
 * soltar el botón, y Allison empieza a hablar en cuanto su respuesta
 * está completa — sin esperar a que terminen de generarse unas
 * correcciones que va a leer después, si es que las lee.
 *
 * Cada parte viaja como una línea de JSON. Es más simple que los eventos
 * del servidor y basta para esto.
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const limite = limitar(`conversar:${alumno.id}`, TURNOS_POR_MINUTO, 60);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "muy_rapido", mensaje: "Vas muy rápido. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  if (cuerpoExcede(peticion, MAX_BYTES + 64 * 1024)) return NextResponse.json(CUERPO_MUY_GRANDE, { status: 413 });
  // Un cuerpo mal formado no debe reventar la ruta con un 500.
  const formulario = await peticion.formData().catch(() => null);
  if (!formulario) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const audio = formulario.get("audio");
  const textoCrudo = formulario.get("texto");
  // La duración la manda el navegador: se acota. Un valor raro (NaN,
  // negativo, enorme) hacía fallar el registro después de la respuesta, y
  // el turno se devolvía.
  const duracionCruda = Number(formulario.get("duracion") ?? 0);
  const duracionSeg = Number.isFinite(duracionCruda)
    ? Math.max(0, Math.min(AUDIO_MAX_SEGUNDOS + 5, duracionCruda))
    : 0;
  const conversacionPedida = formulario.get("conversacion") as string | null;

  // El turno llega hablado o ESCRITO: el teclado existe para el alumno
  // con el micrófono dañado, y vale exactamente lo mismo — un turno.
  const textoEscrito =
    typeof textoCrudo === "string" ? textoCrudo.trim().slice(0, 600) : null;

  if (!textoEscrito) {
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Falta el audio" }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return NextResponse.json({ error: "El audio es demasiado grande" }, { status: 413 });
    }
    if (duracionCruda > AUDIO_MAX_SEGUNDOS + 5) {
      return NextResponse.json({ error: "El audio excede el máximo" }, { status: 413 });
    }
  }

  // Cobrar ANTES de llamar a Gemini. Es atómico: si dos pestañas
  // intentan a la vez, solo una consigue el mensaje. La base devuelve de
  // qué bolsa cobró, que no se puede deducir del saldo leído antes.
  const [{ consumir_mensaje: bolsaUsada }] =
    await sql`select consumir_mensaje(${alumno.id}, null)`;

  if (!bolsaUsada) {
    return NextResponse.json(
      { error: "sin_mensajes", mensaje: "Te quedaste sin mensajes." },
      { status: 402 }
    );
  }

  // Se devuelve UNA sola vez: antes, una respuesta vacía devolvía y, si
  // después fallaba el envío, el catch devolvía otra vez (auditoría, 30
  // de octubre de 2026).
  let devuelto = false;
  const devolver = async () => {
    if (devuelto) return;
    devuelto = true;
    await sql`select devolver_mensaje(${alumno.id}, ${bolsaUsada}::bolsa_credito)`;
  };

  // La conversación pedida se verifica como SUYA en la misma consulta
  // que trae su lección: sin comprobar el dueño, cualquiera podría
  // escribir en el hilo de otro pasando el id. Si no es suya o no
  // existe, se cae al hilo activo del alumno, sin distinguir el caso.
  let conversacionId: string;
  let claveLeccion: string | null = null;
  let buffer: Buffer | null = null;

  // Ya se cobró: si la base parpadea antes de llamar a la IA, se devuelve.
  try {
    const propia = conversacionPedida
      ? await sql`
          select id, leccion from conversaciones
           where id = ${conversacionPedida} and user_id = ${alumno.id} and modo <> 'ruta'
        `.then((f) => f[0] ?? null).catch(() => null)
      : null;

    if (propia) {
      conversacionId = propia.id;
      claveLeccion = propia.leccion ?? null;
    } else {
      const activa = await conversacionActiva(alumno.id, alumno.nivel);
      conversacionId = activa.id;
      claveLeccion = activa.leccion;
    }

    buffer = !textoEscrito && audio instanceof Blob ? Buffer.from(await audio.arrayBuffer()) : null;
  } catch (e) {
    await devolver().catch(() => {});
    console.error("Fallo al preparar la conversación:", e);
    return NextResponse.json(
      { error: "fallo_ia", mensaje: "Allison no pudo responder. No te cobramos este mensaje." },
      { status: 500 }
    );
  }

  // Clave vieja o inventada: la conversación sigue, pero libre.
  const leccion = claveLeccion ? unidad(claveLeccion) : null;
  const codificador = new TextEncoder();

  const flujo = new ReadableStream({
    async start(control) {
      // Si el alumno cerró la app, el envío falla: no es una falla de la IA
      // y lo que falta (guardar el turno) sigue igual.
      const enviar = (dato: unknown) => {
        try {
          control.enqueue(codificador.encode(JSON.stringify(dato) + "\n"));
        } catch {
          // El flujo ya se cerró del lado del alumno.
        }
      };
      // Desde que la respuesta salió, Allison ya respondió: un error al
      // anotar no se devuelve, como en /api/ruta/evaluar y /api/ruta/escena.
      // Antes, cortar la conexión al oír la respuesta dejaba el turno gratis.
      let entregada = false;

      try {
        // Las dos consultas no dependen entre sí: van juntas. Cada viaje
        // a la base cuesta tiempo que el alumno espera mirando la
        // pantalla, y en fila india se suman.
        const [filas, temas, ensenanza] = await Promise.all([
          sql`
            select rol, texto, texto_voz from mensajes
             where conversacion_id = ${conversacionId}
             order by creado_en desc limit 24
          `,
          temasDe(alumno.id),
          contextoDeEnsenanza(alumno.id, alumno.nivel),
        ]);

        const historial = filas.reverse().map((f, i) => ({
          id: String(i),
          rol: f.rol as "alumno" | "allison",
          texto: f.texto as string,
          textoVoz: (f.texto_voz as string | null) ?? undefined,
          correcciones: [],
          creadoEn: "",
        }));

        const partes = conversarEnStream({
          ...(textoEscrito
            ? { texto: textoEscrito }
            : {
                audioBase64: buffer?.toString("base64"),
                mimeType:
                  (audio instanceof Blob && audio.type) || "audio/webm",
              }),
          alumno: {
            nombre: alumno.nombre,
            nivel: alumno.nivel,
            temasAbiertos: temas.abiertos,
            temasDominados: temas.dominados,
            erroresRepetidos: ensenanza.erroresRepetidos,
            temasRecorridos: ensenanza.temasRecorridos,
          },
          historial,
          leccion: leccion ?? undefined,
          // Cuánto español lleva la charla: el prompt decide con las cifras.
          senales: senalesDeEspanol(historial),
        });

        let resultado = null;

        for await (const parte of partes) {
          if (parte.tipo === "fin") {
            resultado = parte.resultado;
          } else {
            if (parte.tipo === "respuesta") entregada = true;
            enviar(parte);
          }
        }

        if (!resultado || resultado.fallaIA || !resultado.transcripcion.trim() || !resultado.respuesta.trim()) {
          // No se oyó voz: se cobra, porque la IA ya escuchó el audio y sus
          // tokens se pagan (decisión del usuario, 29 de octubre de 2026:
          // todo lo que usa la IA cuesta). Antes se devolvía, salvo una
          // respuesta larga sin nada oído. Si la falla es de la IA (no
          // terminó o no respondió nada a lo que sí se oyó), se devuelve.
          let mensajesRestantes: number | undefined;
          // Un JSON cortado del modelo no es silencio: es falla de la IA y se devuelve.
          if (resultado && !resultado.fallaIA && !resultado.transcripcion.trim()) {
            await sql`
              select registrar_uso(
                ${alumno.id}, 'conversar',
                ${resultado.tokensEntrada}, ${resultado.tokensSalida},
                ${Math.round(duracionSeg)}, true, false
              )
            `.catch(() => {});
            // El contador de la pantalla baja con lo que se cobró.
            const [s] = await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}`.catch(() => []);
            if (s) mensajesRestantes = s.mensajes_plan + s.mensajes_recarga;
          } else {
            await devolver();
          }
          enviar({
            tipo: "error",
            error: "sin_audio",
            mensaje: "No te escuchamos. Revisa el micrófono e intenta otra vez.",
            ...(mensajesRestantes !== undefined ? { mensajesRestantes } : {}),
          });
          // El "finally" cierra el flujo: cerrarlo dos veces lanza un error.
          return;
        }

        const [mAlumno] = await sql`
          insert into mensajes
            (conversacion_id, user_id, rol, texto, duracion_seg, correcciones,
             tokens_entrada, tokens_salida)
          values
            (${conversacionId}, ${alumno.id}, 'alumno', ${resultado.transcripcion},
             ${duracionSeg}, ${sql.json(resultado.correcciones as unknown as never)},
             ${resultado.tokensEntrada}, ${resultado.tokensSalida})
          returning id, creado_en
        `;

        const [mAllison] = await sql`
          insert into mensajes (conversacion_id, user_id, rol, texto, texto_voz, correcciones)
          values (${conversacionId}, ${alumno.id}, 'allison', ${resultado.respuesta},
                  ${resultado.respuestaVoz !== resultado.respuesta ? resultado.respuestaVoz : null},
                  '[]'::jsonb)
          returning id, creado_en
        `;

        await sql`
          update conversaciones set ultima_actividad_en = now()
           where id = ${conversacionId}
        `;

        await sql`
          select registrar_practica(
            ${alumno.id}, ${Math.round(duracionSeg)}, ${resultado.correcciones.length}
          )
        `;

        // Acumulado para el panel: sobrevive al borrado de los 20 días,
        // que es lo que permite mirar meses y años hacia atrás.
        await sql`
          select registrar_uso(
            ${alumno.id}, 'conversar',
            ${resultado.tokensEntrada}, ${resultado.tokensSalida},
            ${Math.round(duracionSeg)}, true, false
          )
        `;
        // Un tema de la ruta provisional cuenta como ruta; lo demás, Hablar.
        await sql`select registrar_parte(${alumno.id}, ${leccion ? "ruta" : "hablar"})`;

        for (const c of resultado.correcciones) {
          await sql`
            select registrar_error(${alumno.id}, ${c.tipo}, ${c.original},
                                   ${c.correccion}, ${c.tema ?? "naturalidad"})
          `;
        }

        // El logro de la lección se asienta ANTES de responder: si el
        // alumno cierra la pestaña apenas oye a Allison, el avance ya
        // es suyo. La meta viaja por parámetro porque vive en el
        // código, junto al contenido de la unidad.
        let avanceLeccion = null;
        if (leccion && resultado.objetivoUsado) {
          const [fila] = await sql`
            select registrar_logro(${alumno.id}, ${leccion.clave}, ${META_LOGROS}) as r
          `;
          avanceLeccion = {
            clave: leccion.clave,
            logros: fila.r.logros as number,
            meta: META_LOGROS,
            completada: fila.r.completada as boolean,
            recien: fila.r.recien as boolean,
          };
          // Ruta provisional (niveles sin lecciones escritas): completar el
          // tema gana la estampilla de su ciudad, guardada con la clave que
          // tendrá la parada cuando se escriba (plan, sección 22).
          if (avanceLeccion.recien && !rutaDe(leccion.nivel)) {
            await sql`
              insert into ruta_paradas (user_id, parada, estrellas, sello_en)
              values (${alumno.id}, ${`${leccion.nivel.toLowerCase()}-p${String(leccion.orden).padStart(2, "0")}`}, 3, now())
              on conflict (user_id, parada) do update
                 set sello_en = coalesce(ruta_paradas.sello_en, now()), actualizado_en = now()
            `;
          }
        }

        const [saldo] = await sql`
          select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}
        `;

        enviar({
          tipo: "fin",
          conversacionId,
          leccion: avanceLeccion,
          alumno: {
            id: mAlumno.id,
            rol: "alumno",
            texto: resultado.transcripcion,
            correcciones: resultado.correcciones,
            creadoEn: mAlumno.creado_en,
            duracionSeg,
          },
          allison: {
            id: mAllison.id,
            rol: "allison",
            texto: resultado.respuesta,
            textoVoz: resultado.respuestaVoz !== resultado.respuesta ? resultado.respuestaVoz : undefined,
            correcciones: [],
            creadoEn: mAllison.creado_en,
          },
          mensajesRestantes: saldo.mensajes_plan + saldo.mensajes_recarga,
        });
      } catch (e) {
        console.error("Fallo al conversar:", e);
        if (entregada) {
          // Allison ya respondió: se cobra, aunque no se haya podido guardar,
          // y el contador de la pantalla baja con lo que se cobró.
          const [s] = await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}`.catch(() => []);
          enviar({
            tipo: "error",
            error: "fallo_guardar",
            mensaje: "Allison respondió, pero no pudimos guardar este turno.",
            ...(s ? { mensajesRestantes: s.mensajes_plan + s.mensajes_recarga } : {}),
          });
        } else {
          // Si algo falló después de cobrar y antes de responder, se devuelve.
          await devolver().catch(() => {});
          enviar({
            tipo: "error",
            error: "fallo_ia",
            mensaje: "Allison no pudo responder. No te cobramos este mensaje.",
          });
        }
      } finally {
        try {
          control.close();
        } catch {
          // Ya estaba cerrado (el alumno se fue).
        }
      }
    },
  });

  return new Response(flujo, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Evita que un proxy intermedio acumule la respuesta y anule el
      // envío por partes, que es justo lo que da la sensación de rapidez.
      "X-Accel-Buffering": "no",
    },
  });
}
