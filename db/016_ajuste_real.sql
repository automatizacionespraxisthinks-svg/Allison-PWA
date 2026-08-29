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
