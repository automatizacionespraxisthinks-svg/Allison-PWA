import { fraseDelSalon, minutosEnTexto, type SalonDelAlumno } from "@/lib/competencia/tabla";
import { Icono } from "./Iconos";

/**
 * La competencia por salón en Mi ruta: dónde va el salón del alumno esta
 * semana y los tres primeros. Solo promedios de salón: nadie ve cuánto
 * practicó un compañero.
 */
export function TarjetaSalon({ salon }: { salon: SalonDelAlumno }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-borde bg-superficie-2 p-3" aria-labelledby="salones">
      <div className="flex items-center gap-3">
        <span className="grid size-9 flex-none place-items-center rounded-xl bg-oro-suave text-oro">
          <Icono nombre="trofeo" className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <small id="salones" className="text-[11px] font-black tracking-[0.06em] text-texto-suave uppercase">
            Competencia de salones
          </small>
          <b className="text-[15px] font-black text-balance">{fraseDelSalon(salon)}</b>
        </span>
      </div>

      {!salon.empieza && (
        <ol className="flex flex-col gap-1">
          {salon.primeros.map((s) => {
            const mio = s.curso === salon.curso;
            return (
              <li
                key={s.curso}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ${mio ? "bg-primario-suave font-black" : "bg-superficie font-bold"}`}
              >
                <span className="w-7 tabular-nums text-texto-suave">{s.puesto}.º</span>
                <span className="flex-1">{mio ? `${s.curso} · tu salón` : s.curso}</span>
                <span className="tabular-nums">{minutosEnTexto(s.minutos)}</span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-xs font-semibold text-texto-suave">
        {salon.empieza
          ? "Gana el salón con más minutos de práctica por alumno. Cada día cuentan hasta 30 minutos tuyos."
          : "Minutos por alumno. Cada día cuentan hasta 30 minutos tuyos; la semana cierra el domingo."}
      </p>
    </section>
  );
}
