/**
 * Las reglas con que el código califica la evaluación corta
 * (src/lib/evaluacion.ts), sin red: qué cuenta como la misma palabra,
 * qué forma vale en ¿Qué es esto? y Dilo en inglés, cuántas cosas nombró
 * en Describe la imagen y qué palabras quedan por mejorar en Repite.
 *
 *   node scripts/probar-comparacion.mjs
 */
const { normalizar, mismaPalabra, contieneAlguna, cosasNombradas, palabrasDeRepite } = await import("../src/lib/evaluacion.ts");

let fallos = 0;
const probar = (nombre, ok, detalle = "") => {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
};
const mejorar = (frase, oido) => palabrasDeRepite(frase, oido).filter((p) => p.estado === "mejorar").map((p) => p.palabra).join(",");

console.log("Normalizar:");
probar("contracciones y números", normalizar("I'm fifteen. It's OK!") === " i am 15 it is ok ", normalizar("I'm fifteen. It's OK!"));
probar("las tildes no borran la letra: café y cafe son iguales", normalizar("café") === normalizar("cafe") && normalizar("café") === " cafe ");
probar("\"oh\" es cero entre números y exclamación suelta", normalizar("three one oh five") === " 3 1 0 5 " && normalizar("Oh, nice!") === " oh nice ");
probar("\"ten o'clock\" nombra el reloj", cosasNombradas("It's ten o'clock.", ["clock"]).length === 1);

console.log("\nLa misma palabra, con acento:");
probar("una letra de diferencia en palabras largas vale", mismaPalabra("mornin", "morning") && mismaPalabra("please", "pleased"));
probar("en palabras cortas no: God no es Good, might no es night, mouse no es house", !mismaPalabra("god", "good") && !mismaPalabra("might", "night") && !mismaPalabra("mouse", "house"));
probar("dos letras de diferencia no valen", !mismaPalabra("mernin", "morning"));

console.log("\n¿Qué es esto? y Dilo en inglés:");
probar("la forma esperada vale, con puntuación o sin ella", contieneAlguna("Good morning!", ["Good morning"]));
probar("una forma aceptada vale", contieneAlguna("Morning", ["Good morning", "Morning"]));
probar("dentro de una frase más larga también vale", contieneAlguna("It's an apple", ["apple"]));
probar("otra palabra no vale", !contieneAlguna("Good night", ["Good morning", "Morning"]));
probar("incompleta no vale", !contieneAlguna("Nice to meet", ["Nice to meet you"]));
probar("en desorden no vale", !contieneAlguna("Meet you nice to", ["Nice to meet you"]));
probar("en español no vale", !contieneAlguna("Mucho gusto", ["Nice to meet you", "Pleased to meet you"]));
probar("I'm y I am son lo mismo", contieneAlguna("I am Diego", ["I'm Diego"]) && contieneAlguna("I'm Diego", ["I am Diego"]));
probar("\"please to meet you\" (pleased mal oído) vale", contieneAlguna("please to meet you", ["Pleased to meet you"]));
probar("vacío no vale", !contieneAlguna("", ["Good morning"]));

console.log("\nDescribe la imagen:");
const cosas = ["woman", "dog", "tree", "house", "ball"];
probar("tres cosas del dibujo", cosasNombradas("I see a woman. I see a dog. I see a tree.", cosas).length === 3);
probar("en plural también cuentan", cosasNombradas("I see two dogs and three trees and a house", cosas).length === 3);
probar("dos no alcanzan", cosasNombradas("I see a woman and a dog", cosas).length === 2);
probar("en español no cuentan", cosasNombradas("Veo un perro y un árbol", cosas).length === 0);

console.log("\nRepite, palabra por palabra:");
const frase = "Good morning! How are you?";
probar("todo entendido: nada por mejorar", mejorar(frase, "Good morning. How are you?") === "");
probar("con acento (mornin) se entiende", mejorar(frase, "Good mornin, how are you") === "");
probar("otra palabra queda por mejorar", mejorar(frase, "Good night. How are you?") === "morning");
probar("lo que no dijo queda por mejorar", mejorar(frase, "Good morning") === "How,are,you");
probar("en español, todo por mejorar", mejorar(frase, "Buenos días, ¿cómo estás?") === "Good,morning,How,are,you");
probar("una palabra repetida en la frase tiene que oírse dos veces", mejorar("I am fine, I am happy", "I am fine happy") === "I,am");
probar("I'm en la frase vale con I am", mejorar("I'm fine", "I am fine") === "");
probar("vacío: todo por mejorar", mejorar("Good morning", "") === "Good,morning");

// Lo escrito cobra solo si hace falta el modelo (decisión del 29 de
// octubre de 2026: todo lo que usa la IA cuesta). Sin red: el cobro dice
// que no hay saldo, así que el modelo nunca se llama.
console.log("\nCobro de lo escrito:");
const { evaluarRespuestaCorta } = await import("../src/lib/evaluacion.ts");
const sinSaldoNunca = () => {
  const c = { veces: 0 };
  c.cobrar = async () => (c.veces++, false);
  return c;
};
const dilo = { tipo: "dilo", nivel: "A2", esperado: "How about Saturday?", aceptadas: ["What about Saturday?"], espanol: "¿Qué tal el sábado?" };
let c = sinSaldoNunca();
let r = await evaluarRespuestaCorta({ ...dilo, texto: "What about Saturday?", antesDelModelo: c.cobrar });
probar("una frase aprobada escrita no cobra", r.correcto && !r.sinSaldo && c.veces === 0, JSON.stringify({ r, veces: c.veces }));
c = sinSaldoNunca();
r = await evaluarRespuestaCorta({ ...dilo, texto: "Maybe on Saturday?", antesDelModelo: c.cobrar });
probar("otra forma escrita pide cobrar una vez; sin saldo no se califica", !r.correcto && r.sinSaldo && c.veces === 1, JSON.stringify({ r, veces: c.veces }));
c = sinSaldoNunca();
r = await evaluarRespuestaCorta({ ...dilo, texto: "El sábado", antesDelModelo: c.cobrar });
probar("en español no se juzga: no cobra", !r.correcto && !r.sinSaldo && c.veces === 0, JSON.stringify({ r, veces: c.veces }));
const describe = { tipo: "describe", nivel: "A2", esperado: "Tell me 3 things Priya has done.", aceptadas: ["dog", "car"] };
c = sinSaldoNunca();
r = await evaluarRespuestaCorta({ ...describe, texto: "He wash the car.", antesDelModelo: c.cobrar });
probar("Describe escrito sin saldo: no se revisa y la cosa cuenta", !r.sinSaldo && !r.mejora && c.veces === 1, JSON.stringify({ r, veces: c.veces }));

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nReglas de la evaluación corta correctas.");
