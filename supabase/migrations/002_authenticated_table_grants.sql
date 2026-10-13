-- Explicit Data API privileges for authenticated users.
-- RLS policies remain the authorization boundary for individual rows.

grant usage on schema public to authenticated;

grant select, insert, update on table public.profiles to authenticated;

grant select on table public.classes to authenticated;
grant select on table public.class_members to authenticated;
grant select on table public.guilds to authenticated;
grant select on table public.guild_members to authenticated;

grant select, insert, update on table public.student_states to authenticated;

-- These SECURITY DEFINER helpers are referenced by RLS policies.
-- Authenticated clients need EXECUTE so PostgreSQL can evaluate those policies.
grant execute on function public.is_class_instructor(uuid) to authenticated;
grant execute on function public.is_active_class_member(uuid) to authenticated;
grant execute on function public.is_instructor_of_student(uuid) to authenticated;
grant execute on function public.is_instructor_of_guild(uuid) to authenticated;
