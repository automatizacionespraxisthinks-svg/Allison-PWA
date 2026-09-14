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

- [x] **Correo**: Gmail SMTP probado y funcionando con
      `allison.teacher00@gmail.com`. Tope ~500 correos/día.

- [ ] **Bold** (la pasarela): cuenta creada con tu cédula y **tres pasos
      en su panel que no están en el código**:
      1. **Activar la Cuenta Bold.** Sin ella no aparece el QR Bre-B,
         que es el medio más barato: 2,89% sin valor fijo, contra 2,89%
         + $900 de PSE o tarjeta. En la recarga mínima de $7.900 es la
         diferencia entre perder 3,4% o 17%.
      2. **Activar las llaves** de *Botón de pagos* (Integraciones →
         Llaves de integración). La API de links usa esas. Van en
         `BOLD_LLAVE_IDENTIDAD` y `BOLD_LLAVE_SECRETA`.
      3. **Registrar el webhook** (Integraciones → Webhooks):
         `https://TU-DOMINIO/api/pagos/webhook`. Sin él, el pago igual se
         acredita cuando el alumno vuelve a la app o en la conciliación
         de cada hora, pero con demora.

      Comprueba los medios activos con `npm run bold:medios` (usa la
      llave de identidad). Si aún no tienes Bold: lanza sin cobro en
      línea y registra los pagos en efectivo desde el panel.

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
| `CORREO`, `GMAIL_USUARIO`, `GMAIL_APP_PASSWORD` | listos y probados |
| `PASARELA` | `bold` (candado: `simulada` revienta en producción) |
| `BOLD_LLAVE_IDENTIDAD`, `BOLD_LLAVE_SECRETA` | **faltan** — las dos de *Botón de pagos*, las de producción. Sin la secreta la app se niega a cobrar |
| `BOLD_MEDIOS` | opcional — vacío ofrece todos los medios activos, incluido el QR |
| `TAREAS_SECRETO` | generado, listo |
| `PROXY_CONFIABLE` | `reverso` — Traefik reescribe `x-forwarded-for` |
| `COP_POR_MENSAJE`, `RECARGA_MINIMA_COP`, `MENSAJES_PRUEBA_*`, `REGISTROS_GLOBALES_POR_HORA` | listos |

---

## 4. Dominio y HTTPS

Dokploy → tu aplicación → **Domains** → agregar el dominio y activar
**HTTPS (Let's Encrypt)**. Traefik saca el certificado solo.

**El HTTPS no es opcional**: sin él el navegador **bloquea el micrófono**
y Allison no puede oír a nadie. Si no tienes dominio todavía, Dokploy
ofrece una dirección temporal que ya viene con HTTPS.

Cuando fijes el dominio: actualiza `AUTH_URL` **y** el webhook en el
panel de Bold.

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
toca nada. Está probado contra una base vacía de verdad
(`npm run probar:base`).

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

**Pendiente en producción: la migración 020** (renovación mensual de
los planes). La base de producción se creó con las 19 anteriores, y la
app nueva la necesita: sin ella, los planes no se renuevan y el log del
servidor lo dice ("No se pudo renovar el plan"). Córrela
en la Terminal del contenedor **justo después de desplegar esta
versión**; el comando de arriba solo aplica lo que falta.

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
- [ ] Registrarse con un correo real → llega el correo → **el enlace
      abre tu dominio** (si dice 0.0.0.0, falta `AUTH_URL`) → verificar
      suma las +15 intervenciones.
- [ ] Pedir "olvidé mi contraseña" y comprobar que ese enlace también
      abre: el correo es el único canal para recuperar una cuenta.
- [ ] Un turno de voz completo **desde el celular**: pide permiso de
      micrófono, transcribe, y Allison **suena sola**.
- [ ] Instalar la PWA (aparece el chip "Instalar").
- [ ] `/admin` responde a tu administrador y rechaza a un estudiante.
- [ ] Una recarga pequeña real ($7.900, la mínima) pagada **con QR desde el
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
- **La voz sigue siendo la del navegador** (provisional): calidad
  variable según el teléfono. Cuando se mejore, que sea con un motor
  propio en este servidor — **nunca un TTS cobrado por uso**, que
  multiplicaría el costo por intervención unas cincuenta veces.
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
