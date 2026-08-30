-- ---------------------------------------------------------------------
--  Modo leccion: el avance del alumno por las unidades del curriculo.
--
--  El CONTENIDO de las unidades vive en el codigo, no aqui
--  (src/lib/curriculo.ts): es material pedagogico que se revisa como
--  codigo y se versiona con la app. La tabla temas de 001 queda sin
--  uso por ahora -- sincronizar 60 filas con uuids entre entornos era
--  un problema que el contenido estatico no necesita tener.
--
--  Aqui vive solo lo que SI es del alumno y SI muta: cuantas veces ha
--  usado bien la estructura de cada unidad. Sobrevive al borrado de
--  conversaciones a los 20 dias, igual que turnos_limpios: el avance
--  es suyo aunque la charla ya no exista.
-- ---------------------------------------------------------------------

create table if not exists progreso_lecciones (
  user_id        uuid not null references users(id) on delete cascade,
  leccion        text not null,
  logros         integer not null default 0 check (logros >= 0),
  completada_en  timestamptz,
  actualizado_en timestamptz not null default now(),
  primary key (user_id, leccion)
);

-- La conversacion recuerda de que leccion es (clave de la unidad, o
-- null si es libre). Es texto y no un uuid a temas: la fuente de
-- verdad esta en el codigo.
alter table conversaciones add column if not exists leccion text;

-- ---------------------------------------------------------------------
--  registrar_logro: un uso correcto de la estructura de la leccion.
--
--  Atomica como todo lo que cuenta cosas: dos turnos simultaneos
--  suman dos, no uno. La meta llega por parametro porque vive en el
--  codigo junto al contenido; "recien" avisa si ESTE logro fue el que
--  completo la unidad, que es el momento de celebrar una sola vez.
-- ---------------------------------------------------------------------
create or replace function registrar_logro(
  p_user_id uuid,
  p_leccion text,
  p_meta    integer
) returns jsonb
language plpgsql as $$
declare
  v_logros integer;
  v_completada_antes timestamptz;
begin
  insert into progreso_lecciones (user_id, leccion, logros)
  values (p_user_id, p_leccion, 1)
  on conflict (user_id, leccion) do update
     set logros = progreso_lecciones.logros + 1,
         actualizado_en = now()
  returning logros, completada_en into v_logros, v_completada_antes;

  if v_completada_antes is null and v_logros >= p_meta then
    update progreso_lecciones set completada_en = now()
     where user_id = p_user_id and leccion = p_leccion;
    return jsonb_build_object('logros', v_logros, 'completada', true, 'recien', true);
  end if;

  return jsonb_build_object(
    'logros', v_logros,
    'completada', v_completada_antes is not null,
    'recien', false
  );
end $$;
