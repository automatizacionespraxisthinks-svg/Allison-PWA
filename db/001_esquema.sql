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
