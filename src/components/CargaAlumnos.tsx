"use client";

import { useState } from "react";
import { pedir as pedirHttp } from "@/lib/pedir";

interface Fila {
  nombre: string;
  username: string;
  curso: string | null;
  nivel: string;
  revision: string;
  nuevo: boolean;
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
  cambianDeCurso: number;
  rechazadas: Rechazada[];
  cupoLibre: number | null;
  filas: Fila[];
  error?: string;
}
interface Credencial {
  nombre: string;
  username: string;
  pin: string;
  curso: string | null;
}

/** La plantilla que se descarga: las columnas que lee la carga. */
const PLANTILLA = "nombre;usuario o documento;curso;nivel\r\nMateo Silva;msilva;9C;A1\r\nSofía Rojas;;9C;\r\n";

function descargar(nombre: string, texto: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * La carga masiva de alumnos (plan, sección 12; boceto 4B). La usa el
 * coordinador desde su panel y el administrador desde Colegios; el
 * administrador además puede dar el saldo inicial de las cuentas nuevas.
 * Cada alumno queda con su curso: un archivo por curso (eligiendo el
 * curso para todo el archivo) o uno de todo el colegio con la columna
 * Curso. Si el alumno ya existe, se actualiza su curso.
 */
export function CargaAlumnos({
  codigoColegio,
  admin,
}: {
  codigoColegio: string;
  /** Desde el panel de administración: el colegio y el saldo inicial. */
  admin?: { institucionId: string; nombreColegio: string };
}) {
  const [csv, setCsv] = useState("");
  const [archivo, setArchivo] = useState<string | null>(null);
  const [curso, setCurso] = useState("");
  const [saldoInicial, setSaldoInicial] = useState(admin ? "200" : "0");
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [credenciales, setCredenciales] = useState<Credencial[] | null>(null);
  const [actualizados, setActualizados] = useState(0);
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
    const r = await pedirHttp(admin ? "/api/admin/colegios/carga" : "/api/colegio/importar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        csv,
        confirmar,
        curso: curso.trim() || null,
        ...(admin ? { institucionId: admin.institucionId, saldoInicial: Number(saldoInicial) || 0 } : {}),
      }),
    });
    const d = r ? await r.json().catch(() => ({})) : {};
    setOcupado(false);

    // Al confirmar, si la respuesta se pierde (sin red, o un error del
    // servidor sin explicación, como un 502 del proxy) las cuentas pueden
    // haberse creado igual. Antes decía "No pudimos leer el archivo", el
    // coordinador repetía, todas salían como "Ya existe" y los PIN no se
    // volvían a mostrar (auditoría, 30 de octubre de 2026). Ahora se dice
    // la verdad y se vuelve al paso 2: revisar otra vez muestra cuáles ya
    // quedaron.
    if (confirmar && (!r || (r.status >= 500 && d.error === undefined))) {
      setResumen(null);
      setError(
        "No sabemos si se crearon: revisa la lista antes de repetir. Toca «Revisar antes de crear»: las cuentas que ya quedaron salen como «Ya existe», y sus PIN se reinician desde la lista de alumnos."
      );
      return;
    }
    if (!r) {
      setError("Sin conexión. Revisa tu internet e intenta otra vez.");
      return;
    }
    if (!r.ok) {
      setResumen(d.aCrear !== undefined ? d : null);
      setError(d.error ?? (confirmar ? "No pudimos crear las cuentas. Intenta otra vez." : "No pudimos leer el archivo."));
      return;
    }
    setResumen(d);
    if (d.credenciales) {
      setCredenciales(d.credenciales);
      setActualizados(d.cambianDeCurso ?? 0);
    }
  }

  /** Un archivo que la secretaría pueda imprimir y repartir. */
  function descargarCredenciales() {
    if (!credenciales) return;
    descargar(
      `claves-${codigoColegio}.csv`,
      ["nombre;usuario;pin;curso;codigo_colegio", ...credenciales.map((c) => `${c.nombre};${c.username};${c.pin};${c.curso ?? ""};${codigoColegio}`)].join("\r\n")
    );
  }

  const cambiar = () => {
    setResumen(null);
    setError(null);
  };
  const saldo = Number(saldoInicial) || 0;

  // --- Resultado final: las claves ---
  if (credenciales) {
    return (
      <section className="flex flex-col gap-4">
        <div className="rounded-2xl border-2 border-exito/40 bg-exito/5 p-5">
          <h2 className="text-lg font-bold">
            {credenciales.length} alumnos creados{actualizados > 0 ? ` · ${actualizados} cambiaron de curso` : ""}
          </h2>
          {credenciales.length > 0 && (
            <>
              <p className="mt-1 text-[15px] text-texto-suave">
                Estas son sus claves. <strong className="text-texto">Descárgalas ahora</strong>: por seguridad no las volvemos a mostrar, y si se
                pierden hay que reiniciar los PINes uno por uno.
              </p>
              <button type="button" onClick={descargarCredenciales} className="mt-4 w-full rounded-xl bg-exito px-6 py-3.5 font-semibold text-white">
                Descargar las claves
              </button>
            </>
          )}
        </div>

        {credenciales.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-borde bg-superficie">
            <table className="w-full text-sm">
              <thead className="border-b border-borde text-left text-texto-suave">
                <tr>
                  <th className="px-4 py-2 font-medium">Alumno</th>
                  <th className="px-4 py-2 font-medium">Usuario</th>
                  <th className="px-4 py-2 font-medium">Curso</th>
                  <th className="px-4 py-2 font-medium">PIN</th>
                </tr>
              </thead>
              <tbody>
                {credenciales.map((c) => (
                  <tr key={c.username} className="border-b border-borde last:border-0">
                    <td className="px-4 py-2">{c.nombre}</td>
                    <td className="px-4 py-2 font-mono">{c.username}</td>
                    <td className="px-4 py-2">{c.curso ?? "—"}</td>
                    <td className="px-4 py-2 font-mono font-bold tracking-widest">{c.pin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  const accion =
    resumen && resumen.aCrear > 0
      ? `Crear ${resumen.aCrear} ${resumen.aCrear === 1 ? "cuenta" : "cuentas"}${admin && saldo > 0 ? " y asignar saldo" : ""}${
          resumen.cambianDeCurso > 0 ? ` y actualizar ${resumen.cambianDeCurso} ${resumen.cambianDeCurso === 1 ? "curso" : "cursos"}` : ""
        }`
      : resumen && resumen.cambianDeCurso > 0
        ? `Actualizar ${resumen.cambianDeCurso} ${resumen.cambianDeCurso === 1 ? "curso" : "cursos"}`
        : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-2xl border border-borde bg-superficie p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="font-semibold">1. Sube la lista{admin ? ` · ${admin.nombreColegio}` : ""}</h2>
          <button
            type="button"
            onClick={() => descargar("plantilla-alumnos.csv", PLANTILLA)}
            className="rounded-lg border border-borde px-3 py-1.5 text-xs font-semibold hover:bg-superficie-2"
          >
            Descargar plantilla CSV
          </button>
        </div>
        <p className="mt-1 text-sm text-texto-suave">
          Columnas: <span className="font-mono">nombre · usuario o documento · curso · nivel</span>. El usuario y el nivel son opcionales (si no
          vienen, se forma el usuario con el nombre y quedan en A1). Sirve el CSV que exporta Excel.
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Curso para todo el archivo</span>
            <input
              value={curso}
              onChange={(e) => {
                setCurso(e.target.value);
                cambiar();
              }}
              maxLength={12}
              placeholder="Ej.: 9C (vacío si el archivo trae la columna Curso)"
              className="rounded-xl border border-borde bg-superficie px-3 py-2"
            />
          </label>
          {admin && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Saldo inicial por alumno nuevo</span>
              <input
                type="number"
                min={0}
                max={5000}
                value={saldoInicial}
                onChange={(e) => {
                  setSaldoInicial(e.target.value);
                  cambiar();
                }}
                className="rounded-xl border border-borde bg-superficie px-3 py-2"
              />
            </label>
          )}
        </div>
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
              <strong className="text-exito">{resumen.aCrear}</strong> cuentas nuevas
              {admin && saldo > 0 && resumen.aCrear > 0 ? `, con ${saldo} intervenciones cada una` : ""}
            </li>
            {resumen.yaExisten > 0 && (
              <li className="text-texto-suave">
                <strong>{resumen.yaExisten}</strong> ya existían
                {resumen.cambianDeCurso > 0 ? ` (${resumen.cambianDeCurso} cambian de curso)` : ""}: no se crea otra cuenta
                {admin && saldo > 0 ? " y su saldo no cambia (para sumarles, usa Asignar saldo)" : ""}
              </li>
            )}
            {resumen.rechazadas.length > 0 && (
              <li className="text-acento">
                <strong>{resumen.rechazadas.length}</strong> líneas no se pueden usar
              </li>
            )}
            {resumen.cupoLibre !== null && (
              <li className="text-texto-suave">
                Cupo libre del colegio: <strong>{resumen.cupoLibre}</strong>
              </li>
            )}
          </ul>

          {resumen.filas.length > 0 && (
            <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-borde">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="sticky top-0 bg-superficie-2 text-left text-xs text-texto-suave">
                  <tr>
                    <th className="px-3 py-2 font-medium">Nombre</th>
                    <th className="px-3 py-2 font-medium">Usuario</th>
                    <th className="px-3 py-2 font-medium">Curso</th>
                    <th className="px-3 py-2 font-medium">Nivel</th>
                    <th className="px-3 py-2 font-medium">Revisión</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.filas.map((f) => (
                    <tr key={f.username} className="border-t border-borde">
                      <td className="px-3 py-1.5">{f.nombre}</td>
                      <td className="px-3 py-1.5 font-mono">{f.username}</td>
                      <td className="px-3 py-1.5">{f.curso ?? "—"}</td>
                      <td className="px-3 py-1.5">{f.nivel}</td>
                      <td className={`px-3 py-1.5 ${f.nuevo ? "text-exito" : f.revision === "Ya existe" ? "text-texto-suave" : "text-acento"}`}>
                        {f.revision}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {resumen.rechazadas.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-acento">Ver las {resumen.rechazadas.length} líneas con problema</summary>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-texto-suave">
                {resumen.rechazadas.slice(0, 30).map((r) => (
                  <li key={r.linea}>
                    Línea {r.linea}: {r.motivo}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {accion && !resumen.error && (
            <button
              type="button"
              onClick={() => pedir(true)}
              disabled={ocupado}
              className="mt-5 w-full rounded-xl bg-primario px-6 py-3.5 font-semibold text-white disabled:opacity-50"
            >
              {ocupado ? "Guardando…" : `3. ${accion}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
