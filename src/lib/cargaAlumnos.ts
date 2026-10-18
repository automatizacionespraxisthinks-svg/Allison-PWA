import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { COSTO_HASH_PIN } from "./colegio";
import { sql } from "./db";
import { leerCsv, limpiarCurso, type FilaRechazada } from "./importar";
import { MENSAJES_PRUEBA } from "./prueba";
import type { Nivel } from "./tipos";

/**
 * La carga masiva de alumnos de un colegio (plan, sección 12; boceto 4B).
 * La usan el coordinador (/colegio/importar) y el administrador (panel,
 * Colegios). Dos pasos: primero se muestra qué pasaría y después se hace;
 * meter 500 alumnos mal es difícil de deshacer.
 *
 * Cada alumno queda con su curso: un archivo por curso ("curso para todo
 * el archivo") o uno de todo el colegio con la columna Curso. Si el
 * alumno ya existe, se actualiza su curso sin crear otra cuenta. El saldo
 * inicial (solo el administrador) se da a las cuentas nuevas; a las que
 * ya existían se les suma con "Asignar saldo".
 */

const MAX_ALUMNOS = 1000;

export interface PedidoCarga {
  institucionId: string;
  csv: string;
  confirmar: boolean;
  /** "9C": el curso de todos los alumnos del archivo. */
  cursoParaTodos?: string | null;
  /** Intervenciones para cada cuenta nueva (solo el administrador). */
  saldoInicial?: number;
  /** Sin curso para todo el archivo, cada fila debe traer el suyo. */
  exigirCurso?: boolean;
  /** Quién carga (queda en el historial del saldo). */
  quien: string;
}

export interface FilaRevisada {
  nombre: string;
  username: string;
  curso: string | null;
  nivel: Nivel;
  /** "Nuevo", "Ya existe", "Ya existe · pasa de 9B a 9C". */
  revision: string;
  nuevo: boolean;
}

export interface ResultadoCarga {
  status: number;
  error?: string;
  separador: string;
  aCrear: number;
  yaExisten: number;
  cambianDeCurso: number;
  rechazadas: FilaRechazada[];
  cupoLibre: number | null;
  filas: FilaRevisada[];
  modo: "validacion" | "creado";
  credenciales?: { nombre: string; username: string; pin: string; curso: string | null }[];
}

export async function cargarAlumnos(p: PedidoCarga): Promise<ResultadoCarga> {
  const lectura = leerCsv(p.csv);
  const cursoGlobal = p.cursoParaTodos ? limpiarCurso(p.cursoParaTodos) : null;
  const rechazadas = [...lectura.rechazadas];
  let filas = lectura.filas.map((f) => ({ ...f, curso: cursoGlobal ?? f.curso }));
  if (p.exigirCurso && !cursoGlobal) {
    for (const f of filas.filter((x) => !x.curso)) {
      rechazadas.push({ linea: f.linea, contenido: f.nombre, motivo: "Falta el curso (o elige un curso para todo el archivo)" });
    }
    filas = filas.filter((x) => x.curso);
  }

  const base = {
    separador: lectura.separador === ";" ? "punto y coma" : "coma",
    rechazadas,
    modo: "validacion" as const,
  };
  if (filas.length > MAX_ALUMNOS) {
    return { ...base, status: 400, error: `Máximo ${MAX_ALUMNOS} alumnos por archivo`, aCrear: 0, yaExisten: 0, cambianDeCurso: 0, cupoLibre: null, filas: [] };
  }

  // Los que ya existen en ESTE colegio, con su curso.
  const existentes = new Map(
    (
      await sql`
        select lower(username) as username, id, curso from users
         where institucion_id = ${p.institucionId} and username is not null
      `
    ).map((f) => [f.username as string, { id: f.id as string, curso: f.curso as string | null }])
  );

  const revisadas: (FilaRevisada & { id?: string })[] = filas.map((f) => {
    const ya = existentes.get(f.username);
    if (!ya) return { nombre: f.nombre, username: f.username, curso: f.curso, nivel: f.nivel, revision: "Nuevo", nuevo: true };
    const cambia = !!f.curso && f.curso !== ya.curso;
    return {
      id: ya.id,
      nombre: f.nombre,
      username: f.username,
      curso: f.curso,
      nivel: f.nivel,
      revision: cambia ? (ya.curso ? `Ya existe · pasa de ${ya.curso} a ${f.curso}` : `Ya existe · queda en ${f.curso}`) : "Ya existe",
      nuevo: false,
    };
  });
  const nuevos = revisadas.filter((r) => r.nuevo);
  const cambian = revisadas.filter((r) => !r.nuevo && r.revision !== "Ya existe");

  // Cupo contratado por el colegio
  const [colegio] = await sql`
    select cupo_alumnos,
           (select count(*)::int from users u
             where u.institucion_id = ${p.institucionId} and u.rol = 'estudiante' and u.activo) as actuales
      from instituciones where id = ${p.institucionId}
  `;
  if (!colegio) {
    return { ...base, status: 404, error: "El colegio no existe", aCrear: 0, yaExisten: 0, cambianDeCurso: 0, cupoLibre: null, filas: [] };
  }
  const cupoLibre = colegio.cupo_alumnos === null ? null : colegio.cupo_alumnos - colegio.actuales;

  const resumen = {
    ...base,
    aCrear: nuevos.length,
    yaExisten: revisadas.length - nuevos.length,
    cambianDeCurso: cambian.length,
    cupoLibre,
    filas: revisadas.slice(0, 200).map(({ nombre, username, curso, nivel, revision, nuevo }) => ({ nombre, username, curso, nivel, revision, nuevo })),
  };
  if (cupoLibre !== null && nuevos.length > cupoLibre) {
    return { ...resumen, status: 409, error: `El colegio tiene cupo para ${cupoLibre} alumnos más y estás cargando ${nuevos.length}.` };
  }
  if (!p.confirmar) return { ...resumen, status: 200 };

  // --- Creación real ---
  // Los PIN se cifran ANTES de abrir la transacción: adentro, cada hash
  // retenía una conexión durante toda la carga.
  const preparados: { fila: (typeof nuevos)[number]; pin: string; hash: string }[] = [];
  for (const fila of nuevos) {
    const pin = String(randomInt(0, 10_000)).padStart(4, "0");
    preparados.push({ fila, pin, hash: await bcrypt.hash(pin, COSTO_HASH_PIN) });
  }
  const saldoInicial = Math.max(0, Math.floor(p.saldoInicial ?? 0));

  await sql.begin(async (tx) => {
    for (const { fila: f, hash } of preparados) {
      const [u] = await tx`
        insert into users
          (tipo_acceso, institucion_id, username, pin_hash, nombre, nivel, rol, curso)
        values
          ('institucional', ${p.institucionId}, ${f.username},
           ${hash}, ${f.nombre}, ${f.nivel}, 'estudiante', ${f.curso})
        returning id
      `;
      await tx`
        insert into saldos (user_id, mensajes_recarga) values (${u.id}, ${MENSAJES_PRUEBA})
      `;
      await tx`
        insert into movimientos_credito
          (user_id, tipo, bolsa, cantidad, saldo_plan_despues,
           saldo_recarga_despues, nota)
        values
          (${u.id}, 'bono', 'recarga', ${MENSAJES_PRUEBA}, 0, ${MENSAJES_PRUEBA},
           'Prueba al cargar el alumno desde el colegio')
      `;
      if (saldoInicial > 0) {
        await tx`
          select ajustar_saldo(${u.id}, ${saldoInicial}, 'recarga'::bolsa_credito,
                               ${`Saldo inicial al cargar el colegio — por ${p.quien}`})
        `;
      }
    }
    for (const c of cambian) {
      await tx`update users set curso = ${c.curso}, actualizado_en = now() where id = ${c.id!}`;
    }
  });

  // Los PIN viajan UNA vez. En la base solo queda el hash.
  return {
    ...resumen,
    status: 200,
    modo: "creado",
    credenciales: preparados.map(({ fila, pin }) => ({ nombre: fila.nombre, username: fila.username, pin, curso: fila.curso })),
  };
}
