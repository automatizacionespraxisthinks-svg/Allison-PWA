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

- [ ] **Wompi**: las tres llaves (pública, integridad, eventos) y **dos
      pasos que no están en el código**:
      1. Panel de Wompi → configuración → medios de pago → dejar **solo
         código QR**. Baja la comisión de 2,65% + $700 a 1%.
      2. Panel de Wompi → registrar la **URL de eventos**:
         `https://TU-DOMINIO/api/pagos/webhook`. Sin esto Wompi cobra y
         nunca avisa: el alumno paga y no recibe nada.

      Si aún no la tienes: lanza sin cobro en línea y registra los pagos
      en efectivo desde el panel de administración.

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
| `DATABASE_URL` | **ajustar**: nombre interno del servicio + puerto `5432` |
| `AUTH_SECRET` | generado, listo |
| `AUTH_URL` | **falta — OBLIGATORIA**: tu dominio con https, sin barra final. De aquí salen los enlaces de los correos y el retorno de Wompi; sin ella apuntan a una dirección muerta |
| `GEMINI_API_KEY` | **falta**: la llave nueva |
| `GEMINI_MODEL` | listo |
| `CORREO`, `GMAIL_USUARIO`, `GMAIL_APP_PASSWORD` | listos y probados |
| `PASARELA` | `wompi` (candado: `simulada` revienta en producción) |
| `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` | **faltan** — las tres o ninguna |
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

Cuando fijes el dominio: actualiza `AUTH_URL` **y** la URL de eventos en
el panel de Wompi.

---

## 5. Migraciones y administrador

Se hacen **desde dentro del contenedor** (Dokploy → tu aplicación →
Terminal), que es la forma de tocar producción sin abrir puertos. El
Dockerfile ya copia los scripts y sus dependencias.

### Si la base está VACÍA (un Postgres recién creado)

Un solo archivo: **`db/manual/base-completa.sql`**. Crea todo el esquema
(las 19 migraciones, en orden y en una sola transacción: si algo falla
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

Solo aplica los archivos numerados de `db/`; los de `db/manual/` son
para correr a mano y los ignora. **Ojo**: esos dos archivos se generan
a partir de las migraciones (`npm run generar:sql`); si agregas una
migración y no los regeneras, `npm run revisar` falla para avisarte.

En todos los casos usa una contraseña que **no** hayas escrito en ningún
chat, y no dejes el archivo guardado con ella dentro.

---

## 6. La limpieza diaria

Borra conversaciones de más de 20 días, enlaces vencidos y órdenes de
pago abandonadas. **Sin ella incumples tu propia política de
privacidad**, que promete borrarlas a los 20 días.

Dokploy → **Schedules** → tarea diaria `0 7 * * *` (2:00 a.m. en
Colombia) con:

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
- [ ] Una recarga pequeña real pagada con QR, comprobando **las tres**:
      (a) el checkout **no** ofrece tarjeta ni PSE (si aparecen, faltó el
      paso del panel de Wompi); (b) al terminar, el navegador vuelve a
      **tu dominio**, no a una dirección rara; (c) **el saldo del
      encabezado sube** y la transacción queda `aprobada` en la base.
      La (c) es la que importa: si el aviso de Wompi se rechazara, el
      cobro se haría igual y el alumno no recibiría nada.
- [ ] Al día siguiente: la limpieza corrió y el panel de Gemini muestra
      el gasto esperado.

---

## 8. Deudas y decisiones pendientes

- **Respaldos**: Dokploy los hace automáticos hacia un destino S3
  (Settings → S3 Destinations). Actívalos: hoy Allison **no tiene copia
  de nada**, y todo lo demás se arregla pero unos datos perdidos no.
  Que el destino esté **fuera del servidor** — un respaldo en el mismo
  disco no protege de perder el disco.
- **Puerto 5421 abierto a internet**: una vez la app hable por la red
  interna, ese puerto ya no hace falta para nada. Ciérralo en el
  firewall. La clave actual además viajó por chats: cámbiala.
- **Monitoreo**: un Uptime Kuma en el mismo Dokploy apuntando a
  `/api/salud?base=1` te avisa por Telegram cuando algo se cae, antes de
  que lo haga un alumno.
- **La voz sigue siendo la del navegador** (provisional): calidad
  variable según el teléfono. Cuando se mejore, que sea con un motor
  propio en este servidor — **nunca un TTS cobrado por uso**, que
  multiplicaría el costo por intervención unas cincuenta veces.
- **Los planes largos no renuevan**: el de 6 meses y el anual entregan
  700 intervenciones una sola vez, no cada mes. Está pendiente de
  arreglar y es lo más grave del proyecto ahora mismo.
