import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  comentarNarracion,
  comentarRelato,
  cosasNombradas,
  evaluarRespuestaCorta,
  transcribirACiegas,
  type PedidoEvaluacion,
} from "@/lib/evaluacion";
import { hablaEspanol } from "@/lib/ruta/escena";
import { CUERPO_MUY_GRANDE, cuerpoExcede, limitar } from "@/lib/limite";
import { contenidoDe, pasoDe } from "@/lib/ruta/estado";
import { mejoraDeEscena } from "@/lib/ruta/conversacion";
import { itemDeRepaso, preguntaDe } from "@/lib/ruta/repaso";
import { alumnoActual } from "@/lib/sesion";
import { AUDIO_MAX_SEGUNDOS, type Nivel } from "@/lib/tipos";

// Cuéntame pasa por dos llamadas (transcribir y comentar): hasta 60 s.
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * La evaluación corta de una actividad de la ruta: ¿Qué es esto?,
 * Repite, Dilo en inglés, Describe la imagen y Responde rápido. Y los relatos
 * de Cuéntame (A2 y B1) y Narra la secuencia (B1), que se cobran igual:
 * una intervención por intento, también escrito.
 *
 * El cliente solo dice QUÉ actividad es (parada, lección, paso); lo que
 * se espera lo busca el servidor en el contenido. Así nadie puede pedir
 * que se califique contra una respuesta inventada.
 *
 * Cada comprobación es una intervención, porque pasa por un prompt. Si
 * no se oyó voz no se cobra: "no se entiende el audio o hay silencio"
 * no cuenta como intento (plan, sección 5).
 */
export async function POST(peticion: Request) {
  const alumno = await alumnoActual();
  if (!alumno)
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const limite = limitar(`evaluar:${alumno.id}`, 30, 60);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "muy_rapido", mensaje: "Vas muy rápido. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } },
    );
  }

  if (cuerpoExcede(peticion, MAX_BYTES + 64 * 1024)) return NextResponse.json(CUERPO_MUY_GRANDE, { status: 413 });
  const f = await peticion.formData().catch(() => null);
  if (!f)
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });

  const parada = String(f.get("parada") ?? "");
  const leccion = Number(f.get("leccion"));
  const paso = Number(f.get("paso"));
  let indice = Number(f.get("indice") ?? 0);
  // Repaso sorpresa: la pregunta sale del repaso del alumno, no de lo que
  // mande el navegador.
  const repasoId = String(f.get("repaso") ?? "");
  // "Practicarla" en el resumen de una escena: la frase sale de la escena.
  const escenaId = String(f.get("escena") ?? "");
  const audio = f.get("audio");
  const textoCrudo = f.get("texto");
  // Cuéntame y Narra escritos admiten un relato de varias frases; lo demás, una respuesta corta.
  const textoLargo =
    typeof textoCrudo === "string" ? textoCrudo.trim().slice(0, 1200) : "";
  const texto = textoLargo.slice(0, 300).trim();
  // La duración la manda el navegador: se acota antes de usarla.
  const crudo = Number(f.get("duracion") ?? 0);
  const duracion = texto
    ? 0
    : Number.isFinite(crudo)
      ? Math.max(0, Math.min(AUDIO_MAX_SEGUNDOS + 5, crudo))
      : 0;

  const ubicado = pasoDe(parada);
  let nivel: Nivel | null = ubicado?.nivel ?? null;
  // La parada a la que se le anota el gasto (ficha del alumno).
  let paradaDelGasto = ubicado ? parada : "";
  let actividad = ubicado
    ? contenidoDe(ubicado.paso)
        .lecciones.find((l) => l.numero === leccion)
        ?.actividades.find((a) => a.paso === paso)
    : undefined;
  if (repasoId) {
    const item = await itemDeRepaso(alumno.id, repasoId, Number(f.get("n")));
    const pregunta = item ? preguntaDe(item, 0) : null;
    nivel = pregunta?.nivel ?? null;
    paradaDelGasto = item?.parada ?? "";
    actividad = pregunta?.actividad;
    indice = 0;
  } else if (escenaId) {
    const mejora = await mejoraDeEscena(alumno.id, escenaId);
    nivel = mejora?.nivel ?? null;
    paradaDelGasto = "";
    actividad = mejora ? { tipo: "repite", paso: 0, frase: mejora.frase, queAparece: "", siRespondeMal: "" } : undefined;
  }
  if (!nivel || !actividad)
    return NextResponse.json(
      { error: "No existe esa actividad" },
      { status: 404 },
    );

  if (actividad.tipo === "cuentame" || actividad.tipo === "narra") {
    const escrito = textoLargo;
    if (!escrito) {
      if (!(audio instanceof Blob))
        return NextResponse.json({ error: "Falta el audio" }, { status: 400 });
      if (audio.size > MAX_BYTES || crudo > AUDIO_MAX_SEGUNDOS + 5) {
        return NextResponse.json(
          { error: "El audio es demasiado largo" },
          { status: 413 },
        );
      }
    }
    const [{ consumir_mensaje: bolsaRelato }] =
      await sql`select consumir_mensaje(${alumno.id}, null)`;
    if (!bolsaRelato) {
      return NextResponse.json(
        { error: "sin_mensajes", mensaje: "Te quedaste sin intervenciones." },
        { status: 402 },
      );
    }
    let transcripcion = escrito;
    let tokensEntrada = 0;
    let tokensSalida = 0;
    let comentario: Awaited<ReturnType<typeof comentarRelato>> | null = null;
    let narracion: Awaited<ReturnType<typeof comentarNarracion>> | null = null;
    try {
      if (!escrito) {
        const tr = await transcribirACiegas(
          Buffer.from(await (audio as Blob).arrayBuffer()).toString("base64"),
          (audio as Blob).type || "audio/webm",
          true,
        );
        transcripcion = tr.transcripcion;
        tokensEntrada += tr.tokensEntrada;
        tokensSalida += tr.tokensSalida;
      }
      if (transcripcion && actividad.tipo === "narra") {
        narracion = await comentarNarracion({
          pregunta: actividad.pregunta,
          dibujos: actividad.dibujos,
          gramatica: actividad.gramatica,
          transcripcion,
          nivel,
        });
        comentario = narracion;
      } else if (transcripcion && actividad.tipo === "cuentame") {
        comentario = await comentarRelato({ tema: actividad.tema, transcripcion, nivel, segundos: actividad.segundos });
      }
      if (comentario) {
        tokensEntrada += comentario.tokensEntrada;
        tokensSalida += comentario.tokensSalida;
      }
    } catch (e) {
      await sql`select devolver_mensaje(${alumno.id}, ${bolsaRelato}::bolsa_credito)`.catch(() => {});
      console.error("Fallo al evaluar el relato:", e instanceof Error ? e.message : e);
      return NextResponse.json(
        {
          error: "fallo_ia",
          mensaje: "No pudimos escuchar tu relato. No te cobramos. Intenta otra vez.",
        },
        { status: 502 },
      );
    }
    try {
      await sql`
        select registrar_uso(${alumno.id}, 'conversar', ${tokensEntrada},
                             ${tokensSalida}, ${Math.round(duracion)}, true, false)
      `;
      await sql`select registrar_parte(${alumno.id}, 'ruta')`;
      if (paradaDelGasto) {
        await sql`select registrar_consumo_parada(${alumno.id}, ${paradaDelGasto}, ${!transcripcion})`;
      }
    } catch (e) {
      console.error("No se pudo anotar el relato:", e instanceof Error ? e.message : e);
    }
    const [saldoRelato] =
      await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}`;
    const restantesRelato =
      (saldoRelato?.mensajes_plan ?? 0) + (saldoRelato?.mensajes_recarga ?? 0);
    if (!transcripcion || !comentario) {
      return NextResponse.json({
        sinVoz: true,
        mensaje: "No te oí. Inténtalo otra vez.",
        restantes: restantesRelato,
      });
    }
    const espanol = comentario.espanol || hablaEspanol(transcripcion);
    const segundos = escrito ? null : Math.round(duracion);
    // Cuéntame hablado: los segundos y las frases del mínimo (20 y 3 en A2,
    // 40 y 5 en B1). Escrito: las frases, sin la nota de fluidez.
    // Narra: al menos 3 de los 4 dibujos en orden; escrito, además, las
    // frases del mínimo.
    const correcto =
      !espanol &&
      (actividad.tipo === "narra"
        ? (narracion?.enOrden ?? 0) >= actividad.minimoDibujos && (segundos !== null || comentario.frases >= actividad.minimoFrases)
        : comentario.frases >= actividad.minimoFrases && (segundos === null || segundos >= actividad.minimoSegundos));
    return NextResponse.json({
      transcripcion,
      correcto,
      palabras: [],
      palabraAMejorar: null,
      espanol,
      nombradas: [],
      relato: {
        frases: comentario.frases,
        segundos,
        bien: espanol ? null : comentario.bien,
        mejora: espanol ? null : comentario.mejora,
        ...(narracion ? { dibujos: narracion.dibujos, faltante: narracion.faltante } : {}),
      },
      restantes: restantesRelato,
    });
  }

  let pedido: Omit<
    PedidoEvaluacion,
    "nivel" | "audioBase64" | "mimeType" | "texto"
  >;
  switch (actividad.tipo) {
    case "que-es-esto":
    case "dilo":
      pedido = {
        tipo: actividad.tipo,
        esperado: actividad.respuesta,
        aceptadas: actividad.aceptadas,
      };
      break;
    case "repite":
      pedido = { tipo: "repite", esperado: actividad.frase };
      break;
    case "describe":
      pedido = {
        tipo: "describe",
        esperado: actividad.pregunta,
        aceptadas: actividad.cosas,
      };
      break;
    case "responde": {
      const p = actividad.preguntas[indice];
      if (!p)
        return NextResponse.json(
          { error: "No existe esa pregunta" },
          { status: 404 },
        );
      pedido = { tipo: "responde", esperado: p.pregunta };
      break;
    }
    default:
      return NextResponse.json(
        { error: "Esta actividad no se evalúa así" },
        { status: 400 },
      );
  }

  if (!texto) {
    if (!(audio instanceof Blob))
      return NextResponse.json({ error: "Falta el audio" }, { status: 400 });
    if (audio.size > MAX_BYTES || crudo > AUDIO_MAX_SEGUNDOS + 5) {
      return NextResponse.json(
        { error: "El audio es demasiado largo" },
        { status: 413 },
      );
    }
  }

  // Lo escrito se compara en el código, sin prompt: no es una
  // intervención. Solo Responde rápido necesita al modelo para juzgar si
  // la respuesta tiene sentido, escrita o hablada.
  const usaIA = !texto || pedido.tipo === "responde";

  let bolsa: string | null = null;
  if (usaIA) {
    [{ consumir_mensaje: bolsa }] =
      await sql`select consumir_mensaje(${alumno.id}, null)`;
    if (!bolsa) {
      return NextResponse.json(
        { error: "sin_mensajes", mensaje: "Te quedaste sin intervenciones." },
        { status: 402 },
      );
    }
  }
  const devolver = async () => {
    if (bolsa)
      await sql`select devolver_mensaje(${alumno.id}, ${bolsa}::bolsa_credito)`;
  };

  let resultado: Awaited<ReturnType<typeof evaluarRespuestaCorta>>;
  try {
    resultado = await evaluarRespuestaCorta({
      ...pedido,
      nivel,
      ...(texto
        ? { texto }
        : {
            audioBase64: Buffer.from(
              await (audio as Blob).arrayBuffer(),
            ).toString("base64"),
            mimeType: (audio as Blob).type || "audio/webm",
          }),
    });
  } catch (e) {
    await devolver().catch(() => {});
    console.error("Fallo al evaluar:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      {
        error: "fallo_ia",
        mensaje:
          "No pudimos comprobar tu respuesta. No te cobramos. Intenta otra vez.",
      },
      { status: 502 },
    );
  }

  // Desde aquí la IA ya trabajó: la comprobación se cobra aunque no se
  // haya oído voz (no cuenta como intento, pero consumió IA; plan,
  // secciones 6 y 22), y un error al anotar no la devuelve.
  if (usaIA) {
    try {
      await sql`
        select registrar_uso(${alumno.id}, 'conversar', ${resultado.tokensEntrada},
                             ${resultado.tokensSalida}, ${Math.round(duracion)}, true, false)
      `;
      await sql`select registrar_parte(${alumno.id}, 'ruta')`;
      if (paradaDelGasto) {
        await sql`select registrar_consumo_parada(${alumno.id}, ${paradaDelGasto}, ${!resultado.transcripcion})`;
      }
    } catch (e) {
      console.error(
        "No se pudo anotar la evaluación:",
        e instanceof Error ? e.message : e,
      );
    }
  }
  const [saldo] =
    await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}`;
  const restantes =
    (saldo?.mensajes_plan ?? 0) + (saldo?.mensajes_recarga ?? 0);

  if (!resultado.transcripcion) {
    return NextResponse.json({
      sinVoz: true,
      mensaje: "No te oí. Inténtalo otra vez.",
      restantes,
    });
  }

  return NextResponse.json({
    transcripcion: resultado.transcripcion,
    correcto: resultado.correcto,
    palabras: resultado.palabras,
    palabraAMejorar: resultado.palabraAMejorar ?? null,
    // Respondió en español: se acepta como comprensión y se le pide en
    // inglés; cuenta como pista (plan, sección 5).
    espanol: hablaEspanol(resultado.transcripcion),
    // Describe la imagen: qué cosas del dibujo nombró en esta frase.
    nombradas:
      pedido.tipo === "describe"
        ? cosasNombradas(resultado.transcripcion, pedido.aceptadas ?? [])
        : [],
    restantes,
  });
}
