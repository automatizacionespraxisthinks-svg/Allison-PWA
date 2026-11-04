import { GoogleGenAI } from "@google/genai";
import { AUDIO_MAX_SEGUNDOS } from "./tipos.ts";
import { modeloIA } from "./modelo.ts";

/**
 * Lo que se le acepta al navegador antes de mandarle un audio a la IA
 * (auditoría de seguridad, 2 de noviembre de 2026).
 *
 * La duración y el tipo los dice el navegador, y un script puede mentir:
 * mandaba 17 minutos de voz diciendo que eran 10 segundos. La IA se
 * quedaba sin espacio para la transcripción, eso contaba como falla de
 * la IA y la intervención se devolvía: la IA salía gratis y sin límite
 * con una sola intervención.
 */

/** Un minuto de voz pesa ~1 MB en el formato más pesado de los navegadores (AAC a 128 kbps): 3 MB sobran. */
export const AUDIO_MAX_BYTES = 3 * 1024 * 1024;

/**
 * El tipo que va a la IA: solo audio. Un video cuesta cientos de tokens
 * por segundo; sin tipo, el de Chrome (audio/webm). Devuelve null si no
 * es audio.
 */
export function tipoDeAudio(audio: Blob): string | null {
  const tipo = audio.type || "audio/webm";
  return tipo.toLowerCase().startsWith("audio/") ? tipo : null;
}

/**
 * ¿El audio dura más de lo que deja grabar la app? Gemini cuenta 32
 * tokens por segundo de audio, y contarlos no se cobra.
 *
 * Se pregunta SOLO cuando la IA falló, antes de devolver la intervención:
 * así el turno normal no espera nada. Un audio así no lo graba la app,
 * solo un script: se cobra. Si la cuenta misma falla, se devuelve (la
 * duda favorece al alumno).
 *
 * La cuenta sube el audio entero: 2 minutos en WAV tardaron 11 s desde
 * una conexión lenta (3 de noviembre de 2026), y con 8 s de espera se
 * cortaba y el audio largo salía gratis. 15 s caben en el minuto de la
 * ruta aun después de los 30 s de la IA.
 */
export async function audioPasaDelTope(base64: string, mimeType: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const r = await ai.models.countTokens({
      model: modeloIA(),
      contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: base64 } }] }],
      config: { abortSignal: AbortSignal.timeout(15_000) },
    });
    return (r.totalTokens ?? 0) > (AUDIO_MAX_SEGUNDOS + 10) * 32;
  } catch {
    return false;
  }
}
