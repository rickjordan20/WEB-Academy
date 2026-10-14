-- Projeto Restaurante: autorizacao explicita da RPC de colaboracao.
-- Complementa migracoes ja aplicadas; executar primeiro somente no banco local.
create or replace function public.update_guild_task_collaboration(
  p_task_id uuid,
  p_status text default null,
  p_responsible_user_id uuid default null,
  p_set_responsible boolean default false,
  p_evidence text default null,
  p_set_evidence boolean default false
)
returns public.guild_tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.guild_tasks;
  v_uid uuid := auth.uid();
  v_manager boolean;
  v_contributor boolean;
  v_name text := '';
  v_old_status text;
begin
  if v_uid is null then
    raise exception 'Autenticacao obrigatoria.';
  end if;

  select * into v_task
  from public.guild_tasks
  where id = p_task_id
  for update;

  if not found then
    raise exception 'Tarefa nao encontrada.';
  end if;

  v_manager :=
    private.is_instructor_of_guild(v_task.guild_id)
    or (
      private.is_active_guild_member(v_task.guild_id, v_uid)
      and (
        private.is_guild_leader(v_task.guild_id)
        or v_task.created_by = v_uid
      )
    );

  v_contributor :=
    private.is_active_guild_member(v_task.guild_id, v_uid)
    and (
      v_task.responsible_user_id = v_uid
      or exists (
        select 1
        from public.guild_task_collaborators c
        where c.task_id = p_task_id and c.user_id = v_uid
      )
    );

  if not (v_manager or v_contributor) then
    raise exception 'Sem permissao para alterar esta tarefa.';
  end if;

  if p_set_responsible and not v_manager then
    raise exception 'Somente gestores podem alterar o responsavel.';
  end if;

  if p_status is not null and p_status not in ('todo','doing','review','done') then
    raise exception 'Status invalido.';
  end if;

  if p_set_responsible and p_responsible_user_id is not null then
    if not private.is_active_guild_member(v_task.guild_id, p_responsible_user_id) then
      raise exception 'O responsavel deve ser integrante ativo da Guilda.';
    end if;

    select coalesce(p.full_name, '') into v_name
    from public.profiles p
    where p.id = p_responsible_user_id;
  elsif not p_set_responsible then
    v_name := v_task.responsible;
  end if;

  v_old_status := v_task.status;

  update public.guild_tasks
  set status = coalesce(p_status, status),
      responsible_user_id = case when p_set_responsible then p_responsible_user_id else responsible_user_id end,
      responsible = case when p_set_responsible then v_name else responsible end,
      evidence = case when p_set_evidence then coalesce(p_evidence, '') else evidence end,
      history = case
        when p_status is not null and p_status <> v_old_status
        then coalesce(history, '[]'::jsonb) ||
             jsonb_build_array(jsonb_build_object(
               'from', v_old_status,
               'to', p_status,
               'at', now(),
               'responsible', case when p_set_responsible then v_name else v_task.responsible end
             ))
        else history
      end,
      updated_at = now()
  where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;

revoke all on function public.update_guild_task_collaboration(uuid,text,uuid,boolean,text,boolean)
  from public, anon;
grant execute on function public.update_guild_task_collaboration(uuid,text,uuid,boolean,text,boolean)
  to authenticated;
