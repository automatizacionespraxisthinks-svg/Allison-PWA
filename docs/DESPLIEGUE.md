# Desplegar Allison en Vercel

Guía corta y en orden. Lo que aquí dice "candado" está garantizado por
código: si falta, la app **falla con ruido** en vez de fingir que
funciona.

## 1. Antes de importar el proyecto

- [x] **Base de producción**: lista. Es el Postgres propio (46.225.66.78:5421),
      en una base dedicada `allison` — separada de n8n y del prototipo que
      viven en la base `postgres` del mismo servidor. Las 19 migraciones ya
      corrieron y la auditoría de integridad pasó.
- [ ] **Rotar llaves**: crea una llave de Gemini NUEVA (la de
      desarrollo pasó por chats y logs) y ponle **límite de gasto
      mensual** en Google AI Studio.
- [ ] **Correo — camino elegido: Gmail, sin dominio.** En tu Cuenta de
      Google: Seguridad → activar Verificación en dos pasos → buscar
      "Contraseñas de aplicaciones" → crear una llamada "Allison".
      Variables: CORREO=gmail, GMAIL_USUARIO=praxisthinks@gmail.com y
      GMAIL_APP_PASSWORD=la generada (16 letras). Tope ~500 correos/día,
      de sobra para empezar. Prueba: npm run probar:correo -- tucorreo
      Sin esto no hay verificación ni recuperación (candado).
      *Mejora futura con dominio propio*: cambiar a CORREO=resend
      (cuenta en resend.com, dominio verificado con SPF/DKIM,
      RESEND_API_KEY y CORREO_REMITENTE del dominio) — remitente más
      comercial y sin tope diario.
- [ ] **Wompi**: llaves de producción. Sin ellas la app no puede
      cobrar en línea (candado): si aún no llegan, lanza sin cobros en
      línea y registra solo efectivo desde el panel de admin.
      **Decisión tomada: SOLO QR.** En el panel de Wompi (configuración
      → medios de pago) deshabilita todo salvo el código QR: la
      comisión baja de 2,65% + $700 a 1%. El checkout alojado no
      permite restringirlo por código, así que este paso del panel es
      obligatorio — sin él, saldrán tarjetas y PSE con su comisión
      completa.

## 2. Variables de entorno en Vercel

| Variable | Valor en producción |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:<clave>@46.225.66.78:5421/allison?sslmode=disable` |
| `AUTH_SECRET` | nuevo: `openssl rand -base64 32` |
| `GEMINI_API_KEY` | la llave NUEVA |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` |
| `PASARELA` | `wompi` (candado: `simulada` revienta en producción) |
| `WOMPI_PUBLIC_KEY` / `WOMPI_PRIVATE_KEY` / `WOMPI_EVENTS_SECRET` | de Wompi |
| `WOMPI_INTEGRITY_SECRET` | de Wompi (Desarrolladores → secreto de integridad): firma cada checkout |
| `CORREO` | `gmail` (candado: `consola` revienta en producción) |
| `GMAIL_USUARIO` / `GMAIL_APP_PASSWORD` | tu Gmail y su contraseña de aplicación |
| `CRON_SECRET` | nuevo secreto largo — Vercel lo manda solo al cron de limpieza |
| `PROXY_CONFIABLE` | `reverso` (Vercel reescribe `x-forwarded-for`) |
| `COP_POR_MENSAJE` | `60` |
| `RECARGA_MINIMA_COP` | `4000` |
| `MENSAJES_PRUEBA_INICIAL` / `MENSAJES_PRUEBA_VERIFICAR` | `5` / `15` |
| `AUDIO_MAX_SEGUNDOS` | `60` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | opcionales — sin ellas el botón de Google no existe |

`AUTH_URL` no hace falta: `trustHost` ya está activo y Vercel pone las
cabeceras correctas. `TAREAS_SECRETO` solo si además llamas la
limpieza desde n8n.

## 3. Importar y desplegar

1. Sube el repositorio a GitHub y proyecto nuevo en Vercel.
2. Framework: Next.js (auto). Sin configuración extra: `vercel.json`
   ya trae el cron de limpieza (2:00 am hora de Colombia).
3. Primer deploy → corre las migraciones contra la base de
   producción DESDE TU MÁQUINA:
   `DATABASE_URL=<pooler de producción> npm run migrar`
4. Crea tu admin real:
   `DATABASE_URL=<...> node scripts/crear-admin.mjs tu@correo "Tu Nombre" <clave-fuerte>`

## 4. Después del primer deploy — lista de humo

- [ ] Registrarse con un correo real → llega el correo → verificar.
- [ ] Un turno de voz completo en el celular (micrófono pide permiso,
      Allison suena sola).
- [ ] Una recarga real pequeña pagada con QR (y verificar que el
      checkout NO ofrezca tarjeta ni PSE: si aparecen, falta el paso
      del panel de Wompi).
- [ ] `/admin` responde a tu admin y rechaza a un estudiante.
- [ ] Instalar la PWA desde Android y iPhone.
- [ ] Al día siguiente: el cron corrió (Vercel → Logs → Cron) y el
      panel de Gemini muestra el gasto esperado.

## Deudas de la base de producción (cerrar pronto)

- **Sin TLS**: el Postgres del VPS no tiene certificados, así que el
  tráfico Vercel↔base viaja SIN CIFRAR por internet (por eso la URL
  lleva `sslmode=disable`, a conciencia). Cerrar pronto: activar SSL
  en ese Postgres o moverlo detrás de un túnel.
- **Puerto abierto a internet**: cualquiera puede intentar conectarse.
  Restringe el firewall del VPS en cuanto puedas y usa una clave más
  larga; la actual además viajó por chats.
- **Respaldos**: ese Postgres es tuyo — programa un pg_dump diario
  (n8n puede hacerlo) o Allison no tiene copia de nada.

## Limitaciones aceptadas en Vercel (documentadas, no urgentes)

- **Límites de velocidad en memoria**: cada instancia de función lleva
  su propio conteo, así que el límite real es más laxo que el
  configurado. Suficiente para empezar; con tracción, moverlos a Redis.
- **Cuerpo máximo 4,5 MB** impuesto por Vercel: sobra para 60 s de
  audio opus (~200 KB).
- **La voz sigue siendo la del navegador** (provisional hasta el TTS
  propio); calidad variable según el teléfono.
