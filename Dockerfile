# =====================================================================
#  Allison — imagen de producción para Dokploy
#
#  Tres etapas para que la imagen final pese ~250 MB en vez de ~1,5 GB:
#  las herramientas de compilación y el código fuente se quedan en las
#  etapas intermedias y nunca llegan al servidor.
#
#  Regla que no se debe romper: aquí NO entra ningún secreto. Las
#  variables se inyectan al ARRANCAR el contenedor desde Dokploy. Una
#  llave horneada en la imagen queda expuesta a cualquiera que pueda
#  descargarla, y las imágenes se comparten y se copian.
#
#  El build tampoco necesita la base de datos: src/lib/db.ts abre la
#  conexión en la primera consulta, no al importarse.
# =====================================================================

# --- 1. Dependencias completas (para compilar) ------------------------
FROM node:22-alpine AS deps
# libc6-compat: los binarios nativos (sharp) lo necesitan en Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Solo los manifiestos: si no cambian, Docker reutiliza esta capa y no
# reinstala nada en cada despliegue.
COPY package.json package-lock.json ./
RUN npm ci


# --- 2. Compilación ---------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Telemetría de Next apagada: el servidor no manda datos a nadie.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# OJO: este paso descarga la tipografía Geist de fonts.googleapis.com.
# El servidor que construya la imagen necesita salida HTTPS a
# fonts.googleapis.com y fonts.gstatic.com, o el build falla.
RUN npm run build


# --- 3. Ejecución -----------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# El server.js de la salida autónoma lee estas dos. HOSTNAME=0.0.0.0 no
# es opcional: Docker define HOSTNAME con el id del contenedor y Next lo
# obedecería, quedándose escuchando en una dirección inalcanzable.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario sin privilegios: si alguien lograra ejecutar código dentro del
# contenedor, no sería root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# --- Los tres COPY de la salida autónoma. El ORDEN NO ES NEGOCIABLE:
# standalone trae su propio .next/, así que copiar static antes lo
# pisaría. No los reordenes "por limpieza".
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# --- Herramientas de operación: migrar la base y crear administradores
# desde dentro del contenedor, que es la única forma de tocar la base
# sin abrir su puerto al mundo. Van DESPUÉS del standalone para no
# pisarlo. Necesitan postgres y bcryptjs, que la salida autónoma no
# trae: Next solo copia lo que usan las páginas, y estos no son páginas.
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrar.mjs ./scripts/migrar.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/crear-admin.mjs ./scripts/crear-admin.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/auditar.mjs ./scripts/auditar.mjs
# postgres y bcryptjs salen de la etapa deps, que ya los instaló: son
# dependencias de producción y no tienen dependencias propias, así que
# copiarlas basta. Una etapa aparte con npm ci --omit=dev solo para
# esto reinstalaría el árbol entero para nada.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

USER nextjs
EXPOSE 3000

# Docker usa esto para reiniciar el contenedor si deja de responder.
# Pregunta SOLO por el proceso, no por la base: si dependiera de
# Postgres, un parpadeo de la base reiniciaría la app en bucle, y
# reiniciar la app no arregla una base caída.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
