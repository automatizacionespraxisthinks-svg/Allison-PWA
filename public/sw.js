/**
 * Service worker de Allison.
 *
 * Existe por dos razones, en este orden:
 *
 * 1. Sin un service worker con manejador de "fetch", el navegador NO
 *    ofrece instalar la aplicación. Es requisito, no adorno.
 * 2. Le da a la app una pantalla decente cuando se cae la red — que en
 *    datos móviles colombianos pasa a diario.
 *
 * Es deliberadamente MÍNIMO y no cachea páginas ni respuestas de la
 * API. La conversación con Allison necesita red sí o sí (el audio va y
 * viene del servidor), y una página vieja servida desde el caché
 * mostraría un saldo de intervenciones que ya no es cierto — un alumno
 * creyendo que le quedan mensajes que ya gastó. Solo se guarda lo que
 * no puede mentir: el ícono, el logo y la pantalla de "sin conexión".
 */
const CACHE = "allison-v1";

/** Lo único que se guarda: cosas que no cambian y no pueden mentir. */
const ESTATICOS = ["/allison.png", "/icono-192.png", "/icono-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ESTATICOS))
      // Si algún archivo no está, la instalación NO debe fallar: el
      // service worker sigue valiendo para que la app sea instalable.
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;

  // Solo GET. Un POST cacheado sería una intervención cobrada dos veces.
  if (peticion.method !== "GET") return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  // La API JAMÁS se cachea: saldos, mensajes y progreso cambian.
  if (url.pathname.startsWith("/api/")) return;

  // Los estáticos guardados salen del caché al instante.
  if (ESTATICOS.includes(url.pathname)) {
    evento.respondWith(
      caches.match(peticion).then((r) => r ?? fetch(peticion))
    );
    return;
  }

  // Todo lo demás va a la red. Si no hay red y era una navegación, se
  // muestra una página propia en vez del dinosaurio del navegador.
  evento.respondWith(
    fetch(peticion).catch(() => {
      if (peticion.mode === "navigate") {
        return new Response(PAGINA_SIN_CONEXION, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return Response.error();
    })
  );
});

/** Misma paleta que la app, para que no parezca otra página. */
const PAGINA_SIN_CONEXION = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión — Allison</title>
<style>
  :root { --fondo:#f6f8fc; --texto:#0e1a2f; --suave:#5a6b85; --azul:#1d4ed8; }
  @media (prefers-color-scheme: dark) {
    :root { --fondo:#0a1122; --texto:#edf2fa; --suave:#92a3bf; --azul:#3b82f6; }
  }
  body { margin:0; min-height:100dvh; display:flex; flex-direction:column;
         align-items:center; justify-content:center; gap:1rem; padding:2rem;
         background:var(--fondo); color:var(--texto); text-align:center;
         font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
  img { width:96px; height:96px; border-radius:50%; border:4px solid var(--azul); }
  h1 { font-size:1.25rem; margin:0; }
  p { color:var(--suave); margin:0; max-width:22rem; line-height:1.5; }
  button { margin-top:.5rem; border:0; border-radius:999px; padding:.85rem 1.75rem;
           background:var(--azul); color:#fff; font-size:1rem; font-weight:600; }
</style></head>
<body>
  <img src="/allison.png" alt="Allison">
  <h1>Sin conexión</h1>
  <p>Allison necesita internet para escucharte y responderte. Revisa tus
     datos o tu wifi e intenta de nuevo.</p>
  <button onclick="location.reload()">Reintentar</button>
</body></html>`;
