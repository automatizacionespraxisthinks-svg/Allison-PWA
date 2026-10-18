"use client";

import { useEffect, useState } from "react";
import { useAvisos } from "@/lib/avisosCliente";
import { AllisonAro } from "./leccion/comun";

const OFRECIDA = "allison:avisos-ofrecidos";

/**
 * La sugerencia de los avisos en Mi ruta: una sola vez en este celular,
 * cuando la racha llega a 3 días ("¿Te aviso si tu racha está por
 * perderse?"). Lo mismo se activa siempre en Perfil → Ajustes.
 */
export function TarjetaAvisos({ racha }: { racha: number }) {
  const { estado, ocupado, activar } = useAvisos();
  const [ofrecida, setOfrecida] = useState(true);
  const [hecho, setHecho] = useState<string | null>(null);

  // Se lee después de montar: en el servidor no hay localStorage.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setOfrecida(localStorage.getItem(OFRECIDA) === "1");
      } catch {
        setOfrecida(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function cerrar() {
    try {
      localStorage.setItem(OFRECIDA, "1");
    } catch {
      // Sin almacenamiento, la tarjeta volvería a salir; no es grave.
    }
    setOfrecida(true);
  }

  if (hecho) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-2xl bg-menta-suave px-4 py-3 text-sm font-bold text-menta">
        {hecho}
      </div>
    );
  }
  if (racha < 3 || ofrecida || (estado !== "inactivo" && estado !== "ios-instalar")) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-primario/30 bg-primario-suave/50 p-4">
      <div className="flex items-center gap-3">
        <AllisonAro tam={44} />
        <div className="min-w-0">
          <b className="block text-[15px] leading-tight font-black">¿Te aviso si tu racha está por perderse?</b>
          <span className="text-[13px] font-semibold text-texto-suave">
            {estado === "ios-instalar"
              ? "En iPhone funciona con Allison en la pantalla de inicio: en Safari, Compartir → «Agregar a inicio»."
              : `Llevas ${racha} días seguidos. Si un día se te olvida, te aviso en este celular.`}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {estado === "inactivo" && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              void activar().then((ok) => {
                cerrar();
                setHecho(ok ? "Listo: te aviso en este celular si tu racha está por perderse." : "No se activaron. Puedes hacerlo luego en Perfil → Ajustes.");
              })
            }
            className="degradado-primario rounded-xl px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
          >
            {ocupado ? "Activando…" : "Sí, avísame"}
          </button>
        )}
        <button type="button" onClick={cerrar} className="rounded-xl border border-borde bg-superficie px-4 py-2.5 text-sm font-extrabold">
          {estado === "ios-instalar" ? "Entendido" : "Ahora no"}
        </button>
      </div>
    </div>
  );
}
