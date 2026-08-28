-- =====================================================================
--  El correo es obligatorio para todo usuario público
--
--  Puede entrar con celular o con usuario, pero el correo siempre se
--  pide: es el único canal para devolverle el acceso si olvida la
--  contraseña. Sin él, la cuenta y su saldo quedan irrecuperables.
--
--  Los alumnos de colegio siguen exentos: no tienen correo y su acceso
--  lo restablece el coordinador.
-- =====================================================================

alter table users drop constraint if exists acceso_publico_completo;

alter table users add constraint publico_requiere_correo check (
  tipo_acceso <> 'email' or email is not null
);
