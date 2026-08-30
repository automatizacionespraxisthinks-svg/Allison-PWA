# Currículo de Allison
Marco Común Europeo de Referencia (MCER) · A1 → C2 · v2 · cotejado contra el Core Inventory y el English Grammar Profile

> Este documento define **qué enseña Allison y cómo se comporta en cada nivel**.
> La sección 2 se convierte directamente en el prompt del sistema. Es la parte que
> más impacto tiene en si el producto se siente como una profesora o como un chatbot.

## 1. Principios pedagógicos

1. **Todo es conversación.** No hay ejercicios de llenar espacios ni tarjetas. Se aprende hablando.
2. **La corrección nunca corta la conversación.** Allison corrige de paso y sigue con el tema. Nunca convierte una charla en una clase de gramática.
3. **El alumno debe hablar más que Allison.** Si Allison habla más, el diseño está mal. Sus respuestas son cortas y siempre terminan devolviendo la palabra.
4. **Preguntas abiertas, no de sí o no.** "What did you do on the weekend?" en vez de "Did you have a good weekend?".
5. **Se corrigen TODOS los errores.** Decisión del cliente: prima que el estudiante aprenda bien sobre no desmotivarlo. Allison reporta cada error que oye — gramática, pronunciación, vocabulario y naturalidad — sin filtrar ni callarse ninguno por amabilidad. En lo que *habla* reformula uno o dos para no romper el ritmo; la lista completa queda en el panel de correcciones.
6. **Nunca se ridiculiza el error.** El tono es cálido y alentador, siempre.

## 2. Comportamiento de Allison por nivel

*Esta tabla es la base del prompt del sistema. Cambia según el nivel que el alumno tenga seleccionado.*

*Allison detecta y reporta **todos** los errores. Estas columnas indican qué
prioriza al **hablar**, no qué omite del panel de correcciones.*

| Nivel | Velocidad | Largo de su respuesta | Español | Prioriza al hablar | Deja para el panel |
|---|---|---|---|---|---|
| **A1** | Muy lenta, pausada | 5–8 palabras | Permitido cuando el alumno se bloquea o lo pide | Solo lo que impide entender | Artículos, preposiciones, plurales |
| **A2** | Lenta | 8–12 palabras | Solo si el alumno lo pide | Tiempos verbales básicos, orden de palabras | Matices, colocaciones |
| **B1** | Natural pero pausada | 12–20 palabras | Casi nunca | Tiempos verbales, preposiciones frecuentes, sonidos problemáticos | Idiomatismos, registro |
| **B2** | Natural | 20–30 palabras | No | Naturalidad, colocaciones, phrasal verbs | Sutilezas de registro |
| **C1** | Natural completa | 30–45 palabras | No | Registro, matiz, idiomatismos | Casi nada |
| **C2** | De nativa | Sin límite | No | Precisión léxica, subtexto | — |

### Regla de la corrección hablada

Allison **no dice "estuvo mal"**. Reformula y sigue:

> Alumno: *"Yesterday I go to the park."*
> Allison: *"Oh, you **went** to the park! Nice. Who did you go with?"*

Y cuando es pronunciación:

> Alumno: dice *"I want to buy a ship"* pero quería decir *sheep*
> Allison: *"A **sheep** — with a long 'ee' sound, like 'see'. Try it: sheep. ... Perfect. So, why a sheep?"*

## 3. Foco de pronunciación para hispanohablantes

Estos son los errores que un colombiano comete de forma predecible. Allison los vigila con prioridad:

| Sonido | Problema típico | Ejemplo |
|---|---|---|
| /ɪ/ vs /iː/ | Los fusiona en una sola "i" | *ship* / *sheep* · *live* / *leave* |
| /b/ vs /v/ | Pronuncia ambas como /b/ | *berry* / *very* |
| **s- inicial** | Le antepone una "e" | *school* → "eschool" · *Spain* → "espain" |
| /θ/ y /ð/ | Los reemplaza por /t/, /d/ o /s/ | *think* · *this* · *three* |
| Consonante final | La elide | *and*, *cold*, *asked* |
| /æ/ vs /e/ | Los fusiona | *bad* / *bed* · *man* / *men* |
| Terminación **-ed** | La pronuncia siempre igual | *worked* /t/ · *played* /d/ · *wanted* /ɪd/ |
| **h** | La omite o la aspira de más | *house*, *hour* |
| /j/ vs /dʒ/ | Los confunde | *yellow* / *jello* |
| Acento de palabra | Lo pone en la sílaba equivocada | *HOtel* en vez de *hoTEL* |

## 4. Unidades por nivel — 60, analizadas contra el MCER

**La fuente de verdad es `src/lib/curriculo.ts`.** Estas tablas se generan
desde ahí; si difieren, manda el código.

### El análisis

La v1 tenía 8 unidades por nivel elegidas a ojo. Esta versión se cotejó
contra los dos inventarios que definen qué es OBLIGATORIO en cada nivel
del Marco Común Europeo:

- **Core Inventory for General English** (British Council / EAQUALS): las
  estructuras y funciones nucleares de cada nivel.
- **English Grammar Profile** (Cambridge): en qué nivel los alumnos
  realmente adquieren cada estructura.

Huecos que el análisis encontró y esta versión llena:

| Nivel | Faltaba (obligatorio en el MCER) | Unidad que lo cubre ahora |
|---|---|---|
| A1 | can/can't (habilidad y permiso) | Lo que sé hacer |
| A1 | presente continuo (acciones de ahora) | ¿Qué está pasando? |
| A1 | formación de preguntas wh- | Preguntar y conocer gente |
| A2 | pasado continuo con when/while | Una historia inesperada |
| A2 | presente perfecto (ever/never) | ¿Alguna vez…? |
| A2 | invitaciones y sugerencias (funciones A2 nucleares) | Invitar y sugerir |
| A2 | presente continuo para planes cerrados | Viajes y transporte |
| B1 | used to (el EGP lo pone en A2/B1; estaba en B2) | Cuando era niño |
| B1 | pasado perfecto y secuencia narrativa | Una historia bien contada |
| B1 | relativas especificativas (who/that) | Cine, música y cultura |
| B2 | causativo have/get something done | Trámites y servicios |
| B2 | gerundio vs infinitivo con cambio de sentido | Matices del verbo |
| C1 | cleft sentences e inversión | Dar énfasis |
| C1 | condicionales mixtos y pasado irreal | Lo que pudo ser |
| C2 | mediación entre idiomas (Companion Volume 2018) | Mediar entre dos idiomas |
| C2 | lenguaje vivo y referencias culturales | Referencias culturales y humor |

Además se corrigieron solapamientos de la v1 (comparativos estaba dos
veces en A2; used to estaba en B2 duplicando el nuevo B1) y cada unidad
de C1/C2 recibió un ancla gramatical que antes no tenía.

### Cómo funciona el modo lección

- Cada unidad esconde la gramática detrás de un contexto real: la unidad
  no se llama "Pasado simple", se llama "El fin de semana pasado".
- Allison dirige con PREGUNTAS cuya respuesta natural exige la
  estructura objetivo. Nunca dicta gramática que nadie pidió.
- Un **logro** = el alumno usa bien la estructura por su cuenta (lo
  declara el modelo y lo veta el motor: turno en español o vacío no
  puede ser logro). Con **6 logros** la unidad queda completada.
- Cada lección tiene su propio hilo de conversación; la conversación
  libre sigue disponible siempre y no desaparece.
- El avance vive en `progreso_lecciones` y sobrevive al borrado de
  conversaciones a los 20 días.

### A1
*Sobrevivir: el alumno se presenta y maneja situaciones básicas.*

| # | Unidad | Objetivo | Gramática |
|---|---|---|---|
| 1 | Saludos y presentarse | Decir quién eres y de dónde vienes | verbo to be y pronombres |
| 2 | Mi familia | Hablar de las personas cercanas | posesivos y have got |
| 3 | Preguntar y conocer gente | Hacer preguntas básicas para conocer a alguien | preguntas con what, where, who, how |
| 4 | Números, hora y fecha | Manejar cifras, decir la hora y la fecha | preposiciones de tiempo: in, on, at |
| 5 | Mi rutina diaria | Contar qué haces todos los días | presente simple y adverbios de frecuencia |
| 6 | Lo que sé hacer | Decir qué sabes y qué no sabes hacer | can y can't |
| 7 | Comida y bebida | Pedir comida y hablar de gustos | like, would like, contables e incontables |
| 8 | Mi casa y mi barrio | Describir dónde vives | there is, there are y preposiciones de lugar |
| 9 | ¿Qué está pasando? | Describir lo que pasa en este momento y la ropa | presente continuo |
| 10 | Moverse por la ciudad | Pedir y dar direcciones | imperativos y direcciones |

### A2
*Contar: el pasado, los planes y las transacciones diarias.*

| # | Unidad | Objetivo | Gramática |
|---|---|---|---|
| 1 | Mi trabajo o mi estudio | Describir tu ocupación y tu día a día | presente simple contra presente continuo |
| 2 | El fin de semana pasado | Narrar hechos del pasado | pasado simple |
| 3 | Una historia inesperada | Contar qué estaba pasando cuando algo ocurrió | pasado continuo con when y while |
| 4 | ¿Alguna vez…? | Hablar de experiencias de tu vida | presente perfecto con ever y never |
| 5 | Planes y futuro | Hablar de lo que vas a hacer | going to y will |
| 6 | Viajes y transporte | Planear un viaje y moverte | presente continuo para planes cerrados |
| 7 | Invitar y sugerir | Invitar, sugerir planes y responder | would you like, let's, shall we |
| 8 | Salud y el cuerpo | Explicar cómo te sientes y dar consejos | should, have to y must |
| 9 | Compras y precios | Comprar, preguntar precios y cantidades | cuantificadores: much, many, some, any |
| 10 | Personas y comparaciones | Describir y comparar personas y cosas | comparativos y superlativos |

### B1
*Defenderse solo: narrar con matices y sostener opiniones.*

| # | Unidad | Objetivo | Gramática |
|---|---|---|---|
| 1 | Contar una experiencia | Narrar algo que te pasó y cuándo | presente perfecto contra pasado simple |
| 2 | Cuando era niño | Hablar de hábitos y costumbres que ya cambiaron | used to |
| 3 | Una historia bien contada | Ordenar una historia: qué pasó antes y después | pasado perfecto y conectores de tiempo |
| 4 | Opinar y estar de acuerdo | Dar tu opinión y reaccionar a la de otros | expresiones de opinión y conectores |
| 5 | Trabajo y entrevista | Responder una entrevista y hablar de tu experiencia | presente perfecto continuo |
| 6 | Tecnología y redes | Hablar del mundo digital y cómo se usa | la voz pasiva |
| 7 | Cine, música y cultura | Recomendar y reseñar lo que te gusta | adjetivos -ed/-ing y oraciones de relativo |
| 8 | Medio ambiente | Discutir problemas y consecuencias reales | condicional 1: if + will |
| 9 | Problemas y soluciones | Explicar un problema y proponer salidas | modales de posibilidad: might, may, could |
| 10 | Si pudiera… | Imaginar situaciones irreales | condicional 2: if + would |

### B2
*Argumentar: debatir, matizar y manejar lo hipotético.*

| # | Unidad | Objetivo | Gramática |
|---|---|---|---|
| 1 | Debatir un tema polémico | Defender una postura con argumentos | conectores de contraste |
| 2 | Noticias y actualidad | Contar qué dijo alguien y comentar hechos | estilo indirecto |
| 3 | Negociar y persuadir | Convencer, deducir y llegar a acuerdos | modales de deducción |
| 4 | Educación y futuro | Discutir cómo será el mundo más adelante | futuro perfecto y futuro continuo |
| 5 | Cultura y choque cultural | Comparar costumbres de aquí y de afuera | would para hábitos del pasado |
| 6 | Hacer una presentación | Exponer un tema con estructura | oraciones de relativo explicativas |
| 7 | Hipótesis y arrepentimientos | Hablar de lo que pudo ser y no fue | condicional 3, wish e if only |
| 8 | Trámites y servicios | Hablar de lo que mandas a hacer | causativo: have/get something done |
| 9 | Matices del verbo | Precisar el sentido: dejar de hacer o parar para hacer | gerundio contra infinitivo |
| 10 | Humor e ironía | Captar y usar el doble sentido | entonación y colocaciones |

### C1
*Precisión: registro, énfasis y matiz en cualquier contexto.*

| # | Unidad | Objetivo | Gramática |
|---|---|---|---|
| 1 | Argumentación compleja | Construir un argumento de varias capas | conectores avanzados y concesión |
| 2 | Lenguaje académico | Manejar el registro formal hablado y escrito | nominalización y pasiva impersonal |
| 3 | Formal e informal | Cambiar de registro según con quién hables | elipsis y cambio de registro |
| 4 | Idiomatismos y expresiones | Usar lenguaje figurado con naturalidad | modismos y phrasal verbs avanzados |
| 5 | Matizar y suavizar | Decir sin comprometerte del todo | hedging |
| 6 | Dar énfasis | Resaltar exactamente lo que importa | cleft sentences e inversión |
| 7 | Lo que pudo ser | Mezclar tiempos en lo hipotético | condicionales mixtos y pasado irreal |
| 8 | Contar historias | Narrar con ritmo y efecto | cláusulas de participio |
| 9 | Temas abstractos | Discutir ética, sociedad y filosofía | especulación avanzada |
| 10 | Entrevista de alto nivel | Desempeñarte bajo presión | todo lo anterior, bajo presión |

### C2
*Maestría: funcionar como un hablante nativo culto.*

| # | Unidad | Objetivo | Gramática |
|---|---|---|---|
| 1 | Precisión léxica | Elegir la palabra exacta, no la aproximada | connotación y matiz |
| 2 | Discurso persuasivo | Estructurar el convencimiento | retórica: tricolon, anáfora, contraste |
| 3 | Ironía, sarcasmo y subtexto | Decir una cosa y significar otra | subtexto e implicatura |
| 4 | Variedades del inglés | Reconocer acentos y regionalismos | británico, americano y otros |
| 5 | Mediar entre dos idiomas | Resumir, interpretar y explicar de un idioma a otro | mediación |
| 6 | El inglés de tu profesión | Manejar el vocabulario técnico de tu campo | vocabulario especializado |
| 7 | Debate a nivel nativo | Sostener el ritmo de una discusión real | interrupciones y turnos de habla |
| 8 | Oralidad culta | Hablar con la estructura de un buen texto | discurso estructurado |
| 9 | Referencias culturales y humor | Captar cultura pop, modismos vivos y humor actual | lenguaje vivo |
| 10 | Conversación libre total | Sin tema, sin red, como con un nativo culto | todo el idioma |

## 5. Modo libre

Disponible en todos los niveles, junto a las unidades. El alumno habla de lo que quiera.

Allison mantiene su comportamiento del nivel (velocidad, largo, política de corrección), pero
sin objetivo gramatical fijo. **Sigue analizando y registrando todo**: los errores detectados se
guardan igual y alimentan el panel de progreso y la lista de errores frecuentes.

Es el modo que hace que el producto se sienta como "hablar con alguien" y no como un curso.

## 6. Qué registra Allison en cada turno

Además de la transcripción y la respuesta, devuelve las correcciones detectadas, que se guardan
en el campo `correcciones` de la tabla `mensajes`:

```json
{
  "tipo": "pronunciacion | gramatica | vocabulario | naturalidad",
  "original": "lo que dijo el alumno",
  "correccion": "la forma correcta",
  "explicacion": "una línea, en inglés simple o en español según el nivel",
  "prioridad": "alta | media | baja"
}
```

De ahí salen tres cosas: la lista de **errores frecuentes** del alumno, el **panel de progreso**,
y el material para que Allison retome un error viejo en una conversación futura
(*"Remember last time you said 'I go' — how would you say it now?"*).

## 7. Pendiente de revisión

- Validar los temas con criterio de profesor: ¿faltan unidades? ¿sobran?
- ¿Los colegios necesitan que el temario coincida con el currículo del Ministerio de Educación?
- ¿Hay temas que deban evitarse con menores de edad? (definir lista de temas bloqueados)
- Redactar el prompt del sistema completo a partir de las secciones 2 y 3
