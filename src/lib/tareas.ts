import { createHash, timingSafeEqual } from "node:crypto";

/**
 * El candado de las rutas que llama una MÁQUINA, no una persona: la
 * limpieza de cada hora y los diagnósticos del servidor.
 *
 * Dos nombres para el mismo secreto: TAREAS_SECRETO cuando la llama la
 * tarea programada de Dokploy, n8n u otra máquina propia; CRON_SECRET
 * cuando la llama el cron de Vercel, que manda ese valor como Bearer
 * automáticamente.
 */
export function autorizadaPorSecreto(peticion: Request): boolean {
  const secretos = [process.env.TAREAS_SECRETO, process.env.CRON_SECRET].filter(
    (s): s is string => Boolean(s)
  );
  if (secretos.length === 0) return false;

  const enviado = (peticion.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  if (!enviado) return false;

  // Se comparan los hashes para que el tiempo de comparación no
  // dependa de cuántos caracteres coincidieron.
  const a = createHash("sha256").update(enviado).digest();
  return secretos.some((s) => timingSafeEqual(a, createHash("sha256").update(s).digest()));
}
