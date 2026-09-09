import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad para producción.
 *
 * Lo mínimo serio: nadie puede meter a Allison en un iframe (adiós
 * clickjacking), el navegador no adivina tipos de contenido, y los
 * permisos del navegador quedan cerrados salvo el micrófono — que es
 * el corazón del producto — solo para la propia página.
 *
 * Sin CSP completa a propósito: Next usa scripts en línea y una CSP
 * mal puesta rompe la app entera en silencio. Cuando haya tiempo de
 * probarla con calma, se agrega con nonce.
 */
const nextConfig: NextConfig = {
  /**
   * Salida autónoma para Docker.
   *
   * Next rastrea qué archivos necesita de verdad y arma
   * .next/standalone con un server.js mínimo y solo el node_modules
   * imprescindible: la imagen baja de ~1,5 GB a unos 200 MB.
   *
   * OJO: server.js NO copia public/ ni .next/static. Eso lo hace el
   * Dockerfile a mano, y el orden de esos COPY no es negociable.
   */
  output: "standalone",

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
