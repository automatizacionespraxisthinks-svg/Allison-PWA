/**
 * La versión legal copiada no se puede desincronizar.
 *
 * scripts/crear-admin.mjs corre DENTRO del contenedor, donde no existe
 * el código fuente en TypeScript, así que lleva su propia copia de
 * VERSION_LEGAL. Una copia que nadie vigila se desincroniza el día que
 * cambien los términos, y entonces los administradores creados desde el
 * servidor quedarían firmando una versión que ya no existe.
 *
 *   node scripts/probar-legal.mjs
 */
import { readFileSync } from "node:fs";

const fuente = readFileSync(new URL("../src/lib/legal.ts", import.meta.url), "utf8");
const copia = readFileSync(new URL("./crear-admin.mjs", import.meta.url), "utf8");

const sacar = (texto, donde) => {
  const m = texto.match(/VERSION_LEGAL\s*=\s*"([^"]+)"/);
  if (!m) {
    console.error(`FALLO: no se encontró VERSION_LEGAL en ${donde}`);
    process.exit(1);
  }
  return m[1];
};

const original = sacar(fuente, "src/lib/legal.ts");
const duplicada = sacar(copia, "scripts/crear-admin.mjs");

if (original !== duplicada) {
  console.error(
    `FALLO: la versión legal no coincide.\n` +
      `  src/lib/legal.ts ......... ${original}\n` +
      `  scripts/crear-admin.mjs .. ${duplicada}\n\n` +
      `Actualiza la copia de crear-admin.mjs a "${original}".`
  );
  process.exit(1);
}

console.log(`  ok    la versión legal coincide en los dos sitios (${original})`);
