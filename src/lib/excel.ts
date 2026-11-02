/**
 * Archivos de Excel (.xlsx) sin librerías: un .xlsx es un ZIP con hojas en
 * XML. Lo usa la carga masiva de alumnos, que trabaja con listas hechas
 * en Excel por una secretaría:
 *
 * - leer la hoja de alumnos que suben, tal como la guardó Excel (sin
 *   tener que "Guardar como CSV");
 * - escribir la plantilla, con las columnas en formato texto para que
 *   Excel no convierta "11-2" en una fecha ni le quite los ceros a un
 *   documento;
 * - escribir las claves, con el PIN como texto ("0457", no 457).
 *
 * Corre en el navegador y en Node (las pruebas): solo usa
 * DecompressionStream, TextEncoder y TextDecoder.
 */

// ---------------------------------------------------------------- ZIP

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const FIN = 0x06054b50;

/** Los archivos del ZIP, por nombre. */
async function abrirZip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let fin = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65_535); i--) {
    if (v.getUint32(i, true) === FIN) {
      fin = i;
      break;
    }
  }
  if (fin < 0) throw new Error("No es un archivo de Excel (.xlsx)");
  const cuantos = v.getUint16(fin + 10, true);
  let p = v.getUint32(fin + 16, true);
  const nombres = new TextDecoder();
  const archivos = new Map<string, Uint8Array>();
  for (let n = 0; n < cuantos; n++) {
    if (v.getUint32(p, true) !== CENTRAL) throw new Error("El archivo de Excel está dañado");
    const metodo = v.getUint16(p + 10, true);
    const tamano = v.getUint32(p + 20, true);
    const largoNombre = v.getUint16(p + 28, true);
    const largoExtra = v.getUint16(p + 30, true);
    const largoComentario = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const nombre = nombres.decode(bytes.subarray(p + 46, p + 46 + largoNombre));
    p += 46 + largoNombre + largoExtra + largoComentario;

    if (v.getUint32(local, true) !== LOCAL) throw new Error("El archivo de Excel está dañado");
    const inicio = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const datos = bytes.subarray(inicio, inicio + tamano);
    if (metodo === 0) archivos.set(nombre, datos);
    else if (metodo === 8) archivos.set(nombre, await inflar(datos));
  }
  return archivos;
}

async function inflar(datos: Uint8Array): Promise<Uint8Array> {
  const flujo = new Blob([datos as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

let tablaCrc: Uint32Array | null = null;
function crc32(datos: Uint8Array): number {
  if (!tablaCrc) {
    tablaCrc = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tablaCrc[i] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (const b of datos) c = tablaCrc[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Un ZIP sin comprimir: las hojas de una plantilla pesan unos pocos KB. */
function armarZip(archivos: [string, string][]): Uint8Array {
  const cod = new TextEncoder();
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let desplazamiento = 0;
  for (const [nombre, texto] of archivos) {
    const n = cod.encode(nombre);
    const datos = cod.encode(texto);
    const crc = crc32(datos);
    const cabeza = new DataView(new ArrayBuffer(30));
    cabeza.setUint32(0, LOCAL, true);
    cabeza.setUint16(4, 20, true);
    cabeza.setUint16(6, 0x0800, true); // nombres en UTF-8
    cabeza.setUint16(8, 0, true); // sin comprimir
    cabeza.setUint16(12, 0x21, true); // 1 de enero de 1980
    cabeza.setUint32(14, crc, true);
    cabeza.setUint32(18, datos.length, true);
    cabeza.setUint32(22, datos.length, true);
    cabeza.setUint16(26, n.length, true);
    partes.push(new Uint8Array(cabeza.buffer), n, datos);

    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, CENTRAL, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(14, 0x21, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, datos.length, true);
    c.setUint32(24, datos.length, true);
    c.setUint16(28, n.length, true);
    c.setUint32(42, desplazamiento, true);
    central.push(new Uint8Array(c.buffer), n);
    desplazamiento += 30 + n.length + datos.length;
  }
  const tamanoCentral = central.reduce((s, x) => s + x.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, FIN, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamanoCentral, true);
  fin.setUint32(16, desplazamiento, true);
  const todo = [...partes, ...central, new Uint8Array(fin.buffer)];
  const salida = new Uint8Array(todo.reduce((s, x) => s + x.length, 0));
  let i = 0;
  for (const x of todo) {
    salida.set(x, i);
    i += x.length;
  }
  return salida;
}

// ---------------------------------------------------------------- XML

const desescapar = (t: string) =>
  t.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    const l = e.toLowerCase();
    if (l === "amp") return "&";
    if (l === "lt") return "<";
    if (l === "gt") return ">";
    if (l === "quot") return '"';
    if (l === "apos") return "'";
    return String.fromCodePoint(l.startsWith("#x") ? parseInt(l.slice(2), 16) : parseInt(l.slice(1), 10));
  });

const escapar = (t: string) =>
  t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Caracteres de control que el XML no admite.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

/** El texto de todos los <t> de un trozo de XML (una celda o un texto compartido con formato), sin la guía fonética. */
const textos = (xml: string) => [...xml.replace(/<(?:\w+:)?rPh\b[\s\S]*?<\/(?:\w+:)?rPh>/g, "").matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((m) => desescapar(m[1])).join("");

/** "AB" → 27 (desde 0). */
function columna(ref: string): number {
  let n = 0;
  for (const c of ref.replace(/\d+$/, "").toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/** Un número de Excel como lo escribiría una persona: 1023456789, no 1023456789.0 ni 1.023456789E9. */
function numero(v: string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return Number.isInteger(n) ? BigInt(Math.round(n)).toString() : String(n);
}

// ---------------------------------------------------------------- Leer

/**
 * Las filas de la hoja de alumnos: la que se llama "Alumnos" o, si no hay,
 * la primera. Cada fila es la lista de sus celdas como texto.
 */
export async function leerExcel(datos: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const zip = await abrirZip(datos instanceof Uint8Array ? datos : new Uint8Array(datos));
  const texto = (nombre: string) => {
    const b = zip.get(nombre);
    return b ? new TextDecoder().decode(b) : "";
  };

  const compartidos = [...texto("xl/sharedStrings.xml").matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)].map((m) => textos(m[1]));

  // Qué hoja: el libro dice el nombre de cada una y su archivo.
  const relaciones = new Map(
    [...texto("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*>/g)].map((m) => {
      const id = /\bId="([^"]+)"/.exec(m[0])?.[1] ?? "";
      const destino = /\bTarget="([^"]+)"/.exec(m[0])?.[1] ?? "";
      return [id, destino.replace(/^\/?xl\//, "").replace(/^\//, "")];
    })
  );
  const hojas = [...texto("xl/workbook.xml").matchAll(/<(?:\w+:)?sheet\b[^>]*>/g)].map((m) => ({
    nombre: desescapar(/\bname="([^"]*)"/.exec(m[0])?.[1] ?? ""),
    archivo: relaciones.get(/\br:id="([^"]+)"/.exec(m[0])?.[1] ?? "") ?? "",
  }));
  const elegida = hojas.find((h) => /alumno|estudiante/i.test(h.nombre)) ?? hojas[0];
  const ruta = elegida?.archivo ? `xl/${elegida.archivo}` : [...zip.keys()].find((k) => /^xl\/worksheets\/sheet\d*\.xml$/.test(k));
  const hoja = ruta ? texto(ruta) : "";
  if (!hoja) throw new Error("El archivo de Excel no tiene hojas");

  const filas: string[][] = [];
  for (const f of hoja.matchAll(/<(?:\w+:)?row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?row>)/g)) {
    // Excel no guarda las filas vacías: se rellenan para que el número de
    // línea de un error sea el de la fila en Excel.
    const r = Number(/\br="(\d+)"/.exec(f[1])?.[1]);
    while (r && filas.length < r - 1) filas.push([]);
    const celdas: string[] = [];
    let siguiente = 0;
    for (const c of (f[2] ?? "").matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
      const atributos = c[1];
      const dentro = c[2] ?? "";
      const ref = /\br="([A-Z]+\d+)"/i.exec(atributos)?.[1];
      const i = ref ? columna(ref) : siguiente;
      siguiente = i + 1;
      const tipo = /\bt="(\w+)"/.exec(atributos)?.[1];
      const v = /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(dentro)?.[1];
      let valor = "";
      if (tipo === "s") valor = compartidos[Number(v)] ?? "";
      else if (tipo === "inlineStr") valor = textos(dentro);
      else if (tipo === "str" || tipo === "e") valor = desescapar(v ?? "");
      else if (tipo === "b") valor = v === "1" ? "VERDADERO" : "FALSO";
      else if (v !== undefined) valor = numero(desescapar(v));
      celdas[i] = valor.trim();
    }
    filas.push(Array.from(celdas, (x) => x ?? ""));
  }
  // Sin las filas vacías del final (Excel guarda las que tuvieron formato).
  while (filas.length && filas[filas.length - 1].every((x) => !x)) filas.pop();
  return filas;
}

/** Las filas como el CSV que lee la carga: punto y coma, y comillas solo si hacen falta. */
export function aCsv(filas: string[][]): string {
  const campo = (x: string) => (/[;"\r\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x);
  return filas.map((f) => f.map(campo).join(";")).join("\r\n");
}

// ---------------------------------------------------------------- Escribir

export interface Hoja {
  nombre: string;
  filas: string[][];
  /** Ancho de cada columna, en caracteres. */
  anchos?: number[];
  /** La primera fila en negrilla y fija al bajar. */
  encabezado?: boolean;
  /** Columnas en formato texto, también las celdas vacías que se llenen después. */
  comoTexto?: boolean;
}

/** Un libro de Excel con estas hojas. Todas las celdas se escriben como texto. */
export function crearExcel(hojas: Hoja[]): Uint8Array {
  const ESTILO_TEXTO = 1;
  const ESTILO_ENCABEZADO = 2;
  const ref = (fila: number, col: number) => {
    let letras = "";
    for (let n = col + 1; n > 0; n = Math.floor((n - 1) / 26)) letras = String.fromCharCode(65 + ((n - 1) % 26)) + letras;
    return `${letras}${fila + 1}`;
  };

  const hojaXml = (h: Hoja) => {
    const columnas = Math.max(h.anchos?.length ?? 0, ...h.filas.map((f) => f.length), 1);
    const cols = Array.from({ length: columnas }, (_, i) => {
      const ancho = h.anchos?.[i] ?? 18;
      return `<col min="${i + 1}" max="${i + 1}" width="${ancho}" customWidth="1"${h.comoTexto ? ` style="${ESTILO_TEXTO}"` : ""}/>`;
    }).join("");
    const filas = h.filas
      .map((f, i) => {
        const estilo = h.encabezado && i === 0 ? ESTILO_ENCABEZADO : h.comoTexto ? ESTILO_TEXTO : 0;
        const celdas = f
          .map((x, j) => `<c r="${ref(i, j)}" t="inlineStr"${estilo ? ` s="${estilo}"` : ""}><is><t xml:space="preserve">${escapar(x)}</t></is></c>`)
          .join("");
        return `<row r="${i + 1}">${celdas}</row>`;
      })
      .join("");
    const fija = h.encabezado
      ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
      : "";
    return (
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `${fija}<cols>${cols}</cols><sheetData>${filas}</sheetData></worksheet>`
    );
  };

  const nombre = (t: string) => escapar(t.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
  const archivos: [string, string][] = [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        hojas
          .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
          .join("") +
        `</Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>${hojas.map((h, i) => `<sheet name="${nombre(h.nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
        `</workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        hojas
          .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
          .join("") +
        `<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    ],
    [
      "xl/styles.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
        `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
        `<fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF7"/><bgColor indexed="64"/></patternFill></fill></fills>` +
        `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
        `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
        `<cellXfs count="3">` +
        `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
        `<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
        `<xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>` +
        `</cellXfs>` +
        `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
        `</styleSheet>`,
    ],
    ...hojas.map((h, i) => [`xl/worksheets/sheet${i + 1}.xml`, hojaXml(h)] as [string, string]),
  ];
  return armarZip(archivos);
}

/** Descarga un libro de Excel en el navegador. */
export function descargarExcel(nombreArchivo: string, hojas: Hoja[]) {
  const blob = new Blob([crearExcel(hojas) as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * El texto de un archivo de texto (CSV), en la codificación que tenga:
 * Excel en Windows guarda el "CSV (delimitado por comas)" en Windows-1252,
 * no en UTF-8, y leído como UTF-8 "Sofía" llegaba como "Sof�a".
 */
export function textoDeArchivo(datos: ArrayBuffer | Uint8Array): string {
  const bytes = datos instanceof Uint8Array ? datos : new Uint8Array(datos);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** ¿Es un .xlsx? Todo ZIP empieza por "PK". */
export const esExcel = (datos: ArrayBuffer | Uint8Array) => {
  const b = datos instanceof Uint8Array ? datos : new Uint8Array(datos);
  return b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4;
};
