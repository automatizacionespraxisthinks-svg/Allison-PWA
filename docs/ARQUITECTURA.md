# Allison — Profesora de inglés con IA
Especificación técnica · v1 · agosto 2026

## 1. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Mercado | Colombia — colegios públicos/privados y público general |
| Plataforma | Web responsive + PWA instalable, prioridad celular |
| Conversación | Por turnos (no llamada en tiempo real) |
| **Motor (opción B+)** | El audio va **directo a Gemini**, que devuelve (a) la transcripción literal de lo que dijo el alumno y (b) la respuesta de Allison. **Whisper NO se usa.** El VPS solo genera la voz (TTS) |
| Corrección | Pronunciación y gramática corregidas dentro de la conversación. **Sin puntaje numérico** |
| Transcripción | Visible con botón mostrar/ocultar |
| Avatar | Foto realista de Allison (generada por IA, sin problema de derechos). **Tres bucles de video pregenerados** — reposo, escuchando, hablando. Sin sincronía labial en vivo |
| Idioma | Inglés casi siempre; español solo en casos puntuales. Acento neutro |
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
- **Recarga:** mínimo $7.900 (sep-2026; antes $4.000), de ahí en adelante monto libre. **No caducan**
- **Bono por volumen:** +10% desde $20.000 · +15% desde $50.000
- **Planes:** mensual $35.000 / semestral $180.000 / anual $320.000 — 500 mensajes por mes
- **Los mensajes del plan caducan** al terminar el mes. Al agotarse se le **pregunta** al alumno si quiere renovar (no hay débito automático forzado)
- **Planes de varios meses:** entregan los mensajes **cada mes**, contados desde el día de compra (un plan del 31 no se corre al 28). Lo pone al día `renovar_suscripcion` (db/020): al cargar el saldo del alumno y en la tarea de cada hora. Los meses en que nadie la pone al día no se entregan de golpe: habrían vencido igual
- **Orden de consumo:** primero los del plan, después los de recarga
- **Prueba gratis: 20 mensajes, entregados en dos partes**
  - **5 al registrarse** — para que pruebe el producto sin fricción
  - **15 al confirmar el correo** — el enlace vence en 48 h y solo sirve una vez
  - Con **Google** llegan los 20 de una: el correo ya viene verificado
  - Los **alumnos de colegio reciben los 20 completos**: no tienen correo que confirmar
  - *Por qué partido:* entregar los 20 de golpe significa pagarle a Google 20 mensajes por cada correo inventado
- **Sin factura electrónica** por ahora

### Costo real por mensaje

| Componente | COP |
|---|---|
| Gemini (audio entrada + texto salida) | ~7 |
| TTS propio | 0 (ya pagas el servidor) |
| **Margen sobre plan de $35.000** | **~90%** |

> Verificar tarifas de Gemini en la página oficial antes de fijar precios definitivos.

### Comisiones de pasarela — decisión (sep-2026)

La pasarela es **Bold**, con el **QR Bre-B** como medio principal: 2,89% + IVA **sin valor fijo**
(exige la Cuenta Bold). Es lo que hace viable la recarga mínima de $7.900: ahí el QR cuesta ≈3,4%,
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
                   |  Worker TTS      |
                   |  n8n             |
                   +--------+---------+
                            |
        +-------------------+--------------------+
        |                   |                    |
   Gemini API        Pasarela de pago     Cloudflare R2
  (audio -> texto)  (Nequi/PSE/tarjeta)  (audios, TTL 15 días)
```

**Regla de oro:** los componentes van en contenedores separados y se comunican por cola (Redis).
El despliegue arranca en un solo servidor, pero mover el worker de TTS a otra máquina
debe ser cuestión de minutos, sin tocar código.

### Flujo de un turno

1. El navegador graba audio (máx. 60 s, formato opus) y lo sube
2. La app verifica saldo — si no hay, avisa y ofrece recargar
3. Audio + historial + prompt del nivel se envían a **Gemini**
4. Gemini devuelve: transcripción literal + respuesta + correcciones detectadas
5. La respuesta entra a la **cola de TTS**; el worker genera la voz
6. El navegador reproduce el audio y anima el avatar
7. Se descuenta 1 mensaje (transacción en BD) y se registra el movimiento

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
| **2 — Cobro** | Pasarela, recarga de monto libre, planes, webhook idempotente, cupones, prueba de 20 mensajes |
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
