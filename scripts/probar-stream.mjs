/**
 * Prueba del lector de JSON parcial.
 *
 * Es la pieza que decide cuándo se le puede mostrar algo al alumno
 * mientras la respuesta todavía está llegando. Si se equivoca, o bien
 * muestra texto cortado, o bien no muestra nada y perdemos la ventaja.
 *
 *   node scripts/probar-stream.mjs
 */

function campoCompleto(json, campo) {
  const marca = '"' + campo + '"';
  const donde = json.indexOf(marca);
  if (donde === -1) return null;

  let i = json.indexOf(":", donde + marca.length);
  if (i === -1) return null;
  i++;

  while (i < json.length && (json[i] === " " || json[i] === "\n")) i++;
  if (json[i] !== '"') return null;

  const abre = i;
  i++;

  while (i < json.length) {
    if (json[i] === "\\") {
      i += 2;
      continue;
    }
    if (json[i] === '"') {
      try {
        return JSON.parse(json.slice(abre, i + 1));
      } catch {
        return null;
      }
    }
    i++;
  }

  return null;
}

const CASOS = [
  {
    desc: "todavía está llegando",
    json: '{"transcripcion":"I go to the park',
    campo: "transcripcion",
    espera: null,
  },
  {
    desc: "ya cerró la comilla",
    json: '{"transcripcion":"I go to the park",',
    campo: "transcripcion",
    espera: "I go to the park",
  },
  {
    desc: "comillas escapadas dentro del texto",
    json: '{"transcripcion":"She said \\"hi\\" to me",',
    campo: "transcripcion",
    espera: 'She said "hi" to me',
  },
  {
    desc: "una barra al final del texto",
    json: '{"transcripcion":"nine \\\\ ten",',
    campo: "transcripcion",
    espera: "nine \\ ten",
  },
  {
    desc: "segundo campo, completo",
    json: '{"transcripcion":"a","respuesta":"Oh nice!",',
    campo: "respuesta",
    espera: "Oh nice!",
  },
  {
    desc: "segundo campo, a medias",
    json: '{"transcripcion":"a","respuesta":"Oh ni',
    campo: "respuesta",
    espera: null,
  },
  {
    desc: "el campo todavía no aparece",
    json: '{"transcripcion":"a"',
    campo: "respuesta",
    espera: null,
  },
  {
    desc: "espacios alrededor de los dos puntos",
    json: '{"transcripcion" :  "hola",',
    campo: "transcripcion",
    espera: "hola",
  },
  {
    desc: "texto vacío pero cerrado",
    json: '{"transcripcion":"",',
    campo: "transcripcion",
    espera: "",
  },
];

let fallos = 0;
for (const c of CASOS) {
  const r = campoCompleto(c.json, c.campo);
  const ok = r === c.espera;
  if (!ok) fallos++;
  console.log(`  ${ok ? "OK   " : "FALLA"}  ${c.desc} -> ${JSON.stringify(r)}`);
}

console.log(
  fallos === 0
    ? `\n${CASOS.length}/${CASOS.length} correctos.\n`
    : `\n${fallos} de ${CASOS.length} fallaron.\n`
);
process.exitCode = fallos === 0 ? 0 : 1;
