import { notFound } from "next/navigation";
import { sql } from "./db";
import { alumnoActual } from "./sesion";

/**
 * Consultas del panel de administración.
 *
 * Todo lo de aquí exige rol admin. La comprobación vive en una sola
 * función para que no se pueda olvidar en una pantalla nueva.
 */
export async function exigirAdmin() {
  const usuario = await alumnoActual();
  if (!usuario || usuario.rol !== "admin") return null;
  return usuario;
}

/**
 * La primera línea de cada página del panel. El layout de /admin no
 * basta: en Next 16 una página se puede pedir sola (sin volver a correr
 * su layout) y sus datos viajarían igual. Quien no es admin ve "no
 * encontrado", sin pistas de que el panel existe.
 */
export async function paginaDeAdmin() {
  const admin = await exigirAdmin();
  if (!admin) notFound();
  return admin;
}

export interface ColegioAdmin {
  id: string;
  nombre: string;
  nit: string | null;
  codigoAcceso: string;
  estado: string;
  cupoAlumnos: number | null;
  tarifaPorAlumno: number | null;
  alumnos: number;
  activosSemana: number;
  pagadoHasta: string | null;
  ultimoPagoCop: number | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;
  notas: string | null;
  /** Cuándo se creó el colegio en la plataforma. */
  creadoEn: string;
}

export async function colegios(): Promise<ColegioAdmin[]> {
  const filas = await sql`
    select i.*,
           (select count(*)::int from users u
             where u.institucion_id = i.id and u.rol = 'estudiante' and u.activo) as alumnos,
           (select count(*)::int from users u
             where u.institucion_id = i.id and u.rol = 'estudiante'
               and u.ultima_practica_en > now() - interval '7 days') as activos
      from instituciones i
     order by i.creado_en desc
  `;

  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    nit: f.nit,
    codigoAcceso: f.codigo_acceso,
    estado: f.estado,
    cupoAlumnos: f.cupo_alumnos,
    tarifaPorAlumno: f.tarifa_por_alumno_cop,
    alumnos: f.alumnos,
    activosSemana: f.activos,
    // toISOString y no String(): String(fecha) da "Mon Nov 30 2026 ..."
    // y al cortar diez caracteres se pierde el año, que el navegador
    // luego interpreta como 2001.
    pagadoHasta: f.pagado_hasta
      ? new Date(f.pagado_hasta as string | Date).toISOString().slice(0, 10)
      : null,
    ultimoPagoCop: f.ultimo_pago_cop,
    contactoEmail: f.contacto_email,
    contactoTelefono: f.contacto_telefono,
    notas: f.notas,
    creadoEn: new Date(f.creado_en as string | Date).toISOString(),
  }));
}

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  username: string | null;
  rol: string;
  nivel: string;
  activo: boolean;
  colegio: string | null;
  curso?: string | null;
  saldo: number;
  mensajes: number;
  ultimaPractica: string | null;
  pagado: number;
  creadoEn: string;
}

/** Sin tildes ni mayúsculas, para buscar "Sofia" y encontrar "Sofía". */
const CON_TILDE = "áàäâéèëêíìïîóòöôúùüûñç";
const SIN_TILDE = "aaaaeeeeiiiioooouuuunc";
export const sinTildes = (t: string) =>
  t
    .toLowerCase()
    .split("")
    .map((c) => {
      const i = CON_TILDE.indexOf(c);
      return i >= 0 ? SIN_TILDE[i] : c;
    })
    .join("");

export interface FiltroAlumnos {
  /** Nombre, correo, celular o usuario; vacío: los últimos registrados. */
  q?: string;
  /** "particulares", el id de un colegio, o vacío para todos. */
  colegio?: string;
  nivel?: string;
  orden?: "recientes" | "practica" | "nombre";
  limite?: number;
}

/**
 * Los alumnos del panel: sin búsqueda, los últimos que se registraron
 * (el panel abría vacío hasta que se buscaba algo); con búsqueda, por
 * nombre, correo, celular o usuario, sin importar las tildes. Devuelve
 * también cuántos hay en total con esos filtros.
 */
export async function listarUsuarios(f: FiltroAlumnos): Promise<{ usuarios: UsuarioAdmin[]; total: number }> {
  const texto = sinTildes((f.q ?? "").trim());
  const q = `%${texto}%`;
  // Columnas fijas, nunca texto del usuario: por eso puede ir sin parámetros.
  const limpio = (col: string) => sql.unsafe(`translate(lower(coalesce(${col}, '')), '${CON_TILDE}', '${SIN_TILDE}')`);
  // Una función y no un fragmento: cada consulta arma el suyo.
  const condiciones = () => sql`
    ${texto
      ? sql`and (${limpio("u.nombre")} like ${q} or ${limpio("u.email")} like ${q}
                 or coalesce(u.telefono, '') like ${q} or ${limpio("u.username")} like ${q})`
      : sql``}
    ${f.colegio === "particulares" ? sql`and u.institucion_id is null` : f.colegio ? sql`and u.institucion_id = ${f.colegio}` : sql``}
    ${f.nivel ? sql`and u.nivel = ${f.nivel}` : sql``}
  `;
  const orden =
    f.orden === "nombre"
      ? sql`order by lower(u.nombre)`
      : f.orden === "practica"
        ? sql`order by u.ultima_practica_en desc nulls last, u.creado_en desc`
        : sql`order by u.creado_en desc`;

  const [filas, [cuenta]] = await Promise.all([
    sql`
      select u.id, u.nombre, u.email, u.telefono, u.username, u.rol, u.nivel,
             u.activo, u.ultima_practica_en, u.creado_en, u.curso,
             i.nombre as colegio,
             coalesce(s.mensajes_plan, 0) + coalesce(s.mensajes_recarga, 0) as saldo,
             (select coalesce(sum(p.mensajes), 0)::int from progreso_diario p
               where p.user_id = u.id) as mensajes,
             (select coalesce(sum(case when t.payload->>'alerta' = 'anulada' then 0
                                       when t.pasarela in ('efectivo', 'transferencia')
                                         then coalesce((t.payload->>'valorRecibido')::int, t.monto_cop)
                                       else t.monto_cop end), 0)::int
                from transacciones t
               where t.user_id = u.id and t.estado = 'aprobada') as pagado
        from users u
        left join saldos s on s.user_id = u.id
        left join instituciones i on i.id = u.institucion_id
       where true ${condiciones()}
       ${orden}
       limit ${f.limite ?? 40}
    `,
    sql`select count(*)::int as total from users u where true ${condiciones()}`,
  ]);
  return { usuarios: filas.map(aUsuarioAdmin), total: cuenta.total };
}

function aUsuarioAdmin(f: Record<string, unknown>): UsuarioAdmin {
  return {
    id: f.id as string,
    nombre: f.nombre as string,
    email: f.email as string | null,
    telefono: f.telefono as string | null,
    username: f.username as string | null,
    rol: f.rol as string,
    nivel: f.nivel as string,
    activo: f.activo as boolean,
    colegio: f.colegio as string | null,
    curso: (f.curso as string | null) ?? null,
    saldo: Number(f.saldo),
    mensajes: Number(f.mensajes),
    ultimaPractica: f.ultima_practica_en ? (f.ultima_practica_en as Date).toISOString() : null,
    pagado: Number(f.pagado),
    creadoEn: (f.creado_en as Date).toISOString(),
  };
}

