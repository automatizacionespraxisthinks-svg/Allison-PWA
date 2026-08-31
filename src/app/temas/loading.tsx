import { Cargando } from "@/components/Cargando";

/** Se pinta al instante mientras el servidor arma la página. */
export default function Loading() {
  return <Cargando texto="Cargando los temas…" />;
}
