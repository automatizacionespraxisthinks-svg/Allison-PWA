import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA: es lo que permite instalar Allison en la
 * pantalla de inicio del celular, con su foto como ícono.
 *
 * `display: standalone` la abre sin barra de navegador, para que se
 * sienta una app y no una página web.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Allison — Aprende inglés hablando",
    short_name: "Allison",
    description:
      "Practica inglés conversando con Allison. Te corrige la pronunciación y la gramática mientras hablas.",
    start_url: "/practicar",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f8fc",
    theme_color: "#1d4ed8",
    lang: "es-CO",
    categories: ["education"],
    icons: [
      { src: "/allison.png", sizes: "400x400", type: "image/png" },
      { src: "/allison.png", sizes: "400x400", type: "image/png", purpose: "maskable" },
    ],
  };
}
