-- Explicit Data API privileges for authenticated users.
-- RLS policies remain the authorization boundary for individual rows.

grant usage on schema public to authenticated;

grant select, insert, update on table public.profiles to authenticated;

grant select on table public.classes to authenticated;
grant select on table public.class_members to authenticated;
grant select on table public.guilds to authenticated;
grant select on table public.guild_members to authenticated;

grant select, insert, update on table public.student_states to authenticated;
