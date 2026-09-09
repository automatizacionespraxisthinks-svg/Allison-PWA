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
 * Envoltura de servidor: decide si el botón de Google existe.
 *
 * La decisión depende de variables SIN NEXT_PUBLIC_, que el navegador
 * no puede leer — y así debe ser: las llaves no viajan al cliente,
 * solo viaja el sí o el no. Sin llaves configuradas, un botón de
 * Google sería una puerta pintada en la pared: se ve, se toca, y da
 * error.
 */
export default function PaginaEntrar() {
  const hayGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return <FormularioEntrar hayGoogle={hayGoogle} />;
}
