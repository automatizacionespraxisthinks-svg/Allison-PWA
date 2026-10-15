import { Cargando } from "@/components/Cargando";

/** Se pinta al instante mientras el servidor trae el glosario. */
export default function Loading() {
  return <Cargando texto="Abriendo tu glosario…" />;
}
