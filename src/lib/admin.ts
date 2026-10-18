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
  saldo: number;
  mensajes: number;
  ultimaPractica: string | null;
  pagado: number;
  creadoEn: string;
}

/** Búsqueda por nombre, correo, celular o usuario. */
export async function buscarUsuarios(consulta: string): Promise<UsuarioAdmin[]> {
  const q = `%${consulta.trim().toLowerCase()}%`;

  const filas = await sql`
    select u.id, u.nombre, u.email, u.telefono, u.username, u.rol, u.nivel,
           u.activo, u.ultima_practica_en, u.creado_en,
           i.nombre as colegio,
           coalesce(s.mensajes_plan, 0) + coalesce(s.mensajes_recarga, 0) as saldo,
           (select coalesce(sum(p.mensajes), 0)::int from progreso_diario p
             where p.user_id = u.id) as mensajes,
           (select coalesce(sum(t.monto_cop), 0)::int from transacciones t
             where t.user_id = u.id and t.estado = 'aprobada') as pagado
      from users u
      left join saldos s on s.user_id = u.id
      left join instituciones i on i.id = u.institucion_id
     where lower(u.nombre) like ${q}
        or lower(coalesce(u.email, '')) like ${q}
        or coalesce(u.telefono, '') like ${q}
        or lower(coalesce(u.username, '')) like ${q}
     order by u.creado_en desc
     limit 40
  `;

  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    email: f.email,
    telefono: f.telefono,
    username: f.username,
    rol: f.rol,
    nivel: f.nivel,
    activo: f.activo,
    colegio: f.colegio,
    saldo: f.saldo,
    mensajes: f.mensajes,
    ultimaPractica: f.ultima_practica_en
      ? (f.ultima_practica_en as Date).toISOString()
      : null,
    pagado: f.pagado,
    creadoEn: (f.creado_en as Date).toISOString(),
  }));
}
