import type { Nivel } from "./tipos.ts";

/**
 * La frase del día (plan, sección 10), desde el 24 de octubre de 2026:
 * una EXPRESIÓN de verdad, de las que usan los nativos en Estados Unidos
 * y que no se entienden traduciendo palabra por palabra ("It's a piece
 * of cake" no es "un pedazo de torta": es "es pan comido"). Antes salía
 * de las frases de las lecciones, que el alumno ya conocía.
 *
 * Cada una trae lo que significa (español colombiano, que sirva para un
 * muchacho o una muchacha), lo que NO significa (la traducción literal,
 * para que se note la diferencia) y un ejemplo del nivel. Las revisa la
 * docente (docs/CONTENIDO-*-POR-REVISAR.md).
 */
export interface Expresion {
  en: string;
  /** Lo que de verdad significa. */
  significa: string;
  /** La traducción palabra por palabra, que NO es lo que significa. */
  literal: string;
  /** Una frase del nivel que la usa. */
  ejemplo: string;
}

const A1: Expresion[] = [
  { en: "What's up?", significa: "¿Qué más? ¿Qué hubo?", literal: "¿Qué está arriba?", ejemplo: "Hi, Sam! What's up?" },
  { en: "It's a piece of cake.", significa: "Es pan comido: es muy fácil.", literal: "Es un pedazo de torta.", ejemplo: "The test was a piece of cake!" },
  { en: "Break a leg!", significa: "¡Mucha suerte! (antes de una presentación)", literal: "¡Rómpete una pierna!", ejemplo: "You have a concert today? Break a leg!" },
  { en: "I'm all ears.", significa: "Te escucho, cuéntame.", literal: "Soy todo orejas.", ejemplo: "Tell me about your weekend. I'm all ears!" },
  { en: "Hang out", significa: "Parchar: pasar el rato con amigos.", literal: "Colgar afuera.", ejemplo: "I hang out with my friends on Saturdays." },
  { en: "My bad!", significa: "¡Perdón, fue mi culpa!", literal: "¡Mi malo!", ejemplo: "Oops, I have your pen. My bad!" },
  { en: "Hit the books", significa: "Ponerse a estudiar.", literal: "Golpear los libros.", ejemplo: "I have a test tomorrow. I need to hit the books!" },
  { en: "Hit the sack", significa: "Irse a dormir.", literal: "Golpear el costal.", ejemplo: "It's ten o'clock. I'm going to hit the sack." },
  { en: "Cool!", significa: "¡Qué chévere!", literal: "¡Frío!", ejemplo: "You have a dog? Cool!" },
  { en: "Hang on!", significa: "¡Espera un momento!", literal: "¡Cuélgate!", ejemplo: "Hang on, I'm looking for my keys." },
  { en: "Take it easy.", significa: "Con calma, relájate.", literal: "Tómalo fácil.", ejemplo: "Don't worry about the game. Take it easy." },
  { en: "It's raining cats and dogs.", significa: "Está lloviendo muchísimo.", literal: "Llueve gatos y perros.", ejemplo: "Take an umbrella. It's raining cats and dogs!" },
  { en: "I'm beat.", significa: "Ya no doy más del cansancio.", literal: "Estoy golpeado.", ejemplo: "I played soccer for three hours. I'm beat!" },
  { en: "Couch potato", significa: "Alguien que pasa todo el día en el sofá viendo televisión.", literal: "Papa de sofá.", ejemplo: "On Sundays, my brother is a couch potato." },
  { en: "No way!", significa: "¡No puede ser!", literal: "¡Ningún camino!", ejemplo: "You have five cats? No way!" },
  { en: "Cut it out!", significa: "¡Ya basta, deja eso!", literal: "¡Córtalo!", ejemplo: "Stop kicking my chair. Cut it out!" },
  { en: "Big deal!", significa: "¿Y qué? No es para tanto.", literal: "¡Gran trato!", ejemplo: "I lost one game. Big deal!" },
  { en: "You bet!", significa: "¡Claro que sí!", literal: "¡Tú apuestas!", ejemplo: "Can you help me? You bet!" },
  { en: "Hop in!", significa: "¡Súbete! (al carro)", literal: "¡Brinca adentro!", ejemplo: "We can take you to school. Hop in!" },
  { en: "Grab a bite", significa: "Comer algo rápido.", literal: "Agarrar un mordisco.", ejemplo: "Let's grab a bite after class." },
  { en: "Sweet!", significa: "¡Qué bien! ¡Genial!", literal: "¡Dulce!", ejemplo: "We don't have homework today? Sweet!" },
  { en: "I'm on it.", significa: "Ya me encargo.", literal: "Estoy encima de eso.", ejemplo: "Can you clean the table? I'm on it!" },
  { en: "Same here.", significa: "Yo también.", literal: "Mismo aquí.", ejemplo: "I love pizza. Same here!" },
  { en: "Heads up!", significa: "¡Cuidado! ¡Ojo!", literal: "¡Cabezas arriba!", ejemplo: "Heads up! The ball is coming!" },
  { en: "Hang in there!", significa: "¡Ánimo, no te rindas!", literal: "¡Cuélgate ahí!", ejemplo: "The test is hard, but hang in there!" },
  { en: "It's up to you.", significa: "Tú decides.", literal: "Está hasta ti.", ejemplo: "Pizza or burgers? It's up to you." },
  { en: "Keep in touch!", significa: "¡Hablamos! No perdamos el contacto.", literal: "¡Mantente en toque!", ejemplo: "Bye, Ana! Keep in touch!" },
  { en: "Catch you later!", significa: "¡Nos vemos!", literal: "¡Te atrapo después!", ejemplo: "I have to go. Catch you later!" },
  { en: "I'm in!", significa: "¡Me apunto! ¡Cuenta conmigo!", literal: "¡Estoy adentro!", ejemplo: "A movie on Friday? I'm in!" },
  { en: "I'm stuffed!", significa: "¡No me cabe ni un bocado más!", literal: "¡Estoy relleno!", ejemplo: "No more pizza, thanks. I'm stuffed!" },
];

const A2: Expresion[] = [
  { en: "Once in a blue moon", significa: "Muy de vez en cuando, casi nunca.", literal: "Una vez en una luna azul.", ejemplo: "I eat sushi once in a blue moon." },
  { en: "It costs an arm and a leg.", significa: "Cuesta un ojo de la cara.", literal: "Cuesta un brazo y una pierna.", ejemplo: "This phone costs an arm and a leg!" },
  { en: "I'm under the weather.", significa: "No me siento bien de salud.", literal: "Estoy bajo el clima.", ejemplo: "I can't go to school today. I'm under the weather." },
  { en: "Let's call it a day.", significa: "Dejémoslo hasta aquí por hoy.", literal: "Llamémoslo un día.", ejemplo: "We worked a lot. Let's call it a day." },
  { en: "Spill the beans", significa: "Contar el secreto, soltar la sopa.", literal: "Derramar los fríjoles.", ejemplo: "Come on, spill the beans! What's the surprise?" },
  { en: "I'm on cloud nine.", significa: "Estoy súper feliz.", literal: "Estoy en la nube nueve.", ejemplo: "I passed my exam! I'm on cloud nine." },
  { en: "Pull someone's leg", significa: "Tomarle el pelo a alguien.", literal: "Jalarle la pierna a alguien.", ejemplo: "Relax, I'm just pulling your leg!" },
  { en: "Get the hang of it", significa: "Cogerle el tiro a algo.", literal: "Agarrar el colgado de eso.", ejemplo: "Skating is hard at first, but you'll get the hang of it." },
  { en: "Sleep on it", significa: "Consultarlo con la almohada.", literal: "Dormir sobre eso.", ejemplo: "I don't know which phone to buy. I'll sleep on it." },
  { en: "Hold your horses!", significa: "¡Espera, no te afanes!", literal: "¡Sujeta tus caballos!", ejemplo: "Hold your horses! The movie starts at eight." },
  { en: "Keep an eye on", significa: "Estar pendiente de algo.", literal: "Mantener un ojo en.", ejemplo: "Can you keep an eye on my bag, please?" },
  { en: "It's not my cup of tea.", significa: "No es lo mío, no me gusta mucho.", literal: "No es mi taza de té.", ejemplo: "Horror movies are not my cup of tea." },
  { en: "I have butterflies in my stomach.", significa: "Tengo muchos nervios. (En español suele ser de amor; en inglés, de nervios.)", literal: "Tengo mariposas en el estómago.", ejemplo: "I have a presentation today. I have butterflies in my stomach." },
  { en: "Easy does it.", significa: "Despacio, con cuidado.", literal: "Fácil lo hace.", ejemplo: "Easy does it! The box is heavy." },
  { en: "Out of the blue", significa: "De la nada, de repente.", literal: "Fuera del azul.", ejemplo: "My cousin called me out of the blue." },
  { en: "Feel blue", significa: "Sentirse triste.", literal: "Sentirse azul.", ejemplo: "I feel blue when it rains all day." },
  { en: "Give it a shot", significa: "Intentarlo.", literal: "Darle un disparo.", ejemplo: "I've never played tennis, but I'll give it a shot." },
  { en: "In a nutshell", significa: "En pocas palabras.", literal: "En una cáscara de nuez.", ejemplo: "In a nutshell, the movie was great." },
  { en: "It rings a bell.", significa: "Me suena.", literal: "Toca una campana.", ejemplo: "Mr. Brown? Hmm, that name rings a bell." },
  { en: "Make up your mind!", significa: "¡Decídete!", literal: "¡Inventa tu mente!", ejemplo: "Pizza or pasta? Make up your mind!" },
  { en: "I'm running late.", significa: "Se me hizo tarde.", literal: "Estoy corriendo tarde.", ejemplo: "Sorry, I'm running late! See you in ten minutes." },
  { en: "The ball is in your court.", significa: "Ahora te toca decidir a ti.", literal: "La pelota está en tu cancha.", ejemplo: "I said sorry. Now the ball is in your court." },
  { en: "Hit it off", significa: "Caerse bien desde el primer momento.", literal: "Golpearlo.", ejemplo: "I met Sara yesterday and we hit it off." },
  { en: "Know something by heart", significa: "Saberse algo de memoria.", literal: "Saber algo por corazón.", ejemplo: "I know this song by heart." },
  { en: "On the same page", significa: "De acuerdo, entendiendo lo mismo.", literal: "En la misma página.", ejemplo: "Before we start the project, let's get on the same page." },
  { en: "Have a blast", significa: "Pasarla súper bien, gozársela.", literal: "Tener una explosión.", ejemplo: "We had a blast at the party!" },
  { en: "Chill out!", significa: "¡Relájate, cálmate!", literal: "¡Enfríate afuera!", ejemplo: "Chill out! It's only a game." },
  { en: "I'm all thumbs.", significa: "Soy muy torpe con las manos.", literal: "Soy todo pulgares.", ejemplo: "Can you fix it? I'm all thumbs!" },
  { en: "Take a rain check", significa: "Dejarlo para otro día.", literal: "Tomar un cheque de lluvia.", ejemplo: "I can't go to the movies today. Can I take a rain check?" },
  { en: "Time to hit the road", significa: "Hora de irse.", literal: "Hora de golpear la carretera.", ejemplo: "It's late. Time to hit the road!" },
];

const B1: Expresion[] = [
  { en: "Bite off more than you can chew", significa: "Comprometerse con más de lo que puedes hacer.", literal: "Morder más de lo que puedes masticar.", ejemplo: "I joined three clubs, and I think I bit off more than I can chew." },
  { en: "Beat around the bush", significa: "Andarse con rodeos.", literal: "Golpear alrededor del arbusto.", ejemplo: "Stop beating around the bush and tell me what happened." },
  { en: "Let the cat out of the bag", significa: "Revelar un secreto sin querer.", literal: "Dejar salir al gato de la bolsa.", ejemplo: "We were planning a surprise party, but Leo let the cat out of the bag." },
  { en: "Cut corners", significa: "Hacer algo a la carrera y sin cuidado.", literal: "Cortar esquinas.", ejemplo: "If you cut corners on your homework, you'll make mistakes." },
  { en: "Get cold feet", significa: "Echarse para atrás por los nervios.", literal: "Tener los pies fríos.", ejemplo: "She wanted to sing in the show, but she got cold feet." },
  { en: "A blessing in disguise", significa: "No hay mal que por bien no venga.", literal: "Una bendición disfrazada.", ejemplo: "Missing the bus was a blessing in disguise: I met my best friend at the stop." },
  { en: "Miss the boat", significa: "Dejar pasar la oportunidad.", literal: "Perder el barco.", ejemplo: "The tickets sold out in an hour. We missed the boat." },
  { en: "Back to square one", significa: "Volver a empezar desde cero.", literal: "De vuelta al cuadro uno.", ejemplo: "The file didn't save, so we're back to square one." },
  { en: "The last straw", significa: "La gota que rebosó la copa.", literal: "La última pajita.", ejemplo: "He was late again. That was the last straw!" },
  { en: "Go the extra mile", significa: "Hacer más de lo que te piden.", literal: "Ir la milla extra.", ejemplo: "Our teacher always goes the extra mile for us." },
  { en: "Play it by ear", significa: "Improvisar sobre la marcha.", literal: "Tocarlo de oído.", ejemplo: "We don't have a plan for Saturday. Let's play it by ear." },
  { en: "Keep your chin up!", significa: "¡Ánimo, no te desanimes!", literal: "¡Mantén la barbilla arriba!", ejemplo: "You lost the game, but keep your chin up!" },
  { en: "Speak of the devil!", significa: "Hablando del rey de Roma…", literal: "¡Hablando del diablo!", ejemplo: "Speak of the devil! We were just talking about you." },
  { en: "It's not rocket science.", significa: "No es tan difícil.", literal: "No es ciencia de cohetes.", ejemplo: "Just follow the instructions. It's not rocket science." },
  { en: "Through thick and thin", significa: "En las buenas y en las malas.", literal: "A través de lo grueso y lo delgado.", ejemplo: "My best friend has been there for me through thick and thin." },
  { en: "Sit on the fence", significa: "No decidirse por ningún lado.", literal: "Sentarse en la cerca.", ejemplo: "You can't sit on the fence forever. Which team do you support?" },
  { en: "Have a lot on your plate", significa: "Tener muchas cosas por hacer.", literal: "Tener mucho en tu plato.", ejemplo: "I can't go out this weekend. I have a lot on my plate." },
  { en: "Burn the midnight oil", significa: "Trasnochar estudiando o trabajando.", literal: "Quemar el aceite de medianoche.", ejemplo: "I burned the midnight oil to finish my project." },
  { en: "Get something off your chest", significa: "Desahogarse.", literal: "Sacarse algo del pecho.", ejemplo: "Thanks for listening. I needed to get that off my chest." },
  { en: "Learn the ropes", significa: "Aprender cómo funciona algo.", literal: "Aprender las cuerdas.", ejemplo: "It's my first week at the job, so I'm still learning the ropes." },
  { en: "When pigs fly", significa: "Cuando las ranas críen pelo: nunca.", literal: "Cuando los cerdos vuelen.", ejemplo: "My brother will clean his room when pigs fly!" },
  { en: "Give someone a piece of your mind", significa: "Decirle a alguien sus cuatro verdades.", literal: "Darle a alguien un pedazo de tu mente.", ejemplo: "If he's late again, I'll give him a piece of my mind." },
  { en: "Up in the air", significa: "Todavía sin decidir.", literal: "Arriba en el aire.", ejemplo: "Our trip is still up in the air." },
  { en: "Face the music", significa: "Afrontar las consecuencias.", literal: "Enfrentar la música.", ejemplo: "I broke the window, so now I have to face the music." },
  { en: "On thin ice", significa: "En la cuerda floja.", literal: "Sobre hielo delgado.", ejemplo: "You've forgotten your homework three times. You're on thin ice!" },
  { en: "Break the bank", significa: "Costar demasiado, gastar una fortuna.", literal: "Romper el banco.", ejemplo: "A pizza with friends won't break the bank." },
  { en: "Hit the ground running", significa: "Empezar algo con toda la energía.", literal: "Golpear el suelo corriendo.", ejemplo: "The new captain hit the ground running and changed the team." },
  { en: "Cross that bridge when we come to it", significa: "Preocuparse por eso cuando llegue el momento.", literal: "Cruzar ese puente cuando lleguemos a él.", ejemplo: "What if it rains? We'll cross that bridge when we come to it." },
  { en: "Call it a night", significa: "Dar por terminada la noche e irse.", literal: "Llamarlo una noche.", ejemplo: "It's almost midnight. Let's call it a night." },
  { en: "Wrap your head around something", significa: "Lograr entender algo complicado.", literal: "Envolver tu cabeza alrededor de algo.", ejemplo: "I can't wrap my head around this math problem." },
];

/** Las expresiones del nivel: desde B1 se usan las de B1. */
function expresionesDe(nivel: Nivel): Expresion[] {
  return nivel === "A1" ? A1 : nivel === "A2" ? A2 : B1;
}

/** Todas, por nivel (para las pruebas y la lista de la docente). */
export const EXPRESIONES = { A1, A2, B1 } as const;

/** Días desde una fecha fija: el mismo número para todos el mismo día. */
function diaDe(fecha: string): number {
  return Math.floor(Date.parse(`${fecha}T12:00:00Z`) / 86_400_000);
}

/** La expresión de hoy: una distinta cada día, y no se repite hasta pasar por todas. */
export function expresionDelDia(nivel: Nivel, fecha: string): Expresion {
  const lista = expresionesDe(nivel);
  return lista[diaDe(fecha) % lista.length];
}
