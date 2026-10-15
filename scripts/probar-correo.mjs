/**
 * Prueba de envío de correo REAL.
 *
 * Un solo comando confirma que el servidor alcanza al proveedor, que
 * las credenciales sirven y que el correo llega — antes de que un
 * alumno de verdad dependa de ello para recuperar su cuenta.
 *
 *   npm run probar:correo -- tucorreo@gmail.com
 *
 * Manda el correo de recuperación de muestra al destino. Con
 * CORREO=consola solo lo imprime; con gmail o resend lo envía de
 * verdad. Si falla, dice POR QUÉ en palabras (puerto bloqueado por
 * Hetzner, contraseña de aplicación mala…), lo mismo que responde
 * /api/salud?correo=1 en producción.
 */
import { correo, correoDeRecuperacion, pistaDeCorreo } from "../src/lib/correo.ts";

const destino = process.argv[2];
if (!destino || !destino.includes("@")) {
  console.error("Uso: npm run probar:correo -- tucorreo@gmail.com");
  process.exit(1);
}

const enviador = correo();
console.log(`Enviador activo: ${enviador.nombre}${enviador.simulado ? " (no envía de verdad)" : ""}`);

if (enviador.verificar) {
  process.stdout.write("Conexión y credenciales... ");
  try {
    await enviador.verificar();
    console.log("ok");
  } catch (e) {
    console.log("FALLO");
    console.error(String(e.message ?? e));
    console.error(`\n${pistaDeCorreo(e)}`);
    process.exit(1);
  }
}

const plantilla = correoDeRecuperacion(
  "Prueba",
  "https://allison.ejemplo.co/recuperar/TOKEN-DE-MUESTRA"
);

try {
  await enviador.enviar({ ...plantilla, para: destino });
  console.log(`Enviado a ${destino}. Revisa la bandeja (y el spam la primera vez).`);
} catch (e) {
  console.error("FALLÓ el envío:");
  console.error(String(e.message ?? e));
  console.error(`\n${pistaDeCorreo(e)}`);
  process.exit(1);
}
