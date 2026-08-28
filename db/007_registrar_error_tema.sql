-- registrar_error ahora recibe el tema pedagógico
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
  insert into errores_frecuentes (user_id, tipo, texto_error, correccion, tema)
  values (p_user_id, p_tipo, lower(trim(p_texto_error)), p_correccion, p_tema)
  on conflict (user_id, tipo, texto_error) do update
     set veces = errores_frecuentes.veces + 1,
         correccion = excluded.correccion,
         tema = excluded.tema,
         ultima_vez_en = now();
end;
$$;
