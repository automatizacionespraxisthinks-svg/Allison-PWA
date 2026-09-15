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
 * Los motivos por los que se vuelve aquí con ?error=. Los dos primeros
 * los pone la aplicación (src/lib/entrada-google.ts); el resto son los
 * códigos de Auth.js (AccessDenied, OAuthCallbackError, Configuration…)
 * y todos significan lo mismo para quien está al frente: no se pudo, y
 * el camino que siempre sirve es el correo con la contraseña.
 */
function avisoDe(error: string | undefined): string | null {
  if (!error) return null;
  switch (error) {
    case "google-sin-verificar":
      return "Tu cuenta de Google no tiene el correo verificado, así que no podemos usarla para entrar. Entra con tu correo y contraseña.";
    case "cuenta-inactiva":
      return "Esa cuenta está desactivada. Si crees que es un error, escríbenos.";
    default:
      return "No pudimos completar la entrada. Intenta de nuevo, o entra con tu correo y contraseña.";
  }
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
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <FormularioEntrar hayGoogle={googleConfigurado()} aviso={avisoDe(error)} />;
}
