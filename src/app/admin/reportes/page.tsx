import { PanelReportes } from "@/components/admin/PanelReportes";
import { leerAjustes } from "@/lib/ajustes";
import { reportesParaRevisar } from "@/lib/reportes";
import { paginaDeAdmin } from "@/lib/admin";

/**
 * Lo que los alumnos marcan con "esta corrección está mal": lo que dijo
 * el alumno, lo que respondió Allison y la decisión del administrador.
 */
export default async function PaginaReportesAdmin() {
  await paginaDeAdmin();
  // El umbral de la alerta sale de Ajustes, como en el Resumen (auditoría,
  // 30 de octubre de 2026).
  const [{ abiertos, resueltos }, ajustes] = await Promise.all([reportesParaRevisar(), leerAjustes()]);
  return <PanelReportes abiertos={abiertos} resueltos={resueltos} diasAlerta={ajustes.alertaReporteDias} />;
}
