import { googleConfigurado } from "@/lib/google";
import { FormularioEntrar } from "./FormularioEntrar";

/**
 * Se renderiza en CADA petición, no al construir la imagen.
 *
 * Sin esto Next marcaba esta página como estática y horneaba la
 * decisión de abajo en el momento del build: cambiar las llaves de
 * Google en el panel no tendría ningún efecto hasta reconstruir la
 * imagen entera. Cuesta un render por visita en una pantalla trivial;
 * a cambio, la configuración se lee en caliente como todas las demás.
 */
export const dynamic = "force-dynamic";

/**
 * Los motivos por los que se vuelve aquí con parámetros.
 *
 * Con ?error=: los dos primeros los pone la aplicación
 * (src/lib/entrada-google.ts); el resto son los códigos de Auth.js
 * (AccessDenied, OAuthCallbackError, Configuration…) y todos significan
 * lo mismo para quien está al frente: no se pudo, y el camino que
 * siempre sirve es el correo con la contraseña.
 *
 * Con ?callbackUrl= y sin error: Auth.js devolvió a esta página porque
 * el proveedor de Google NO está registrado en el servidor. Pasa cuando
 * las llaves se ponen en el panel con el contenedor ya arrancado: la
 * pantalla las ve (se leen en caliente) pero el proveedor se registró al
 * arrancar, sin ellas. Sin este aviso, tocar el botón parecía no hacer
 * nada: la página se recargaba a sí misma.
 */
function avisoDe(error: string | undefined, callbackUrl: string | undefined): string | null {
  if (error) {
    switch (error) {
      case "google-sin-verificar":
        return "Tu cuenta de Google no tiene el correo verificado, así que no podemos usarla para entrar. Entra con tu correo y contraseña.";
      case "cuenta-inactiva":
        return "Esa cuenta está desactivada. Si crees que es un error, escríbenos.";
      case "google-otra-cuenta":
        return "Ese correo ya está unido a otra cuenta de Google. Entra con esa cuenta de Google o con tu correo y contraseña.";
      default:
        return "No pudimos completar la entrada. Intenta de nuevo, o entra con tu correo y contraseña.";
    }
  }
  if (callbackUrl) {
    return "No pudimos abrir Google: el servidor no tiene activo ese inicio de sesión. Si lo acabas de configurar, hay que reiniciar la aplicación para que lea las llaves. Mientras tanto, entra con tu correo y contraseña.";
  }
  return null;
}

/**
 * Envoltura de servidor: decide si el botón de Google existe.
 *
 * La decisión depende de variables SIN NEXT_PUBLIC_, que el navegador
 * no puede leer — y así debe ser: las llaves no viajan al cliente,
 * solo viaja el sí o el no. Sin llaves configuradas, un botón de
 * Google sería una puerta pintada en la pared: se ve, se toca, y da
 * error.
 */
export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  return (
    <FormularioEntrar hayGoogle={googleConfigurado()} aviso={avisoDe(error, callbackUrl)} />
  );
}
