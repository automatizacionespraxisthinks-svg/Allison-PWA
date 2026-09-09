-- =====================================================================
--  Allison — crear el ADMINISTRADOR en una base que YA tiene el esquema
--
--  Si la base está vacía, este no es tu archivo: usa base-completa.sql,
--  que crea el esquema Y el administrador de una vez.
--
--  ⚠  ANTES DE CORRERLO: cambia las tres líneas del administrador. Y NO
--     guardes este archivo con una contraseña real en ningún sitio
--     compartido: ponla, ejecútalo, y vuelve a dejar el marcador.
--
--  Puedes correrlo dos veces: no duplica nada ni pisa una contraseña
--  ya cambiada.
--
--  ARCHIVO GENERADO por scripts/generar-sql-manual.mjs a partir de las
--  migraciones de db/. No lo edites a mano (salvo las tres líneas del
--  administrador): regenera con  npm run generar:sql
-- =====================================================================

-- ---------------------------------------------------------------------
--  Los datos del administrador — CÁMBIALOS
-- ---------------------------------------------------------------------
drop table if exists _admin;
create temporary table _admin as
select
    'praxisthinks@gmail.com'::text  as email,
    'Praxis Admin'::text            as nombre,
    'CAMBIA-ESTA-CLAVE'::text       as clave;

-- Los avisos van ANTES de abrir la transacción a propósito: si saltaran
-- con una transacción abierta, la sesión quedaría en estado abortado y
-- todo lo que escribieras después fallaría con un error que no explica
-- nada. Así, un rechazo aquí no toca la base.
do $$
declare v_clave text;
begin
  select clave into v_clave from _admin;
  if v_clave = 'CAMBIA-ESTA-CLAVE' then
    raise exception
      'Cambia la contraseña del administrador antes de correr este script.';
  end if;
  if length(v_clave) < 12 then
    raise exception
      'La contraseña del administrador es demasiado corta (mínimo 12 caracteres).';
  end if;
end $$;

create extension if not exists pgcrypto;

begin;

-- ---------------------------------------------------------------------
--  El administrador
--
--  Los consentimientos van marcados porque esta cuenta la crea el
--  dueño de la plataforma para sí mismo, no un alumno que aceptó algo
--  sin leerlo. El correo se da por verificado por lo mismo.
--
--  pgcrypto genera un hash bcrypt idéntico al que produce la aplicación,
--  así que el administrador entra por la pantalla normal. Comprobado
--  contra la librería que usa la app al verificar la clave.
-- ---------------------------------------------------------------------
insert into users (
  tipo_acceso, email, password_hash, nombre, nivel, rol,
  email_verificado_en, acepto_terminos_en, version_legal,
  autoriza_transferencia, autoriza_voz, declara_edad_o_acudiente
)
select
  'email', a.email, crypt(a.clave, gen_salt('bf', 12)), a.nombre, 'C1', 'admin',
  now(), now(), '2026-08-29',
  true, true, true
from _admin a
on conflict (email) do update
   -- Si el correo ya existía, solo se ASCIENDE a administrador. La
   -- contraseña NO se toca: correr esto otra vez no debe devolverle a
   -- nadie una clave vieja.
   set rol = 'admin',
       actualizado_en = now();

-- La app da por hecho que TODO usuario tiene fila en saldos — hay una
-- comprobación de integridad que lo vigila. Queda en cero a propósito:
-- el administrador no necesita intervenciones para administrar, y
-- regalárselas ensuciaría el libro de movimientos, que debe cuadrar
-- peso a peso.
insert into saldos (user_id, mensajes_plan, mensajes_recarga)
select u.id, 0, 0
  from users u join _admin a on a.email = u.email
on conflict (user_id) do nothing;

commit;

drop table if exists _admin;

-- ---------------------------------------------------------------------
--  Qué quedó
-- ---------------------------------------------------------------------
select u.nombre,
       u.email,
       u.rol,
       u.nivel,
       (u.email_verificado_en is not null) as correo_verificado,
       (s.user_id is not null)             as tiene_saldo
  from users u
  left join saldos s on s.user_id = u.id
 where u.rol = 'admin';

select codigo, precio_cop, mensajes_por_mes, duracion_meses
  from planes
 order by orden;
