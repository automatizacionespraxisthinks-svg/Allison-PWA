import { googleConfigurado } from "@/lib/google";
import { FormularioRegistro } from "./FormularioRegistro";

/** Por lo mismo que /entrar: las llaves de Google se leen en caliente. */
export const dynamic = "force-dynamic";

/**
 * Con qué aviso se llega desde el regreso de Google
 * (src/lib/entrada-google.ts manda aquí a quien no tiene cuenta).
 */
function avisoDe(google: string | undefined): string | null {
  switch (google) {
    case "consentimiento":
      return "No encontramos una cuenta con ese correo de Google. Para crearla, marca las dos casillas de abajo y toca «Continuar con Google».";
    case "limite":
      return "Demasiadas cuentas nuevas en este momento. Intenta más tarde.";
    default:
      return null;
  }
}

export default async function PaginaRegistro({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const { google } = await searchParams;
  return (
    <FormularioRegistro hayGoogle={googleConfigurado()} avisoGoogle={avisoDe(google)} />
  );
}
