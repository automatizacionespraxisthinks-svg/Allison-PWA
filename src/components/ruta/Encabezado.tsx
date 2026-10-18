import Image from "next/image";
import Link from "next/link";
import { Icono } from "./Iconos";

/** El país del viaje de cada nivel (plan, sección 23). */
export const PAIS_DE_NIVEL: Record<string, string> = {
  A1: "Estados Unidos",
  A2: "Reino Unido",
  B1: "Canadá",
  B2: "Australia",
  C1: "Irlanda",
  C2: "El inglés del mundo",
};

/**
 * Arriba de Mi ruta: la foto de Allison, el saludo, el nivel con su
 * país, la racha y la meta de hoy (pantalla 1).
 */
export function EncabezadoRuta({
  nombre,
  nivel,
  racha,
  minutosHoy,
  metaMin,
}: {
  nombre: string;
  nivel: string;
  racha: number;
  minutosHoy: number;
  metaMin: number;
}) {
  const pct = Math.min(100, Math.round((minutosHoy / metaMin) * 100));
  return (
    <>
      <header className="flex items-center gap-3">
        <Image
          src="/allison.png"
          alt="Allison"
          width={48}
          height={48}
          className="respira size-12 rounded-full object-cover outline outline-[2.5px] outline-offset-2 outline-primario"
          priority
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-lg font-black">Hola, {nombre.split(" ")[0]}</p>
          <Link
            href="/perfil/ajustes#nivel"
            className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primario-suave px-2.5 py-1 text-xs font-extrabold text-primario"
          >
            Nivel {nivel} · {PAIS_DE_NIVEL[nivel]}
            <Icono nombre="abajo" className="size-3.5" />
          </Link>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-oro-suave px-2.5 py-1 text-sm font-extrabold text-oro"
          title={`Racha: ${racha} ${racha === 1 ? "día seguido" : "días seguidos"}`}
        >
          <Icono nombre="racha" className="size-4" />
          {racha}
        </span>
      </header>

      <div className="flex flex-col gap-1 text-xs font-bold text-texto-suave">
        <span>
          Meta de hoy · {Math.min(minutosHoy, metaMin)} de {metaMin} min
        </span>
        <div
          className="h-2 rounded-full bg-superficie-2"
          role="progressbar"
          aria-label="Meta de hoy"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-menta transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </>
  );
}
