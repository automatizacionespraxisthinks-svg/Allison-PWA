/**
 * Pruebas de concurrencia y de fallos.
 *
 * Lo anterior se probaba en secuencia, que es el caso fácil. Aquí se
 * lanzan las operaciones EN PARALELO, que es como llegan de verdad
 * cuando un alumno tiene dos pestañas abiertas o la red le hace
 * reintentar.
 *
 *   node --env-file=.env scripts/probar-concurrencia.mjs
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 20, onnotice: () => {} });

let fallos = 0;
const verificar = (d, ok, extra = "") => {
  console.log(`  ${ok ? "OK   " : "FALLA"}  ${d}${extra ? `  ${extra}` : ""}`);
  if (!ok) fallos++;
};

const crearAlumno = async (plan, recarga) => {
  const [u] = await sql`
    insert into users (tipo_acceso, email, nombre, nivel)
    values ('email', ${`conc-${Date.now()}-${Math.random()}@ejemplo.co`}, 'Concurrencia', 'A2')
    returning id`;
  await sql`insert into saldos (user_id, mensajes_plan, mensajes_recarga)
            values (${u.id}, ${plan}, ${recarga})`;
  return u.id;
};

const limpiar = async (id) => {
  await sql`delete from movimientos_credito where user_id = ${id}`;
  await sql`delete from transacciones where user_id = ${id}`;
  await sql`delete from saldos where user_id = ${id}`;
  await sql`delete from users where id = ${id}`;
};

try {
  // ---------------------------------------------------------------
  console.log("\n20 CONSUMOS EN PARALELO CON SALDO PARA 5");
  {
    const id = await crearAlumno(0, 5);
    const r = await Promise.all(
      Array.from({ length: 20 }, () => sql`select consumir_mensaje(${id}, null)`)
    );
    const cobrados = r.filter((x) => x[0].consumir_mensaje !== null).length;
    const [s] = await sql`select mensajes_recarga from saldos where user_id = ${id}`;
    const [m] = await sql`
      select count(*)::int n from movimientos_credito
       where user_id = ${id} and tipo = 'consumo'`;

    verificar("solo 5 de 20 consiguen mensaje", cobrados === 5, `(cobrados: ${cobrados})`);
    verificar("el saldo queda exactamente en 0", s.mensajes_recarga === 0);
    verificar("hay exactamente 5 consumos en el libro", m.n === 5, `(${m.n})`);
    await limpiar(id);
  }

  // ---------------------------------------------------------------
  console.log("\nLA BOLSA QUE SE INFORMA ES LA QUE SE COBRÓ");
  {
    // 1 de plan y 5 de recarga: en paralelo, uno solo debe llevarse el
    // del plan y los demás el de recarga.
    const id = await crearAlumno(1, 5);
    const r = await Promise.all(
      Array.from({ length: 6 }, () => sql`select consumir_mensaje(${id}, null)`)
    );
    const bolsas = r.map((x) => x[0].consumir_mensaje).filter(Boolean);
    const dePlan = bolsas.filter((b) => b === "plan").length;

    const libro = await sql`
      select bolsa from movimientos_credito
       where user_id = ${id} and tipo = 'consumo'`;
    const planEnLibro = libro.filter((f) => f.bolsa === "plan").length;

    verificar("solo uno cobra del plan", dePlan === 1, `(${dePlan})`);
    verificar(
      "lo informado coincide con el libro",
      dePlan === planEnLibro,
      `(informado ${dePlan}, libro ${planEnLibro})`
    );
    await limpiar(id);
  }

  // ---------------------------------------------------------------
  console.log("\nDEVOLUCIÓN A LA BOLSA CORRECTA");
  {
    const id = await crearAlumno(1, 1);
    const [{ consumir_mensaje: b1 }] = await sql`select consumir_mensaje(${id}, null)`;
    const [{ consumir_mensaje: b2 }] = await sql`select consumir_mensaje(${id}, null)`;
    // b1 = plan, b2 = recarga. Se devuelve el segundo.
    await sql`select devolver_mensaje(${id}, ${b2}::bolsa_credito)`;
    const [s] = await sql`select mensajes_plan, mensajes_recarga from saldos where user_id = ${id}`;

    verificar("el primero cobró del plan y el segundo de la recarga",
      b1 === "plan" && b2 === "recarga");
    verificar("la devolución vuelve a la recarga, no al plan",
      s.mensajes_plan === 0 && s.mensajes_recarga === 1,
      `(plan=${s.mensajes_plan} recarga=${s.mensajes_recarga})`);
    await limpiar(id);
  }

  // ---------------------------------------------------------------
  console.log("\n10 AVISOS DE PAGO SIMULTÁNEOS DE LA MISMA TRANSACCIÓN");
  {
    const id = await crearAlumno(0, 0);
    const [t] = await sql`
      insert into transacciones
        (user_id, tipo, monto_cop, mensajes_otorgados, pasarela, referencia_externa, estado)
      values (${id}, 'recarga', 20000, 220, 'simulada', ${`CONC-${Date.now()}`}, 'pendiente')
      returning id`;

    const r = await Promise.all(
      Array.from({ length: 10 }, () => sql`select acreditar_transaccion(${t.id})`)
    );
    const acreditados = r.filter((x) => x[0].acreditar_transaccion === true).length;
    const [s] = await sql`select mensajes_recarga from saldos where user_id = ${id}`;
    const [m] = await sql`
      select count(*)::int n from movimientos_credito
       where user_id = ${id} and tipo = 'recarga'`;

    verificar("solo uno de los 10 acredita", acreditados === 1, `(${acreditados})`);
    verificar("se abonan 220 mensajes, no 2200", s.mensajes_recarga === 220, `(${s.mensajes_recarga})`);
    verificar("hay un solo movimiento de recarga", m.n === 1, `(${m.n})`);
    await limpiar(id);
  }

  // ---------------------------------------------------------------
  console.log("\nCANJE SIMULTÁNEO DEL MISMO ENLACE DE VERIFICACIÓN");
  {
    const id = await crearAlumno(0, 5);
    const token = `tok-${Date.now()}`;
    await sql`
      insert into verificaciones_correo (token_hash, user_id, correo, expira_en)
      values (${token}, ${id}, 'x@y.co', now() + interval '1 hour')`;

    const r = await Promise.all(
      Array.from({ length: 8 }, () => sql`select verificar_correo(${token}, 15)`)
    );
    const canjeados = r.filter((x) => x[0].verificar_correo !== null).length;
    const [s] = await sql`select mensajes_recarga from saldos where user_id = ${id}`;

    verificar("solo un canje prospera", canjeados === 1, `(${canjeados})`);
    verificar("se abonan 15 mensajes, no 120", s.mensajes_recarga === 20, `(${s.mensajes_recarga})`);
    await sql`delete from verificaciones_correo where user_id = ${id}`;
    await limpiar(id);
  }

  console.log(
    fallos === 0 ? "\nTodas las pruebas pasaron.\n" : `\n${fallos} fallaron.\n`
  );
  process.exitCode = fallos === 0 ? 0 : 1;
} catch (e) {
  console.error("\nError:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
