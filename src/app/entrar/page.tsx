import { FormularioEntrar } from "./FormularioEntrar";

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
