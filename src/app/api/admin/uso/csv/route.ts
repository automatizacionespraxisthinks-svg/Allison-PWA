import { exigirAdmin } from "@/lib/admin";
import { celdaCsv } from "@/lib/panel/csv";
import { leerAjustes } from "@/lib/ajustes";
import { consumoPorAlumno, type Estado, type Orden } from "@/lib/panel/consumo";
import { PARTES } from "@/lib/panel/etiquetas";
import { resolverRango } from "@/lib/uso";

/** La tabla de consumo por estudiante en CSV, con los mismos filtros de la pantalla. */
export async function GET(peticion: Request) {
  const admin = await exigirAdmin();
  if (!admin) return new Response("No autorizado", { status: 403 });
  const p = new URL(peticion.url).searchParams;
  const rango = resolverRango(p.get("periodo") ?? undefined, p.get("desde") ?? undefined, p.get("hasta") ?? undefined);
  const a = await leerAjustes();
  const c = await consumoPorAlumno(
    {
      rango,
      q: p.get("q") ?? undefined,
      colegio: p.get("colegio") ?? undefined,
      curso: p.get("curso") ?? undefined,
      estado: (p.get("estado") as Estado) ?? undefined,
      orden: (p.get("orden") as Orden) ?? undefined,
    },
    a.dolarCop,
    true
  );
  const lineas = [
    [
      "Alumno",
      "Identificador",
      "Colegio",
      "Curso",
      "Nivel",
      "Va en",
      "Intervenciones",
      ...PARTES.map((x) => x.nombre),
      "Tokens de entrada",
      "Tokens de salida",
      "Costo de IA (COP)",
      "Saldo",
      "Estado",
    ]
      .map(celdaCsv)
      .join(";"),
    ...c.filas.map((f) =>
      [
        f.nombre,
        f.identificador,
        f.colegio ?? "Particular",
        f.curso ?? "",
        f.nivel,
        f.vaEn,
        f.intervenciones,
        ...PARTES.map((x) => f.porParte[x.clave] ?? 0),
        f.tokensEntrada,
        f.tokensSalida,
        f.costoCop,
        f.saldo,
        [f.saldo === 0 ? "Sin saldo" : "", f.enPrueba ? "Prueba gratis" : ""].filter(Boolean).join(" · "),
      ]
        .map(celdaCsv)
        .join(";")
    ),
  ];
  return new Response("﻿" + lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="consumo-${rango.desde}-a-${rango.hasta}.csv"`,
    },
  });
}
