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
