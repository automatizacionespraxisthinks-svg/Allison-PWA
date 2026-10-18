-- =====================================================================
--  Mi ruta: el avance del alumno por las paradas de cada nivel
--
--  El CONTENIDO de las paradas vive en el código (src/lib/ruta), igual
--  que el currículo: aquí solo lo que es del alumno y muta. Cada parada
--  se identifica con una clave estable que lleva el nivel adelante
--  ("a1-p03", "a1-r1", "a1-rf"), así que el avance de cada nivel queda
--  aparte sin una columna más: si el alumno baja de nivel y vuelve,
--  sigue donde iba (plan de mejoras, sección 22).
--
--  Nada de esto se borra con las conversaciones a los 20 días:
--  estrellas, estampillas y racha no se pierden nunca.
-- =====================================================================

-- Una lección de una parada: la mejor nota y por dónde va.
create table if not exists ruta_lecciones (
  user_id        uuid not null references users(id) on delete cascade,
  parada         text not null,
  leccion        smallint not null check (leccion >= 1),
  -- Actividades terminadas en el intento en curso (0 a 3): es lo que
  -- dice "Lección 2 · Tu turno" en el mapa.
  paso           smallint not null default 0 check (paso >= 0),
  -- Las respuestas calificadas del intento en curso y cuántas salieron
  -- bien al primer intento: de ahí salen las estrellas al terminar.
  aciertos       smallint not null default 0 check (aciertos >= 0),
  calificadas    smallint not null default 0 check (calificadas >= 0),
  -- La mejor nota. Repetir la lección puede subirla, nunca bajarla.
  estrellas      smallint not null default 0 check (estrellas between 0 and 3),
  completada_en  timestamptz,
  actualizado_en timestamptz not null default now(),
  primary key (user_id, parada, leccion)
);

-- Una parada completa: su escenario y su estampilla.
create table if not exists ruta_paradas (
  user_id          uuid not null references users(id) on delete cascade,
  parada           text not null,
  -- La mejor nota del escenario de cierre.
  estrellas        smallint not null default 0 check (estrellas between 0 and 3),
  -- La estampilla: se gana pasando el escenario con 1 estrella o más.
  sello_en         timestamptz,
  -- El alumno la pasó sin hacer sus lecciones (saltó hasta una parada
  -- más adelante). Sus lecciones quedan abiertas y hacen falta para
  -- subir de nivel.
  saltada_en       timestamptz,
  -- Alumnos actuales: la unidad equivalente ya estaba completa en la
  -- versión anterior. Se ve como saltada, sin estampilla.
  anterior_en      timestamptz,
  -- El último intento de saltar hasta aquí: uno por día.
  intento_salto_en timestamptz,
  actualizado_en   timestamptz not null default now(),
  primary key (user_id, parada)
);

-- Lo que el alumno no logró ni con las pistas: vuelve al final de la
-- lección y, días después, en el repaso sorpresa.
create table if not exists ruta_fallos (
  user_id   uuid not null references users(id) on delete cascade,
  parada    text not null,
  leccion   smallint not null,
  paso      smallint not null,
  -- Qué se falló dentro de la actividad: la palabra, la frase o la
  -- pregunta, tal como está en el contenido.
  item      text not null,
  veces     integer not null default 1,
  ultimo_en timestamptz not null default now(),
  primary key (user_id, parada, leccion, paso, item)
);

-- La primera sesión guiada y los ajustes de la racha.
alter table users
  add column if not exists meta_diaria_min smallint not null default 10,
  add column if not exists recordatorio_hora time,
  add column if not exists primera_sesion_en timestamptz,
  -- Alumnos actuales: ya vio la pantalla que le cuenta la ruta nueva.
  add column if not exists ruta_presentada_en timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_meta_diaria_min_check') then
    alter table users add constraint users_meta_diaria_min_check
      check (meta_diaria_min in (5, 10, 15));
  end if;
end$$;

-- Minutos de práctica del día, para la meta de hoy y la racha: el
-- tiempo en las actividades de la ruta y en las conversaciones.
alter table progreso_diario
  add column if not exists segundos_practica integer not null default 0;

-- Las conversaciones de la ruta (escenarios y entrevistas) son intentos
-- aparte: no pueden volverse "el hilo activo" de Hablar.
alter type modo_conversacion add value if not exists 'ruta';

-- Lo que la ruta necesita saber de una conversación suya: de qué
-- parada es, qué tareas ya se cumplieron, cuántas intervenciones lleva.
alter table conversaciones add column if not exists ruta jsonb;

-- ---------------------------------------------------------------------
--  La racha
--
--  Un día cuenta si el alumno conversó o si sumó unos 3 minutos en las
--  actividades gratis de la ruta: así un alumno sin saldo no la pierde.
--  Y tiene dos días de descanso: saltarse uno o dos días no la reinicia
--  (tampoco la sube); el tercer día sin practicar sí.
-- ---------------------------------------------------------------------
create or replace function marcar_dia_de_racha(p_user_id uuid)
returns integer
language plpgsql
as $$
declare
  v_ultima date;
  v_racha  integer;
begin
  select ultima_practica_en::date, racha_dias
    into v_ultima, v_racha
    from users where id = p_user_id for update;

  if not found then
    return 0;
  end if;

  if v_ultima is null then
    v_racha := 1;
  elsif v_ultima = current_date then
    v_racha := greatest(v_racha, 1);
  elsif v_ultima >= current_date - 3 then
    v_racha := v_racha + 1;
  else
    v_racha := 1;
  end if;

  update users
     set racha_dias = v_racha, ultima_practica_en = now()
   where id = p_user_id;

  return v_racha;
end;
$$;

-- Cada turno de conversación: la misma de 011, con la racha nueva y el
-- tiempo de práctica (lo hablado más lo que tarda oír y leer la
-- respuesta: unos 20 segundos por turno).
create or replace function registrar_practica(
  p_user_id            uuid,
  p_segundos           integer,
  p_errores_corregidos integer
) returns integer
language plpgsql
as $$
declare
  v_racha integer;
begin
  v_racha := marcar_dia_de_racha(p_user_id);

  insert into progreso_diario
    (user_id, fecha, mensajes, segundos_hablados, errores_corregidos, segundos_practica)
  values
    (p_user_id, current_date, 1, p_segundos, p_errores_corregidos, p_segundos + 20)
  on conflict (user_id, fecha) do update
     set mensajes           = progreso_diario.mensajes + 1,
         segundos_hablados  = progreso_diario.segundos_hablados + excluded.segundos_hablados,
         errores_corregidos = progreso_diario.errores_corregidos + excluded.errores_corregidos,
         segundos_practica  = progreso_diario.segundos_practica + excluded.segundos_practica;

  update errores_frecuentes
     set turnos_limpios = turnos_limpios + 1
   where user_id = p_user_id;

  return v_racha;
end;
$$;

-- El tiempo en una actividad de la ruta. Cuando el día llega a 3
-- minutos, el día cuenta para la racha. Devuelve la racha y los
-- segundos del día.
create or replace function registrar_tiempo_ruta(p_user_id uuid, p_segundos integer)
returns jsonb
language plpgsql
as $$
declare
  v_total integer;
  v_racha integer;
begin
  insert into progreso_diario (user_id, fecha, segundos_practica)
  values (p_user_id, current_date, greatest(p_segundos, 0))
  on conflict (user_id, fecha) do update
     set segundos_practica = progreso_diario.segundos_practica + excluded.segundos_practica
  returning segundos_practica into v_total;

  if v_total >= 180 then
    v_racha := marcar_dia_de_racha(p_user_id);
  else
    -- La racha viva: si ya pasaron los dos días de descanso, es 0 (la
    -- pantalla de fin de lección no puede mostrar una racha vencida).
    select case when ultima_practica_en::date >= current_date - 3 then racha_dias else 0 end
      into v_racha from users where id = p_user_id;
  end if;

  return jsonb_build_object('racha', coalesce(v_racha, 0), 'segundos', v_total);
end;
$$;

-- ---------------------------------------------------------------------
--  El consumo por parte de la app (plan, secciones 16 y 21): cuántas
--  intervenciones se fueron en las lecciones de la ruta, en los
--  escenarios de cierre, en Hablar, en Viajes y en Escenarios. Se
--  guarda desde ahora para que el panel pueda mostrarlo hacia atrás.
-- ---------------------------------------------------------------------
alter table uso_diario
  add column if not exists turnos_por_parte jsonb not null default '{}'::jsonb;

create or replace function registrar_parte(p_user_id uuid, p_parte text)
returns void
language plpgsql as $$
declare
  v_fecha date := (now() at time zone 'America/Bogota')::date;
begin
  insert into uso_diario (fecha, user_id, turnos_por_parte)
  values (v_fecha, p_user_id, jsonb_build_object(p_parte, 1))
  on conflict (fecha, user_id) do update
     set turnos_por_parte = jsonb_set(
           uso_diario.turnos_por_parte, array[p_parte],
           to_jsonb(coalesce((uso_diario.turnos_por_parte->>p_parte)::int, 0) + 1)
         ),
         actualizado_en = now();
end $$;

-- ---------------------------------------------------------------------
--  El nivel: el alumno elige el inicial; después solo baja. Puede volver
--  a subir hasta el nivel más alto en el que ya estuvo, y para pasar de
--  ahí tiene que completar todas las actividades de ese nivel. Solo el
--  administrador sube y baja a voluntad (plan, sección 22).
-- ---------------------------------------------------------------------
alter table users add column if not exists nivel_maximo nivel_mcer;
update users set nivel_maximo = nivel where nivel_maximo is null;

-- Las cuentas nuevas (registro, Google, carga del colegio) nacen con su
-- tope igual a su nivel: si bajan antes de la primera sesión, pueden
-- volver a subir hasta donde estaban.
create or replace function poner_nivel_maximo() returns trigger
language plpgsql as $$
begin
  new.nivel_maximo := coalesce(new.nivel_maximo, new.nivel);
  return new;
end $$;

drop trigger if exists users_nivel_maximo on users;
create trigger users_nivel_maximo before insert on users
  for each row execute function poner_nivel_maximo();

-- ---------------------------------------------------------------------
--  Alumnos actuales (plan, sección 22): las 10 unidades de A1 de hoy
--  corresponden una a una con las 10 paradas. Cada unidad completada
--  deja su parada como hecha en la versión anterior (se ve saltada, sin
--  estampilla), y quien ya practicaba no repite la primera sesión: ve
--  una vez la pantalla que le cuenta la ruta nueva.
-- ---------------------------------------------------------------------
insert into ruta_paradas (user_id, parada, anterior_en)
select p.user_id, u.parada, p.completada_en
  from progreso_lecciones p
  join (values
    ('a1-saludos', 'a1-p01'), ('a1-familia', 'a1-p02'), ('a1-preguntas', 'a1-p03'),
    ('a1-numeros', 'a1-p04'), ('a1-rutina', 'a1-p05'), ('a1-habilidades', 'a1-p06'),
    ('a1-comida', 'a1-p07'), ('a1-casa', 'a1-p08'), ('a1-ahora', 'a1-p09'),
    ('a1-ciudad', 'a1-p10')
  ) as u(unidad, parada) on u.unidad = p.leccion
 where p.completada_en is not null
on conflict (user_id, parada) do nothing;

-- El Repaso 1 no tiene unidad propia: queda hecho en la versión anterior
-- si el alumno ya tenía completas las unidades 1 a 5 (así sigue en la
-- primera parada cuya unidad no completó, como pide el plan).
insert into ruta_paradas (user_id, parada, anterior_en)
select p.user_id, 'a1-r1', max(p.completada_en)
  from progreso_lecciones p
 where p.leccion in ('a1-saludos', 'a1-familia', 'a1-preguntas', 'a1-numeros', 'a1-rutina')
   and p.completada_en is not null
 group by p.user_id
having count(*) = 5
on conflict (user_id, parada) do nothing;

update users u
   set primera_sesion_en = coalesce(u.primera_sesion_en, now())
 where exists (select 1 from progreso_diario d where d.user_id = u.id)
    or exists (select 1 from conversaciones c where c.user_id = u.id);

-- El recordatorio por correo de la racha: uno por día como mucho.
alter table users add column if not exists recordatorio_enviado_en date;
