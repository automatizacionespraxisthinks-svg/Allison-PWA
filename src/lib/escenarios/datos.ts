import type { Escenario } from "../ruta/tipos.ts";
import type { Nivel } from "../tipos.ts";
import type { Categoria } from "./categorias.ts";

/**
 * La sección Escenarios (pantalla 5, aprobada el 14 de octubre de 2026):
 * escenarios por categoría que se pueden repetir, y los que crea el
 * alumno ("Míos").
 *
 * POR REVISAR: los documentos aprobados solo traen los nombres, los
 * lugares y el nivel de las tarjetas del boceto (Comprar un libro, Pedir y
 * pagar la cuenta, Encontrar productos, Pedir en la cafetería,
 * Registrarte en el hotel desde A2, Explicar tus síntomas desde B1) y
 * las 9 ilustraciones del catálogo. El papel de Allison, el contexto, las
 * 3 tareas y el diálogo de ejemplo de cada uno se escribieron para la
 * etapa 7 siguiendo la plantilla de los escenarios de cierre, en inglés
 * de Estados Unidos, y los revisa la docente (docs/CONTENIDO-POR-REVISAR.md).
 */

export interface EscenarioCatalogo {
  /** "cat:libreria" */
  clave: string;
  titulo: string;
  lugar: string;
  categoria: Categoria;
  nivelMinimo: Nivel;
  imagen: string;
  /** "Allison es la vendedora" (tarjeta del recomendado). */
  papelCorto: string;
  escenario: Escenario;
}

/** Lo común de un escenario del catálogo: mínimo 10 intervenciones, cierre a las 18. */
export function escenario(o: {
  titulo: string;
  imagen: string;
  contexto: string;
  personaje: string;
  tareas: string[];
  dialogo: Escenario["dialogo"];
}): Escenario {
  return {
    ...o,
    objetivo: o.tareas.join(" "),
    resumen: `¡Lo lograste! ${o.titulo} en inglés.`,
    recompensa: "Hasta 3 estrellas en Escenarios. Lo puedes repetir para subirlas.",
    siSeAtasca: [],
    minimoIntervenciones: 10,
    maximoIntervenciones: 18,
  };
}

const ORDEN: Nivel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const CATALOGO: EscenarioCatalogo[] = [
  {
    clave: "cat:aeropuerto",
    titulo: "Pasar migración en el aeropuerto",
    lugar: "Aeropuerto",
    categoria: "Viajes",
    nivelMinimo: "A1",
    imagen: "e-miami-aeropuerto",
    papelCorto: "Allison es la agente",
    escenario: escenario({
      titulo: "Pasaste migración",
      imagen: "e-miami-aeropuerto",
      contexto: "Llegas en avión a Estados Unidos. La agente de migración te hace unas preguntas.",
      personaje: "La agente de migración del aeropuerto",
      tareas: ["Saluda y di tu nombre.", "Di de dónde vienes y por qué viajas.", "Da las gracias y despídete."],
      dialogo: [
        { quien: "personaje", dice: "Good morning! What's your name?" },
        { quien: "alumno", dice: "Good morning! My name is Diego.", tarea: 1 },
        { quien: "personaje", dice: "Where are you from, Diego? Why are you here?" },
        { quien: "alumno", dice: "I'm from Colombia. I'm here on vacation.", tarea: 2 },
        { quien: "personaje", dice: "Welcome! Have a nice trip!" },
        { quien: "alumno", dice: "Thank you! Goodbye!", tarea: 3 },
      ],
    }),
  },
  {
    clave: "cat:libreria",
    titulo: "Comprar un libro",
    lugar: "Librería",
    categoria: "Compras",
    nivelMinimo: "A1",
    imagen: "c-libreria",
    papelCorto: "Allison es la vendedora",
    escenario: escenario({
      titulo: "Compraste un libro",
      imagen: "c-libreria",
      contexto: "Entras a una librería. Quieres un libro en inglés para practicar.",
      personaje: "La vendedora de la librería",
      tareas: ["Pide un libro en inglés.", "Pregunta cuánto cuesta.", "Paga, da las gracias y despídete."],
      dialogo: [
        { quien: "personaje", dice: "Hi! Can I help you?" },
        { quien: "alumno", dice: "Yes, please. I'd like a book in English.", tarea: 1 },
        { quien: "personaje", dice: "Sure! This one is about animals. Do you like it?" },
        { quien: "alumno", dice: "Yes! How much is it?", tarea: 2 },
        { quien: "personaje", dice: "It's ten dollars." },
        { quien: "alumno", dice: "Here you are. Thank you! Bye!", tarea: 3 },
      ],
    }),
  },
  {
    clave: "cat:restaurante",
    titulo: "Pedir y pagar la cuenta",
    lugar: "Restaurante",
    categoria: "Comida",
    nivelMinimo: "A1",
    imagen: "c-restaurante",
    papelCorto: "Allison es la mesera",
    escenario: escenario({
      titulo: "Pediste y pagaste la cuenta",
      imagen: "c-restaurante",
      contexto: "Estás en un restaurante con hambre. La mesera llega a tu mesa.",
      personaje: "La mesera del restaurante",
      tareas: ["Pide algo de comer y de tomar.", "Pide la cuenta.", "Paga y da las gracias."],
      dialogo: [
        { quien: "personaje", dice: "Hi! What would you like?" },
        { quien: "alumno", dice: "I'd like a burger and a soda, please.", tarea: 1 },
        { quien: "personaje", dice: "Here you go. Enjoy! Anything else?" },
        { quien: "alumno", dice: "Can I have the check, please?", tarea: 2 },
        { quien: "personaje", dice: "Sure. It's twelve dollars." },
        { quien: "alumno", dice: "Here you are. Thank you!", tarea: 3 },
      ],
    }),
  },
  {
    clave: "cat:supermercado",
    titulo: "Encontrar productos",
    lugar: "Supermercado",
    categoria: "Compras",
    nivelMinimo: "A1",
    imagen: "c-supermercado",
    papelCorto: "Allison es la empleada",
    escenario: escenario({
      titulo: "Encontraste lo que buscabas",
      imagen: "c-supermercado",
      contexto: "Estás en un supermercado grande y no encuentras lo que necesitas.",
      personaje: "La empleada del supermercado",
      tareas: ["Pregunta dónde está un producto.", "Pregunta cuánto cuesta.", "Da las gracias y despídete."],
      dialogo: [
        { quien: "personaje", dice: "Hi! Do you need help?" },
        { quien: "alumno", dice: "Yes, please. Where is the milk?", tarea: 1 },
        { quien: "personaje", dice: "It's in aisle three, next to the eggs." },
        { quien: "alumno", dice: "How much is it?", tarea: 2 },
        { quien: "personaje", dice: "It's two dollars." },
        { quien: "alumno", dice: "Thank you! Bye!", tarea: 3 },
      ],
    }),
  },
  {
    clave: "cat:cafeteria",
    titulo: "Pedir en la cafetería",
    lugar: "Cafetería",
    categoria: "Comida",
    nivelMinimo: "A1",
    imagen: "c-cafeteria",
    papelCorto: "Allison es la barista",
    escenario: escenario({
      titulo: "Pediste en la cafetería",
      imagen: "c-cafeteria",
      contexto: "Entras a una cafetería. Quieres algo de tomar.",
      personaje: "La barista de la cafetería",
      tareas: ["Pide una bebida.", "Di qué tamaño quieres.", "Paga y despídete."],
      dialogo: [
        { quien: "personaje", dice: "Hi! What can I get you?" },
        { quien: "alumno", dice: "A hot chocolate, please.", tarea: 1 },
        { quien: "personaje", dice: "Small, medium or large?" },
        { quien: "alumno", dice: "Medium, please.", tarea: 2 },
        { quien: "personaje", dice: "That's four dollars." },
        { quien: "alumno", dice: "Here you are. Thanks! Bye!", tarea: 3 },
      ],
    }),
  },
  {
    clave: "cat:bus",
    titulo: "Tomar el bus",
    lugar: "Bus",
    categoria: "Ciudad",
    nivelMinimo: "A1",
    imagen: "c-bus",
    papelCorto: "Allison es la conductora",
    escenario: escenario({
      titulo: "Tomaste el bus",
      imagen: "c-bus",
      contexto: "Subes a un bus en la ciudad y no sabes si va adonde necesitas.",
      personaje: "La conductora del bus",
      tareas: ["Pregunta si el bus va al centro.", "Pregunta cuánto cuesta.", "Pregunta dónde te bajas."],
      dialogo: [
        { quien: "personaje", dice: "Hi! Where are you going?" },
        { quien: "alumno", dice: "Hi! Does this bus go downtown?", tarea: 1 },
        { quien: "personaje", dice: "Yes, it does." },
        { quien: "alumno", dice: "How much is it?", tarea: 2 },
        { quien: "personaje", dice: "It's two dollars." },
        { quien: "alumno", dice: "Where do I get off?", tarea: 3 },
        { quien: "personaje", dice: "Get off at Main Street. It's the fourth stop." },
      ],
    }),
  },
  {
    clave: "cat:farmacia",
    titulo: "Comprar en la droguería",
    lugar: "Droguería",
    categoria: "Salud",
    nivelMinimo: "A2",
    imagen: "c-farmacia",
    papelCorto: "Allison es la farmaceuta",
    escenario: escenario({
      titulo: "Compraste en la droguería",
      imagen: "c-farmacia",
      contexto: "Tienes dolor de cabeza y entras a una droguería.",
      personaje: "La farmaceuta de la droguería",
      tareas: ["Di qué te pasa y qué necesitas.", "Pregunta cómo se toma.", "Paga y despídete."],
      dialogo: [
        { quien: "personaje", dice: "Hi! How can I help you?" },
        { quien: "alumno", dice: "I have a headache. I need some medicine, please.", tarea: 1 },
        { quien: "personaje", dice: "You can take this. It's for headaches." },
        { quien: "alumno", dice: "How often should I take it?", tarea: 2 },
        { quien: "personaje", dice: "One pill every eight hours, after you eat." },
        { quien: "alumno", dice: "OK. Here you are. Thank you! Bye!", tarea: 3 },
      ],
    }),
  },
  {
    clave: "cat:banco",
    titulo: "Cambiar dinero en el banco",
    lugar: "Banco",
    categoria: "Ciudad",
    nivelMinimo: "A2",
    imagen: "c-banco",
    papelCorto: "Allison es la cajera",
    escenario: escenario({
      titulo: "Cambiaste dinero",
      imagen: "c-banco",
      contexto: "Estás de viaje y necesitas dólares. Vas al banco.",
      personaje: "La cajera del banco",
      tareas: ["Di que quieres cambiar dinero.", "Pregunta cuántos dólares recibes.", "Da las gracias y despídete."],
      dialogo: [
        { quien: "personaje", dice: "Good morning! How can I help you?" },
        { quien: "alumno", dice: "Good morning. I'd like to change some money, please.", tarea: 1 },
        { quien: "personaje", dice: "Sure. Can I see your passport?" },
        { quien: "alumno", dice: "Here it is. How many dollars do I get?", tarea: 2 },
        { quien: "personaje", dice: "You get fifty dollars." },
        { quien: "alumno", dice: "Great, thank you! Have a nice day!", tarea: 3 },
      ],
    }),
  },
  {
    clave: "cat:hotel",
    titulo: "Registrarte en el hotel",
    lugar: "Hotel",
    categoria: "Viajes",
    nivelMinimo: "A2",
    imagen: "c-hotel",
    papelCorto: "Allison es la recepcionista",
    escenario: escenario({
      titulo: "Te registraste en el hotel",
      imagen: "c-hotel",
      contexto: "Llegas a un hotel con tu maleta. Tienes una reserva.",
      personaje: "La recepcionista del hotel",
      tareas: ["Di que tienes una reserva y tu nombre.", "Pregunta a qué hora es el desayuno.", "Pregunta por el wifi y da las gracias."],
      dialogo: [
        { quien: "personaje", dice: "Good evening! Welcome. How can I help you?" },
        { quien: "alumno", dice: "Hi! I have a reservation. My name is Diego Rojas.", tarea: 1 },
        { quien: "personaje", dice: "Yes, here it is. Two nights. Here's your key." },
        { quien: "alumno", dice: "What time is breakfast?", tarea: 2 },
        { quien: "personaje", dice: "From seven to ten, on the first floor." },
        { quien: "alumno", dice: "Is there wifi? Thank you!", tarea: 3 },
      ],
    }),
  },
  {
    clave: "cat:medico",
    titulo: "Explicar tus síntomas",
    lugar: "Médico",
    categoria: "Salud",
    nivelMinimo: "B1",
    imagen: "c-medico",
    papelCorto: "Allison es la médica",
    escenario: escenario({
      titulo: "Explicaste tus síntomas",
      imagen: "c-medico",
      contexto: "Estás de viaje y te sientes mal. Vas a una consulta médica.",
      personaje: "La médica del consultorio",
      tareas: ["Explica qué te duele y desde cuándo.", "Responde sus preguntas sobre cómo te sientes.", "Pregunta qué debes hacer."],
      dialogo: [
        { quien: "personaje", dice: "Hello! What seems to be the problem?" },
        { quien: "alumno", dice: "My stomach hurts. It started two days ago.", tarea: 1 },
        { quien: "personaje", dice: "I see. Do you have a fever? Have you eaten anything unusual?" },
        { quien: "alumno", dice: "No fever, but I ate street food on Friday.", tarea: 2 },
        { quien: "personaje", dice: "It's probably something you ate." },
        { quien: "alumno", dice: "What should I do?", tarea: 3 },
        { quien: "personaje", dice: "Drink a lot of water and rest. Come back if it doesn't get better." },
      ],
    }),
  },
];

export function nivelAbierto(nivelMinimo: Nivel, nivel: Nivel): boolean {
  return ORDEN.indexOf(nivelMinimo) <= ORDEN.indexOf(nivel);
}
