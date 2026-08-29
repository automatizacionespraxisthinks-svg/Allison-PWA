import { PanelColegios } from "@/components/admin/PanelColegios";
import { colegios } from "@/lib/admin";

export default async function PaginaColegiosAdmin() {
  return <PanelColegios colegios={await colegios()} />;
}
