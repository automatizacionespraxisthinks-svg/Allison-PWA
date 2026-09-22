-- =====================================================================
--  El texto de la voz, aparte del texto de la pantalla
--
--  Allison puede mezclar español en su respuesta para que su voz lo
--  diga en español: la API de voz cambia de idioma con marcadores
--  ([es] … [en-US]) dentro del texto. Esos marcadores son para el
--  audio y no deben verse en el chat, así que el mensaje guarda dos
--  versiones: `texto`, limpio, es lo que se muestra; `texto_voz`, con
--  marcadores, es lo que se manda a sintetizar cuando el alumno vuelve
--  a oír el mensaje. Null = no hubo mezcla y la voz usa `texto`.
-- =====================================================================

alter table mensajes
  add column if not exists texto_voz text;

comment on column mensajes.texto_voz is
  'Solo mensajes de Allison con español: el texto con marcadores [es]/[en-US] para la voz. Null = usar texto.';
