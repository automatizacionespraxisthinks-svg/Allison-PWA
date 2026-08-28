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
