import { PanelReportes } from "@/components/admin/PanelReportes";
import { reportesParaRevisar } from "@/lib/reportes";
import { paginaDeAdmin } from "@/lib/admin";

/**
 * Lo que los alumnos marcan con "esta corrección está mal": lo que dijo
 * el alumno, lo que respondió Allison y la decisión del administrador.
 */
export default async function PaginaReportesAdmin() {
  await paginaDeAdmin();
  const { abiertos, resueltos } = await reportesParaRevisar();
  return <PanelReportes abiertos={abiertos} resueltos={resueltos} />;
}
