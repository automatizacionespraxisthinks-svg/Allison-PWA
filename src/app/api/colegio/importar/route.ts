import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { sql } from "@/lib/db";
import { leerCsv } from "@/lib/importar";
import { limitar } from "@/lib/limite";
import { alumnoActual } from "@/lib/sesion";
import { PRUEBA_TOTAL } from "@/lib/verificacion";

const MAX_ALUMNOS = 1000;

/**
 * Carga masiva de alumnos.
 *
 * Dos modos: "validar" muestra qué pasaría, "confirmar" lo hace. Meter
 * 500 alumnos mal es un desastre difícil de deshacer, así que nunca se
 * escribe sin que el coordinador haya visto antes el resultado.
 */
export async function POST(peticion: Request) {
  const usuario = await alumnoActual();
  if (!usuario) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  if (usuario.rol !== "coordinador" && usuario.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!usuario.institucionId) {
    return NextResponse.json({ error: "Sin colegio asignado" }, { status: 403 });
  }

  const limite = limitar(`importar:${usuario.id}`, 20, 3600);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiadas cargas seguidas. Espera un momento." },
      { status: 429, headers: { "Retry-After": String(limite.esperaSeg) } }
    );
  }

  const { csv, confirmar } = (await peticion.json()) as {
    csv?: string;
    confirmar?: boolean;
  };

  if (typeof csv !== "string" || !csv.trim()) {
    return NextResponse.json({ error: "El archivo llegó vacío" }, { status: 400 });
  }

  const lectura = leerCsv(csv);

  if (lectura.filas.length > MAX_ALUMNOS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_ALUMNOS} alumnos por archivo` },
      { status: 400 }
    );
  }

  // Usuarios que ya existen en ESTE colegio
  const existentes = new Set(
    (
      await sql`
        select lower(username) as username from users
         where institucion_id = ${usuario.institucionId} and username is not null
      `
    ).map((f) => f.username as string)
  );

  const nuevos = lectura.filas.filter((f) => !existentes.has(f.username));
  const repetidos = lectura.filas.filter((f) => existentes.has(f.username));

  // Cupo contratado por el colegio
  const [colegio] = await sql`
    select cupo_alumnos,
           (select count(*)::int from users u
             where u.institucion_id = ${usuario.institucionId}
               and u.rol = 'estudiante' and u.activo) as actuales
      from instituciones where id = ${usuario.institucionId}
  `;

  const cupoLibre =
    colegio.cupo_alumnos === null
      ? Number.POSITIVE_INFINITY
      : colegio.cupo_alumnos - colegio.actuales;

  const resumen = {
    separador: lectura.separador === ";" ? "punto y coma" : "coma",
    aCrear: nuevos.length,
    yaExisten: repetidos.length,
    rechazadas: lectura.rechazadas,
    cupoLibre: Number.isFinite(cupoLibre) ? cupoLibre : null,
    muestra: nuevos.slice(0, 5).map((f) => ({
      nombre: f.nombre,
      username: f.username,
      nivel: f.nivel,
    })),
  };

  if (nuevos.length > cupoLibre) {
    return NextResponse.json(
      {
        ...resumen,
        error: `El colegio tiene cupo para ${cupoLibre} alumnos más y estás cargando ${nuevos.length}.`,
      },
      { status: 409 }
    );
  }

  if (!confirmar) {
    return NextResponse.json({ ...resumen, modo: "validacion" });
  }

  // --- Creación real ---
  const credenciales: { nombre: string; username: string; pin: string }[] = [];

  await sql.begin(async (tx) => {
    for (const f of nuevos) {
      const pin = String(randomInt(0, 10_000)).padStart(4, "0");
      const [u] = await tx`
        insert into users
          (tipo_acceso, institucion_id, username, pin_hash, nombre, nivel, rol)
        values
          ('institucional', ${usuario.institucionId}, ${f.username},
           ${await bcrypt.hash(pin, 12)}, ${f.nombre}, ${f.nivel}, 'estudiante')
        returning id
      `;
      await tx`
        insert into saldos (user_id, mensajes_recarga) values (${u.id}, ${PRUEBA_TOTAL})
      `;
      await tx`
        insert into movimientos_credito
          (user_id, tipo, bolsa, cantidad, saldo_plan_despues,
           saldo_recarga_despues, nota)
        values
          (${u.id}, 'bono', 'recarga', ${PRUEBA_TOTAL}, 0, ${PRUEBA_TOTAL},
           'Prueba al cargar el alumno desde el colegio')
      `;
      credenciales.push({ nombre: f.nombre, username: f.username, pin });
    }
  });

  // Los PINes viajan UNA vez. En la base solo queda el hash.
  return NextResponse.json({ ...resumen, modo: "creado", credenciales });
}
