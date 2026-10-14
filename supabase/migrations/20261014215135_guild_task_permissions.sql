-- Projeto Restaurante / Web Academy: permissoes granulares para tarefas das Guildas.
-- Apply locally first; validate with pgTAP before production.

create table if not exists public.guild_task_collaborators (
  task_id uuid not null references public.guild_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);
create index if not exists guild_task_collaborators_user_idx
  on public.guild_task_collaborators(user_id);
alter table public.guild_task_collaborators enable row level security;
grant select, insert, delete on public.guild_task_collaborators to authenticated;

-- Only active guild members may be task collaborators.
create or replace function private.is_active_guild_member(p_guild_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.guild_members gm
    join public.guilds g on g.id = gm.guild_id
    join public.class_members cm on cm.class_id = g.class_id and cm.user_id = gm.user_id
    where gm.guild_id = p_guild_id and gm.user_id = p_user_id and cm.status = 'active'
  );
$$;
revoke all on function private.is_active_guild_member(uuid, uuid) from public;
grant execute on function private.is_active_guild_member(uuid, uuid) to authenticated;

create or replace function private.can_manage_guild_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.guild_tasks t
    where t.id = p_task_id and (
      private.is_instructor_of_guild(t.guild_id)
      or (private.is_guild_leader(t.guild_id) and private.is_active_guild_member(t.guild_id, auth.uid()))
      or (t.created_by = auth.uid() and private.is_active_guild_member(t.guild_id, auth.uid()))
    )
  );
$$;
revoke all on function private.can_manage_guild_task(uuid) from public;
grant execute on function private.can_manage_guild_task(uuid) to authenticated;

-- Protect collaborator assignments against cross-guild insertion.
drop policy if exists guild_task_collaborators_select on public.guild_task_collaborators;
create policy guild_task_collaborators_select on public.guild_task_collaborators
for select to authenticated using (
  exists (select 1 from public.guild_tasks t where t.id = task_id
    and (private.is_instructor_of_guild(t.guild_id)
      or private.is_active_guild_member(t.guild_id, auth.uid())))
);
drop policy if exists guild_task_collaborators_insert on public.guild_task_collaborators;
create policy guild_task_collaborators_insert on public.guild_task_collaborators
for insert to authenticated with check (
  private.can_manage_guild_task(task_id)
  and exists (select 1 from public.guild_tasks t where t.id = task_id
    and private.is_active_guild_member(t.guild_id, user_id))
);
drop policy if exists guild_task_collaborators_delete on public.guild_task_collaborators;
create policy guild_task_collaborators_delete on public.guild_task_collaborators
for delete to authenticated using (private.can_manage_guild_task(task_id));

-- Keep SELECT visibility compatible with existing UI while requiring active membership.
drop policy if exists guild_tasks_select on public.guild_tasks;
create policy guild_tasks_select on public.guild_tasks for select to authenticated
using (private.is_instructor_of_guild(guild_id)
  or private.is_active_guild_member(guild_id, auth.uid()));

drop policy if exists guild_tasks_insert on public.guild_tasks;
create policy guild_tasks_insert on public.guild_tasks for insert to authenticated
with check (
  (private.is_instructor_of_guild(guild_id)
    or (private.is_guild_leader(guild_id) and private.is_active_guild_member(guild_id, auth.uid())))
  and created_by = auth.uid()
);

drop policy if exists guild_tasks_update on public.guild_tasks;
create policy guild_tasks_update on public.guild_tasks for update to authenticated
using (
  private.is_instructor_of_guild(guild_id)
  or (private.is_guild_leader(guild_id) and private.is_active_guild_member(guild_id, auth.uid()))
  or (created_by = auth.uid() and private.is_active_guild_member(guild_id, auth.uid()))
  or (responsible_user_id = auth.uid() and private.is_active_guild_member(guild_id, auth.uid()))
  or (private.is_active_guild_member(guild_id, auth.uid()) and exists (
    select 1 from public.guild_task_collaborators c
    where c.task_id = guild_tasks.id and c.user_id = auth.uid()
  ))
)
with check (
  private.is_instructor_of_guild(guild_id)
  or (private.is_guild_leader(guild_id) and private.is_active_guild_member(guild_id, auth.uid()))
  or (created_by = auth.uid() and private.is_active_guild_member(guild_id, auth.uid()))
  or (responsible_user_id = auth.uid() and private.is_active_guild_member(guild_id, auth.uid()))
  or (private.is_active_guild_member(guild_id, auth.uid()) and exists (
    select 1 from public.guild_task_collaborators c
    where c.task_id = guild_tasks.id and c.user_id = auth.uid()
  ))
);

drop policy if exists guild_tasks_delete on public.guild_tasks;
create policy guild_tasks_delete on public.guild_tasks for delete to authenticated
using (
  source = 'manual' and (
    private.is_instructor_of_guild(guild_id)
    or (private.is_guild_leader(guild_id) and private.is_active_guild_member(guild_id, auth.uid()))
    or (created_by = auth.uid() and private.is_active_guild_member(guild_id, auth.uid()))
  )
);

-- RLS is row-level; this guard restricts which columns can change.
create or replace function public.guild_tasks_update_guard()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_manager boolean;
begin
  v_manager := private.is_instructor_of_guild(old.guild_id)
    or (private.is_guild_leader(old.guild_id) and private.is_active_guild_member(old.guild_id, v_uid))
    or (old.created_by = v_uid and private.is_active_guild_member(old.guild_id, v_uid));

  -- Nobody can silently move a task between guilds, change its origin or creator.
  if new.guild_id is distinct from old.guild_id
     or new.created_by is distinct from old.created_by
     or new.source is distinct from old.source
     or new.mission_id is distinct from old.mission_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Protected task identity fields cannot be modified';
  end if;

  if not v_manager then
    -- Responsible/collaborators may only update progress and evidence.
    if new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.phase is distinct from old.phase
       or new.responsible is distinct from old.responsible
       or new.responsible_user_id is distinct from old.responsible_user_id
       or new.competencies is distinct from old.competencies then
      raise exception 'Only task managers may edit task definition or assignment';
    end if;
  end if;

  -- Assigned responsible must be an active member of this guild.
  if new.responsible_user_id is not null
     and not private.is_active_guild_member(new.guild_id, new.responsible_user_id) then
    raise exception 'Responsible user must be an active guild member';
  end if;
  return new;
end;
$$;
revoke all on function public.guild_tasks_update_guard() from public;
drop trigger if exists guild_tasks_update_guard_trigger on public.guild_tasks;
create trigger guild_tasks_update_guard_trigger
before update on public.guild_tasks for each row
execute function public.guild_tasks_update_guard();
