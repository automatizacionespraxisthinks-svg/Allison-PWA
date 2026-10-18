/**
 * Cada página del panel se protege sola: el layout de /admin no basta,
 * porque en Next 16 una página se puede pedir sin volver a correr su
 * layout. Este chequeo falla si una página de src/app/admin no llama a
 * paginaDeAdmin() antes de leer datos.
 *
 *   npm run probar:admin
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "src/app/admin";
const paginas = [];
(function recorrer(dir) {
  for (const n of readdirSync(dir)) {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else if (n === "page.tsx") paginas.push(ruta);
  }
})(RAIZ);

let fallos = 0;
for (const p of paginas) {
  const s = readFileSync(p, "utf8");
  const cuerpo = s.slice(s.indexOf("export default async function"));
  // La primera instrucción del cuerpo tiene que ser el chequeo.
  const primera = cuerpo.slice(cuerpo.search(/\)\s*\{\s*\n/)).split("\n")[1]?.trim();
  if (primera !== "await paginaDeAdmin();") {
    console.log(`  FALLO ${p}: la primera línea tiene que ser "await paginaDeAdmin();"`);
    fallos++;
  }
}
console.log(fallos ? `${fallos} página(s) del panel sin proteger.` : `Las ${paginas.length} páginas del panel se protegen solas.`);
process.exit(fallos ? 1 : 0);
