grant insert, update, delete on table public.class_members to authenticated;
grant insert, update, delete on table public.guilds to authenticated;
grant insert, update, delete on table public.guild_members to authenticated;

create or replace function public.auto_enroll_uc7_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target_class uuid;
begin
  if new.role = 'student' then
    select id into target_class from public.classes where code = '2026.36.8' limit 1;
    if target_class is not null then
      insert into public.class_members(class_id,user_id,status)
      values(target_class,new.id,'active')
      on conflict(class_id,user_id) do update set status='active';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_auto_enroll_uc7 on public.profiles;
create trigger profiles_auto_enroll_uc7 after insert on public.profiles
for each row execute function public.auto_enroll_uc7_student();

insert into public.class_members(class_id,user_id,status)
select c.id,p.id,'active' from public.classes c cross join public.profiles p
where c.code='2026.36.8' and p.role='student'
on conflict(class_id,user_id) do update set status='active';

revoke all on function public.auto_enroll_uc7_student() from public;
revoke all on function public.auto_enroll_uc7_student() from anon;
revoke all on function public.auto_enroll_uc7_student() from authenticated;
