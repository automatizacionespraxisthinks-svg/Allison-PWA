-- ---------------------------------------------------------------------
--  Menos intervenciones por el mismo precio (4 de noviembre de 2026,
--  decisión del dueño): el modelo pasó a gemini-3.5-flash-lite y cada
--  intervención cuesta más (src/lib/modelo.ts, src/lib/uso.ts).
--
--  La misma regla de la 028: del precio con IVA incluido se quitan el
--  IVA (19 %), la pasarela (1.000 pesos + 3 % por pago), los costos
--  fijos (20 % del precio sin IVA) y la IA. La IA se cuenta a 9,4 pesos
--  por intervención: lo más caro que se midió con 3.5, un turno de
--  Hablar con 12 mensajes de historial y el audio al tope de 60 s (lo
--  típico de ese turno es 7,9; docs/ARQUITECTURA.md, "Costo real por
--  mensaje"). El colchón es el dólar a 4.000, por encima del real. Aun
--  si el alumno gasta todas en lo más caro, queda de ganancia mínima,
--  sobre el precio sin IVA y antes de renta e ICA:
--
--    mensual     35.000   920/mes   38,04 por intervención   43,6 %
--    6 meses    189.000   920/mes   34,24                    43,1 %
--    anual      352.800   920/mes   31,96                    41,1 %
--
--  La recarga pasa de 37 a 50 pesos por intervención (COP_POR_MENSAJE,
--  en el entorno; decisión del dueño): de 39,2 % (8.000 pesos) a 49,5 %
--  (100.000) en ese mismo peor caso, y de 42,8 % a 53,6 % con el turno
--  típico de Hablar.
--
--  Quien ya pagó un plan conserva lo que compró: cada suscripción guarda
--  ahora sus intervenciones del mes (suscripciones.mensajes_por_mes) y
--  renovar_suscripcion las lee de ahí, no del plan. Las suscripciones
--  que ya existen se quedan con las 1.280 hasta que venzan; las nuevas
--  reciben 920. Bajarle el mes siguiente a quien pagó un semestral o un
--  anual sería cambiarle lo que compró.
--
--  Lo guarda la base al insertar (un disparador), no el código: así el
--  código no depende de esta columna y da igual si se despliega antes o
--  después de correr la migración (cada push se publica solo).
-- ---------------------------------------------------------------------

alter table suscripciones add column if not exists mensajes_por_mes integer
  check (mensajes_por_mes > 0);

-- Antes de bajar el plan: las que ya existen guardan lo que compraron.
update suscripciones s
   set mensajes_por_mes = p.mensajes_por_mes
  from planes p
 where p.id = s.plan_id and s.mensajes_por_mes is null;

-- Cada suscripción nueva guarda lo que se compró por mes: lo asignado al
-- primer mes, que sale de la orden pagada (abrirSuscripcion en
-- src/lib/cobro.ts). Así una orden abierta antes de esta migración y
-- pagada después entrega todos los meses lo que se le mostró al comprar.
-- Sin eso, lo que el plan entrega hoy.
create or replace function guardar_lo_comprado()
returns trigger
language plpgsql
as $$
begin
  if new.mensajes_por_mes is null then
    new.mensajes_por_mes := new.mensajes_asignados;
  end if;
  if new.mensajes_por_mes is null or new.mensajes_por_mes <= 0 then
    select mensajes_por_mes into new.mensajes_por_mes from planes where id = new.plan_id;
  end if;
  return new;
end;
$$;

drop trigger if exists suscripcion_guarda_lo_comprado on suscripciones;
create trigger suscripcion_guarda_lo_comprado
  before insert on suscripciones
  for each row execute function guardar_lo_comprado();

update planes set mensajes_por_mes = 920 where codigo in ('mensual', 'semestral', 'anual');

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
    -- Lo que se compro, no lo que el plan entrega hoy (db/029).
    v_mensajes := s.mensajes_por_mes;
    if v_mensajes is null then
      select mensajes_por_mes into v_mensajes from planes where id = s.plan_id;
    end if;
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
