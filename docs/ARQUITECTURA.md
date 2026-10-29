# Allison — Profesora de inglés con IA
Especificación técnica · v1 · agosto 2026

## 1. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Mercado | Colombia — colegios públicos/privados y público general |
| Plataforma | Web responsive + PWA instalable, prioridad celular |
| Conversación | Por turnos (no llamada en tiempo real) |
| **Motor (opción B+)** | El audio va **directo a Gemini**, que devuelve (a) la transcripción literal de lo que dijo el alumno y (b) la respuesta de Allison. **Whisper NO se usa.** La voz la genera la **API de texto a voz de Praxis** en streaming (sep-2026); la del navegador queda de respaldo |
| Corrección | Pronunciación y gramática corregidas dentro de la conversación. **Sin puntaje numérico** |
| Transcripción | Visible con botón mostrar/ocultar |
| Avatar | Foto realista de Allison (generada por IA, sin problema de derechos). Opción B aprobada: la misma foto con estados (respira en reposo, anillo verde al escuchar, tres puntos al pensar) y, **mientras habla, se mueve como alguien que conversa**: un vaivén lento de la cabeza y un pulso con el ritmo de las sílabas (`habla-vaiven` y `habla-ritmo` en `globals.css`; quieta con "reducir movimiento"). Sin sincronía labial: la boca no se mueve. Los tres bucles de video quedan para una segunda etapa |
| Idioma | Inglés; español solo al corregir (una frase tras la corrección, hasta B1), dicho por la misma voz con marcadores [es] que la pantalla no muestra. Política en src/lib/allison.ts, "SPANISH IN YOUR VOICE". Acento neutro |
| Nivel | Lo elige el alumno al registrarse, cambiable después. Sin test inicial |
| Retención | Conversaciones y audios se borran a los **20 días**. El progreso NO se borra |
| Registro | Email/contraseña y Google |
| Moneda | COP |
| Servidor | Hetzner CPX22 (2 vCPU / 4 GB) + Dokploy, **en Ashburn, Virginia (EE.UU.)** |

### Latencia medida desde Colombia (agosto 2026)

| Región Hetzner | Latencia |
|---|---|
| **Ashburn, EE.UU.** | **92 ms** — elegir esta |
| Hillsboro, EE.UU. | 178 ms |
| Núremberg (servidor praxis, CPX32) | 205 ms |
| Helsinki (aplicaciones de praxis, CX43) | 406 ms |

**Nada que el alumno espere en pantalla puede vivir en Europa.** Un turno son varias idas y
vueltas de red; a 200 ms eso agrega 1–2 segundos por turno sin hacer nada útil.

### Reparto de servidores

| Servidor | Ubicación | Carga |
|---|---|---|
| CPX22 nuevo | **Ashburn** | Next.js, PostgreSQL, Redis, worker TTS — todo lo sincrónico |
| servidor praxis (CPX32) | Núremberg | n8n y automatizaciones. La latencia les da igual |
| aplicaciones de praxis (CX43) | Helsinki | Lo que ya hace. Nada de Allison |

> n8n **no** consulta la base de datos de Ashburn directamente: pide los datos a la aplicación
> por API y en lotes. Consultas sueltas cruzando el Atlántico harían los reportes inservibles.

### Por qué B+ y no Whisper

Whisper **normaliza** lo que dice el alumno: si dice "I no have money" transcribe "I do not have money".
Allison nunca vería el error. Además consumía cerca del 80% del CPU del servidor.

Al enviar el audio a Gemini se obtiene: corrección real de pronunciación, transcripción con los
errores intactos, y el CPX22 pasa de ~5 a ~30 estudiantes simultáneos.

## 2. Modelo de cobro

- **Unidad interna:** 1 mensaje = 1 turno (audio del alumno, máx. 60 s + respuesta de Allison)
- **Presentación al usuario: "intervenciones" + tiempo equivalente.** Se evaluaron tokens
  (incomprensibles), créditos (opacidad que resta confianza frente a colegios), minutos y
  segundos (ansiedad de taxímetro: el principiante pagaría por sus silencios, castigando a
  quien más necesita pausar). La unidad interna NO cambia — el sistema de saldos y sus 48
  pruebas quedan intactos; solo cambia el texto: "Hasta 500 intervenciones al mes — más de
  8 horas de conversación" (1 intervención ≈ 1 minuto, redondeado hacia abajo para prometer
  menos de lo que se entrega). Los términos aclaran que la equivalencia es informativa
- **Tasa:** $100 COP = 1 mensaje
- **Recarga:** mínimo $8.000 (sep-2026; antes $4.000), de ahí en adelante monto libre. **No caducan**
- **Bono por volumen:** +10% desde $20.000 · +15% desde $50.000
- **Planes:** mensual $35.000 / semestral $180.000 / anual $320.000 — 500 mensajes por mes
- **Los mensajes del plan caducan** al terminar el mes. Al agotarse se le **pregunta** al alumno si quiere renovar (no hay débito automático forzado)
- **Planes de varios meses:** entregan los mensajes **cada mes**, contados desde el día de compra (un plan del 31 no se corre al 28). Lo pone al día `renovar_suscripcion` (db/020): al cargar el saldo del alumno y en la tarea de cada hora. Los meses en que nadie la pone al día no se entregan de golpe: habrían vencido igual
- **Orden de consumo:** primero los del plan, después los de recarga
- **Prueba gratis: 5 intervenciones, entregadas completas al crear la cuenta** (`MENSAJES_PRUEBA`). Eran 20 hasta oct-2026; el plan de mejoras la bajó a 5 porque lo que no usa IA ya es gratis
  - Antes venían partidos (5 al registrarse y 15 al confirmar el correo) para no pagarle a Google 20 mensajes por cada correo inventado. Se quitó en sep-2026: el aviso de "+15 al confirmar" estorbaba y el correo era un paso más donde se perdía gente. El freno contra el abuso es el tope global de cuentas nuevas por hora
  - Con **Google** son las mismas 5, y el correo queda verificado por Google
  - *Cómo se recoge el consentimiento con Google:* las casillas se marcan en `/registro` y viajan en una cookie firmada de 10 minutos hasta el regreso de Google; sin ella la cuenta no se crea, ni siquiera el nombre y el correo (`src/lib/entrada-google.ts`). Quien toca "Entrar con Google" en `/entrar` sin tener cuenta rebota a `/registro` con el aviso
  - Los **alumnos de colegio reciben los 20 completos** al cargarlos desde el colegio
- **Sin factura electrónica** por ahora

### Costo real por mensaje

| Componente | COP |
|---|---|
| Gemini (audio entrada + texto salida) | ~7 |
| Voz (API de Praxis, en su propia CPU) | 0 por uso. Capacidad: 2 síntesis a la vez para todos sus clientes |
| **Margen sobre plan de $35.000** | **~90%** |

> Verificar tarifas de Gemini en la página oficial antes de fijar precios definitivos.

### Comisiones de pasarela — decisión (sep-2026)

La pasarela es **Bold**, con el **QR Bre-B** como medio principal: 2,89% + IVA **sin valor fijo**
(exige la Cuenta Bold). Es lo que hace viable la recarga mínima de $8.000: ahí el QR cuesta ≈3,4%,
mientras PSE o tarjeta ($900 fijos) se llevan ≈17%, y en Wompi ≈13,7%. Wompi quedó como alternativa
en el código, pero solo desembolsa a Bancolombia o Nequi. Comparativa completa verificada en las
páginas oficiales el 14-sep-2026: ePayco exige mínimo $5.000 por transacción y trata las recargas
como actividad restringida; PSE directo exige persona jurídica y ≥$2,4M de implementación.

Integración: link de pago creado por API (monto cerrado, vence en 60 min), aviso firmado
(HMAC-SHA256 del cuerpo en base64) y **consulta activa del estado del link** — Bold avisa los pagos
de links con hasta 10 minutos de demora, así que la página a la que vuelve el alumno pregunta, y
la limpieza, que corre cada hora, concilia lo que no llegó. Aviso y consulta pasan por el mismo camino
(`src/lib/cobro.ts`).

PSE, Nequi y QR no permiten cobro recurrente automático — por eso la renovación es a elección del alumno.

## 3. Arquitectura

```
              Cloudflare (CDN + WAF, tiene nodo en Bogotá)
                            |
                   +------------------+
                   |  SERVIDOR CPX22  |
                   |  (Dokploy)       |
                   |                  |
                   |  Next.js (PWA)   |
                   |  PostgreSQL      |
                   |  Redis (cola)    |
                   |  (voz: API TTS)  |
                   |  n8n             |
                   +--------+---------+
                            |
        +-------------------+--------------------+
        |                   |                    |
   Gemini API        Pasarela de pago     Cloudflare R2
  (audio -> texto)  (Nequi/PSE/tarjeta)  (audios, TTL 15 días)
```

**Regla de oro:** los componentes van en contenedores separados y se comunican por cola (Redis).
El despliegue arranca en un solo servidor, pero mover un componente a otra máquina
debe ser cuestión de minutos, sin tocar código.

### Flujo de un turno

1. El navegador graba audio (máx. 60 s, formato opus) y lo sube
2. La app verifica saldo — si no hay, avisa y ofrece recargar
3. Audio + historial + prompt del nivel se envían a **Gemini**
4. Gemini devuelve: transcripción literal + respuesta + correcciones detectadas
5. La respuesta se registra en **/api/voz** y el navegador abre el audio: la **API de voz de Praxis** lo genera en streaming (mp3) y empieza a sonar a los pocos segundos
6. El navegador reproduce el audio y anima el avatar
7. Se descuenta 1 mensaje (transacción en BD) y se registra el movimiento

**El micrófono** (`AnilloMicrofono`, 28 de octubre de 2026): abrirlo tarda entre 0,3 y más de un segundo en el celular, más justo después de que habló Allison, y el alumno empezaba a hablar apenas tocaba: el comienzo no quedaba grabado. Ahora, al tocar, un anillo azul se llena alrededor del botón con «Preparando el micrófono…» (sin pasar del 90 %, porque no se sabe cuánto falta) y, cuando la grabación de verdad arranca, se completa en verde con «¡Habla ahora!», un «tic» corto (si los sonidos están activos) y una vibración donde se pueda. El «tic» no cuenta como voz: el volumen para decidir «no te oí» se mide después de los primeros 250 ms. Igual en Hablar (con sus colores: verde y rojo), lecciones, escenarios, viajes, Cuéntame y Narra (ahí el anillo de preparación ocupa el lugar del reloj). Un segundo toque mientras se abre no abre otro micrófono.

**Al terminar** (`COLA_GRABACION_MS`, 28 de octubre de 2026) se sigue grabando 0,7 s después del toque, con el botón ya en «Allison está escuchando…» (en Hablar, «Enviando…»): si el audio termina justo con la última palabra, la transcripción la pierde o la cambia ("I am from Colombia. Who old are you?" salía "who you"; "Do you have a pet?", "do you know?"). Medido con la API de voz y Gemini: sin silencio al final se perdían palabras en 5 de 6 frases; con 0,3 s todavía; con 0,7 s salieron completas. La duración que se cobra y guarda es hasta el toque. En Cuéntame y Narra, igual al terminar grabando (desde una pausa no hace falta).

**Cómo suena** (`src/lib/habla.ts`, `src/lib/voz-idiomas.ts`, probado en `probar:voz`; octubre de 2026): la API de voz no tiene marcas de pausa, así que las pausas salen solo de los signos. `puntuarParaVoz` vuelve punto un salto de línea sin signo, quita el punto pegado a otro signo ("Can I try it on?." → "?") y separa "Hi!How"; `conPunto` pone el punto donde la app une frases ("Nice to meet you. Say it: …"). Cada parte va con la fonética de su idioma: la petición manda `segments` (cada uno con su `lang`) en vez de un texto con marcadores; cada tramo que da paso a otro idioma termina en un signo, y dentro del español va aparte el inglés que se explica ("Para pedir se usa *I'd like*.", "se dice *'played'*"), reconocido con el vocabulario inglés del contenido de las tres rutas, el catálogo y los viajes, más uno común. Las palabras que también son español ("a", "no", "son") las deciden sus vecinas, "he comido" sigue en español y la pronunciación escrita para leerse en español ("Suena 'pleid'") no se toca. Todo con la misma voz: la del idioma en que empieza el texto. `/api/voz` devuelve también los segmentos, y la voz del navegador (el respaldo cuando la API está ocupada o caída) dice cada uno con una voz de su idioma, de mujer si la hay; antes lo leía todo con una voz inglesa, marcadores incluidos. **La velocidad** la pone la API (`speed`, entre 0,5 y 2, redondeada para que la caché la encuentre): la base del nivel (A1 0,8; A2 0,9; desde B1, 1) y la preferencia del alumno; el botón "Lento" (`hablarInglesLento`), A1 0,6 y desde A2 0,7 (antes era el 70 % de la base: A1 0,56 sonaba demasiado arrastrado). El celular ya no estira el audio con playbackRate. Lo eligió el usuario de oído el 25 de octubre de 2026, con muestras grabadas con la API real, igual que dejar el inglés dentro del español aparte palabra por palabra (aunque cada cambio de idioma agrega una pausa de unos 0,3 s) y decir el español de las respuestas mixtas con la misma voz de Allison.

**Turnos de voz** (`src/lib/tts.ts`, probado en `probar:voz`): la API sintetiza dos audios a la vez para todos sus clientes; lo que sobra espera turno hasta 15 s y, si no llega, la app cae a la voz del navegador. Desde el 28 de octubre de 2026, lo que el alumno deja de esperar sale de la fila: al tocar otro audio, el navegador corta la descarga, `request.signal` lo avisa a `/api/voz/[id]` y `sintetizar` suelta su turno, corta la petición a la API si ya iba y no reintenta. Antes, tocar tres etiquetas seguidas dejaba dos audios que nadie iba a oír delante del último.

## 4. Modelo de datos

### Usuarios e instituciones

- **users** — id, **tipo_acceso (email | institucional)**, email, password_hash, google_id, **username**, **pin_hash**, nombre, nivel (A1–C2), rol (student | coordinador | admin), institucion_id, email_verificado_at, ultima_practica_at, racha_dias
- **instituciones** — id, nombre, nit, **codigo_acceso (UNIQUE)**, contacto, tarifa_por_alumno_cop, cupo_alumnos, estado

> `username` es único **dentro de la institución**, no globalmente.

### Dos formas de entrar

| | Usuario general | Alumno de colegio |
|---|---|---|
| Ingresa con | **Correo, celular o usuario** + contraseña, o Google | **Código del colegio + usuario + PIN de 4 dígitos** |
| Se crea | Él mismo | Por **carga masiva** de lista (CSV) que hace el colegio o nosotros |
| Recupera acceso | Por correo | El **coordinador** restablece el PIN |

**Por qué sin correo:** un estudiante de colegio público en Colombia con frecuencia no tiene
email. Exigirlo cierra la puerta al mercado principal, y los correos inventados producen cuentas
irrecuperables.

El usuario general **siempre da su correo** — es el único canal para devolverle el acceso si
olvida la contraseña — y además puede registrar un **celular o un usuario** para entrar más
cómodo. Al iniciar sesión, un solo campo acepta cualquiera de los tres y el sistema deduce cuál
es. El celular se normaliza a 10 dígitos (acepta +57, espacios y guiones) y debe empezar por 3,
para que el mismo número escrito distinto no cree cuentas duplicadas.

Restricción en base de datos: `publico_requiere_correo`. Los alumnos de colegio están exentos —
no tienen correo, y su acceso lo restablece el coordinador.

### Rol coordinador

Persona del colegio con acceso limitado. **No da clase.** Puede:
- Ver qué alumnos practicaron, cuánto y en qué nivel
- Restablecer PINs
- Ver el reporte del grupo

No puede: ver conversaciones individuales, cambiar créditos, ni tocar la configuración.

### Créditos (núcleo del negocio)

- **saldos** — user_id, mensajes_plan, mensajes_recarga *(caché de lectura rápida)*
- **movimientos_credito** — libro contable **inmutable**: tipo (recarga | plan | consumo | bono | ajuste | reverso), cantidad, saldos resultantes, referencia. Nunca se edita ni se borra
- **transacciones** — monto_cop, mensajes_otorgados, pasarela, **referencia_externa (UNIQUE)**, estado, payload_webhook

> **Idempotencia:** el índice único en `referencia_externa` es lo que impide acreditar dos veces
> si la pasarela reenvía el webhook. Es el punto donde más se rompen estos sistemas.

### Planes y códigos

- **planes** — nombre, tipo, precio_cop, mensajes_por_mes, duracion_meses, activo
- **suscripciones** — user_id, plan_id, estado, periodo_actual (inicio/fin), mensajes_asignados, mensajes_usados
- **codigos** — codigo (UNIQUE), tipo (descuento_porcentaje | descuento_fijo | mensajes_bono | institucional), valor, institucion_id, usos_maximos, usos_actuales, vence_at, activo
- **codigo_usos** — auditoría de quién usó qué código

### Conversación y progreso

- **conversaciones** — user_id, titulo, tema_id, nivel_al_iniciar, ultima_actividad_at, **borrar_despues_de**
- **mensajes** — rol (alumno | allison), texto *(sin normalizar)*, audio_url, duracion_seg, **correcciones (jsonb)**, tokens_entrada / tokens_salida
- **errores_frecuentes** — user_id, tipo, texto_error, correccion, veces
- **progreso_diario** — user_id, fecha, mensajes, minutos, errores_corregidos, palabras_nuevas
- **temas** — nivel, titulo, objetivo, vocabulario_clave, estructura_gramatical, prompt_sistema
- **glosario** — user_id, texto, contexto, creado_en. Las palabras y frases que el alumno guarda desde un mensaje (selecciona el texto → **Guardar**) o escribe a mano en `/glosario`. Única por alumno sin distinguir mayúsculas. **No se borra** con las conversaciones: el contexto se copia porque el mensaje se va a los 20 días y el glosario se queda

### Mi ruta (etapa 5, `db/024_ruta.sql`)

El contenido de cada nivel vive en el código (`src/lib/ruta/`); la base guarda solo el avance. Cada parada tiene una clave estable con el nivel adelante (`a1-p03`, `a1-r1`, `a1-rf`), así que el avance de cada nivel queda aparte y se conserva al bajar y volver.

- **ruta_lecciones** — user_id, parada, leccion, paso (actividades hechas del intento en curso), aciertos y calificadas del intento, **estrellas** (la mejor, nunca baja), completada_en
- **ruta_paradas** — user_id, parada, estrellas del escenario, **sello_en** (estampilla), saltada_en, anterior_en (alumnos actuales), intento_salto_en (un intento de saltar por día)
- **ruta_fallos** — lo que el alumno no logró ni con las pistas, para el repaso sorpresa (etapa 7)
- **users** — meta_diaria_min, recordatorio_hora, recordatorio_enviado_en, primera_sesion_en, ruta_presentada_en, **nivel_maximo** (regla del nivel: solo baja; sube hasta donde ya estuvo o completando el nivel; el administrador sube y baja a voluntad)
- **progreso_diario.segundos_practica** — minutos de la meta de hoy. **marcar_dia_de_racha** cuenta el día si conversó o si sumó 3 minutos en la ruta, con dos días de descanso
- **conversaciones.modo = 'ruta'** y **conversaciones.ruta (jsonb)** — los escenarios y las entrevistas: cada intento es una conversación aparte que no se vuelve el hilo de Hablar
- **uso_diario.turnos_por_parte** — intervenciones por parte de la app (ruta, escenario, hablar), para el panel

Las reglas de qué está abierto, qué sigue, saltar y estrellas están en `src/lib/ruta/estado.ts` (puras, probadas con `npm run probar:ruta`). La evaluación corta está en `/api/ruta/evaluar` (el servidor busca lo esperado en el contenido) y los escenarios y la entrevista en `/api/ruta/escena` (prompt en `src/lib/ruta/escena.ts`, probado con flash-lite en `npm run probar:escena`). En la entrevista, el modelo solo clasifica (`clasificarEntrevista`) y lo que dice Allison sale de su ficha (`respuestaDeEntrevista`). Si en el mismo turno el alumno contesta su «And you?» y pregunta otro dato («I'm from Colombia. How old are you?»), `responde` lo marca: Allison reacciona («Nice!»), contesta y devuelve la pregunta. Antes la respuesta se comía la pregunta y Allison pedía otra (28 de octubre de 2026).

**Personas u objetos dentro de una foto** (`Zona` en `src/lib/ruta/tipos.ts`, en porcentaje del ancho y del alto): en Escucha y elige y en Adivina, cada opción con `zona` muestra ampliada su parte de la ilustración (`encuadreZona` en `src/lib/ruta/ilustracion.ts`; `ancho` dice cuánto se ve, 42 % si no se dice), así que ya no hace falta la descripción que delataba la respuesta; en ¿Qué es esto?, `flecha` es la punta de una flecha que baja sobre la foto (`IlustracionCompleta` la dibuja con las coordenadas del dibujo, alineada con object-contain). Los puntos se marcan mirando la ilustración aprobada.

**Etiquetas en Escucha y elige** (`etiqueta` y `etiquetaEs` en cada opción): una palabra en inglés de EE. UU. debajo de cada dibujo, en todas las de A1 y A2 que tienen ilustraciones (las de tarjetas, relojes y flechas ya son texto). Un toque la dice en voz alta y muestra su traducción al español (`etiquetaEs`); no cuenta como ayuda. Las que se dicen igual en los dos idiomas ("Pizza", "Chicago") solo suenan. Nombra lo que muestra el dibujo, no cuál es la respuesta (empezó en español con "Mañana", "Mediodía" y "Noche", porque el sol saliendo se confundía con un atardecer; pasó a inglés el 28 de octubre de 2026). Va en las tres opciones o en ninguna, y en inglés con su traducción (`probar:contenido` lo revisa). B1 no la lleva: su contenido aprobado no tiene texto a la vista.

**"Ver la frase"** está desde el comienzo y cuenta como ayuda (ya no es acierto al primer intento). Desde el 28 de octubre de 2026 la muestra en inglés (un diálogo, línea por línea) y la traducción queda a otro toque; antes en A1 traía la traducción de una vez, así que se acertaba leyendo en español. Al acertar, la etiqueta de la respuesta sale resaltada dentro de la frase y de su traducción ("a green hoodie", "un saco verde") cuando está como palabras enteras; en A1 con la traducción a la vista, en A2 a un toque. Las opciones se muestran en un orden mezclado y estable por frase (`desordenar`): en los datos la correcta iba primera en 38 de las 48 de A1, y tocar siempre el primer dibujo acertaba. El texto alternativo del dibujo es la etiqueta, no la descripción (que delata la respuesta).

**Auditoría de las actividades (28 de octubre de 2026)**, lo que cambió en la calificación y en la pantalla:
- **`normalizar`** (`src/lib/evaluacion.ts`) abre todas las contracciones; "'s" y "'d" según la palabra que sigue ("he's been" = "he has been", "I'd like" = "I would like", "she'd already left" = "she had"). Antes "I have been studying…" no coincidía con "I've been studying…" y se calificaba mal. Las decenas van en cifras ("thirty" = "30", "twenty five" = "25"), y una palabra junta vale separada ("stomach ache"). `mismaPalabra` tolera una letra de más o de menos, o una vocal por otra, pero no una consonante: "grandpa" ya no pasa por "grandma" ni "watches" por "watched".
- **Responde rápido** transcribe a ciegas y después juzga el texto (`juzgar`): en una sola llamada, con la pregunta a la vista, traducía lo dicho en español ("Tengo quince años" salía "I have fifteen years", correcto) y le arreglaba los errores.
- **Respuestas abiertas**: ¿Qué es esto? con "También se acepta: Cualquier consejo con should…" (cuatro actividades) y **Dilo en inglés** que no coincide con una frase aprobada pasan al modelo con la regla o con el español y las frases aprobadas: vale lo que dice lo mismo, con la misma gramática y sin errores ("exam" por "test", "What about" por "How about"). Escrito no se cobra (la pantalla promete que lo escrito no gasta intervenciones; la ruta tiene su límite por minuto), y lo dicho en español no se juzga. Medido con flash-lite: 62 de 64 casos bien.
- **Repite desde A2** ("Pequeñas fallas en el resto de la frase"): solo hace fallar la palabra difícil (`clave`), o no haber dicho casi nada.
- **La voz en la pantalla**: `detenerVoz` también cancela la frase que todavía se pedía y "Oír mi voz"; `decir` devuelve si sonó entera y no habla después de salir de la actividad, así una explicación cortada no sigue con la pista encima de la grabación.
- **El Grabador**: mientras graba siempre se puede terminar (en Responde rápido, tocar en el primer segundo lo dejaba deshabilitado hasta los 30 s), no envía lo escrito a la vez, y un toque de menos de 0,6 s no espera la cola.
- **Entrevista**: con la ficha completa, lo que no es pregunta ya no cuenta como ayuda y Allison le pregunta ella; un saludo, un "gracias" o "no sé" (`social`) tampoco; contesta dos preguntas de un turno (`otroDato`); "My name is Diego. And you?" ya no repite su nombre en bucle; solo devuelve la pregunta ("And you?") si habló de sí misma ("Her name is Emily. And you?" no tenía sentido) y, si no, pide otra; la pregunta de otra persona o de otro dato ("How old is your mom?") ya no recibe un dato ajeno.
- **Enséñale**: si el alumno responde y pregunta, la respuesta cuenta y sigue; una frase de tres palabras o más no es "corta"; una segunda respuesta corta ya cuenta; "Can you repeat?" (`aclarar`) recibe la pregunta más simple sin gastar intento.
- **Describe la imagen**: dice y muestra la consigna de la actividad (en A2 cambia); una cosa nueva por frase; la sugerencia no se repite y, si no queda frase modelo útil, nombra una cosa del dibujo que falta; cuentan las formas con -ing ("cooking") y las aceptadas sueltas ("flag").
- **Guardar**: un segundo Enter no guarda dos veces; más de 20 calificadas (Adivina) se escalan a 20 en vez de dar error para siempre; el repaso sorpresa ya guardado no da error al reintentar.

**Lo que se oyó** (`src/lib/transcripcion.ts`): con un audio en silencio o con ruido, el modelo devuelve marcas de tiempo en vez de una transcripción vacía ("00:00 00:01 00:02"), y a veces las intercala en lo dicho. `limpiarTranscripcion` las quita en Hablar, las escenas y la evaluación corta (solo las que empiezan con cero: una hora dicha, "7:30", se queda); si no queda nada, no se oyó voz ("Sorry, can you repeat that?", no cuenta como intento). En Hablar, el caso 6 ("no se entiende") es "No te oí bien." + "Can you say it again?", cada idioma con lo suyo; y si lo dicho es una frase clara en español, no es el 6: una pregunta a Allison en español ("¿Qué más puedes hacer?") es el caso 7 y recibe su versión en inglés para que la diga ("What else can you do? Try asking me!").

**La Guía de frases** (`src/lib/ruta/frases.ts`, probado en `probar:ruta`): sale de lo que se oye en Escucha y elige y de las frases de Dilo en inglés. Lo que Allison cuenta ('Sarah says: "Hi, I'm Sarah."') se aprende como lo que dice la persona, sin "Sarah says:", y lo mismo su traducción; una línea a medias ("Her name is…") no es frase.

**La frase del día** (`src/lib/expresiones.ts`, desde el 24 de octubre de 2026): una expresión de los nativos de Estados Unidos que no se entiende traduciendo palabra por palabra ("It's a piece of cake" es "es pan comido", no "un pedazo de torta"). Hay unas 30 por nivel (A1, A2 y B1; desde B2, las de B1), cada una con lo que significa en español colombiano que sirva para un muchacho o una muchacha, lo que NO significa (la traducción literal) y un ejemplo del nivel. Cambia cada día y es la misma para todos ese día; se ve en Mi ruta y en la ruta provisional. `probar:ruta` revisa que estén completas, sin repetir, sin español con género y con lo que significa distinto de la traducción literal; `probar:contenido`, que sean inglés de Estados Unidos. Salen en la lista de la docente de cada nivel.

**Las rayas de ¿Qué es esto?** (`src/lib/ruta/rayas.ts`, probado en `probar:ruta`): en A1 y A2 se van llenando. Una palabra de la respuesta que el alumno dijo queda puesta en verde (la evaluación devuelve cada palabra con `palabrasDeRepite`, partida igual que las rayas con `palabrasDeFrase`); con todo a la vista, acierta al decir la frase completa, porque el orden cuenta ("Can I try it on?" no es "I can try it on"). Una letra dicha ("G", "Gee", "la jota") o escrita aparece en azul en todos sus lugares; la escrita se busca en el navegador, sin pasar por el servidor ni gastar intervención. Ni la palabra ni la letra abren pista, pero buscar letras cuenta como ayuda: ya no es acierto al primer intento. El apóstrofo no lleva raya. B1 sigue como antes. En todas las de A1 y A2, `contexto` pone la situación en español debajo de la pregunta ("Son las 7 de la mañana y ves a tu vecino. ¿Qué le dices?"): dice qué se pide, sin traducir la respuesta. Allison solo dice la pregunta en inglés. Las etiquetas y las situaciones salen solas en la lista de la docente (`listar-por-revisar.mjs`).

**A2 (Reino Unido)** está entero en `src/lib/ruta/a2/` (diez paradas y dos repasos); mientras no pase la revisión de la docente, `rutaDe("A2")` solo lo devuelve con `RUTA_A2=1` (desarrollo) y los alumnos de A2 siguen en la ruta provisional (sus estampillas ya se guardan con las claves `a2-pNN`, así que se conservan). Lo que se escribió al pasarlo a datos está en `docs/CONTENIDO-A2-POR-REVISAR.md` (`node scripts/listar-por-revisar.mjs a2`). Reglas de A2 en las actividades de siempre: la traducción de Escucha y elige queda a un toque, las palabras de apoyo de Dilo y de la Entrevista aparecen tras el primer fallo, la ayuda del escenario da el comienzo de la frase (`escenario.ayudas`) y en el Repaso final aparece solo desde el segundo fallo (`ayudaDesdeSegundoFallo`). Sus ilustraciones viven en `public/ilustraciones/a2`; las de A1 que reutiliza llevan `a1/` delante (`srcIlustracion`, `src/lib/ruta/ilustracion.ts`). A2 suma dos actividades:

- **Adivina** — preguntas de sí o no hasta descubrir en qué piensa Allison, entre seis tarjetas y dos rondas. Corre en `/api/ruta/escena` con `actividad = adivina`: el modelo solo reconoce qué preguntó (`clasificarAdivina`) y la respuesta sale de la tabla aprobada (`src/lib/ruta/adivina.ts`, puro). Lo que piensa Allison queda en `conversaciones.ruta` y nunca sale al navegador (`estadoPublico`).
- **Cuéntame** — hasta 30 segundos sobre un tema. `/api/ruta/evaluar` lo transcribe a ciegas y después `comentarRelato` (`src/lib/evaluacion.ts`) copia las frases y elige una por mejorar y una cosa bien; el código verifica que lo citado esté en lo que dijo. Una intervención por intento, también escrito.

  **Arreglos de la auditoría (28 de octubre de 2026)**, en Cuéntame y Narra. Medido con flash-lite en 35 relatos de prueba: de 25 fallas a 1. *Frases*: el modelo ya no las cuenta, las copia; el código cuenta las distintas que están en lo dicho, en inglés y de dos palabras o más (`comentarioVerificado`). Cada idea con su verbo es una frase aunque vaya unida con "and" (una tirada de cuatro ideas contaba 2; ahora 4, también con audio real) y "I go to school." cuatro veces cuenta una (contaba 4). *Correcciones inventadas* (8 de 35, ahora 0): el prompt dice qué no es un error (contracciones, first/then/after that/now/so/finally, "at six", la puntuación) y el código descarta la mejora si lo dicho y lo mejor son lo mismo sin signos, contracciones ni conectores ("First Zoe…" → "Zoe…", una tirada → la misma con comas), si la mejor agrega contenido ("Math." → "I like math.", "at six" → "at six o'clock" o "at 6 AM"), si lo dicho es del modelo de Allison o si está en español. *Lo bien hecho* (8 de 35 elogiaban un error, ahora 1): el prompt pide la mejora primero y una frase sin ningún error, y el código no muestra la que se corrige ni un error previsto de Narra (`siDice`). *Español*: "la mayor parte en español" no vale si dijo más frases en inglés que en español. Si no se oyó voz no se cobra: el navegador mide el volumen como el Grabador y no envía un relato en silencio («No te oí. Revisa que el micrófono no esté silenciado, o escribe.»), y el servidor devuelve la intervención si la transcripción sale vacía. Si el envío falla (red, IA, tiempo), la grabación queda y se puede «Enviar otra vez». La pausa antes del mínimo graba 0,7 s más antes de pausar (`COLA_GRABACION_MS`) y Allison habla ya en pausa; «Escribir» no se ve mientras se abre el micrófono. «Prueba con:» usa la pregunta guía iluminada (o una distinta en cada intento).

**B1 (Canadá)** está entero en `src/lib/ruta/b1/` (diez paradas y dos repasos, del documento "Contenido B1" aprobado el 17 y el 18 de octubre de 2026). Como A2, `rutaDe("B1")` solo lo devuelve con `RUTA_B1=1` mientras no pase la revisión de la docente (con un nativo de Estados Unidos para el Repaso final) y la prueba; lo escrito al pasarlo a datos está en `docs/CONTENIDO-B1-POR-REVISAR.md` (`node scripts/listar-por-revisar.mjs b1`) y las ilustraciones se pasan con `npm run ilustraciones:b1`. Desde B1 Allison deja de llevar al alumno de la mano (`desdeB1`, `src/lib/tipos.ts`):

- **Lo que explica va en inglés sencillo**, y un toque en «En español» lo muestra traducido, una cosa o la otra (`Explicado` en `src/components/ruta/leccion/comun.tsx`; los datos traen `explicacion` en inglés y `es`). Vale para Dilo, ¿Qué es esto?, Repite (`consejoEs`), Narra y los comentarios de Cuéntame (`comentarRelato` devuelve el "porqué" en inglés y en español). En la Entrevista, Allison da su pista en inglés (`entrevista.pistas`) en vez de preguntar en español, y en el escenario, si el alumno habla en español, dice "Sorry, in English, please!" sin salir del inglés.
- **Escucha y elige** es una historia sin traducción ni texto a la vista; se oye otra vez y, una sola vez, más despacio. **¿Qué es esto?** trae una sola pista. **Dilo** no tiene palabras de apoyo: la frase tiene dos partes (`dilo.partes`) y al primer fallo Allison da la primera palabra de la que falló (`primeraDeLaParte`). **Responde rápido** es de 20 segundos y **Cuéntame** de un minuto (acierto desde 40 segundos con 5 frases).
- **Narra la secuencia** (`Narra.tsx`): cuatro dibujos en orden, las palabras para ordenar y un minuto. `/api/ruta/evaluar` lo transcribe a ciegas y `comentarNarracion` dice qué dibujos contó, con la cita de cada uno; el código los ordena por dónde está cada cita en lo dicho (`dibujosContados`: el modelo daba [1, 2, 3, 4] aunque los contara al revés), descarta los de cita en español o que no dijo (contaba los dibujos contados en español), cuenta cuántos van en orden (`dibujosEnOrden`, acierto con 3 de 4) y cuál faltó. Si falta el primero, Allison pregunta "What happened first?" (no "next"). Escrito, si los dibujos están pero faltan frases, el título lo dice y se ven las frases. La explicación prevista solo sale si es la de la frase que se corrige, y al repetir la frase mejor ya no dice "¡Bien! Así se dice." (no se comprueba): el alumno oye su voz y la compara con la de Allison. La ayuda muestra el verbo de cada dibujo y apaga una estrella.
- **Enséñale a Allison** (`Ensenale.tsx`): la Entrevista al revés. Corre en `/api/ruta/escena` con `actividad = ensenale`; el modelo solo reconoce si respondió, si fue muy corto o si le preguntó algo (`clasificarEnsenale`), y lo que dice Allison sale de la actividad aprobada (`respuestaDeEnsenale`): reacción y pregunta siguiente, "Tell me more!", la pregunta más simple, o su respuesta de la ficha (`respuestasDeAllison`). Termina después de las cuatro preguntas.
- **El escenario trae un imprevisto** (`escenario.imprevisto`): la tarea que lo resuelve no se ve (ni en pantalla ni para el modelo, `tareasVisibles`) hasta cumplir la tarea después de la cual pasa; en ese turno Allison dice la línea aprobada del diálogo de ejemplo (`imprevisto.linea`), así llega siempre igual. Para no dar tareas por cumplidas antes de tiempo, el modelo ve junto a cada tarea lo que dice el alumno en el ejemplo (probado con flash-lite contra los diálogos de ejemplo de Toronto, Banff y el Repaso final). La ayuda da la idea en inglés (`escenario.ayudas`) y el mínimo es de 12 intervenciones.

El mapa de Canadá (`MapaViaje`), las estampillas de las diez ciudades y la de "B1 completo" (`Estampilla`, `selloDe`) y los ajustes aprobados del mapa (`src/lib/ruta/mapas.ts`) ya están. `npm run probar:contenido` revisa B1 con sus reglas.

### Viajes, Escenarios y repasos sorpresa (etapa 7, `db/025_viajes_escenarios_repasos.sql`)

Los tres usan piezas de la ruta. Los viajes y los escenarios corren con el mismo motor del escenario de cierre (`src/lib/ruta/escena.ts`, `/api/ruta/escena` con `actividad` = `viaje` o `catalogo`) y la misma pantalla de conversación (`EscenaChat`, pantalla 8): portada, Allison en su papel, la misión con sus tareas (las 3 de un viaje con íconos; con más de 4, una fila de números y la tarea de ahora), burbujas con audio y traducción, y la idea, el micrófono y el teclado.

- **Viajes** — el contenido está en `src/lib/ruta/viajes.ts` (fichas culturales verificadas); `reglasDeViaje` le pasa al prompt solo esos datos, las preguntas para comparar con Colombia (preguntando, nunca afirmando) y lo que se evita. Cada viaje se abre al ganar el anterior y respeta su nivel mínimo. **viajes_avance**: estrellas (la mejor), sello_en, veces.
- **Escenarios** — el catálogo está en `src/lib/escenarios/datos.ts` (sin base, lo leen las pruebas) y los propios en **escenarios_propios** (`/api/escenarios/propio`: flash-lite arma título, lugar, papel, contexto, 6 tareas (sirven desde 5) y la primera línea; usa 1 intervención y se devuelve si la IA falla o el pedido no sirve). **escenarios_avance**: estrellas y veces, también de los propios (`propio:<id>`).
- **La idea** — `pedirAyuda` cuenta la ayuda (deja el máximo en 2 estrellas, como en los escenarios de cierre). Sigue la conversación: el mismo modelo que escribe la línea de Allison escribe qué podría responderle el alumno (`idea`, `ideaEs` e `ideaTarea` en `turnoDeEscenario`), y se guarda en el estado de la escena. Así, si Allison pregunta "Why are you here?", la idea es "I'm here on vacation." y no la frase de otra tarea. Se descarta la idea que es línea del personaje o que no responde nada ni hace una tarea; y cuando el alumno habló en español, la idea es la frase en inglés que Allison le dio. En el escenario de una parada, la ayuda aprobada del contenido manda cuando Allison pregunta por la tarea (en A2, solo el comienzo de la frase); la idea, cuando hace una pregunta de más. Sin idea (el primer turno) va la frase del diálogo de ejemplo para la tarea que sigue y, si la escena no la trae (viajes y propios), la sugiere `/api/ayuda`, gratis.
- **El turno hablado** (prueba en producción del restaurante, octubre de 2026) — el audio se transcribe primero **a ciegas** (`transcribirACiegas`, sin la conversación) y la escena recibe el texto: con el audio y el historial juntos, el modelo copiaba lo que el alumno había dicho antes ("Hello, good morning." dos veces). La transcripción recibe la situación de la escena en español ("Llegas en avión a Estados Unidos…"), nunca la pregunta ni la respuesta esperada, y solo para lo que no se entiende: con acento marcado, "I'm here on vacation" salía "I'm going to make a cake"; con la situación, 24 de 24 grabaciones de prueba salen bien (sin ella, 22) y el español, los titubeos y el silencio quedan igual. Lo mezclado ("Okay okay, somos 14 personas") cuenta como español (`mezclaEspanol`: dos palabras que solo pueden ser español, sin las de los nombres como "de" o "la"; las muletillas en inglés no lo vuelven inglés): no cumple la tarea y Allison da la frase en inglés, sin muletillas ni palabras repetidas ni calcos ("There are fourteen of us. Try it!", no "We are fourteen people": `sinCalcos`); si el modelo no la escribió, se pide aparte (`alIngles`). Si el alumno preguntó en español, la frase conserva la pregunta.
- **El objetivo de la escena** — cada turno le recuerda al modelo la tarea que sigue con la pregunta del ejemplo que lleva a ella, y que no haga preguntas de más cuando quedan tantas tareas como turnos para el mínimo. Mientras falten tareas (no solo antes del mínimo) la línea termina en pregunta (`llevaPregunta`: un eco corto como "Fourteen people?" no cuenta); si no, va la del ejemplo. El código quita de la línea de Allison la frase del alumno para una tarea pendiente ("Can I have the check, please?", "I'm here on vacation.") y la pregunta de la tarea que acaba de cumplir (`sinFrasesFueraDeLugar`). Sin diálogo de ejemplo (viajes, propios), cuando lo que sigue es que el alumno pregunte, Allison no lo pregunta ella ("Who built Chichén Itzá?"): lo invita ("Do you have any questions?", `sinPreguntasDeInformacion`). Un saludo solo no cumple "Saluda y di…", y "Paga y da las gracias" se reconoce en el código ("Here you are. Thank you!"). Allison nunca repite entera su línea anterior (`sinRepetirLaAnterior`: después de un "yes" la dijo otra vez en producción): si el modelo la repite, va la pregunta de la tarea que sigue.
- **La voz y el avatar** — el celular solo deja sonar audio que empezó con un toque: `DesbloquearVoz` (en el layout) desbloquea la voz con el primer toque en la app, y "Empezar" también, antes de esperar la primera línea; sin eso Allison abría muda y su foto no se movía. En el celular, cuando la tarjeta de Allison sale de la vista, `EscenaChat` muestra una barra fija arriba (opción A, elegida el 25 de octubre de 2026): su foto de 56 px (se mueve mientras habla, con ondas junto al nombre), su papel ("Agente de migración del aeropuerto", "Tu guía en Río": `guia.papel`), el avance de las tareas en una barra por tarea (verde las cumplidas, azul la de ahora) y la tarea de ahora completa. Con "reducir movimiento" la foto no se mueve pero se ilumina con el ritmo (`habla-luz`).
- **Cuántas tareas** — cada escenario del catálogo tiene 6 o 7 tareas y un diálogo de ejemplo de 10 intervenciones del alumno, el mínimo de la escena; el de la Parada 1 de A1 pasó de 4 a 7 tareas. Con 3 tareas para 10 turnos, Allison rellenaba con preguntas fuera del nivel ("Do you have anything to declare?"). Una tarea cuenta solo si se hace completa, como en su ejemplo (también la doble, "saluda y di tu nombre"), y el código reconoce solo las más simples como respaldo del modelo (`tareasObvias`: saludar, despedirse, el nombre, la edad, de dónde eres, cómo estás). Allison nunca dice como suya la frase del alumno ("I'm from Colombia." cuando el alumno dijo "I from Colombia"): `sinEcoDelAlumno` la quita.
- **Lo que arregló la auditoría de los escenarios** (28 de octubre de 2026, medido con flash-lite; casos en `probar:escena`, sección "Escenarios · auditoría") —
  - *Tareas de dos partes*: el modelo marcaba "Cuenta qué te duele y desde cuándo" con solo "I have sore throat", "Da la dirección y despídete" sin despedida y "Pide un postre" con "What is the dessert?". Ahora el prompt exige las dos partes (y que pedir sea pedir, y que preguntar cuente con cualquier pregunta sobre eso), y el modelo devuelve aparte lo que quedó a medias (`aMedias`, con lo que falta): se guarda en el estado de la escena (`EstadoEscena.aMedias`) y la tarea se completa cuando el alumno dice lo que falta, en ese turno o en otro. El código lo asegura con la despedida (`tareasDelTurno`: "…y despídete" no cuenta sin una despedida, y una a medias por la despedida se completa al despedirse), deja a medias "Saluda y…" con un saludo solo y cuenta una tarea de preguntar dicha con la pregunta misma del ejemplo ("And you? Where are you from?": el modelo la contestaba y no la contaba). Las tareas cuentan en cualquier orden, y el recordatorio ya no nombra la tarea que sigue por su número: "for task 3" le hacía creer que el mensaje no hacía la 3.
  - *La pregunta del alumno*: si contesta y pregunta en el mismo turno ("I'm from Colombia. And you, where are you from?"), el recordatorio le pasa al modelo su pregunta para que la conteste primero; antes seguía con la suya sin contestar.
  - *Lo que no le toca decir*: no adelanta lo que una tarea pendiente le pide averiguar al alumno (regla en el prompt, y el código quita la respuesta del personaje en el ejemplo a esa pregunta: "My name is Mia.", "M, I, A.", el precio); tampoco la frase del alumno de una tarea pendiente aunque no sea pregunta ("See you, Mia! Bye!" en boca de Mia).
  - *La línea* (`ajustarLinea`): "Do you have any questions?" solo en escenas sin diálogo de ejemplo (viajes, propios; con diálogo reemplazaba "When did it start?" en Brighton); "Pregúntale…" también es preguntar (`esTareaDePreguntar`); antes del mínimo se quitan las despedidas (`sinDespedida`) y va una pregunta del personaje que no ha hecho (`preguntaSinUsar`); si su pregunta es la del ejemplo de otra tarea pendiente, va la de la que sigue (`sinSaltarTareas`); sin diálogo de ejemplo, una pregunta por lo que pide la tarea (`preguntaParaLaTarea`: "Are you hungry?" para pedir comida) y la guía no pide por el alumno (`sinPedirPorElAlumno`: "I'd like some tacos, please."); nunca la línea anterior otra vez, mirado al final, ya con la pregunta; las muy largas para el nivel pierden las oraciones del medio (`recortarLinea`). De relleno, "Okay." (con "Great!" felicitaba a un enfermo). Tras el imprevisto de B1 va la pregunta del ejemplo para su tarea.
  - *La idea*: se compara con las líneas del personaje por oraciones enteras (antes descartaba ideas buenas como "Yes, it is.") y también con lo que ella ya dijo; si el código puso la pregunta del ejemplo, la idea es lo que el alumno contesta en el ejemplo; sin diálogo de ejemplo, la idea de una tarea de dos partes se descarta (daba la mitad) y la pantalla la pide a `/api/ayuda`.
  - *El cierre* (`cierreDelEscenario`): la despedida del último turno y el texto de "Te faltó" salen del ejemplo aprobado separados por oración, sin "Ms. Patel:", comillas ni "En pantalla:" (B1), sin el "Vamos a repasar there is…" mezclado con la despedida (A1 P8, A2 P5 y A2 P8), y con el nombre del alumno en vez de "Diego".
  - *La ayuda*: solo se cobra si hay algo que mostrar; en viajes y propios sin idea, la pantalla la pide a `/api/ayuda` y vuelve con `sugerida` para que se cobre. El contador de estrellas de la pantalla se toma del servidor en cada turno y en cada ayuda. Desde B1 la etiqueta es "Ayuda · idea" (es una indicación, no una frase para decir).
  - *Verificación de las 56 escenas* (28 de octubre de 2026: cada una con su diálogo de ejemplo contra flash-lite, y comparada con la versión publicada). Lo que el código decide sin esperar al modelo, en `tareasDelTurno` (probado en `probar:ruta`): la frase misma del ejemplo cuenta siempre, y una tarea de dos líneas se cumple dicha en dos turnos; en los viajes, comparar con Colombia nombrándola, planear con un plan ("going to", "tomorrow") y una pregunta de verdad para la tarea de preguntar que sigue. Y lo que no cuenta aunque el modelo diga que sí: un mensaje que solo pregunta no hace una tarea de decir (contar, pagar, comparar, escoger…), pagar pide algo de pagar y comparar, una comparación. Además: la reacción al imprevisto no repite lo que trae su línea; un nombre deletreado ("Gómez. G-O-M-E-Z.") no es español; mientras falten tareas Allison no se despide; y si de su línea no queda nada, le da pie al alumno en vez de un "Okay." suelto. Exigir las dos preguntas de "Pregunta X y Y" se probó y se quitó: el modelo marca a veces en la segunda y la escena no se podía terminar.
- **Repaso sorpresa** (`src/lib/ruta/repaso.ts`, `/ruta/repaso`, pantalla 9) — toma de **ruta_fallos** lo que lleva más de 2 días sin repasar (`repasado_en` nulo), máximo 5 preguntas y 2 repasos por día, mínimo 3 fallos. ¿Qué es esto?, Dilo y Repite vuelven tal cual; la frase que Allison dio en Describe y la mejora de un escenario (lección 0) se repiten; la pregunta de Responde rápido vuelve sola. **repasos_sorpresa** guarda las preguntas: `/api/ruta/evaluar` recibe `repaso` y `n` y busca lo esperado ahí, no en lo que mande el navegador. Al terminar (`/api/ruta/repaso`) da 1 estrella; lo que salió bien sale de la lista y lo que se volvió a fallar regresa más adelante (una Repite escrita no cuenta ni para bien ni para mal).
- **Practicarla** — en el resumen de una escena, la frase mejor se repite con Repite; `/api/ruta/evaluar` con `escena` toma la frase de la conversación del alumno.
- **estrellasTotales** suma lecciones, escenarios de cierre, viajes, escenarios y repasos.

### Panel de administración (etapa 8, `db/026_panel.sql`)

Ocho secciones (plan, secciones 12, 16 y 21): Resumen, Uso e IA, Alumnos, Colegios, Reportes, Ruta, Recargas y Ajustes. Las consultas viven en `src/lib/panel/`; todo el panel se arma por petición (`dynamic = "force-dynamic"` en su layout).

**Cada página del panel se protege sola** con `await paginaDeAdmin()` en su primera línea (`src/lib/admin.ts`; `npm run probar:admin` lo revisa). El chequeo del layout no basta: en Next 16 una página se puede pedir sin volver a correr su layout (navegación del cliente con el encabezado del árbol de rutas), y sus datos viajarían igual. Las rutas de `/api/admin/*` llaman a `exigirAdmin()`.

Otras reglas de seguridad que no se ven en pantalla: las rutas que reciben audio, CSV o avisos de pago rechazan un cuerpo grande antes de leerlo (`cuerpoExcede`, `src/lib/limite.ts`); los avisos al celular solo van a los servicios de los navegadores (`esServicioDeAvisos`, `src/lib/avisos.ts`); los CSV del panel neutralizan las fórmulas (`celdaCsv`); en Adivina, en qué piensa Allison no sale del servidor (`adivinaParaElNavegador`); el tiempo de práctica que se acredita no pasa de lo que de verdad transcurrió entre actividades (`sumarTiempo`); y una cuenta creada con un correo sin verificar pierde esa contraseña cuando su dueño entra con Google (`vincular`, `src/lib/entrada-google.ts`).

- **ajustes** (clave → valor jsonb, con quién y cuándo) — el dólar del costo de IA, los días de descanso de la racha (`dias_descanso()` en SQL: lo usan `marcar_dia_de_racha`, la sesión, el colegio y el recordatorio), los umbrales de "Para atender hoy", el recordatorio por correo y la fecha de la versión nueva (parte la retención en antes y después). `src/lib/ajustes.ts` los lee una vez por petición.
- **users.curso** y **users.racha_maxima** — el curso sale de la carga masiva (`src/lib/cargaAlumnos.ts`, la usan el coordinador y el administrador; con encabezado lee nombre, usuario, curso y nivel en cualquier orden) o se cambia en la ficha.
- **asignaciones_saldo** — asignar saldo a un colegio o a sus cursos: cada alumno activo recibe por `ajustar_saldo` (bolsa de recarga, con motivo y autor en la nota) y queda una fila de la asignación. Todo o nada, en una transacción.
- **ruta_consumo** — intervenciones por parada y las que se fueron en errores (no se oyó voz); lo anotan `/api/ruta/evaluar` y `/api/ruta/escena`.
- **ruta_actividades** — cada actividad terminada con sus calificadas y aciertos (acierto al primer intento en la sección Ruta).
- **escenas_intentos** — cada escenario, entrevista, viaje y escenario del catálogo con sus intervenciones y si terminó; sin llave a conversaciones, para que la cifra sobreviva al borrado a los 20 días.
- **Recargas manuales** — `/api/admin/efectivo` crea una transacción con `pasarela` = efectivo o transferencia (recibo, valor recibido y quién en el payload) y la acredita por `acreditar_transaccion`, como los pagos en línea; también activa el plan mensual. El cuadre del día y la tabla de consumo se descargan en CSV (separador punto y coma, para Excel en español).

### Avisos en el celular y competencia por salón (etapa 9, `db/027_avisos_competencia.sql`)

Documento "Competencia por salón y recordatorios en el celular", aprobado el 17 de octubre de 2026.

- **suscripciones_push** — cada aparato que aceptó los avisos (Web Push, sin tienda de apps ni servicio pagado). `src/lib/avisos.ts` cifra y envía con las llaves `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`; sin ellas los avisos quedan apagados y todo sigue por correo. Un aparato que el servicio da por muerto (404 o 410) se borra. Del lado del navegador, `src/lib/avisosCliente.ts` (`useAvisos`) pide permiso y suscribe; se activa en Perfil → Ajustes o en la tarjeta única de Mi ruta (racha de 3 días). En iPhone solo con la app en la pantalla de inicio (iOS 16.4+).
- **El recordatorio de la racha** (`recordarRachas` en `/api/tareas/limpiar`) — la regla del correo: el último día antes de perder la racha, a la hora elegida, uno al día. Va al celular si el alumno tiene un aparato y el interruptor `ajustes.recordatorio_celular` está encendido; si no, por correo. Nunca los dos. Para los alumnos de colegio es el único posible: no tienen correo.
- **La competencia** — no guarda nada propio: sale de `progreso_diario.segundos_practica` (tope de 30 minutos por alumno al día) y de `users.curso`. Promedio entre todos los alumnos activos del salón, mínimo 5 alumnos por salón y dos salones para competir, semana de lunes a domingo en hora de Colombia. Reglas puras en `src/lib/competencia/tabla.ts` (`npm run probar:competencia`), consultas en `src/lib/competencia/index.ts`. El alumno ve su puesto y los tres primeros en Mi ruta y, si su salón ganó, una celebración la primera vez que entra en la semana siguiente; el coordinador ve las dos semanas en `/colegio` y la apaga con `instituciones.competencia_activa`. Solo reconocimiento: sin intervenciones de regalo.

## 5. Papel de n8n

| n8n SÍ | n8n NUNCA |
|---|---|
| Correo de bienvenida y verificación | Dentro de la conversación (latencia) |
| Aviso "te quedan 10 mensajes" | Dar o quitar créditos |
| "Tu plan se acabó, ¿renuevas?" | Procesar el webhook de pago |
| "Llevas 3 días sin practicar" | Cualquier cosa que el alumno espere en pantalla |
| Reporte semanal a colegios | |
| Llamar cada día a `/api/tareas/limpiar` (borrado a 20 días) | |

El webhook de pago lo recibe **la aplicación**, que acredita dentro de una transacción de base de
datos con control de duplicados. n8n se entera después, solo para notificar.

## 6. Plan de construcción

| Fase | Contenido |
|---|---|
| **0 — Fundaciones** | Servidor, Dokploy, dominio, Cloudflare, Next.js + Postgres + Redis, esquema de BD, registro con email y Google |
| **1 — La conversación** | Grabación en navegador (móvil), integración Gemini con audio, cola + worker TTS, reproducción, avatar animado, transcripción con botón, descuento de créditos |
| **2 — Cobro** | Pasarela, recarga de monto libre, planes, webhook idempotente, cupones, prueba de 5 intervenciones |
| **3 — Progreso y currículo** | Niveles, temas por nivel, modo libre, panel de progreso, errores frecuentes |
| **4 — Admin e instituciones** | Panel de administración, alta de colegios, códigos por volumen, reportes |
| **5 — n8n y pulido** | Correos y avisos automáticos, borrado a 15 días, reportes semanales, PWA instalable |

## 7. Pendientes por definir

- Specs del servidor actual (¿se reutiliza como worker?)
- Diseño del avatar de Allison — ¿existe la ilustración?
- Cómo compra un colegio: ¿códigos de registro o carga de lista de alumnos?
- Consentimiento de acudiente para menores (Ley 1581 de 2012)
- Precio por alumno para instituciones
- Currículo: ¿material propio o se redacta desde cero?
- Dominio, plazo objetivo, presupuesto mensual de operación
- Términos y condiciones · política de tratamiento de datos · política de reembolso

## 8. Modelo de Gemini

| Entorno | Modelo | Costo por mensaje | Por qué |
|---|---|---|---|
| **Desarrollo / pruebas** | `gemini-2.5-flash-lite` | ~2 COP | Un tercio del costo; suficiente para validar el flujo |
| **Producción (a evaluar)** | `gemini-2.5-flash` | ~6 COP | Mejor calidad pedagógica; soporte de audio confirmado |

Se cambia con la variable `GEMINI_MODEL` en el `.env`. **No requiere tocar código.**

Los Flash de generación 3.x (`gemini-3.5-flash`, `gemini-3.7-flash`) quedan descartados por
ahora: cuestan de 3 a 5 veces más y la documentación de Google no confirma que acepten audio de
entrada — sin eso, la corrección de pronunciación no funciona.

**Pendiente de verificar con la clave de API:** consultar el endpoint de listado de modelos para
confirmar cuáles aceptan audio de verdad. Las dos páginas de documentación consultadas no
coinciden entre sí.

## 9. Retención de datos

**Se borra a los 20 días:** las conversaciones y sus mensajes (y los audios, cuando se
almacenen). Un trabajo diario de n8n llama a `POST /api/tareas/limpiar` con el secreto
`TAREAS_SECRETO` en la cabecera `Authorization`.

**No se borra nunca:** racha, progreso diario, errores frecuentes y temas, saldos,
movimientos de crédito y transacciones. El alumno pierde el historial de charlas, nunca su avance.

> **Por qué el contador de turnos limpios vive en una columna y no se calcula.**
> Antes se contaban las filas de `mensajes` posteriores al último error. Al borrar las
> conversaciones viejas ese conteo se desploma, y un alumno que sí mejoró vería su progreso
> retroceder sin entender por qué. El contador es un número que sobrevive al borrado.
> Esto hubo que arreglarlo **antes** de activar el borrado, no después.

La tarea borra además los enlaces de verificación y recuperación vencidos hace más de 30 días.

**El alumno puede borrar cuando quiera.** En `/conversaciones` ve su historial, entra a cualquiera
para releerla, y borra una o todas. El progreso nunca se toca, y la pantalla se lo dice antes de
confirmar.

> **Decisión del cliente:** no se muestra en la app ningún aviso del plazo de 20 días. El plazo
> debe quedar informado en la política de tratamiento de datos, que la Ley 1581 exige y sigue
> pendiente de redactar.
