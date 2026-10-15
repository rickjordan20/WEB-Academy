alter table public.class_schedule add column if not exists mission_id text;
create unique index if not exists class_schedule_unique_mission on public.class_schedule(class_id,uc,mission_id) where mission_id is not null;
comment on column public.class_schedule.mission_id is 'Optional stable mission ID from data/missions.js; lesson number remains independent.';
create or replace function public.class_schedule_touch_updated_at() returns trigger language plpgsql set search_path=public as $$begin new.updated_at=now();return new;end$$;
drop trigger if exists class_schedule_updated_at on public.class_schedule;
create trigger class_schedule_updated_at before update on public.class_schedule for each row execute function public.class_schedule_touch_updated_at();
-- Vincula apenas os 28 pares equivalentes já existentes, sem alterar datas ou progresso.
update public.class_schedule s set mission_id=(((s.lesson_number+1)/2)::text || case when s.lesson_number % 2 = 1 then 'A' else 'B' end)
where s.uc='UC7' and s.lesson_number between 1 and 28 and s.mission_id is null
and not exists(select 1 from public.class_schedule x where x.class_id=s.class_id and x.uc=s.uc and x.mission_id=(((s.lesson_number+1)/2)::text || case when s.lesson_number % 2 = 1 then 'A' else 'B' end));