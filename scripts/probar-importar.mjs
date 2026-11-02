/**
 * La lectura de la lista de alumnos que manda el colegio
 * (src/lib/importar.ts), con el curso de la etapa 8: con encabezado se
 * reconoce cada columna por su nombre; sin encabezado, por lo que trae.
 *
 *   node scripts/probar-importar.mjs
 */
const { leerCsv, limpiarCurso, mismoNombre } = await import("../src/lib/importar.ts");

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

// Nombres y apellidos en columnas aparte (las listas del SIMAT): el usuario
// es el primer nombre y el primer apellido.
const apellidos = leerCsv("Apellidos;Nombres;Curso\nGómez Ruiz;Juan Pablo;9A");
revisar("apellidos aparte · nombre completo", fila(apellidos, 0).nombre === "Juan Pablo Gómez Ruiz", fila(apellidos, 0).nombre);
revisar("apellidos aparte · usuario", fila(apellidos, 0).username === "juan.gomez", fila(apellidos, 0).username);

// Excel convierte "11-2" en fecha si la celda no es texto: se avisa, no se carga un curso raro.
const fechas = leerCsv("Nombre;Curso\nAna Gómez;2-nov\nLuis Pérez;02/11/2026\nPedro Gil;46328\nEva Ruiz;11-2\nRaúl Mora;TRANSICION");
revisar("curso fecha · se rechazan", fechas.rechazadas.length === 3 && fechas.rechazadas.every((r) => /fecha/.test(r.motivo)), JSON.stringify(fechas.rechazadas));
revisar("curso fecha · 11-2 sigue siendo curso", fechas.filas.find((f) => f.nombre === "Eva Ruiz")?.curso === "11-2", JSON.stringify(fechas.filas));

// El mismo usuario con otro nombre: puede ser otro alumno.
revisar("mismoNombre · con y sin tildes", mismoNombre("Ana María Gómez", "ana maria gomez"));
revisar("mismoNombre · nombre más largo", mismoNombre("Ana Gómez", "Ana María Gómez Ruiz"));
revisar("mismoNombre · otra persona", !mismoNombre("Ana Gómez Ruiz", "Ana Gómez Pérez"));

// ---------------------------------------------------------------- Excel
const { leerExcel, crearExcel, aCsv, textoDeArchivo, esExcel } = await import("../src/lib/excel.ts");
const { readFileSync } = await import("node:fs");
const desde = (nombre) => readFileSync(new URL(`./fixtures/${nombre}`, import.meta.url));

// Un Excel como lo guarda Excel: textos compartidos, números, comprimido.
const excel = await leerExcel(desde("lista-excel.xlsx"));
revisar("excel · encabezado", excel[0]?.[0] === "Nombre completo" && excel[0]?.[2] === "Curso", JSON.stringify(excel[0]));
revisar("excel · documento como número sin decimales", excel[1]?.[1] === "1023456789", JSON.stringify(excel[1]));
revisar("excel · tildes", excel[1]?.[0] === "Sofía Rojas Díaz", excel[1]?.[0]);
revisar("excel · fila vacía en medio se conserva (números de fila)", excel[3]?.every((x) => !x) && excel[4]?.[0] === "Ana & María <Gómez>", JSON.stringify(excel.slice(3, 5)));
const deExcel = leerCsv(aCsv(excel));
revisar("excel → carga · 3 alumnos y la fecha rechazada", deExcel.filas.length === 3 && deExcel.rechazadas.length === 1 && deExcel.rechazadas[0].linea === 6, JSON.stringify(deExcel));
revisar("excel → carga · usuario del documento", deExcel.filas[0]?.username === "1023456789" && deExcel.filas[0]?.curso === "11-2" && deExcel.filas[0]?.nivel === "A2", JSON.stringify(deExcel.filas[0]));
revisar("excel → carga · caracteres especiales", deExcel.filas[2]?.nombre === "Ana & María <Gómez>", deExcel.filas[2]?.nombre);

// La hoja de alumnos aunque no sea la primera, con las columnas del SIMAT.
const simat = leerCsv(aCsv(await leerExcel(desde("lista-simat.xlsx"))));
revisar("simat · nombre completo", fila(simat, 0).nombre === "Juan Pablo Gómez Ruiz", fila(simat, 0).nombre);
revisar("simat · documento y grado", fila(simat, 0).username === "1001" && fila(simat, 0).curso === "9A", JSON.stringify(fila(simat, 0)));
revisar("simat · sin segundo nombre", fila(simat, 1).nombre === "Valentina Díaz", fila(simat, 1).nombre);

// La plantilla y las claves que escribe la app se vuelven a leer igual, con el PIN de cuatro cifras.
const libro = crearExcel([
  { nombre: "Alumnos", filas: [["Nombre completo", "Usuario o documento (opcional)", "Curso", "Nivel (opcional)"], ["Mateo Silva", "0457", "11-2", ""]], encabezado: true, comoTexto: true },
  { nombre: "Instrucciones", filas: [["Cómo llenar"]] },
]);
revisar("plantilla · es un xlsx", esExcel(libro), "");
const vuelta = await leerExcel(libro);
revisar("plantilla · se lee la hoja Alumnos", vuelta[0]?.[0] === "Nombre completo" && vuelta[1]?.[1] === "0457" && vuelta[1]?.[2] === "11-2", JSON.stringify(vuelta));

// Un CSV guardado por Excel en Windows (Windows-1252, no UTF-8).
const ansi = Uint8Array.from([...Buffer.from("Nombre;Curso\nSof"), 0xed, ...Buffer.from("a Rojas;9C")]);
revisar("csv de Excel en Windows · tildes", textoDeArchivo(ansi).includes("Sofía Rojas"), textoDeArchivo(ansi));
revisar("csv en UTF-8 · tildes", textoDeArchivo(Buffer.from("Sofía")) === "Sofía", textoDeArchivo(Buffer.from("Sofía")));

console.log(`${total - fallos}/${total} comprobaciones de la carga de alumnos bien.`);
process.exit(fallos ? 1 : 0);
