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
