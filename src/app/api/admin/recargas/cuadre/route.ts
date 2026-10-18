import { exigirAdmin } from "@/lib/admin";
import { celdaCsv } from "@/lib/panel/csv";
import { cuadreDelDia } from "@/lib/panel/recargas";
import { hoyEnColombia } from "@/lib/uso";

/** El cuadre de caja del día en CSV (se abre en Excel). */
export async function GET(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return new Response("No autorizado", { status: 403 });
  const pedida = new URL(peticion.url).searchParams.get("fecha") ?? "";
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(pedida) ? pedida : hoyEnColombia();
  const c = await cuadreDelDia(fecha);
  const lineas = [
    ["Hora", "Alumno", "Colegio", "Curso", "Tipo", "Intervenciones", "Valor", "Valor recibido", "Medio", "Recibo", "Hecha por"].map(celdaCsv).join(";"),
    ...c.recargas.map((r) =>
      [
        new Date(r.fecha).toLocaleTimeString("es-CO", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit" }),
        r.alumno,
        r.colegio ?? "Particular",
        r.curso ?? "",
        r.tipo === "plan" ? "Plan mensual" : "Recarga",
        r.intervenciones,
        r.montoCop,
        r.valorRecibido,
        r.medio,
        r.recibo,
        r.hechaPor,
      ]
        .map(celdaCsv)
        .join(";")
    ),
    "",
    [celdaCsv("Total recibido"), celdaCsv(c.recibido)].join(";"),
    ...Object.entries(c.porMedio).map(([m, v]) => [celdaCsv(`Total ${m}`), celdaCsv(v)].join(";")),
  ];
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cuadre-${fecha}.csv"`,
    },
  });
}
