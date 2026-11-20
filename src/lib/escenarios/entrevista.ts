import type { Escenario } from "../ruta/tipos.ts";
import type { Nivel } from "../tipos.ts";

/**
 * La entrevista de trabajo (pedido del usuario, 18 de noviembre de 2026):
 * un escenario que está en TODOS los niveles, con una versión para cada
 * uno. Lo que se le pregunta a un A1 ("What can you do?") no se parece a
 * lo que se le pregunta a un C1 ("Tell me about a time you disagreed with
 * your manager"), y por eso no cabe en el catálogo, que tiene un solo
 * guion por escenario.
 *
 * El alumno elige el cargo entre unos ya escritos o escribe el suyo. La
 * entrevista es la misma para cualquier cargo -- las preguntas de una
 * entrevistadora de recursos humanos casi no cambian --; el cargo entra
 * en el contexto y en las líneas que lo nombran. Para los más jóvenes
 * (colegios) hay un primer empleo y una beca de intercambio: en la beca
 * cambian las preguntas que hablan de trabajo, sueldo y clientes.
 *
 * Allison es Ms. Carter, la entrevistadora: una mujer, como pide la regla
 * de una sola voz. No corrige durante la entrevista; los errores van al
 * resumen y al informe final (src/lib/escenarios/informe.ts).
 *
 * POR REVISAR: tareas, diálogos, frases de preparación y consejos se
 * escribieron para esta función, en inglés de Estados Unidos y siguiendo
 * la plantilla de los escenarios del catálogo (6 o 7 tareas, diálogo de
 * ejemplo de 10 intervenciones del alumno). Los revisa la docente.
 */

/** La ilustración de la oficina (public/ilustraciones/a1), hecha con Gemini el 18 de noviembre de 2026. */
export const IMAGEN_ENTREVISTA = "c-entrevista";

export const NIVELES_ENTREVISTA: Nivel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface Cargo {
  /** "call-center", o "otro" si lo escribió el alumno. */
  clave: string;
  /** Como lo ve el alumno: "Agente de call center bilingüe". */
  es: string;
  /** Como lo dice Ms. Carter. Sin esto (cargo escrito por el alumno) dice "this position". */
  en?: string;
  /** Una beca: no hay sueldo, clientes ni jefe. */
  beca?: boolean;
  /** Pensado para quien no ha trabajado (colegios): va primero en esas cuentas. */
  juvenil?: boolean;
}

export const CARGOS: Cargo[] = [
  { clave: "call-center", es: "Agente de call center bilingüe", en: "bilingual call center agent" },
  { clave: "recepcion", es: "Recepcionista de hotel", en: "hotel receptionist" },
  { clave: "mesero", es: "Mesero o mesera", en: "server" },
  { clave: "barista", es: "Barista", en: "barista" },
  { clave: "ventas", es: "Vendedor o vendedora en una tienda", en: "sales associate" },
  { clave: "asistente", es: "Asistente administrativo", en: "administrative assistant" },
  { clave: "primer-empleo", es: "Mi primer empleo (medio tiempo)", en: "part-time assistant", juvenil: true },
  { clave: "beca", es: "Beca de intercambio", en: "exchange scholarship", beca: true, juvenil: true },
];

/** El largo máximo del cargo que escribe el alumno. */
export const CARGO_MAX = 40;

/**
 * El cargo que escribió el alumno, limpio: solo letras, números, espacios y
 * guiones, sin espacios de más. Va dentro de las instrucciones del modelo,
 * así que no puede traer signos con los que se escriba otra instrucción.
 */
export function limpiarCargo(texto: string): string {
  return texto
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} \-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CARGO_MAX)
    .trim();
}

/** "entrevista:call-center" o "entrevista:otro:Diseñador gráfico". */
export function claveDeEntrevista(cargo: Cargo): string {
  return cargo.clave === "otro" ? `entrevista:otro:${cargo.es}` : `entrevista:${cargo.clave}`;
}

export const esEntrevista = (clave: string) => clave.startsWith("entrevista:");

/** El cargo de una clave, o null si no es una entrevista que exista. */
export function cargoDeClave(clave: string): Cargo | null {
  if (!esEntrevista(clave)) return null;
  const resto = clave.slice("entrevista:".length);
  if (resto.startsWith("otro:")) {
    const es = limpiarCargo(resto.slice(5));
    return es.length >= 3 ? { clave: "otro", es } : null;
  }
  return CARGOS.find((c) => c.clave === resto) ?? null;
}

/** Para la dirección de la página: "call-center" u "otro-Diseñador gráfico". */
export function rutaDeCargo(cargo: Cargo): string {
  return cargo.clave === "otro" ? `otro-${cargo.es}` : cargo.clave;
}

export function cargoDeRuta(ruta: string): Cargo | null {
  return cargoDeClave(ruta.startsWith("otro-") ? `entrevista:otro:${ruta.slice(5)}` : `entrevista:${ruta}`);
}

/** Los cargos en el orden en que se muestran: en un colegio, primero los de quien no ha trabajado. */
export function cargosPara(deColegio: boolean): Cargo[] {
  return deColegio ? [...CARGOS.filter((c) => c.juvenil), ...CARGOS.filter((c) => !c.juvenil)] : CARGOS;
}

type Linea = Escenario["dialogo"][number];
const ella = (dice: string): Linea => ({ quien: "personaje", dice });
const el = (dice: string, tarea?: number): Linea => (tarea ? { quien: "alumno", dice, tarea } : { quien: "alumno", dice });

interface Version {
  tareas: string[];
  dialogo: Linea[];
  imprevisto?: Escenario["imprevisto"];
}

/**
 * La versión de un nivel para un cargo. `t(trabajo, beca)` elige el texto
 * según sea un trabajo o la beca.
 */
function version(nivel: Nivel, cargo: Cargo): Version {
  const beca = !!cargo.beca;
  const t = (trabajo: string, deBeca: string) => (beca ? deBeca : trabajo);

  if (nivel === "A1") {
    return {
      tareas: [
        "Saluda y di tu nombre.",
        "Di cuántos años tienes y de dónde eres.",
        "Di qué sabes hacer.",
        t("Di qué días puedes trabajar.", "Di qué te gusta estudiar."),
        "Hazle una pregunta a la entrevistadora.",
        "Da las gracias y despídete.",
      ],
      dialogo: [
        ella("Good morning! I'm Ms. Carter. What's your name?"),
        el("Good morning! My name is Diego.", 1),
        ella("Nice to meet you, Diego. How are you today?"),
        el("I'm fine, thank you."),
        ella("How old are you?"),
        el("I'm eighteen years old.", 2),
        ella("Where are you from?"),
        el("I'm from Colombia.", 2),
        ella("Great. What can you do?"),
        el("I can speak Spanish and I can use a computer.", 3),
        ella("Good! Do you like working with people?"),
        el("Yes, I do. I like people."),
        ella(t("What days can you work?", "What do you like to study?")),
        el(t("I can work from Monday to Friday.", "I like English and math."), 4),
        ella(t("Can you start next week?", "Can you travel in January?")),
        el("Yes, I can."),
        ella("Do you have any questions for me?"),
        el(t("Yes. What time do I start?", "Yes. When does it start?"), 5),
        ella(t("You start at eight in the morning. Thank you for coming, Diego!", "It starts in January. Thank you for coming, Diego!")),
        el("Thank you very much! Goodbye!", 6),
      ],
    };
  }

  if (nivel === "A2") {
    return {
      tareas: [
        "Saluda y preséntate.",
        "Cuenta qué estudias o qué estudiaste.",
        t("Cuenta en qué trabajaste o qué hiciste antes.", "Cuenta qué actividades hiciste en el colegio."),
        t("Di por qué quieres este trabajo.", "Di por qué quieres esta beca."),
        t("Di cuándo puedes empezar y en qué horario.", "Di cuándo puedes viajar."),
        t("Pregunta algo sobre el trabajo.", "Pregunta algo sobre el programa."),
        "Da las gracias y despídete.",
      ],
      dialogo: [
        ella("Good afternoon! Thanks for coming. I'm Ms. Carter. Please, tell me your name."),
        el("Good afternoon! I'm Diego Rojas. Nice to meet you.", 1),
        ella("Nice to meet you too. What do you study, Diego?"),
        el("I finished high school last year, and now I'm studying English.", 2),
        ella(t("Did you work before?", "What activities did you do at school?")),
        el(t("Yes. Last year I worked in a store for six months.", "I was in the science club, and I played on the soccer team."), 3),
        ella(t("What did you do there?", "What did you learn there?")),
        el(t("I helped the customers and I worked at the cash register.", "I learned to work in a team.")),
        ella(t("Why do you want this job?", "Why do you want this scholarship?")),
        el(t("Because I like helping people, and I want to learn more.", "Because I want to study in another country and improve my English."), 4),
        ella("What are you good at?"),
        el("I'm good at working with people. I'm also very organized."),
        ella(t("When can you start?", "When can you travel?")),
        el(t("I can start next Monday. I can work in the mornings.", "I can travel in January. I finish school in December."), 5),
        ella("Great. Do you have any questions?"),
        el(t("Yes. How many hours is the job each week?", "Yes. How long is the program?"), 6),
        ella(t("It's forty hours a week.", "It's six months.")),
        el("That sounds good."),
        ella("We'll call you this week. Thank you for your time!"),
        el("Thank you very much. Have a nice day!", 7),
      ],
    };
  }

  if (nivel === "B1") {
    const linea = "I'll be honest with you: we have other candidates with more experience. Why should we choose you?";
    return {
      tareas: [
        "Saluda y cuenta quién eres en pocas frases.",
        "Cuenta tu experiencia con un ejemplo.",
        "Di una fortaleza tuya y algo que quieres mejorar.",
        "Hay otros candidatos con más experiencia: explica por qué deberían elegirte a ti.",
        t("Di qué harías si un cliente estuviera molesto.", "Di qué harías si tuvieras un problema lejos de casa."),
        "Pregunta por los siguientes pasos del proceso.",
        "Agradece la entrevista y despídete.",
      ],
      imprevisto: {
        despuesDeTarea: 3,
        tarea: 4,
        texto:
          'Después de la tarea 3, Ms. Carter es directa: hay otros candidatos con más experiencia. Ahí aparece la tarea 4: "Hay otros candidatos con más experiencia: explica por qué deberían elegirte a ti."',
        linea,
      },
      dialogo: [
        ella("Good morning, and thank you for coming in. I'm Ms. Carter. So, tell me a little about yourself."),
        el("Good morning! I'm Diego. I'm twenty years old, I live in Bucaramanga, and I've studied English for two years.", 1),
        ella(t("Have you worked with customers before?", "Have you ever had a lot of responsibility at home or at school?")),
        el(
          t(
            "Yes, I have. I worked in a clothing store for a year. For example, I helped customers find what they needed.",
            "Yes, I have. I've taken care of my younger brother for two years. For example, I cook and help him with his homework."
          ),
          2
        ),
        ella("What did you learn from that?"),
        el("I learned to be patient and to listen carefully."),
        ella("What is your biggest strength, and what would you like to improve?"),
        el("I'm very responsible, and I learn fast. I'd like to improve my public speaking.", 3),
        ella(linea),
        el(t("Because I work hard, and I really want to grow with this company.", "Because I work hard, and I'll make the most of this opportunity."), 4),
        ella(t("What would you do if a customer were angry?", "What would you do if you had a problem far from home?")),
        el(t("I would stay calm, listen to the problem, and try to find a solution.", "I would stay calm, ask for help, and try to find a solution."), 5),
        ella("Good answer. Where do you see yourself in two years?"),
        el(t("I'd like to have more responsibility and keep improving my English.", "I'd like to finish my studies and use what I learned abroad.")),
        ella("Do you have any questions for me?"),
        el("Yes. What are the next steps in the process?", 6),
        ella("We'll contact you by Friday."),
        el("Great. I'm really interested in this opportunity."),
        ella("Thank you for your time, Diego."),
        el("Thank you for the interview. Have a great day!", 7),
      ],
    };
  }

  if (nivel === "B2") {
    const linea = t(
      "Before we go on: I see a gap of several months in your résumé. Can you tell me about that?",
      "Before we go on: I see your grades dropped for one semester. Can you tell me what happened?"
    );
    return {
      tareas: [
        "Preséntate y resume tu perfil en pocas frases.",
        "Cuenta un logro: la situación, lo que hiciste y el resultado.",
        t("Explica por qué te interesan este cargo y esta empresa.", "Explica por qué te interesa este programa."),
        t("Explica el vacío de varios meses en tu hoja de vida.", "Explica por qué bajaron tus notas un semestre."),
        t("Habla de tus expectativas de salario.", "Explica cómo vas a cubrir tus gastos personales."),
        t("Pregunta por las oportunidades de crecimiento.", "Pregunta qué apoyo reciben los estudiantes al llegar."),
        "Cierra reafirmando tu interés y despídete.",
      ],
      imprevisto: {
        despuesDeTarea: 3,
        tarea: 4,
        texto: t(
          'Después de la tarea 3, Ms. Carter nota un vacío de varios meses en tu hoja de vida. Ahí aparece la tarea 4: "Explica el vacío de varios meses en tu hoja de vida."',
          'Después de la tarea 3, Ms. Carter nota que tus notas bajaron un semestre. Ahí aparece la tarea 4: "Explica por qué bajaron tus notas un semestre."'
        ),
        linea,
      },
      dialogo: [
        ella(t("Thanks for joining us today. I'm Ms. Carter, the hiring manager. To start, could you walk me through your background?", "Thanks for joining us today. I'm Ms. Carter, from the selection committee. To start, could you walk me through your background?")),
        el(
          t(
            "Sure. I have two years of experience in customer service, and I've recently finished an English certificate. I'm someone who enjoys solving problems.",
            "Sure. I'm in my last year of high school, I'm one of the top students in my class, and I volunteer as a tutor. I'm someone who enjoys solving problems."
          ),
          1
        ),
        ella("Tell me about an achievement you're proud of."),
        el(
          t(
            "At my last job, we were getting a lot of complaints about slow service. I suggested a new way to organize the orders, and within two months the complaints went down by half.",
            "My school didn't have a reading club, so I started one. I organized weekly meetings, and after six months we had forty members."
          ),
          2
        ),
        ella(t("How did your team react to that change?", "How did the other students react?")),
        el("At first, some people weren't convinced, but once they saw the results, they supported it."),
        ella(t("Why are you interested in this role, and in our company?", "Why are you interested in this program?")),
        el(
          t(
            "I've been following your company for a while, and I like how much you invest in training. This role would let me use my experience and keep growing.",
            "I've read a lot about this program, and I like its focus on leadership. It would let me grow and bring new ideas back home."
          ),
          3
        ),
        ella(linea),
        el(
          t(
            "Of course. I took those months to take care of a family member, and I used the time to improve my English.",
            "Of course. My mother was sick that semester, so I had to help at home. My grades went back up the following term."
          ),
          4
        ),
        ella(t("I appreciate your honesty. What are your salary expectations?", "I appreciate your honesty. The scholarship doesn't cover everything. How would you pay for your personal expenses?")),
        el(
          t(
            "Based on my experience, I'm looking for something between two and two and a half million pesos, but I'm open to discussing it.",
            "I've been saving for a year, and my family will help with the rest."
          ),
          5
        ),
        ella("That's reasonable. How do you handle pressure?"),
        el("I make a list of priorities and focus on one thing at a time. It helps me stay calm."),
        ella("Do you have any questions for me?"),
        el(t("Yes. What opportunities for growth does the team offer?", "Yes. What kind of support do students get when they arrive?"), 6),
        ella(t("Good question. We usually promote people from inside the team.", "Good question. Each student has a mentor for the first semester.")),
        el("That's great to hear."),
        ella("We'll be in touch soon."),
        el(t("Thank you. I'm very interested in this position, and I look forward to hearing from you.", "Thank you. I'm very interested in this program, and I look forward to hearing from you."), 7),
      ],
    };
  }

  if (nivel === "C1") {
    const linea = "Let me push back a little. Tell me about a decision of yours that didn't work out. What would you do differently?";
    return {
      tareas: [
        "Preséntate destacando lo que te distingue de otros candidatos.",
        t("Cuenta una vez que no estuviste de acuerdo con un jefe o un compañero y cómo lo manejaste.", "Cuenta una vez que no estuviste de acuerdo con un profesor o un compañero y cómo lo manejaste."),
        "Explica cómo motivas a otras personas.",
        "Cuenta una decisión tuya que salió mal y qué harías distinto.",
        t("Negocia una condición del cargo (salario, horario o trabajo remoto) con diplomacia.", "Explica qué le vas a aportar al programa y a los demás estudiantes."),
        t("Haz una pregunta que muestre que entiendes los retos del cargo.", "Haz una pregunta que muestre que entiendes los retos del programa."),
        "Cierra con una frase convincente y despídete.",
      ],
      imprevisto: {
        despuesDeTarea: 3,
        tarea: 4,
        texto:
          'Después de la tarea 3, Ms. Carter te lleva la contraria y pide un fracaso. Ahí aparece la tarea 4: "Cuenta una decisión tuya que salió mal y qué harías distinto."',
        linea,
      },
      dialogo: [
        ella("Thanks for making the time. I'm Ms. Carter. We've seen a lot of strong candidates, so tell me: what sets you apart?"),
        el(
          t(
            "I'd say it's the combination of hands-on experience and curiosity. I've worked directly with customers for years, but I've also taken the initiative to redesign processes that weren't working.",
            "I'd say it's the combination of discipline and curiosity. I've kept my grades up, but I've also taken the initiative to start projects that didn't exist at my school."
          ),
          1
        ),
        ella(t("Tell me about a time you disagreed with your manager.", "Tell me about a time you disagreed with a teacher.")),
        el(
          t(
            "My manager wanted to cut our response time by removing a quality check. I disagreed, so I asked for a private meeting, showed him the numbers, and proposed a middle ground. He agreed to try it for a month.",
            "My teacher wanted our group to present a topic I thought was too broad. I asked to speak with her after class, explained my concerns, and proposed a narrower angle. She agreed to let us try it."
          ),
          2
        ),
        ella("And how did that turn out?"),
        el("It worked better than either of us had expected, and it actually strengthened our relationship."),
        ella("What did you take away from that experience?"),
        el("That disagreeing respectfully is a skill, and that numbers persuade better than opinions."),
        ella("How do you keep people motivated when things get difficult?"),
        el("I try to make sure everyone understands why their work matters, and I give credit in public. People put in more effort when they feel seen.", 3),
        ella(linea),
        el(
          t(
            "I once launched a new schedule without consulting the team first, and it backfired. In hindsight, I should have involved them from the beginning, which is exactly what I do now.",
            "I once organized an event without consulting the other volunteers first, and hardly anyone showed up. In hindsight, I should have involved them from the beginning, which is exactly what I do now."
          ),
          4
        ),
        ella(t("Fair enough. The role is fully on-site. Is that a problem?", "Fair enough. Why should we invest in you rather than someone else?")),
        el(
          t(
            "I understand the need to be present, especially at the start. Would you be open to one remote day a week once I've settled in? I'd be happy to revisit it after the first three months.",
            "Because I won't keep what I learn to myself. I plan to mentor younger students and share everything I can with the rest of the group."
          ),
          5
        ),
        ella(t("That's something we could discuss. What questions do you have for me?", "I like that. What questions do you have for me?")),
        el(t("What would you say is the biggest challenge the team is facing right now?", "What would you say is the biggest challenge students face in their first semester?"), 6),
        ella(t("Honestly, keeping quality high while we grow this fast.", "Honestly, adapting to a very different way of studying.")),
        el("That's precisely the kind of challenge I enjoy."),
        ella("Well, it's been a pleasure talking to you."),
        el(t("Likewise. I'm convinced I could make a real contribution here, and I'd love the chance to prove it. Thank you, and have a great day.", "Likewise. I'm convinced I could make a real contribution to this program, and I'd love the chance to prove it. Thank you, and have a great day."), 7),
      ],
    };
  }

  // C2
  const linea = t(
    "I'll be frank: the budget for this role is about fifteen percent below what you're asking. Where does that leave us?",
    "I'll be frank: we can only fund half of what you'd need. Where does that leave us?"
  );
  return {
    tareas: [
      "Preséntate en menos de un minuto, como en una entrevista ejecutiva.",
      t("Explica cómo recuperarías en noventa días un equipo que no da resultados.", "Explica cómo aprovecharías los primeros noventa días del programa."),
      "Responde a una objeción escéptica sin ponerte a la defensiva.",
      t("La oferta está por debajo de lo que pides: negocia sin romper la relación.", "Solo pueden financiar la mitad: negocia sin romper la relación."),
      "Explica cómo actuarías ante un dilema ético.",
      "Haz una pregunta estratégica sobre el futuro de la organización.",
      "Cierra la entrevista dejando una impresión memorable.",
    ],
    imprevisto: {
      despuesDeTarea: 3,
      tarea: 4,
      texto: t(
        'Después de la tarea 3, Ms. Carter pone las cartas sobre la mesa: el presupuesto está quince por ciento por debajo. Ahí aparece la tarea 4: "La oferta está por debajo de lo que pides: negocia sin romper la relación."',
        'Después de la tarea 3, Ms. Carter pone las cartas sobre la mesa: solo pueden financiar la mitad. Ahí aparece la tarea 4: "Solo pueden financiar la mitad: negocia sin romper la relación."'
      ),
      linea,
    },
    dialogo: [
      ella("I appreciate you coming in. I'm Ms. Carter. I've read your file, so skip the résumé: who are you, in under a minute?"),
      el(
        t(
          "I'm someone who turns messy situations into working systems. Over the past few years I've taken struggling teams, figured out what was actually broken, and rebuilt them around a clear goal.",
          "I'm someone who turns ideas into things that actually happen. Over the past few years I've started projects from scratch, figured out what was missing, and brought people together around a clear goal."
        ),
        1
      ),
      ella(t("Suppose I hand you a team that's been underperforming for a year. What do your first ninety days look like?", "Suppose we give you the place. What do your first ninety days look like?")),
      el(
        t(
          "I'd spend the first month listening rather than changing anything, because the obvious diagnosis is rarely the right one. By day sixty I'd have two or three quick wins, and by ninety, a plan the team itself had helped write.",
          "I'd spend the first month listening rather than rushing in, because first impressions are rarely the whole picture. By day sixty I'd have joined two or three initiatives, and by ninety, I'd be leading one of my own."
        ),
        2
      ),
      ella("And if people resist?"),
      el("Then I'd find the two people everyone else listens to and win them over first. Change travels faster through peers than through managers."),
      ella("That sounds neat on paper. Frankly, I've heard that plan before, and it rarely survives contact with reality."),
      el("You're right to be skeptical; plans rarely do. What I'm really offering isn't the plan, it's the habit of adjusting it early, before small problems turn into expensive ones.", 3),
      ella(linea),
      el(
        t(
          "I appreciate you being upfront. The number matters to me, but it isn't the only thing on the table. If we could agree on a review at six months tied to specific results, I'd be comfortable starting at your figure.",
          "I appreciate you being upfront. The funding matters to me, but it isn't the only thing on the table. If you could cover the tuition, I could raise the rest through a part-time job and my family."
        ),
        4
      ),
      ella("I can work with that. One last thing: what would you do if you were asked to do something you thought was wrong?"),
      el("I'd raise it privately first, on the assumption that I might be missing context. If I weren't, I'd put my concerns in writing, because I'd rather lose an argument than my integrity.", 5),
      ella("Has that ever cost you something?"),
      el("Once, yes. I lost a client over it, and I'd make the same call again."),
      ella("Understood. Is there anything you'd like to ask me?"),
      el("Yes. Where do you want this organization to be in five years, and what's most likely to get in the way?", 6),
      ella("We want to double in size without losing what makes us good. The risk is growing faster than we can train people."),
      el("That tension between growth and quality is exactly where I do my best work."),
      ella("I can see that. Thank you, this has been a refreshing conversation."),
      el("Thank you. Whatever you decide, I've genuinely enjoyed the challenge, and I hope we get to continue it.", 7),
    ],
  };
}

/** El contexto de la escena, en español: lo ve el alumno y lo lee el modelo. */
function contextoDe(cargo: Cargo): string {
  if (cargo.beca) return "Te presentas a una beca de intercambio para estudiar en Estados Unidos. Ms. Carter, del comité de selección, te entrevista.";
  const nombre = cargo.clave === "otro" ? `el cargo «${cargo.es}»` : `el cargo de ${cargo.es.charAt(0).toLowerCase()}${cargo.es.slice(1)}`;
  const enIngles = cargo.en ? ` (en inglés, "${cargo.en}")` : "";
  return `Tienes una entrevista de trabajo para ${nombre}${enIngles}. Ms. Carter, de recursos humanos, te entrevista.`;
}

/** La entrevista de un nivel para un cargo, lista para la escena. */
export function escenarioDeEntrevista(nivel: Nivel, cargo: Cargo): Escenario {
  const v = version(nivel, cargo);
  return {
    titulo: cargo.beca ? "Entrevista para la beca" : "Entrevista de trabajo",
    imagen: IMAGEN_ENTREVISTA,
    contexto: contextoDe(cargo),
    personaje: cargo.beca ? "Ms. Carter, la entrevistadora del comité de becas" : "Ms. Carter, la entrevistadora de recursos humanos",
    objetivo: v.tareas.join(" "),
    tareas: v.tareas,
    dialogo: v.dialogo,
    ...(v.imprevisto ? { imprevisto: v.imprevisto } : {}),
    resumen: cargo.beca ? "¡Lo lograste! Terminaste tu entrevista para la beca en inglés." : "¡Lo lograste! Terminaste tu entrevista de trabajo en inglés.",
    recompensa: "Hasta 3 estrellas en Escenarios. La puedes repetir con otro cargo.",
    siSeAtasca: [],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
  };
}

/** Lo que se muestra antes de empezar: qué frases le sirven y dos o tres consejos. */
export interface Preparacion {
  frases: { en: string; es: string }[];
  consejos: string[];
}

const CONSEJOS_BASE = [
  "Saluda al empezar y da las gracias al terminar: es lo primero y lo último que la entrevistadora recuerda.",
  "No hace falta hablar perfecto. Responde con frases cortas y completas.",
];

const PREPARACION: Record<Nivel, Preparacion> = {
  A1: {
    frases: [
      { en: "Good morning! My name is…", es: "¡Buenos días! Me llamo…" },
      { en: "I'm … years old.", es: "Tengo … años." },
      { en: "I'm from Colombia.", es: "Soy de Colombia." },
      { en: "I can use a computer.", es: "Sé usar el computador." },
      { en: "I can work from Monday to Friday.", es: "Puedo trabajar de lunes a viernes." },
      { en: "Thank you very much!", es: "¡Muchas gracias!" },
    ],
    consejos: [...CONSEJOS_BASE, "Para decir lo que sabes hacer, empieza con «I can…»."],
  },
  A2: {
    frases: [
      { en: "Nice to meet you.", es: "Mucho gusto." },
      { en: "I finished high school last year.", es: "Terminé el colegio el año pasado." },
      { en: "I worked in a store for six months.", es: "Trabajé en una tienda seis meses." },
      { en: "Because I want to learn more.", es: "Porque quiero aprender más." },
      { en: "I'm good at working with people.", es: "Se me da bien trabajar con la gente." },
      { en: "I can start next Monday.", es: "Puedo empezar el próximo lunes." },
    ],
    consejos: [...CONSEJOS_BASE, "Lo que ya pasó va en pasado: «I worked», «I studied», «I learned»."],
  },
  B1: {
    frases: [
      { en: "I've studied English for two years.", es: "He estudiado inglés durante dos años." },
      { en: "For example, I helped customers find what they needed.", es: "Por ejemplo, ayudaba a los clientes a encontrar lo que necesitaban." },
      { en: "I'm very responsible, and I learn fast.", es: "Soy muy responsable y aprendo rápido." },
      { en: "I'd like to improve my public speaking.", es: "Me gustaría mejorar al hablar en público." },
      { en: "I would stay calm and try to find a solution.", es: "Mantendría la calma y trataría de encontrar una solución." },
      { en: "What are the next steps in the process?", es: "¿Cuáles son los siguientes pasos del proceso?" },
    ],
    consejos: [...CONSEJOS_BASE, "Cuando cuentes tu experiencia, da un ejemplo: empieza con «For example…».", "Puede haber una pregunta que no esperas. Respira y responde con calma."],
  },
  B2: {
    frases: [
      { en: "I have two years of experience in…", es: "Tengo dos años de experiencia en…" },
      { en: "I suggested a new way to…, and within two months…", es: "Propuse una nueva forma de…, y en dos meses…" },
      { en: "This role would let me use my experience and keep growing.", es: "Este cargo me permitiría usar mi experiencia y seguir creciendo." },
      { en: "Based on my experience, I'm looking for something between… and…", es: "Por mi experiencia, busco algo entre… y…" },
      { en: "I'm open to discussing it.", es: "Lo podemos conversar." },
      { en: "I look forward to hearing from you.", es: "Espero su respuesta." },
    ],
    consejos: [
      "Cuenta tus logros en tres pasos: la situación, lo que hiciste y el resultado, con una cifra si la tienes.",
      "Si te preguntan por un punto débil de tu hoja de vida, explícalo en una frase y di qué hiciste con ese tiempo.",
      "Del salario, da un rango y di que lo pueden conversar.",
    ],
  },
  C1: {
    frases: [
      { en: "I'd say it's the combination of… and…", es: "Diría que es la combinación de… y…" },
      { en: "I asked for a private meeting and proposed a middle ground.", es: "Pedí una reunión en privado y propuse un punto medio." },
      { en: "In hindsight, I should have…", es: "Viéndolo en retrospectiva, debí…" },
      { en: "Would you be open to…?", es: "¿Estarían abiertos a…?" },
      { en: "I'd be happy to revisit it after the first three months.", es: "Con gusto lo revisamos después de los primeros tres meses." },
      { en: "I'm convinced I could make a real contribution here.", es: "Tengo la certeza de que puedo aportar de verdad aquí." },
    ],
    consejos: [
      "Al contar un desacuerdo, muestra cómo lo resolviste sin hablar mal de nadie.",
      "Te van a pedir un fracaso: elige uno real y termina con lo que haces distinto ahora.",
      "Para negociar, pregunta en vez de exigir: «Would you be open to…?».",
    ],
  },
  C2: {
    frases: [
      { en: "I'm someone who turns… into…", es: "Soy alguien que convierte… en…" },
      { en: "I'd spend the first month listening rather than changing anything.", es: "Dedicaría el primer mes a escuchar, antes que a cambiar algo." },
      { en: "You're right to be skeptical.", es: "Tiene razón en dudar." },
      { en: "It isn't the only thing on the table.", es: "No es lo único que está sobre la mesa." },
      { en: "I'd raise it privately first.", es: "Primero lo plantearía en privado." },
      { en: "That tension is exactly where I do my best work.", es: "En esa tensión es justo donde mejor trabajo." },
    ],
    consejos: [
      "Ante una objeción, primero concede algo («You're right to be skeptical») y luego reencuadra.",
      "Al negociar, abre otras variables además de la cifra: una revisión a seis meses, responsabilidades, tiempos.",
      "Cierra con una frase tuya, no con una fórmula: es lo que se va a recordar.",
    ],
  },
};

export const preparacionDe = (nivel: Nivel): Preparacion => PREPARACION[nivel];
