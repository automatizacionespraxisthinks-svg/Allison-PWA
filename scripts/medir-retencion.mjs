/**
 * Medición base de la retención: cuántos alumnos vuelven.
 *
 * Es la foto de ANTES de las mejoras del plan (sección 13): sin ella no
 * hay contra qué comparar la ruta nueva. Se corre ahora, se guarda la
 * salida, y se vuelve a correr con la misma fórmula después del cambio.
 *
 * Solo LEE. Todo va dentro de una transacción de solo lectura: si por
 * error alguna consulta intentara escribir, Postgres la rechaza.
 *
 * La actividad sale de progreso_diario (una fila por alumno y día en
 * que practicó) y no de mensajes, que se borran a los 20 días. Se
 * cuentan solo estudiantes, sin las cuentas de prueba.
 *
 *   node --env-file=.env scripts/medir-retencion.mjs              (base de .env)
 *   node --env-file=.env scripts/medir-retencion.mjs --produccion (DATABASE_URL_PRODUCCION)
 */
import postgres from "postgres";
import { modoSslOSalir } from "../db/conexion.mjs";

const url = process.argv.includes("--produccion")
  ? process.env.DATABASE_URL_PRODUCCION
  : process.env.DATABASE_URL;
if (!url) {
  console.error("Falta la URL de la base en .env");
  process.exit(1);
}

const sql = postgres(url, { ssl: modoSslOSalir(url), max: 1, onnotice: () => {} });
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)} %` : "sin datos");

try {
  await sql.begin("read only", async (tx) => {
    // Estudiantes reales: fuera admins, coordinadores y cuentas de prueba.
    const alumnos = tx`
      select id, (creado_en at time zone 'America/Bogota')::date as dia0,
             racha_dias, ultima_practica_en
        from users
       where rol = 'estudiante'
         and coalesce(email::text, '') not like '%@ejemplo.co'`;

    const [tot] = await tx`
      with a as (${alumnos})
      select count(*)::int as alumnos,
             count(*) filter (where ultima_practica_en is not null)::int as practicaron,
             count(*) filter (where ultima_practica_en > now() - interval '7 days')::int as activos7,
             count(*) filter (where ultima_practica_en > now() - interval '30 days')::int as activos30,
             count(*) filter (where racha_dias >= 7)::int as racha7,
             min(dia0) as desde, max(dia0) as hasta
        from a`;

    // Volver al día N: practicó exactamente ese día contado desde que se
    // registró. Solo entran a la cuenta los que ya tienen N días.
    const dias = [1, 7, 14];
    const volver = [];
    for (const n of dias) {
      const [r] = await tx`
        with a as (${alumnos})
        select count(*)::int as cohorte,
               count(*) filter (where exists (
                 select 1 from progreso_diario p
                  where p.user_id = a.id and p.fecha = a.dia0 + ${n}::int
                    and p.mensajes > 0))::int as volvieron
          from a
         where a.dia0 + ${n}::int <= (now() at time zone 'America/Bogota')::date - 1`;
      volver.push({ n, ...r });
    }

    // Alguna vez después del día 0 (más amplio que el día exacto).
    const [alguna] = await tx`
      with a as (${alumnos})
      select count(*)::int as cohorte,
             count(*) filter (where exists (
               select 1 from progreso_diario p
                where p.user_id = a.id and p.fecha > a.dia0 and p.mensajes > 0))::int as volvieron
        from a
       where a.dia0 <= (now() at time zone 'America/Bogota')::date - 1`;

    // Días distintos de práctica por alumno.
    const dist = await tx`
      with a as (${alumnos}),
           d as (select a.id, count(p.fecha)::int as dias
                   from a left join progreso_diario p
                     on p.user_id = a.id and p.mensajes > 0
                  group by a.id)
      select case when dias = 0 then '0'
                  when dias = 1 then '1'
                  when dias <= 3 then '2-3'
                  when dias <= 7 then '4-7'
                  else '8+' end as rango,
             count(*)::int as alumnos
        from d group by 1 order by min(dias)`;

    // Dónde se quedan en la ruta actual: unidades completadas.
    const unidades = await tx`
      with a as (${alumnos}),
           u as (select a.id, count(pl.completada_en)::int as completas
                   from a left join progreso_lecciones pl on pl.user_id = a.id
                  group by a.id)
      select completas, count(*)::int as alumnos
        from u group by completas order by completas`;

    const hoy = new Date().toISOString().slice(0, 10);
    console.log(`\nMedición base de retención · ${hoy}`);
    console.log(`Alumnos registrados entre ${tot.desde?.toISOString?.().slice(0, 10) ?? "-"} y ${tot.hasta?.toISOString?.().slice(0, 10) ?? "-"}\n`);
    console.log(`  Alumnos (estudiantes reales)   ${tot.alumnos}`);
    console.log(`  Practicaron alguna vez         ${tot.practicaron}  (${pct(tot.practicaron, tot.alumnos)})`);
    console.log(`  Activos últimos 7 días         ${tot.activos7}`);
    console.log(`  Activos últimos 30 días        ${tot.activos30}`);
    console.log(`  Con racha de 7 días o más      ${tot.racha7}\n`);
    console.log("  Vuelven al día exacto:");
    for (const v of volver) console.log(`    Día ${String(v.n).padEnd(3)} ${String(v.volvieron).padStart(4)} de ${String(v.cohorte).padEnd(4)} ${pct(v.volvieron, v.cohorte)}`);
    console.log(`    Algún día después del primero  ${alguna.volvieron} de ${alguna.cohorte}  ${pct(alguna.volvieron, alguna.cohorte)}\n`);
    console.log("  Días distintos de práctica:");
    for (const r of dist) console.log(`    ${r.rango.padEnd(4)} ${r.alumnos}`);
    console.log("\n  Unidades completadas de la ruta actual:");
    for (const r of unidades) console.log(`    ${String(r.completas).padEnd(3)} ${r.alumnos}`);
    console.log("");
  });
} finally {
  await sql.end();
}
