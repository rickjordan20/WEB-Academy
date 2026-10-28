-- Permite vincular missões remotas aos indicadores sem associá-las artificialmente a um projeto.
-- R2: revisão assíncrona individual de HTML, vinculada ao I2.
alter table public.mission_curriculum_links
 alter column project_id drop not null;
alter table public.mission_curriculum_links
 drop constraint if exists mission_curriculum_links_mission_id_check;
alter table public.mission_curriculum_links
 add constraint mission_curriculum_links_mission_id_check
 check (mission_id ~ '^([0-9]{1,2}[AB]|R[1-7])$');

insert into public.mission_curriculum_links
 (class_id,mission_id,project_id,requirement_codes,indicator_codes,implementation_note)
values
 ('04cd677e-e8a3-428a-b376-1b83c306ce9c','R2',null,'{}',array['I2'],
  'Revisão assíncrona individual de HTML; indicador I2. Evidências avaliativas nas respostas e laboratórios; sem vínculo a projeto guiado ou de guilda.')
on conflict (class_id,mission_id) do update
 set indicator_codes=excluded.indicator_codes,
     implementation_note=excluded.implementation_note;
