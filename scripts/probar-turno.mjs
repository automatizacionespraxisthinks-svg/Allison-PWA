/**
 * El pase de "¿No dijiste eso?" (src/lib/turno.ts) y la velocidad que el
 * servidor acepta para la voz (velocidadDeAllison), sin red ni base.
 *
 * Si esto falla, alguien puede recuperar intervenciones que no son suyas
 * (un pase ajeno, vencido o cambiado) o pedir la voz a una velocidad en
 * la que deforma las palabras.
 *
 * También la pausa reforzada de las comas (pausasEnComas).
 *
 *   node scripts/probar-turno.mjs
 */
const { firmarTurno, leerTurno, MINUTOS_PARA_RECLAMAR } = await import("../src/lib/turno.ts");
const { velocidadDeAllison, pausasEnComas, letrasParaVoz, tramosConDeletreo, estimarSegundos } = await import("../src/lib/habla.ts");

let fallos = 0;
function probar(nombre, ok, detalle = "") {
  console.log(`  ${ok ? "ok   " : "FALLO"} ${nombre}${ok || !detalle ? "" : ` -- ${detalle}`}`);
  if (!ok) fallos++;
}

const SECRETO = "secreto-de-prueba";
const ana = "11111111-1111-4111-8111-111111111111";
const beto = "22222222-2222-4222-8222-222222222222";
const mensaje = "33333333-3333-4333-8333-333333333333";
const ahora = 1_800_000_000_000;

console.log("El pase del turno:");
const pase = firmarTurno({ mensajeId: mensaje, userId: ana, bolsa: "recarga" }, ahora, SECRETO);
probar("se firma y se lee: mismo mensaje y misma bolsa", JSON.stringify(leerTurno(pase, ana, ahora, SECRETO)) === JSON.stringify({ mensajeId: mensaje, bolsa: "recarga" }));
probar("la bolsa del plan también viaja", leerTurno(firmarTurno({ mensajeId: mensaje, userId: ana, bolsa: "plan" }, ahora, SECRETO), ana, ahora, SECRETO)?.bolsa === "plan");
probar("no sirve para otro alumno", leerTurno(pase, beto, ahora, SECRETO) === null);
probar(`vale ${MINUTOS_PARA_RECLAMAR} minutos`, leerTurno(pase, ana, ahora + MINUTOS_PARA_RECLAMAR * 60_000 - 1000, SECRETO) !== null);
probar("vencido no sirve", leerTurno(pase, ana, ahora + MINUTOS_PARA_RECLAMAR * 60_000 + 1000, SECRETO) === null);
probar("firmado con otro secreto no sirve", leerTurno(pase, ana, ahora, "otro-secreto") === null);
const [carga, firma] = pase.split(".");
const cambiada = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(carga, "base64url").toString()), b: "plan" })).toString("base64url");
probar("cambiarle la bolsa lo invalida", leerTurno(`${cambiada}.${firma}`, ana, ahora, SECRETO) === null);
probar("basura no revienta", [null, undefined, 7, "", "a", "a.b", "a.b.c", `${carga}.`, "x".repeat(700)].every((x) => leerTurno(x, ana, ahora, SECRETO) === null));
probar("sin secreto no hay pase (ni se firma ni se lee)", firmarTurno({ mensajeId: mensaje, userId: ana, bolsa: "plan" }, ahora, "") === null && leerTurno(pase, ana, ahora, "") === null);

console.log("\nLa velocidad que acepta el servidor:");
probar("0,9 (A1 y A2) y 1 (los demás) pasan", velocidadDeAllison(0.9) === 0.9 && velocidadDeAllison(1) === 1);
probar("cualquier otra cosa es 1", [0.5, 0.56, 0.6, 0.7, 0.8, 0.675, 1.125, 1.25, 2, 9, -1, NaN, "0.9", null, undefined].every((v) => velocidadDeAllison(v) === 1));

console.log("\nLa pausa de las comas:");
probar("cada coma lleva su refuerzo, en español y en inglés", pausasEnComas("No te preocupes, vamos paso a paso.") === "No te preocupes, … vamos paso a paso." && pausasEnComas("I like movies, music, and soccer.") === "I like movies, … music, … and soccer.");
probar("un deletreo no se alarga", pausasEnComas("Played. P, L, A, Y, E, D. Try saying: I played.") === "Played. P, L, A, Y, E, D. Try saying: I played.");
probar("no toca una coma final, un número ni una que ya tiene su pausa", pausasEnComas("'played',") === "'played'," && pausasEnComas("1,000 pesos") === "1,000 pesos" && pausasEnComas("Bien, … sigamos") === "Bien, … sigamos");

console.log("\nLos deletreos:");
const tramos = (texto) => tramosConDeletreo([{ texto, idioma: "en" }]).map((t) => `${t.idioma}:${t.texto}`).join(" | ");
probar("la A de un deletreo con comas va como «eh»", letrasParaVoz("Played. P, L, A, Y, E, D. Try saying: I played.") === "Played. P, L, eh, Y, E, D. Try saying: I played." && letrasParaVoz("A, N, N, I, E.") === "eh, N, N, I, E.");
probar("no toca frases normales («I, a student», «A, B»)", letrasParaVoz("I, a student, live here.") === "I, a student, live here." && letrasParaVoz("A, B") === "A, B" && letrasParaVoz("B, B.") === "B, B.");
probar(
  "cada letra va en su propio tramo, con un tramo mudo entre una y otra",
  tramos("P, L, A, Y, E, D.") === "en:P. | es:- | en:L. | es:- | en:eh. | es:- | en:Y. | es:- | en:E. | es:- | en:D.",
  tramos("P, L, A, Y, E, D.")
);
probar(
  "lo de antes y lo de después del deletreo siguen en sus tramos",
  tramos("My name is Amy. eh, M, Y. Try saying it!") === "en:My name is Amy. | en:eh. | es:- | en:M. | es:- | en:Y. | en:Try saying it!",
  tramos("My name is Amy. eh, M, Y. Try saying it!")
);
probar(
  "un texto sin deletreo, o en español, no cambia",
  tramos("Nice! What do you watch?") === "en:Nice! What do you watch?" &&
    tramosConDeletreo([{ texto: "Se deletrea así.", idioma: "es" }])[0].texto === "Se deletrea así."
);
probar("la pausa de comas no toca las letras ni el tramo mudo", ["P.", "eh.", "-"].every((t) => pausasEnComas(t) === t));

probar("la espera cuenta cada letra de un deletreo (unos 1,5 s por letra)", estimarSegundos("Beautiful. Se deletrea así. B, E, A, U, T, I, F, U, L. Y se dice: beautiful. Try saying: a beautiful city.") >= 20 && estimarSegundos("Nice! What do you watch?") <= 3);

if (fallos > 0) {
  console.error(`\n${fallos} fallo(s).`);
  process.exit(1);
}
console.log("\nPase del turno y velocidad correctos.");
