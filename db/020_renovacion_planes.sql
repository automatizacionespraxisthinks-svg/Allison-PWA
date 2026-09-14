-- ---------------------------------------------------------------------
--  Renovacion mensual de los planes.
--
--  Un plan se compraba, entregaba los mensajes del PRIMER mes y ahi se
--  quedaba: nadie avanzaba el periodo. Quien pagaba el anual recibia
--  700 intervenciones una vez, no 700 cada mes; y los mensajes del plan
--  nunca vencian. Las dos cosas contradicen lo que la app promete: la
--  pantalla de planes dice "700 cada mes" y los terminos (seccion 5)
--  dicen que los mensajes del plan "se gastan dentro del mes y no se
--  acumulan para el siguiente".
--
--  renovar_suscripcion(usuario) pone al dia la suscripcion de UNA
--  persona cuyo mes ya termino:
--    1. vence lo que sobro de los mensajes del plan (movimiento
--       'expiracion'): no se acumulan;
--    2. si al plan le quedan meses, abre el mes vigente y asigna sus
--       mensajes (movimiento 'plan_asignacion'); si no, lo marca
--       vencido.
--
--  Los meses se cuentan desde el INICIO del plan y no sumando un mes al
--  periodo anterior: sumando, un plan comprado un 31 pasaria al 28 en
--  febrero y se quedaria en 28 para siempre.
--
--  Si pasaron varios meses sin que nadie la pusiera al dia (la persona
--  no entro a la app y la tarea no corrio), se abre SOLO el mes vigente:
--  los mensajes de los meses que ya terminaron habrian vencido igual.
--
--  La llaman la limpieza de cada hora, para todas las suscripciones
--  vencidas, y la carga del alumno, para la suya, antes de leer el
--  saldo: asi nadie espera a la proxima hora para ver su mes nuevo.
--
--  Bloquea PRIMERO el saldo y despues la suscripcion, en el mismo orden
--  que la acreditacion de un pago; con el orden inverso, renovar y
--  comprar un plan al mismo tiempo podian bloquearse mutuamente.
--
--  Devuelve true si cambio algo. Es idempotente: una segunda llamada
--  sobre el mismo mes no encuentra nada que hacer.
-- ---------------------------------------------------------------------

create or replace function renovar_suscripcion(p_user_id uuid)
returns boolean
language plpgsql
as $$
declare
  s          record;
  v_plan     integer;
  v_recarga  integer;
  v_mensajes integer;
  v_meses    integer := 0;
  v_inicio   timestamptz;
  v_fin      timestamptz;
begin
  -- Sin nada vencido no se bloquea nada: es la llamada de cada carga.
  if not exists (
    select 1 from suscripciones
     where user_id = p_user_id and estado = 'activa' and periodo_fin <= now()
  ) then
    return false;
  end if;

  insert into saldos (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  select mensajes_plan, mensajes_recarga
    into v_plan, v_recarga
    from saldos where user_id = p_user_id
     for update;

  -- Se vuelve a leer con la fila bloqueada: si otra llamada la puso al
  -- dia mientras esta esperaba, ya no hay nada que hacer.
  select * into s
    from suscripciones
   where user_id = p_user_id and estado = 'activa' and periodo_fin <= now()
     for update;

  if not found then
    return false;
  end if;

  -- 1. Lo que sobro del mes que termino no pasa al siguiente.
  if v_plan > 0 then
    insert into movimientos_credito
      (user_id, tipo, bolsa, cantidad,
       saldo_plan_despues, saldo_recarga_despues, nota)
    values
      (p_user_id, 'expiracion', 'plan', -v_plan, 0, v_recarga,
       'Fin del mes del plan: sus mensajes no se acumulan');
    v_plan := 0;
  end if;

  -- 2. El mes vigente: el primero cuyo fin, contado desde el inicio del
  --    plan, todavia no llego.
  loop
    v_meses := v_meses + 1;
    exit when s.inicio_en + make_interval(months => v_meses) > now();
  end loop;

  v_inicio := s.inicio_en + make_interval(months => v_meses - 1);
  v_fin    := s.inicio_en + make_interval(months => v_meses);

  if v_inicio >= s.fin_en then
    update suscripciones set estado = 'vencida' where id = s.id;
  else
    select mensajes_por_mes into v_mensajes from planes where id = s.plan_id;
    v_plan := v_plan + v_mensajes;

    update suscripciones
       set periodo_inicio     = v_inicio,
           periodo_fin        = least(v_fin, s.fin_en),
           mensajes_asignados = v_mensajes,
           mensajes_usados    = 0
     where id = s.id;

    insert into movimientos_credito
      (user_id, tipo, bolsa, cantidad,
       saldo_plan_despues, saldo_recarga_despues, nota)
    values
      (p_user_id, 'plan_asignacion', 'plan', v_mensajes, v_plan, v_recarga,
       'Mes ' || v_meses || ' del plan');
  end if;

  update saldos
     set mensajes_plan  = v_plan,
         actualizado_en = now()
   where user_id = p_user_id;

  return true;
end;
$$;
