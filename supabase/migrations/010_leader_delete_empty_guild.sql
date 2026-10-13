-- Phase 9: allow a student leader to delete only their own empty Guild.
create or replace function public.delete_own_empty_guild(p_guild_id uuid)
returns void language plpgsql security invoker set search_path=''
as $$
declare v_uid uuid := auth.uid(); v_member_count integer; v_has_progress boolean;
begin
 if not exists (select 1 from public.guild_members where guild_id=p_guild_id and user_id=v_uid and role='leader')
 then raise exception 'Apenas o líder pode excluir a própria Guilda'; end if;
 select count(*) into v_member_count from public.guild_members where guild_id=p_guild_id;
 if v_member_count > 1 then raise exception 'Remova os demais integrantes antes de excluir a Guilda'; end if;
 select exists(select 1 from public.guild_tasks where guild_id=p_guild_id and (status <> 'todo' or coalesce(trim(responsible),'') <> '' or coalesce(trim(evidence),'') <> '')) into v_has_progress;
 if v_has_progress then raise exception 'A Guilda possui progresso salvo no Kanban e não pode ser excluída'; end if;
 delete from public.guild_tasks where guild_id=p_guild_id;
 delete from public.guild_members where guild_id=p_guild_id;
 delete from public.guilds where id=p_guild_id;
end $$;
revoke all on function public.delete_own_empty_guild(uuid) from public, anon;
grant execute on function public.delete_own_empty_guild(uuid) to authenticated;
