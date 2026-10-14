-- Phase 9: guild membership visibility and safe leadership transfer.
-- RLS membership checks use private SECURITY DEFINER helpers to avoid recursion.
create or replace function private.is_member_of_guild(p_guild_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.guild_members gm where gm.guild_id=p_guild_id and gm.user_id=(select auth.uid())) $$;
grant execute on function private.is_member_of_guild(uuid) to authenticated;

drop policy if exists guild_members_select on public.guild_members;
create policy guild_members_select on public.guild_members for select to authenticated using(
 user_id=(select auth.uid())
 or private.is_instructor_of_guild(guild_id)
 or private.is_member_of_guild(guild_id)
);

drop function if exists public.transfer_guild_leadership(uuid,uuid);
create or replace function public.transfer_guild_leadership(p_guild_id uuid,p_new_leader uuid)
returns void language plpgsql security invoker set search_path=''
as $$
declare v_uid uuid := auth.uid();
begin
 if not exists(select 1 from public.guild_members where guild_id=p_guild_id and user_id=v_uid and role='leader')
 and not exists(select 1 from public.guilds g join public.classes c on c.id=g.class_id where g.id=p_guild_id and c.instructor_id=v_uid)
 then raise exception 'Sem permissão para transferir a liderança'; end if;
 if not exists(select 1 from public.guild_members where guild_id=p_guild_id and user_id=p_new_leader)
 then raise exception 'O novo líder deve ser integrante da Guilda'; end if;
 update public.guild_members set role='member' where guild_id=p_guild_id and role='leader';
 update public.guild_members set role='leader' where guild_id=p_guild_id and user_id=p_new_leader;
end $$;
revoke all on function public.transfer_guild_leadership(uuid,uuid) from public, anon;
grant execute on function public.transfer_guild_leadership(uuid,uuid) to authenticated;


-- Verifica liderança sem consultar diretamente guild_members sob RLS (evita recursão).
create or replace function private.is_guild_leader(p_guild_id uuid)
returns boolean language sql stable security definer set search_path=''
as $ select exists(
 select 1 from public.guild_members gm
 where gm.guild_id=p_guild_id and gm.user_id=(select auth.uid()) and gm.role='leader'
) $;
grant execute on function private.is_guild_leader(uuid) to authenticated;

-- Instructor and guild leader management policies.
drop policy if exists guild_members_insert on public.guild_members;
create policy guild_members_insert on public.guild_members for insert to authenticated with check(
 private.is_instructor_of_guild(guild_id) or private.is_guild_leader(guild_id)
 or (user_id=(select auth.uid()) and role='leader' and exists(select 1 from public.guilds g where g.id=guild_id and g.created_by=(select auth.uid())))
);
drop policy if exists guild_members_update on public.guild_members;
create policy guild_members_update on public.guild_members for update to authenticated
using(private.is_instructor_of_guild(guild_id) or private.is_guild_leader(guild_id))
with check(private.is_instructor_of_guild(guild_id) or private.is_guild_leader(guild_id));
drop policy if exists guild_members_delete on public.guild_members;
create policy guild_members_delete on public.guild_members for delete to authenticated
using(private.is_instructor_of_guild(guild_id) or private.is_guild_leader(guild_id));
drop policy if exists guilds_update on public.guilds;
create policy guilds_update on public.guilds for update to authenticated
using(private.is_instructor_of_guild(id) or private.is_guild_leader(id))
with check(private.is_instructor_of_guild(id) or private.is_guild_leader(id));
drop policy if exists guilds_delete on public.guilds;
create policy guilds_delete on public.guilds for delete to authenticated
using(private.is_instructor_of_guild(id) or private.is_guild_leader(id));
