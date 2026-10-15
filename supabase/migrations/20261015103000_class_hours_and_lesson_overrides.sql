alter table public.classes add column if not exists lesson_start_time time without time zone;
alter table public.classes add column if not exists lesson_end_time time without time zone;
alter table public.classes add column if not exists lesson_timezone text not null default 'America/Sao_Paulo';
alter table public.class_schedule add column if not exists start_time_override time without time zone;
alter table public.class_schedule add column if not exists end_time_override time without time zone;
alter table public.classes drop constraint if exists classes_lesson_time_order;
alter table public.classes add constraint classes_lesson_time_order check ((lesson_start_time is null and lesson_end_time is null) or (lesson_start_time is not null and lesson_end_time is not null and lesson_start_time<lesson_end_time));
alter table public.class_schedule drop constraint if exists class_schedule_time_override_order;
alter table public.class_schedule add constraint class_schedule_time_override_order check ((start_time_override is null and end_time_override is null) or (start_time_override is not null and end_time_override is not null and start_time_override<end_time_override));
update public.classes set lesson_start_time='14:00',lesson_end_time='17:45' where code='2026.36.8' and lesson_start_time is null and lesson_end_time is null;
create or replace function public.update_class_lesson_hours(p_class_id uuid,p_start_time time,p_end_time time,p_timezone text default 'America/Sao_Paulo')
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.classes where id=p_class_id and instructor_id=auth.uid()) then raise exception 'Somente o instrutor da turma pode alterar o horário.'; end if;
 if p_start_time is null or p_end_time is null or p_start_time>=p_end_time then raise exception 'Informe horários válidos: o término deve ser posterior ao início.'; end if;
 if p_timezone is distinct from 'America/Sao_Paulo' then raise exception 'Fuso horário não suportado nesta configuração.'; end if;
 update public.classes set lesson_start_time=p_start_time,lesson_end_time=p_end_time,lesson_timezone=p_timezone where id=p_class_id;
end $$;
revoke all on function public.update_class_lesson_hours(uuid,time,time,text) from public,anon;
grant execute on function public.update_class_lesson_hours(uuid,time,time,text) to authenticated;