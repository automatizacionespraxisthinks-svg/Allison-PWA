/**
 * La dirección pública que va en los enlaces.
 *
 * Existe por un fallo que solo se ve fuera de Vercel: en el contenedor,
 * `new URL(peticion.url).origin` da `https://0.0.0.0:3000`, y con eso
 * el enlace de verificación, el de recuperar contraseña y el retorno de
 * Wompi quedaban muertos — en silencio, porque los correos sí se envían.
 *
 *   node scripts/probar-origen.mjs
 */
import { origenPublico } from "../src/lib/origen.ts";

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

// Así llega la petición dentro del contenedor: la URL trae la dirección
// donde escucha el proceso, no el dominio del visitante.
const comoEnElContenedor = (cabeceras = {}) =>
  new Request("https://0.0.0.0:3000/api/registro", {
    method: "POST",
    headers: new Headers(cabeceras),
  });

console.log("Dirección pública para los enlaces:");

process.env.AUTH_URL = "https://allison.ejemplo.co";
probar(
  "usa AUTH_URL y no la dirección de escucha",
  origenPublico(comoEnElContenedor()) === "https://allison.ejemplo.co",
  origenPublico(comoEnElContenedor())
);

process.env.AUTH_URL = "https://allison.ejemplo.co/";
probar(
  "quita la barra final (si no, el enlace sale con doble barra)",
  origenPublico(comoEnElContenedor()) === "https://allison.ejemplo.co"
);

process.env.AUTH_URL = "  https://allison.ejemplo.co  ";
probar(
  "tolera espacios al pegar la variable",
  origenPublico(comoEnElContenedor()) === "https://allison.ejemplo.co"
);

delete process.env.AUTH_URL;
probar(
  "sin AUTH_URL, cae a lo que dice el proxy",
  origenPublico(
    comoEnElContenedor({
      "x-forwarded-host": "allison.ejemplo.co",
      "x-forwarded-proto": "https",
    })
  ) === "https://allison.ejemplo.co"
);

probar(
  "el respaldo asume https, no http (las cookies dependen de eso)",
  origenPublico(comoEnElContenedor({ host: "allison.ejemplo.co" })) ===
    "https://allison.ejemplo.co"
);

// Y la comprobación que da sentido a todo: que NUNCA salga 0.0.0.0
// cuando la configuración está puesta, que es como estará en producción.
process.env.AUTH_URL = "https://allison.ejemplo.co";
const enlace = `${origenPublico(comoEnElContenedor())}/verificar/UN-TOKEN`;
probar(
  "el enlace de un correo no contiene 0.0.0.0",
  !enlace.includes("0.0.0.0"),
  enlace
);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nDirección pública correcta.");
