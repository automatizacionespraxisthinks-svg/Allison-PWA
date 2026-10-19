# Desplegar Allison en Dokploy

Guía en orden. Lo que aquí dice "candado" está garantizado por código:
si falta, la app **falla con ruido** en vez de fingir que funciona.

Las variables con sus valores ya generados están en **`.env.production`**
(raíz del proyecto, fuera de git). Ábrelo y cópialas de ahí.

---

## 1. Antes de desplegar

- [ ] **Base de datos**: la app necesita una base con el esquema de
      Allison. Dos situaciones:
      - **Ya existe** la base `allison` en el Postgres del VPS (el del
        puerto 5421), completa y migrada. Si `DATABASE_URL` apunta ahí no
        hay nada que hacer — pero fíjate en que el nombre de la base sea
        `allison`, no `postgres`: esa es la de n8n y no tiene el esquema.
      - **Creaste un Postgres nuevo en Dokploy** (nace vacío): corre
        `db/manual/base-completa.sql` (punto 5). Un solo archivo, y la
        base queda lista con esquema y administrador.

- [ ] **Llave de Gemini NUEVA**: la de desarrollo pasó por chats y logs.
      Créala en Google AI Studio y **ponle límite de gasto mensual** ahí
      mismo: es lo único que te protege de que un error en bucle o un
      abuso disparen la factura.

- [ ] **Correo**: Gmail SMTP con `allison.teacher00@gmail.com` (tope ~500
      correos/día), **por el puerto 587**. Hetzner bloquea la salida por
      el 25 y el 465 en las cuentas nuevas, y con 465 el envío se quedaba
      colgado sin decir nada. `GMAIL_PUERTO=587` va por defecto.
      Compruébalo desde el propio servidor, ya desplegado:
      ```
      curl -H "Authorization: Bearer EL_TAREAS_SECRETO" "https://TU-DOMINIO/api/salud?correo=1"
      ```
      Responde `"conecta": true`, o el motivo en palabras (`pista`).


- [ ] **Bold** (la pasarela): cuenta **a nombre de PRAXIS - THINKS
      S.A.S.** —registro de persona jurídica, con el certificado de Cámara
      de Comercio y la cuenta Davivienda de la empresa—, porque es la
      empresa la que figura como vendedora en los términos y como
      responsable en la política de privacidad. Y **tres pasos en su
      panel que no están en el código**:
      1. **Activar la Cuenta Bold.** Sin ella no aparece el QR Bre-B,
         que es el medio más barato: 2,89% sin valor fijo, contra 2,89%
         + $900 de PSE o tarjeta. En la recarga mínima de $8.000 es la
         diferencia entre perder 3,4% o 17%.
      2. **Activar las llaves** de *Botón de pagos* (Integraciones →
         Llaves de integración). La API de links usa esas. Van en
         `BOLD_LLAVE_IDENTIDAD` y `BOLD_LLAVE_SECRETA`.
      3. **Registrar el webhook** (Integraciones → Webhooks):
         `https://TU-DOMINIO/api/pagos/webhook`. Sin él, el pago igual se
         acredita cuando el alumno vuelve a la app o en la conciliación
         de cada hora, pero con demora.
         Bold espera la respuesta en menos de 2 segundos y reintenta
         hasta 5 veces (a los 15 min, 1 h, 4 h, 8 h y 24 h) lo que no
         reciba un 200; un aviso repetido no acredita dos veces.

      Comprueba los medios activos con `npm run bold:medios` (usa la
      llave de identidad). Si aún no tienes Bold: lanza sin cobro en
      línea y registra los pagos en efectivo desde el panel.

- [ ] **Google** (entrar con Google, opcional): en console.cloud.google.com,
      pantalla de consentimiento OAuth (tipo Externo, **publicada**, con
      los enlaces a `/legal/privacidad` y `/legal/terminos` de tu dominio)
      y una credencial *ID de cliente de OAuth → Aplicación web* con la
      URI de redirección **exacta** `https://TU-DOMINIO/api/auth/callback/google`.
      Las dos llaves van en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`;
      sin ellas el botón simplemente no aparece. `.env.example` trae el
      paso a paso. El consentimiento legal no se salta: quien crea la
      cuenta con Google marca las casillas en `/registro`.

- [ ] **Voz**: la clave de la API de texto a voz de Praxis, propia para
      Allison, en `TTS_API_KEY`. Sin ella la app no falla: habla con la
      voz del navegador y lo deja dicho en el log.

- [ ] **Salida a internet del servidor**: el build descarga la
      tipografía Geist de Google. Compruébalo antes del primer
      despliegue con `curl -I https://fonts.googleapis.com` en el VPS.

---

## 2. Crear la aplicación en Dokploy

1. Tu proyecto → **Create Service → Application**.
2. **Provider**: GitHub (o Git), apuntando a la rama `main`.
3. **Build Type**: **Dockerfile**. El repositorio trae uno probado en la
   raíz. No uses Nixpacks: el Dockerfile controla la versión de Node y
   produce una imagen de ~250 MB en vez de ~1,5 GB.
4. **Port**: `3000`.
5. Pega las variables (punto 3) **antes** del primer despliegue.

**Importante — la red interna.** Para que la app le hable a la base por
la red de Docker (y no por internet), ambas deben estar en el mismo
proyecto/red de Dokploy. Es lo que hace que el tráfico no salga del
servidor.

---

## 3. Variables de entorno

Ábrelas de **`.env.production`** y pégalas en Dokploy → tu aplicación →
**Environment**. Las marcadas `[FALTA]` son las que debes llenar.

**Se leen al arrancar el contenedor, no al construir la imagen**: no hay
ningún secreto horneado. La única que el *build* necesitaría era
`DATABASE_URL`, y eso ya se arregló — la conexión se abre en la primera
consulta, no al importar el módulo.

| Variable | Estado |
|---|---|
| `DATABASE_URL` | **ajustar**: nombre interno del servicio + puerto `5432`, base `allison`, sin `sslmode` (punto 8 explica por qué es seguro) |
| `AUTH_SECRET` | generado, listo |
| `AUTH_URL` | **falta — OBLIGATORIA**: tu dominio con https, sin barra final. De aquí salen los enlaces de los correos y el regreso desde el pago; sin ella apuntan a una dirección muerta |
| `GEMINI_API_KEY` | **falta**: la llave nueva |
| `GEMINI_MODEL` | listo |
| `TTS_API_KEY` (opcionales `TTS_URL`, `TTS_VOZ`, `TTS_VOZ_ES`, `TTS_SIMULTANEAS`, `TTS_ESPERA_TURNO_MS`) | **falta**: la clave propia de la API de voz (pídesela al responsable del servicio). Sin ella Allison habla con la voz del navegador y el log lo dice |
| `CORREO`, `GMAIL_USUARIO`, `GMAIL_APP_PASSWORD`, `GMAIL_PUERTO` | `GMAIL_PUERTO=587` (punto 1: Hetzner bloquea el 465) |
| `PASARELA` | `bold` (candado: `simulada` revienta en producción) |
| `BOLD_LLAVE_IDENTIDAD`, `BOLD_LLAVE_SECRETA` | **faltan** — las dos de *Botón de pagos*, las de producción. Sin la secreta la app se niega a cobrar |
| `BOLD_MEDIOS` | opcional — vacío ofrece todos los medios activos, incluido el QR |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | opcionales — las dos o ninguna. Con ellas aparece "Entrar con Google" (punto 1) |
| `TAREAS_SECRETO` | generado, listo |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | **faltan** — las llaves de los avisos en el celular (recordatorio de la racha). Se generan una sola vez con `npx web-push generate-vapid-keys` y no se cambian: si cambian, cada celular tiene que volver a activar los avisos. Sin ellas los avisos se esconden y el recordatorio sigue por correo |
| `PROXY_CONFIABLE` | **`reverso` — no la dejes vacía**: Traefik reescribe `x-forwarded-for`. Vacía, todas las personas comparten un mismo límite: 5 registros por hora para todo el país, 5 recuperaciones de contraseña por hora, y la entrada pierde el freno por dirección |
| `COP_POR_MENSAJE`, `RECARGA_MINIMA_COP`, `MENSAJES_PRUEBA`, `REGISTROS_GLOBALES_POR_HORA` | **ajustar**: `RECARGA_MINIMA_COP=8000` y `MENSAJES_PRUEBA=5`; borra `MENSAJES_PRUEBA_INICIAL` y `MENSAJES_PRUEBA_VERIFICAR` si siguen ahí |
| `RUTA_A2`, `RUTA_B1` | **vacías** hasta que la docente apruebe el contenido de A2 y de B1 (con el nativo para el Repaso final). Con `1`, los alumnos de ese nivel ven la ruta nueva |
| `BOLD_PRUEBAS` | **vacía**: con ella Bold cobra con las llaves de prueba, y en producción la app se niega |
| `CRON_SECRET` | opcional — un segundo secreto para la limpieza (otra máquina, o cambiar `TAREAS_SECRETO` sin cortarla) |

---

## 4. Dominio y HTTPS

Dokploy → tu aplicación → **Domains** → agregar el dominio y activar
**HTTPS (Let's Encrypt)**. Traefik saca el certificado solo.

**El HTTPS no es opcional**: sin él el navegador **bloquea el micrófono**
y Allison no puede oír a nadie. Si no tienes dominio todavía, Dokploy
ofrece una dirección temporal que ya viene con HTTPS.

Cuando fijes el dominio: actualiza `AUTH_URL` **y** el webhook en el
panel de Bold, y la URI de redirección del cliente OAuth en Google Cloud (si
usas el botón de Google).

---

## 5. Migraciones y administrador

Se hacen **desde dentro del contenedor** (Dokploy → tu aplicación →
Terminal), que es la forma de tocar producción sin abrir puertos. El
Dockerfile ya copia los scripts y sus dependencias.

### Si la base está VACÍA (un Postgres recién creado)

Un solo archivo: **`db/manual/base-completa.sql`**. Crea todo el esquema
(todas las migraciones, en orden y en una sola transacción: si algo falla
no queda nada a medias), lo deja registrado para que futuras
migraciones sepan que ya corrió, siembra los planes y crea tu
administrador.

1. Ábrelo, cambia las **tres líneas del administrador** (correo, nombre,
   contraseña) al principio del archivo.
2. Pégalo entero en tu herramienta de base de datos, conectada a la base
   vacía, y ejecútalo como script completo.
3. Al final muestra el administrador y los planes creados.

Se niega a correr si dejas la contraseña de ejemplo, si es más corta de
12 caracteres, o si la base ya tiene esquema — y en los tres casos no
toca nada. Antes de usarlo, pruébalo una vez contra un Postgres de
prueba de la misma versión que el de producción: `npm run probar:base`
(lo crea, lo corre y lo borra). Desde las migraciones 023 a 027 no se
ha vuelto a probar.

*Alternativa desde el contenedor* (Dokploy → tu aplicación → Terminal),
en dos comandos:

```
node scripts/migrar.mjs
node scripts/crear-admin.mjs tu@correo.com "Tu Nombre" TuClaveFuerte
```

### Si la base YA tiene el esquema

Solo falta el administrador: `db/manual/semilla-admin.sql` (mismas tres
líneas, misma herramienta) o el comando `crear-admin.mjs` de arriba.
Puedes correrlo dos veces: no duplica nada ni pisa una contraseña ya
cambiada.

### Migraciones futuras

```
node scripts/migrar.mjs
```

**Producción está al día hasta la 027** (aplicadas en octubre de 2026,
después de una copia con `pg_dump`). El comando solo aplica las que
falten, en orden.

**Cuando una migración nueva tenga que ir ANTES del código nuevo**
(porque el código la usa al arrancar, como pasó con `dias_descanso()`,
que nace en la 026: con el código nuevo y la base vieja nadie podía
entrar): las migraciones solo agregan, así que el código que está
corriendo sigue funcionando con la base nueva. El problema es que ese
contenedor viejo no trae los archivos nuevos, y el puerto de la base
está cerrado. Dos caminos:

1. **Sin cortar el servicio (recomendado)**: desde tu máquina, con un
   túnel SSH hasta la base, en dos terminales:

   ```
   ssh -N -L 5433:<nombre-interno-de-postgres>:5432 usuario@tu-servidor
   ```
   ```
   DATABASE_URL="postgres://usuario:clave@localhost:5433/allison" node scripts/migrar.mjs
   ```

   y después despliega. El túnel no abre ningún puerto al mundo. Si el
   nombre interno no resuelve desde el servidor, usa la IP del
   contenedor (`docker inspect` en el servidor).
2. **Con una pausa de un minuto**: despliega y, apenas arranque, en la
   Terminal del contenedor nuevo corre `node scripts/migrar.mjs`. En
   ese minuto nadie puede entrar.

Solo aplica los archivos numerados de `db/`; los de `db/manual/` son
para correr a mano y los ignora. **Ojo**: esos dos archivos se generan
a partir de las migraciones (`npm run generar:sql`); si agregas una
migración y no los regeneras, `npm run revisar` falla para avisarte.

En todos los casos usa una contraseña que **no** hayas escrito en ningún
chat, y no dejes el archivo guardado con ella dentro.

---

## 6. La limpieza (cada hora)

Borra conversaciones de más de 20 días, enlaces vencidos y órdenes de
pago abandonadas. **Sin ella incumples tu propia política de
privacidad**, que promete borrarlas a los 20 días.

Además es la red de seguridad de los pagos: le pregunta a Bold por las
órdenes de los últimos tres días que sigan abiertas, y acredita las que
sí se pagaron aunque su aviso se haya perdido y el alumno no haya vuelto
a la app. Por eso corre **cada hora** y no una vez al día: así ese
alumno recibe lo que pagó en menos de una hora, no al día siguiente. Lo
demás que hace es idempotente y liviano; correrlo seguido no cuesta.

Dokploy → **Schedules** → tarea `0 * * * *` (cada hora, en punto) con:

```
curl -fsS -X POST -H "Authorization: Bearer EL_TAREAS_SECRETO" https://TU-DOMINIO/api/tareas/limpiar
```

La ruta acepta POST y GET, y rechaza con 401 cualquier llamada sin el
secreto.

---

## 7. Lista de humo, después del primer despliegue

- [ ] `https://TU-DOMINIO/api/salud` responde `{"ok":true}`.
- [ ] `https://TU-DOMINIO/api/salud?base=1` responde `{"ok":true,"base":true}`
      — si esta falla y la anterior no, el problema es la base, no la app.
- [ ] Registrarse con un correo real: entra directo con sus 5
      intervenciones de prueba (`MENSAJES_PRUEBA`), sin correo que confirmar.
- [ ] En un mensaje de Allison, seleccionar una palabra: aparece la barra
      con **Escuchar** y **Guardar**, y la palabra queda en `/glosario`
      (menú → Tu glosario). En `/perfil`, cambiar el nombre y volver.
- [ ] Pedir "olvidé mi contraseña" y comprobar que el correo llega y su enlace
      abre: el correo es el único canal para recuperar una cuenta.
- [ ] Un turno de voz completo **desde el celular**: pide permiso de
      micrófono, transcribe, y Allison **suena sola**.
- [ ] **Allison habla con su voz propia**, no con la del teléfono: el
      estado pasa a "hablando…" cuando empieza a sonar, unos segundos
      después de llegar el texto. Con el secreto de las tareas,
      `https://TU-DOMINIO/api/salud?voz=1` responde `listo: true` y
      `vocesValidas: true`, y en el log del servidor no aparece "Voz no
      disponible"; si aparece, la app está usando la voz del navegador.
- [ ] Instalar la PWA (aparece el chip "Instalar").
- [ ] `/admin` responde a tu administrador y rechaza a un estudiante.
- [ ] **Google**, si lo activaste, las tres puertas: (a) en `/entrar`,
      "Entrar con Google" con una cuenta de Google que NO existe en Allison
      vuelve a `/registro` con el aviso de marcar las casillas; (b) en
      `/registro`, marcar las casillas y "Continuar con Google" crea la
      cuenta y entra con las 5 intervenciones, sin correo que confirmar;
      (c) una cuenta creada con correo y contraseña entra también con
      Google. Si Google muestra `redirect_uri_mismatch`, la URI de
      redirección no coincide letra por letra con `AUTH_URL`.
      Diagnóstico rápido: `https://TU-DOMINIO/api/salud?google=1` dice si el
      servidor ve las llaves y cuál es la URI de regreso exacta, y
      `https://TU-DOMINIO/api/auth/providers` debe listar `google`; si no lo
      lista, el contenedor arrancó sin las llaves y hay que volver a
      desplegar (la pantalla las lee en caliente; el proveedor, al arrancar).
- [ ] Una recarga pequeña real ($8.000, la mínima) pagada **con QR desde el
      celular**, comprobando **las cuatro**: (a) el checkout de Bold
      ofrece el QR (si no, falta activar la Cuenta Bold); (b) pagar el
      QR desde el mismo teléfono es cómodo — si no, considera dejar
      también PSE o Nequi con `BOLD_MEDIOS`; (c) al terminar, vuelves a
      **tu dominio** y la pantalla dice "Confirmando tu pago…"; (d) en
      segundos pasa a **"¡Listo!"** y el saldo del encabezado sube.
- [ ] **15 minutos después de esa recarga, que el AVISO de Bold llegó.**
      La pantalla del punto anterior pasa aunque el webhook esté roto,
      porque ella misma le pregunta a Bold; lo que falla en silencio es
      el alumno que paga y cierra la pestaña. Comprueba las dos cosas:
      - en el log del servidor **no** aparece "firma inválida" (si
        aparece, la `BOLD_LLAVE_SECRETA` no es la de Botón de pagos);
      - en la base, la orden tiene un aviso en su historial:
        ```
        select payload->'historial' from transacciones order by creado_en desc limit 1;
        ```
        Debe haber una entrada con `"origen": "aviso"`. Si solo hay
        `"consulta"`, el webhook no está registrado o no llega.
- [ ] **61 minutos después, que el link venció**: abre otra vez el link
      de esa recarga (queda en el historial del navegador). Debe decir
      que venció. Si todavía deja pagar, avísame: Bold estaría leyendo
      el vencimiento en otra unidad.
- [ ] Al día siguiente: la limpieza corrió y el panel de Gemini muestra
      el gasto esperado.

---

## 8. Deudas y decisiones pendientes

- **Respaldos**: Dokploy los hace automáticos hacia un destino S3
  (Settings → S3 Destinations). Actívalos: hoy Allison **no tiene copia
  de nada**, y todo lo demás se arregla pero unos datos perdidos no.
  Que el destino esté **fuera del servidor** — un respaldo en el mismo
  disco no protege de perder el disco.
- **Cifrado con la base — cómo queda seguro**: la app le habla a
  Postgres por la red interna de Docker (nombre interno + `5432`), y ese
  tráfico **no sale del servidor**: es el mismo límite de confianza que
  `localhost`. El código lo garantiza (`db/conexion.mjs`, un solo
  criterio para la app y los scripts): hacia un host interno usa TLS si
  lo hay y texto plano si no; hacia una dirección **pública** exige TLS,
  y en producción **se niega** a mandar nada en claro — la app no
  arranca su primera consulta y dice qué corregir. Lo que sí queda en
  tus manos: **cerrar el puerto 5421** en el firewall (ya no hace falta
  para nada) y **cambiar la clave** de Postgres, que viajó por chats.
- **Monitoreo**: un Uptime Kuma en el mismo Dokploy apuntando a
  `/api/salud?base=1` te avisa por Telegram cuando algo se cae, antes de
  que lo haga un alumno.
- **Tope de tamaño de las peticiones en Traefik**: las rutas que reciben
  audio, CSV o avisos de pago rechazan un cuerpo grande antes de leerlo
  si trae `Content-Length`; uno enviado por partes solo lo frena el
  proxy. En Dokploy → tu aplicación → **Advanced → Traefik**, agrega un
  middleware `buffering` con `maxRequestBodyBytes: 10485760` (10 MB: el
  audio más largo pesa 8 MB).
- **El repositorio, privado**: el historial de git todavía tiene la IP
  del servidor (en commits viejos de `scripts/probar-conexion.mjs`). No
  es una llave, pero con el puerto 5421 abierto dice dónde tocar.
- **La voz es la API de texto a voz de Praxis** (tts-api.praxisia.org),
  en streaming, con la del navegador de respaldo. Dos límites que hay
  que tener presentes: el servicio sintetiza **dos audios a la vez para
  todos sus clientes** (los demás esperan hasta 15 s y luego caen a la
  voz del navegador), y genera casi en tiempo real, así que cada
  respuesta empieza a sonar unos 4 s después de llegar el texto. Con
  más de dos alumnos hablando a la vez, hay que pedir más capacidad al
  responsable del servicio. La política de datos ya lo lista como
  encargado; **falta confirmar en qué país corre** para escribirlo ahí.
- **Las anulaciones de Bold no descuentan saldo solas**: si devuelves un
  pago desde Bold, el alumno conserva sus intervenciones (pudo haberlas
  gastado ya). El aviso queda en el log del servidor como
  `VOID_APPROVED`; ajusta el saldo a mano desde el panel, que exige una
  nota que lo explique.
- **Planes: sin aviso antes de que termine el mes.** La renovación
  mensual ya funciona (el anual entrega 700 cada mes y lo que sobra
  vence, como dicen los términos), pero la app no le avisa al alumno
  que sus mensajes del plan están por vencer. Un aviso unos días antes
  evitaría la sorpresa.
