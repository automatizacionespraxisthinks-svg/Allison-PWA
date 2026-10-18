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
