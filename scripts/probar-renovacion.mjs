/**
 * La renovación mensual de los planes (db/020_renovacion_planes.sql).
 *
 * Lo que se prueba es lo que la app promete y hasta ahora no cumplía:
 *   · un plan de varios meses entrega sus mensajes CADA mes;
 *   · lo que sobra del mes vence ("no se acumulan", términos sección 5);
 *   · el plan termina cuando se acaban sus meses;
 *   · los meses se cuentan desde el inicio (un plan del 31 no se corre
 *     al 28) y los meses atrasados no se entregan de golpe;
 *   · todo queda en el libro de movimientos, y renovar al mismo tiempo
 *     que se consume o que se compra otro plan no rompe el saldo.
 *
 * Crea alumnos de prueba y los borra al terminar.
 *
 *   node --env-file=.env scripts/probar-renovacion.mjs
 */
const { sql } = await import("../src/lib/db.ts");
const { registrarResultado } = await import("../src/lib/cobro.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

const creados = [];
const planes = Object.fromEntries(
  (await sql`select id, codigo, mensajes_por_mes, duracion_meses from planes`).map((p) => [p.codigo, p])
);

/**
 * Un alumno con una suscripción activa que empezó `hace` (intervalo de
 * Postgres), parado en su mes número `mes`, con saldo asentado en el
 * libro para que la auditoría cuadre desde el principio.
 */
async function alumnoConPlan({ codigo, hace, mes = 1, plan = 0, recarga = 0, inicio = null }) {
  const p = planes[codigo];
  const [u] = await sql`
    insert into users (tipo_acceso, email, nombre, nivel)
    values ('email', ${`renovacion-${Date.now()}-${creados.length}@ejemplo.co`}, 'Prueba renovación', 'A2')
    returning id
  `;
  creados.push(u.id);

  await sql`insert into saldos (user_id, mensajes_plan, mensajes_recarga) values (${u.id}, ${plan}, ${recarga})`;
  if (plan > 0) {
    await sql`
      insert into movimientos_credito (user_id, tipo, bolsa, cantidad, saldo_plan_despues, saldo_recarga_despues)
      values (${u.id}, 'plan_asignacion', 'plan', ${plan}, ${plan}, 0)`;
  }
  if (recarga > 0) {
    await sql`
      insert into movimientos_credito (user_id, tipo, bolsa, cantidad, saldo_plan_despues, saldo_recarga_despues)
      values (${u.id}, 'recarga', 'recarga', ${recarga}, ${plan}, ${recarga})`;
  }

  await sql`
    with base as (
      select coalesce(${inicio}::timestamptz, now() - ${hace}::interval) as inicio
    )
    insert into suscripciones
      (user_id, plan_id, estado, inicio_en, fin_en, periodo_inicio, periodo_fin, mensajes_asignados)
    select ${u.id}, ${p.id}, 'activa', inicio,
           inicio + make_interval(months => ${p.duracion_meses}),
           inicio + make_interval(months => ${mes - 1}),
           inicio + make_interval(months => ${mes}),
           ${p.mensajes_por_mes}
      from base
  `;
  return u.id;
}

const renovar = async (id) => (await sql`select renovar_suscripcion(${id}) as cambio`)[0].cambio;

async function estado(id) {
  const [s] = await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${id}`;
  const [{ libro }] = await sql`select coalesce(sum(cantidad), 0)::int as libro from movimientos_credito where user_id = ${id}`;
  const [sus] = await sql`
    select estado, inicio_en, fin_en, periodo_inicio, periodo_fin,
           (periodo_inicio = inicio_en + make_interval(months => 1)) as en_mes_2
      from suscripciones where user_id = ${id} order by creado_en desc limit 1`;
  const movimientos = await sql`
    select tipo, cantidad from movimientos_credito where user_id = ${id} order by id`;
  return {
    plan: s.mensajes_plan,
    recarga: s.mensajes_recarga,
    cuadra: s.mensajes_plan + s.mensajes_recarga === libro,
    libro,
    sus,
    movimientos: movimientos.map((m) => `${m.tipo}:${m.cantidad}`),
  };
}

/** ¿El período guardado es exactamente [inicio + (n-1) meses, inicio + n meses)? */
async function enMes(id, n) {
  const [r] = await sql`
    select periodo_inicio = inicio_en + make_interval(months => ${n - 1}) as desde,
           periodo_fin    = least(inicio_en + make_interval(months => ${n}), fin_en) as hasta
      from suscripciones where user_id = ${id} and estado = 'activa'`;
  return Boolean(r?.desde && r?.hasta);
}

try {
  console.log("Renovación mensual de los planes:");

  // 1. El caso de todos los meses
  const a = await alumnoConPlan({ codigo: "anual", hace: "1 month 1 hour", plan: 250, recarga: 40 });
  probar("un plan anual cuyo mes terminó se renueva", (await renovar(a)) === true);
  let e = await estado(a);
  probar("lo que sobró del plan (250) vence y llegan los 700 del mes nuevo", e.plan === 700, JSON.stringify(e));
  probar("la recarga no se toca: no caduca", e.recarga === 40);
  probar(
    "queda en el libro: vencimiento y asignación, y el saldo cuadra",
    e.cuadra && e.movimientos.slice(-2).join(",") === "expiracion:-250,plan_asignacion:700",
    e.movimientos.join(",")
  );
  probar("la suscripción sigue activa, ahora en su mes 2", e.sus.estado === "activa" && (await enMes(a, 2)));
  probar("una segunda llamada no encuentra nada que hacer", (await renovar(a)) === false && (await estado(a)).plan === 700);

  // 2. Al día
  const b = await alumnoConPlan({ codigo: "anual", hace: "10 days", plan: 500 });
  probar("una suscripción a mitad de mes no se toca", (await renovar(b)) === false && (await estado(b)).plan === 500);

  // 3. El mensual termina
  const c = await alumnoConPlan({ codigo: "mensual", hace: "1 month 1 hour", plan: 100, recarga: 10 });
  probar("el plan mensual, al cumplir su mes, se renueva", (await renovar(c)) === true);
  e = await estado(c);
  probar(
    "y TERMINA: vence lo que sobró y no se asigna nada nuevo",
    e.sus.estado === "vencida" && e.plan === 0 && e.recarga === 10 && e.cuadra,
    JSON.stringify(e)
  );

  // 4. El anual en su último mes
  const d = await alumnoConPlan({ codigo: "anual", hace: "12 months 1 hour", mes: 12, plan: 30 });
  await renovar(d);
  e = await estado(d);
  probar("el anual, al cumplir 12 meses, termina", e.sus.estado === "vencida" && e.plan === 0 && e.cuadra, JSON.stringify(e));

  // 5. Meses atrasados
  const f = await alumnoConPlan({ codigo: "anual", hace: "4 months 1 hour", mes: 1, plan: 80 });
  await renovar(f);
  e = await estado(f);
  probar(
    "con 3 meses sin ponerse al día, se abre SOLO el mes vigente (uno, no cuatro)",
    e.plan === 700 && (await enMes(f, 5)) && e.movimientos.filter((m) => m.startsWith("plan_asignacion:700")).length === 1 && e.cuadra,
    JSON.stringify(e)
  );

  // 6. Semestral a mitad y al final
  const g = await alumnoConPlan({ codigo: "semestral", hace: "2 months 1 hour", mes: 2, plan: 0 });
  await renovar(g);
  probar("el semestral en su mes 3 recibe sus 700", (await estado(g)).plan === 700 && (await enMes(g, 3)));
  const h = await alumnoConPlan({ codigo: "semestral", hace: "6 months 1 hour", mes: 6, plan: 12 });
  await renovar(h);
  probar("y al sexto mes termina", (await estado(h)).sus.estado === "vencida");

  // 7. Un plan que empezó un día 31
  const [{ inicio31 }] = await sql`
    select max(d) as inicio31 from (
      select (date_trunc('month', now() - make_interval(months => k)) + interval '1 month' - interval '1 day' + interval '17 hours') as d
        from generate_series(2, 10) k
    ) t where extract(day from d) = 31
  `;
  const i = await alumnoConPlan({ codigo: "anual", inicio: inicio31, hace: "0", plan: 0 });
  await renovar(i);
  const [anclado] = await sql`
    select s.periodo_fin = (
             select min(s.inicio_en + make_interval(months => n))
               from generate_series(1, 13) n
              where s.inicio_en + make_interval(months => n) > now()
           ) as bien,
           to_char(s.inicio_en, 'YYYY-MM-DD') as inicio, to_char(s.periodo_fin, 'YYYY-MM-DD') as fin
      from suscripciones s where s.user_id = ${i}`;
  probar(
    `un plan del día 31 no se corre al 28 (empezó ${anclado.inicio}, el mes vigente cierra ${anclado.fin})`,
    anclado.bien === true
  );

  // 8. Dos renovaciones a la vez
  const j = await alumnoConPlan({ codigo: "anual", hace: "1 month 1 hour", plan: 9 });
  const dos = await Promise.all([renovar(j), renovar(j)]);
  e = await estado(j);
  probar(
    "dos renovaciones al mismo tiempo: una renueva, el saldo no se duplica",
    dos.filter(Boolean).length === 1 && e.plan === 700 && e.cuadra,
    `${dos} · ${JSON.stringify(e)}`
  );

  // 9. Renovar mientras se consume
  const k = await alumnoConPlan({ codigo: "anual", hace: "1 month 1 hour", plan: 5, recarga: 20 });
  await Promise.all([
    renovar(k),
    ...Array.from({ length: 10 }, () => sql`select consumir_mensaje(${k}, null)`),
  ]);
  e = await estado(k);
  probar(
    "renovar mientras llegan 10 consumos: el saldo sigue cuadrando con el libro",
    e.cuadra && e.plan >= 0 && e.recarga >= 0 && e.plan + e.recarga >= 700 - 10,
    JSON.stringify(e)
  );

  // 10. Renovar mientras se acredita la compra de otro plan
  const l = await alumnoConPlan({ codigo: "anual", hace: "1 month 1 hour", plan: 50 });
  const referencia = `PRUEBA-RENOVACION-${Date.now()}`;
  await sql`
    insert into transacciones (user_id, tipo, plan_id, monto_cop, mensajes_otorgados, pasarela, referencia_externa, estado)
    values (${l}, 'plan', ${planes.mensual.id}, 35000, ${planes.mensual.mensajes_por_mes}, 'bold', ${referencia}, 'pendiente')`;
  const [, compra] = await Promise.all([
    renovar(l),
    registrarResultado({ pasarela: "bold", referencia, aprobado: true, montoCop: 35000, rastro: {}, origen: "aviso" }),
  ]);
  e = await estado(l);
  const [{ activas }] = await sql`select count(*)::int as activas from suscripciones where user_id = ${l} and estado = 'activa'`;
  probar(
    "renovar mientras se acredita otro plan: sin bloqueo mutuo, una sola suscripción activa y el saldo cuadra",
    compra === "acreditado" && activas === 1 && e.cuadra,
    `${compra} · activas ${activas} · ${JSON.stringify(e)}`
  );
} catch (err) {
  console.error("\nError:", err);
  fallos++;
} finally {
  for (const id of creados) {
    await sql`delete from movimientos_credito where user_id = ${id}`;
    await sql`delete from suscripciones where user_id = ${id}`;
    await sql`delete from transacciones where user_id = ${id}`;
    await sql`delete from users where id = ${id}`;
  }
  await sql.end();
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nRenovación correcta.");
