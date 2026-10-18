# Allison

Profesora de inglés con IA para adolescentes colombianos: una PWA hecha
para el celular donde el alumno habla con Allison por turnos, recibe
correcciones dentro de la conversación y avanza por una ruta de viaje
(A1 por Estados Unidos, A2 por el Reino Unido, B1 por Canadá).

Next.js 16 (App Router) · Postgres · Auth.js · Gemini
(`gemini-2.5-flash-lite`) · la API de voz de Praxis · Bold para los pagos.

## Documentación

| Documento | Qué tiene |
|---|---|
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Decisiones, modelo de datos, cobro, la ruta y cada actividad |
| [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) | Cómo se publica en Dokploy: variables, base de datos, migraciones y lista de verificación |
| [docs/PROMPT.md](docs/PROMPT.md) | El prompt de Allison (se genera del código con `npm run generar:prompt`) |
| [docs/CURRICULO.md](docs/CURRICULO.md) | Las 60 unidades de las lecciones de Hablar (/temas) |
| `docs/CONTENIDO-*-POR-REVISAR.md` | Lo que la docente revisa de cada nivel (`node scripts/listar-por-revisar.mjs [a2|b1]`) |

## Trabajar en local

Requiere Node 22 o más nuevo y un Postgres.

```bash
npm ci
cp .env.example .env   # y llena las variables (cada una está explicada ahí); los scripts leen .env
npm run migrar               # crea o pone al día la base de DATABASE_URL
npm run dev
```

`AGENTS.md` avisa que esta versión de Next.js trae cambios grandes: la
documentación que vale es la de `node_modules/next/dist/docs/`.

## Pruebas

```bash
npm run lint
npx tsc --noEmit
npm run revisar     # todas las pruebas; varias usan la base de .env
```

Las que no tocan la base se pueden correr solas, por ejemplo
`npm run probar:contenido`, `npm run probar:ruta` o `npm run probar:admin`.

## Producción

La imagen se arma con el `Dockerfile` (salida autónoma de Next) y se
publica en Dokploy. Los pasos, en orden, están en
[docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).
