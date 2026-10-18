-- =====================================================================
--  Etapa 7: Viajes, Escenarios, repasos sorpresa y frase del día
--
--  Igual que la ruta: el contenido vive en el código (src/lib/ruta/
--  viajes.ts y src/lib/escenarios/), aquí solo lo que es del alumno. Las
--  conversaciones de cada viaje o escenario son intentos aparte (modo
--  'ruta', como los escenarios de cierre), así que no ensucian Hablar.
-- =====================================================================

-- Los viajes (pantallas 3 y 8): la mejor nota y la estampilla del país.
create table if not exists viajes_avance (
  user_id        uuid not null references users(id) on delete cascade,
  viaje          smallint not null check (viaje between 1 and 50),
  estrellas      smallint not null default 0 check (estrellas between 0 and 3),
  sello_en       timestamptz,
  veces          integer not null default 0,
  actualizado_en timestamptz not null default now(),
  primary key (user_id, viaje)
);

-- Los escenarios de la sección Escenarios (pantalla 5): del catálogo
-- ("cat:libreria") o propios ("propio:<uuid>"). Se pueden repetir para
-- subir estrellas.
create table if not exists escenarios_avance (
  user_id        uuid not null references users(id) on delete cascade,
  escenario      text not null,
  estrellas      smallint not null default 0 check (estrellas between 0 and 3),
  veces          integer not null default 0,
  ultimo_en      timestamptz not null default now(),
  primary key (user_id, escenario)
);

-- "Crea tu propio escenario": Allison arma la escena a su nivel, con su
-- papel y 3 tareas, y queda en la categoría "Míos" para repetirla.
create table if not exists escenarios_propios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  -- Lo que pidió el alumno, tal cual.
  pedido      text not null,
  titulo      text not null,
  lugar       text not null,
  papel       text not null,
  contexto    text not null,
  tareas      jsonb not null,
  apertura    text not null,
  nivel       nivel_mcer not null,
  creado_en   timestamptz not null default now()
);
create index if not exists escenarios_propios_user on escenarios_propios (user_id, creado_en desc);

-- Repaso sorpresa (pantalla 9): días después de una parada, un repaso
-- corto con lo que el alumno falló. Máximo dos por día.
create table if not exists repasos_sorpresa (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  fecha         date not null default current_date,
  -- Las preguntas, en orden: { parada, leccion, paso, item }.
  items         jsonb not null,
  estrellas     smallint not null default 0 check (estrellas between 0 and 3),
  completado_en timestamptz,
  creado_en     timestamptz not null default now()
);
create index if not exists repasos_sorpresa_user on repasos_sorpresa (user_id, fecha);

-- Lo que ya se repasó bien sale de la lista de pendientes.
alter table ruta_fallos add column if not exists repasado_en timestamptz;

-- ---------------------------------------------------------------------
--  La ruta provisional (plan, sección 22): en los niveles sin lecciones
--  escritas, cada parada es el tema que ya existe en la app y al
--  completarlo se gana la estampilla de la ciudad. La estampilla se
--  GUARDA en ruta_paradas (la misma clave que tendrá la parada cuando se
--  escriban sus lecciones), para que nunca se pierda. Aquí se ponen al
--  día los temas que ya estaban completos.
-- ---------------------------------------------------------------------
insert into ruta_paradas (user_id, parada, estrellas, sello_en)
select p.user_id, u.parada, 3, p.completada_en
  from progreso_lecciones p
  join (values
    ('a2-ocupacion', 'a2-p01'), ('a2-finde', 'a2-p02'), ('a2-historia', 'a2-p03'), ('a2-experiencias', 'a2-p04'),
    ('a2-planes', 'a2-p05'), ('a2-viajes', 'a2-p06'), ('a2-invitaciones', 'a2-p07'), ('a2-salud', 'a2-p08'),
    ('a2-compras', 'a2-p09'), ('a2-comparar', 'a2-p10'), ('b1-experiencia', 'b1-p01'), ('b1-ninez', 'b1-p02'),
    ('b1-secuencia', 'b1-p03'), ('b1-opinar', 'b1-p04'), ('b1-entrevista', 'b1-p05'), ('b1-tecnologia', 'b1-p06'),
    ('b1-cultura', 'b1-p07'), ('b1-ambiente', 'b1-p08'), ('b1-problemas', 'b1-p09'), ('b1-irreal', 'b1-p10'),
    ('b2-debate', 'b2-p01'), ('b2-noticias', 'b2-p02'), ('b2-negociar', 'b2-p03'), ('b2-educacion', 'b2-p04'),
    ('b2-choque', 'b2-p05'), ('b2-presentacion', 'b2-p06'), ('b2-hipotesis', 'b2-p07'), ('b2-servicios', 'b2-p08'),
    ('b2-matices', 'b2-p09'), ('b2-humor', 'b2-p10'), ('c1-argumento', 'c1-p01'), ('c1-academico', 'c1-p02'),
    ('c1-registro', 'c1-p03'), ('c1-idiomatismos', 'c1-p04'), ('c1-matizar', 'c1-p05'), ('c1-enfasis', 'c1-p06'),
    ('c1-pudo-ser', 'c1-p07'), ('c1-historias', 'c1-p08'), ('c1-abstracto', 'c1-p09'), ('c1-alta-presion', 'c1-p10'),
    ('c2-precision', 'c2-p01'), ('c2-persuasion', 'c2-p02'), ('c2-subtexto', 'c2-p03'), ('c2-variedades', 'c2-p04'),
    ('c2-mediar', 'c2-p05'), ('c2-profesion', 'c2-p06'), ('c2-debate-nativo', 'c2-p07'), ('c2-oralidad', 'c2-p08'),
    ('c2-referencias', 'c2-p09'), ('c2-libre-total', 'c2-p10')
  ) as u(unidad, parada) on u.unidad = p.leccion
 where p.completada_en is not null
on conflict (user_id, parada) do nothing;
