/**
 * La lectura de la lista de alumnos que manda el colegio
 * (src/lib/importar.ts), con el curso de la etapa 8: con encabezado se
 * reconoce cada columna por su nombre; sin encabezado, por lo que trae.
 *
 *   node scripts/probar-importar.mjs
 */
const { leerCsv, limpiarCurso } = await import("../src/lib/importar.ts");

let fallos = 0;
let total = 0;
function revisar(nombre, ok, detalle) {
  total++;
  if (!ok) {
    fallos++;
    console.log(`  ✗ ${nombre}: ${detalle}`);
  }
}
const fila = (l, i) => l.filas[i] ?? {};

// Con encabezado y en cualquier orden.
const conCabecera = leerCsv("Curso;Nombre;Nivel;Usuario\n9C;Mateo Silva;A1;msilva\n9 c;Sofía Rojas;;\n9C;Tomás Vega;A7;tvega");
revisar("encabezado · curso", fila(conCabecera, 0).curso === "9C", JSON.stringify(fila(conCabecera, 0)));
revisar("encabezado · usuario propio", fila(conCabecera, 0).username === "msilva", fila(conCabecera, 0).username);
revisar("encabezado · curso con espacio", fila(conCabecera, 1).curso === "9C", fila(conCabecera, 1).curso);
revisar("encabezado · sin usuario lo forma", fila(conCabecera, 1).username === "sofia.rojas", fila(conCabecera, 1).username);
revisar("encabezado · sin nivel queda A1", fila(conCabecera, 1).nivel === "A1", fila(conCabecera, 1).nivel);
revisar("encabezado · nivel que no existe se rechaza", conCabecera.rechazadas.length === 1 && /A7/.test(conCabecera.rechazadas[0].motivo), JSON.stringify(conCabecera.rechazadas));

// Sin encabezado: el nivel, el curso y el usuario se reconocen por cómo son.
const sinCabecera = leerCsv("Camila Díaz;cdiaz;9B\nAna María Gómez;A2;10A\nLuis Pérez;1023456789\nPedro Gil;11-2;B1");
revisar("sin encabezado · curso", fila(sinCabecera, 0).curso === "9B" && fila(sinCabecera, 0).username === "cdiaz", JSON.stringify(fila(sinCabecera, 0)));
revisar("sin encabezado · nivel y curso", fila(sinCabecera, 1).nivel === "A2" && fila(sinCabecera, 1).curso === "10A", JSON.stringify(fila(sinCabecera, 1)));
revisar("sin encabezado · el documento es usuario, no curso", fila(sinCabecera, 2).username === "1023456789" && fila(sinCabecera, 2).curso === null, JSON.stringify(fila(sinCabecera, 2)));
revisar("sin encabezado · curso con guion", fila(sinCabecera, 3).curso === "11-2" && fila(sinCabecera, 3).nivel === "B1", JSON.stringify(fila(sinCabecera, 3)));

// El formato de antes (nombre, nivel, usuario) sigue sirviendo.
const viejo = leerCsv("nombre,nivel,usuario\nPedro Gil,B1,pgil\nPedro Gil,B1");
revisar("formato viejo · usuario", fila(viejo, 0).username === "pgil" && fila(viejo, 0).nivel === "B1", JSON.stringify(fila(viejo, 0)));
revisar("formato viejo · repetido se numera", fila(viejo, 1).username === "pedro.gil", fila(viejo, 1).username);

revisar("limpiarCurso", limpiarCurso(" 9 a ") === "9A" && limpiarCurso("") === null, `${limpiarCurso(" 9 a ")} ${limpiarCurso("")}`);

console.log(`${total - fallos}/${total} comprobaciones de la carga de alumnos bien.`);
process.exit(fallos ? 1 : 0);
