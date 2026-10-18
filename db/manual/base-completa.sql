-- =====================================================================
--  Allison — BASE COMPLETA para una base de datos VACÍA
--
--  Un solo archivo que deja la base lista para producción:
--    1. todo el esquema (27 migraciones, en orden)
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
--  ARCHIVO GENERADO por scripts/generar-sql-manual.mjs a partir de las
--  migraciones de db/. No lo edites a mano (salvo las tres líneas del
--  administrador): regenera con  npm run generar:sql
-- =====================================================================

-- ---------------------------------------------------------------------
--  Los datos del administrador — CÁMBIALOS
-- ---------------------------------------------------------------------
drop table if exists _admin;
create temporary table _admin as
select
    'praxisthinks@gmail.com'::text  as email,
    'Praxis Admin'::text            as nombre,
    'CAMBIA-ESTA-CLAVE'::text       as clave;

-- Los avisos van ANTES de abrir la transacción a propósito: si saltaran
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

-- =====================================================================
--  001_esquema.sql
-- =====================================================================

-- =====================================================================
--  Allison — Esquema de base de datos
--  PostgreSQL 15+
-- =====================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- texto sin distinguir mayúsculas

-- ---------------------------------------------------------------------
--  Tipos
-- ---------------------------------------------------------------------
create type tipo_acceso        as enum ('email', 'institucional');
create type rol_usuario        as enum ('estudiante', 'coordinador', 'admin');
create type nivel_mcer         as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
create type estado_institucion as enum ('activa', 'suspendida');
create type tipo_codigo        as enum ('descuento_porcentaje', 'descuento_fijo',
                                        'mensajes_bono', 'institucional');
create type tipo_plan          as enum ('mensual', 'semestral', 'anual');
create type estado_suscripcion as enum ('activa', 'vencida', 'cancelada');
create type estado_transaccion as enum ('pendiente', 'aprobada', 'rechazada', 'reversada');
create type tipo_movimiento    as enum ('recarga', 'plan_asignacion', 'consumo',
                                        'bono', 'ajuste_admin', 'reverso', 'expiracion');
create type bolsa_credito      as enum ('plan', 'recarga');
create type rol_mensaje        as enum ('alumno', 'allison');
create type modo_conversacion  as enum ('libre', 'leccion');

-- ---------------------------------------------------------------------
--  Instituciones (colegios)
-- ---------------------------------------------------------------------
create table instituciones (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  nit                  text,
  codigo_acceso        citext not null unique,   -- el que teclea el alumno al entrar
  contacto_nombre      text,
  contacto_email       citext,
  contacto_telefono    text,
  tarifa_por_alumno_cop integer,
  cupo_alumnos         integer,
  estado               estado_institucion not null default 'activa',
  creado_en            timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Usuarios
--  Dos formas de entrar: por email/Google, o por código de colegio + PIN.
-- ---------------------------------------------------------------------
create table users (
  id                  uuid primary key default gen_random_uuid(),
  tipo_acceso         tipo_acceso not null,

  -- acceso por email / Google
  email               citext unique,
  password_hash       text,
  google_id           text unique,
  email_verificado_en timestamptz,

  -- acceso institucional
  institucion_id      uuid references instituciones(id) on delete restrict,
  username            text,
  pin_hash            text,

  nombre              text not null,
  nivel               nivel_mcer not null default 'A1',
  rol                 rol_usuario not null default 'estudiante',

  ultima_practica_en  timestamptz,
  racha_dias          integer not null default 0,
  activo              boolean not null default true,

  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),

  -- el username es único DENTRO del colegio, no en todo el sistema
  constraint username_unico_por_institucion unique (institucion_id, username),

  -- cada tipo de acceso exige sus propios campos
  constraint acceso_email_completo check (
    tipo_acceso <> 'email' or email is not null
  ),
  constraint acceso_institucional_completo check (
    tipo_acceso <> 'institucional' or
    (institucion_id is not null and username is not null and pin_hash is not null)
  )
);

create index on users (institucion_id) where institucion_id is not null;
create index on users (ultima_practica_en);

-- ---------------------------------------------------------------------
--  Planes (catálogo editable desde el panel de administración)
-- ---------------------------------------------------------------------
create table planes (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique,
  nombre           text not null,
  tipo             tipo_plan not null,
  precio_cop       integer not null check (precio_cop > 0),
  mensajes_por_mes integer not null check (mensajes_por_mes > 0),
  duracion_meses   integer not null check (duracion_meses > 0),
  activo           boolean not null default true,
  orden            integer not null default 0
);

-- ---------------------------------------------------------------------
--  Códigos: cupones de descuento y códigos institucionales
-- ---------------------------------------------------------------------
create table codigos (
  id                  uuid primary key default gen_random_uuid(),
  codigo              citext not null unique,
  tipo                tipo_codigo not null,
  valor               numeric(12,2) not null,
  institucion_id      uuid references instituciones(id) on delete cascade,
  usos_maximos        integer,                 -- null = ilimitado
  usos_actuales       integer not null default 0,
  un_uso_por_usuario  boolean not null default true,
  vence_en            timestamptz,
  activo              boolean not null default true,
  creado_por          uuid references users(id),
  creado_en           timestamptz not null default now(),

  constraint usos_no_exceden_maximo check (
    usos_maximos is null or usos_actuales <= usos_maximos
  )
);

-- ---------------------------------------------------------------------
--  Transacciones (pagos)
--
--  La restricción UNIQUE sobre (pasarela, referencia_externa) es lo que
--  impide acreditar dos veces cuando la pasarela reenvía el webhook.
--  Es el punto donde más se rompen estos sistemas. No quitarla.
-- ---------------------------------------------------------------------
create table transacciones (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete restrict,
  tipo                text not null check (tipo in ('recarga', 'plan')),
  plan_id             uuid references planes(id),
  monto_cop           integer not null check (monto_cop > 0),
  mensajes_otorgados  integer not null default 0,
  codigo_id           uuid references codigos(id),
  pasarela            text not null,
  referencia_externa  text not null,
  estado              estado_transaccion not null default 'pendiente',
  payload             jsonb,
  creado_en           timestamptz not null default now(),
  confirmado_en       timestamptz,

  constraint referencia_unica_por_pasarela unique (pasarela, referencia_externa)
);

create index on transacciones (user_id, creado_en desc);
create index on transacciones (estado) where estado = 'pendiente';

-- ---------------------------------------------------------------------
--  Uso de códigos (auditoría)
-- ---------------------------------------------------------------------
create table codigo_usos (
  id             bigserial primary key,
  codigo_id      uuid not null references codigos(id) on delete cascade,
  user_id        uuid not null references users(id) on delete cascade,
  transaccion_id uuid references transacciones(id),
  creado_en      timestamptz not null default now(),

  constraint un_uso_por_usuario unique (codigo_id, user_id)
);

-- ---------------------------------------------------------------------
--  Suscripciones
-- ---------------------------------------------------------------------
create table suscripciones (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  plan_id            uuid not null references planes(id),
  estado             estado_suscripcion not null default 'activa',
  inicio_en          timestamptz not null default now(),
  fin_en             timestamptz not null,
  periodo_inicio     timestamptz not null,
  periodo_fin        timestamptz not null,
  mensajes_asignados integer not null,
  mensajes_usados    integer not null default 0,
  creado_en          timestamptz not null default now()
);

create unique index una_suscripcion_activa_por_usuario
  on suscripciones (user_id) where estado = 'activa';

-- ---------------------------------------------------------------------
--  SALDOS — caché de lectura rápida.
--  La verdad está en movimientos_credito; esto se puede reconstruir.
-- ---------------------------------------------------------------------
create table saldos (
  user_id          uuid primary key references users(id) on delete cascade,
  mensajes_plan    integer not null default 0 check (mensajes_plan >= 0),
  mensajes_recarga integer not null default 0 check (mensajes_recarga >= 0),
  actualizado_en   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  MOVIMIENTOS DE CRÉDITO — libro contable INMUTABLE.
--
--  Nunca se edita ni se borra una fila de esta tabla. Si hay que revertir
--  algo, se inserta un movimiento de tipo 'reverso'. Es lo que permite
--  responder con certeza el día que un alumno diga "pagué y no me llegó".
-- ---------------------------------------------------------------------
create table movimientos_credito (
  id                   bigserial primary key,
  user_id              uuid not null references users(id) on delete restrict,
  tipo                 tipo_movimiento not null,
  bolsa                bolsa_credito,
  cantidad             integer not null,      -- positivo suma, negativo resta
  saldo_plan_despues   integer not null,
  saldo_recarga_despues integer not null,
  transaccion_id       uuid references transacciones(id),
  mensaje_id           uuid,
  nota                 text,
  creado_en            timestamptz not null default now()
);

create index on movimientos_credito (user_id, creado_en desc);

-- ---------------------------------------------------------------------
--  Currículo
-- ---------------------------------------------------------------------
create table temas (
  id                uuid primary key default gen_random_uuid(),
  nivel             nivel_mcer not null,
  orden             integer not null,
  titulo            text not null,
  objetivo          text not null,
  gramatica         text,
  vocabulario_clave jsonb not null default '[]'::jsonb,
  apertura          text,          -- con qué frase abre Allison la lección
  activo            boolean not null default true,

  constraint orden_unico_por_nivel unique (nivel, orden)
);

-- ---------------------------------------------------------------------
--  Conversaciones y mensajes
--  Se borran a los 15 días mediante el trabajo programado en n8n.
-- ---------------------------------------------------------------------
create table conversaciones (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  titulo              text,
  tema_id             uuid references temas(id),
  modo                modo_conversacion not null default 'libre',
  nivel_al_iniciar    nivel_mcer not null,
  iniciada_en         timestamptz not null default now(),
  ultima_actividad_en timestamptz not null default now(),
  borrar_despues_de   date not null default (current_date + interval '15 days')
);

create index on conversaciones (user_id, ultima_actividad_en desc);
create index on conversaciones (borrar_despues_de);

create table mensajes (
  id              uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references conversaciones(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  rol             rol_mensaje not null,
  texto           text,               -- literal, SIN normalizar los errores del alumno
  audio_url       text,
  duracion_seg    numeric(6,2),
  correcciones    jsonb not null default '[]'::jsonb,
  tokens_entrada  integer,
  tokens_salida   integer,
  creado_en       timestamptz not null default now()
);

create index on mensajes (conversacion_id, creado_en);

-- ---------------------------------------------------------------------
--  Progreso del alumno
-- ---------------------------------------------------------------------
create table errores_frecuentes (
  id             bigserial primary key,
  user_id        uuid not null references users(id) on delete cascade,
  tipo           text not null,      -- pronunciacion | gramatica | vocabulario | naturalidad
  texto_error    text not null,
  correccion     text not null,
  veces          integer not null default 1,
  ultima_vez_en  timestamptz not null default now(),

  constraint error_unico_por_usuario unique (user_id, tipo, texto_error)
);

create table progreso_diario (
  user_id           uuid not null references users(id) on delete cascade,
  fecha             date not null,
  mensajes          integer not null default 0,
  segundos_hablados integer not null default 0,
  errores_corregidos integer not null default 0,
  palabras_nuevas   integer not null default 0,

  primary key (user_id, fecha)
);

-- =====================================================================
--  FUNCIÓN: consumir_mensaje
--
--  Descuenta un mensaje de forma atómica. Gasta primero la bolsa del
--  plan (que caduca) y solo después la de recarga (que no caduca).
--
--  El FOR UPDATE bloquea la fila del saldo: si el mismo alumno abre dos
--  pestañas y habla en las dos, no puede gastar el mismo mensaje dos
--  veces. Sin esto, el saldo se vuelve negativo bajo concurrencia.
--
--  Devuelve true si alcanzó el saldo, false si no hay mensajes.
-- =====================================================================
create or replace function consumir_mensaje(p_user_id uuid, p_mensaje_id uuid)
returns boolean
language plpgsql
as $$
declare
  v_plan    integer;
  v_recarga integer;
  v_bolsa   bolsa_credito;
begin
  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos
   where user_id = p_user_id
     for update;

  if not found then
    return false;
  end if;

  if v_plan > 0 then
    v_plan  := v_plan - 1;
    v_bolsa := 'plan';
  elsif v_recarga > 0 then
    v_recarga := v_recarga - 1;
    v_bolsa   := 'recarga';
  else
    return false;                       -- sin mensajes disponibles
  end if;

  update saldos
     set mensajes_plan    = v_plan,
         mensajes_recarga = v_recarga,
         actualizado_en   = now()
   where user_id = p_user_id;

  insert into movimientos_credito
    (user_id, tipo, bolsa, cantidad,
     saldo_plan_despues, saldo_recarga_despues, mensaje_id)
  values
    (p_user_id, 'consumo', v_bolsa, -1, v_plan, v_recarga, p_mensaje_id);

  return true;
end;
$$;

-- =====================================================================
--  Datos iniciales
-- =====================================================================
insert into planes (codigo, nombre, tipo, precio_cop, mensajes_por_mes, duracion_meses, orden) values
  ('mensual',    'Plan mensual',   'mensual',    35000,  500,  1, 1),
  ('semestral',  'Plan 6 meses',   'semestral', 180000,  500,  6, 2),
  ('anual',      'Plan anual',     'anual',     320000,  500, 12, 3);


-- =====================================================================
--  002_devolver_mensaje.sql
-- =====================================================================

-- =====================================================================
--  devolver_mensaje
--
--  Si cobramos el mensaje y después Gemini falla, hay que devolverlo.
--  No se "deshace" el consumo: se registra un movimiento de reverso.
--  El libro contable nunca se edita, solo crece.
-- =====================================================================
create or replace function devolver_mensaje(p_user_id uuid, p_bolsa bolsa_credito)
returns void
language plpgsql
as $$
declare
  v_plan    integer;
  v_recarga integer;
begin
  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos
   where user_id = p_user_id
     for update;

  if not found then
    return;
  end if;

  if p_bolsa = 'plan' then
    v_plan := v_plan + 1;
  else
    v_recarga := v_recarga + 1;
  end if;

  update saldos
     set mensajes_plan    = v_plan,
         mensajes_recarga = v_recarga,
         actualizado_en   = now()
   where user_id = p_user_id;

  insert into movimientos_credito
    (user_id, tipo, bolsa, cantidad,
     saldo_plan_despues, saldo_recarga_despues, nota)
  values
    (p_user_id, 'reverso', p_bolsa, 1, v_plan, v_recarga,
     'Devolución automática: la respuesta de Allison falló');
end;
$$;


-- =====================================================================
--  003_identificadores.sql
-- =====================================================================

-- =====================================================================
--  Tres formas de identificarse: correo, celular o usuario
--
--  En Colombia mucha gente no usa el correo, pero todos tienen celular.
--  Exigir correo pierde usuarios sin ninguna razón técnica.
-- =====================================================================

alter table users add column if not exists telefono citext;

-- El celular es único en todo el sistema
create unique index if not exists users_telefono_unico
  on users (telefono) where telefono is not null;

-- El username de un usuario público es único globalmente.
-- (El de un alumno de colegio ya es único dentro de su institución,
--  mediante la restricción username_unico_por_institucion.)
create unique index if not exists users_username_publico_unico
  on users (lower(username)) where institucion_id is null and username is not null;

-- Un usuario público necesita AL MENOS uno de los tres identificadores
alter table users drop constraint if exists acceso_email_completo;

alter table users add constraint acceso_publico_completo check (
  tipo_acceso <> 'email'
  or (email is not null or telefono is not null or username is not null)
);


-- =====================================================================
--  004_correo_obligatorio.sql
-- =====================================================================

-- =====================================================================
--  El correo es obligatorio para todo usuario público
--
--  Puede entrar con celular o con usuario, pero el correo siempre se
--  pide: es el único canal para devolverle el acceso si olvida la
--  contraseña. Sin él, la cuenta y su saldo quedan irrecuperables.
--
--  Los alumnos de colegio siguen exentos: no tienen correo y su acceso
--  lo restablece el coordinador.
-- =====================================================================

alter table users drop constraint if exists acceso_publico_completo;

alter table users add constraint publico_requiere_correo check (
  tipo_acceso <> 'email' or email is not null
);


-- =====================================================================
--  005_progreso.sql
-- =====================================================================

-- =====================================================================
--  Registro de práctica
--
--  Cada turno alimenta tres cosas: la racha de días, el resumen diario
--  y la lista de errores frecuentes del alumno. Todo en una función
--  para que un turno no pueda quedar contado a medias.
-- =====================================================================

create or replace function registrar_practica(
  p_user_id            uuid,
  p_segundos           integer,
  p_errores_corregidos integer
) returns integer
language plpgsql
as $$
declare
  v_ultima date;
  v_racha  integer;
begin
  select ultima_practica_en::date, racha_dias
    into v_ultima, v_racha
    from users
   where id = p_user_id
     for update;

  if not found then
    return 0;
  end if;

  -- La racha crece solo al cambiar de día. Practicar veinte veces hoy
  -- sigue siendo un día; saltarse uno la reinicia.
  if v_ultima is null then
    v_racha := 1;
  elsif v_ultima = current_date then
    v_racha := greatest(v_racha, 1);
  elsif v_ultima = current_date - 1 then
    v_racha := v_racha + 1;
  else
    v_racha := 1;
  end if;

  update users
     set racha_dias = v_racha,
         ultima_practica_en = now()
   where id = p_user_id;

  insert into progreso_diario
    (user_id, fecha, mensajes, segundos_hablados, errores_corregidos)
  values
    (p_user_id, current_date, 1, p_segundos, p_errores_corregidos)
  on conflict (user_id, fecha) do update
     set mensajes           = progreso_diario.mensajes + 1,
         segundos_hablados  = progreso_diario.segundos_hablados + excluded.segundos_hablados,
         errores_corregidos = progreso_diario.errores_corregidos + excluded.errores_corregidos;

  return v_racha;
end;
$$;

-- ---------------------------------------------------------------------
--  Un error que se repite sube su contador en vez de duplicar la fila.
--  Así el panel puede mostrar "esto te ha pasado 7 veces".
-- ---------------------------------------------------------------------
create or replace function registrar_error(
  p_user_id     uuid,
  p_tipo        text,
  p_texto_error text,
  p_correccion  text
) returns void
language plpgsql
as $$
begin
  insert into errores_frecuentes (user_id, tipo, texto_error, correccion)
  values (p_user_id, p_tipo, lower(trim(p_texto_error)), p_correccion)
  on conflict (user_id, tipo, texto_error) do update
     set veces = errores_frecuentes.veces + 1,
         correccion = excluded.correccion,
         ultima_vez_en = now();
end;
$$;


-- =====================================================================
--  006_tema_errores.sql
-- =====================================================================

-- =====================================================================
--  Tema pedagógico de cada error
--
--  Agrupar por tema convierte una lista de frases sueltas en un
--  diagnóstico que el alumno entiende: "el pasado de los verbos, 6 veces".
-- =====================================================================

alter table errores_frecuentes add column if not exists tema text;

create index if not exists errores_frecuentes_tema
  on errores_frecuentes (user_id, tema);


-- =====================================================================
--  007_registrar_error_tema.sql
-- =====================================================================

-- registrar_error ahora recibe el tema pedagógico
create or replace function registrar_error(
  p_user_id     uuid,
  p_tipo        text,
  p_texto_error text,
  p_correccion  text,
  p_tema        text default 'naturalidad'
) returns void
language plpgsql
as $$
begin
  insert into errores_frecuentes (user_id, tipo, texto_error, correccion, tema)
  values (p_user_id, p_tipo, lower(trim(p_texto_error)), p_correccion, p_tema)
  on conflict (user_id, tipo, texto_error) do update
     set veces = errores_frecuentes.veces + 1,
         correccion = excluded.correccion,
         tema = excluded.tema,
         ultima_vez_en = now();
end;
$$;


-- =====================================================================
--  008_acreditar.sql
-- =====================================================================

-- =====================================================================
--  Acreditación de un pago
--
--  Es la función más delicada del sistema: entrega los mensajes que
--  alguien pagó. Dos reglas que no se negocian:
--
--   1. IDEMPOTENTE. Si la pasarela reenvía el aviso de pago -- y lo
--      hace, cuando no recibe confirmación rápida -- la segunda llamada
--      no acredita nada. Devuelve false y ya.
--   2. ATÓMICA. O se marca la transacción y se suman los mensajes y se
--      asienta el movimiento, o no pasa nada de eso.
-- =====================================================================

create or replace function acreditar_transaccion(p_transaccion_id uuid)
returns boolean
language plpgsql
as $$
declare
  t         record;
  v_plan    integer;
  v_recarga integer;
  v_bolsa   bolsa_credito;
  v_tipo    tipo_movimiento;
begin
  select * into t from transacciones where id = p_transaccion_id for update;

  if not found then
    return false;
  end if;

  -- Ya estaba acreditada: el aviso llegó repetido.
  if t.estado = 'aprobada' then
    return false;
  end if;

  update transacciones
     set estado = 'aprobada', confirmado_en = now()
   where id = t.id;

  insert into saldos (user_id) values (t.user_id)
  on conflict (user_id) do nothing;

  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos where user_id = t.user_id for update;

  if t.tipo = 'plan' then
    v_plan  := v_plan + t.mensajes_otorgados;
    v_bolsa := 'plan';
    v_tipo  := 'plan_asignacion';
  else
    v_recarga := v_recarga + t.mensajes_otorgados;
    v_bolsa   := 'recarga';
    v_tipo    := 'recarga';
  end if;

  update saldos
     set mensajes_plan    = v_plan,
         mensajes_recarga = v_recarga,
         actualizado_en   = now()
   where user_id = t.user_id;

  insert into movimientos_credito
    (user_id, tipo, bolsa, cantidad,
     saldo_plan_despues, saldo_recarga_despues, transaccion_id)
  values
    (t.user_id, v_tipo, v_bolsa, t.mensajes_otorgados, v_plan, v_recarga, t.id);

  return true;
end;
$$;


-- =====================================================================
--  009_verificacion_correo.sql
-- =====================================================================

-- =====================================================================
--  Verificación de correo
--
--  El alumno recibe 5 mensajes al registrarse -- suficiente para probar
--  el producto de inmediato -- y los 15 restantes al confirmar su
--  correo. Sin esto, cualquiera con un script se lleva 20 mensajes por
--  cada correo inventado, y esos mensajes los paga la empresa.
--
--  El token se guarda HASHEADO: si alguien lee la base, no puede
--  verificar cuentas ajenas con lo que encuentre.
-- =====================================================================

create table if not exists verificaciones_correo (
  token_hash text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  correo     citext not null,
  expira_en  timestamptz not null,
  usado_en   timestamptz,
  creado_en  timestamptz not null default now()
);

create index if not exists verificaciones_correo_usuario
  on verificaciones_correo (user_id);

-- ---------------------------------------------------------------------
--  Canjea el token y entrega los mensajes restantes.
--  IDEMPOTENTE: abrir el enlace dos veces no regala 30 mensajes.
-- ---------------------------------------------------------------------
create or replace function verificar_correo(p_token_hash text, p_mensajes integer)
returns uuid
language plpgsql
as $$
declare
  v         record;
  v_plan    integer;
  v_recarga integer;
begin
  select * into v
    from verificaciones_correo
   where token_hash = p_token_hash
     for update;

  if not found or v.usado_en is not null or v.expira_en < now() then
    return null;
  end if;

  update verificaciones_correo set usado_en = now() where token_hash = p_token_hash;

  update users
     set email_verificado_en = now()
   where id = v.user_id and email_verificado_en is null;

  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos where user_id = v.user_id for update;

  v_recarga := coalesce(v_recarga, 0) + p_mensajes;

  update saldos
     set mensajes_recarga = v_recarga, actualizado_en = now()
   where user_id = v.user_id;

  insert into movimientos_credito
    (user_id, tipo, bolsa, cantidad,
     saldo_plan_despues, saldo_recarga_despues, nota)
  values
    (v.user_id, 'bono', 'recarga', p_mensajes,
     coalesce(v_plan, 0), v_recarga, 'Mensajes por confirmar el correo');

  return v.user_id;
end;
$$;


-- =====================================================================
--  010_recuperacion.sql
-- =====================================================================

-- =====================================================================
--  Recuperación de contraseña
--
--  Solo para usuarios públicos: los alumnos de colegio no tienen correo
--  y su acceso lo restablece el coordinador.
-- =====================================================================

create table if not exists recuperaciones_clave (
  token_hash text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  expira_en  timestamptz not null,
  usado_en   timestamptz,
  creado_en  timestamptz not null default now()
);

create index if not exists recuperaciones_clave_usuario
  on recuperaciones_clave (user_id);

-- ---------------------------------------------------------------------
--  Cambiar la contraseña debe cerrar las sesiones abiertas.
--
--  Si alguien te robó la cuenta, cambiar la clave sin esto no lo echa:
--  su sesión sigue viva hasta que caduque sola, semanas después. Toda
--  sesión emitida antes de esta marca deja de valer.
-- ---------------------------------------------------------------------
alter table users
  add column if not exists sesiones_validas_desde timestamptz not null default now();

-- ---------------------------------------------------------------------
--  Canjea el token y deja la contraseña nueva. IDEMPOTENTE: el enlace
--  sirve una sola vez.
-- ---------------------------------------------------------------------
create or replace function cambiar_clave(p_token_hash text, p_password_hash text)
returns uuid
language plpgsql
as $$
declare
  v record;
begin
  select * into v from recuperaciones_clave
   where token_hash = p_token_hash for update;

  if not found or v.usado_en is not null or v.expira_en < now() then
    return null;
  end if;

  update recuperaciones_clave set usado_en = now() where token_hash = p_token_hash;

  update users
     set password_hash = p_password_hash,
         sesiones_validas_desde = now(),
         actualizado_en = now()
   where id = v.user_id;

  -- Los demás enlaces pendientes de este usuario dejan de servir
  update recuperaciones_clave
     set usado_en = now()
   where user_id = v.user_id and usado_en is null;

  return v.user_id;
end;
$$;


-- =====================================================================
--  011_turnos_limpios.sql
-- =====================================================================

-- =====================================================================
--  Turnos limpios como CONTADOR, no como conteo de mensajes
--
--  Antes se calculaba contando filas de `mensajes` posteriores al último
--  error. Al borrar las conversaciones viejas ese conteo se desploma, y
--  un alumno que SÍ mejoró vería su progreso retroceder sin entender
--  por qué -- justo lo contrario de lo que el panel quiere transmitir.
--
--  Un contador es un número pequeño que sobrevive al borrado.
-- =====================================================================

alter table errores_frecuentes
  add column if not exists turnos_limpios integer not null default 0;

-- Se rellena con el valor actual mientras los mensajes todavía existen
update errores_frecuentes e
   set turnos_limpios = (
     select count(*) from mensajes m
      where m.user_id = e.user_id
        and m.rol = 'alumno'
        and m.creado_en > e.ultima_vez_en
   );

-- ---------------------------------------------------------------------
--  Cada turno suma uno a TODOS los temas del alumno.
-- ---------------------------------------------------------------------
create or replace function registrar_practica(
  p_user_id            uuid,
  p_segundos           integer,
  p_errores_corregidos integer
) returns integer
language plpgsql
as $$
declare
  v_ultima date;
  v_racha  integer;
begin
  select ultima_practica_en::date, racha_dias
    into v_ultima, v_racha
    from users where id = p_user_id for update;

  if not found then
    return 0;
  end if;

  -- La racha crece solo al cambiar de día. Practicar veinte veces hoy
  -- sigue siendo un día; saltarse uno la reinicia.
  if v_ultima is null then
    v_racha := 1;
  elsif v_ultima = current_date then
    v_racha := greatest(v_racha, 1);
  elsif v_ultima = current_date - 1 then
    v_racha := v_racha + 1;
  else
    v_racha := 1;
  end if;

  update users
     set racha_dias = v_racha, ultima_practica_en = now()
   where id = p_user_id;

  insert into progreso_diario
    (user_id, fecha, mensajes, segundos_hablados, errores_corregidos)
  values
    (p_user_id, current_date, 1, p_segundos, p_errores_corregidos)
  on conflict (user_id, fecha) do update
     set mensajes           = progreso_diario.mensajes + 1,
         segundos_hablados  = progreso_diario.segundos_hablados + excluded.segundos_hablados,
         errores_corregidos = progreso_diario.errores_corregidos + excluded.errores_corregidos;

  -- Este turno cuenta como limpio para todos los temas. Los que hayan
  -- fallado en este mismo turno se vuelven a cero justo después, cuando
  -- la aplicación llame a registrar_error.
  update errores_frecuentes
     set turnos_limpios = turnos_limpios + 1
   where user_id = p_user_id;

  return v_racha;
end;
$$;

-- ---------------------------------------------------------------------
--  Un error vuelve a cero TODO su tema, no solo esa frase.
--
--  Si el alumno falla el pasado con un verbo distinto al de la vez
--  anterior, el tema completo se reinicia: sigue sin dominarlo.
-- ---------------------------------------------------------------------
create or replace function registrar_error(
  p_user_id     uuid,
  p_tipo        text,
  p_texto_error text,
  p_correccion  text,
  p_tema        text default 'naturalidad'
) returns void
language plpgsql
as $$
begin
  insert into errores_frecuentes
    (user_id, tipo, texto_error, correccion, tema, turnos_limpios)
  values
    (p_user_id, p_tipo, lower(trim(p_texto_error)), p_correccion, p_tema, 0)
  on conflict (user_id, tipo, texto_error) do update
     set veces = errores_frecuentes.veces + 1,
         correccion = excluded.correccion,
         tema = excluded.tema,
         ultima_vez_en = now();

  update errores_frecuentes
     set turnos_limpios = 0
   where user_id = p_user_id and tema = p_tema;
end;
$$;


-- =====================================================================
--  012_retencion_20_dias.sql
-- =====================================================================

-- =====================================================================
--  Retención: 20 días
--
--  Se borran las CONVERSACIONES y sus mensajes. El progreso del alumno
--  -- racha, temas, errores frecuentes, días practicados -- vive en
--  tablas aparte y no se toca: el alumno pierde el historial de charlas,
--  nunca su avance.
--
--  Los movimientos de crédito y las transacciones tampoco se tocan:
--  son registros financieros.
-- =====================================================================

alter table conversaciones
  alter column borrar_despues_de set default (current_date + interval '20 days');

-- Las que ya existen pasan de 15 a 20 días desde que se iniciaron
update conversaciones
   set borrar_despues_de = (iniciada_en::date + interval '20 days')
 where borrar_despues_de < (iniciada_en::date + interval '20 days');

-- ---------------------------------------------------------------------
--  Borra lo vencido. Devuelve cuántas conversaciones se eliminaron.
--  Los mensajes caen solos por la cascada de la llave foránea.
-- ---------------------------------------------------------------------
create or replace function borrar_conversaciones_vencidas()
returns integer
language plpgsql
as $$
declare
  v_borradas integer;
begin
  with eliminadas as (
    delete from conversaciones
     where borrar_despues_de <= current_date
     returning id
  )
  select count(*)::int into v_borradas from eliminadas;

  return v_borradas;
end;
$$;


-- =====================================================================
--  013_consumir_devuelve_bolsa.sql
-- =====================================================================

-- =====================================================================
--  consumir_mensaje ahora devuelve DE QUÉ BOLSA cobró
--
--  Antes devolvía true/false y quien llamaba adivinaba la bolsa mirando
--  el saldo que había leído ANTES de cobrar. Con dos peticiones a la
--  vez esa suposición se equivoca: una se lleva el último mensaje del
--  plan y la otra, creyendo que también salió del plan, cobra de la
--  recarga. Si esa segunda falla y hay que devolver el mensaje, se
--  devuelve a la bolsa equivocada.
--
--  El alumno perdería un mensaje de recarga -- que no caduca -- y
--  recibiría uno de plan, que se le vence a fin de mes.
--
--  Solo la base sabe de qué bolsa cobró. Que lo diga ella.
-- =====================================================================

drop function if exists consumir_mensaje(uuid, uuid);

create function consumir_mensaje(p_user_id uuid, p_mensaje_id uuid)
returns bolsa_credito
language plpgsql
as $$
declare
  v_plan    integer;
  v_recarga integer;
  v_bolsa   bolsa_credito;
begin
  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos
   where user_id = p_user_id
     for update;

  if not found then
    return null;
  end if;

  if v_plan > 0 then
    v_plan  := v_plan - 1;
    v_bolsa := 'plan';
  elsif v_recarga > 0 then
    v_recarga := v_recarga - 1;
    v_bolsa   := 'recarga';
  else
    return null;                       -- sin mensajes disponibles
  end if;

  update saldos
     set mensajes_plan    = v_plan,
         mensajes_recarga = v_recarga,
         actualizado_en   = now()
   where user_id = p_user_id;

  insert into movimientos_credito
    (user_id, tipo, bolsa, cantidad,
     saldo_plan_despues, saldo_recarga_despues, mensaje_id)
  values
    (p_user_id, 'consumo', v_bolsa, -1, v_plan, v_recarga, p_mensaje_id);

  return v_bolsa;
end;
$$;


-- =====================================================================
--  014_consentimiento.sql
-- =====================================================================

-- =====================================================================
--  Constancia del consentimiento
--
--  La Ley 1581 exige que la autorización sea previa, expresa e
--  informada, y que el responsable pueda PROBAR que la obtuvo. Un
--  formulario con una casilla no sirve de nada si no queda registro de
--  quién aceptó qué y cuándo.
--
--  Se guarda también la VERSIÓN aceptada: si los documentos cambian, se
--  sabe cuál aceptó cada usuario. Sin eso, una actualización borra el
--  rastro de lo que la gente realmente autorizó.
-- =====================================================================

alter table users
  add column if not exists acepto_terminos_en   timestamptz,
  add column if not exists version_legal        text,
  -- El artículo 26 exige autorización expresa para sacar los datos del
  -- país, y el 5 para tratar datos sensibles como la voz.
  add column if not exists autoriza_transferencia boolean not null default false,
  add column if not exists autoriza_voz           boolean not null default false,
  -- Declaración de mayoría de edad o de autorización del acudiente
  add column if not exists declara_edad_o_acudiente boolean not null default false;

-- El colegio declara haber recogido la autorización de los acudientes
alter table instituciones
  add column if not exists declara_consentimiento_en timestamptz,
  add column if not exists declarado_por             text;

-- Los usuarios que ya existen son de desarrollo: se marcan como
-- pendientes de aceptar para que el sistema los trate igual que a
-- cualquiera cuando entre en producción.
comment on column users.acepto_terminos_en is
  'Null = todavía no ha aceptado los documentos legales';


-- =====================================================================
--  015_admin.sql
-- =====================================================================

-- =====================================================================
--  Soporte para el panel de administración
--
--  Los convenios con colegios se pagan EN EFECTIVO, por fuera de la
--  plataforma. Por eso no hay flujo de compra: solo hace falta registrar
--  lo que se acordó y cuándo entró la plata, para saber qué colegios
--  están al día y cuáles no.
-- =====================================================================

alter table instituciones
  add column if not exists notas             text,
  add column if not exists pagado_hasta      date,
  add column if not exists ultimo_pago_cop   integer,
  add column if not exists ultimo_pago_en    date;

-- ---------------------------------------------------------------------
--  Ajuste manual de saldo por parte de un administrador.
--
--  Pasa por una función y no por un UPDATE suelto para que sea
--  imposible mover un saldo sin dejar el movimiento en el libro. Es la
--  regla que la auditoría encontró rota en el script de siembra.
-- ---------------------------------------------------------------------
create or replace function ajustar_saldo(
  p_user_id  uuid,
  p_cantidad integer,
  p_bolsa    bolsa_credito,
  p_nota     text
) returns integer
language plpgsql
as $$
declare
  v_plan    integer;
  v_recarga integer;
begin
  insert into saldos (user_id) values (p_user_id) on conflict (user_id) do nothing;

  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos where user_id = p_user_id for update;

  if p_bolsa = 'plan' then
    v_plan := greatest(0, v_plan + p_cantidad);
  else
    v_recarga := greatest(0, v_recarga + p_cantidad);
  end if;

  update saldos
     set mensajes_plan = v_plan, mensajes_recarga = v_recarga, actualizado_en = now()
   where user_id = p_user_id;

  insert into movimientos_credito
    (user_id, tipo, bolsa, cantidad, saldo_plan_despues, saldo_recarga_despues, nota)
  values
    (p_user_id, 'ajuste_admin', p_bolsa, p_cantidad, v_plan, v_recarga, p_nota);

  return v_plan + v_recarga;
end;
$$;


-- =====================================================================
--  016_ajuste_real.sql
-- =====================================================================

-- =====================================================================
--  ajustar_saldo debe registrar lo que PASÓ, no lo que se pidió
--
--  El saldo se recorta a cero para que nunca quede negativo, pero el
--  libro anotaba la cantidad solicitada. Pedir "-99999" sobre un saldo
--  de 70 dejaba el saldo en 0 y el libro en -99999: descuadre inmediato
--  entre lo que dice la contabilidad y lo que tiene el usuario.
--
--  Un libro contable que no refleja la realidad no sirve para nada.
-- =====================================================================

create or replace function ajustar_saldo(
  p_user_id  uuid,
  p_cantidad integer,
  p_bolsa    bolsa_credito,
  p_nota     text
) returns integer
language plpgsql
as $$
declare
  v_plan     integer;
  v_recarga  integer;
  v_antes    integer;
  v_despues  integer;
  v_aplicado integer;
  v_nota     text;
begin
  insert into saldos (user_id) values (p_user_id) on conflict (user_id) do nothing;

  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos where user_id = p_user_id for update;

  if p_bolsa = 'plan' then
    v_antes   := v_plan;
    v_despues := greatest(0, v_plan + p_cantidad);
    v_plan    := v_despues;
  else
    v_antes   := v_recarga;
    v_despues := greatest(0, v_recarga + p_cantidad);
    v_recarga := v_despues;
  end if;

  v_aplicado := v_despues - v_antes;

  if v_aplicado = 0 then
    return v_plan + v_recarga;   -- no hubo nada que mover
  end if;

  update saldos
     set mensajes_plan = v_plan, mensajes_recarga = v_recarga, actualizado_en = now()
   where user_id = p_user_id;

  -- Si se pidió más de lo que había, queda dicho en la nota
  v_nota := p_nota;
  if v_aplicado <> p_cantidad then
    v_nota := p_nota || format(
      ' [se pidió %s y solo se pudo aplicar %s: el saldo no daba para más]',
      p_cantidad, v_aplicado
    );
  end if;

  insert into movimientos_credito
    (user_id, tipo, bolsa, cantidad, saldo_plan_despues, saldo_recarga_despues, nota)
  values
    (p_user_id, 'ajuste_admin', p_bolsa, v_aplicado, v_plan, v_recarga, v_nota);

  return v_plan + v_recarga;
end;
$$;


-- =====================================================================
--  017_lecciones.sql
-- =====================================================================

-- ---------------------------------------------------------------------
--  Modo leccion: el avance del alumno por las unidades del curriculo.
--
--  El CONTENIDO de las unidades vive en el codigo, no aqui
--  (src/lib/curriculo.ts): es material pedagogico que se revisa como
--  codigo y se versiona con la app. La tabla temas de 001 queda sin
--  uso por ahora -- sincronizar 60 filas con uuids entre entornos era
--  un problema que el contenido estatico no necesita tener.
--
--  Aqui vive solo lo que SI es del alumno y SI muta: cuantas veces ha
--  usado bien la estructura de cada unidad. Sobrevive al borrado de
--  conversaciones a los 20 dias, igual que turnos_limpios: el avance
--  es suyo aunque la charla ya no exista.
-- ---------------------------------------------------------------------

create table if not exists progreso_lecciones (
  user_id        uuid not null references users(id) on delete cascade,
  leccion        text not null,
  logros         integer not null default 0 check (logros >= 0),
  completada_en  timestamptz,
  actualizado_en timestamptz not null default now(),
  primary key (user_id, leccion)
);

-- La conversacion recuerda de que leccion es (clave de la unidad, o
-- null si es libre). Es texto y no un uuid a temas: la fuente de
-- verdad esta en el codigo.
alter table conversaciones add column if not exists leccion text;

-- ---------------------------------------------------------------------
--  registrar_logro: un uso correcto de la estructura de la leccion.
--
--  Atomica como todo lo que cuenta cosas: dos turnos simultaneos
--  suman dos, no uno. La meta llega por parametro porque vive en el
--  codigo junto al contenido; "recien" avisa si ESTE logro fue el que
--  completo la unidad, que es el momento de celebrar una sola vez.
-- ---------------------------------------------------------------------
create or replace function registrar_logro(
  p_user_id uuid,
  p_leccion text,
  p_meta    integer
) returns jsonb
language plpgsql as $$
declare
  v_logros integer;
  v_completada_antes timestamptz;
begin
  insert into progreso_lecciones (user_id, leccion, logros)
  values (p_user_id, p_leccion, 1)
  on conflict (user_id, leccion) do update
     set logros = progreso_lecciones.logros + 1,
         actualizado_en = now()
  returning logros, completada_en into v_logros, v_completada_antes;

  if v_completada_antes is null and v_logros >= p_meta then
    update progreso_lecciones set completada_en = now()
     where user_id = p_user_id and leccion = p_leccion;
    return jsonb_build_object('logros', v_logros, 'completada', true, 'recien', true);
  end if;

  return jsonb_build_object(
    'logros', v_logros,
    'completada', v_completada_antes is not null,
    'recien', false
  );
end $$;


-- =====================================================================
--  018_precios_planes.sql
-- =====================================================================

-- ---------------------------------------------------------------------
--  Precios definitivos de los planes.
--
--  La base del calculo es comercial, no tecnica: el plan mensual vale
--  35.000 por 700 intervenciones, o sea 50 pesos cada una, sobre un
--  costo interno de 25 -- el doble. Los planes largos entregan ese
--  mismo precio con descuento por pago adelantado:
--
--    mensual     35.000   700/mes   50,00 por intervencion
--    6 meses    189.000   700/mes   45,00   (10% de descuento)
--    anual      352.800   700/mes   42,00   (16% de descuento)
--
--  Las intervenciones siguen entregandose MES A MES y no todas de
--  golpe. Es la misma promesa para el alumno -- 700 cada mes -- y
--  evita que alguien pague un ano, consuma las 8.400 en enero y
--  dispare el costo de un solo tiron.
--
--  El descuento no se guarda: la pantalla lo calcula contra el precio
--  mensual, asi nunca puede quedar un porcentaje mintiendo sobre un
--  precio que cambio.
-- ---------------------------------------------------------------------

update planes set precio_cop =  35000, mensajes_por_mes = 700 where codigo = 'mensual';
update planes set precio_cop = 189000, mensajes_por_mes = 700 where codigo = 'semestral';
update planes set precio_cop = 352800, mensajes_por_mes = 700 where codigo = 'anual';


-- =====================================================================
--  019_uso_diario.sql
-- =====================================================================

-- ---------------------------------------------------------------------
--  Trazabilidad del uso y del consumo de IA.
--
--  El panel no puede construirse sobre la tabla mensajes: se borra a
--  los 20 dias. Un tablero que solo puede mirar tres semanas hacia
--  atras no sirve para decidir nada, y la comparacion contra el ano
--  pasado seria siempre cero.
--
--  Esta tabla guarda el ACUMULADO por dia y por usuario. Sobrevive al
--  borrado de conversaciones porque no depende de ellas, y al ser por
--  usuario permite tres cosas de una sola fuente: los totales (sumando),
--  los usuarios activos (contando filas distintas) y el detalle de
--  quien consume que.
--
--  La fecha se guarda en hora de COLOMBIA y no en UTC: "hoy" tiene que
--  significar hoy para quien mira el panel desde Duitama, no un dia que
--  empieza a las siete de la tarde.
--
--  Cascada al borrar el usuario: si alguien ejerce su derecho a que lo
--  borren, su rastro de uso se va con el.
-- ---------------------------------------------------------------------

create table if not exists uso_diario (
  fecha                date not null,
  user_id              uuid not null references users(id) on delete cascade,

  -- Actividad
  turnos               integer not null default 0,  -- intervenciones cobradas
  conversaciones       integer not null default 0,  -- hilos abiertos ese dia
  segundos_audio       integer not null default 0,

  -- Consumo de IA: la conversacion y la ayuda se separan a proposito.
  -- La ayuda (traducciones e ideas) era el unico gasto ciego que
  -- teniamos; sin separarla no se puede saber cuanto pesa de verdad.
  llamadas_conversar   integer not null default 0,
  tokens_entrada       bigint  not null default 0,
  tokens_salida        bigint  not null default 0,

  llamadas_ayuda       integer not null default 0,
  tokens_ayuda_entrada bigint  not null default 0,
  tokens_ayuda_salida  bigint  not null default 0,

  actualizado_en       timestamptz not null default now(),

  primary key (fecha, user_id)
);

create index if not exists uso_diario_fecha on uso_diario (fecha);

-- ---------------------------------------------------------------------
--  registrar_uso: suma el consumo de UN turno o UNA ayuda.
--
--  Atomica como todo lo que cuenta: dos turnos simultaneos suman dos.
--  El upsert evita tener que consultar antes de escribir, que es donde
--  se cuelan las condiciones de carrera.
-- ---------------------------------------------------------------------
create or replace function registrar_uso(
  p_user_id        uuid,
  p_origen         text,               -- 'conversar' | 'ayuda'
  p_tokens_entrada bigint default 0,
  p_tokens_salida  bigint default 0,
  p_segundos       integer default 0,
  p_turno          boolean default false,
  p_conversacion   boolean default false
) returns void
language plpgsql as $$
declare
  v_fecha date := (now() at time zone 'America/Bogota')::date;
begin
  insert into uso_diario (
    fecha, user_id, turnos, conversaciones, segundos_audio,
    llamadas_conversar, tokens_entrada, tokens_salida,
    llamadas_ayuda, tokens_ayuda_entrada, tokens_ayuda_salida
  )
  values (
    v_fecha, p_user_id,
    case when p_turno then 1 else 0 end,
    case when p_conversacion then 1 else 0 end,
    coalesce(p_segundos, 0),
    case when p_origen = 'conversar' then 1 else 0 end,
    case when p_origen = 'conversar' then coalesce(p_tokens_entrada, 0) else 0 end,
    case when p_origen = 'conversar' then coalesce(p_tokens_salida, 0)  else 0 end,
    case when p_origen = 'ayuda' then 1 else 0 end,
    case when p_origen = 'ayuda' then coalesce(p_tokens_entrada, 0) else 0 end,
    case when p_origen = 'ayuda' then coalesce(p_tokens_salida, 0)  else 0 end
  )
  on conflict (fecha, user_id) do update set
    turnos               = uso_diario.turnos + excluded.turnos,
    conversaciones       = uso_diario.conversaciones + excluded.conversaciones,
    segundos_audio       = uso_diario.segundos_audio + excluded.segundos_audio,
    llamadas_conversar   = uso_diario.llamadas_conversar + excluded.llamadas_conversar,
    tokens_entrada       = uso_diario.tokens_entrada + excluded.tokens_entrada,
    tokens_salida        = uso_diario.tokens_salida + excluded.tokens_salida,
    llamadas_ayuda       = uso_diario.llamadas_ayuda + excluded.llamadas_ayuda,
    tokens_ayuda_entrada = uso_diario.tokens_ayuda_entrada + excluded.tokens_ayuda_entrada,
    tokens_ayuda_salida  = uso_diario.tokens_ayuda_salida + excluded.tokens_ayuda_salida,
    actualizado_en       = now();
end $$;

-- ---------------------------------------------------------------------
--  Relleno con lo que todavia existe en mensajes.
--
--  Solo alcanza los ultimos 20 dias -- lo anterior ya se borro y no
--  hay de donde sacarlo. Es idempotente: si la migracion se repite,
--  no duplica, porque reconstruye la fila entera en vez de sumarle.
-- ---------------------------------------------------------------------
insert into uso_diario (
  fecha, user_id, turnos, segundos_audio,
  llamadas_conversar, tokens_entrada, tokens_salida
)
select (m.creado_en at time zone 'America/Bogota')::date as fecha,
       m.user_id,
       count(*)::int,
       coalesce(sum(m.duracion_seg), 0)::int,
       count(*)::int,
       coalesce(sum(m.tokens_entrada), 0)::bigint,
       coalesce(sum(m.tokens_salida), 0)::bigint
  from mensajes m
 where m.rol = 'alumno'
 group by 1, 2
on conflict (fecha, user_id) do update set
  turnos             = excluded.turnos,
  segundos_audio     = excluded.segundos_audio,
  llamadas_conversar = excluded.llamadas_conversar,
  tokens_entrada     = excluded.tokens_entrada,
  tokens_salida      = excluded.tokens_salida;

-- Las conversaciones abiertas, por su fecha de inicio.
insert into uso_diario (fecha, user_id, conversaciones)
select (c.iniciada_en at time zone 'America/Bogota')::date, c.user_id, count(*)::int
  from conversaciones c
 group by 1, 2
on conflict (fecha, user_id) do update set
  conversaciones = excluded.conversaciones;


-- =====================================================================
--  020_renovacion_planes.sql
-- =====================================================================

-- ---------------------------------------------------------------------
--  Renovacion mensual de los planes.
--
--  Un plan se compraba, entregaba los mensajes del PRIMER mes y ahi se
--  quedaba: nadie avanzaba el periodo. Quien pagaba el anual recibia
--  700 intervenciones una vez, no 700 cada mes; y los mensajes del plan
--  nunca vencian. Las dos cosas contradicen lo que la app promete: la
--  pantalla de planes dice "700 cada mes" y los terminos (seccion 5)
--  dicen que los mensajes del plan "se gastan dentro del mes y no se
--  acumulan para el siguiente".
--
--  renovar_suscripcion(usuario) pone al dia la suscripcion de UNA
--  persona cuyo mes ya termino:
--    1. vence lo que sobro de los mensajes del plan (movimiento
--       'expiracion'): no se acumulan;
--    2. si al plan le quedan meses, abre el mes vigente y asigna sus
--       mensajes (movimiento 'plan_asignacion'); si no, lo marca
--       vencido.
--
--  Los meses se cuentan desde el INICIO del plan y no sumando un mes al
--  periodo anterior: sumando, un plan comprado un 31 pasaria al 28 en
--  febrero y se quedaria en 28 para siempre.
--
--  Si pasaron varios meses sin que nadie la pusiera al dia (la persona
--  no entro a la app y la tarea no corrio), se abre SOLO el mes vigente:
--  los mensajes de los meses que ya terminaron habrian vencido igual.
--
--  La llaman la limpieza de cada hora, para todas las suscripciones
--  vencidas, y la carga del alumno, para la suya, antes de leer el
--  saldo: asi nadie espera a la proxima hora para ver su mes nuevo.
--
--  Bloquea PRIMERO el saldo y despues la suscripcion, en el mismo orden
--  que la acreditacion de un pago; con el orden inverso, renovar y
--  comprar un plan al mismo tiempo podian bloquearse mutuamente.
--
--  Devuelve true si cambio algo. Es idempotente: una segunda llamada
--  sobre el mismo mes no encuentra nada que hacer.
-- ---------------------------------------------------------------------

create or replace function renovar_suscripcion(p_user_id uuid)
returns boolean
language plpgsql
as $$
declare
  s          record;
  v_plan     integer;
  v_recarga  integer;
  v_mensajes integer;
  v_meses    integer := 0;
  v_inicio   timestamptz;
  v_fin      timestamptz;
begin
  -- Sin nada vencido no se bloquea nada: es la llamada de cada carga.
  if not exists (
    select 1 from suscripciones
     where user_id = p_user_id and estado = 'activa' and periodo_fin <= now()
  ) then
    return false;
  end if;

  insert into saldos (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos where user_id = p_user_id
     for update;

  -- Se vuelve a leer con la fila bloqueada: si otra llamada la puso al
  -- dia mientras esta esperaba, ya no hay nada que hacer.
  select * into s
    from suscripciones
   where user_id = p_user_id and estado = 'activa' and periodo_fin <= now()
     for update;

  if not found then
    return false;
  end if;

  -- 1. Lo que sobro del mes que termino no pasa al siguiente.
  if v_plan > 0 then
    insert into movimientos_credito
      (user_id, tipo, bolsa, cantidad,
       saldo_plan_despues, saldo_recarga_despues, nota)
    values
      (p_user_id, 'expiracion', 'plan', -v_plan, 0, v_recarga,
       'Fin del mes del plan: sus mensajes no se acumulan');
    v_plan := 0;
  end if;

  -- 2. El mes vigente: el primero cuyo fin, contado desde el inicio del
  --    plan, todavia no llego.
  loop
    v_meses := v_meses + 1;
    exit when s.inicio_en + make_interval(months => v_meses) > now();
  end loop;

  v_inicio := s.inicio_en + make_interval(months => v_meses - 1);
  v_fin    := s.inicio_en + make_interval(months => v_meses);

  if v_inicio >= s.fin_en then
    update suscripciones set estado = 'vencida' where id = s.id;
  else
    select mensajes_por_mes into v_mensajes from planes where id = s.plan_id;
    v_plan := v_plan + v_mensajes;

    update suscripciones
       set periodo_inicio     = v_inicio,
           periodo_fin        = least(v_fin, s.fin_en),
           mensajes_asignados = v_mensajes,
           mensajes_usados    = 0
     where id = s.id;

    insert into movimientos_credito
      (user_id, tipo, bolsa, cantidad,
       saldo_plan_despues, saldo_recarga_despues, nota)
    values
      (p_user_id, 'plan_asignacion', 'plan', v_mensajes, v_plan, v_recarga,
       'Mes ' || v_meses || ' del plan');
  end if;

  update saldos
     set mensajes_plan  = v_plan,
         actualizado_en = now()
   where user_id = p_user_id;

  return true;
end;
$$;


-- =====================================================================
--  021_glosario.sql
-- =====================================================================

-- =====================================================================
--  Glosario del alumno
--
--  Las palabras y frases que el alumno guarda desde una conversación
--  (selecciona un trozo de un mensaje y lo manda aquí) o escribe a mano.
--
--  NO se borra a los 20 días con las conversaciones: es de las cosas
--  que el alumno construye y espera conservar, como su progreso. Por eso
--  el contexto (la frase completa de donde salió) se COPIA aquí en vez
--  de apuntar al mensaje: el mensaje se va, el contexto se queda.
--
--  Una misma frase no se guarda dos veces (sin distinguir mayúsculas).
-- =====================================================================

create table if not exists glosario (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  texto      text not null check (length(texto) between 1 and 200),
  contexto   text check (contexto is null or length(contexto) <= 600),
  creado_en  timestamptz not null default now()
);

create unique index if not exists glosario_texto_unico
  on glosario (user_id, lower(texto));

create index if not exists glosario_usuario
  on glosario (user_id, creado_en desc);


-- =====================================================================
--  022_texto_voz.sql
-- =====================================================================

-- =====================================================================
--  El texto de la voz, aparte del texto de la pantalla
--
--  Allison puede mezclar español en su respuesta para que su voz lo
--  diga en español: la API de voz cambia de idioma con marcadores
--  ([es] … [en-US]) dentro del texto. Esos marcadores son para el
--  audio y no deben verse en el chat, así que el mensaje guarda dos
--  versiones: `texto`, limpio, es lo que se muestra; `texto_voz`, con
--  marcadores, es lo que se manda a sintetizar cuando el alumno vuelve
--  a oír el mensaje. Null = no hubo mezcla y la voz usa `texto`.
-- =====================================================================

alter table mensajes
  add column if not exists texto_voz text;

comment on column mensajes.texto_voz is
  'Solo mensajes de Allison con español: el texto con marcadores [es]/[en-US] para la voz. Null = usar texto.';


-- =====================================================================
--  023_reportes_correccion.sql
-- =====================================================================

-- =====================================================================
--  Reportes de correcciones ("esta corrección está mal")
--
--  El alumno marca una corrección de Allison que cree equivocada. El
--  administrador la revisa en el panel y decide:
--
--    · allison_se_equivoco: se le devuelve 1 intervención (bolsa de
--      recarga, que no caduca), queda en su historial como "Devolución
--      por corrección equivocada" y el alumno ve un aviso.
--    · correccion_buena: no se devuelve nada y el alumno ve la
--      explicación.
--
--  La corrección se COPIA aquí (texto del alumno, respuesta de Allison
--  y la corrección): el mensaje se borra a los 20 días y el reporte
--  tiene que seguir siendo revisable. mensaje_id queda en null cuando
--  el mensaje se borra.
--
--  Decisión del plan de mejoras, punto 16 (14 de octubre de 2026).
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'estado_reporte') then
    create type estado_reporte as enum ('abierto', 'allison_se_equivoco', 'correccion_buena');
  end if;
end$$;

create table if not exists reportes_correccion (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  mensaje_id         uuid references mensajes(id) on delete set null,
  indice             integer not null check (indice >= 0),

  -- Copia de lo reportado
  tipo               text not null,
  original           text not null,
  correccion         text not null,
  explicacion        text,
  texto_alumno       text not null,
  respuesta_allison  text,
  comentario         text check (comentario is null or length(comentario) <= 300),
  nivel              nivel_mcer,

  estado             estado_reporte not null default 'abierto',
  revisado_por       uuid references users(id) on delete set null,
  revisado_en        timestamptz,
  devolvio           boolean not null default false,
  -- El alumno ya vio el aviso de la decisión
  aviso_visto_en     timestamptz,

  creado_en          timestamptz not null default now()
);

-- Una corrección se reporta una sola vez
create unique index if not exists reportes_unico
  on reportes_correccion (mensaje_id, indice)
  where mensaje_id is not null;

create index if not exists reportes_abiertos
  on reportes_correccion (creado_en)
  where estado = 'abierto';

create index if not exists reportes_por_alumno
  on reportes_correccion (user_id, creado_en desc);

-- ---------------------------------------------------------------------
--  resolver_reporte: la decisión del administrador.
--
--  Atómica e idempotente: un reporte ya resuelto no se vuelve a
--  resolver (devuelve false), así dos clics no devuelven dos veces.
-- ---------------------------------------------------------------------
create or replace function resolver_reporte(
  p_reporte_id uuid,
  p_admin_id   uuid,
  p_decision   estado_reporte
)
returns boolean
language plpgsql
as $$
declare
  v_user    uuid;
  v_plan    integer;
  v_recarga integer;
begin
  if p_decision = 'abierto' then
    raise exception 'La decisión no puede ser abierto';
  end if;

  update reportes_correccion
     set estado = p_decision,
         revisado_por = p_admin_id,
         revisado_en = now(),
         devolvio = (p_decision = 'allison_se_equivoco')
   where id = p_reporte_id
     and estado = 'abierto'
  returning user_id into v_user;

  if not found then
    return false;
  end if;

  if p_decision = 'allison_se_equivoco' then
    insert into saldos (user_id) values (v_user)
      on conflict (user_id) do nothing;

    update saldos
       set mensajes_recarga = mensajes_recarga + 1,
           actualizado_en = now()
     where user_id = v_user
    returning mensajes_plan, mensajes_recarga into v_plan, v_recarga;

    insert into movimientos_credito
      (user_id, tipo, bolsa, cantidad,
       saldo_plan_despues, saldo_recarga_despues, nota)
    values
      (v_user, 'reverso', 'recarga', 1, v_plan, v_recarga,
       'Devolución por corrección equivocada');
  end if;

  return true;
end;
$$;


-- =====================================================================
--  024_ruta.sql
-- =====================================================================

-- =====================================================================
--  Mi ruta: el avance del alumno por las paradas de cada nivel
--
--  El CONTENIDO de las paradas vive en el código (src/lib/ruta), igual
--  que el currículo: aquí solo lo que es del alumno y muta. Cada parada
--  se identifica con una clave estable que lleva el nivel adelante
--  ("a1-p03", "a1-r1", "a1-rf"), así que el avance de cada nivel queda
--  aparte sin una columna más: si el alumno baja de nivel y vuelve,
--  sigue donde iba (plan de mejoras, sección 22).
--
--  Nada de esto se borra con las conversaciones a los 20 días:
--  estrellas, estampillas y racha no se pierden nunca.
-- =====================================================================

-- Una lección de una parada: la mejor nota y por dónde va.
create table if not exists ruta_lecciones (
  user_id        uuid not null references users(id) on delete cascade,
  parada         text not null,
  leccion        smallint not null check (leccion >= 1),
  -- Actividades terminadas en el intento en curso (0 a 3): es lo que
  -- dice "Lección 2 · Tu turno" en el mapa.
  paso           smallint not null default 0 check (paso >= 0),
  -- Las respuestas calificadas del intento en curso y cuántas salieron
  -- bien al primer intento: de ahí salen las estrellas al terminar.
  aciertos       smallint not null default 0 check (aciertos >= 0),
  calificadas    smallint not null default 0 check (calificadas >= 0),
  -- La mejor nota. Repetir la lección puede subirla, nunca bajarla.
  estrellas      smallint not null default 0 check (estrellas between 0 and 3),
  completada_en  timestamptz,
  actualizado_en timestamptz not null default now(),
  primary key (user_id, parada, leccion)
);

-- Una parada completa: su escenario y su estampilla.
create table if not exists ruta_paradas (
  user_id          uuid not null references users(id) on delete cascade,
  parada           text not null,
  -- La mejor nota del escenario de cierre.
  estrellas        smallint not null default 0 check (estrellas between 0 and 3),
  -- La estampilla: se gana pasando el escenario con 1 estrella o más.
  sello_en         timestamptz,
  -- El alumno la pasó sin hacer sus lecciones (saltó hasta una parada
  -- más adelante). Sus lecciones quedan abiertas y hacen falta para
  -- subir de nivel.
  saltada_en       timestamptz,
  -- Alumnos actuales: la unidad equivalente ya estaba completa en la
  -- versión anterior. Se ve como saltada, sin estampilla.
  anterior_en      timestamptz,
  -- El último intento de saltar hasta aquí: uno por día.
  intento_salto_en timestamptz,
  actualizado_en   timestamptz not null default now(),
  primary key (user_id, parada)
);

-- Lo que el alumno no logró ni con las pistas: vuelve al final de la
-- lección y, días después, en el repaso sorpresa.
create table if not exists ruta_fallos (
  user_id   uuid not null references users(id) on delete cascade,
  parada    text not null,
  leccion   smallint not null,
  paso      smallint not null,
  -- Qué se falló dentro de la actividad: la palabra, la frase o la
  -- pregunta, tal como está en el contenido.
  item      text not null,
  veces     integer not null default 1,
  ultimo_en timestamptz not null default now(),
  primary key (user_id, parada, leccion, paso, item)
);

-- La primera sesión guiada y los ajustes de la racha.
alter table users
  add column if not exists meta_diaria_min smallint not null default 10,
  add column if not exists recordatorio_hora time,
  add column if not exists primera_sesion_en timestamptz,
  -- Alumnos actuales: ya vio la pantalla que le cuenta la ruta nueva.
  add column if not exists ruta_presentada_en timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_meta_diaria_min_check') then
    alter table users add constraint users_meta_diaria_min_check
      check (meta_diaria_min in (5, 10, 15));
  end if;
end$$;

-- Minutos de práctica del día, para la meta de hoy y la racha: el
-- tiempo en las actividades de la ruta y en las conversaciones.
alter table progreso_diario
  add column if not exists segundos_practica integer not null default 0;

-- Las conversaciones de la ruta (escenarios y entrevistas) son intentos
-- aparte: no pueden volverse "el hilo activo" de Hablar.
alter type modo_conversacion add value if not exists 'ruta';

-- Lo que la ruta necesita saber de una conversación suya: de qué
-- parada es, qué tareas ya se cumplieron, cuántas intervenciones lleva.
alter table conversaciones add column if not exists ruta jsonb;

-- ---------------------------------------------------------------------
--  La racha
--
--  Un día cuenta si el alumno conversó o si sumó unos 3 minutos en las
--  actividades gratis de la ruta: así un alumno sin saldo no la pierde.
--  Y tiene dos días de descanso: saltarse uno o dos días no la reinicia
--  (tampoco la sube); el tercer día sin practicar sí.
-- ---------------------------------------------------------------------
create or replace function marcar_dia_de_racha(p_user_id uuid)
returns integer
language plpgsql
as $$
declare
  v_ultima date;
  v_racha  integer;
begin
  select ultima_practica_en::date, racha_dias
    into v_ultima, v_racha
    from users where id = p_user_id for update;

  if not found then
    return 0;
  end if;

  if v_ultima is null then
    v_racha := 1;
  elsif v_ultima = current_date then
    v_racha := greatest(v_racha, 1);
  elsif v_ultima >= current_date - 3 then
    v_racha := v_racha + 1;
  else
    v_racha := 1;
  end if;

  update users
     set racha_dias = v_racha, ultima_practica_en = now()
   where id = p_user_id;

  return v_racha;
end;
$$;

-- Cada turno de conversación: la misma de 011, con la racha nueva y el
-- tiempo de práctica (lo hablado más lo que tarda oír y leer la
-- respuesta: unos 20 segundos por turno).
create or replace function registrar_practica(
  p_user_id            uuid,
  p_segundos           integer,
  p_errores_corregidos integer
) returns integer
language plpgsql
as $$
declare
  v_racha integer;
begin
  v_racha := marcar_dia_de_racha(p_user_id);

  insert into progreso_diario
    (user_id, fecha, mensajes, segundos_hablados, errores_corregidos, segundos_practica)
  values
    (p_user_id, current_date, 1, p_segundos, p_errores_corregidos, p_segundos + 20)
  on conflict (user_id, fecha) do update
     set mensajes           = progreso_diario.mensajes + 1,
         segundos_hablados  = progreso_diario.segundos_hablados + excluded.segundos_hablados,
         errores_corregidos = progreso_diario.errores_corregidos + excluded.errores_corregidos,
         segundos_practica  = progreso_diario.segundos_practica + excluded.segundos_practica;

  update errores_frecuentes
     set turnos_limpios = turnos_limpios + 1
   where user_id = p_user_id;

  return v_racha;
end;
$$;

-- El tiempo en una actividad de la ruta. Cuando el día llega a 3
-- minutos, el día cuenta para la racha. Devuelve la racha y los
-- segundos del día.
create or replace function registrar_tiempo_ruta(p_user_id uuid, p_segundos integer)
returns jsonb
language plpgsql
as $$
declare
  v_total integer;
  v_racha integer;
begin
  insert into progreso_diario (user_id, fecha, segundos_practica)
  values (p_user_id, current_date, greatest(p_segundos, 0))
  on conflict (user_id, fecha) do update
     set segundos_practica = progreso_diario.segundos_practica + excluded.segundos_practica
  returning segundos_practica into v_total;

  if v_total >= 180 then
    v_racha := marcar_dia_de_racha(p_user_id);
  else
    -- La racha viva: si ya pasaron los dos días de descanso, es 0 (la
    -- pantalla de fin de lección no puede mostrar una racha vencida).
    select case when ultima_practica_en::date >= current_date - 3 then racha_dias else 0 end
      into v_racha from users where id = p_user_id;
  end if;

  return jsonb_build_object('racha', coalesce(v_racha, 0), 'segundos', v_total);
end;
$$;

-- ---------------------------------------------------------------------
--  El consumo por parte de la app (plan, secciones 16 y 21): cuántas
--  intervenciones se fueron en las lecciones de la ruta, en los
--  escenarios de cierre, en Hablar, en Viajes y en Escenarios. Se
--  guarda desde ahora para que el panel pueda mostrarlo hacia atrás.
-- ---------------------------------------------------------------------
alter table uso_diario
  add column if not exists turnos_por_parte jsonb not null default '{}'::jsonb;

create or replace function registrar_parte(p_user_id uuid, p_parte text)
returns void
language plpgsql as $$
declare
  v_fecha date := (now() at time zone 'America/Bogota')::date;
begin
  insert into uso_diario (fecha, user_id, turnos_por_parte)
  values (v_fecha, p_user_id, jsonb_build_object(p_parte, 1))
  on conflict (fecha, user_id) do update
     set turnos_por_parte = jsonb_set(
           uso_diario.turnos_por_parte, array[p_parte],
           to_jsonb(coalesce((uso_diario.turnos_por_parte->>p_parte)::int, 0) + 1)
         ),
         actualizado_en = now();
end $$;

-- ---------------------------------------------------------------------
--  El nivel: el alumno elige el inicial; después solo baja. Puede volver
--  a subir hasta el nivel más alto en el que ya estuvo, y para pasar de
--  ahí tiene que completar todas las actividades de ese nivel. Solo el
--  administrador sube y baja a voluntad (plan, sección 22).
-- ---------------------------------------------------------------------
alter table users add column if not exists nivel_maximo nivel_mcer;
update users set nivel_maximo = nivel where nivel_maximo is null;

-- Las cuentas nuevas (registro, Google, carga del colegio) nacen con su
-- tope igual a su nivel: si bajan antes de la primera sesión, pueden
-- volver a subir hasta donde estaban.
create or replace function poner_nivel_maximo() returns trigger
language plpgsql as $$
begin
  new.nivel_maximo := coalesce(new.nivel_maximo, new.nivel);
  return new;
end $$;

drop trigger if exists users_nivel_maximo on users;
create trigger users_nivel_maximo before insert on users
  for each row execute function poner_nivel_maximo();

-- ---------------------------------------------------------------------
--  Alumnos actuales (plan, sección 22): las 10 unidades de A1 de hoy
--  corresponden una a una con las 10 paradas. Cada unidad completada
--  deja su parada como hecha en la versión anterior (se ve saltada, sin
--  estampilla), y quien ya practicaba no repite la primera sesión: ve
--  una vez la pantalla que le cuenta la ruta nueva.
-- ---------------------------------------------------------------------
insert into ruta_paradas (user_id, parada, anterior_en)
select p.user_id, u.parada, p.completada_en
  from progreso_lecciones p
  join (values
    ('a1-saludos', 'a1-p01'), ('a1-familia', 'a1-p02'), ('a1-preguntas', 'a1-p03'),
    ('a1-numeros', 'a1-p04'), ('a1-rutina', 'a1-p05'), ('a1-habilidades', 'a1-p06'),
    ('a1-comida', 'a1-p07'), ('a1-casa', 'a1-p08'), ('a1-ahora', 'a1-p09'),
    ('a1-ciudad', 'a1-p10')
  ) as u(unidad, parada) on u.unidad = p.leccion
 where p.completada_en is not null
on conflict (user_id, parada) do nothing;

-- El Repaso 1 no tiene unidad propia: queda hecho en la versión anterior
-- si el alumno ya tenía completas las unidades 1 a 5 (así sigue en la
-- primera parada cuya unidad no completó, como pide el plan).
insert into ruta_paradas (user_id, parada, anterior_en)
select p.user_id, 'a1-r1', max(p.completada_en)
  from progreso_lecciones p
 where p.leccion in ('a1-saludos', 'a1-familia', 'a1-preguntas', 'a1-numeros', 'a1-rutina')
   and p.completada_en is not null
 group by p.user_id
having count(*) = 5
on conflict (user_id, parada) do nothing;

update users u
   set primera_sesion_en = coalesce(u.primera_sesion_en, now())
 where exists (select 1 from progreso_diario d where d.user_id = u.id)
    or exists (select 1 from conversaciones c where c.user_id = u.id);

-- El recordatorio por correo de la racha: uno por día como mucho.
alter table users add column if not exists recordatorio_enviado_en date;


-- =====================================================================
--  025_viajes_escenarios_repasos.sql
-- =====================================================================

-- =====================================================================
--  Etapa 7: Viajes, Escenarios, repasos sorpresa y frase del día
--
--  Igual que la ruta: el contenido vive en el código (src/lib/ruta/
--  viajes.ts y src/lib/escenarios/), aquí solo lo que es del alumno. Las
--  conversaciones de cada viaje o escenario son intentos aparte (modo
--  'ruta', como los escenarios de cierre), así que no ensucian Hablar.
-- =====================================================================

-- Los viajes (pantallas 3 y 8): la mejor nota y la estampilla del país.
create table if not exists viajes_avance (
  user_id        uuid not null references users(id) on delete cascade,
  viaje          smallint not null check (viaje between 1 and 50),
  estrellas      smallint not null default 0 check (estrellas between 0 and 3),
  sello_en       timestamptz,
  veces          integer not null default 0,
  actualizado_en timestamptz not null default now(),
  primary key (user_id, viaje)
);

-- Los escenarios de la sección Escenarios (pantalla 5): del catálogo
-- ("cat:libreria") o propios ("propio:<uuid>"). Se pueden repetir para
-- subir estrellas.
create table if not exists escenarios_avance (
  user_id        uuid not null references users(id) on delete cascade,
  escenario      text not null,
  estrellas      smallint not null default 0 check (estrellas between 0 and 3),
  veces          integer not null default 0,
  ultimo_en      timestamptz not null default now(),
  primary key (user_id, escenario)
);

-- "Crea tu propio escenario": Allison arma la escena a su nivel, con su
-- papel y 3 tareas, y queda en la categoría "Míos" para repetirla.
create table if not exists escenarios_propios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  -- Lo que pidió el alumno, tal cual.
  pedido      text not null,
  titulo      text not null,
  lugar       text not null,
  papel       text not null,
  contexto    text not null,
  tareas      jsonb not null,
  apertura    text not null,
  nivel       nivel_mcer not null,
  creado_en   timestamptz not null default now()
);
create index if not exists escenarios_propios_user on escenarios_propios (user_id, creado_en desc);

-- Repaso sorpresa (pantalla 9): días después de una parada, un repaso
-- corto con lo que el alumno falló. Máximo dos por día.
create table if not exists repasos_sorpresa (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  fecha         date not null default current_date,
  -- Las preguntas, en orden: { parada, leccion, paso, item }.
  items         jsonb not null,
  estrellas     smallint not null default 0 check (estrellas between 0 and 3),
  completado_en timestamptz,
  creado_en     timestamptz not null default now()
);
create index if not exists repasos_sorpresa_user on repasos_sorpresa (user_id, fecha);

-- Lo que ya se repasó bien sale de la lista de pendientes.
alter table ruta_fallos add column if not exists repasado_en timestamptz;

-- ---------------------------------------------------------------------
--  La ruta provisional (plan, sección 22): en los niveles sin lecciones
--  escritas, cada parada es el tema que ya existe en la app y al
--  completarlo se gana la estampilla de la ciudad. La estampilla se
--  GUARDA en ruta_paradas (la misma clave que tendrá la parada cuando se
--  escriban sus lecciones), para que nunca se pierda. Aquí se ponen al
--  día los temas que ya estaban completos.
-- ---------------------------------------------------------------------
insert into ruta_paradas (user_id, parada, estrellas, sello_en)
select p.user_id, u.parada, 3, p.completada_en
  from progreso_lecciones p
  join (values
    ('a2-ocupacion', 'a2-p01'), ('a2-finde', 'a2-p02'), ('a2-historia', 'a2-p03'), ('a2-experiencias', 'a2-p04'),
    ('a2-planes', 'a2-p05'), ('a2-viajes', 'a2-p06'), ('a2-invitaciones', 'a2-p07'), ('a2-salud', 'a2-p08'),
    ('a2-compras', 'a2-p09'), ('a2-comparar', 'a2-p10'), ('b1-experiencia', 'b1-p01'), ('b1-ninez', 'b1-p02'),
    ('b1-secuencia', 'b1-p03'), ('b1-opinar', 'b1-p04'), ('b1-entrevista', 'b1-p05'), ('b1-tecnologia', 'b1-p06'),
    ('b1-cultura', 'b1-p07'), ('b1-ambiente', 'b1-p08'), ('b1-problemas', 'b1-p09'), ('b1-irreal', 'b1-p10'),
    ('b2-debate', 'b2-p01'), ('b2-noticias', 'b2-p02'), ('b2-negociar', 'b2-p03'), ('b2-educacion', 'b2-p04'),
    ('b2-choque', 'b2-p05'), ('b2-presentacion', 'b2-p06'), ('b2-hipotesis', 'b2-p07'), ('b2-servicios', 'b2-p08'),
    ('b2-matices', 'b2-p09'), ('b2-humor', 'b2-p10'), ('c1-argumento', 'c1-p01'), ('c1-academico', 'c1-p02'),
    ('c1-registro', 'c1-p03'), ('c1-idiomatismos', 'c1-p04'), ('c1-matizar', 'c1-p05'), ('c1-enfasis', 'c1-p06'),
    ('c1-pudo-ser', 'c1-p07'), ('c1-historias', 'c1-p08'), ('c1-abstracto', 'c1-p09'), ('c1-alta-presion', 'c1-p10'),
    ('c2-precision', 'c2-p01'), ('c2-persuasion', 'c2-p02'), ('c2-subtexto', 'c2-p03'), ('c2-variedades', 'c2-p04'),
    ('c2-mediar', 'c2-p05'), ('c2-profesion', 'c2-p06'), ('c2-debate-nativo', 'c2-p07'), ('c2-oralidad', 'c2-p08'),
    ('c2-referencias', 'c2-p09'), ('c2-libre-total', 'c2-p10')
  ) as u(unidad, parada) on u.unidad = p.leccion
 where p.completada_en is not null
on conflict (user_id, parada) do nothing;


-- =====================================================================
--  026_panel.sql
-- =====================================================================

-- =====================================================================
--  Etapa 8: saldo masivo para colegios y el panel de administración
--  (plan, secciones 12, 16 y 21)
--
--  - ajustes: los valores que estaban fijos en el código (dólar, días de
--    descanso de la racha, umbrales de las alertas, recordatorio).
--  - users.curso: cada alumno con su curso, para cargar, asignar saldo
--    y filtrar.
--  - asignaciones_saldo: cada asignación a un colegio o a sus cursos.
--  - ruta_consumo: intervenciones por parada, y cuántas se fueron en
--    errores (no se oyó voz).
--  - ruta_actividades: cada actividad terminada, para el acierto al
--    primer intento y dónde se van los alumnos.
--  - escenas_intentos: cada escenario, entrevista, viaje o escenario del
--    catálogo con sus intervenciones. Sobrevive al borrado de las
--    conversaciones a los 20 días (solo guarda cifras, no lo dicho).
-- =====================================================================

-- ---------------------------------------------------------------------
--  Ajustes
-- ---------------------------------------------------------------------
create table if not exists ajustes (
  clave           text primary key,
  valor           jsonb not null,
  actualizado_en  timestamptz not null default now(),
  actualizado_por text
);

insert into ajustes (clave, valor) values
  ('dolar_cop', '4000'),
  ('dias_descanso_racha', '2'),
  ('alerta_inactivo_dias', '7'),
  ('alerta_saldo_colegio_pct', '10'),
  ('alerta_reporte_dias', '3'),
  ('alerta_parada_intervenciones', '50'),
  ('recordatorio_correo', 'true'),
  -- Desde cuándo está la versión nueva (Mi ruta) en producción: parte
  -- la retención en "antes" y "después de los cambios".
  ('fecha_version_nueva', 'null')
on conflict (clave) do nothing;

create or replace function ajuste_entero(p_clave text, p_defecto integer)
returns integer
language sql stable
as $$
  select coalesce(
    (select case when jsonb_typeof(valor) = 'number' then (valor #>> '{}')::numeric::integer end
       from ajustes where clave = p_clave),
    p_defecto
  )
$$;

-- Los días que la racha aguanta sin practicar (entre 0 y 7).
create or replace function dias_descanso()
returns integer
language sql stable
as $$ select greatest(0, least(7, ajuste_entero('dias_descanso_racha', 2))) $$;

-- La racha más larga, para la ficha del alumno.
alter table users add column if not exists racha_maxima integer not null default 0;
update users set racha_maxima = racha_dias where racha_maxima < racha_dias;

-- La racha con los días de descanso de los ajustes (antes, fijos en 2).
create or replace function marcar_dia_de_racha(p_user_id uuid)
returns integer
language plpgsql
as $$
declare
  v_ultima date;
  v_racha  integer;
begin
  select ultima_practica_en::date, racha_dias
    into v_ultima, v_racha
    from users where id = p_user_id for update;

  if not found then
    return 0;
  end if;

  if v_ultima is null then
    v_racha := 1;
  elsif v_ultima = current_date then
    v_racha := greatest(v_racha, 1);
  elsif v_ultima >= current_date - (dias_descanso() + 1) then
    v_racha := v_racha + 1;
  else
    v_racha := 1;
  end if;

  update users
     set racha_dias = v_racha, ultima_practica_en = now(),
         racha_maxima = greatest(coalesce(racha_maxima, 0), v_racha)
   where id = p_user_id;

  return v_racha;
end;
$$;

create or replace function registrar_tiempo_ruta(p_user_id uuid, p_segundos integer)
returns jsonb
language plpgsql
as $$
declare
  v_total integer;
  v_racha integer;
begin
  insert into progreso_diario (user_id, fecha, segundos_practica)
  values (p_user_id, current_date, greatest(p_segundos, 0))
  on conflict (user_id, fecha) do update
     set segundos_practica = progreso_diario.segundos_practica + excluded.segundos_practica
  returning segundos_practica into v_total;

  if v_total >= 180 then
    v_racha := marcar_dia_de_racha(p_user_id);
  else
    -- La racha viva: si ya pasaron los días de descanso, es 0.
    select case when ultima_practica_en::date >= current_date - (dias_descanso() + 1) then racha_dias else 0 end
      into v_racha from users where id = p_user_id;
  end if;

  return jsonb_build_object('racha', coalesce(v_racha, 0), 'segundos', v_total);
end;
$$;

-- ---------------------------------------------------------------------
--  El curso de cada alumno
-- ---------------------------------------------------------------------
alter table users add column if not exists curso text;
create index if not exists users_colegio_curso on users (institucion_id, curso) where institucion_id is not null;

-- ---------------------------------------------------------------------
--  Asignaciones de saldo a un colegio o a sus cursos (plan, sección 12).
--  El saldo queda en cada alumno (bolsa de recarga: no vence) y cada
--  alumno tiene su movimiento en el libro con el motivo y quién lo hizo.
-- ---------------------------------------------------------------------
create table if not exists asignaciones_saldo (
  id             uuid primary key default gen_random_uuid(),
  institucion_id uuid not null references instituciones(id) on delete restrict,
  -- null: todo el colegio
  cursos         text[],
  por_alumno     integer not null check (por_alumno > 0),
  alumnos        integer not null check (alumnos >= 0),
  motivo         text not null,
  hecha_por      text not null,
  creado_en      timestamptz not null default now()
);
create index if not exists asignaciones_saldo_colegio on asignaciones_saldo (institucion_id, creado_en desc);

-- ---------------------------------------------------------------------
--  Intervenciones por parada (ficha del alumno y alerta de "parada que
--  gasta de más"). Las que se fueron en errores son las que se cobraron
--  sin contar como intento (no se oyó voz).
-- ---------------------------------------------------------------------
create table if not exists ruta_consumo (
  user_id        uuid not null references users(id) on delete cascade,
  parada         text not null,
  intervenciones integer not null default 0,
  por_errores    integer not null default 0,
  actualizado_en timestamptz not null default now(),
  primary key (user_id, parada)
);

create or replace function registrar_consumo_parada(p_user_id uuid, p_parada text, p_error boolean)
returns void
language sql
as $$
  insert into ruta_consumo (user_id, parada, intervenciones, por_errores)
  values (p_user_id, p_parada, 1, case when p_error then 1 else 0 end)
  on conflict (user_id, parada) do update
     set intervenciones = ruta_consumo.intervenciones + 1,
         por_errores    = ruta_consumo.por_errores + excluded.por_errores,
         actualizado_en = now()
$$;

-- ---------------------------------------------------------------------
--  Cada actividad terminada (sección Ruta del panel)
-- ---------------------------------------------------------------------
create table if not exists ruta_actividades (
  id          bigserial primary key,
  user_id     uuid not null references users(id) on delete cascade,
  parada      text not null,
  leccion     smallint not null,
  paso        smallint not null,
  tipo        text not null,
  calificadas smallint not null default 0,
  aciertos    smallint not null default 0,
  creado_en   timestamptz not null default now()
);
create index if not exists ruta_actividades_parada on ruta_actividades (parada, leccion, paso);
create index if not exists ruta_actividades_user on ruta_actividades (user_id, creado_en desc);

-- ---------------------------------------------------------------------
--  Cada intento de escena: escenario de cierre, entrevista, viaje o
--  escenario del catálogo. Sin llave a conversaciones: la conversación
--  se borra a los 20 días y la cifra se queda.
-- ---------------------------------------------------------------------
create table if not exists escenas_intentos (
  conversacion_id uuid primary key,
  user_id         uuid not null references users(id) on delete cascade,
  actividad       text not null,
  -- a1-p01 (escenario), a1-p01:4 (entrevista de la lección 4),
  -- viaje:1, cat:libreria, propio
  clave           text not null,
  intervenciones  integer not null default 0,
  minimo          integer not null default 10,
  terminada       boolean not null default false,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index if not exists escenas_intentos_clave on escenas_intentos (actividad, clave, creado_en);
create index if not exists escenas_intentos_user on escenas_intentos (user_id);

-- Lo que ya había en las conversaciones de la ruta.
insert into escenas_intentos (conversacion_id, user_id, actividad, clave, intervenciones, terminada, creado_en, actualizado_en)
select c.id, c.user_id,
       coalesce(c.ruta->>'actividad', 'escenario'),
       case coalesce(c.ruta->>'actividad', 'escenario')
         when 'entrevista' then (c.ruta->>'parada') || ':' || coalesce(c.ruta->>'leccion', '0')
         when 'viaje' then 'viaje:' || coalesce(c.ruta->>'viaje', '0')
         when 'catalogo' then case when (c.ruta->>'clave') like 'propio:%' then 'propio' else coalesce(c.ruta->>'clave', '') end
         else coalesce(c.ruta->>'parada', '')
       end,
       coalesce((c.ruta->>'intervenciones')::int, 0),
       coalesce((c.ruta->>'terminada')::boolean, false),
       c.iniciada_en, c.ultima_actividad_en
  from conversaciones c
 -- ::text: en db/manual/base-completa.sql todo corre en UNA transacción, y
 -- Postgres no deja usar como enum un valor agregado en la misma (024).
 where c.modo::text = 'ruta' and c.ruta is not null
on conflict (conversacion_id) do nothing;


-- =====================================================================
--  027_avisos_competencia.sql
-- =====================================================================

-- =====================================================================
--  Etapa 9: el recordatorio de la racha en el celular y la competencia
--  por salón (documento "Competencia por salón y recordatorios en el
--  celular", aprobado el 17 de octubre de 2026)
--
--  - suscripciones_push: cada celular o navegador que aceptó los avisos
--    (notificaciones de la app instalada desde el navegador, Web Push).
--    Una fila por aparato. Si el servicio de avisos responde que ya no
--    existe (404 o 410), se borra.
--  - ajustes.recordatorio_celular: el interruptor del panel, como el del
--    correo.
--  - instituciones.competencia_activa: el coordinador puede apagar la
--    competencia semanal de su colegio.
--
--  La competencia no guarda nada propio: sale de los minutos de práctica
--  que ya están en progreso_diario.segundos_practica y del curso de cada
--  alumno (users.curso).
-- =====================================================================

create table if not exists suscripciones_push (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  -- La dirección del servicio de avisos del navegador: identifica al aparato.
  endpoint   text not null unique,
  -- Las llaves con que se cifra cada aviso (las da el navegador).
  p256dh     text not null,
  auth       text not null,
  creado_en  timestamptz not null default now(),
  usado_en   timestamptz
);

create index if not exists suscripciones_push_usuario on suscripciones_push (user_id);

insert into ajustes (clave, valor) values ('recordatorio_celular', 'true')
on conflict (clave) do nothing;

alter table instituciones add column if not exists competencia_activa boolean not null default true;


-- =====================================================================
--  Registro de migraciones
--
--  Exactamente la tabla que lleva scripts/migrar.mjs. Con esto, la
--  próxima vez que alguien corra las migraciones contra esta base, verá
--  las 27 como "ya aplicada" y solo aplicará las nuevas.
-- =====================================================================

create table if not exists migraciones (
  archivo     text primary key,
  aplicada_en timestamptz not null default now()
);

insert into migraciones (archivo) values
  ('001_esquema.sql'),
  ('002_devolver_mensaje.sql'),
  ('003_identificadores.sql'),
  ('004_correo_obligatorio.sql'),
  ('005_progreso.sql'),
  ('006_tema_errores.sql'),
  ('007_registrar_error_tema.sql'),
  ('008_acreditar.sql'),
  ('009_verificacion_correo.sql'),
  ('010_recuperacion.sql'),
  ('011_turnos_limpios.sql'),
  ('012_retencion_20_dias.sql'),
  ('013_consumir_devuelve_bolsa.sql'),
  ('014_consentimiento.sql'),
  ('015_admin.sql'),
  ('016_ajuste_real.sql'),
  ('017_lecciones.sql'),
  ('018_precios_planes.sql'),
  ('019_uso_diario.sql'),
  ('020_renovacion_planes.sql'),
  ('021_glosario.sql'),
  ('022_texto_voz.sql'),
  ('023_reportes_correccion.sql'),
  ('024_ruta.sql'),
  ('025_viajes_escenarios_repasos.sql'),
  ('026_panel.sql'),
  ('027_avisos_competencia.sql')
on conflict (archivo) do nothing;

-- ---------------------------------------------------------------------
--  El administrador
--
--  Los consentimientos van marcados porque esta cuenta la crea el
--  dueño de la plataforma para sí mismo, no un alumno que aceptó algo
--  sin leerlo. El correo se da por verificado por lo mismo.
--
--  pgcrypto genera un hash bcrypt idéntico al que produce la aplicación,
--  así que el administrador entra por la pantalla normal. Comprobado
--  contra la librería que usa la app al verificar la clave.
-- ---------------------------------------------------------------------
insert into users (
  tipo_acceso, email, password_hash, nombre, nivel, rol,
  email_verificado_en, acepto_terminos_en, version_legal,
  autoriza_transferencia, autoriza_voz, declara_edad_o_acudiente
)
select
  'email', a.email, crypt(a.clave, gen_salt('bf', 12)), a.nombre, 'C1', 'admin',
  now(), now(), '2026-09-22',
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

commit;

drop table if exists _admin;

-- ---------------------------------------------------------------------
--  Qué quedó
-- ---------------------------------------------------------------------
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
