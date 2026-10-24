import type { Parada } from "../tipos.ts";

/**
 * Parada 9 · Bath (A2). Documento "Contenido A2", aprobada el 17 de
 * octubre de 2026. Las ilustraciones propias de A2 viven en
 * public/ilustraciones/a2; las de A1 que se reutilizan llevan "a1/".
 *
 * Datos nuevos del documento (aprobados el 17 de octubre de 2026):
 *   · Allison (solo en la lección 4, paso 1): quiere un suéter nuevo para
 *     diciembre porque en Nueva York hace mucho frío (sale de su ficha:
 *     diciembre es su mes favorito). No pasa a su ficha.
 *   · Grace: solo en este escenario, vendedora de una tienda de ropa en Bath.
 *   · El alumno: llega a Bath con 50 pounds; compra un suéter azul talla M
 *     en oferta y dos pares de medias de lana.
 */
export const PARADA_09: Parada = {
  numero: 9,
  ciudad: "Bath",
  titulo: "Compra y pregunta precios",
  gramatica: "Much, many, some y any",
  objetivo:
    'Al terminar, el alumno compra ropa y pregunta tallas y precios: "How much is this? Do you have it in a medium?" Gramática: much, many, some y any, y How much / How many. Usa A1, las paradas 1 a 8 y el Repaso 1.',
  fraseMeta: "How much is this? Do you have it in a medium?",
  portada: "bath",
  vocabulario: [
    {
      grupo: "Ropa",
      ingles: "sweater, T-shirt, jacket, pants, jeans, sneakers, socks, cap, dress",
      nota: "De Estados Unidos: sweater (nunca jumper), pants (nunca trousers), sneakers (nunca trainers)",
    },
    {
      grupo: "Tallas y colores",
      ingles: "small, medium, large. Do you have it in a medium? Do you have it in blue?",
      nota: "",
    },
    {
      grupo: "Precios",
      ingles: "How much is this sweater? How much are these socks? It's twenty pounds. They're six pounds.",
      nota: "Is con una cosa, are con varias. En el Reino Unido se paga en pounds",
    },
    {
      grupo: "Much y many",
      ingles: "How much money do you have? How many T-shirts do you want? I don't have much money. There aren't many sizes.",
      nota: "Much con lo que no se cuenta (money, time, water); many con lo que se cuenta (T-shirts, socks). En frases afirmativas se dice a lot of: I have a lot of T-shirts",
    },
    {
      grupo: "Some y any",
      ingles: "I'd like some socks. Do you have any blue jackets? We don't have any small ones.",
      nota: "Some al afirmar y al pedir; any en preguntas y negativas",
    },
    {
      grupo: "En la tienda",
      ingles: "fitting room, on sale, cash, card, receipt. Can I try it on? It fits!",
      nota: "De Estados Unidos: fitting room (nunca changing room)",
    },
    {
      grupo: "Frases",
      ingles: "I'm looking for a sweater. I'll take it. It's too big.",
      nota: '"I\'ll take it" es el will de la parada 5',
    },
  ],
  lecciones: [
    {
      numero: 1,
      titulo: "¿Cuánto cuesta?",
      objetivo: "Preguntar precios y entender las respuestas.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya asks: "How much are these sneakers?" The salesclerk says: "They\'re forty pounds." (no está escrito). Elige entre tres tarjetas dibujadas por la app: £40, £14 y £44.',
          siRespondeMal:
            "Se repite el diálogo despacio y elige otra vez. Si tocó £14: Forty tiene la fuerza al principio: FÓR-ty; fourteen, al final: four-TÉEN.",
          quienHabla: "Allison",
          audio: ['Priya asks: "How much are these sneakers?"', 'The salesclerk says: "They\'re forty pounds."'],
          traduccion: ['Priya pregunta: "¿Cuánto cuestan estos tenis?"', 'La vendedora dice: "Cuestan cuarenta libras."'],
          pregunta: "¿Cuánto cuestan los tenis?",
          opciones: [
            { texto: "£40", descripcion: "Una tarjeta con el precio £40" },
            { texto: "£14", descripcion: "Una tarjeta con el precio £14" },
            { texto: "£44", descripcion: "Una tarjeta con el precio £44" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion", 'pregunta: el documento no la escribe; sale de "Toca £40"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece: 'Dibujo de una chaqueta negra con una etiqueta de £30. Allison: "You like this jacket. Ask me the price!"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "You want to know the price." → "Start with: How much…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "How many is this jacket?": Para precios: how much.',
          imagen: "f-ropa-chaqueta",
          pregunta: "You like this jacket. Ask me the price!",
          contexto: "Te gusta esta chaqueta. Pregunta cuánto cuesta, en inglés.",
          respuesta: "How much is this jacket?",
          aceptadas: ["How much is it?", "How much does it cost?", "How much is the jacket?"],
          pistas: ["You want to know the price.", "Start with: How much…"],
        },
        {
          paso: 3,
          tipo: "repite",
          queAparece: 'Audio de Allison: "I\'d like some new clothes." Se practica la palabra clothes.',
          siRespondeMal:
            'Si dice "clo-thes" en dos sílabas: Escucha: clothes. Es una sílaba, "clóuz": la th casi no se oye. Say it: clothes. Luego la frase completa.',
          tambienSeAcepta: "Pequeñas fallas en el resto de la frase",
          frase: "I'd like some new clothes.",
          palabraDificil: "clothes",
          consejo: 'Es una sílaba, "clóuz": la th casi no se oye.',
        },
      ],
    },
    {
      numero: 2,
      titulo: "Much y many",
      objetivo: "Usar much con lo que no se cuenta y many con lo que se cuenta.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Priya says: "I\'d like some socks, please. Do you have any red ones?" (no está escrito). ¿Qué quiere comprar Priya? Elige entre unas medias rojas, una gorra y un suéter.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Priya says: "I\'d like some socks, please. Do you have any red ones?"'],
          traduccion: ['Priya dice: "Quisiera unas medias, por favor. ¿Tienen unas rojas?"'],
          pregunta: "¿Qué quiere comprar Priya?",
          opciones: [
            { imagen: "f-ropa-medias", descripcion: "Unas medias rojas", etiqueta: "Medias rojas" },
            { imagen: "f-ropa-gorra", descripcion: "Una gorra", etiqueta: "Gorra" },
            { imagen: "f-ropa-sueter", descripcion: "Un suéter", etiqueta: "Suéter" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", "traduccion"],
        },
        {
          paso: 2,
          tipo: "dilo",
          queAparece:
            'Frase en español: "No tengo mucho dinero. ¿Cuántas camisetas hay en oferta?" Las palabras de apoyo aparecen después del primer fallo: I, don\'t, have, much, money, how many, T-shirts, are, on sale.',
          siRespondeMal:
            'Se marca la primera palabra que falla. Si dice "many money": El dinero no se cuenta: much money. Si dice "How much T-shirts": Las camisetas se cuentan: how many T-shirts. Al segundo fallo dice la frase completa y el alumno la repite.',
          espanol: "No tengo mucho dinero. ¿Cuántas camisetas hay en oferta?",
          respuesta: "I don't have much money. How many T-shirts are on sale?",
          aceptadas: ["I don't have a lot of money. How many T-shirts are on sale?"],
          palabras: ["I", "don't", "have", "much", "money.", "How", "many", "T-shirts", "are", "on", "sale?"],
          explicaciones: [
            { siDice: "many money", explicacion: "El dinero no se cuenta: much money." },
            { siDice: "How much T-shirts", explicacion: "Las camisetas se cuentan: how many T-shirts." },
          ],
          porRevisar: ['palabras: el documento junta "how many" y "on sale"; aquí van palabra por palabra, como en la respuesta'],
        },
        {
          paso: 3,
          tipo: "cuentame",
          queAparece:
            'Allison: "Tell me about your favorite clothes." Preguntas guía: What clothes do you like? How many sneakers do you have? Where do you buy clothes?',
          siRespondeMal:
            'Una cosa que hizo bien y una por mejorar. Ejemplo: "I don\'t have much sneakers" → Los tenis se cuentan: I don\'t have many sneakers. Si habló menos de 20 segundos, una pregunta guía para seguir.',
          tambienSeAcepta: "Cualquier relato de 20 segundos o más, en inglés, con 3 frases o más que se entienden",
          tema: "Tell me about your favorite clothes.",
          guias: ["What clothes do you like?", "How many sneakers do you have?", "Where do you buy clothes?"],
          modelo:
            "My favorite clothes are my blue sweater and my old jeans. I don't have many sneakers, only two pairs. I buy clothes at the mall with my mom, but we don't spend much money.",
          segundos: 30,
          minimoSegundos: 20,
          minimoFrases: 3,
        },
      ],
    },
    {
      numero: 3,
      titulo: "Some y any",
      objetivo: "Pedir y preguntar en la tienda con some y any.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: Ben asks: "Do you have any blue jackets?" The salesclerk says: "Sorry, we don\'t have any blue ones. We have some black ones." (no está escrito). ¿De qué color hay chaquetas? Elige entre tres tarjetas de color dibujadas por la app: negro, azul y rojo.',
          siRespondeMal: "Se repite el diálogo despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ['Ben asks: "Do you have any blue jackets?"', 'The salesclerk says: "Sorry, we don\'t have any blue ones. We have some black ones."'],
          traduccion: ['Ben pregunta: "¿Tienen chaquetas azules?"', 'La vendedora dice: "Lo siento, no tenemos azules. Tenemos unas negras."'],
          pregunta: "¿De qué color hay chaquetas?",
          opciones: [
            { texto: "BLACK", descripcion: "Una tarjeta de color negro" },
            { texto: "BLUE", descripcion: "Una tarjeta de color azul" },
            { texto: "RED", descripcion: "Una tarjeta de color rojo" },
          ],
          correcta: 0,
          porRevisar: ["audio: ahora lo cuenta Allison, la única voz de la app (cambio del 17 de octubre de 2026)", 
            "traduccion",
            'opciones: el documento pide tarjetas de color dibujadas por la app; el texto de cada tarjeta ("BLACK", "BLUE", "RED") no está escrito',
          ],
        },
        {
          paso: 2,
          tipo: "describe",
          queAparece:
            'La vitrina de una tienda de ropa con el letrero "SALE": unos pocos suéteres, muchas camisetas, unas gorras y un gancho vacío con el letrero "Jackets". Allison: "Tell me 3 things about the store window." Debajo: "There are some ___.", "There are a lot of ___.", "There aren\'t any ___." y sweaters, T-shirts, caps, jackets.',
          siRespondeMal:
            'Si dice "There aren\'t some jackets", Allison repite bien la frase (There aren\'t any jackets.) y el alumno la dice. Si nombra menos de 3, Allison señala el gancho vacío y pregunta "Are there any jackets?".',
          imagen: "f-vitrina-bath",
          pregunta: "Tell me 3 things about the store window.",
          plantillas: ["There are some ___.", "There are a lot of ___.", "There aren't any ___."],
          palabrasAyuda: ["sweaters", "T-shirts", "caps", "jackets"],
          modelo: ["There are some sweaters.", "There are a lot of T-shirts.", "There aren't any jackets."],
          aceptadas: ["There are some caps.", "There are many T-shirts.", "There are no jackets."],
          cosas: ["sweater", "T-shirt", "cap", "jacket"],
          minimo: 3,
          porRevisar: ["cosas: el documento no las nombra; salen de las palabras de ayuda y de las frases modelo"],
        },
        {
          paso: 3,
          tipo: "responde",
          queAparece:
            "Cinco preguntas con quince segundos: How much is a soda in your town? How many brothers and sisters do you have? Do you have any pets? How much time do you spend on your phone? What clothes would you like to buy?",
          siRespondeMal: "Se muestra una respuesta modelo y la pregunta vuelve al final.",
          tambienSeAcepta: 'Respuestas cortas que responden bien: "Three thousand pesos." "One." "No." Allison sugiere la frase completa',
          preguntas: [
            { pregunta: "How much is a soda in your town?", modelo: "It's about three thousand pesos." },
            { pregunta: "How many brothers and sisters do you have?", modelo: "I have one brother." },
            { pregunta: "Do you have any pets?", modelo: "No, I don't have any pets." },
            { pregunta: "How much time do you spend on your phone?", modelo: "I spend a lot of time on my phone." },
            { pregunta: "What clothes would you like to buy?", modelo: "I'd like some new sneakers." },
          ],
          aceptadas: ["Three thousand pesos.", "One.", "No."],
          segundos: 15,
        },
      ],
    },
    {
      numero: 4,
      titulo: "¿Qué compré?",
      objetivo: "Preguntar con Is it…? y Did you buy any…? hasta adivinar.",
      actividades: [
        {
          paso: 1,
          tipo: "escucha-elige",
          queAparece:
            'Allison cuenta: "I\'d like a new sweater for December. New York is very cold!" (no está escrito). Elige entre un suéter, una camiseta y una gorra.',
          siRespondeMal: "Se repite el audio despacio y elige otra vez.",
          quienHabla: "Allison",
          audio: ["I'd like a new sweater for December.", "New York is very cold!"],
          traduccion: ["Quisiera un suéter nuevo para diciembre.", "¡En Nueva York hace mucho frío!"],
          pregunta: "¿Qué quiere Allison para diciembre?",
          opciones: [
            { imagen: "f-ropa-sueter", descripcion: "Un suéter", etiqueta: "Suéter" },
            { imagen: "f-ropa-camiseta", descripcion: "Una camiseta", etiqueta: "Camiseta" },
            { imagen: "f-ropa-gorra", descripcion: "Una gorra", etiqueta: "Gorra" },
          ],
          correcta: 0,
          porRevisar: ["traduccion", 'pregunta: el documento no la escribe; sale de "Toca el suéter"'],
        },
        {
          paso: 2,
          tipo: "que-es-esto",
          queAparece:
            'Dibujo de una muchacha con un vestido en la mano frente al probador. Allison: "She likes the dress. What does she ask?"',
          siRespondeMal:
            'Pistas en inglés, una a la vez: "Look at the fitting room." → "Start with: Can I try…" Sin pistas, Allison dice la frase y el alumno la repite. Si dice "Can I try on it?": Con it, on va al final: can I try it on?',
          imagen: "f-probador",
          pregunta: "She likes the dress. What does she ask?",
          contexto: "A ella le gusta el vestido y está frente al probador. ¿Qué pregunta? Dilo en inglés.",
          respuesta: "Can I try it on?",
          aceptadas: ["Can I try on this dress?", "Can I try this dress on?", "Can I try it?"],
          pistas: ["Look at the fitting room.", "Start with: Can I try…"],
        },
        // La tabla de respuestas es la del documento, tal cual. Lo que el
        // documento agrega y no tiene campo propio: "Did you buy many?" vale
        // como "Did you buy a lot of them?" (va en aceptadas); una pregunta
        // fuera de la tabla recibe "Hmm, I can't answer that one. Ask me
        // another question!" (ya lo hace adivina.ts). Al adivinar las
        // medias, Allison dice "Yes! I bought five pairs!" (alAdivinar).
        {
          paso: 3,
          tipo: "adivina",
          queAparece:
            'Seis tarjetas con dibujo de ropa: sweater, T-shirt, jacket, sneakers, socks y cap. Allison: "I bought something at the store. Ask me yes or no questions and guess!" Dos rondas (jacket y socks, en orden al azar).',
          siRespondeMal:
            'Si no es de sí o no ("What did you buy?"): Allison, "That\'s a secret! Ask me: Is it…? Did you buy…?". Al segundo intento fallido se ilumina la ayuda con una pregunta de ejemplo. Si adivina mal: "No! Ask me more."',
          tambienSeAcepta: 'Cualquier pregunta que se entienda: "For your feet?", "Did you buy many?", "Expensive?"',
          apertura: "I bought something at the store. Ask me yes or no questions and guess!",
          opciones: [
            { nombre: "a sweater", imagen: "f-ropa-sueter" },
            { nombre: "a T-shirt", imagen: "f-ropa-camiseta" },
            { nombre: "a jacket", imagen: "f-ropa-chaqueta" },
            { nombre: "sneakers", imagen: "a1/f-tenis" },
            { nombre: "socks", imagen: "f-ropa-medias" },
            { nombre: "a cap", imagen: "f-ropa-gorra" },
          ],
          rondas: ["a jacket", "socks"],
          preguntas: [
            { pregunta: "Is it for your feet?", si: ["sneakers", "socks"] },
            { pregunta: "Did you buy any shoes?", si: ["sneakers"] },
            { pregunta: "Is it for your head?", si: ["a cap"] },
            { pregunta: "Is it for cold weather?", si: ["a sweater", "a jacket"] },
            { pregunta: "Was it expensive?", si: ["a jacket", "sneakers"] },
            { pregunta: "Did you buy a lot of them?", si: ["socks"] },
            { pregunta: "Can you wear it at the beach?", si: ["a T-shirt", "a cap"] },
          ],
          adivinar: "Did you buy {x}?",
          secreto: "That's a secret! Ask me: Is it…? Did you buy…?",
          alAdivinar: { socks: "Yes! I bought five pairs!" },
          aceptadas: ["For your feet?", "Did you buy many?", "Expensive?"],
          porRevisar: [
            'opciones: los nombres llevan "a" ("a sweater", "a T-shirt", "a jacket", "a cap") para que "Did you buy {x}?" sirva con las seis tarjetas; el encabezado de la tabla los trae sin artículo',
          ],
        },
      ],
    },
  ],
  escenario: {
    titulo: "Compras ropa en Bath",
    imagen: "e-bath-tienda",
    contexto:
      "En Bath hace más frío de lo que pensabas y necesitas ropa abrigada. Tienes 50 pounds. En una tienda te atiende Grace, la vendedora (Allison en su papel).",
    personaje: "Grace, la vendedora de una tienda de ropa en Bath",
    objetivo: "Pedir ropa, preguntar tallas, colores y precios, y pagar sin pasarse de 50 pounds",
    tareas: [
      "Saluda y di qué buscas.",
      "Pregunta si lo tienen en otro color o talla.",
      "Pregunta el precio.",
      "Pregunta si tienen algo más con any.",
      "Paga.",
    ],
    dialogo: [
      { quien: "personaje", dice: "Hi! Can I help you?" },
      { quien: "alumno", dice: "Hi! Yes, please. I'm looking for a sweater.", tarea: 1 },
      { quien: "personaje", dice: "Sure! How much do you want to spend?" },
      { quien: "alumno", dice: "Not much. I only have fifty pounds." },
      { quien: "personaje", dice: "No problem. What size are you?" },
      { quien: "alumno", dice: "I'm a medium." },
      { quien: "personaje", dice: "How about this green one?" },
      { quien: "alumno", dice: "It's nice! Do you have it in blue?", tarea: 2 },
      { quien: "personaje", dice: "Yes, we do. Here you go. Would you like to try it on?" },
      { quien: "alumno", dice: "Yes, please. Where's the fitting room?" },
      { quien: "personaje", dice: "It's over there, on the left." },
      { quien: "alumno", dice: "It fits! How much is it?", tarea: 3 },
      { quien: "personaje", dice: "It's thirty-five pounds, but it's on sale today. It's only thirty!" },
      { quien: "alumno", dice: "Great! Do you have any warm socks?", tarea: 4 },
      { quien: "personaje", dice: "Yes, we have some wool socks. They're six pounds." },
      { quien: "alumno", dice: "I'd like two pairs, please." },
      { quien: "personaje", dice: "OK. That's forty-two pounds. Cash or card?" },
      { quien: "alumno", dice: "Cash. Here you go.", tarea: 5 },
      { quien: "personaje", dice: "Thank you! Here's your receipt. Enjoy Bath!" },
      { quien: "alumno", dice: "Thanks! Bye!" },
    ],
    resumen: "¡Lo lograste! Compraste ropa en inglés y preguntaste tallas y precios.",
    recompensa: "Tres estrellas si no usó la ayuda, y la estampilla de Bath en el pasaporte.",
    siSeAtasca: [
      {
        situacion: "Responde algo que no cumple la tarea",
        accion: "Sigue en personaje y pregunta otra vez, más simple",
        ejemplo: '"I like this store" → Thank you! What are you looking for today?',
      },
      {
        situacion: "Falla la misma tarea por segunda vez",
        accion: "Se ilumina la ayuda con el comienzo de la frase",
        ejemplo: 'Ayuda: "Do you have it in ___?"',
      },
      {
        situacion: "Responde en español",
        accion: "Da la frase en inglés y vuelve a la escena",
        ejemplo: '"¿Cuánto cuesta?" → En inglés: How much is it? Try it!',
      },
      {
        situacion: "No se entiende el audio",
        accion: "Pide repetir; no cuenta como intento",
        ejemplo: "Sorry, can you say that again?",
      },
      {
        situacion: "Comete un error que no impide entender",
        accion: "No corrige en la escena; lo menciona en el resumen, máximo un punto",
        ejemplo: '"How many is it?" → la escena sigue; en el resumen: Para precios: how much is it?',
      },
      {
        situacion: "Pasa de 18 intervenciones sin cumplir las tareas",
        accion: "Cierra la escena con amabilidad y propone repasar",
        ejemplo: "We're closing soon! Come back tomorrow! Vamos a repasar much, many, some y any, y lo intentas de nuevo.",
      },
    ],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
    // Los cinco comienzos son los de la fila "Ayuda" del documento, uno por tarea.
    ayudas: ["I'm looking for ___", "Do you have it in ___?", "How much ___?", "Do you have any ___?", "I'll pay ___"],
  },
  ilustraciones: [
    { archivos: ["bath"], muestra: "Portada de la ciudad: los baños romanos y las casas color miel", uso: "Portada de la parada" },
    {
      archivos: ["e-bath-tienda"],
      muestra: "Una tienda de ropa con estantes, un probador y la caja; por la ventana, los edificios color miel",
      uso: "Escenario",
    },
    {
      archivos: ["f-ropa-sueter", "f-ropa-camiseta", "f-ropa-chaqueta", "f-ropa-medias", "f-ropa-gorra"],
      muestra: "Un suéter, una camiseta, una chaqueta negra con una etiqueta de £30, unas medias rojas y una gorra",
      uso: "Las tarjetas de Adivina; la chaqueta en la lección 1 (paso 2), las medias, la gorra y el suéter en la lección 2 (paso 1), y el suéter, la camiseta y la gorra en la lección 4 (paso 1)",
    },
    { archivos: ["a1/f-tenis"], muestra: "Unos tenis (de A1)", uso: "La tarjeta sneakers" },
    {
      archivos: ["f-vitrina-bath"],
      muestra: 'La vitrina de una tienda con el letrero "SALE": pocos suéteres, muchas camisetas, unas gorras y un gancho vacío con el letrero "Jackets"',
      uso: "Lección 3 (paso 2)",
    },
    { archivos: ["f-probador"], muestra: "Una muchacha con un vestido en la mano frente al probador", uso: "Lección 4 (paso 2)" },
  ],
};
