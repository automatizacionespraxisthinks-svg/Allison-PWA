import type { Nivel } from "../tipos.ts";
import { PARADA_01 } from "./a1/parada-01.ts";
import { PARADA_02 } from "./a1/parada-02.ts";
import { PARADA_03 } from "./a1/parada-03.ts";
import { PARADA_04 } from "./a1/parada-04.ts";
import { PARADA_05 } from "./a1/parada-05.ts";
import { PARADA_06 } from "./a1/parada-06.ts";
import { PARADA_07 } from "./a1/parada-07.ts";
import { PARADA_08 } from "./a1/parada-08.ts";
import { PARADA_09 } from "./a1/parada-09.ts";
import { PARADA_10 } from "./a1/parada-10.ts";
import { REPASO_1 } from "./a1/repaso-1.ts";
import { REPASO_FINAL } from "./a1/repaso-final.ts";
import { PARADA_01 as A2_PARADA_01 } from "./a2/parada-01.ts";
import { PARADA_02 as A2_PARADA_02 } from "./a2/parada-02.ts";
import { PARADA_03 as A2_PARADA_03 } from "./a2/parada-03.ts";
import { PARADA_04 as A2_PARADA_04 } from "./a2/parada-04.ts";
import { PARADA_05 as A2_PARADA_05 } from "./a2/parada-05.ts";
import { PARADA_06 as A2_PARADA_06 } from "./a2/parada-06.ts";
import { PARADA_07 as A2_PARADA_07 } from "./a2/parada-07.ts";
import { PARADA_08 as A2_PARADA_08 } from "./a2/parada-08.ts";
import { PARADA_09 as A2_PARADA_09 } from "./a2/parada-09.ts";
import { PARADA_10 as A2_PARADA_10 } from "./a2/parada-10.ts";
import { REPASO_1 as A2_REPASO_1 } from "./a2/repaso-1.ts";
import { REPASO_FINAL as A2_REPASO_FINAL } from "./a2/repaso-final.ts";
import { PARADA_01 as B1_PARADA_01 } from "./b1/parada-01.ts";
import { PARADA_02 as B1_PARADA_02 } from "./b1/parada-02.ts";
import { PARADA_03 as B1_PARADA_03 } from "./b1/parada-03.ts";
import { PARADA_04 as B1_PARADA_04 } from "./b1/parada-04.ts";
import { PARADA_05 as B1_PARADA_05 } from "./b1/parada-05.ts";
import { PARADA_06 as B1_PARADA_06 } from "./b1/parada-06.ts";
import { PARADA_07 as B1_PARADA_07 } from "./b1/parada-07.ts";
import { PARADA_08 as B1_PARADA_08 } from "./b1/parada-08.ts";
import { PARADA_09 as B1_PARADA_09 } from "./b1/parada-09.ts";
import { PARADA_10 as B1_PARADA_10 } from "./b1/parada-10.ts";
import { REPASO_1 as B1_REPASO_1 } from "./b1/repaso-1.ts";
import { REPASO_FINAL as B1_REPASO_FINAL } from "./b1/repaso-final.ts";
import type { Escenario, Parada, Repaso } from "./tipos.ts";

/**
 * "Mi ruta": las paradas y los repasos de cada nivel, en el orden en que
 * aparecen en el mapa. A1 es Estados Unidos, A2 el Reino Unido y B1
 * Canadá (plan, sección 23): diez paradas, el Repaso 1 después de la
 * quinta y el Repaso final al cierre.
 * Los demás niveles se agregan cuando su contenido esté escrito y
 * aprobado; mientras tanto usan la ruta provisional (plan, sección 22).
 */
export type PasoDeRuta = { tipo: "parada"; parada: Parada } | { tipo: "repaso"; repaso: Repaso };

const parada = (p: Parada): PasoDeRuta => ({ tipo: "parada", parada: p });
const repaso = (r: Repaso): PasoDeRuta => ({ tipo: "repaso", repaso: r });

export const RUTA_A1: PasoDeRuta[] = [
  parada(PARADA_01),
  parada(PARADA_02),
  parada(PARADA_03),
  parada(PARADA_04),
  parada(PARADA_05),
  repaso(REPASO_1),
  parada(PARADA_06),
  parada(PARADA_07),
  parada(PARADA_08),
  parada(PARADA_09),
  parada(PARADA_10),
  repaso(REPASO_FINAL),
];

/**
 * A2 (Reino Unido), del documento "Contenido A2" aprobado el 17 de octubre
 * de 2026. Mientras no pase la revisión de la docente y la prueba, los
 * alumnos de A2 siguen en la ruta provisional; con RUTA_A2=1 se ve esta.
 */
const RUTA_A2: PasoDeRuta[] = [
  parada(A2_PARADA_01),
  parada(A2_PARADA_02),
  parada(A2_PARADA_03),
  parada(A2_PARADA_04),
  parada(A2_PARADA_05),
  repaso(A2_REPASO_1),
  parada(A2_PARADA_06),
  parada(A2_PARADA_07),
  parada(A2_PARADA_08),
  parada(A2_PARADA_09),
  parada(A2_PARADA_10),
  repaso(A2_REPASO_FINAL),
];

/**
 * B1 (Canadá), del documento "Contenido B1" aprobado el 17 y el 18 de
 * octubre de 2026. Como A2: mientras no pase la revisión de la docente
 * (con un nativo de Estados Unidos para el Repaso final) y la prueba, los
 * alumnos de B1 siguen en la ruta provisional; con RUTA_B1=1 se ve esta.
 */
const RUTA_B1: PasoDeRuta[] = [
  parada(B1_PARADA_01),
  parada(B1_PARADA_02),
  parada(B1_PARADA_03),
  parada(B1_PARADA_04),
  parada(B1_PARADA_05),
  repaso(B1_REPASO_1),
  parada(B1_PARADA_06),
  parada(B1_PARADA_07),
  parada(B1_PARADA_08),
  parada(B1_PARADA_09),
  parada(B1_PARADA_10),
  repaso(B1_REPASO_FINAL),
];

/**
 * Las tres rutas, estén abiertas o no: de su inglés sale el vocabulario
 * con el que la voz reconoce el inglés dentro de una frase en español
 * (src/lib/voz-idiomas.ts).
 */
export function todaLaRuta(): PasoDeRuta[] {
  return [...RUTA_A1, ...RUTA_A2, ...RUTA_B1];
}

/** La ruta de un nivel, o null si su contenido todavía no está escrito. */
export function rutaDe(nivel: Nivel): PasoDeRuta[] | null {
  if (nivel === "A1") return RUTA_A1;
  if (nivel === "A2" && process.env.RUTA_A2 === "1") return RUTA_A2;
  if (nivel === "B1" && process.env.RUTA_B1 === "1") return RUTA_B1;
  return null;
}

/**
 * La frase del botón Ayuda de cada tarea de un escenario. En A1, lo que
 * dice el alumno en el diálogo de ejemplo para cumplirla (si la tarea se
 * cumple con dos líneas, "R-O-J-A-S." y "It's 310 555 0198.", van las
 * dos). Desde A2, el comienzo de la frase aprobado ("I usually ___").
 */
export function ayudasDe(escenario: Escenario): string[] {
  if (escenario.ayudas?.length === escenario.tareas.length) return escenario.ayudas;
  return escenario.tareas.map((_, i) =>
    escenario.dialogo
      .filter((l) => l.quien === "alumno" && l.tarea === i + 1)
      .map((l) => l.dice)
      .join(" ")
  );
}
