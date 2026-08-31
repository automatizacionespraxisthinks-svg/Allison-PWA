/**
 * Prueba de envío de correo REAL.
 *
 * Para el día en que llegue la llave de Resend: un solo comando
 * confirma que la llave, el remitente y el dominio están bien — antes
 * de que un alumno de verdad dependa de ello.
 *
 *   npm run probar:correo -- tucorreo@gmail.com
 *
 * Manda el correo de verificación de muestra al destino. Con
 * CORREO=consola solo lo imprime; con CORREO=resend lo envía de
 * verdad por la API.
 */
import { correo, correoDeVerificacion } from "../src/lib/correo.ts";

const destino = process.argv[2];
if (!destino || !destino.includes("@")) {
  console.error("Uso: npm run probar:correo -- tucorreo@gmail.com");
  process.exit(1);
}

const enviador = correo();
console.log(`Enviador activo: ${enviador.nombre}${enviador.simulado ? " (no envía de verdad)" : ""}`);

const plantilla = correoDeVerificacion(
  "Prueba",
  "https://allison.ejemplo.co/verificar/TOKEN-DE-MUESTRA",
  15
);

try {
  await enviador.enviar({ ...plantilla, para: destino });
  console.log(`Enviado a ${destino}. Revisa la bandeja (y el spam la primera vez).`);
} catch (e) {
  console.error("FALLÓ el envío:");
  console.error(String(e.message ?? e));
  console.error(
    "\nRevisa: RESEND_API_KEY, CORREO_REMITENTE (debe ser del dominio " +
      "verificado en Resend) y que el dominio tenga los registros DNS aprobados."
  );
  process.exit(1);
}
