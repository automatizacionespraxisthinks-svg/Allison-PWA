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
