/**
 * Al arrancar el servidor, una sola vez. Lo de Node va aparte
 * (instrumentation-node.ts): este archivo también se arma para el
 * entorno edge, donde los módulos de Node no existen.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
