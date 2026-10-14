-- Auditoria prospectiva, somente leitura para o instrutor; nao cria historico retroativo.
create table if not exists public.guild_task_activity (
 id bigint generated always as identity primary key,
 task_id uuid not null,
 guild_id uuid not null references public.guilds(id) on delete cascade,
 actor_id uuid references public.profiles(id) on delete set null,
 action text not null check (action in ('created','status_changed','responsible_changed','evidence_changed','collaborator_added','collaborator_removed','deleted')),
 details jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now()
);
create index if not exists guild_task_activity_guild_date_idx on public.guild_task_activity(guild_id,occurred_at desc);
create index if not exists guild_task_activity_task_date_idx on public.guild_task_activity(task_id,occurred_at desc);
alter table public.guild_task_activity enable row level security;
revoke all on public.guild_task_activity from anon, authenticated;
grant select on public.guild_task_activity to authenticated;
drop policy if exists guild_task_activity_instructor_read on public.guild_task_activity;
create policy guild_task_activity_instructor_read on public.guild_task_activity for select to authenticated
using (private.is_instructor_of_guild(guild_id));

create or replace function private.audit_guild_task()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
 v_actor uuid := auth.uid();
begin
 if tg_op = 'INSERT' then
  insert into public.guild_task_activity(task_id,guild_id,actor_id,action)
  values(new.id,new.guild_id,v_actor,'created');
  return new;
 elsif tg_op = 'UPDATE' then
  if new.status is distinct from old.status then
   insert into public.guild_task_activity(task_id,guild_id,actor_id,action,details)
   values(new.id,new.guild_id,v_actor,'status_changed',jsonb_build_object('from',old.status,'to',new.status));
  end if;
  if new.responsible_user_id is distinct from old.responsible_user_id then
   insert into public.guild_task_activity(task_id,guild_id,actor_id,action,details)
   values(new.id,new.guild_id,v_actor,'responsible_changed',jsonb_build_object('from',old.responsible_user_id,'to',new.responsible_user_id));
  end if;
  if new.evidence is distinct from old.evidence then
   insert into public.guild_task_activity(task_id,guild_id,actor_id,action)
   values(new.id,new.guild_id,v_actor,'evidence_changed');
  end if;
  return new;
 elsif tg_op = 'DELETE' then
  insert into public.guild_task_activity(task_id,guild_id,actor_id,action)
  values(old.id,old.guild_id,v_actor,'deleted');
  return old;
 end if;
 return null;
end;
$$;
revoke all on function private.audit_guild_task() from public,anon,authenticated;
drop trigger if exists guild_task_activity_trigger on public.guild_tasks;
create trigger guild_task_activity_trigger after insert or update or delete on public.guild_tasks
for each row execute function private.audit_guild_task();

create or replace function private.audit_guild_task_collaborator()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
 v_task uuid := coalesce(new.task_id,old.task_id);
 v_guild uuid;
begin
 select guild_id into v_guild from public.guild_tasks where id=v_task;
 if v_guild is not null then
  insert into public.guild_task_activity(task_id,guild_id,actor_id,action,details)
  values(v_task,v_guild,auth.uid(),
   case when tg_op='INSERT' then 'collaborator_added' else 'collaborator_removed' end,
   jsonb_build_object('user_id',case when tg_op='INSERT' then new.user_id else old.user_id end));
 end if;
 if tg_op='INSERT' then return new; else return old; end if;
end;
$$;
revoke all on function private.audit_guild_task_collaborator() from public,anon,authenticated;
drop trigger if exists guild_task_collaborator_activity_trigger on public.guild_task_collaborators;
create trigger guild_task_collaborator_activity_trigger after insert or delete on public.guild_task_collaborators
for each row execute function private.audit_guild_task_collaborator();
