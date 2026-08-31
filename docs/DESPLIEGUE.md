# Desplegar Allison en Vercel

Guía corta y en orden. Lo que aquí dice "candado" está garantizado por
código: si falta, la app **falla con ruido** en vez de fingir que
funciona.

## 1. Antes de importar el proyecto

- [ ] **Base de producción**: crea un proyecto NUEVO en Neon (no la base
      de desarrollo, que tiene datos de prueba). Copia la cadena del
      **pooler** — el host con `-pooler` —, no la directa: en
      funciones sin servidor, la directa se agota en segundos. El
      código detecta el pooler y se configura solo.
- [ ] **Rotar llaves**: crea una llave de Gemini NUEVA (la de
      desarrollo pasó por chats y logs) y ponle **límite de gasto
      mensual** en Google AI Studio.
- [ ] **Resend**: cuenta creada, dominio verificado, llave lista.
      Sin esto no hay verificación de correo ni recuperación de
      contraseña (candado).
- [ ] **Wompi**: llaves de producción. Sin ellas la app no puede
      cobrar en línea (candado): si aún no llegan, lanza sin cobros en
      línea y registra solo efectivo desde el panel de admin.

## 2. Variables de entorno en Vercel

| Variable | Valor en producción |
|---|---|
| `DATABASE_URL` | cadena del **pooler** de Neon (producción) |
| `AUTH_SECRET` | nuevo: `openssl rand -base64 32` |
| `GEMINI_API_KEY` | la llave NUEVA |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` |
| `PASARELA` | `wompi` (candado: `simulada` revienta en producción) |
| `WOMPI_PUBLIC_KEY` / `WOMPI_PRIVATE_KEY` / `WOMPI_EVENTS_SECRET` | de Wompi |
| `CORREO` | `resend` (candado: `consola` revienta en producción) |
| `RESEND_API_KEY` / `CORREO_REMITENTE` | de Resend (remitente del dominio verificado) |
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
- [ ] Una recarga real pequeña con Wompi de prueba/producción.
- [ ] `/admin` responde a tu admin y rechaza a un estudiante.
- [ ] Instalar la PWA desde Android y iPhone.
- [ ] Al día siguiente: el cron corrió (Vercel → Logs → Cron) y el
      panel de Gemini muestra el gasto esperado.

## Limitaciones aceptadas en Vercel (documentadas, no urgentes)

- **Límites de velocidad en memoria**: cada instancia de función lleva
  su propio conteo, así que el límite real es más laxo que el
  configurado. Suficiente para empezar; con tracción, moverlos a Redis.
- **Cuerpo máximo 4,5 MB** impuesto por Vercel: sobra para 60 s de
  audio opus (~200 KB).
- **La voz sigue siendo la del navegador** (provisional hasta el TTS
  propio); calidad variable según el teléfono.
