import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Allison — Aprende inglés hablando",
  description:
    "Practica inglés conversando con Allison. Te corrige la pronunciación y la gramática mientras hablas, en todos los niveles.",
  applicationName: "Allison",
  appleWebApp: { capable: true, title: "Allison", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#12100e" },
  ],
  // La app es una conversación a pantalla completa: sin zoom accidental
  // al tocar los botones desde el celular.
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
