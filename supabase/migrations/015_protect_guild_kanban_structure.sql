create or replace function public.update_guild_task_collaboration(
  p_task_id uuid,
  p_status text default null,
  p_responsible_user_id uuid default null,
  p_set_responsible boolean default false,
  p_evidence text default null,
  p_set_evidence boolean default false
) returns public.guild_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.guild_tasks;
  v_name text := '';
  v_old_status text;
begin
  select * into v_task from public.guild_tasks where id = p_task_id;
  if not found then raise exception 'Tarefa não encontrada.'; end if;
  if not (private.is_member_of_guild(v_task.guild_id) or private.is_instructor_of_guild(v_task.guild_id)) then raise exception 'Sem permissão para alterar esta tarefa.'; end if;
  v_old_status := v_task.status;
  if p_status is not null and p_status not in ('todo','doing','review','done') then raise exception 'Status inválido.'; end if;
  if p_set_responsible and p_responsible_user_id is not null then
    if not exists(select 1 from public.guild_members gm where gm.guild_id=v_task.guild_id and gm.user_id=p_responsible_user_id) then raise exception 'O responsável precisa pertencer à Guilda.'; end if;
    select coalesce(p.full_name,'') into v_name from public.profiles p where p.id=p_responsible_user_id;
  elsif not p_set_responsible then v_name := v_task.responsible;
  end if;
  update public.guild_tasks
  set status=coalesce(p_status,status),
      responsible_user_id=case when p_set_responsible then p_responsible_user_id else responsible_user_id end,
      responsible=case when p_set_responsible then v_name else responsible end,
      evidence=case when p_set_evidence then coalesce(p_evidence,'') else evidence end,
      history=case when p_status is not null and p_status<>v_old_status then coalesce(history,'[]'::jsonb)||jsonb_build_array(jsonb_build_object('from',v_old_status,'to',p_status,'at',now(),'responsible',case when p_set_responsible then v_name else v_task.responsible end)) else history end,
      updated_at=now()
  where id=p_task_id returning * into v_task;
  return v_task;
end $$;
revoke all on function public.update_guild_task_collaboration(uuid,text,uuid,boolean,text,boolean) from public, anon;
grant execute on function public.update_guild_task_collaboration(uuid,text,uuid,boolean,text,boolean) to authenticated;

drop policy if exists guild_tasks_insert on public.guild_tasks;
drop policy if exists guild_tasks_update on public.guild_tasks;
drop policy if exists guild_tasks_delete on public.guild_tasks;
create policy guild_tasks_insert on public.guild_tasks for insert to authenticated
with check ((private.is_guild_leader(guild_id) or private.is_instructor_of_guild(guild_id)) and created_by=(select auth.uid()));
create policy guild_tasks_update on public.guild_tasks for update to authenticated
using (private.is_guild_leader(guild_id) or private.is_instructor_of_guild(guild_id))
with check (private.is_guild_leader(guild_id) or private.is_instructor_of_guild(guild_id));
create policy guild_tasks_delete on public.guild_tasks for delete to authenticated
using ((private.is_guild_leader(guild_id) or private.is_instructor_of_guild(guild_id)) and source='manual');
