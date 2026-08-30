/**
 * La lógica del ascenso de nivel, en seco.
 *
 * Un umbral corrido aquí es un alumno al que se le sugiere un nivel
 * que le queda grande — y vuelve frustrado. Casos de borde exactos.
 *
 *   node scripts/probar-ascenso.mjs
 */
import { ASCENSO, evaluarAscenso, siguienteNivel } from "../src/lib/ascenso.ts";

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  if (ok) console.log(`  ok    ${nombre}`);
  else {
    fallos++;
    console.error(`  FALLO ${nombre}${detalle ? ` -- ${detalle}` : ""}`);
  }
};

console.log("Ascenso de nivel:");

probar("después de A1 viene A2", siguienteNivel("A1") === "A2");
probar("después de B2 viene C1", siguienteNivel("B2") === "C1");
probar("C2 no tiene siguiente", siguienteNivel("C2") === null);

const sin = { unidadesCompletadas: 0, turnosRecientes: 0, correccionesRecientes: 0 };
probar("sin señales no se sugiere", evaluarAscenso(sin) === null);

probar(
  "7 unidades completadas bastan (camino de lecciones)",
  evaluarAscenso({ ...sin, unidadesCompletadas: ASCENSO.unidadesNecesarias }) !== null
);
probar(
  "6 unidades no bastan",
  evaluarAscenso({ ...sin, unidadesCompletadas: ASCENSO.unidadesNecesarias - 1 }) === null
);

probar(
  "25 turnos con 5 correcciones bastan (borde exacto del camino libre)",
  evaluarAscenso({ ...sin, turnosRecientes: 25, correccionesRecientes: 5 }) !== null
);
probar(
  "25 turnos con 6 correcciones no bastan",
  evaluarAscenso({ ...sin, turnosRecientes: 25, correccionesRecientes: 6 }) === null
);
probar(
  "24 turnos perfectos no bastan: la muestra es corta",
  evaluarAscenso({ ...sin, turnosRecientes: 24, correccionesRecientes: 0 }) === null
);
probar(
  "30 turnos con 3 correcciones bastan",
  evaluarAscenso({ ...sin, turnosRecientes: 30, correccionesRecientes: 3 }) !== null
);
probar(
  "30 turnos con 10 correcciones no bastan",
  evaluarAscenso({ ...sin, turnosRecientes: 30, correccionesRecientes: 10 }) === null
);

const razon = evaluarAscenso({ ...sin, unidadesCompletadas: 8 });
probar(
  "la razón se lee como mérito del alumno",
  typeof razon === "string" && razon.includes("8 de 10"),
  String(razon)
);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nLógica de ascenso correcta.");
