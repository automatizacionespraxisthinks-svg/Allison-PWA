/**
 * Escribe docs/PROMPT.md: el prompt de Allison tal como lo recibe Gemini.
 *
 * Se GENERA en vez de escribirse a mano por la misma razón que los SQL
 * manuales: el prompt se arma en cada turno desde src/lib/allison.ts, y
 * una copia pegada en un documento queda mintiendo el día que alguien
 * ajuste una regla. `--verificar` (dentro de npm run revisar) falla si
 * el archivo dejó de coincidir con el código.
 *
 *   node scripts/generar-prompt.mjs              escribe docs/PROMPT.md
 *   node scripts/generar-prompt.mjs --verificar  comprueba, sin escribir
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const { construirInstruccion, COMPORTAMIENTO } = await import("../src/lib/allison.ts");
const { NIVELES } = await import("../src/lib/tipos.ts");
const { UNIDADES } = await import("../src/lib/curriculo.ts");

const ARCHIVO = "docs/PROMPT.md";
const VERIFICAR = process.argv.includes("--verificar");

/** Un alumno de ejemplo con lo que el prompt sabe de una persona real. */
const ALUMNO = {
  nombre: "Juan Camilo Rodríguez",
  nivel: "A2",
  temasAbiertos: ["pasado simple", "preposiciones de lugar"],
  temasDominados: ["presente simple"],
};

const LECCION = UNIDADES.find((u) => u.nivel === ALUMNO.nivel) ?? UNIDADES[0];

const libre = construirInstruccion(ALUMNO);
const conLeccion = construirInstruccion(ALUMNO, undefined, LECCION);

/** El bloque que la lección inserta, y que en charla libre no existe. */
const bloqueLeccion = conLeccion
  .slice(conLeccion.indexOf("TODAY'S LESSON"), conLeccion.indexOf("\nHOW YOU TEACH"))
  .trim();

const FENCE = "```";

const contenido = `# El prompt de Allison

> ARCHIVO GENERADO por \`scripts/generar-prompt.mjs\` desde
> \`src/lib/allison.ts\`. No lo edites a mano: cambia el código y
> regenera con \`npm run generar:prompt\`.

El prompt no es un texto fijo: \`construirInstruccion\` lo arma en cada
turno con el nombre del alumno, su nivel, los temas que todavía falla y
los que domina, y —si está practicando una unidad— la lección del día.
Se le envía a Gemini como \`systemInstruction\`; la respuesta va sujeta
además a un esquema obligatorio: transcripción, caso (cuál de los once
casos del plan), español, respuesta en inglés y correcciones. El código
junta el español y el inglés con los marcadores de la voz
(\`componerRespuesta\`).

Lo que sigue es el prompt REAL, generado para este alumno de ejemplo:

- **Nombre:** ${ALUMNO.nombre} (el prompt solo usa el primer nombre)
- **Nivel:** ${ALUMNO.nivel}
- **Todavía falla:** ${ALUMNO.temasAbiertos.join(", ")}
- **Ya domina:** ${ALUMNO.temasDominados.join(", ")}

Son ${libre.length.toLocaleString("es-CO")} caracteres y ${libre.split("\n").length} líneas.

---

## 1. Conversación libre

${FENCE}text
${libre}
${FENCE}

---

## 2. Lo que agrega el modo lección

Cuando el alumno practica una unidad del currículo, este bloque entra
justo después de la ficha de Allison y antes de "HOW YOU TEACH".
Ejemplo con la unidad **${LECCION.clave} — ${LECCION.titulo}**:

${FENCE}text
${bloqueLeccion}
${FENCE}

---

## 3. Cuánto habla Allison en cada nivel

Además de esto cambian, por nivel, qué cuenta como caso 1 y como caso 2
(qué se corrige), cuántas correcciones van por turno y si hay español
(A1, A2 y B1 sí; de B2 en adelante, no).

${NIVELES.map(({ nivel, etiqueta }) => `### ${nivel} — ${etiqueta}\n\n${FENCE}text\n${COMPORTAMIENTO[nivel]}\n${FENCE}`).join("\n\n")}
`;

if (VERIFICAR) {
  const enDisco = existsSync(ARCHIVO) ? readFileSync(ARCHIVO, "utf8").replace(/\r\n/g, "\n") : null;
  if (enDisco !== contenido) {
    console.error(`  FALLO ${ARCHIVO} no coincide con el prompt del código.`);
    console.error("\nRegenera con:  npm run generar:prompt");
    process.exit(1);
  }
  console.log(`  ok    ${ARCHIVO} coincide con el prompt del código`);
} else {
  writeFileSync(ARCHIVO, contenido);
  console.log(`  generado  ${ARCHIVO} (${contenido.length.toLocaleString("es-CO")} caracteres)`);
}
