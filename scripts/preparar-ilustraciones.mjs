/**
 * Pasa a la app las ilustraciones de A2 o B1 que llegan de Gemini (paso 6
 * del avance de "Contenido A2" y "Contenido B1"; los prompts están en las
 * páginas "Prompts de ilustraciones A2" y "Prompts de ilustraciones B1"):
 *
 *   1. Guarda cada imagen en ilustraciones-a2/nuevas/ (o ilustraciones-b1/
 *      nuevas/) con el nombre de la lista ("f-priya-biblioteca.png"; da
 *      igual si es png, jpg o webp).
 *   2. node scripts/preparar-ilustraciones.mjs        (A2)
 *      node scripts/preparar-ilustraciones.mjs b1     (B1)
 *
 * Revisa que el nombre sea uno del contenido y que la forma sea la
 * esperada (16:9 las portadas y los escenarios, 1:1 las actividades). La
 * deja en public/ilustraciones/<nivel>/<nombre>.webp a 1024 px de ancho,
 * como las de A1, y mueve la original a ilustraciones-<nivel>/originales/.
 * Las fichas de los personajes (referencia-*: Priya y Ben en A2, Zoe y
 * Liam en B1) van a ilustraciones-<nivel>/referencias/: no salen en la app.
 *
 *   node scripts/preparar-ilustraciones.mjs [b1] --faltan   solo lista las que faltan
 *
 * Usa sharp, que ya viene con Next.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** El nivel: a2 si no se dice otro. */
const NIVEL = process.argv.slice(2).find((a) => /^(a2|b1)$/i.test(a))?.toLowerCase() ?? "a2";
const ETIQUETA = NIVEL.toUpperCase();
const DATOS = path.join(RAIZ, `src/lib/ruta/${NIVEL}`);
const NUEVAS = path.join(RAIZ, `ilustraciones-${NIVEL}/nuevas`);
const ORIGINALES = path.join(RAIZ, `ilustraciones-${NIVEL}/originales`);
const REFERENCIAS = path.join(RAIZ, `ilustraciones-${NIVEL}/referencias`);
const DESTINO = path.join(RAIZ, `public/ilustraciones/${NIVEL}`);
const ANCHO = 1024;

/**
 * Las que llevan palabras: Gemini las deja en blanco y el texto se pone
 * después, para que quede bien escrito. Las anota el informe.
 */
const CON_TEXTO_A2 = {
  "f-ben-balon-ayer": "Yesterday (en la hoja del calendario)",
  "f-ben-caballo": "Ben, last summer (en la franja blanca de la foto)",
  "f-tiquete-tren": "London → Cambridge · Saturday · 10:30",
  "f-agenda-ben": "Monday a Friday en las columnas, 4:00 junto a la muela y Grandma junto a la torta",
  "f-entrada-concierto": "Concert · Thursday · 8:00 p.m.",
  "f-invitacion-picnic": "Picnic! · Sunday · 2:00 p.m. · The park by the river",
  "f-ropa-chaqueta": "£30 (en la etiqueta)",
  "f-vitrina-bath": "SALE (arriba) y Jackets (junto al gancho vacío)",
  "f-dos-maletas": "£60 (la grande) y £25 (la pequeña)",
  "f-dos-habitaciones": "£120 (la grande) y £60 (la pequeña)",
  "e-cardiff-apartamentos": "For rent (en los dos letreros)",
};

/** B1: los relojes de las secuencias van encima, con la hora exacta; Gemini deja la pared lisa. */
const CON_TEXTO_B1 = {
  "f-robo-1": "un reloj sin números a las 4:00 (pared amarilla, arriba a la derecha)",
  "f-robo-4": "el mismo reloj a las 4:20",
  "f-zoe-cuarto-1": "un reloj sin números a las 7:00 (pared azul, arriba a la derecha)",
  "f-zoe-cuarto-2": "el mismo reloj a las 8:30",
  "f-zoe-cuarto-3": "el mismo reloj a las 10:00",
  "f-rector-4": "Monday a Friday en el calendario (Friday encerrado en rojo) y Homework en el cuaderno tachado",
};

const CON_TEXTO = NIVEL === "b1" ? CON_TEXTO_B1 : CON_TEXTO_A2;

/** Lo que pide la app en cada lugar del contenido del nivel. */
async function nombresDelContenido() {
  const nombres = new Set();
  function recorrer(o) {
    if (Array.isArray(o)) return o.forEach(recorrer);
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" && (k === "imagen" || k === "portada")) nombres.add(v);
      else if ((k === "archivos" || k === "imagenes") && Array.isArray(v)) v.forEach((n) => nombres.add(n));
      else recorrer(v);
    }
  }
  for (const f of fs.readdirSync(DATOS).filter((f) => f.endsWith(".ts"))) {
    const m = await import(pathToFileURL(path.join(DATOS, f)).href);
    Object.values(m).forEach(recorrer);
  }
  // Las de otro nivel reutilizadas ("a1/f-tenis", "a2/f-arepas") se producen con su nivel.
  return [...nombres].filter((n) => !n.includes("/")).sort();
}

/** Portadas y escenarios van en 16:9; las actividades (f-) en cuadrado. */
const esCuadrada = (nombre) => nombre.startsWith("f-");
/** Las fichas quedan en referencias/ con su formato original; las demás, en la app como webp. */
const existe = (nombre) =>
  nombre.startsWith("referencia-")
    ? fs.existsSync(REFERENCIAS) && fs.readdirSync(REFERENCIAS).some((f) => path.parse(f).name.toLowerCase() === nombre)
    : fs.existsSync(path.join(DESTINO, `${nombre}.webp`));

const nombres = await nombresDelContenido();
const faltan = () => nombres.filter((n) => !existe(n));

if (process.argv.includes("--faltan")) {
  const f = faltan();
  console.log(`${nombres.length - f.length} de ${nombres.length} ilustraciones de ${ETIQUETA} listas. Faltan ${f.length}:`);
  for (const n of f) console.log(`  ${n}${CON_TEXTO[n] ? `  (lleva texto: ${CON_TEXTO[n]})` : ""}`);
  process.exit(0);
}

for (const d of [NUEVAS, ORIGINALES, REFERENCIAS, DESTINO]) fs.mkdirSync(d, { recursive: true });
const archivos = fs.readdirSync(NUEVAS).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
if (!archivos.length) {
  console.log(`No hay imágenes en ${path.relative(RAIZ, NUEVAS)}. Faltan ${faltan().length} de ${nombres.length}.`);
  process.exit(0);
}

const conTexto = [];
let problemas = 0;
for (const archivo of archivos) {
  // "f-zorro (1).png" o "F-Zorro.PNG" siguen siendo f-zorro.
  const nombre = path.parse(archivo).name.toLowerCase().replace(/\s*\(\d+\)$/, "").trim();
  const origen = path.join(NUEVAS, archivo);

  if (nombre.startsWith("referencia-")) {
    fs.renameSync(origen, path.join(REFERENCIAS, archivo));
    console.log(`  ✓ ${nombre}: guardada como referencia (no va en la app)`);
    continue;
  }
  if (!nombres.includes(nombre)) {
    console.log(`  ✗ ${archivo}: ese nombre no está en el contenido de ${ETIQUETA}. Revisa cómo se llama en la lista.`);
    problemas++;
    continue;
  }

  // En memoria: en Windows, sharp deja el archivo abierto y después no se puede mover (EBUSY).
  const datos = fs.readFileSync(origen);
  const { width, height } = await sharp(datos).metadata();
  const proporcion = width / height;
  const bien = esCuadrada(nombre) ? proporcion > 0.9 && proporcion < 1.1 : proporcion > 1.6 && proporcion < 1.9;
  if (!bien) {
    console.log(`  ✗ ${archivo}: mide ${width}×${height}; debe ser ${esCuadrada(nombre) ? "cuadrada (1:1)" : "horizontal (16:9)"}.`);
    problemas++;
    continue;
  }
  if (width < ANCHO) console.log(`  ! ${archivo}: mide ${width} px de ancho; se agranda a ${ANCHO} y puede verse borrosa.`);

  const habia = existe(nombre);
  await sharp(datos).resize({ width: ANCHO }).webp({ quality: 82, effort: 6 }).toFile(path.join(DESTINO, `${nombre}.webp`));
  fs.renameSync(origen, path.join(ORIGINALES, `${nombre}${path.extname(archivo).toLowerCase()}`));
  console.log(`  ✓ ${nombre}${habia ? " (reemplazó a la anterior)" : ""}`);
  if (CON_TEXTO[nombre]) conTexto.push(nombre);
}

if (conTexto.length) {
  console.log("\nLlevan texto (se agrega aparte):");
  for (const n of conTexto) console.log(`  ${n}: ${CON_TEXTO[n]}`);
}
const f = faltan();
console.log(`\n${nombres.length - f.length} de ${nombres.length} ilustraciones de ${ETIQUETA} listas.${problemas ? ` ${problemas} con problemas.` : ""}`);
process.exit(problemas ? 1 : 0);
