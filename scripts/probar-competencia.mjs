/**
 * La competencia semanal por salón sin base de datos
 * (src/lib/competencia/tabla.ts): quién aparece, el promedio, los
 * puestos, los empates, el ganador y lo que ve el alumno.
 *
 *   node scripts/probar-competencia.mjs
 */
const { tablaDeLaSemana, ganadores, salonDelAlumno, fraseDelSalon, minutosEnTexto, MINIMO_ALUMNOS } = await import(
  "../src/lib/competencia/tabla.ts"
);

let fallos = 0;
let total = 0;
function ok(nombre, condicion, detalle = "") {
  total++;
  if (!condicion) {
    fallos++;
    console.log(`  ✗ ${nombre}${detalle ? `: ${detalle}` : ""}`);
  }
}

/** Un salón con los minutos de cada alumno en la semana. */
const salon = (curso, ...minutos) => minutos.map((m) => ({ curso, segundos: m * 60 }));
const ver = (t) => t.map((s) => `${s.puesto}:${s.curso}:${s.minutos}`).join(" ");

// El promedio es entre TODOS los alumnos activos: el que no entró suma cero.
const a = tablaDeLaSemana([...salon("9A", 60, 60, 0, 0, 30), ...salon("9B", 20, 20, 20, 20, 20, 20)]);
ok("promedio con los que no entraron", ver(a.tabla) === "1:9A:30 2:9B:20", ver(a.tabla));
ok("alumnos por salón", a.tabla[0].alumnos === 5 && a.tabla[1].alumnos === 6);

// Un salón grande no gana por tener más alumnos.
const b = tablaDeLaSemana([...salon("10A", 10, 10, 10, 10, 10), ...salon("10B", ...Array(30).fill(9))]);
ok("el salón grande no gana por ser grande", b.tabla[0].curso === "10A", ver(b.tabla));

// Menos de 5 alumnos activos: no aparece.
const c = tablaDeLaSemana([...salon("9A", 5, 5, 5, 5, 5), ...salon("9B", 5, 5, 5, 5, 5), ...salon("9C", 99, 99, 99, 99)]);
ok(`un salón de ${MINIMO_ALUMNOS - 1} no aparece`, ver(c.tabla) === "1:9A:5 1:9B:5" && c.pequenos.join() === "9C", `${ver(c.tabla)} | ${c.pequenos}`);

// Un solo salón no compite con nadie.
const d = tablaDeLaSemana([...salon("9A", 5, 5, 5, 5, 5), ...salon("9B", 5)]);
ok("un solo salón: no hay competencia", d.tabla.length === 0 && d.pequenos.join() === "9B");
ok("sin alumnos", tablaDeLaSemana([]).tabla.length === 0);

// Empates: comparten el puesto y el siguiente se salta.
const e = tablaDeLaSemana([...salon("11A", 8, 8, 8, 8, 8), ...salon("9A", 8, 8, 8, 8, 8), ...salon("10A", 3, 3, 3, 3, 3)]);
ok("empate en el primer puesto", ver(e.tabla) === "1:9A:8 1:11A:8 3:10A:3", ver(e.tabla));
ok("dos ganadores si empatan", ganadores(e.tabla).map((s) => s.curso).join() === "9A,11A");

// Lo que se muestra es lo que ordena: 42,4 y 41,6 minutos son 42 los dos.
const f = tablaDeLaSemana([
  ...[42.4, 42.4, 42.4, 42.4, 42.4].map((m) => ({ curso: "9A", segundos: m * 60 })),
  ...[41.6, 41.6, 41.6, 41.6, 41.6].map((m) => ({ curso: "9B", segundos: m * 60 })),
]);
ok("redondeado al minuto", ver(f.tabla) === "1:9A:42 1:9B:42", ver(f.tabla));

// Nadie gana una semana en la que nadie practicó.
const g = tablaDeLaSemana([...salon("9A", 0, 0, 0, 0, 0), ...salon("9B", 0, 0, 0, 0, 0)]);
ok("semana en cero: sin ganador", ganadores(g.tabla).length === 0);
ok("cursos con espacios", tablaDeLaSemana([...salon(" 9A ", 1, 1, 1, 1, 1), ...salon("9B", 1, 1, 1, 1, 1)]).tabla.some((s) => s.curso === "9A"));

// Lo que ve el alumno.
const seis = tablaDeLaSemana([
  ...salon("9A", 50, 50, 50, 50, 50),
  ...salon("9B", 42, 42, 42, 42, 42),
  ...salon("9C", 30, 30, 30, 30, 30),
  ...salon("10A", 20, 20, 20, 20, 20),
  ...salon("10B", 10, 10, 10, 10, 10),
  ...salon("11A", 1, 1, 1, 1, 1),
]);
const pasada = tablaDeLaSemana([...salon("9A", 9, 9, 9, 9, 9), ...salon("9B", 12, 12, 12, 12, 12)]);
const yo = salonDelAlumno("9B", seis, pasada, "2026-10-05");
ok("tarjeta: puesto y total", yo && yo.puesto === 2 && yo.de === 6 && yo.minutos === 42, JSON.stringify(yo));
ok("tarjeta: la frase del documento", fraseDelSalon(yo) === "Tu salón 9B va 2.º de 6 esta semana · 42 minutos por alumno", fraseDelSalon(yo));
ok("tarjeta: los tres primeros", yo.primeros.map((s) => s.curso).join() === "9A,9B,9C");
ok("tarjeta: ganó la semana pasada", yo.gano?.lunes === "2026-10-05" && yo.gano.minutos === 12, JSON.stringify(yo.gano));
ok("tarjeta: no ganó", salonDelAlumno("9A", seis, pasada, "2026-10-05").gano === null);
ok("tarjeta: sin curso", salonDelAlumno(null, seis, pasada, "2026-10-05") === null && salonDelAlumno("  ", seis, pasada, "x") === null);
ok("tarjeta: salón pequeño", salonDelAlumno("9C", c, pasada, "x") === null);
ok("tarjeta: un minuto", fraseDelSalon(salonDelAlumno("11A", seis, pasada, "x")).endsWith("· 1 minuto por alumno"));
const lunes = salonDelAlumno("9A", g, pasada, "x");
ok("tarjeta: el lunes temprano", lunes.empieza && fraseDelSalon(lunes) === "Tu salón 9A compite con 1 salón esta semana", fraseDelSalon(lunes));
ok("minutos en texto", minutosEnTexto(0) === "0 minutos" && minutosEnTexto(1) === "1 minuto");

console.log(`${total - fallos}/${total} comprobaciones de la competencia bien.`);
process.exit(fallos ? 1 : 0);
