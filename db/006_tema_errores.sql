-- =====================================================================
--  Tema pedagógico de cada error
--
--  Agrupar por tema convierte una lista de frases sueltas en un
--  diagnóstico que el alumno entiende: "el pasado de los verbos, 6 veces".
-- =====================================================================

alter table errores_frecuentes add column if not exists tema text;

create index if not exists errores_frecuentes_tema
  on errores_frecuentes (user_id, tema);
