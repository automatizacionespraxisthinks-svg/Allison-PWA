import type { Nivel } from "./tipos";

/**
 * Lectura de la lista de alumnos que manda el colegio.
 *
 * Pensado para archivos hechos en Excel por una secretaría, no por un
 * programador: acepta punto y coma o coma como separador (Excel en
 * español usa punto y coma), tolera la marca invisible del inicio de
 * archivo, comillas, espacios de más y tildes.
 */

const NIVELES_VALIDOS: Nivel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface FilaImportada {
  linea: number;
  nombre: string;
  username: string;
  nivel: Nivel;
  /** El curso (9A, 10B…), o null si el archivo no lo trae. */
  curso: string | null;
}

/** "9A", "10B", "11-2", "9 A", "6°1": así escriben los cursos los colegios. */
const PARECE_CURSO = /^\d{1,2}\s*[-°º]?\s*[a-z0-9]{0,2}$/i;

/** El curso como se guarda: sin espacios y en mayúscula ("9 a" → "9A"). */
export function limpiarCurso(valor: string): string | null {
  const c = valor.replace(/\s+/g, "").toUpperCase().slice(0, 12);
  return c || null;
}

export interface FilaRechazada {
  linea: number;
  contenido: string;
  motivo: string;
}

export interface Lectura {
  filas: FilaImportada[];
  rechazadas: FilaRechazada[];
  separador: string;
}

/**
 * Convierte un nombre en usuario: primer nombre + último apellido.
 *
 * No las dos primeras palabras: en Colombia lo normal es tener dos
 * nombres de pila, y "Ana María Gómez" quedaría como "ana.maria",
 * sin apellido y chocando con cualquier otra Ana María.
 */
function aUsuario(nombre: string): string {
  const palabras = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (palabras.length === 0) return "";
  if (palabras.length === 1) return palabras[0];
  return `${palabras[0]}.${palabras[palabras.length - 1]}`;
}

/**
 * Limpia un usuario que ya viene del colegio.
 *
 * A diferencia del nombre, aquí el punto y el guion SE CONSERVAN: son
 * parte del usuario que el colegio ya usa en sus sistemas.
 */
function limpiarUsuario(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 30);
}

/** Excel en español separa con ";", el resto del mundo con ",". */
function detectarSeparador(texto: string): string {
  const primera = texto.split(/\r?\n/, 1)[0] ?? "";
  const puntoYComa = (primera.match(/;/g) ?? []).length;
  const coma = (primera.match(/,/g) ?? []).length;
  return puntoYComa > coma ? ";" : ",";
}

function partir(linea: string, sep: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (c === sep && !entreComillas) {
      campos.push(actual);
      actual = "";
    } else {
      actual += c;
    }
  }
  campos.push(actual);
  return campos.map((c) => c.trim());
}

/**
 * Lee el archivo.
 *
 * Con encabezado, cada columna se reconoce por su nombre: nombre, usuario
 * (o documento), curso y nivel, en cualquier orden. Sin encabezado, la
 * primera columna es el nombre y de las demás se reconoce el nivel (A1…
 * C2), el curso (9A, 10B, 11-2) y el usuario (lo que quede). Los usuarios
 * repetidos dentro del mismo archivo se numeran: ana.gomez, ana.gomez2.
 */
export function leerCsv(texto: string, nivelPorDefecto: Nivel = "A1"): Lectura {
  const limpio = texto.replace(/^\uFEFF/, ""); // marca invisible de Excel
  const sep = detectarSeparador(limpio);
  const lineas = limpio.split(/\r?\n/);

  const filas: FilaImportada[] = [];
  const rechazadas: FilaRechazada[] = [];
  const usados = new Map<string, number>();

  // ¿La primera línea es un encabezado? Entonces dice qué es cada columna.
  const cabecera = partir(lineas[0] ?? "", sep).map(sinTildes);
  const conCabecera =
    /nombre|alumno|estudiante|name/.test(cabecera[0] ?? "") || cabecera.some((c) => /^(curso|nivel|usuario|documento)$/.test(c));
  const columna = (re: RegExp) => (conCabecera ? cabecera.findIndex((c) => re.test(c)) : -1);
  const iNombre = conCabecera ? Math.max(0, columna(/nombre|alumno|estudiante|name/)) : 0;
  const iUsuario = columna(/usuario|documento|user|identificaci|codigo/);
  const iCurso = columna(/curso|grado|grupo|salon/);
  const iNivel = columna(/nivel|level/);

  lineas.forEach((linea, i) => {
    const numero = i + 1;
    if (!linea.trim()) return;
    if (i === 0 && conCabecera) return;

    const campos = partir(linea, sep);
    const nombre = (campos[iNombre] ?? "").trim();
    if (nombre.length < 3) {
      rechazadas.push({ linea: numero, contenido: linea, motivo: "Nombre vacío o muy corto" });
      return;
    }
    if (nombre.length > 80) {
      rechazadas.push({ linea: numero, contenido: linea, motivo: "Nombre demasiado largo" });
      return;
    }

    let nivelTexto: string | undefined;
    let usuarioPropio: string | undefined;
    let cursoTexto: string | undefined;
    if (conCabecera) {
      nivelTexto = iNivel >= 0 ? campos[iNivel]?.toUpperCase().trim() || undefined : undefined;
      if (nivelTexto && !NIVELES_VALIDOS.includes(nivelTexto as Nivel)) {
        rechazadas.push({ linea: numero, contenido: linea, motivo: `El nivel "${nivelTexto}" no existe (A1, A2, B1, B2, C1 o C2)` });
        return;
      }
      usuarioPropio = iUsuario >= 0 ? campos[iUsuario]?.trim() || undefined : undefined;
      cursoTexto = iCurso >= 0 ? campos[iCurso]?.trim() || undefined : undefined;
    } else {
      const resto = campos
        .slice(1)
        .map((c) => c.trim())
        .filter(Boolean);
      const esNivel = (c: string) => NIVELES_VALIDOS.includes(c.toUpperCase() as Nivel);
      nivelTexto = resto.find(esNivel)?.toUpperCase();
      cursoTexto = resto.find((c) => !esNivel(c) && PARECE_CURSO.test(c));
      usuarioPropio = resto.find((c) => !esNivel(c) && c !== cursoTexto);
    }

    let username = usuarioPropio ? limpiarUsuario(usuarioPropio) : aUsuario(nombre);
    if (!username) {
      rechazadas.push({
        linea: numero,
        contenido: linea,
        motivo: "No se pudo formar un usuario con ese nombre",
      });
      return;
    }

    // Repetidos dentro del propio archivo
    const veces = usados.get(username) ?? 0;
    usados.set(username, veces + 1);
    if (veces > 0) username = `${username}${veces + 1}`;

    filas.push({
      linea: numero,
      nombre,
      username,
      nivel: (nivelTexto as Nivel | undefined) ?? nivelPorDefecto,
      curso: cursoTexto ? limpiarCurso(cursoTexto) : null,
    });
  });

  return { filas, rechazadas, separador: sep };
}

function sinTildes(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
