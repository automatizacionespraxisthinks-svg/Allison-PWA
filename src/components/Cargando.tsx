/**
 * El cargador de Allison.
 *
 * Aparece AL INSTANTE al navegar a una sección que consulta la base
 * (via los loading.tsx de cada carpeta): el toque deja de sentirse
 * muerto mientras el servidor prepara la página. Sin esto, en un
 * celular con datos móviles el alumno tocaba "Temas" y durante un
 * segundo largo no pasaba nada — y volvía a tocar.
 *
 * Son las barras de onda de la marca — Allison es voz — y no un
 * spinner genérico. La animación reutiliza barra-sonando de
 * globals.css, que ya respeta prefers-reduced-motion.
 */
export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <span className="flex h-8 items-center gap-1.5" aria-hidden>
        {[14, 22, 30, 22, 14].map((alto, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-primario"
            style={{
              height: alto,
              transformOrigin: "center",
              animation: `barra-sonando 0.9s ease-in-out ${i * 0.12}s infinite`,
            }}
          />
        ))}
      </span>
      <p role="status" className="text-sm text-texto-suave">
        {texto}
      </p>
    </main>
  );
}
