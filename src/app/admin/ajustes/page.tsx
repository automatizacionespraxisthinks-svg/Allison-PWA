import { FormAjustes } from "@/components/admin/FormAjustes";
import { CLAVES, leerAjustes, type Ajustes } from "@/lib/ajustes";
import { sql } from "@/lib/db";
import { paginaDeAdmin } from "@/lib/admin";

/**
 * Ajustes (plan, sección 21; boceto 8): los valores que antes estaban
 * fijos en el código. Cada cambio queda con quién lo hizo y cuándo.
 */
export default async function PaginaAjustes() {
  await paginaDeAdmin();
  const [a, filas] = await Promise.all([leerAjustes(), sql`select clave, actualizado_en, actualizado_por from ajustes where actualizado_por is not null`]);
  const porClave = new Map(filas.map((f) => [f.clave as string, f]));
  const cambiados: Record<string, string> = {};
  for (const [k, clave] of Object.entries(CLAVES) as [keyof Ajustes, string][]) {
    const f = porClave.get(clave);
    if (f) {
      cambiados[k] = `Cambiado por ${f.actualizado_por} el ${(f.actualizado_en as Date).toLocaleDateString("es-CO", {
        timeZone: "America/Bogota",
        day: "numeric",
        month: "short",
      })}.`;
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Ajustes</h1>
      <FormAjustes inicial={a} cambiados={cambiados} />
      {a.dolarCop === 4000 && (
        <p className="text-xs text-texto-suave">
          El costo se calcula con el dólar a $4.000; el real en octubre de 2026 está cerca de $3.216, así que el panel muestra un costo de IA más
          alto que el real.
        </p>
      )}
    </div>
  );
}
