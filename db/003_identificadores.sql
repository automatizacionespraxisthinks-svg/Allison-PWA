-- =====================================================================
--  Tres formas de identificarse: correo, celular o usuario
--
--  En Colombia mucha gente no usa el correo, pero todos tienen celular.
--  Exigir correo pierde usuarios sin ninguna razón técnica.
-- =====================================================================

alter table users add column if not exists telefono citext;

-- El celular es único en todo el sistema
create unique index if not exists users_telefono_unico
  on users (telefono) where telefono is not null;

-- El username de un usuario público es único globalmente.
-- (El de un alumno de colegio ya es único dentro de su institución,
--  mediante la restricción username_unico_por_institucion.)
create unique index if not exists users_username_publico_unico
  on users (lower(username)) where institucion_id is null and username is not null;

-- Un usuario público necesita AL MENOS uno de los tres identificadores
alter table users drop constraint if exists acceso_email_completo;

alter table users add constraint acceso_publico_completo check (
  tipo_acceso <> 'email'
  or (email is not null or telefono is not null or username is not null)
);
