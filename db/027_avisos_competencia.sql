-- =====================================================================
--  Etapa 9: el recordatorio de la racha en el celular y la competencia
--  por salón (documento "Competencia por salón y recordatorios en el
--  celular", aprobado el 17 de octubre de 2026)
--
--  - suscripciones_push: cada celular o navegador que aceptó los avisos
--    (notificaciones de la app instalada desde el navegador, Web Push).
--    Una fila por aparato. Si el servicio de avisos responde que ya no
--    existe (404 o 410), se borra.
--  - ajustes.recordatorio_celular: el interruptor del panel, como el del
--    correo.
--  - instituciones.competencia_activa: el coordinador puede apagar la
--    competencia semanal de su colegio.
--
--  La competencia no guarda nada propio: sale de los minutos de práctica
--  que ya están en progreso_diario.segundos_practica y del curso de cada
--  alumno (users.curso).
-- =====================================================================

create table if not exists suscripciones_push (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  -- La dirección del servicio de avisos del navegador: identifica al aparato.
  endpoint   text not null unique,
  -- Las llaves con que se cifra cada aviso (las da el navegador).
  p256dh     text not null,
  auth       text not null,
  creado_en  timestamptz not null default now(),
  usado_en   timestamptz
);

create index if not exists suscripciones_push_usuario on suscripciones_push (user_id);

insert into ajustes (clave, valor) values ('recordatorio_celular', 'true')
on conflict (clave) do nothing;

alter table instituciones add column if not exists competencia_activa boolean not null default true;
