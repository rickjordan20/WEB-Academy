alter table public.class_schedule add column if not exists mission_open_at timestamptz;
alter table public.class_schedule add column if not exists mission_close_at timestamptz;
alter table public.class_schedule drop constraint if exists class_schedule_mission_window_order;
alter table public.class_schedule add constraint class_schedule_mission_window_order check ((mission_open_at is null and mission_close_at is null) or (mission_open_at is not null and mission_close_at is not null and mission_open_at<mission_close_at));
create or replace function public.mission_access_window(p_class_id uuid,p_mission_id text)
returns table(lesson_date date,lesson_number integer,execution_mode text,opens_at timestamptz,closes_at timestamptz,server_now timestamptz,access_state text)
language sql stable security definer set search_path='' as $$
 select s.lesson_date,s.lesson_number,s.execution_mode,
 coalesce(s.mission_open_at,(s.lesson_date + coalesce(s.start_time_override,c.lesson_start_time)) at time zone coalesce(c.lesson_timezone,'America/Sao_Paulo')),
 coalesce(s.mission_close_at,(s.lesson_date + coalesce(s.end_time_override,c.lesson_end_time)) at time zone coalesce(c.lesson_timezone,'America/Sao_Paulo')),
 now(),
 case when coalesce(s.mission_open_at,(s.lesson_date + coalesce(s.start_time_override,c.lesson_start_time)) at time zone coalesce(c.lesson_timezone,'America/Sao_Paulo')) is null or coalesce(s.mission_close_at,(s.lesson_date + coalesce(s.end_time_override,c.lesson_end_time)) at time zone coalesce(c.lesson_timezone,'America/Sao_Paulo')) is null then 'unconfigured'
 when now()<coalesce(s.mission_open_at,(s.lesson_date + coalesce(s.start_time_override,c.lesson_start_time)) at time zone coalesce(c.lesson_timezone,'America/Sao_Paulo')) then 'upcoming'
 when now()>=coalesce(s.mission_close_at,(s.lesson_date + coalesce(s.end_time_override,c.lesson_end_time)) at time zone coalesce(c.lesson_timezone,'America/Sao_Paulo')) then 'closed'
 else 'open' end
 from public.class_schedule s join public.classes c on c.id=s.class_id
 where s.class_id=p_class_id and s.mission_id=p_mission_id
 and (c.instructor_id=(select auth.uid()) or exists(select 1 from public.class_members m where m.class_id=s.class_id and m.user_id=(select auth.uid()) and m.status='active'))
 limit 1;
$$;
revoke all on function public.mission_access_window(uuid,text) from public,anon;
grant execute on function public.mission_access_window(uuid,text) to authenticated;
drop policy if exists class_schedule_select on public.class_schedule;
create policy class_schedule_select on public.class_schedule for select to authenticated using (
 exists(select 1 from public.classes c where c.id=class_schedule.class_id and c.instructor_id=(select auth.uid()))
 or exists(select 1 from public.class_members m where m.class_id=class_schedule.class_id and m.user_id=(select auth.uid()) and m.status='active')
);