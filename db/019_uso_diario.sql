-- ---------------------------------------------------------------------
--  Trazabilidad del uso y del consumo de IA.
--
--  El panel no puede construirse sobre la tabla mensajes: se borra a
--  los 20 dias. Un tablero que solo puede mirar tres semanas hacia
--  atras no sirve para decidir nada, y la comparacion contra el ano
--  pasado seria siempre cero.
--
--  Esta tabla guarda el ACUMULADO por dia y por usuario. Sobrevive al
--  borrado de conversaciones porque no depende de ellas, y al ser por
--  usuario permite tres cosas de una sola fuente: los totales (sumando),
--  los usuarios activos (contando filas distintas) y el detalle de
--  quien consume que.
--
--  La fecha se guarda en hora de COLOMBIA y no en UTC: "hoy" tiene que
--  significar hoy para quien mira el panel desde Duitama, no un dia que
--  empieza a las siete de la tarde.
--
--  Cascada al borrar el usuario: si alguien ejerce su derecho a que lo
--  borren, su rastro de uso se va con el.
-- ---------------------------------------------------------------------

create table if not exists uso_diario (
  fecha                date not null,
  user_id              uuid not null references users(id) on delete cascade,

  -- Actividad
  turnos               integer not null default 0,  -- intervenciones cobradas
  conversaciones       integer not null default 0,  -- hilos abiertos ese dia
  segundos_audio       integer not null default 0,

  -- Consumo de IA: la conversacion y la ayuda se separan a proposito.
  -- La ayuda (traducciones e ideas) era el unico gasto ciego que
  -- teniamos; sin separarla no se puede saber cuanto pesa de verdad.
  llamadas_conversar   integer not null default 0,
  tokens_entrada       bigint  not null default 0,
  tokens_salida        bigint  not null default 0,

  llamadas_ayuda       integer not null default 0,
  tokens_ayuda_entrada bigint  not null default 0,
  tokens_ayuda_salida  bigint  not null default 0,

  actualizado_en       timestamptz not null default now(),

  primary key (fecha, user_id)
);

create index if not exists uso_diario_fecha on uso_diario (fecha);

-- ---------------------------------------------------------------------
--  registrar_uso: suma el consumo de UN turno o UNA ayuda.
--
--  Atomica como todo lo que cuenta: dos turnos simultaneos suman dos.
--  El upsert evita tener que consultar antes de escribir, que es donde
--  se cuelan las condiciones de carrera.
-- ---------------------------------------------------------------------
create or replace function registrar_uso(
  p_user_id        uuid,
  p_origen         text,               -- 'conversar' | 'ayuda'
  p_tokens_entrada bigint default 0,
  p_tokens_salida  bigint default 0,
  p_segundos       integer default 0,
  p_turno          boolean default false,
  p_conversacion   boolean default false
) returns void
language plpgsql as $$
declare
  v_fecha date := (now() at time zone 'America/Bogota')::date;
begin
  insert into uso_diario (
    fecha, user_id, turnos, conversaciones, segundos_audio,
    llamadas_conversar, tokens_entrada, tokens_salida,
    llamadas_ayuda, tokens_ayuda_entrada, tokens_ayuda_salida
  )
  values (
    v_fecha, p_user_id,
    case when p_turno then 1 else 0 end,
    case when p_conversacion then 1 else 0 end,
    coalesce(p_segundos, 0),
    case when p_origen = 'conversar' then 1 else 0 end,
    case when p_origen = 'conversar' then coalesce(p_tokens_entrada, 0) else 0 end,
    case when p_origen = 'conversar' then coalesce(p_tokens_salida, 0)  else 0 end,
    case when p_origen = 'ayuda' then 1 else 0 end,
    case when p_origen = 'ayuda' then coalesce(p_tokens_entrada, 0) else 0 end,
    case when p_origen = 'ayuda' then coalesce(p_tokens_salida, 0)  else 0 end
  )
  on conflict (fecha, user_id) do update set
    turnos               = uso_diario.turnos + excluded.turnos,
    conversaciones       = uso_diario.conversaciones + excluded.conversaciones,
    segundos_audio       = uso_diario.segundos_audio + excluded.segundos_audio,
    llamadas_conversar   = uso_diario.llamadas_conversar + excluded.llamadas_conversar,
    tokens_entrada       = uso_diario.tokens_entrada + excluded.tokens_entrada,
    tokens_salida        = uso_diario.tokens_salida + excluded.tokens_salida,
    llamadas_ayuda       = uso_diario.llamadas_ayuda + excluded.llamadas_ayuda,
    tokens_ayuda_entrada = uso_diario.tokens_ayuda_entrada + excluded.tokens_ayuda_entrada,
    tokens_ayuda_salida  = uso_diario.tokens_ayuda_salida + excluded.tokens_ayuda_salida,
    actualizado_en       = now();
end $$;

-- ---------------------------------------------------------------------
--  Relleno con lo que todavia existe en mensajes.
--
--  Solo alcanza los ultimos 20 dias -- lo anterior ya se borro y no
--  hay de donde sacarlo. Es idempotente: si la migracion se repite,
--  no duplica, porque reconstruye la fila entera en vez de sumarle.
-- ---------------------------------------------------------------------
insert into uso_diario (
  fecha, user_id, turnos, segundos_audio,
  llamadas_conversar, tokens_entrada, tokens_salida
)
select (m.creado_en at time zone 'America/Bogota')::date as fecha,
       m.user_id,
       count(*)::int,
       coalesce(sum(m.duracion_seg), 0)::int,
       count(*)::int,
       coalesce(sum(m.tokens_entrada), 0)::bigint,
       coalesce(sum(m.tokens_salida), 0)::bigint
  from mensajes m
 where m.rol = 'alumno'
 group by 1, 2
on conflict (fecha, user_id) do update set
  turnos             = excluded.turnos,
  segundos_audio     = excluded.segundos_audio,
  llamadas_conversar = excluded.llamadas_conversar,
  tokens_entrada     = excluded.tokens_entrada,
  tokens_salida      = excluded.tokens_salida;

-- Las conversaciones abiertas, por su fecha de inicio.
insert into uso_diario (fecha, user_id, conversaciones)
select (c.iniciada_en at time zone 'America/Bogota')::date, c.user_id, count(*)::int
  from conversaciones c
 group by 1, 2
on conflict (fecha, user_id) do update set
  conversaciones = excluded.conversaciones;
