-- =====================================================================
--  Allison — semilla de una base de PRODUCCIÓN recién creada
--
--  NO es una migración: no vive en la secuencia numerada y `npm run
--  migrar` no lo ejecuta nunca. Se corre A MANO, una sola vez, después
--  de que las migraciones hayan creado el esquema.
--
--  ⚠  ANTES DE CORRERLO: cambia las tres líneas de abajo. Y NO guardes
--     este archivo con una contraseña real en ningún sitio compartido:
--     ponla, ejecútalo, y vuelve a dejar el marcador.
--
--  Es IDEMPOTENTE: puedes correrlo dos veces sin duplicar nada ni
--  pisar una contraseña ya cambiada.
--
--  Alternativa sin SQL, desde dentro del contenedor:
--     node scripts/crear-admin.mjs correo@tuyo.com "Tu Nombre" LaClave
-- =====================================================================

-- ---------------------------------------------------------------------
--  1. Los datos del administrador — CÁMBIALOS
-- ---------------------------------------------------------------------
drop table if exists _admin;
create temporary table _admin as
select
    'praxisthinks@gmail.com'::text  as email,
    'Praxis Admin'::text            as nombre,
    'CAMBIA-ESTA-CLAVE'::text       as clave;

-- Los avisos van ANTES de abrir la transacción a propósito: si saltara
-- con una transacción abierta, la sesión quedaría en estado abortado y
-- todo lo que escribieras después fallaría con un error que no explica
-- nada. Así, un rechazo aquí no deja nada a medias.
do $$
declare v_clave text;
begin
  select clave into v_clave from _admin;
  if v_clave = 'CAMBIA-ESTA-CLAVE' then
    raise exception
      'Cambia la contraseña del administrador antes de correr esta semilla.';
  end if;
  if length(v_clave) < 12 then
    raise exception
      'La contraseña del administrador es demasiado corta (mínimo 12 caracteres).';
  end if;
end $$;

-- pgcrypto genera un hash bcrypt idéntico al que produce la aplicación,
-- así que el administrador puede entrar por la pantalla normal.
-- Comprobado contra la librería que usa la app al verificar la clave.
create extension if not exists pgcrypto;

begin;

-- ---------------------------------------------------------------------
--  2. El administrador
--
--  Los consentimientos van marcados porque esta cuenta la crea el
--  dueño de la plataforma para sí mismo, no un alumno que aceptó algo
--  sin leerlo. El correo se da por verificado por lo mismo.
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
   -- contraseña NO se toca: correr la semilla otra vez no debe
   -- devolverle a nadie una clave vieja.
   set rol = 'admin',
       actualizado_en = now();

-- ---------------------------------------------------------------------
--  3. Su bolsa de saldo
--
--  La app da por hecho que TODO usuario tiene fila en saldos — hay una
--  comprobación de integridad que lo vigila. Un administrador sin ella
--  rompería el panel al entrar.
--
--  Queda en cero a propósito: el administrador no necesita
--  intervenciones para administrar, y regalárselas ensuciaría el libro
--  de movimientos, que debe cuadrar peso a peso.
-- ---------------------------------------------------------------------
insert into saldos (user_id, mensajes_plan, mensajes_recarga)
select u.id, 0, 0
  from users u join _admin a on a.email = u.email
on conflict (user_id) do nothing;

commit;

drop table if exists _admin;

-- ---------------------------------------------------------------------
--  4. Qué quedó
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

-- Los planes los siembran las migraciones (001 y 018). Se muestran
-- para confirmar que la base quedó completa, no solo con el admin.
select codigo, precio_cop, mensajes_por_mes, duracion_meses
  from planes
 order by orden;
