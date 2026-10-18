/**
 * Reportes de correcciones (src/lib/reportes.ts, db/023), contra la base.
 *
 * Lo que no puede fallar:
 *   · un alumno solo reporta correcciones de SUS mensajes;
 *   · la misma corrección no se reporta dos veces;
 *   · "Allison se equivocó" devuelve exactamente 1 intervención, una
 *     sola vez aunque se decida dos veces, y deja rastro en el libro;
 *   · "la corrección era buena" no devuelve nada;
 *   · el aviso sale una vez y desaparece al marcarlo visto.
 *
 * Crea dos alumnos de prueba y los borra al terminar.
 *
 *   node --env-file=.env scripts/probar-reportes.mjs
 */
const r = await import("../src/lib/reportes.ts");
const { sql } = await import("../src/lib/db.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};

const marca = Date.now();
const ids = [];
try {
  const crear = async (n) => {
    const [u] = await sql`
      insert into users (tipo_acceso, email, nombre, nivel)
      values ('email', ${`reportes-${n}-${marca}@ejemplo.co`}, ${`Alumno reportes ${n}`}, 'A1')
      returning id`;
    ids.push(u.id);
    await sql`insert into saldos (user_id, mensajes_recarga) values (${u.id}, 3)`;
    return u.id;
  };
  const alumno = await crear(1);
  const otro = await crear(2);

  const [conv] = await sql`
    insert into conversaciones (user_id, nivel_al_iniciar) values (${alumno}, 'A1') returning id`;
  const correcciones = [
    { tipo: "gramatica", original: "I has", correccion: "I have", explicacion: "Use have with I.", prioridad: "alta", tema: "verbos" },
    { tipo: "vocabulario", original: "big", correccion: "large", explicacion: "More formal.", prioridad: "baja", tema: "naturalidad" },
  ];
  const [m] = await sql`
    insert into mensajes (conversacion_id, user_id, rol, texto, correcciones)
    values (${conv.id}, ${alumno}, 'alumno', 'I has a big dog', ${sql.json(correcciones)})
    returning id`;
  await sql`
    insert into mensajes (conversacion_id, user_id, rol, texto, correcciones)
    values (${conv.id}, ${alumno}, 'allison', 'Nice! What is his name?', '[]')`;

  const ajeno = await r.crearReporte(otro, m.id, 0, null);
  probar("otro alumno no puede reportar un mensaje ajeno", ajeno.estado === "no_encontrado", ajeno.estado);

  const fuera = await r.crearReporte(alumno, m.id, 9, null);
  probar("un índice que no existe no crea nada", fuera.estado === "no_encontrado", fuera.estado);

  const a = await r.crearReporte(alumno, m.id, 0, "I think it's fine");
  probar("crea el reporte de la corrección 0", a.estado === "creado", a.estado);
  const b = await r.crearReporte(alumno, m.id, 0, null);
  probar("la misma corrección no se reporta dos veces", b.estado === "repetido", b.estado);
  const c = await r.crearReporte(alumno, m.id, 1, null);
  probar("otra corrección del mismo mensaje sí se reporta", c.estado === "creado", c.estado);

  const [copia] = await sql`select * from reportes_correccion where id = ${a.id}`;
  probar("copia la corrección y la respuesta de Allison",
    copia.original === "I has" && copia.correccion === "I have" && copia.respuesta_allison === "Nice! What is his name?",
    JSON.stringify({ o: copia.original, r: copia.respuesta_allison }));

  const reportadas = await r.correccionesReportadas(alumno, [m.id]);
  probar("sabe qué correcciones ya reportó", reportadas.sort().join(",") === `${m.id}:0,${m.id}:1`, reportadas.join(","));

  const admin = alumno; // cualquier uuid de usuario sirve como revisor en la prueba
  const saldo = async () => (await sql`select mensajes_recarga from saldos where user_id = ${alumno}`)[0].mensajes_recarga;

  const antes = await saldo();
  probar("resolver: Allison se equivocó", await r.resolverReporte(a.id, admin, "allison_se_equivoco") === true);
  probar("devuelve exactamente 1 intervención", (await saldo()) === antes + 1, `${antes} -> ${await saldo()}`);
  probar("decidir dos veces no devuelve dos veces", await r.resolverReporte(a.id, admin, "allison_se_equivoco") === false);
  probar("el saldo sigue igual tras el segundo intento", (await saldo()) === antes + 1);

  const [libro] = await sql`
    select tipo, cantidad, nota from movimientos_credito
     where user_id = ${alumno} and nota = 'Devolución por corrección equivocada'`;
  probar("queda en el libro como devolución", libro?.tipo === "reverso" && libro?.cantidad === 1, JSON.stringify(libro));

  probar("resolver: la corrección era buena", await r.resolverReporte(c.id, admin, "correccion_buena") === true);
  probar("la corrección buena no devuelve nada", (await saldo()) === antes + 1);

  const avisos = await r.avisosPendientes(alumno);
  probar("el alumno tiene dos avisos", avisos.length === 2, String(avisos.length));
  await r.marcarAvisosVistos(otro, avisos.map((x) => x.id));
  probar("otro alumno no puede marcar sus avisos", (await r.avisosPendientes(alumno)).length === 2);
  await r.marcarAvisosVistos(alumno, avisos.map((x) => x.id));
  probar("al marcarlos vistos ya no salen", (await r.avisosPendientes(alumno)).length === 0);

  await sql`delete from mensajes where id = ${m.id}`;
  const [sigue] = await sql`select mensaje_id from reportes_correccion where id = ${a.id}`;
  probar("el reporte sobrevive al borrado del mensaje", sigue && sigue.mensaje_id === null);
} finally {
  if (ids.length) {
    await sql`delete from movimientos_credito where user_id = any(${ids}::uuid[])`;
    await sql`delete from users where id = any(${ids}::uuid[])`;
  }
  await sql.end();
}

console.log(fallos ? `\n${fallos} prueba(s) fallaron.` : "\nReportes correctos.");
process.exit(fallos ? 1 : 0);
