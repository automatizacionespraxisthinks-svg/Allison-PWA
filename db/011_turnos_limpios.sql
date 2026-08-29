-- =====================================================================
--  Turnos limpios como CONTADOR, no como conteo de mensajes
--
--  Antes se calculaba contando filas de `mensajes` posteriores al último
--  error. Al borrar las conversaciones viejas ese conteo se desploma, y
--  un alumno que SÍ mejoró vería su progreso retroceder sin entender
--  por qué -- justo lo contrario de lo que el panel quiere transmitir.
--
--  Un contador es un número pequeño que sobrevive al borrado.
-- =====================================================================

alter table errores_frecuentes
  add column if not exists turnos_limpios integer not null default 0;

-- Se rellena con el valor actual mientras los mensajes todavía existen
update errores_frecuentes e
   set turnos_limpios = (
     select count(*) from mensajes m
      where m.user_id = e.user_id
        and m.rol = 'alumno'
        and m.creado_en > e.ultima_vez_en
   );

-- ---------------------------------------------------------------------
--  Cada turno suma uno a TODOS los temas del alumno.
-- ---------------------------------------------------------------------
create or replace function registrar_practica(
  p_user_id            uuid,
  p_segundos           integer,
  p_errores_corregidos integer
) returns integer
language plpgsql
as $$
declare
  v_ultima date;
  v_racha  integer;
begin
  select ultima_practica_en::date, racha_dias
    into v_ultima, v_racha
    from users where id = p_user_id for update;

  if not found then
    return 0;
  end if;

  -- La racha crece solo al cambiar de día. Practicar veinte veces hoy
  -- sigue siendo un día; saltarse uno la reinicia.
  if v_ultima is null then
    v_racha := 1;
  elsif v_ultima = current_date then
    v_racha := greatest(v_racha, 1);
  elsif v_ultima = current_date - 1 then
    v_racha := v_racha + 1;
  else
    v_racha := 1;
  end if;

  update users
     set racha_dias = v_racha, ultima_practica_en = now()
   where id = p_user_id;

  insert into progreso_diario
    (user_id, fecha, mensajes, segundos_hablados, errores_corregidos)
  values
    (p_user_id, current_date, 1, p_segundos, p_errores_corregidos)
  on conflict (user_id, fecha) do update
     set mensajes           = progreso_diario.mensajes + 1,
         segundos_hablados  = progreso_diario.segundos_hablados + excluded.segundos_hablados,
         errores_corregidos = progreso_diario.errores_corregidos + excluded.errores_corregidos;

  -- Este turno cuenta como limpio para todos los temas. Los que hayan
  -- fallado en este mismo turno se vuelven a cero justo después, cuando
  -- la aplicación llame a registrar_error.
  update errores_frecuentes
     set turnos_limpios = turnos_limpios + 1
   where user_id = p_user_id;

  return v_racha;
end;
$$;

-- ---------------------------------------------------------------------
--  Un error vuelve a cero TODO su tema, no solo esa frase.
--
--  Si el alumno falla el pasado con un verbo distinto al de la vez
--  anterior, el tema completo se reinicia: sigue sin dominarlo.
-- ---------------------------------------------------------------------
create or replace function registrar_error(
  p_user_id     uuid,
  p_tipo        text,
  p_texto_error text,
  p_correccion  text,
  p_tema        text default 'naturalidad'
) returns void
language plpgsql
as $$
begin
  insert into errores_frecuentes
    (user_id, tipo, texto_error, correccion, tema, turnos_limpios)
  values
    (p_user_id, p_tipo, lower(trim(p_texto_error)), p_correccion, p_tema, 0)
  on conflict (user_id, tipo, texto_error) do update
     set veces = errores_frecuentes.veces + 1,
         correccion = excluded.correccion,
         tema = excluded.tema,
         ultima_vez_en = now();

  update errores_frecuentes
     set turnos_limpios = 0
   where user_id = p_user_id and tema = p_tema;
end;
$$;
