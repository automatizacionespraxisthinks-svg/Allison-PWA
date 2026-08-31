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
    /**
     * Chrome exige un ícono de 192 o más para considerar la app
     * instalable, y usa el de 512 para la pantalla de arranque. El
     * "maskable" lleva margen y fondo azul porque el sistema lo
     * recorta en círculo: sin ese margen, a Allison le cortarían la
     * cara en varios Android.
     */
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icono-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
