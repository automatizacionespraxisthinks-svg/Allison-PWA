/**
 * La prueba gratis: cuántas intervenciones recibe una cuenta nueva.
 *
 * Se entrega COMPLETA al crear la cuenta. Antes venía partida (5 al
 * registrarse y 15 al confirmar el correo) para no pagarle a Google 20
 * mensajes por cada correo inventado. La confirmación se quitó en
 * sep-2026: el aviso de "+15 al confirmar" estorbaba, y el correo era
 * un paso más donde se perdía gente. Lo que frena el abuso ahora es el
 * tope global de cuentas nuevas por hora (REGISTROS_GLOBALES_POR_HORA).
 *
 * Son 5 desde oct-2026 (plan de mejoras): lo gratis es lo que no usa IA
 * (Escucha, Guía de frases, Tu turno) y la prueba solo deja probar las
 * actividades con Allison.
 *
 * Se lee MENSAJES_PRUEBA. Si un despliegue viejo todavía trae las dos
 * variables partidas, se suman: nadie recibe menos de lo que recibía.
 */
const entera = process.env.MENSAJES_PRUEBA;
const inicial = process.env.MENSAJES_PRUEBA_INICIAL;
const alConfirmar = process.env.MENSAJES_PRUEBA_VERIFICAR;

export const MENSAJES_PRUEBA = entera
  ? Number(entera)
  : inicial || alConfirmar
    ? Number(inicial ?? 0) + Number(alConfirmar ?? 0)
    : 5;
