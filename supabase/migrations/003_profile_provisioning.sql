-- Ensure every Auth user has the public profile required by student_states FK.

insert into public.profiles (id, full_name, email, role)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), ''),
  email,
  'student'::public.app_role
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), ''),
    new.email,
    'student'::public.app_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
