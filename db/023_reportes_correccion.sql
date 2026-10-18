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
