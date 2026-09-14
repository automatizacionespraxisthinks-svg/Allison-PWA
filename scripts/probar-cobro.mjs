/**
 * El camino único de acreditación (src/lib/cobro.ts), contra la base.
 *
 * Por aquí pasan el aviso de la pasarela y la consulta activa del
 * estado. Lo que se prueba es lo que no puede fallar nunca:
 *   · un pago aprobado acredita exactamente una vez, aunque el aviso se
 *     repita o lleguen aviso y consulta al mismo tiempo;
 *   · un monto distinto al de la orden NO acredita;
 *   · un rechazo no es definitivo: con Bold el alumno puede reintentar
 *     en el mismo link, y ese pago sí debe acreditarse;
 *   · lo guardado de la orden (el id del link) sobrevive a los avisos.
 *
 * Crea un alumno de prueba y lo borra al terminar.
 *
 *   node --env-file=.env scripts/probar-cobro.mjs
 */
const { registrarResultado } = await import("../src/lib/cobro.ts");
const { sql } = await import("../src/lib/db.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

// Los montos distintos se anuncian por console.error: se capturan para
// comprobar que de verdad dejan rastro, sin ensuciar la salida.
const errores = [];
const errorOriginal = console.error;
console.error = (...m) => errores.push(m.join(" "));

let alumno;
try {
  [alumno] = await sql`
    insert into users (tipo_acceso, email, nombre, nivel)
    values ('email', ${`cobro-${Date.now()}@ejemplo.co`}, 'Prueba de cobro', 'A2')
    returning id
  `;

  let n = 0;
  const nuevaOrden = async ({ tipo = "recarga", monto = 10000, mensajes = 167, planId = null, payload = null } = {}) => {
    const referencia = `PRUEBA-COBRO-${Date.now()}-${++n}`;
    const [t] = await sql`
      insert into transacciones
        (user_id, tipo, plan_id, monto_cop, mensajes_otorgados, pasarela,
         referencia_externa, estado, payload)
      values
        (${alumno.id}, ${tipo}, ${planId}, ${monto}, ${mensajes}, 'bold',
         ${referencia}, 'pendiente', ${payload ? sql.json(payload) : null})
      returning id
    `;
    return { id: t.id, referencia };
  };
  const resultado = (orden, cambios = {}) =>
    registrarResultado({
      pasarela: "bold",
      referencia: orden.referencia,
      aprobado: true,
      montoCop: 10000,
      detalle: { prueba: true },
      origen: "aviso",
      ...cambios,
    });
  const saldo = async () => {
    const [s] = await sql`
      select mensajes_plan, mensajes_recarga from saldos where user_id = ${alumno.id}
    `;
    return s ?? { mensajes_plan: 0, mensajes_recarga: 0 };
  };
  const estado = async (orden) =>
    (await sql`select estado from transacciones where id = ${orden.id}`)[0].estado;

  console.log("Acreditación de pagos en línea:");

  // 1. Lo normal
  const a = await nuevaOrden({ payload: { id_pasarela: "LNK_PRUEBA_A" } });
  probar("un pago aprobado con el monto correcto acredita", (await resultado(a)) === "acreditado");
  probar("y suma exactamente los mensajes de la orden", (await saldo()).mensajes_recarga === 167);
  const [{ count: movimientos }] = await sql`
    select count(*)::int from movimientos_credito m
      join transacciones t on t.id = m.transaccion_id
     where t.referencia_externa = ${a.referencia}
  `;
  probar("y deja su movimiento en el libro", movimientos === 1, String(movimientos));

  // 2. El aviso repetido
  probar("el mismo aviso otra vez no acredita dos veces", (await resultado(a)) === "ya_acreditado");
  probar("el saldo no cambia", (await saldo()).mensajes_recarga === 167);

  // 3. Lo guardado sobrevive
  const [{ payload }] = await sql`select payload from transacciones where id = ${a.id}`;
  probar(
    "el id del link sigue guardado después de los avisos",
    payload?.id_pasarela === "LNK_PRUEBA_A" && payload?.aviso?.prueba === true,
    JSON.stringify(payload)
  );

  // 4. El monto
  const b = await nuevaOrden();
  const erroresAntes = errores.length;
  probar("un monto DISTINTO al de la orden no acredita", (await resultado(b, { montoCop: 9999 })) === "monto_distinto");
  probar("la orden queda pendiente para revisarla", (await estado(b)) === "pendiente");
  probar("y deja rastro en el log", errores.length === erroresAntes + 1);
  probar("un monto ilegible (NaN) tampoco acredita", (await resultado(b, { montoCop: Number.NaN })) === "monto_distinto");
  probar("el saldo sigue igual", (await saldo()).mensajes_recarga === 167);

  // 5. Sin monto en el aviso (Wompi antiguo, por ejemplo)
  const c = await nuevaOrden();
  probar("sin monto que comparar, acredita", (await resultado(c, { montoCop: undefined })) === "acreditado");

  // 6. El reintento en el mismo link
  const d = await nuevaOrden();
  probar("un rechazo marca la orden rechazada", (await resultado(d, { aprobado: false })) === "rechazado" && (await estado(d)) === "rechazada");
  const antesReintento = (await saldo()).mensajes_recarga;
  probar(
    "si después el alumno paga en el mismo link, SÍ acredita",
    (await resultado(d)) === "acreditado" && (await saldo()).mensajes_recarga === antesReintento + 167
  );
  probar(
    "un rechazo que llega tarde no deshace una aprobación",
    (await resultado(d, { aprobado: false })) === "ya_acreditado" && (await estado(d)) === "aprobada"
  );

  // 7. Lo que no es nuestro
  probar(
    "una referencia desconocida no toca nada",
    (await resultado({ referencia: "NO-EXISTE-JAMAS" })) === "desconocido"
  );

  // 8. Un plan
  const [plan] = await sql`select id, mensajes_por_mes from planes where codigo = 'mensual'`;
  const e = await nuevaOrden({ tipo: "plan", monto: 35000, mensajes: plan.mensajes_por_mes, planId: plan.id });
  const planAntes = (await saldo()).mensajes_plan;
  probar("un plan aprobado acredita", (await resultado(e, { montoCop: 35000 })) === "acreditado");
  probar("a la bolsa del plan", (await saldo()).mensajes_plan === planAntes + plan.mensajes_por_mes);
  const [suscripcion] = await sql`
    select estado, mensajes_asignados from suscripciones
     where user_id = ${alumno.id} and estado = 'activa'
  `;
  probar(
    "y abre la suscripción activa",
    suscripcion?.mensajes_asignados === plan.mensajes_por_mes,
    JSON.stringify(suscripcion)
  );

  // 9. Aviso y consulta al mismo tiempo
  const f = await nuevaOrden();
  const antesCarrera = (await saldo()).mensajes_recarga;
  const carrera = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      resultado(f, { origen: i % 2 ? "aviso" : "consulta" })
    )
  );
  const acreditaron = carrera.filter((x) => x === "acreditado").length;
  probar("8 avisos y consultas a la vez: acredita UNO solo", acreditaron === 1, carrera.join(","));
  probar("y el saldo sube una sola vez", (await saldo()).mensajes_recarga === antesCarrera + 167);
} catch (e) {
  errorOriginal("\nError:", e);
  fallos++;
} finally {
  console.error = errorOriginal;
  if (alumno) {
    await sql`delete from movimientos_credito where user_id = ${alumno.id}`;
    await sql`delete from suscripciones where user_id = ${alumno.id}`;
    await sql`delete from transacciones where user_id = ${alumno.id}`;
    await sql`delete from users where id = ${alumno.id}`;
  }
  await sql.end();
}

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nAcreditación correcta.");
