-- =====================================================================
--  Retención: 20 días
--
--  Se borran las CONVERSACIONES y sus mensajes. El progreso del alumno
--  -- racha, temas, errores frecuentes, días practicados -- vive en
--  tablas aparte y no se toca: el alumno pierde el historial de charlas,
--  nunca su avance.
--
--  Los movimientos de crédito y las transacciones tampoco se tocan:
--  son registros financieros.
-- =====================================================================

alter table conversaciones
  alter column borrar_despues_de set default (current_date + interval '20 days');

-- Las que ya existen pasan de 15 a 20 días desde que se iniciaron
update conversaciones
   set borrar_despues_de = (iniciada_en::date + interval '20 days')
 where borrar_despues_de < (iniciada_en::date + interval '20 days');

-- ---------------------------------------------------------------------
--  Borra lo vencido. Devuelve cuántas conversaciones se eliminaron.
--  Los mensajes caen solos por la cascada de la llave foránea.
-- ---------------------------------------------------------------------
create or replace function borrar_conversaciones_vencidas()
returns integer
language plpgsql
as $$
declare
  v_borradas integer;
begin
  with eliminadas as (
    delete from conversaciones
     where borrar_despues_de <= current_date
     returning id
  )
  select count(*)::int into v_borradas from eliminadas;

  return v_borradas;
end;
$$;
