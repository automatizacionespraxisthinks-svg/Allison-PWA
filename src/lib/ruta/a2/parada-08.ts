import type { Parada } from "../tipos.ts";

/**
 * Parada 8 · Brighton (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison (va a su ficha): cuando tiene gripa toma té caliente con
 *     miel y descansa mucho. Cuando está estresada, baila. No trabaja los
 *     fines de semana.
 *   · Ms. Evans: solo en este escenario; farmacéutica de una droguería en
 *     Brighton.
 *   · El alumno: llega a Brighton con gripa después del paseo en bote de
 *     Cambridge (parada 7).
 */
export const PARADA_08: Parada = {
  numero: 8,
  ciudad: "Brighton",
  titulo: "Di cómo te sientes",
  gramatica: "Should, have to y must",
  objetivo:
    'Al terminar, el alumno dice cómo se siente y qué le duele, y pide y da consejos: "I have a headache. You should rest." Gramática: should para aconsejar, have to para lo que es necesario y must para reglas escritas. Usa A1, las paradas 1 a 7 y el Repaso 1.',
  fraseMeta: "I have a headache. You should rest.",
  portada: "brighton",
  vocabulario: [
    {
      grupo: "Cómo te sientes",
      ingles: "I feel sick. I feel tired. I feel better. I'm stressed.",
      nota: "",
    },
    {
      grupo: "Qué te duele",
      ingles: "I have a headache, a stomachache, a sore throat, a cold, a fever, a cough. My back hurts.",
      nota: 'Con have: I have a headache, nunca "I am headache". A cold es la gripa',
    },
    {
      grupo: "Consejos",
      ingles: "You should rest. You should drink water. You shouldn't go to school.",
      nota: "Should para aconsejar; shouldn't, para aconsejar que no",
    },
    {
      grupo: "Lo necesario",
      ingles: "You have to take this twice a day. Do I have to see a doctor? You don't have to go.",
      nota: 'Have to para lo necesario. Don\'t have to es "no hace falta", no "está prohibido"',
    },
    {
      grupo: "Reglas escritas",
      ingles: "You must take it with food. You must not run.",
      nota: "Must se ve en etiquetas y avisos; al hablar, en Estados Unidos se dice have to o can't",
    },
    {
      grupo: "En la droguería",
      ingles: "drugstore, pharmacist, medicine, pills, cough drops, twice a day, every four hours",
      nota: "De Estados Unidos: drugstore (nunca chemist's) y cough drops",
    },
    {
      grupo: "Frases",
      ingles: "What's wrong? How do you feel? I hope you feel better!",
      nota: "",
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Qué te pasa?",
      objetivo: "Decir cómo te sientes y qué te duele.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "Ben doesn\'t feel well. He has a stomachache. He ate a lot of pizza last night!" (no está escrito). Elige entre tres imágenes de Ben: con dolor de estómago, con dolor de cabeza y con dolor de garganta.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["Ben doesn't feel well.", "He has a stomachache.", "He ate a lot of pizza last night!"],
          traduccion: ["Ben no se siente bien.", "Le duele el estómago.", "¡Anoche comió mucha pizza!"],
          pregunta: "¿Qué le pasa a Ben?",
          opciones: [
            { imagen: "f-ben-estomago", descripcion: "Ben con dolor de estómago", etiqueta: "A stomachache", etiquetaEs: "Dolor de estómago" },
            { imagen: "f-ben-cabeza", descripcion: "Ben con dolor de cabeza", etiqueta: "A headache", etiquetaEs: "Dolor de cabeza" },
            { imagen: "f-ben-garganta", descripcion: "Ben con dolor de garganta", etiqueta: "A sore throat", etiquetaEs: "Dolor de garganta" },
          ],
          correcta: 0,
          porRevisar: ["etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca a Ben con dolor de estómago"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de Priya en la cama con un termómetro. Allison: "Look at Priya. What\'s wrong with her?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Look at the thermometer." → "It starts with f." Sin pistas, Allison dice "She has a fever" y el alumno la repite. Si dice "She is fever": Para lo que tienes va has: she has a fever.',
          imagen: "f-priya-fiebre",
          pregunta: "Look at Priya. What's wrong with her?",
          contexto: "Mira a Priya. ¿Qué le pasa? Responde con una frase en inglés.",
          respuesta: "She has a fever.",
          aceptadas: ["has a fever", "is sick", "feels sick", "has a high temperature", "has a cold", "has the flu"],
          pistas: ["Look at the thermometer.", "It starts with f."],
          explicaciones: [
            { siDice: "She is fever", explicacion: "Para lo que tienes va has: she has a fever." },
          ],
          porRevisar: ["aceptadas: también «Priya has a fever», «She has a cold» y «She has the flu»; explicaciones: la del documento (Si dice…), que no estaba en los datos (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "I have a stomachache." Se practica la palabra stomachache.',
          siRespondeMal:
            'Si pronuncia la ch como en español: Escucha: stomachache. Suena "stómakeik": las dos ch suenan k. Say it: stomachache. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "I have a stomachache.",
          palabraDificil: "stomachache",
          consejo: 'Suena "stómakeik": las dos ch suenan k.',
        },
      ],
    },
    {
      numero: 2,
      titulo: "Deberías…",
      objetivo: "Dar consejos con should y shouldn't.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya says: "I have a terrible headache." Ben says: "You should drink some water and rest." (no está escrito). ¿Qué le aconseja Ben? Elige entre un vaso de agua, un helado y unos tenis.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya says: "I have a terrible headache."', 'Ben says: "You should drink some water and rest."'],
          traduccion: ['Priya dice: "Tengo un dolor de cabeza terrible."', 'Ben dice: "Deberías tomar un poco de agua y descansar."'],
          pregunta: "¿Qué le aconseja Ben?",
          opciones: [
            { imagen: "f-priya-agua-descanso", descripcion: "Priya descansando en el sofá con un vaso de agua", etiqueta: "Drink water and rest", etiquetaEs: "Tomar agua y descansar" },
            { imagen: "a1/f-helado", descripcion: "Un helado", etiqueta: "Eat ice cream", etiquetaEs: "Comer helado" },
            { imagen: "a1/f-tenis", descripcion: "Unos tenis", etiqueta: "Buy sneakers", etiquetaEs: "Comprar tenis" },
          ],
          correcta: 0,
          porRevisar: ["opciones: la correcta es un dibujo nuevo, Priya descansando en el sofá con un vaso de agua (f-priya-agua-descanso); f-vaso-agua era otra muchacha sudada después de hacer deporte (cambio del 30 de octubre de 2026)", "etiquetas: como suenan en la frase; al elegir una opción, Allison la dice (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "Tienes gripa. Deberías quedarte en casa." Las palabras de apoyo aparecen después del primer fallo: you, have, a cold, should, stay, home.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "You should to stay": Después de should va el verbo solo: you should stay. Si dice "You are cold": Eso es tener frío. La gripa se tiene: you have a cold. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "Tienes gripa. Deberías quedarte en casa.",
          respuesta: "You have a cold. You should stay home.",
          aceptadas: ["You have a cold. You should stay at home.", "You have the flu. You should stay home."],
          palabras: ["You", "have", "a", "cold.", "You", "should", "stay", "home."],
          explicaciones: [
            { siDice: "You should to stay", explicacion: "Después de should va el verbo solo: you should stay." },
            { siDice: "You are cold", explicacion: "Eso es tener frío. La gripa se tiene: you have a cold." },
          ],
          porRevisar: [
            'palabras: el documento trae "you" una sola vez y "a cold" junto; aquí van las palabras de la respuesta, una por una ("You" dos veces)',
          ],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me what you do when you feel sick." Preguntas guía: What do you have to do? What should you eat or drink? Who takes care of you?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I have to staying in bed" → Después de have to va el verbo solo: I have to stay in bed. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me what you do when you feel sick.",
          guias: ["What do you have to do?", "What should you eat or drink?", "Who takes care of you?"],
          modelo:
            "When I feel sick, I have to stay in bed. My mom makes chicken soup and I drink a lot of water. I shouldn't go to school with a fever. I have to rest and sleep a lot.",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Tienes que…",
      objetivo: "Decir qué es necesario con have to y entender reglas con must.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: The pharmacist says: "Take one pill twice a day. You must take it with food." (no está escrito). Elige entre tres tarjetas dibujadas por la app: "1 pill · 2 times a day · with food", "2 pills · 1 time a day · with food" y "1 pill · 2 times a day · no food".',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['The pharmacist says: "Take one pill twice a day. You must take it with food."'],
          traduccion: ['La farmacéutica dice: "Toma una pastilla dos veces al día. Tienes que tomarla con comida."'],
          pregunta: "¿Cómo se toma la medicina?",
          opciones: [
            { texto: "1 pill · twice a day", descripcion: "La tarjeta: una pastilla, dos veces al día", etiqueta: "One pill, twice a day", etiquetaEs: "1 pastilla, 2 veces al día" },
            { texto: "2 pills · once a day", descripcion: "La tarjeta: dos pastillas, una vez al día", etiqueta: "Two pills, once a day", etiquetaEs: "2 pastillas, 1 vez al día" },
            { texto: "3 pills · at night", descripcion: "La tarjeta: tres pastillas en la noche", etiqueta: "Three pills at night", etiquetaEs: "3 pastillas en la noche" },
          ],
          correcta: 0,
          porRevisar: ["opciones: tarjetas cortas y bien distintas, con «twice a day» como se oye (antes «2 times a day», y la tercera solo cambiaba «with food» por «no food»). Cada tarjeta suena al elegirla (cambio del 30 de octubre de 2026)", "audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'pregunta: el documento no la escribe; sale de "Toca \'1 pill · 2 times a day · with food\'"',
          ],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'El letrero de una piscina con tres dibujos: una ducha, una persona corriendo tachada y una persona comiendo en el agua tachada. Allison: "Tell me 3 rules at this pool." Debajo: "You have to ___.", "You must not ___.", "You can\'t ___." y take a shower, run, eat in the pool.',
          siRespondeMal:
            'Si dice "You must not to run", Allison repite bien la frase (You must not run.) y el alumno la dice. Si nombra menos de 3, Allison señala la ducha y pregunta "What do you have to do first?".',
          imagen: "f-reglas-piscina",
          pregunta: "Tell me 3 rules at this pool.",
          plantillas: ["You have to ___.", "You must not ___.", "You can't ___."],
          palabrasAyuda: ["take a shower", "run", "eat in the pool"],
          modelo: ["You have to take a shower.", "You must not run.", "You can't eat in the pool."],
          aceptadas: ["You can't run.", "You must not eat in the water.", "Take a shower first."],
          cosas: ["shower", "run", "running", "eat", "eating", "food"],
          minimo: 3,
          porRevisar: [
            'cosas: el documento no las nombra; salen de los tres dibujos del letrero (sin "pool" ni "water", que no son reglas)',
          ],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: What do you have to do every morning? Do you have to wear a uniform at school? What should I do when I'm tired? What do you do when you have a headache? Do you have to help at home?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien: "Yes, I do." "Sleep." "Water." Allison sugiere la frase completa',
          // El documento da seis frases para cinco preguntas ("Una frase a
          // cada una"): "Yes, I do." y "We have to wear a uniform." van juntas
          // en la del uniforme.
          preguntas: [
            { pregunta: "What do you have to do every morning?", modelo: "I have to get up at six." },
            { pregunta: "Do you have to wear a uniform at school?", modelo: "Yes, I do. We have to wear a uniform." },
            { pregunta: "What should I do when I'm tired?", modelo: "You should go to bed early." },
            { pregunta: "What do you do when you have a headache?", modelo: "I drink water and rest." },
            { pregunta: "Do you have to help at home?", modelo: "Yes, I have to wash the dishes." },
          ],
          aceptadas: ["Yes, I do.", "Sleep.", "Water."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "¿Cómo te cuidas, Allison?",
      objetivo: "Preguntar por hábitos y consejos con have to y should.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "When I\'m stressed, I dance! Music always helps." (no está escrito). Elige entre una muchacha bailando, una mujer cocinando y una mujer caminando en un parque.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["When I'm stressed, I dance!", "Music always helps."],
          traduccion: ["Cuando estoy estresada, ¡bailo!", "La música siempre ayuda."],
          pregunta: "¿Qué hace Allison cuando está estresada?",
          opciones: [
            { imagen: "a1/f-bailar", descripcion: "Una muchacha bailando", etiqueta: "Dance", etiquetaEs: "Bailar" },
            { imagen: "a1/f-mujer-cocina", descripcion: "Una mujer cocinando", etiqueta: "Cook", etiquetaEs: "Cocinar" },
            { imagen: "a1/f-mujer-parque", descripcion: "Una mujer caminando en un parque", etiqueta: "Walk in the park", etiquetaEs: "Caminar en el parque" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca a la muchacha bailando"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'El dibujo de Ben con dolor de garganta (el de la lección 1). Allison: "Ben has a sore throat. Give him some advice!"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "What\'s good for a sore throat?" → "Hot tea is good for a sore throat." → "Start with: You should…" Sin pistas, Allison dice "You should drink hot tea" y el alumno la repite. Si dice "You should to rest": Después de should va el verbo solo: you should rest.',
          tambienSeAcepta: "Cualquier consejo con should que tenga sentido: You should rest. You should stay home. You shouldn't eat ice cream. No vale \"should to\".",
          imagen: "f-ben-garganta",
          pregunta: "Ben has a sore throat. Give him some advice!",
          contexto: "A Ben le duele la garganta. Dale un consejo en inglés.",
          respuesta: "You should drink hot tea.",
          aceptadas: ["should drink tea", "should drink hot", "should drink water", "should drink some tea", "should drink some water", "should rest", "should stay home", "should stay in bed", "should sleep", "should go to bed", "should go to the doctor", "should see a doctor", "should take medicine", "shouldn't eat ice cream", "shouldn't drink cold", "shouldn't talk", "shouldn't go to school"],
          pistas: ["What's good for a sore throat?", "Hot tea is good for a sore throat.", "Start with: You should…"],
          explicaciones: [
            { siDice: "should to", explicacion: "Después de should va el verbo solo: you should rest." },
          ],
          porRevisar: ["aceptadas: los consejos comunes valen sin pasar por el modelo (no gastan y no fallan); la regla dice que «should to» no vale; pista de en medio con una idea; explicaciones: la del documento (Si dice…), que no estaba en los datos (cambio del 30 de octubre de 2026)"],
        },
        {
          paso: 3,
          tipo: "entrevista",
          queAparece:
            'Ficha de cómo se cuida Allison, con cinco datos por descubrir: qué hace cuando tiene gripa, qué hace cuando está estresada, a qué hora tiene que levantarse, si tiene que trabajar los fines de semana y qué aconseja para aprender inglés. Arma cada pregunta; las palabras de ayuda aparecen después del primer fallo. Al acertar, el dato se llena, Allison responde y le devuelve la pregunta ("And you?"). Mínimo 10 intervenciones.',
          siRespondeMal:
            "Allison: ¿Qué quieres saber? ¿Si trabajo los fines de semana? Say: Do you have to work on weekends? Hay un botón de ayuda con la pregunta escrita.",
          ficha: "cómo se cuida Allison",
          // Las respuestas sí están en el documento ("Respuestas de Allison":
          // la hora de levantarse sale de su ficha; lo demás, de los datos nuevos).
          datos: [
            {
              dato: "Qué hace cuando tiene gripa",
              pregunta: "What do you do when you have a cold?",
              respuesta: "I drink hot tea with honey and I rest a lot.",
            },
            {
              dato: "Qué hace cuando está estresada",
              pregunta: "What do you do when you're stressed?",
              respuesta: "I dance! Music always helps.",
            },
            { dato: "A qué hora tiene que levantarse", pregunta: "What time do you have to get up?", respuesta: "I have to get up at 6:30." },
            {
              dato: "Si tiene que trabajar los fines de semana",
              pregunta: "Do you have to work on weekends?",
              respuesta: "No, I don't. On Saturdays I visit Emily!",
            },
            {
              dato: "Qué aconseja para aprender inglés",
              pregunta: "What should I do to learn English?",
              respuesta: "You should practice every day. Talk to me!",
            },
          ],
          aceptadas: ["When you have a cold?", "You work on Saturday?", "How I learn English?"],
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "When you have a cold?", "You work on Saturday?", "How I learn English?"',
          ayuda: "¿Qué quieres saber? ¿Si trabajo los fines de semana? Say: Do you have to work on weekends?",
          minimoIntervenciones: 10,
        },
      ],
    },
  ],
  escenario: {
    titulo: "Vas a la droguería en Brighton",
    imagen: "e-brighton-drogueria",
    contexto:
      "Llegaste a Brighton y amaneciste enfermo: ayer te mojaste en el paseo en bote de Cambridge. Vas a la droguería y te atiende Ms. Evans, la farmacéutica (Allison en su papel).",
    personaje: "Ms. Evans, la farmacéutica de una droguería en Brighton",
    objetivo: "Decir cómo se siente y qué le duele, pedir consejo y entender cómo tomar la medicina",
    tareas: [
      "Saluda y di cómo te sientes.",
      "Cuenta qué te duele y desde cuándo.",
      "Pregunta qué deberías hacer.",
      "Pregunta cada cuánto tienes que tomar la medicina.",
      "Paga y agradécele.",
    ],
    // La tarea 2 (qué te duele y desde cuándo) se cumple con dos líneas: el
    // documento solo marca la del "desde cuándo"; la de qué le duele también
    // lleva el 2.
    dialogo: [
      { quien: "personaje", dice: "Good morning! How can I help you?" },
      { quien: "alumno", dice: "Good morning. I don't feel well.", tarea: 1 },
      { quien: "personaje", dice: "Oh, I'm sorry. What's wrong?" },
      { quien: "alumno", dice: "I have a sore throat and a headache.", tarea: 2 },
      { quien: "personaje", dice: "When did it start?" },
      { quien: "alumno", dice: "Yesterday. I was on a boat in Cambridge and I got wet.", tarea: 2 },
      { quien: "personaje", dice: "I see. Do you have a fever?" },
      { quien: "alumno", dice: "No, I don't. But I feel very tired." },
      { quien: "personaje", dice: "OK. You probably have a cold." },
      { quien: "alumno", dice: "What should I do?", tarea: 3 },
      { quien: "personaje", dice: "You should rest and drink a lot of water. And take these cough drops for your throat." },
      { quien: "alumno", dice: "How often do I have to take them?", tarea: 4 },
      { quien: "personaje", dice: "One every four hours. You must not take more than six a day." },
      { quien: "alumno", dice: "OK. Do I have to see a doctor?" },
      { quien: "personaje", dice: "Not now. But if you have a fever, you have to see a doctor." },
      { quien: "alumno", dice: "I understand. How much are the cough drops?" },
      { quien: "personaje", dice: "They're five pounds." },
      { quien: "alumno", dice: "Here you go. Thank you for your help!", tarea: 5 },
      { quien: "personaje", dice: "You're welcome. I hope you feel better soon!" },
      { quien: "alumno", dice: "Thanks! Bye!" },
    ],
    resumen: "¡Lo lograste! Dijiste en inglés cómo te sientes y entendiste los consejos de la farmacéutica.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Brighton en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like Brighton" → It\'s a beautiful city! But how do you feel today?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "What should I ___?"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"Me duele la garganta" → En inglés: I have a sore throat. Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"I am headache" → la escena sigue; en el resumen: Para lo que te duele: I have a headache.',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "Rest a lot, and I hope you feel better! Vamos a repasar should y have to, y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    ayudas: ["I feel ___", "I have a ___", "What should I ___?", "How often do I have to ___?", "Thank you for ___"],
  },
  ilustraciones: [
    {
      archivos: ["brighton"],
      muestra: "Portada de la ciudad: el muelle con sus juegos, la playa de piedras y casas de colores",
      uso: "Portada de la parada",
    },
    {
      archivos: ["e-brighton-drogueria"],
      muestra: "Una droguería con estantes y un mostrador; por la ventana, la playa y el muelle",
      uso: "Escenario",
    },
    {
      archivos: ["f-ben-estomago", "f-ben-cabeza", "f-ben-garganta"],
      muestra: "Ben con dolor de estómago, con dolor de cabeza y con dolor de garganta",
      uso: "Lección 1 (paso 1); el de la garganta también en la lección 4 (paso 2)",
    },
    { archivos: ["f-priya-fiebre"], muestra: "Priya en la cama con un termómetro", uso: "Lección 1 (paso 2)" },
    {
      archivos: ["f-priya-agua-descanso", "a1/f-helado", "a1/f-tenis"],
      muestra: "Priya descansando en el sofá con un vaso de agua (nueva, 30 de octubre de 2026), un helado y unos tenis (de A1)",
      uso: "Lección 2 (paso 1)",
    },
    {
      archivos: ["f-reglas-piscina"],
      muestra: "El letrero de una piscina: una ducha, una persona corriendo tachada y una persona comiendo en el agua tachada",
      uso: "Lección 3 (paso 2)",
    },
    {
      archivos: ["a1/f-bailar", "a1/f-mujer-cocina", "a1/f-mujer-parque"],
      muestra: "Una muchacha bailando, una mujer cocinando y una mujer caminando en un parque (de A1)",
      uso: "Lección 4 (paso 1)",
    },
  ],
};
