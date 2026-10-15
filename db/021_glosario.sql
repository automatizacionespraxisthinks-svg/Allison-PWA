-- =====================================================================
--  Glosario del alumno
--
--  Las palabras y frases que el alumno guarda desde una conversación
--  (selecciona un trozo de un mensaje y lo manda aquí) o escribe a mano.
--
--  NO se borra a los 20 días con las conversaciones: es de las cosas
--  que el alumno construye y espera conservar, como su progreso. Por eso
--  el contexto (la frase completa de donde salió) se COPIA aquí en vez
--  de apuntar al mensaje: el mensaje se va, el contexto se queda.
--
--  Una misma frase no se guarda dos veces (sin distinguir mayúsculas).
-- =====================================================================

create table if not exists glosario (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  texto      text not null check (length(texto) between 1 and 200),
  contexto   text check (contexto is null or length(contexto) <= 600),
  creado_en  timestamptz not null default now()
);

create unique index if not exists glosario_texto_unico
  on glosario (user_id, lower(texto));

create index if not exists glosario_usuario
  on glosario (user_id, creado_en desc);
