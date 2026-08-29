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
