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
