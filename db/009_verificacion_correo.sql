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
