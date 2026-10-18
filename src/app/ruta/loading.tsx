import { Cargando } from "@/components/Cargando";

/** Se pinta al instante mientras el servidor arma la ruta. */
export default function Loading() {
  return <Cargando texto="Abriendo tu ruta…" />;
}
