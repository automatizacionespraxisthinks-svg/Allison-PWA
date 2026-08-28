-- =====================================================================
--  Registro de práctica
--
--  Cada turno alimenta tres cosas: la racha de días, el resumen diario
--  y la lista de errores frecuentes del alumno. Todo en una función
--  para que un turno no pueda quedar contado a medias.
-- =====================================================================

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
    from users
   where id = p_user_id
     for update;

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
     set racha_dias = v_racha,
         ultima_practica_en = now()
   where id = p_user_id;

  insert into progreso_diario
    (user_id, fecha, mensajes, segundos_hablados, errores_corregidos)
  values
    (p_user_id, current_date, 1, p_segundos, p_errores_corregidos)
  on conflict (user_id, fecha) do update
     set mensajes           = progreso_diario.mensajes + 1,
         segundos_hablados  = progreso_diario.segundos_hablados + excluded.segundos_hablados,
         errores_corregidos = progreso_diario.errores_corregidos + excluded.errores_corregidos;

  return v_racha;
end;
$$;

-- ---------------------------------------------------------------------
--  Un error que se repite sube su contador en vez de duplicar la fila.
--  Así el panel puede mostrar "esto te ha pasado 7 veces".
-- ---------------------------------------------------------------------
create or replace function registrar_error(
  p_user_id     uuid,
  p_tipo        text,
  p_texto_error text,
  p_correccion  text
) returns void
language plpgsql
as $$
begin
  insert into errores_frecuentes (user_id, tipo, texto_error, correccion)
  values (p_user_id, p_tipo, lower(trim(p_texto_error)), p_correccion)
  on conflict (user_id, tipo, texto_error) do update
     set veces = errores_frecuentes.veces + 1,
         correccion = excluded.correccion,
         ultima_vez_en = now();
end;
$$;
