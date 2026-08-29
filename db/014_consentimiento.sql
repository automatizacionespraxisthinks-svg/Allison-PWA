-- =====================================================================
--  Constancia del consentimiento
--
--  La Ley 1581 exige que la autorización sea previa, expresa e
--  informada, y que el responsable pueda PROBAR que la obtuvo. Un
--  formulario con una casilla no sirve de nada si no queda registro de
--  quién aceptó qué y cuándo.
--
--  Se guarda también la VERSIÓN aceptada: si los documentos cambian, se
--  sabe cuál aceptó cada usuario. Sin eso, una actualización borra el
--  rastro de lo que la gente realmente autorizó.
-- =====================================================================

alter table users
  add column if not exists acepto_terminos_en   timestamptz,
  add column if not exists version_legal        text,
  -- El artículo 26 exige autorización expresa para sacar los datos del
  -- país, y el 5 para tratar datos sensibles como la voz.
  add column if not exists autoriza_transferencia boolean not null default false,
  add column if not exists autoriza_voz           boolean not null default false,
  -- Declaración de mayoría de edad o de autorización del acudiente
  add column if not exists declara_edad_o_acudiente boolean not null default false;

-- El colegio declara haber recogido la autorización de los acudientes
alter table instituciones
  add column if not exists declara_consentimiento_en timestamptz,
  add column if not exists declarado_por             text;

-- Los usuarios que ya existen son de desarrollo: se marcan como
-- pendientes de aceptar para que el sistema los trate igual que a
-- cualquiera cuando entre en producción.
comment on column users.acepto_terminos_en is
  'Null = todavía no ha aceptado los documentos legales';
