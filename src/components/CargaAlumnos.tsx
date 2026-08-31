"use client";

import { useState } from "react";
import { pedir as pedirHttp } from "@/lib/pedir";

interface Muestra {
  nombre: string;
  username: string;
  nivel: string;
}
interface Rechazada {
  linea: number;
  contenido: string;
  motivo: string;
}
interface Resumen {
  separador: string;
  aCrear: number;
  yaExisten: number;
  rechazadas: Rechazada[];
  cupoLibre: number | null;
  muestra: Muestra[];
  error?: string;
}
interface Credencial {
  nombre: string;
  username: string;
  pin: string;
}

export function CargaAlumnos({ codigoColegio }: { codigoColegio: string }) {
  const [csv, setCsv] = useState("");
  const [archivo, setArchivo] = useState<string | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [credenciales, setCredenciales] = useState<Credencial[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leerArchivo(f: File) {
    setError(null);
    setResumen(null);
    setCredenciales(null);
    setArchivo(f.name);
    setCsv(await f.text());
  }

  async function pedir(confirmar: boolean) {
    setError(null);
    setOcupado(true);
    const r = await pedirHttp("/api/colegio/importar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, confirmar }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(false);

    if (!r?.ok) {
      setResumen(d.aCrear !== undefined ? d : null);
      setError(d.error ?? "No pudimos leer el archivo.");
      return;
    }
    setResumen(d);
    if (d.credenciales) setCredenciales(d.credenciales);
  }

  /** Un archivo que la secretaría pueda imprimir y repartir. */
  function descargarCredenciales() {
    if (!credenciales) return;
    const lineas = [
      "nombre;usuario;pin;codigo_colegio",
      ...credenciales.map(
        (c) => `${c.nombre};${c.username};${c.pin};${codigoColegio}`
      ),
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["﻿" + lineas], { type: "text/csv;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `claves-${codigoColegio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Resultado final: las claves ---
  if (credenciales) {
    return (
      <section className="flex flex-col gap-4">
        <div className="rounded-2xl border-2 border-exito/40 bg-exito/5 p-5">
          <h2 className="text-lg font-bold">
            {credenciales.length} alumnos creados
          </h2>
          <p className="mt-1 text-[15px] text-texto-suave">
            Estas son sus claves. <strong className="text-texto">Descárgalas
            ahora</strong>: por seguridad no las volvemos a mostrar, y si se
            pierden hay que reiniciar los PINes uno por uno.
          </p>
          <button
            type="button"
            onClick={descargarCredenciales}
            className="mt-4 w-full rounded-xl bg-exito px-6 py-3.5 font-semibold text-white"
          >
            Descargar las claves
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
          <table className="w-full text-sm">
            <thead className="border-b border-borde text-left text-texto-suave">
              <tr>
                <th className="px-4 py-2 font-medium">Alumno</th>
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">PIN</th>
              </tr>
            </thead>
            <tbody>
              {credenciales.map((c) => (
                <tr key={c.username} className="border-b border-borde last:border-0">
                  <td className="px-4 py-2">{c.nombre}</td>
                  <td className="px-4 py-2 font-mono">{c.username}</td>
                  <td className="px-4 py-2 font-mono font-bold tracking-widest">
                    {c.pin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-2xl border border-borde bg-superficie p-5">
        <h2 className="font-semibold">1. Sube la lista</h2>
        <p className="mt-1 text-sm text-texto-suave">
          Un archivo CSV o de texto con una línea por alumno:{" "}
          <span className="font-mono">nombre;nivel</span>. El nivel es opcional
          — si no viene, quedan en A1. Sirve el que exporta Excel.
        </p>

        <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-borde px-4 py-6 text-center transition hover:bg-superficie-2">
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void leerArchivo(f);
            }}
          />
          <span className="text-sm">
            {archivo ? (
              <>
                <strong>{archivo}</strong>
                <br />
                <span className="text-texto-suave">Toca para cambiarlo</span>
              </>
            ) : (
              "Elegir archivo"
            )}
          </span>
        </label>
      </div>

      {csv && !resumen && (
        <button
          type="button"
          onClick={() => pedir(false)}
          disabled={ocupado}
          className="rounded-2xl bg-primario px-6 py-4 font-semibold text-white disabled:opacity-50"
        >
          {ocupado ? "Revisando…" : "2. Revisar antes de crear"}
        </button>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-error/10 p-4 text-sm text-error">
          {error}
        </p>
      )}

      {resumen && (
        <div className="rounded-2xl border border-borde bg-superficie p-5">
          <h2 className="font-semibold">Esto es lo que va a pasar</h2>

          <ul className="mt-3 flex flex-col gap-1.5 text-[15px]">
            <li>
              <strong className="text-exito">{resumen.aCrear}</strong> alumnos
              nuevos
            </li>
            {resumen.yaExisten > 0 && (
              <li className="text-texto-suave">
                <strong>{resumen.yaExisten}</strong> ya existían y se dejan como
                están
              </li>
            )}
            {resumen.rechazadas.length > 0 && (
              <li className="text-acento">
                <strong>{resumen.rechazadas.length}</strong> líneas no se pueden
                usar
              </li>
            )}
            {resumen.cupoLibre !== null && (
              <li className="text-texto-suave">
                Cupo libre del colegio: <strong>{resumen.cupoLibre}</strong>
              </li>
            )}
          </ul>

          {resumen.muestra.length > 0 && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-texto-suave">
                Así van a quedar
              </p>
              <ul className="mt-1.5 flex flex-col gap-1 text-sm">
                {resumen.muestra.map((m) => (
                  <li key={m.username}>
                    {m.nombre} → <span className="font-mono">{m.username}</span>{" "}
                    <span className="text-texto-suave">({m.nivel})</span>
                  </li>
                ))}
                {resumen.aCrear > resumen.muestra.length && (
                  <li className="text-texto-suave">
                    …y {resumen.aCrear - resumen.muestra.length} más
                  </li>
                )}
              </ul>
            </>
          )}

          {resumen.rechazadas.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-acento">
                Ver las {resumen.rechazadas.length} líneas con problema
              </summary>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-texto-suave">
                {resumen.rechazadas.slice(0, 20).map((r) => (
                  <li key={r.linea}>
                    Línea {r.linea}: {r.motivo}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {resumen.aCrear > 0 && !resumen.error && (
            <button
              type="button"
              onClick={() => pedir(true)}
              disabled={ocupado}
              className="mt-5 w-full rounded-xl bg-primario px-6 py-3.5 font-semibold text-white disabled:opacity-50"
            >
              {ocupado ? "Creando…" : `3. Crear ${resumen.aCrear} alumnos`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
