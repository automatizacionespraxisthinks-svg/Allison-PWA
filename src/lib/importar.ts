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
export function aUsuario(nombre: string): string {
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
export function limpiarUsuario(valor: string): string {
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
 * Formato esperado: nombre, nivel y (opcional) usuario. Si la primera
 * línea parece un encabezado, se salta. Los usuarios repetidos dentro
 * del mismo archivo se numeran: ana.gomez, ana.gomez2, ana.gomez3.
 */
export function leerCsv(texto: string, nivelPorDefecto: Nivel = "A1"): Lectura {
  const limpio = texto.replace(/^﻿/, ""); // marca invisible de Excel
  const sep = detectarSeparador(limpio);
  const lineas = limpio.split(/\r?\n/);

  const filas: FilaImportada[] = [];
  const rechazadas: FilaRechazada[] = [];
  const usados = new Map<string, number>();

  lineas.forEach((linea, i) => {
    const numero = i + 1;
    if (!linea.trim()) return;

    const campos = partir(linea, sep);
    const primero = (campos[0] ?? "").toLowerCase();

    // Encabezado
    if (i === 0 && /nombre|alumno|estudiante|name/.test(primero)) return;

    const nombre = campos[0] ?? "";
    if (nombre.length < 3) {
      rechazadas.push({ linea: numero, contenido: linea, motivo: "Nombre vacío o muy corto" });
      return;
    }
    if (nombre.length > 80) {
      rechazadas.push({ linea: numero, contenido: linea, motivo: "Nombre demasiado largo" });
      return;
    }

    // El nivel puede venir en cualquiera de las columnas siguientes
    const nivelTexto = campos
      .slice(1)
      .map((c) => c.toUpperCase().trim())
      .find((c) => NIVELES_VALIDOS.includes(c as Nivel));

    // Un usuario propio del colegio, si lo traen
    const usuarioPropio = campos
      .slice(1)
      .map((c) => c.trim())
      .find((c) => c && !NIVELES_VALIDOS.includes(c.toUpperCase() as Nivel));

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
      nivel: (nivelTexto as Nivel) ?? nivelPorDefecto,
    });
  });

  return { filas, rechazadas, separador: sep };
}
