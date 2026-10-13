-- Phase 9: expose only active classmates who are not assigned to any Guild.
-- SECURITY DEFINER is intentionally narrow: it returns only id/name of eligible classmates.
create or replace function public.get_available_guild_students(p_guild_id uuid default null)
returns table(id uuid, full_name text)
language sql stable security definer
set search_path=''
as $$
 select p.id,p.full_name
 from public.class_members mine
 join public.class_members cm on cm.class_id=mine.class_id and cm.status='active'
 join public.profiles p on p.id=cm.user_id
 where mine.user_id=(select auth.uid())
   and mine.status='active'
   and cm.user_id<>(select auth.uid())
   and not exists(select 1 from public.guild_members gm where gm.user_id=cm.user_id)
   and (
     p_guild_id is null
     or exists(
       select 1 from public.guild_members leader
       where leader.guild_id=p_guild_id
         and leader.user_id=(select auth.uid())
         and leader.role='leader'
     )
   )
 order by p.full_name
$$;
revoke all on function public.get_available_guild_students(uuid) from public,anon;
grant execute on function public.get_available_guild_students(uuid) to authenticated;
