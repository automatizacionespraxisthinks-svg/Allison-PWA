/**
 * Genera los dos scripts SQL que se corren A MANO, en db/manual/:
 *
 *   base-completa.sql   Para una base VACÍA: todo el esquema (las
 *                       migraciones numeradas, en orden y en una sola
 *                       transacción), el registro de que ya se aplicaron,
 *                       y el administrador. Un solo archivo.
 *
 *   semilla-admin.sql   Para una base que YA tiene el esquema: solo el
 *                       administrador.
 *
 * Se GENERAN en vez de escribirse a mano por una razón: el día que
 * alguien agregue la migración 020, un esquema completo escrito a mano
 * quedaría atrasado sin que nadie lo note, y la próxima base nueva
 * nacería incompleta. Aquí el esquema sale de las mismas migraciones
 * que corre la aplicación, y `--verificar` (dentro de npm run revisar)
 * falla si los archivos generados no coinciden con lo que hay en db/.
 *
 *   node scripts/generar-sql-manual.mjs              genera
 *   node scripts/generar-sql-manual.mjs --verificar  comprueba, sin escribir
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DB = join(process.cwd(), "db");
const SALIDA = join(DB, "manual");
const VERIFICAR = process.argv.includes("--verificar");

/** La misma versión que src/lib/legal.ts (vigilada por probar:legal). */
const VERSION_LEGAL = "2026-09-14";

const migraciones = readdirSync(DB)
  .filter((f) => /^\d{3}_.+\.sql$/.test(f))
  .sort();

const leer = (archivo) => readFileSync(join(DB, archivo), "utf8").replace(/\r\n/g, "\n");
const raya = "-- " + "=".repeat(69);
const rayita = "-- " + "-".repeat(69);

// ---------------------------------------------------------------------
//  Los fragmentos del administrador. Viven aquí, una sola vez, y se
//  ensamblan en los dos archivos.
// ---------------------------------------------------------------------

const DATOS_ADMIN = `${rayita}
--  Los datos del administrador — CÁMBIALOS
${rayita}
drop table if exists _admin;
create temporary table _admin as
select
    'praxisthinks@gmail.com'::text  as email,
    'Praxis Admin'::text            as nombre,
    'CAMBIA-ESTA-CLAVE'::text       as clave;
`;

const CANDADO_CLAVE = `-- Los avisos van ANTES de abrir la transacción a propósito: si saltaran
-- con una transacción abierta, la sesión quedaría en estado abortado y
-- todo lo que escribieras después fallaría con un error que no explica
-- nada. Así, un rechazo aquí no toca la base.
do $$
declare v_clave text;
begin
  select clave into v_clave from _admin;
  if v_clave = 'CAMBIA-ESTA-CLAVE' then
    raise exception
      'Cambia la contraseña del administrador antes de correr este script.';
  end if;
  if length(v_clave) < 12 then
    raise exception
      'La contraseña del administrador es demasiado corta (mínimo 12 caracteres).';
  end if;
end $$;
`;

const CREAR_ADMIN = `${rayita}
--  El administrador
--
--  Los consentimientos van marcados porque esta cuenta la crea el
--  dueño de la plataforma para sí mismo, no un alumno que aceptó algo
--  sin leerlo. El correo se da por verificado por lo mismo.
--
--  pgcrypto genera un hash bcrypt idéntico al que produce la aplicación,
--  así que el administrador entra por la pantalla normal. Comprobado
--  contra la librería que usa la app al verificar la clave.
${rayita}
insert into users (
  tipo_acceso, email, password_hash, nombre, nivel, rol,
  email_verificado_en, acepto_terminos_en, version_legal,
  autoriza_transferencia, autoriza_voz, declara_edad_o_acudiente
)
select
  'email', a.email, crypt(a.clave, gen_salt('bf', 12)), a.nombre, 'C1', 'admin',
  now(), now(), '${VERSION_LEGAL}',
  true, true, true
from _admin a
on conflict (email) do update
   -- Si el correo ya existía, solo se ASCIENDE a administrador. La
   -- contraseña NO se toca: correr esto otra vez no debe devolverle a
   -- nadie una clave vieja.
   set rol = 'admin',
       actualizado_en = now();

-- La app da por hecho que TODO usuario tiene fila en saldos — hay una
-- comprobación de integridad que lo vigila. Queda en cero a propósito:
-- el administrador no necesita intervenciones para administrar, y
-- regalárselas ensuciaría el libro de movimientos, que debe cuadrar
-- peso a peso.
insert into saldos (user_id, mensajes_plan, mensajes_recarga)
select u.id, 0, 0
  from users u join _admin a on a.email = u.email
on conflict (user_id) do nothing;
`;

const RESUMEN = `drop table if exists _admin;

${rayita}
--  Qué quedó
${rayita}
select u.nombre,
       u.email,
       u.rol,
       u.nivel,
       (u.email_verificado_en is not null) as correo_verificado,
       (s.user_id is not null)             as tiene_saldo
  from users u
  left join saldos s on s.user_id = u.id
 where u.rol = 'admin';

select codigo, precio_cop, mensajes_por_mes, duracion_meses
  from planes
 order by orden;
`;

const AVISO_GENERADO = `--  ARCHIVO GENERADO por scripts/generar-sql-manual.mjs a partir de las
--  migraciones de db/. No lo edites a mano (salvo las tres líneas del
--  administrador): regenera con  npm run generar:sql
`;

// ---------------------------------------------------------------------
//  semilla-admin.sql — la base ya tiene esquema
// ---------------------------------------------------------------------
function semillaAdmin() {
  return `${raya}
--  Allison — crear el ADMINISTRADOR en una base que YA tiene el esquema
--
--  Si la base está vacía, este no es tu archivo: usa base-completa.sql,
--  que crea el esquema Y el administrador de una vez.
--
--  ⚠  ANTES DE CORRERLO: cambia las tres líneas del administrador. Y NO
--     guardes este archivo con una contraseña real en ningún sitio
--     compartido: ponla, ejecútalo, y vuelve a dejar el marcador.
--
--  Puedes correrlo dos veces: no duplica nada ni pisa una contraseña
--  ya cambiada.
--
${AVISO_GENERADO}${raya}

${DATOS_ADMIN}
${CANDADO_CLAVE}
create extension if not exists pgcrypto;

begin;

${CREAR_ADMIN}
commit;

${RESUMEN}`;
}

// ---------------------------------------------------------------------
//  base-completa.sql — la base está vacía
// ---------------------------------------------------------------------
function baseCompleta() {
  const cuerpo = migraciones
    .map((archivo) => `${raya}\n--  ${archivo}\n${raya}\n\n${leer(archivo).trim()}\n`)
    .join("\n\n");

  const registro = `${raya}
--  Registro de migraciones
--
--  Exactamente la tabla que lleva scripts/migrar.mjs. Con esto, la
--  próxima vez que alguien corra las migraciones contra esta base, verá
--  las ${migraciones.length} como "ya aplicada" y solo aplicará las nuevas.
${raya}

create table if not exists migraciones (
  archivo     text primary key,
  aplicada_en timestamptz not null default now()
);

insert into migraciones (archivo) values
${migraciones.map((m) => `  ('${m}')`).join(",\n")}
on conflict (archivo) do nothing;
`;

  return `${raya}
--  Allison — BASE COMPLETA para una base de datos VACÍA
--
--  Un solo archivo que deja la base lista para producción:
--    1. todo el esquema (${migraciones.length} migraciones, en orden)
--    2. el registro de que ya se aplicaron
--    3. el administrador con el que entras por primera vez
--
--  Todo va en UNA transacción: si algo falla, la base queda intacta,
--  nunca a medias.
--
--  ⚠  ANTES DE CORRERLO: cambia las tres líneas del administrador. Y NO
--     guardes este archivo con una contraseña real en ningún sitio
--     compartido: ponla, ejecútalo, y vuelve a dejar el marcador.
--
--  Cómo ejecutarlo: pégalo entero en tu herramienta de base de datos
--  (DBeaver, pgAdmin, el editor SQL de Dokploy) conectada a la base
--  vacía, y ejecútalo como script completo.
--
${AVISO_GENERADO}${raya}

${DATOS_ADMIN}
${CANDADO_CLAVE}
-- Y si la base NO está vacía, tampoco toca nada: para eso está
-- semilla-admin.sql (solo el administrador) o scripts/migrar.mjs
-- (actualizar el esquema).
do $$
begin
  if to_regclass('public.users') is not null then
    raise exception
      'Esta base ya tiene el esquema de Allison. Para crear solo el administrador usa db/manual/semilla-admin.sql; para actualizar el esquema, node scripts/migrar.mjs.';
  end if;
end $$;

begin;

${cuerpo}

${registro}
${CREAR_ADMIN}
commit;

${RESUMEN}`;
}

// ---------------------------------------------------------------------
const archivos = {
  "base-completa.sql": baseCompleta(),
  "semilla-admin.sql": semillaAdmin(),
};

if (VERIFICAR) {
  // Las tres líneas del administrador son las que el usuario DEBE
  // editar para correr el archivo; si aquí se compararan tal cual, la
  // batería fallaría justo después de un uso correcto. Se comparan con
  // los valores tapados.
  const sinDatosAdmin = (texto) =>
    texto
      .replace(/\r\n/g, "\n")
      .replace(/'[^'\n]*'::text(\s+)as (email|nombre|clave)/g, "'…'::text$1as $2");

  let desfasados = 0;
  for (const [nombre, contenido] of Object.entries(archivos)) {
    const ruta = join(SALIDA, nombre);
    const enDisco = existsSync(ruta) ? sinDatosAdmin(readFileSync(ruta, "utf8")) : null;
    const ok = enDisco === sinDatosAdmin(contenido);
    console.log(`  ${ok ? "ok   " : "FALLO"} db/manual/${nombre}${ok ? "" : " no coincide con las migraciones"}`);
    if (!ok) desfasados++;
  }
  if (desfasados > 0) {
    console.error("\nRegenera con:  npm run generar:sql");
    process.exit(1);
  }
  console.log(`\nLos scripts manuales están al día con las ${migraciones.length} migraciones.`);
} else {
  mkdirSync(SALIDA, { recursive: true });
  for (const [nombre, contenido] of Object.entries(archivos)) {
    writeFileSync(join(SALIDA, nombre), contenido);
    console.log(`  generado  db/manual/${nombre}`);
  }
  console.log(`\n${migraciones.length} migraciones incluidas.`);
}
